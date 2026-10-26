import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { getSiteContent, saveSiteContent } from '../services/siteContent.js';

const r = Router();

// Public endpoint for Landing Page to fetch dynamic CMS pricing & testimonials
r.get('/public-content', (_req, res) => {
  try {
    const content = getSiteContent();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed loading public content' });
  }
});

// All routes below this require authentication AND Superadmin privileges (versalylabs@gmail.com only)
r.use(requireAuth);
r.use(requireSuperAdmin);

/**
 * GET /api/admin/analytics
 * Returns comprehensive system analytics, user counts, workspace subscription metrics, and MRR.
 */
r.get('/analytics', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrganizations,
      totalProspects,
      totalDiscoveryLeads,
      totalAiAnalyses,
      trialingOrgs,
      activeOrgs,
      pastDueOrgs,
      canceledOrgs,
      starterOrgs,
      growthOrgs,
      enterpriseOrgs,
      organizations,
      users,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.prospect.count(),
      prisma.discoveryLead.count(),
      prisma.prospect.count({ where: { aiAnalysis: { not: null } } }),
      prisma.organization.count({ where: { subscriptionStatus: 'TRIALING' } }),
      prisma.organization.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      prisma.organization.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
      prisma.organization.count({ where: { subscriptionStatus: 'CANCELED' } }),
      prisma.organization.count({ where: { plan: 'STARTER' } }),
      prisma.organization.count({ where: { plan: 'GROWTH' } }),
      prisma.organization.count({ where: { plan: 'ENTERPRISE' } }),
      prisma.organization.findMany({
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, createdAt: true },
              },
            },
          },
          _count: {
            select: { prospects: true, discoveryLeads: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          memberships: {
            include: {
              organization: {
                select: { id: true, name: true, plan: true, subscriptionStatus: true },
              },
            },
          },
          _count: {
            select: { prospects: true, discoveryLeads: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate MRR in KES based on plan tiers
    // Starter: KES 6,500 | Growth: KES 16,500 | Enterprise: KES 38,500
    const activeStarter = organizations.filter(o => o.subscriptionStatus === 'ACTIVE' && o.plan === 'STARTER').length;
    const activeGrowth = organizations.filter(o => o.subscriptionStatus === 'ACTIVE' && o.plan === 'GROWTH').length;
    const activeEnterprise = organizations.filter(o => o.subscriptionStatus === 'ACTIVE' && o.plan === 'ENTERPRISE').length;

    const mrrKes = (activeStarter * 6500) + (activeGrowth * 16500) + (activeEnterprise * 38500);

    // Projected MRR including trialing conversions
    const trialingStarter = organizations.filter(o => o.subscriptionStatus === 'TRIALING' && o.plan === 'STARTER').length;
    const trialingGrowth = organizations.filter(o => o.subscriptionStatus === 'TRIALING' && o.plan === 'GROWTH').length;
    const trialingEnterprise = organizations.filter(o => o.subscriptionStatus === 'TRIALING' && o.plan === 'ENTERPRISE').length;

    const projectedMrrKes = mrrKes + (trialingStarter * 6500) + (trialingGrowth * 16500) + (trialingEnterprise * 38500);

    const now = new Date();
    const formattedOrgs = organizations.map((org) => {
      const trialEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : null;
      const daysRemaining = trialEnds && trialEnds > now
        ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const ownerMember = org.members.find(m => m.role === 'OWNER') || org.members[0];

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        subscriptionStatus: org.subscriptionStatus,
        createdAt: org.createdAt,
        daysRemainingInTrial: daysRemaining,
        trialEndsAt: org.trialEndsAt,
        monthlyLeadQuota: org.monthlyLeadQuota,
        leadsUsedThisMonth: org.leadsUsedThisMonth,
        usagePercent: org.monthlyLeadQuota > 0
          ? Math.round((org.leadsUsedThisMonth / org.monthlyLeadQuota) * 100)
          : 0,
        memberCount: org.members.length,
        prospectsCount: org._count.prospects,
        discoveryLeadsCount: org._count.discoveryLeads,
        ownerEmail: ownerMember?.user?.email || 'N/A',
        ownerName: ownerMember?.user?.name || 'N/A',
      };
    });

    res.json({
      metrics: {
        totalUsers,
        totalOrganizations,
        totalProspects,
        totalDiscoveryLeads,
        totalAiAnalyses,
        trialingOrgs,
        activeOrgs,
        pastDueOrgs,
        canceledOrgs,
        starterOrgs,
        growthOrgs,
        enterpriseOrgs,
        mrrKes,
        projectedMrrKes,
      },
      organizations: formattedOrgs,
      users,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/workspaces/:id
 * Allows Superadmin to adjust a tenant's plan, subscription status, quotas, or extend their trial.
 */
r.patch('/workspaces/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan, subscriptionStatus, monthlyLeadQuota, extendTrialDays, resetUsage } = req.body;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const updateData = {};

    if (plan && ['STARTER', 'GROWTH', 'ENTERPRISE'].includes(String(plan).toUpperCase())) {
      updateData.plan = String(plan).toUpperCase();
    }

    if (subscriptionStatus && ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID'].includes(String(subscriptionStatus).toUpperCase())) {
      updateData.subscriptionStatus = String(subscriptionStatus).toUpperCase();
    }

    if (typeof monthlyLeadQuota === 'number' && monthlyLeadQuota > 0) {
      updateData.monthlyLeadQuota = monthlyLeadQuota;
    }

    if (resetUsage === true) {
      updateData.leadsUsedThisMonth = 0;
    }

    if (typeof extendTrialDays === 'number' && extendTrialDays > 0) {
      const baseDate = existing.trialEndsAt && new Date(existing.trialEndsAt) > new Date()
        ? new Date(existing.trialEndsAt)
        : new Date();
      updateData.trialEndsAt = new Date(baseDate.getTime() + extendTrialDays * 24 * 60 * 60 * 1000);
      updateData.subscriptionStatus = 'TRIALING';
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: `Workspace "${updated.name}" updated successfully.`,
      organization: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/content
 * Returns full dynamic site content (pricing, testimonials, global settings).
 */
r.get('/content', (_req, res) => {
  try {
    const content = getSiteContent();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed reading CMS content' });
  }
});

/**
 * PUT /api/admin/content
 * Saves updated site pricing, announcement, or full CMS structure.
 */
r.put('/content', (req, res) => {
  try {
    const updated = saveSiteContent(req.body);
    res.json({
      message: 'Website configuration updated successfully.',
      content: updated,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed saving CMS content' });
  }
});

/**
 * POST /api/admin/testimonials
 * Adds a new testimonial to the website.
 */
r.post('/testimonials', (req, res) => {
  try {
    const { name, role, company, content, result, rating, avatar, published } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and testimonial quote content are required.' });
    }

    const current = getSiteContent();
    const newTestimonial = {
      id: `t-${Date.now()}`,
      name: String(name).trim(),
      role: String(role || '').trim(),
      company: String(company || '').trim(),
      content: String(content).trim(),
      result: String(result || '').trim(),
      rating: Number(rating) || 5,
      avatar: String(avatar || name.slice(0, 2).toUpperCase()).trim(),
      published: published !== false,
    };

    const testimonials = [newTestimonial, ...(current.testimonials || [])];
    const updated = saveSiteContent({ testimonials });

    res.status(201).json({
      message: 'Testimonial added successfully.',
      testimonial: newTestimonial,
      testimonials: updated.testimonials,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed adding testimonial' });
  }
});

/**
 * PUT /api/admin/testimonials/:id
 * Updates an existing testimonial.
 */
r.put('/testimonials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = getSiteContent();
    const testimonials = current.testimonials || [];
    const index = testimonials.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    testimonials[index] = {
      ...testimonials[index],
      ...req.body,
      id, // Preserve id
    };

    const updated = saveSiteContent({ testimonials });

    res.json({
      message: 'Testimonial updated successfully.',
      testimonial: testimonials[index],
      testimonials: updated.testimonials,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed updating testimonial' });
  }
});

/**
 * DELETE /api/admin/testimonials/:id
 * Removes a testimonial.
 */
r.delete('/testimonials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = getSiteContent();
    const testimonials = (current.testimonials || []).filter(t => t.id !== id);

    const updated = saveSiteContent({ testimonials });

    res.json({
      message: 'Testimonial deleted successfully.',
      testimonials: updated.testimonials,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed deleting testimonial' });
  }
});

export default r;
