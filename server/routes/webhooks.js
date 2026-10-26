import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma.js';
import { PLANS } from './billing.js';
import { sendSubscriptionActivatedEmail, sendPaymentFailedEmail } from '../services/email.js';

const r = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 * Note: Must be mounted with express.raw({ type: 'application/json' }) before express.json()
 */
r.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Development or test mode without secret validation
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).send('Invalid payload');
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata?.organizationId;
        const planKey = (session.metadata?.plan || 'GROWTH').toUpperCase();
        const planConfig = PLANS[planKey] || PLANS.GROWTH;

        if (orgId) {
          const updatedOrg = await prisma.organization.update({
            where: { id: orgId },
            data: {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'ACTIVE',
              plan: planConfig.key,
              monthlyLeadQuota: planConfig.leadQuota,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            include: {
              members: {
                where: { role: 'OWNER' },
                include: { user: true },
              },
            },
          });
          console.log(`[Stripe Webhook] Organization ${orgId} activated on ${planKey}`);

          const owner = updatedOrg.members[0]?.user;
          if (owner?.email) {
            sendSubscriptionActivatedEmail({
              org: updatedOrg,
              ownerEmail: owner.email,
              ownerName: owner.name,
              plan: planKey,
              quota: planConfig.leadQuota,
            }).catch((err) => {
              console.error('[Webhooks] Failed to send subscription activated email:', err.message);
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (org) {
          const statusMap = {
            active: 'ACTIVE',
            trialing: 'TRIALING',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            unpaid: 'UNPAID',
          };

          const newStatus = statusMap[sub.status] || 'ACTIVE';
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: newStatus,
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
            },
          });
          console.log(`[Stripe Webhook] Subscription ${sub.id} updated -> ${newStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: 'CANCELED' },
          });
          console.log(`[Stripe Webhook] Subscription ${sub.id} marked as CANCELED`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          const org = await prisma.organization.findFirst({
            where: { stripeSubscriptionId: subId },
          });

          if (org) {
            // Reset monthly usage quota for the new billing cycle
            await prisma.organization.update({
              where: { id: org.id },
              data: {
                subscriptionStatus: 'ACTIVE',
                leadsUsedThisMonth: 0,
                quotaPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            console.log(`[Stripe Webhook] Invoice paid; reset quota for organization ${org.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          const org = await prisma.organization.findFirst({
            where: { stripeSubscriptionId: subId },
          });

          if (org) {
            const updatedOrg = await prisma.organization.update({
              where: { id: org.id },
              data: { subscriptionStatus: 'PAST_DUE' },
              include: {
                members: {
                  where: { role: 'OWNER' },
                  include: { user: true },
                },
              },
            });
            console.warn(`[Stripe Webhook] Invoice payment failed for organization ${org.id}`);

            const owner = updatedOrg.members[0]?.user;
            if (owner?.email) {
              sendPaymentFailedEmail({
                org: updatedOrg,
                ownerEmail: owner.email,
                ownerName: owner.name,
              }).catch((err) => {
                console.error('[Webhooks] Failed to send payment failed email:', err.message);
              });
            }
          }
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook Error] ${err.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default r;
