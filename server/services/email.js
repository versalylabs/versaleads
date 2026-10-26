import nodemailer from 'nodemailer';
import { prisma } from '../prisma.js';

const APP_URL = process.env.APP_URL || 'https://versaleads.vercel.app';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Versaleads <no-reply@versaleads.com>';

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Universal email layout wrapper matching Versaleads brand palette
 */
function emailLayout({ title, previewText, contentHtml, ctaText, ctaUrl }) {
  const ctaButton = ctaText && ctaUrl
    ? `
      <div style="margin: 32px 0; text-align: center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="12%" stroke="f" fillcolor="#fca311">
          <w:anchorlock/>
          <center style="color:#000000;font-family:sans-serif;font-size:15px;font-weight:bold;">${ctaText}</center>
        </v:roundrect>
        <![endif]-->
        <a href="${ctaUrl}" style="background-color: #fca311; color: #080e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(252, 163, 17, 0.35);">
          ${ctaText} &rarr;
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080e1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #e2e8f0;">
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${previewText || title}
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #080e1a; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #101c33; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(180deg, #13223f 0%, #101c33 100%); border-bottom: 1px solid #1e293b;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
                      VERSA<span style="color: #fca311;">LEADS</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-top: 3px;">
                      Autonomous B2B Pipeline Engine
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(252, 163, 17, 0.15); border: 1px solid rgba(252, 163, 17, 0.4); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #fca311; text-transform: uppercase; letter-spacing: 0.05em;">
                      Live System
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              ${contentHtml}
              ${ctaButton}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0c1424; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
              <p style="margin: 0 0 8px 0;">
                You received this transactional lifecycle notice regarding your Versaleads workspace account.
              </p>
              <p style="margin: 0;">
                &copy; ${new Date().getFullYear()} Versaleads Inc. Automated Pipeline & Lead Acceleration Systems.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Core dispatch function.
 * Attempts Resend API, SMTP, or logs to database & console.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  template,
  organizationId = null,
  metadata = null,
}) {
  const email = String(to || '').trim().toLowerCase();
  if (!email || !subject || !html) {
    console.warn('[EmailService] Skipped: missing to, subject, or html content');
    return { success: false, error: 'Missing required email fields' };
  }

  let status = 'SENT';
  let errorMsg = null;
  let provider = 'DEV_MOCK';

  try {
    if (process.env.RESEND_API_KEY) {
      provider = 'RESEND';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject,
          html,
          text: text || subject,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || 'Resend API error');
      }
      console.log(`[EmailService] Resend email sent to ${email} (template: ${template})`);
    } else if (transporter) {
      provider = 'SMTP';
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
        text: text || subject,
      });
      console.log(`[EmailService] SMTP email sent to ${email} (template: ${template})`);
    } else {
      // Development mock logging
      console.log(`\n======================================================`);
      console.log(`📧 [EmailService Mock Dispatch] To: ${email} | Subject: "${subject}"`);
      console.log(`   Template: ${template} | Org: ${organizationId || 'None'}`);
      console.log(`======================================================\n`);
    }
  } catch (err) {
    status = 'FAILED';
    errorMsg = err.message;
    console.error(`[EmailService Error] Failed to dispatch ${template} to ${email}:`, err.message);
  }

  // Persist to EmailLog for auditability and idempotency checks
  try {
    await prisma.emailLog.create({
      data: {
        email,
        template,
        subject,
        status,
        metadata: {
          provider,
          ...(metadata || {}),
          ...(errorMsg ? { error: errorMsg } : {}),
        },
        organizationId,
      },
    });
  } catch (dbErr) {
    console.error('[EmailService] Failed to record email log:', dbErr.message);
  }

  return { success: status === 'SENT', error: errorMsg };
}

/**
 * Checks if a specific template has already been dispatched to this org recently.
 */
export async function hasSentEmailRecently({ organizationId, template, withinHours = 24 }) {
  if (!organizationId) return false;
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const count = await prisma.emailLog.count({
    where: {
      organizationId,
      template,
      status: 'SENT',
      createdAt: { gte: since },
    },
  });
  return count > 0;
}

// -------------------------------------------------------------
// Transactional Lifecycle Email Templates & Dispatchers
// -------------------------------------------------------------

/**
 * 1. Welcome & 14-Day Free Trial Started
 */
export async function sendWelcomeTrialEmail({ user, org }) {
  const appUrl = APP_URL;
  const trialEnds = org.trialEndsAt
    ? new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'in 14 days';

  const html = emailLayout({
    title: `Welcome to Versaleads, ${user.name || 'there'}!`,
    previewText: `Your 14-day free trial on the ${org.plan} plan is active.`,
    contentHtml: `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Welcome to Versaleads, ${user.name || user.email.split('@')[0]}!</h2>
      <p>Your dedicated workspace <strong>${org.name}</strong> is fully provisioned and ready for pipeline generation.</p>
      
      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0" style="font-size: 14px;">
          <tr>
            <td style="color: #94a3b8; width: 140px;">Workspace:</td>
            <td style="color: #ffffff; font-weight: 600;">${org.name}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8;">Plan Tier:</td>
            <td style="color: #fca311; font-weight: 700;">${org.plan} (14-Day Trial)</td>
          </tr>
          <tr>
            <td style="color: #94a3b8;">Monthly Lead Quota:</td>
            <td style="color: #ffffff; font-weight: 600;">${(org.monthlyLeadQuota || 1500).toLocaleString()} Leads</td>
          </tr>
          <tr>
            <td style="color: #94a3b8;">Trial Expiration:</td>
            <td style="color: #ffffff; font-weight: 600;">${trialEnds}</td>
          </tr>
        </table>
      </div>

      <h3 style="color: #ffffff; font-size: 16px; margin-top: 24px;">Quick Start Checklist:</h3>
      <ol style="padding-left: 20px; color: #cbd5e1; margin-bottom: 0;">
        <li style="margin-bottom: 8px;"><strong>Discover Verified Leads:</strong> Search targeted B2B companies across Kenya and global markets.</li>
        <li style="margin-bottom: 8px;"><strong>Deep AI Research:</strong> Run autonomous web audits, finding decision makers and evidence.</li>
        <li><strong>Generate Multi-Channel Sequences:</strong> Craft high-converting cold email and LinkedIn touchpoints instantly.</li>
      </ol>
    `,
    ctaText: 'Launch Your Workspace',
    ctaUrl: `${appUrl}/dashboard`,
  });

  return sendEmail({
    to: user.email,
    subject: `Welcome to Versaleads — Your 14-Day Free Trial is Live`,
    html,
    template: 'welcome_trial',
    organizationId: org.id,
    metadata: { userId: user.id, plan: org.plan },
  });
}

/**
 * 2. Workspace Team Invitation
 */
export async function sendTeamInviteEmail({ invite, org, inviterName }) {
  const appUrl = APP_URL;
  const inviteUrl = `${appUrl}/invite/accept?token=${invite.token}`;
  const expires = new Date(invite.expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const html = emailLayout({
    title: `You've been invited to join ${org.name} on Versaleads`,
    previewText: `${inviterName || 'A teammate'} invited you to collaborate on ${org.name}.`,
    contentHtml: `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Join your team on Versaleads</h2>
      <p><strong>${inviterName || 'Your colleague'}</strong> has invited you to collaborate in the <strong>${org.name}</strong> workspace as a <strong>${invite.role}</strong>.</p>
      
      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 10px 0; color: #cbd5e1;">With Versaleads, you can collaboratively discover leads, review pipeline evidence, and run automated outreach campaigns with your team.</p>
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">This invitation link will expire on <strong>${expires}</strong>.</p>
      </div>
    `,
    ctaText: 'Accept Workspace Invitation',
    ctaUrl: inviteUrl,
  });

  return sendEmail({
    to: invite.email,
    subject: `${inviterName || 'Your team'} invited you to join ${org.name} on Versaleads`,
    html,
    template: 'team_invitation',
    organizationId: org.id,
    metadata: { inviteId: invite.id, role: invite.role },
  });
}

/**
 * 3. Quota Warning (80% Reached)
 */
export async function sendQuotaWarning80Email({ org, ownerEmail, ownerName }) {
  const appUrl = APP_URL;
  const quota = org.monthlyLeadQuota || 1500;
  const used = org.leadsUsedThisMonth || Math.round(quota * 0.8);
  const percent = Math.round((used / quota) * 100);

  const html = emailLayout({
    title: `Notice: ${org.name} has reached 80% of monthly lead quota`,
    previewText: `You have used ${used.toLocaleString()} of ${quota.toLocaleString()} leads this cycle.`,
    contentHtml: `
      <div style="display: inline-block; padding: 6px 12px; background-color: rgba(252, 163, 17, 0.2); border-left: 3px solid #fca311; border-radius: 4px; font-size: 13px; font-weight: 700; color: #fca311; margin-bottom: 16px;">
        Quota Alert &bull; 80% Capacity Reached
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Approaching monthly lead limit</h2>
      <p>Hi ${ownerName || 'there'}, your workspace <strong>${org.name}</strong> has reached <strong>${percent}%</strong> of its monthly lead qualification quota.</p>
      
      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span style="color: #94a3b8;">Usage Progress:</span>
          <strong style="color: #ffffff;">${used.toLocaleString()} / ${quota.toLocaleString()} Leads</strong>
        </div>
        <div style="width: 100%; height: 10px; background-color: #0c1424; border-radius: 9999px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background-color: #fca311; border-radius: 9999px;"></div>
        </div>
      </div>

      <p>To ensure your team's pipeline discovery continues without interruption, you can upgrade to a higher tier plan or add quota at any time.</p>
    `,
    ctaText: 'Upgrade Workspace Plan',
    ctaUrl: `${appUrl}/billing`,
  });

  return sendEmail({
    to: ownerEmail,
    subject: `Quota Alert: ${org.name} reached 80% of lead capacity`,
    html,
    template: 'quota_warning_80',
    organizationId: org.id,
    metadata: { used, quota, plan: org.plan },
  });
}

/**
 * 4. Quota Warning (100% Limit Reached)
 */
export async function sendQuotaWarning100Email({ org, ownerEmail, ownerName }) {
  const appUrl = APP_URL;
  const quota = org.monthlyLeadQuota || 1500;
  const used = org.leadsUsedThisMonth || quota;

  const html = emailLayout({
    title: `Monthly lead quota reached for ${org.name}`,
    previewText: `New lead qualification is paused until plan upgrade or next cycle.`,
    contentHtml: `
      <div style="display: inline-block; padding: 6px 12px; background-color: rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; border-radius: 4px; font-size: 13px; font-weight: 700; color: #ef4444; margin-bottom: 16px;">
        Quota Limit Reached &bull; 100% Utilized
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Lead qualification temporarily paused</h2>
      <p>Hi ${ownerName || 'there'}, your workspace <strong>${org.name}</strong> has utilized all <strong>${quota.toLocaleString()}</strong> monthly leads included in your <strong>${org.plan}</strong> plan.</p>
      
      <p>Existing prospects and outreach sequences remain fully accessible, but creating or approving new leads requires upgrading your workspace plan.</p>

      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 18px; margin: 24px 0; font-size: 14px;">
        <p style="margin: 0; color: #cbd5e1;">Upgrading to <strong>Enterprise</strong> unlocks 10,000 monthly leads, priority AI model execution, and unlimited team seats.</p>
      </div>
    `,
    ctaText: 'Upgrade Plan & Restore Access',
    ctaUrl: `${appUrl}/billing`,
  });

  return sendEmail({
    to: ownerEmail,
    subject: `Action Required: ${org.name} reached 100% of monthly lead quota`,
    html,
    template: 'quota_warning_100',
    organizationId: org.id,
    metadata: { used, quota, plan: org.plan },
  });
}

/**
 * 5. Trial Ending Warning (3 Days Remaining)
 */
export async function sendTrialExpiringEmail({ org, ownerEmail, ownerName, daysRemaining }) {
  const appUrl = APP_URL;
  const trialEnds = org.trialEndsAt
    ? new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'in 3 days';

  const html = emailLayout({
    title: `Your Versaleads trial ends in ${daysRemaining || 3} days`,
    previewText: `Keep uninterrupted access to ${org.name}'s leads and pipeline.`,
    contentHtml: `
      <div style="display: inline-block; padding: 6px 12px; background-color: rgba(252, 163, 17, 0.2); border-left: 3px solid #fca311; border-radius: 4px; font-size: 13px; font-weight: 700; color: #fca311; margin-bottom: 16px;">
        Trial Reminder &bull; ${daysRemaining || 3} Days Remaining
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Don't lose your pipeline momentum</h2>
      <p>Hi ${ownerName || 'there'}, your 14-day free trial of Versaleads for <strong>${org.name}</strong> will conclude on <strong>${trialEnds}</strong>.</p>
      
      <p>Select a subscription plan today to ensure your team keeps continuous access to lead discovery, AI research, and outreach automation.</p>

      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 18px; margin: 24px 0; font-size: 14px;">
        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1;">
          <li style="margin-bottom: 6px;">Starter: KES 6,500/mo &bull; 250 verified leads</li>
          <li style="margin-bottom: 6px;">Growth: KES 16,500/mo &bull; 1,500 leads &bull; Multi-seat team access</li>
          <li>Enterprise: KES 38,500/mo &bull; 10,000 leads &bull; Unlimited seats &bull; Priority AI</li>
        </ul>
      </div>
    `,
    ctaText: 'Choose Your Plan',
    ctaUrl: `${appUrl}/billing`,
  });

  return sendEmail({
    to: ownerEmail,
    subject: `Reminder: Your Versaleads free trial ends in ${daysRemaining || 3} days`,
    html,
    template: 'trial_expiring',
    organizationId: org.id,
    metadata: { daysRemaining, trialEndsAt: org.trialEndsAt },
  });
}

/**
 * 6. Subscription Activated Confirmation
 */
export async function sendSubscriptionActivatedEmail({ org, ownerEmail, ownerName, plan, quota }) {
  const appUrl = APP_URL;

  const html = emailLayout({
    title: `Subscription Activated: Welcome to ${plan}!`,
    previewText: `Your paid subscription for ${org.name} is now active.`,
    contentHtml: `
      <div style="display: inline-block; padding: 6px 12px; background-color: rgba(34, 197, 94, 0.2); border-left: 3px solid #22c55e; border-radius: 4px; font-size: 13px; font-weight: 700; color: #22c55e; margin-bottom: 16px;">
        Subscription Active
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Thank you for subscribing to Versaleads!</h2>
      <p>Hi ${ownerName || 'there'}, your subscription for workspace <strong>${org.name}</strong> is confirmed and active on the <strong>${plan}</strong> plan.</p>
      
      <div style="background-color: #17243d; border: 1px solid #233559; border-radius: 8px; padding: 20px; margin: 24px 0; font-size: 14px;">
        <p style="margin: 0 0 8px 0; color: #94a3b8;">Plan: <strong style="color: #ffffff;">${plan}</strong></p>
        <p style="margin: 0 0 8px 0; color: #94a3b8;">Monthly Lead Quota: <strong style="color: #fca311;">${(quota || 1500).toLocaleString()} Leads</strong></p>
        <p style="margin: 0; color: #94a3b8;">Status: <strong style="color: #22c55e;">Active & Paid</strong></p>
      </div>

      <p>You can manage your subscription, download invoices, or invite teammates from the workspace settings at any time.</p>
    `,
    ctaText: 'Go to Pipeline Dashboard',
    ctaUrl: `${appUrl}/dashboard`,
  });

  return sendEmail({
    to: ownerEmail,
    subject: `Receipt & Confirmation: ${org.name} is now on Versaleads ${plan}`,
    html,
    template: 'subscription_activated',
    organizationId: org.id,
    metadata: { plan, quota },
  });
}

/**
 * 7. Payment Failed Notice
 */
export async function sendPaymentFailedEmail({ org, ownerEmail, ownerName }) {
  const appUrl = APP_URL;

  const html = emailLayout({
    title: `Payment Failed: Action required for ${org.name}`,
    previewText: `Your latest subscription renewal was unsuccessful.`,
    contentHtml: `
      <div style="display: inline-block; padding: 6px 12px; background-color: rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; border-radius: 4px; font-size: 13px; font-weight: 700; color: #ef4444; margin-bottom: 16px;">
        Payment Unsuccessful
      </div>
      <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">Action Required: Update billing payment method</h2>
      <p>Hi ${ownerName || 'there'}, we were unable to process the renewal payment for your <strong>${org.name}</strong> workspace subscription.</p>
      
      <p>To avoid any disruption to your active outreach campaigns and lead discovery tools, please update your payment method via the customer billing portal.</p>
    `,
    ctaText: 'Update Payment Method',
    ctaUrl: `${appUrl}/billing`,
  });

  return sendEmail({
    to: ownerEmail,
    subject: `Action Required: Renewal payment failed for ${org.name}`,
    html,
    template: 'payment_failed',
    organizationId: org.id,
    metadata: { plan: org.plan },
  });
}

/**
 * Helper to check and fire quota alerts if needed
 */
export async function checkAndDispatchQuotaAlert(organizationId) {
  if (!organizationId) return;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: true },
        },
      },
    });

    if (!org) return;

    const owner = org.members[0]?.user;
    if (!owner || !owner.email) return;

    const quota = org.monthlyLeadQuota || 1500;
    const used = org.leadsUsedThisMonth || 0;
    const ratio = used / quota;

    // 100% quota reached
    if (ratio >= 1.0) {
      const alreadySent100 = await hasSentEmailRecently({
        organizationId: org.id,
        template: 'quota_warning_100',
        withinHours: 48,
      });

      if (!alreadySent100) {
        await sendQuotaWarning100Email({
          org,
          ownerEmail: owner.email,
          ownerName: owner.name,
        });
      }
    }
    // 80% quota reached
    else if (ratio >= 0.8) {
      const alreadySent80 = await hasSentEmailRecently({
        organizationId: org.id,
        template: 'quota_warning_80',
        withinHours: 72,
      });

      if (!alreadySent80) {
        await sendQuotaWarning80Email({
          org,
          ownerEmail: owner.email,
          ownerName: owner.name,
        });
      }
    }
  } catch (err) {
    console.error('[EmailService] Error checking quota alert:', err.message);
  }
}
