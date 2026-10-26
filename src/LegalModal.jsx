import React, { useState } from "react";
import { ShieldCheck, FileText, Lock, X, CheckCircle2 } from "lucide-react";

export default function LegalModal({ isOpen, onClose, initialTab = "terms" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

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
      zIndex: 11000,
      padding: "20px"
    }}>
      <div style={{
        background: "#0c1527",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        maxWidth: "760px",
        width: "100%",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        color: "#e2e8f0"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "'Glorase', serif", fontWeight: "400", color: "#ffffff" }}>
              Legal & Compliance Documentation
            </h2>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              Versaleads Master SaaS Terms, Privacy Policies & Security Standards
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: "flex",
          background: "#101c33",
          borderBottom: "1px solid #1e293b",
          padding: "0 24px"
        }}>
          <button
            onClick={() => setActiveTab("terms")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "terms" ? "2px solid #fca311" : "2px solid transparent",
              color: activeTab === "terms" ? "#fca311" : "#94a3b8",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FileText size={15} /> Terms of Service
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "privacy" ? "2px solid #fca311" : "2px solid transparent",
              color: activeTab === "privacy" ? "#fca311" : "#94a3b8",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Lock size={15} /> Privacy & Data Policy
          </button>
          <button
            onClick={() => setActiveTab("security")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "security" ? "2px solid #fca311" : "2px solid transparent",
              color: activeTab === "security" ? "#fca311" : "#94a3b8",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <ShieldCheck size={15} /> Security & Compliance
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: "24px",
          overflowY: "auto",
          fontSize: "13.5px",
          lineHeight: "1.7",
          color: "#cbd5e1"
        }}>
          {activeTab === "terms" && (
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Effective Date: October 2026 &bull; Version 2.4
              </div>
              <h3 style={{ color: "#ffffff", marginTop: 0, fontSize: "16px" }}>1. SaaS Master Subscription Agreement</h3>
              <p>
                This SaaS Master Subscription Agreement ("Agreement") governs your acquisition and use of Versaleads ("Service", "Platform") provided by Versaly Labs ("Company"). By creating an account or subscribing to any Plan Tier, you agree to be bound by these terms.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>2. Workspace Subscriptions & Recurring Billing</h3>
              <p>
                Versaleads is offered on monthly subscription tiers (Starter at $49/mo, Growth at $129/mo, and Enterprise at $299/mo). All subscriptions automatically renew at the beginning of each 30-day billing cycle unless canceled prior to renewal. Payments are processed securely via Stripe. In the event of payment failure, the workspace enters a 7-day grace period under Past Due status before access is restricted.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>3. Monthly Lead Quotas & Usage Allocations</h3>
              <p>
                Each workspace subscription grants a monthly allocation of qualified B2B leads (250 for Starter, 1,500 for Growth, 10,000 for Enterprise). Quotas reset at each monthly billing anniversary. Unused quota does not carry over to subsequent periods.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>4. Acceptable Use & Outreach Compliance</h3>
              <p>
                You agree to use Versaleads solely for legitimate commercial B2B sales development, customer acquisition, and market research. You agree to comply with all applicable communication and anti-spam legislation, including the US CAN-SPAM Act, the EU General Data Protection Regulation (GDPR), the UK Data Protection Act, and Kenya Data Protection Act 2019. Automated harassment, bulk untargeted scraping, or deceptive outreach is strictly prohibited.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>5. Cancellation & Refunds</h3>
              <p>
                You may cancel your monthly subscription at any time via the self-service Billing & Invoices portal. Cancellation takes effect at the conclusion of your current prepaid billing period. We do not provide prorated refunds for partial monthly usage.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>6. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by applicable law, Versaly Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or loss of profits, revenues, or data resulting from your use of or inability to access the Platform.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Updated: October 2026 &bull; Global & Kenya DPA Compliant
              </div>
              <h3 style={{ color: "#ffffff", marginTop: 0, fontSize: "16px" }}>1. Information We Collect</h3>
              <p>
                We collect information provided directly by you when creating a workspace, inviting teammates, or managing subscriptions: name, work email address, encrypted password hashes, and billing credentials (stored directly and securely by Stripe).
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>2. B2B Commercial Lead Intelligence</h3>
              <p>
                Versaleads crawls, extracts, and summarizes publicly available corporate information from business websites, digital footings, and open directories to provide qualification scores and multi-channel outreach pitches. We do not collect or distribute sensitive personal private data.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>3. Data Retention & Tenant Partitioning</h3>
              <p>
                All company case data, evidence trails, and prospect pipelines are partitioned logically by Organization ID. Your pipeline data is never shared across different workspaces. You may delete prospects or discovery leads at any time, which permanently removes associated evidence records.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>4. Your Rights Under GDPR & Data Protection Laws</h3>
              <p>
                Users in the European Economic Area, United Kingdom, California, and Kenya retain statutory rights to access, rectify, or request deletion of their personal information. To exercise your data rights or request full account termination, contact our privacy team at <strong>privacy@versaleads.com</strong>.
              </p>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Enterprise Security Architecture & Protection
              </div>
              <h3 style={{ color: "#ffffff", marginTop: 0, fontSize: "16px" }}>1. Multi-Tenant Logical Isolation</h3>
              <p>
                Versaleads enforces tenant isolation at both the middleware and database query level. Every read, write, update, or deletion operation is bound to the verified workspace context extracted from cryptographically signed JWT tokens.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>2. Encryption In Transit & At Rest</h3>
              <p>
                All network communication is strictly enforced over TLS 1.3 encryption. Passwords are salted and hashed using bcrypt (cost factor 12). Remote database volumes are encrypted at rest using AES-256 standard encryption.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>3. SSRF & Ingress Protection</h3>
              <p>
                The deep website research engine implements strict Server-Side Request Forgery (SSRF) filters, blocking requests to private network subnets, local loopback interfaces, and unauthorized protocols.
              </p>

              <h3 style={{ color: "#ffffff", fontSize: "16px" }}>4. Rate Limiting & Denial-of-Service Defense</h3>
              <p>
                Authentication, AI inference, and pipeline discovery endpoints are protected by automated IP and workspace-level rate limiters to defend against brute-force intrusion, credential stuffing, and volumetric denial-of-service attempts.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#0a1120"
        }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Questions? Contact <a href="mailto:support@versaleads.com" style={{ color: "#fca311", textDecoration: "none" }}>support@versaleads.com</a>
          </div>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: "8px 20px", fontSize: "13px" }}
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieBanner({ onAccept }) {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("versaleads-cookie-consent");
    } catch {
      return false;
    }
  });

  if (!visible) return null;

  const handleConsent = () => {
    try {
      localStorage.setItem("versaleads-cookie-consent", "true");
    } catch {}
    setVisible(false);
    if (onAccept) onAccept();
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      maxWidth: "420px",
      background: "#101c33",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "18px 20px",
      zIndex: 9999,
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      color: "#e2e8f0",
      fontSize: "13px",
      lineHeight: "1.5"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <ShieldCheck size={16} color="#fca311" />
        <strong style={{ color: "#ffffff", fontSize: "13.5px" }}>Privacy & Cookie Notice</strong>
      </div>
      <p style={{ margin: "0 0 14px 0", color: "#94a3b8", fontSize: "12.5px" }}>
        Versaleads uses essential cookies for workspace authentication and pipeline session state in compliance with GDPR and the Kenya Data Protection Act.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          onClick={handleConsent}
          className="btn-primary"
          style={{ padding: "6px 14px", fontSize: "12px", fontWeight: "700" }}
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}
