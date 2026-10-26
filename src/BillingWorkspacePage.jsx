import React, { useState, useEffect } from "react";
import {
  CreditCard, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  Users, UserPlus, Trash2, ExternalLink, ArrowRight, RefreshCw, X, Zap, Lock,
  Mail, Send
} from "lucide-react";

export function TrialBanner({ billingStatus, onOpenBilling }) {
  if (!billingStatus) return null;

  const { subscriptionStatus, isTrialing, trialExpired, daysRemainingInTrial, usagePercent, plan, monthlyLeadQuota, leadsUsedThisMonth } = billingStatus;

  if (trialExpired) {
    return (
      <div style={{
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        borderRadius: "10px",
        padding: "12px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        color: "#ffffff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span style={{ fontSize: "13.5px" }}>
            <strong>Your 14-day free trial has expired.</strong> Please select a subscription plan to continue adding prospects and running automated lead qualification.
          </span>
        </div>
        <button
          onClick={onOpenBilling}
          style={{
            background: "#fca311",
            color: "#14213d",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: "700",
            fontSize: "12.5px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          Select Plan <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (isTrialing) {
    return (
      <div style={{
        background: "rgba(252, 163, 17, 0.10)",
        border: "1px solid rgba(252, 163, 17, 0.35)",
        borderRadius: "10px",
        padding: "10px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        color: "#ffffff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={16} color="#fca311" />
          <span style={{ fontSize: "13px" }}>
            <strong>14-Day Free Trial Active:</strong> You have <strong>{daysRemainingInTrial} {daysRemainingInTrial === 1 ? 'day' : 'days'}</strong> remaining on the <strong>{plan}</strong> plan.
          </span>
        </div>
        <button
          onClick={onOpenBilling}
          style={{
            background: "transparent",
            color: "#fca311",
            border: "1px solid #fca311",
            borderRadius: "6px",
            padding: "6px 14px",
            fontWeight: "600",
            fontSize: "12px",
            cursor: "pointer"
          }}
        >
          Upgrade / Add Card
        </button>
      </div>
    );
  }

  if (usagePercent >= 90) {
    return (
      <div style={{
        background: "rgba(252, 163, 17, 0.15)",
        border: "1px solid rgba(252, 163, 17, 0.5)",
        borderRadius: "10px",
        padding: "10px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        color: "#ffffff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={16} color="#fca311" />
          <span style={{ fontSize: "13px" }}>
            <strong>Monthly Quota Warning:</strong> You have used <strong>{leadsUsedThisMonth} of {monthlyLeadQuota} leads ({usagePercent}%)</strong> this billing cycle.
          </span>
        </div>
        <button
          onClick={onOpenBilling}
          style={{
            background: "#fca311",
            color: "#14213d",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontWeight: "700",
            fontSize: "12px",
            cursor: "pointer"
          }}
        >
          Upgrade Quota
        </button>
      </div>
    );
  }

  return null;
}

export function PaywallModal({ isOpen, onClose, paywallError, onSelectPlan }) {
  if (!isOpen) return null;

  const isQuota = paywallError?.code === 'QUOTA_EXCEEDED';

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(8, 14, 26, 0.85)",
      backdropFilter: "blur(6px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#14213d",
        border: "1px solid #26385d",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "560px",
        width: "100%",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer"
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: isQuota ? "rgba(252, 163, 17, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${isQuota ? "#fca311" : "#ef4444"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {isQuota ? <Zap size={22} color="#fca311" /> : <Lock size={22} color="#ef4444" />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#ffffff" }}>
              {isQuota ? "Monthly Lead Quota Reached" : "Upgrade to Continue"}
            </h2>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {isQuota ? "Limit reached for current billing cycle" : "14-Day Free Trial Expired"}
            </span>
          </div>
        </div>

        <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px" }}>
          {paywallError?.message || "Please select a plan to unlock uninterrupted lead qualification, deep research, and AI outreach workflows."}
        </p>

        <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
          <div style={{
            background: "#1c2c50",
            border: "1px solid #fca311",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "15px", color: "#ffffff" }}>Growth Plan (Recommended)</strong>
                <span style={{ background: "rgba(252, 163, 17, 0.2)", color: "#fca311", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>POPULAR</span>
              </div>
              <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "4px" }}>
                1,500 qualified leads/mo · Deep website crawler · AI Sequences
              </div>
            </div>
            <button
              onClick={() => { onSelectPlan("GROWTH"); onClose(); }}
              style={{
                background: "#fca311",
                color: "#14213d",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              KES 16,500 / mo
            </button>
          </div>

          <div style={{
            background: "#1c2c50",
            border: "1px solid #26385d",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#ffffff" }}>Enterprise Plan</strong>
              <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "4px" }}>
                10,000 qualified leads/mo · Unlimited seats · Priority AI
              </div>
            </div>
            <button
              onClick={() => { onSelectPlan("ENTERPRISE"); onClose(); }}
              style={{
                background: "transparent",
                color: "#fca311",
                border: "1px solid #fca311",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              KES 38,500 / mo
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid #26385d",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Review Later
          </button>
        </div>
      </div>
    </div>
  );
}

export function AcceptInviteModal({ invite, onAccept, onDecline, loading, currentUser, onRequireAuth }) {
  if (!invite) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(8, 14, 26, 0.85)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "20px"
    }}>
      <div style={{
        background: "#101c33",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        maxWidth: "480px",
        width: "100%",
        padding: "28px",
        color: "#ffffff",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(252, 163, 17, 0.15)",
            border: "1px solid rgba(252, 163, 17, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fca311"
          }}>
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "19px", fontFamily: "'Glorase', serif", fontWeight: "400" }}>
              Join Workspace
            </h3>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              Collaborative Team Invitation
            </div>
          </div>
        </div>

        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1", margin: "0 0 20px 0" }}>
          You have been invited to join <strong>{invite.organization?.name || "a workspace"}</strong> as a <strong>{invite.role}</strong>.
        </p>

        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "14px",
          marginBottom: "24px",
          fontSize: "13px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#94a3b8" }}>Workspace:</span>
            <strong style={{ color: "#ffffff" }}>{invite.organization?.name}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#94a3b8" }}>Role:</span>
            <span style={{ color: "#fca311", fontWeight: "600" }}>{invite.role}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#94a3b8" }}>Invited Email:</span>
            <span style={{ color: "#ffffff" }}>{invite.email}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={onDecline}
            className="btn-ghost"
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Dismiss
          </button>
          {currentUser ? (
            <button
              onClick={onAccept}
              disabled={loading}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: "13px" }}
            >
              {loading ? "Joining Workspace..." : "Accept & Join Workspace"}
            </button>
          ) : (
            <button
              onClick={() => onRequireAuth && onRequireAuth(invite.email)}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: "13px" }}
            >
              Sign In to Join Workspace &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingWorkspacePage({ user, onSwitchWorkspace, apiRequest, onSelectPlan, onOpenPortal }) {
  const [billing, setBilling] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteFeedback, setInviteFeedback] = useState("");
  const [emailLogs, setEmailLogs] = useState([]);
  const [testingEmail, setTestingEmail] = useState(false);

  const refreshBilling = async () => {
    try {
      setLoading(true);
      const [billingData, teamData, emailsData] = await Promise.all([
        apiRequest("/api/billing/status"),
        apiRequest("/api/team"),
        apiRequest("/api/billing/lifecycle-emails").catch(() => ({ emails: [] }))
      ]);
      setBilling(billingData);
      setTeam(teamData);
      setEmailLogs(emailsData?.emails || []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBilling();
  }, []);

  const handleCheckout = async (planKey) => {
    try {
      setCheckoutLoading(planKey);
      const res = await apiRequest("/api/billing/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan: planKey })
      });
      if (res.url) {
        if (res.simulated) {
          alert(`Sandbox upgrade successful! Workspace is now on the ${planKey} plan.`);
          await refreshBilling();
        } else {
          window.location.href = res.url;
        }
      }
    } catch (err) {
      alert(`Could not start checkout: ${err.message}`);
    } finally {
      setCheckoutLoading("");
    }
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      const res = await apiRequest("/api/billing/create-portal-session", {
        method: "POST"
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      alert(err.message || "Customer portal is only available after setting up an active subscription with a payment method.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setInviteFeedback("");
      const res = await apiRequest("/api/team/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      setInviteFeedback(res.message || "Invitation generated!");
      setInviteEmail("");
      await refreshBilling();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      await apiRequest(`/api/team/members/${memberId}`, { method: "DELETE" });
      await refreshBilling();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px", display: "block", color: "var(--brass)" }} />
        Loading workspace subscription and billing...
      </div>
    );
  }

  const plans = [
    {
      key: "STARTER",
      name: "Starter Plan",
      price: "KES 6,500",
      period: "/ month",
      quota: "250 leads / mo",
      seats: "1 user seat",
      features: [
        "250 qualified leads quota",
        "Single workspace seat",
        "Standard website intelligence",
        "Email outreach templates",
        "Export to CSV"
      ]
    },
    {
      key: "GROWTH",
      name: "Growth Plan",
      price: "KES 16,500",
      period: "/ month",
      quota: "1,500 leads / mo",
      seats: "5 team seats",
      popular: true,
      features: [
        "1,500 qualified leads quota",
        "5 collaborative team seats",
        "Deep website research crawler",
        "AI multi-channel sequences",
        "Priority commercial signals",
        "Full CRM pipeline tracking"
      ]
    },
    {
      key: "ENTERPRISE",
      name: "Enterprise Plan",
      price: "KES 38,500",
      period: "/ month",
      quota: "10,000 leads / mo",
      seats: "Unlimited team seats",
      features: [
        "10,000 qualified leads quota",
        "Unlimited workspace seats",
        "Multi-market discovery engine",
        "Custom sequence automation",
        "Priority AI model execution",
        "Dedicated onboarding support"
      ]
    }
  ];

  return (
    <div>
      <div className="page-eyebrow">Workspace & Billing Infrastructure</div>
      <h1 className="page-title">Subscription & Team Management</h1>
      <p className="page-sub">
        Manage your workspace subscription tier, live monthly lead qualification quotas, Stripe payment methods, and collaborative team members.
      </p>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#ffffff" }}>
          {error}
        </div>
      )}

      {/* Active Workspaces Directory (Multi-Tenant Workspace Switching) */}
      {user?.workspaces && user.workspaces.length > 1 && (
        <div style={{
          background: "rgba(20, 33, 61, 0.4)",
          border: "1px solid var(--hairline)",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#ffffff" }}>
              Active Workspaces Directory
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              You belong to {user.workspaces.length} tenant workspaces. Click to switch active workspace and isolated lead records.
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {user.workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => onSwitchWorkspace && onSwitchWorkspace(ws.id)}
                style={{
                  background: ws.isCurrent ? "var(--brass)" : "var(--surface-raised)",
                  color: ws.isCurrent ? "#14213d" : "var(--text-muted)",
                  border: ws.isCurrent ? "none" : "1px solid var(--hairline)",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: ws.isCurrent ? "700" : "500",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {ws.name} ({ws.role})
                {ws.isCurrent && " · Current"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Status & Quota Card */}
      <div className="panel" style={{ marginBottom: "24px", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span className="mono-tag" style={{ background: "rgba(252, 163, 17, 0.15)", color: "var(--brass)" }}>
                WORKSPACE: {billing?.name || "Versaleads"}
              </span>
              <span className={`outreach-status ${billing?.subscriptionStatus === 'ACTIVE' ? 'outreach-status-signal' : billing?.subscriptionStatus === 'TRIALING' ? 'outreach-status-brass' : 'outreach-status-risk'}`}>
                {billing?.subscriptionStatus === 'TRIALING'
                  ? `Trial Active · ${billing?.daysRemainingInTrial} Days Left`
                  : billing?.subscriptionStatus === 'ACTIVE'
                  ? 'Active Monthly Subscription'
                  : billing?.subscriptionStatus === 'TRIAL_EXPIRED'
                  ? 'Trial Expired'
                  : 'Subscription Inactive'}
              </span>
            </div>
            <h2 style={{ fontSize: "24px", margin: "8px 0 4px", fontFamily: "'Glorase', serif", fontWeight: "400" }}>
              {billing?.planDetails?.name || `${billing?.plan} Plan`}
            </h2>
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              {billing?.planDetails?.priceDisplay || (billing?.plan === 'STARTER' ? 'KES 6,500' : billing?.plan === 'ENTERPRISE' ? 'KES 38,500' : 'KES 16,500')} / month · Automatic monthly renewal
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="btn-ghost"
              onClick={handlePortal}
              disabled={portalLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <CreditCard size={15} />
              {portalLoading ? "Opening..." : "Manage Payment & Invoices"}
            </button>
          </div>
        </div>

        {/* Usage Progress Meter */}
        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)", borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>
                Monthly Lead Qualification Quota
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "8px" }}>
                (Resets every 30 days)
              </span>
            </div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "14px", fontWeight: "600", color: billing?.usagePercent >= 90 ? "#ef4444" : "var(--brass)" }}>
              {billing?.leadsUsedThisMonth} / {billing?.monthlyLeadQuota} leads ({billing?.usagePercent}%)
            </div>
          </div>

          <div style={{ height: "10px", background: "var(--ink)", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(billing?.usagePercent || 0, 100)}%`,
                background: billing?.usagePercent >= 90 ? "#ef4444" : "var(--brass)",
                borderRadius: "999px",
                transition: "width 0.4s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--text-muted)", marginTop: "8px" }}>
            <span>Available leads remaining: <strong>{Math.max((billing?.monthlyLeadQuota || 0) - (billing?.leadsUsedThisMonth || 0), 0)}</strong></span>
            {billing?.currentPeriodEnd && (
              <span>Next cycle reset: {new Date(billing.currentPeriodEnd).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Plan Tiers Selection */}
      <h3 style={{ fontSize: "19px", margin: "32px 0 16px", fontFamily: "'Glorase', serif", fontWeight: "400" }}>
        Subscription Plans
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "40px" }}>
        {plans.map((p) => {
          const isCurrent = billing?.plan === p.key;
          const isBusy = checkoutLoading === p.key;
          return (
            <div
              key={p.key}
              style={{
                background: "var(--surface)",
                border: isCurrent ? "2px solid var(--brass)" : "1px solid var(--hairline)",
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              {p.popular && !isCurrent && (
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "20px",
                  background: "var(--brass)",
                  color: "#14213d",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em"
                }}>
                  RECOMMENDED
                </div>
              )}
              {isCurrent && (
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "20px",
                  background: "var(--signal)",
                  color: "#000000",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em"
                }}>
                  CURRENT PLAN
                </div>
              )}

              <h4 style={{ margin: "0 0 6px", fontSize: "17px", color: "#ffffff", fontFamily: "'Glorase', serif", fontWeight: "400" }}>{p.name}</h4>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", margin: "10px 0 16px" }}>
                <span style={{ fontSize: "30px", fontWeight: "400", color: "#ffffff", fontFamily: "'Glorase', serif" }}>{p.price}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{p.period}</span>
              </div>

              <div style={{ borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", padding: "12px 0", margin: "0 0 16px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brass)", fontWeight: "600" }}>
                  <Zap size={14} /> {p.quota}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginTop: "4px" }}>
                  <Users size={14} /> {p.seats}
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px", flex: 1, marginBottom: "20px" }}>
                {p.features.map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12.5px", color: "var(--text-muted)" }}>
                    <CheckCircle2 size={14} color="#fca311" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                className={isCurrent ? "btn-secondary" : "btn-primary"}
                onClick={() => !isCurrent && handleCheckout(p.key)}
                disabled={isCurrent || Boolean(checkoutLoading)}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isBusy ? "Preparing..." : isCurrent ? "Active Plan" : `Select ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Team Members Section */}
      <h3 style={{ fontSize: "19px", margin: "32px 0 16px", fontFamily: "'Glorase', serif", fontWeight: "400" }}>
        Workspace Team Members
      </h3>
      <div className="panel" style={{ padding: "24px", marginBottom: "30px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "13.5px", margin: "0 0 20px" }}>
          Team members share access to all company prospects, outreach sequences, and lead discovery searches under this organization.
        </p>

        {/* Member List */}
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          {(team?.members || []).map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--surface-raised)",
                border: "1px solid var(--hairline)",
                borderRadius: "8px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "var(--brass)"
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: "#ffffff" }}>{m.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className={`outreach-status ${m.role === 'OWNER' ? 'outreach-status-brass' : 'outreach-status-muted'}`}>
                  {m.role}
                </span>
                {team?.currentRole === 'OWNER' && m.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    className="link-btn"
                    title="Remove member"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invite Form */}
        {team?.currentRole === 'OWNER' || team?.currentRole === 'ADMIN' ? (
          <form onSubmit={handleInvite} style={{ borderTop: "1px solid var(--hairline)", paddingTop: "20px" }}>
            <h4 style={{ fontSize: "14px", margin: "0 0 12px", color: "#ffffff" }}>Invite a Colleague</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="input"
                style={{ flex: "1 1 240px", minWidth: "220px" }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="input"
                style={{ width: "130px" }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                <UserPlus size={15} /> Send Invite
              </button>
            </div>
            {inviteFeedback && (
              <div style={{ fontSize: "12.5px", color: "#22c55e", marginTop: "8px" }}>
                ✓ {inviteFeedback}
              </div>
            )}
          </form>
        ) : null}
      </div>

      {/* Lifecycle Communications & Notification Audit */}
      <div className="panel" style={{ padding: "28px", marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "19px", margin: "0 0 4px", fontFamily: "'Glorase', serif", fontWeight: "400", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="var(--brass)" /> Lifecycle Communications & Notifications
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Automated transactional notices for trial milestones, quota thresholds, and team onboarding.
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={async () => {
              try {
                setTestingEmail(true);
                const res = await apiRequest("/api/billing/check-lifecycle", { method: "POST" });
                alert(res.message || "Lifecycle check complete.");
                await refreshBilling();
              } catch (e) {
                alert(e.message || "Failed to run lifecycle check");
              } finally {
                setTestingEmail(false);
              }
            }}
            disabled={testingEmail}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
          >
            <RefreshCw size={13} className={testingEmail ? "spin" : ""} />
            {testingEmail ? "Scanning Trials..." : "Scan Trial Lifecycles"}
          </button>
        </div>

        {emailLogs.length === 0 ? (
          <div style={{
            background: "var(--surface-raised)",
            border: "1px dashed var(--hairline)",
            borderRadius: "8px",
            padding: "24px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "13px"
          }}>
            <Mail size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
            <div>No transactional emails recorded for this workspace yet.</div>
            <div style={{ fontSize: "11.5px", marginTop: "4px", color: "#64748b" }}>
              Notices are automatically logged when inviting teammates, approaching lead quotas, or completing billing milestones.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {emailLogs.map((log) => {
              const badgeColors = {
                welcome_trial: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e", label: "TRIAL WELCOME" },
                team_invitation: { bg: "rgba(252, 163, 17, 0.15)", text: "#fca311", label: "TEAM INVITE" },
                quota_warning_80: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b", label: "80% QUOTA ALERT" },
                quota_warning_100: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", label: "100% QUOTA PAUSED" },
                trial_expiring: { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316", label: "TRIAL EXPIRING" },
                subscription_activated: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", label: "SUBSCRIPTION ACTIVE" },
                payment_failed: { bg: "rgba(220, 38, 38, 0.15)", text: "#dc2626", label: "PAYMENT FAILED" },
              };
              const badge = badgeColors[log.template] || { bg: "rgba(148, 163, 184, 0.15)", text: "#94a3b8", label: log.template.toUpperCase() };

              return (
                <div
                  key={log.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "10.5px",
                      fontWeight: "700",
                      letterSpacing: "0.04em",
                      background: badge.bg,
                      color: badge.text
                    }}>
                      {badge.label}
                    </span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13.5px", color: "#ffffff" }}>
                        {log.subject}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Recipient: <strong>{log.email}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span style={{
                      color: log.status === "SENT" ? "#22c55e" : log.status === "FAILED" ? "#ef4444" : "#fca311",
                      fontWeight: "600"
                    }}>
                      ● {log.status}
                    </span>
                    <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
