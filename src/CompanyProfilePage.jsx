import React, { useState, useEffect } from "react";
import {
  Building2, Target, Sparkles, Check, CheckCircle2,
  Globe, Briefcase, Award, ArrowRight, Save, RefreshCw,
  Sliders, ShieldCheck, Compass, Info, Zap
} from "lucide-react";

export const INDUSTRY_OPTIONS = [
  {
    id: "Technology & SaaS",
    label: "Technology & B2B SaaS",
    desc: "Cloud infrastructure, software platforms, AI applications, DevOps & IT solutions",
    icon: "💻",
    defaultTargets: ["Financial & Professional Services", "Healthcare & Medical", "E-commerce & Retail"]
  },
  {
    id: "Digital & Creative Agencies",
    label: "Digital & Marketing Agencies",
    desc: "Performance marketing, SEO, creative media, outbound acquisition, web design",
    icon: "🎨",
    defaultTargets: ["Real Estate & Property", "E-commerce & Retail", "Hospitality & Tourism"]
  },
  {
    id: "Renewable Energy & Solar",
    label: "Renewable Energy & Solar",
    desc: "Commercial solar installations, microgrids, battery storage, energy efficiency",
    icon: "☀️",
    defaultTargets: ["Manufacturing & Logistics", "Hospitality & Tourism", "Healthcare & Medical"]
  },
  {
    id: "Financial & Professional Services",
    label: "Financial, Accounting & Advisory",
    desc: "Audit, corporate tax, wealth management, business valuation, insurance",
    icon: "💼",
    defaultTargets: ["Tech & SaaS", "Manufacturing & Logistics", "Real Estate & Property"]
  },
  {
    id: "Legal & Corporate Advisory",
    label: "Legal & Corporate Counsel",
    desc: "Corporate law, intellectual property, contract compliance, cross-border M&A",
    icon: "⚖️",
    defaultTargets: ["Financial & Professional Services", "Tech & SaaS", "Real Estate & Property"]
  },
  {
    id: "Real Estate & Property",
    label: "Commercial Real Estate",
    desc: "Property development, commercial brokerage, facilities management, leasing",
    icon: "🏢",
    defaultTargets: ["Financial & Professional Services", "Tech & SaaS", "Hospitality & Tourism"]
  },
  {
    id: "Healthcare & Medical",
    label: "Healthcare, Clinics & MedTech",
    desc: "Medical equipment, clinical practices, healthcare SaaS, diagnostic laboratories",
    icon: "🏥",
    defaultTargets: ["Education & Training", "Financial & Professional Services"]
  },
  {
    id: "Logistics, Freight & Supply Chain",
    label: "Logistics, Freight & Fleet",
    desc: "Warehousing, freight forwarding, cold-chain transport, route optimization",
    icon: "🚚",
    defaultTargets: ["Manufacturing & Logistics", "E-commerce & Retail", "Construction & Engineering"]
  },
  {
    id: "Manufacturing & Industrial",
    label: "Manufacturing & Industrial Goods",
    desc: "Factories, FMCG production, raw materials, heavy equipment, packaging",
    icon: "🏭",
    defaultTargets: ["Logistics, Freight & Supply Chain", "E-commerce & Retail"]
  },
  {
    id: "Hospitality & Tourism",
    label: "Hospitality, Tourism & Travel",
    desc: "Hotels, safari lodges, event venues, corporate hospitality, travel operators",
    icon: "🌴",
    defaultTargets: ["Financial & Professional Services", "Tech & SaaS"]
  },
  {
    id: "Construction & Engineering",
    label: "Construction & Civil Engineering",
    desc: "Commercial contractors, architectural design, MEP engineering, infrastructure",
    icon: "🏗️",
    defaultTargets: ["Real Estate & Property", "Manufacturing & Logistics"]
  },
  {
    id: "Education & Corporate Training",
    label: "Education & Corporate Training",
    desc: "Executive training, e-learning platforms, universities, vocational academies",
    icon: "🎓",
    defaultTargets: ["Tech & SaaS", "Financial & Professional Services"]
  },
  {
    id: "E-commerce & Retail",
    label: "E-Commerce & Consumer Brands",
    desc: "Direct-to-consumer, omnichannel retail, wholesale distribution, apparel & home",
    icon: "🛍️",
    defaultTargets: ["Digital & Creative Agencies", "Logistics, Freight & Supply Chain"]
  },
  {
    id: "Cybersecurity & IT Infrastructure",
    label: "Cybersecurity & Network Security",
    desc: "SOC monitoring, penetration testing, zero-trust infrastructure, data protection",
    icon: "🔒",
    defaultTargets: ["Financial & Professional Services", "Healthcare & Medical", "Tech & SaaS"]
  }
];

export const TARGET_INDUSTRY_POOL = [
  "Tech & SaaS",
  "Healthcare & Medical",
  "Financial & Professional Services",
  "Real Estate & Property",
  "Construction & Engineering",
  "E-commerce & Retail",
  "Hospitality & Tourism",
  "Marketing & Creative Agencies",
  "Manufacturing & Logistics",
  "Education & Training",
  "Legal & Corporate Advisory",
  "Automotive & Mobility",
  "Renewable Energy & Utilities",
  "Agriculture & Food Processing"
];

export default function CompanyProfilePage({ user, onUpdateUser, apiRequest, onGoToDiscovery }) {
  const [profile, setProfile] = useState({
    name: user?.organization?.name || "",
    industry: user?.organization?.industry || "Technology & SaaS",
    companyDescription: user?.organization?.companyDescription || "",
    targetIndustries: user?.organization?.targetIndustries || [
      "Tech & SaaS",
      "Financial & Professional Services",
      "Real Estate & Property"
    ],
    targetLocations: user?.organization?.targetLocations || "Nairobi, London, Global",
    valueProposition: user?.organization?.valueProposition || ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiRequest("/api/team/profile");
        if (res?.profile) {
          setProfile({
            name: res.profile.name || "",
            industry: res.profile.industry || "Technology & SaaS",
            companyDescription: res.profile.companyDescription || "",
            targetIndustries: res.profile.targetIndustries || [
              "Tech & SaaS",
              "Financial & Professional Services",
              "Real Estate & Property"
            ],
            targetLocations: res.profile.targetLocations || "Nairobi, London, Global",
            valueProposition: res.profile.valueProposition || ""
          });
        }
      } catch (err) {
        console.error("Failed loading company profile:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSelectIndustry = (industryId) => {
    const matched = INDUSTRY_OPTIONS.find((item) => item.id === industryId);
    setProfile((prev) => ({
      ...prev,
      industry: industryId,
      // If user hasn't heavily customized targets, auto-suggest relevant targets for this industry
      targetIndustries: matched?.defaultTargets || prev.targetIndustries
    }));
  };

  const toggleTargetIndustry = (ind) => {
    setProfile((prev) => {
      const exists = prev.targetIndustries.includes(ind);
      const next = exists
        ? prev.targetIndustries.filter((x) => x !== ind)
        : [...prev.targetIndustries, ind];
      return { ...prev, targetIndustries: next.length ? next : [ind] };
    });
  };

  const handleSelectAllTargets = () => {
    setProfile((prev) => ({ ...prev, targetIndustries: [...TARGET_INDUSTRY_POOL] }));
  };

  const handleClearTargets = () => {
    setProfile((prev) => ({ ...prev, targetIndustries: ["Tech & SaaS"] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiRequest("/api/team/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
      showToast("Company Industry & ICP Profile saved successfully!");
      if (onUpdateUser && res?.profile) {
        onUpdateUser((prevUser) => ({
          ...prevUser,
          organization: {
            ...prevUser.organization,
            name: res.profile.name,
            industry: res.profile.industry,
            companyDescription: res.profile.companyDescription,
            targetIndustries: res.profile.targetIndustries,
            targetLocations: res.profile.targetLocations,
            valueProposition: res.profile.valueProposition
          }
        }));
      }
    } catch (err) {
      showToast(err.message || "Failed saving profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeIndustryInfo = INDUSTRY_OPTIONS.find((opt) => opt.id === profile.industry) || INDUSTRY_OPTIONS[0];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          background: toast.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 197, 94, 0.95)",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "13.5px",
          fontWeight: "600",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-eyebrow">Intelligence & ICP Personalization</div>
      <h1 className="page-title">Company Profile & Target Industry</h1>
      <p className="page-sub">
        Configure the exact industry your company operates in, what you sell, and which target industries you want the AI and Discovery Bot to qualify for you.
      </p>

      {/* Trust & Intelligence Note */}
      <div style={{
        background: "rgba(252, 163, 17, 0.08)",
        border: "1px solid rgba(252, 163, 17, 0.28)",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px"
      }}>
        <Sparkles size={20} color="var(--brass)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--text-primary)" }}>
          <strong>How this powers your lead engine:</strong> The Versaleads discovery bot uses your chosen <strong>Target Industries</strong> to search for high-intent companies. When you run <strong>AI Qualification</strong>, the system positions your business as the seller, pinpointing exact commercial pain points in the prospect's operations that your core offerings resolve.
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Step 1: Your Company Details */}
        <div className="panel" style={{ padding: "28px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{
              background: "var(--brass)",
              color: "#14213d",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px"
            }}>1</span>
            <h2 style={{ fontSize: "18px", margin: 0, fontFamily: "'Glorase', serif", fontWeight: "400" }}>
              Your Business Identity & Core Offerings
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Company / Agency Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. SolarCraft Solutions, Apex Digital Agency"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Primary Operating Industry <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                className="input"
                value={profile.industry}
                onChange={(e) => handleSelectIndustry(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              What Does Your Company Sell or Provide? (Core Value Proposition)
            </label>
            <textarea
              className="input"
              rows={3}
              value={profile.companyDescription}
              onChange={(e) => setProfile({ ...profile, companyDescription: e.target.value })}
              placeholder="e.g. We provide commercial solar power installations and battery storage for safari lodges and manufacturing plants, reducing operating electricity costs by up to 65%."
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              This summary is fed directly into the AI Qualification Bot to craft tailored pitch angles and battle-tested objection responses for prospects.
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              Target Cities / Regions for Prospecting
            </label>
            <input
              className="input"
              value={profile.targetLocations}
              onChange={(e) => setProfile({ ...profile, targetLocations: e.target.value })}
              placeholder="e.g. Nairobi, Mombasa, London, Dubai, Global"
            />
          </div>
        </div>

        {/* Step 2: Industry Selector Visual Grid */}
        <div className="panel" style={{ padding: "28px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{
              background: "var(--brass)",
              color: "#14213d",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px"
            }}>2</span>
            <h2 style={{ fontSize: "18px", margin: 0, fontFamily: "'Glorase', serif", fontWeight: "400" }}>
              Choose Your Primary Industry Vertical
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 20px" }}>
            Click an industry card to select your company's vertical. This activates specialized discovery heuristics and qualification rules.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px"
          }}>
            {INDUSTRY_OPTIONS.map((opt) => {
              const isSelected = profile.industry === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectIndustry(opt.id)}
                  style={{
                    background: isSelected ? "rgba(252, 163, 17, 0.12)" : "var(--surface-raised)",
                    border: isSelected ? "2px solid var(--brass)" : "1px solid var(--hairline)",
                    borderRadius: "10px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "24px" }}>{opt.icon}</span>
                    {isSelected && (
                      <span style={{
                        background: "var(--brass)",
                        color: "#14213d",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: "14px", display: "block", color: isSelected ? "#ffffff" : "var(--text-primary)", marginBottom: "4px" }}>
                    {opt.label}
                  </strong>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: "1.45" }}>
                    {opt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Target Lead Industries (Ideal Customer Profile) */}
        <div className="panel" style={{ padding: "28px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                background: "var(--brass)",
                color: "#14213d",
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "13px"
              }}>3</span>
              <div>
                <h2 style={{ fontSize: "18px", margin: 0, fontFamily: "'Glorase', serif", fontWeight: "400" }}>
                  Target Lead Industries (Your Ideal Customer Profile)
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0" }}>
                  Which types of companies do you want Versaleads to search for and qualify as potential buyers?
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={handleSelectAllTargets}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={handleClearTargets}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Badges Grid */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
            {TARGET_INDUSTRY_POOL.map((ind) => {
              const active = profile.targetIndustries.includes(ind);
              return (
                <button
                  type="button"
                  key={ind}
                  onClick={() => toggleTargetIndustry(ind)}
                  style={{
                    background: active ? "var(--brass)" : "rgba(20, 33, 61, 0.6)",
                    color: active ? "#14213d" : "var(--text-muted)",
                    border: active ? "1px solid var(--brass)" : "1px solid var(--hairline)",
                    borderRadius: "30px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {active ? <CheckCircle2 size={15} /> : <Target size={15} />}
                  {ind}
                </button>
              );
            })}
          </div>

          <div style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginTop: "20px",
            fontSize: "13px",
            color: "var(--text-secondary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <span>
              Currently targeting <strong>{profile.targetIndustries.length} industries</strong> in discovery searches.
            </span>
            {onGoToDiscovery && (
              <button
                type="button"
                className="link-btn"
                onClick={onGoToDiscovery}
                style={{ color: "var(--brass)", fontWeight: "600" }}
              >
                Open Discovery Engine &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Live Strategic Simulation Card */}
        <div className="panel" style={{
          padding: "24px",
          marginBottom: "28px",
          background: "linear-gradient(135deg, rgba(20, 33, 61, 0.4) 0%, rgba(10, 18, 34, 0.7) 100%)",
          border: "1px solid rgba(252, 163, 17, 0.25)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--brass)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
            <Zap size={14} /> Live AI Qualification Preview
          </div>
          <h3 style={{ fontSize: "16px", margin: "0 0 10px", color: "#ffffff" }}>
            How Versaleads will evaluate leads for {profile.name || "your company"}:
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13.5px", lineHeight: "1.6", margin: 0 }}>
            "When analyzing a prospect in <strong>{profile.targetIndustries[0] || "Target Sector"}</strong>, Versaleads AI will evaluate the prospect specifically as a customer for a <strong>{profile.industry}</strong> provider. It will extract actionable operational evidence from the prospect's public footprint, highlight gaps that <em>{profile.name || "your company"}</em> solves, and generate an outreach angle featuring your value proposition: <strong>\"{profile.companyDescription ? profile.companyDescription.slice(0, 140) + '...' : 'Specialized high-ROI B2B services'}\"</strong>."
          </p>
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{
              padding: "12px 32px",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Save size={16} />
            {saving ? "Saving Company Profile..." : "Save Industry & ICP Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
