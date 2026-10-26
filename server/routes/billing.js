import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { sendTrialExpiringEmail, hasSentEmailRecently } from '../services/email.js';

const r = Router();
r.use(requireAuth);

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const PLANS = {
  STARTER: {
    key: 'STARTER',
    name: 'Starter Plan',
    priceMonthly: 6500,
    priceKes: 6500,
    currency: 'KES',
    priceDisplay: 'KES 6,500',
    leadQuota: 250,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || null,
  },
  GROWTH: {
    key: 'GROWTH',
    name: 'Growth Plan',
    priceMonthly: 16500,
    priceKes: 16500,
    currency: 'KES',
    priceDisplay: 'KES 16,500',
    leadQuota: 1500,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH || null,
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Enterprise Plan',
    priceMonthly: 38500,
    priceKes: 38500,
    currency: 'KES',
    priceDisplay: 'KES 38,500',
    leadQuota: 10000,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
  },
};

/**
 * GET /api/billing/status
 * Returns current organization subscription, quotas, and Stripe customer status.
 */
r.get('/status', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const now = new Date();
    const trialEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : null;
    const isTrialing = org.subscriptionStatus === 'TRIALING';
    const trialExpired = isTrialing && trialEnds && trialEnds < now;

    const daysRemaining = trialEnds && trialEnds > now
      ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const planConfig = PLANS[org.plan] || PLANS.GROWTH;

    res.json({
      organizationId: org.id,
      name: org.name,
      plan: org.plan,
      planDetails: planConfig,
      subscriptionStatus: trialExpired ? 'TRIAL_EXPIRED' : org.subscriptionStatus,
      isTrialing,
      trialExpired,
      trialEndsAt: org.trialEndsAt?.toISOString() || null,
      daysRemainingInTrial: daysRemaining,
      currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: org.cancelAtPeriodEnd,
      monthlyLeadQuota: org.monthlyLeadQuota,
      leadsUsedThisMonth: org.leadsUsedThisMonth,
      usagePercent: Math.min(Math.round((org.leadsUsedThisMonth / (org.monthlyLeadQuota || 1)) * 100), 100),
      hasStripeCustomer: Boolean(org.stripeCustomerId),
      stripeConfigured: Boolean(stripe),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/billing/create-checkout-session
 * Creates a Stripe Checkout Session for subscription checkout.
 */
r.post('/create-checkout-session', async (req, res, next) => {
  try {
    const planKey = String(req.body.plan || 'GROWTH').toUpperCase();
    const selectedPlan = PLANS[planKey] || PLANS.GROWTH;
    const origin = req.headers.origin || (process.env.VERCEL ? `https://${req.headers.host}` : 'http://localhost:5173');
    const successUrl = req.body.successUrl || `${origin}/?billing=success`;
    const cancelUrl = req.body.cancelUrl || `${origin}/?billing=cancel`;

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    // If Stripe is not configured (e.g. local dev without API key), simulate successful upgrade for demo testing
    if (!stripe) {
      const updated = await prisma.organization.update({
        where: { id: org.id },
        data: {
          plan: selectedPlan.key,
          subscriptionStatus: 'ACTIVE',
          monthlyLeadQuota: selectedPlan.leadQuota,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return res.json({
        url: `${successUrl}&simulated=true`,
        simulated: true,
        message: 'Stripe API key not configured; upgraded in development sandbox mode.',
        organization: updated,
      });
    }

    // Ensure Stripe customer exists
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
          userId: req.user.sub,
        },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Build line items
    const lineItems = selectedPlan.stripePriceId
      ? [{ price: selectedPlan.stripePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Versaleads ${selectedPlan.name}`,
                description: `Monthly B2B Lead Intelligence CRM subscription with ${selectedPlan.leadQuota.toLocaleString()} qualified leads quota.`,
              },
              unit_amount: selectedPlan.priceMonthly * 100,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          organizationId: org.id,
          plan: selectedPlan.key,
        },
      },
      metadata: {
        organizationId: org.id,
        plan: selectedPlan.key,
      },
    });

    res.json({ url: session.url });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/billing/create-portal-session
 * Redirects customer to Stripe's hosted Billing Portal for self-service card/invoice management.
 */
r.post('/create-portal-session', async (req, res, next) => {
  try {
    const origin = req.headers.origin || (process.env.VERCEL ? `https://${req.headers.host}` : 'http://localhost:5173');
    const returnUrl = req.body.returnUrl || `${origin}/`;

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    if (!stripe || !org.stripeCustomerId) {
      return res.status(400).json({
        error: 'Billing portal is only available after setting up a live subscription with a payment method.',
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/billing/check-lifecycle
 * Scans organizations with active trials to dispatch trial expiration notices (3 days or fewer left).
 */
r.post('/check-lifecycle', async (req, res, next) => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const expiringOrgs = await prisma.organization.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: {
          gt: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: true },
        },
      },
    });

    let sentCount = 0;

    for (const org of expiringOrgs) {
      const owner = org.members[0]?.user;
      if (!owner || !owner.email) continue;

      const alreadySent = await hasSentEmailRecently({
        organizationId: org.id,
        template: 'trial_expiring',
        withinHours: 72,
      });

      if (!alreadySent) {
        const daysRemaining = Math.max(1, Math.ceil((new Date(org.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        await sendTrialExpiringEmail({
          org,
          ownerEmail: owner.email,
          ownerName: owner.name,
          daysRemaining,
        });
        sentCount++;
      }
    }

    res.json({
      message: `Checked ${expiringOrgs.length} expiring workspace(s). Dispatched ${sentCount} trial expiring notice(s).`,
      expiringCount: expiringOrgs.length,
      sentCount,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/billing/lifecycle-emails
 * Retrieves recent lifecycle emails sent for the current workspace.
 */
r.get('/lifecycle-emails', async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({ error: 'No active workspace found.' });
    }

    const logs = await prisma.emailLog.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      emails: logs.map((l) => ({
        id: l.id,
        email: l.email,
        template: l.template,
        subject: l.subject,
        status: l.status,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default r;
