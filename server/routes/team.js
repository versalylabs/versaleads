import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendTeamInviteEmail } from '../services/email.js';

const r = Router();

/**
 * GET /api/team/invites/:token
 * Public endpoint to verify and inspect an invite token before joining.
 */
r.get('/invites/:token', async (req, res, next) => {
  try {
    const invite = await prisma.organizationInvite.findUnique({
      where: { token: req.params.token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found or invalid link.' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired. Ask your admin to send a new invite.' });
    }

    res.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
        organization: invite.organization,
      },
    });
  } catch (e) {
    next(e);
  }
});

r.use(requireAuth);

/**
 * GET /api/team
 * Returns the organization info, current members, and active invites.
 */
r.get('/', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, createdAt: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        invites: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    res.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        subscriptionStatus: org.subscriptionStatus,
        monthlyLeadQuota: org.monthlyLeadQuota,
        leadsUsedThisMonth: org.leadsUsedThisMonth,
      },
      currentRole: req.user.orgRole || 'MEMBER',
      members: org.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name || m.user.email.split('@')[0],
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
      invites: org.invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/team/profile
 * Returns the company industry profile & target ICP for the current workspace.
 */
r.get('/profile', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: {
        id: true,
        name: true,
        industry: true,
        companyDescription: true,
        targetIndustries: true,
        targetLocations: true,
        valueProposition: true,
      },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    let targetIndustries = ['Tech & SaaS', 'Financial & Professional Services', 'Real Estate & Property'];
    if (org.targetIndustries) {
      try {
        targetIndustries = typeof org.targetIndustries === 'string' && org.targetIndustries.startsWith('[')
          ? JSON.parse(org.targetIndustries)
          : org.targetIndustries.split(',').map((s) => s.trim());
      } catch {}
    }

    res.json({
      profile: {
        ...org,
        targetIndustries,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * PUT /api/team/profile
 * Updates the company industry profile & target ICP for the current workspace.
 */
r.put('/profile', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }

    const { name, industry, companyDescription, targetIndustries, targetLocations, valueProposition } = req.body;
    const targetIndustriesStr = Array.isArray(targetIndustries)
      ? JSON.stringify(targetIndustries)
      : typeof targetIndustries === 'string'
      ? targetIndustries
      : null;

    const updated = await prisma.organization.update({
      where: { id: req.user.organizationId },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        industry: industry ? String(industry).trim() : 'Technology & SaaS',
        companyDescription: companyDescription !== undefined ? String(companyDescription || '').trim() : undefined,
        targetIndustries: targetIndustriesStr,
        targetLocations: targetLocations ? String(targetLocations).trim() : 'Nairobi, London, Global',
        valueProposition: valueProposition !== undefined ? String(valueProposition || '').trim() : undefined,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        companyDescription: true,
        targetIndustries: true,
        targetLocations: true,
        valueProposition: true,
      },
    });

    let parsedTargets = ['Tech & SaaS', 'Financial & Professional Services', 'Real Estate & Property'];
    if (updated.targetIndustries) {
      try {
        parsedTargets = typeof updated.targetIndustries === 'string' && updated.targetIndustries.startsWith('[')
          ? JSON.parse(updated.targetIndustries)
          : updated.targetIndustries.split(',').map((s) => s.trim());
      } catch {}
    }

    res.json({
      message: 'Company industry profile updated successfully.',
      profile: {
        ...updated,
        targetIndustries: parsedTargets,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/team/invite
 * Invite a colleague to the organization by email.
 */
r.post('/invite', async (req, res, next) => {
  try {
    if (!['OWNER', 'ADMIN'].includes(req.user.orgRole)) {
      return res.status(403).json({ error: 'Only workspace owners or admins can invite new members.' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const role = ['OWNER', 'ADMIN', 'MEMBER'].includes(String(req.body.role || '').toUpperCase())
      ? String(req.body.role).toUpperCase()
      : 'MEMBER';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: req.user.organizationId,
        user: { email },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: 'This user is already a member of your workspace.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    });

    const invite = await prisma.organizationInvite.upsert({
      where: {
        organizationId_email: {
          organizationId: req.user.organizationId,
          email,
        },
      },
      create: {
        organizationId: req.user.organizationId,
        email,
        role,
        token,
        expiresAt,
      },
      update: {
        role,
        token,
        expiresAt,
      },
    });

    // Send transactional invitation email asynchronously
    if (org) {
      sendTeamInviteEmail({
        invite,
        org,
        inviterName: req.user.name || req.user.email.split('@')[0],
      }).catch((err) => {
        console.error('[Team] Failed to dispatch team invite email:', err.message);
      });
    }

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/team/accept-invite
 * Accept an invite token and join the organization.
 */
r.post('/accept-invite', async (req, res, next) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Invite token is required.' });
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation link.' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired.' });
    }

    // Add user as member of the organization
    const membership = await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: req.user.sub,
          organizationId: invite.organizationId,
        },
      },
      create: {
        userId: req.user.sub,
        organizationId: invite.organizationId,
        role: invite.role,
      },
      update: {
        role: invite.role,
      },
    });

    // Delete the consumed invite
    await prisma.organizationInvite.delete({
      where: { id: invite.id },
    }).catch(() => {});

    res.json({
      message: `Successfully joined ${invite.organization.name}`,
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
        role: membership.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/team/emails
 * Returns recent transactional lifecycle emails sent for this organization.
 */
r.get('/emails', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    res.json(logs.map((l) => ({
      id: l.id,
      email: l.email,
      template: l.template,
      subject: l.subject,
      status: l.status,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/team/members/:id
 * Remove a member from the organization.
 */
r.delete('/members/:id', async (req, res, next) => {
  try {
    if (req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only the workspace owner can remove members.' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { id: req.params.id },
    });

    if (!member || member.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (member.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove the workspace owner.' });
    }

    await prisma.organizationMember.delete({
      where: { id: member.id },
    });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default r;
