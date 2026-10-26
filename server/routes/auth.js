import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendWelcomeTrialEmail } from '../services/email.js';

const r = Router();

const sign = (user, orgId, orgRole) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: orgId || null,
      orgRole: orgRole || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

async function getUserWithOrg(userId, preferredOrgId = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!user) return null;

  let primaryMembership = preferredOrgId
    ? user.memberships.find(m => m.organizationId === preferredOrgId)
    : user.memberships[0];

  if (!primaryMembership && user.memberships.length > 0) {
    primaryMembership = user.memberships[0];
  }

  // Self-heal: If an existing user has no organization yet, create one now.
  if (!primaryMembership) {
    const orgName = user.name ? `${user.name}'s Workspace` : `${user.email.split('@')[0]} Workspace`;
    const slug = `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const newOrg = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        plan: 'GROWTH',
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
        monthlyLeadQuota: 1500,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    primaryMembership = {
      role: 'OWNER',
      organization: newOrg,
      organizationId: newOrg.id,
    };
  }

  const org = primaryMembership.organization;
  const now = new Date();
  const trialEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : null;
  const daysRemainingInTrial = trialEnds && trialEnds > now
    ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: String(user.email || '').toLowerCase() === 'versalylabs@gmail.com',
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt?.toISOString() || null,
      daysRemainingInTrial,
      currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
      monthlyLeadQuota: org.monthlyLeadQuota,
      leadsUsedThisMonth: org.leadsUsedThisMonth,
      role: primaryMembership.role,
      industry: org.industry || 'Technology & SaaS',
      companyDescription: org.companyDescription || '',
      targetIndustries: org.targetIndustries
        ? (typeof org.targetIndustries === 'string' && org.targetIndustries.startsWith('[')
            ? JSON.parse(org.targetIndustries)
            : org.targetIndustries.split(',').map((s) => s.trim()))
        : ['Tech & SaaS', 'Financial & Professional Services', 'Real Estate & Property'],
      targetLocations: org.targetLocations || 'Nairobi, London, Global',
      valueProposition: org.valueProposition || '',
    },
    workspaces: user.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      plan: m.organization.plan,
      subscriptionStatus: m.organization.subscriptionStatus,
      role: m.role,
      industry: m.organization.industry || 'Technology & SaaS',
      isCurrent: m.organizationId === org.id,
    })),
  };
}

r.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim() || null;
    const requestedPlan = ['STARTER', 'GROWTH', 'ENTERPRISE'].includes(String(req.body.plan || '').toUpperCase())
      ? String(req.body.plan).toUpperCase()
      : 'GROWTH';

    const quotaMap = { STARTER: 250, GROWTH: 1500, ENTERPRISE: 10000 };

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return res.status(400).json({ error: 'Enter a valid email and a password with at least 8 characters.' });
    }

    const orgName = name ? `${name}'s Workspace` : `${email.split('@')[0]} Workspace`;
    const slug = `${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: await bcrypt.hash(password, 12),
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          plan: requestedPlan,
          subscriptionStatus: 'TRIALING',
          trialEndsAt,
          monthlyLeadQuota: quotaMap[requestedPlan] || 1500,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      return { user, org };
    });

    const token = sign(result.user, result.org.id, 'OWNER');
    const userData = await getUserWithOrg(result.user.id);

    // Fire welcome & 14-day trial lifecycle email asynchronously
    sendWelcomeTrialEmail({ user: result.user, org: result.org }).catch((err) => {
      console.error('[Auth] Failed to send welcome trial email:', err.message);
    });

    res.status(201).json({ token, user: userData });
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    }
    next(e);
  }
});

r.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { organization: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userData = await getUserWithOrg(user.id);
    const orgId = userData?.organization?.id || null;
    const orgRole = userData?.organization?.role || null;

    res.json({ token: sign(user, orgId, orgRole), user: userData });
  } catch (e) {
    next(e);
  }
});

r.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userData = await getUserWithOrg(req.user.sub, req.user.orgId);
    if (!userData) return res.status(401).json({ error: 'User not found' });
    res.json({ user: userData });
  } catch (e) {
    next(e);
  }
});

r.post('/switch-workspace', requireAuth, async (req, res, next) => {
  try {
    const organizationId = String(req.body.organizationId || '').trim();
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.sub,
          organizationId,
        },
      },
      include: { organization: true },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You do not have access to this workspace.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    const token = sign(user, membership.organizationId, membership.role);
    const userData = await getUserWithOrg(user.id, membership.organizationId);

    res.json({ token, user: userData });
  } catch (e) {
    next(e);
  }
});

export default r;
