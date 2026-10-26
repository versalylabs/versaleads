import { prisma } from '../prisma.js';

/**
 * Ensures the organization has an active subscription or valid trial.
 * Also performs automatic monthly quota reset if a new 30-day billing cycle has begun.
 */
export async function requireActiveSubscription(req, res, next) {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(403).json({
        error: 'No active workspace found',
        code: 'NO_WORKSPACE',
        message: 'Please select or create a workspace to proceed.',
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    });

    if (!org) {
      return res.status(404).json({
        error: 'Workspace organization not found',
        code: 'WORKSPACE_NOT_FOUND',
      });
    }

    const now = new Date();

    // Self-healing: Check if 30 days have passed since quotaPeriodStart and reset monthly usage
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const periodStart = org.quotaPeriodStart ? new Date(org.quotaPeriodStart) : new Date(org.createdAt);
    if (now.getTime() - periodStart.getTime() > thirtyDays) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          leadsUsedThisMonth: 0,
          quotaPeriodStart: now,
        },
      });
      org.leadsUsedThisMonth = 0;
      org.quotaPeriodStart = now;
    }

    // Attach up-to-date org object to req for downstream usage
    req.organization = org;

    // Check subscription status
    if (org.subscriptionStatus === 'ACTIVE') {
      return next();
    }

    if (org.subscriptionStatus === 'TRIALING') {
      if (org.trialEndsAt && new Date(org.trialEndsAt) > now) {
        return next();
      }

      // Trial has expired
      return res.status(402).json({
        error: 'Trial expired',
        code: 'TRIAL_EXPIRED',
        message: 'Your 14-day free trial has expired. Upgrade to a paid plan to continue qualifying leads.',
        plan: org.plan,
        trialEndsAt: org.trialEndsAt?.toISOString() || null,
      });
    }

    if (org.subscriptionStatus === 'PAST_DUE') {
      return res.status(402).json({
        error: 'Payment past due',
        code: 'PAYMENT_PAST_DUE',
        message: 'Your latest subscription renewal failed. Please update your payment method in the Billing portal to restore access.',
      });
    }

    // CANCELED, UNPAID, or other inactive states
    return res.status(402).json({
      error: 'Subscription inactive',
      code: 'SUBSCRIPTION_INACTIVE',
      message: 'Your subscription is currently inactive or canceled. Please select a plan to reactivate your workspace.',
      status: org.subscriptionStatus,
      plan: org.plan,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Checks if the organization has remaining lead qualification quota for the current billing cycle.
 */
export async function checkLeadQuota(req, res, next) {
  try {
    const org = req.organization || (await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    }));

    if (!org) {
      return res.status(404).json({ error: 'Workspace organization not found', code: 'WORKSPACE_NOT_FOUND' });
    }

    const quota = org.monthlyLeadQuota || 250;
    const used = org.leadsUsedThisMonth || 0;

    if (used >= quota) {
      return res.status(403).json({
        error: 'Monthly lead quota reached',
        code: 'QUOTA_EXCEEDED',
        message: `You have reached your monthly quota of ${quota.toLocaleString()} qualified leads for the ${org.plan} plan. Upgrade your plan to qualify more prospects.`,
        plan: org.plan,
        quota,
        used,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Gates specific advanced features by minimum required plan tier (STARTER, GROWTH, ENTERPRISE).
 */
export function requirePlan(minimumTier = 'GROWTH') {
  const tierRanks = {
    STARTER: 1,
    GROWTH: 2,
    ENTERPRISE: 3,
  };

  return async (req, res, next) => {
    try {
      const org = req.organization || (await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
      }));

      if (!org) {
        return res.status(404).json({ error: 'Workspace not found', code: 'WORKSPACE_NOT_FOUND' });
      }

      const currentRank = tierRanks[org.plan] || 1;
      const requiredRank = tierRanks[minimumTier] || 2;

      if (currentRank < requiredRank) {
        return res.status(403).json({
          error: 'Plan upgrade required',
          code: 'PLAN_UPGRADE_REQUIRED',
          message: `This feature is available on the ${minimumTier} plan or higher. Your workspace is currently on the ${org.plan} plan.`,
          currentPlan: org.plan,
          requiredPlan: minimumTier,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
