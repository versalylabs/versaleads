import React, { useState, useEffect } from "react";
import {
  ShieldAlert, Users, CreditCard, Building2, TrendingUp, Sparkles,
  Search, CheckCircle2, AlertTriangle, RefreshCw, Edit3, Trash2,
  Plus, Check, X, Star, DollarSign, Database, Sliders, ArrowUpRight,
  ChevronRight, Lock, Eye, EyeOff
} from "lucide-react";

export default function AdminPlatformPage({ user, onGoToApp, apiRequest }) {
  const isSuperAdmin = user?.email?.toLowerCase() === "versalylabs@gmail.com";

  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [cmsContent, setCmsContent] = useState(null);
  const [searchWorkspace, setSearchWorkspace] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  // Modal states
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editQuota, setEditQuota] = useState(1500);
  const [extendDays, setExtendDays] = useState(0);
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  // Pricing CMS editing state
  const [pricingDraft, setPricingDraft] = useState(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Testimonials CMS editing state
  const [testimonialsDraft, setTestimonialsDraft] = useState([]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [isNewTestimonial, setIsNewTestimonial] = useState(false);
  const [testForm, setTestForm] = useState({
    name: "",
    role: "",
    company: "",
    result: "",
    content: "",
    rating: 5,
    avatar: "",
    published: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdminData = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const [analyticsRes, contentRes] = await Promise.all([
        apiRequest("/api/admin/analytics"),
        apiRequest("/api/admin/content"),
      ]);

      setData(analyticsRes);
      setCmsContent(contentRes);
      setPricingDraft(contentRes?.pricing || null);
      setTestimonialsDraft(contentRes?.testimonials || []);
    } catch (err) {
      showToast(err.message || "Failed to load admin analytics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px"
      }}>
        <div style={{
          maxWidth: "520px",
          background: "linear-gradient(135deg, rgba(20, 33, 61, 0.7) 0%, rgba(10, 18, 34, 0.85) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "16px",
          padding: "36px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#ef4444"
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontFamily: "'Glorase', serif", fontSize: "24px", color: "#ffffff", margin: "0 0 10px" }}>
            Restricted Admin Platform
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            This platform telemetry and CMS terminal is strictly restricted to <strong>versalylabs@gmail.com</strong>.
            Unauthorized access attempts are logged and rejected by tenant security middleware.
          </p>
          <button className="btn-primary" onClick={onGoToApp} style={{ padding: "10px 24px" }}>
            Return to CRM Workspace
          </button>
        </div>
      </div>
    );
  }

  // Handle Workspace Update
  const handleOpenWorkspaceModal = (org) => {
    setSelectedOrg(org);
    setEditPlan(org.plan);
    setEditStatus(org.subscriptionStatus);
    setEditQuota(org.monthlyLeadQuota);
    setExtendDays(0);
  };

  const handleSaveWorkspace = async () => {
    if (!selectedOrg) return;
    try {
      setIsUpdatingOrg(true);
      await apiRequest(`/api/admin/workspaces/${selectedOrg.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          plan: editPlan,
          subscriptionStatus: editStatus,
          monthlyLeadQuota: Number(editQuota),
          extendTrialDays: Number(extendDays) > 0 ? Number(extendDays) : undefined,
        }),
      });
      showToast(`Updated workspace "${selectedOrg.name}" successfully.`);
      setSelectedOrg(null);
      await fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed updating workspace.", "error");
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  // Handle Pricing CMS Save
  const handleSavePricing = async () => {
    try {
      setIsSavingPricing(true);
      await apiRequest("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({
          ...cmsContent,
          pricing: pricingDraft,
        }),
      });
      showToast("Website pricing successfully updated and published live!");
      await fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed saving website pricing.", "error");
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Handle Testimonials CRUD
  const handleOpenNewTestimonial = () => {
    setTestForm({
      name: "",
      role: "",
      company: "",
      result: "",
      content: "",
      rating: 5,
      avatar: "",
      published: true,
    });
    setIsNewTestimonial(true);
    setEditingTestimonial(null);
  };

  const handleEditTestimonial = (item) => {
    setTestForm({ ...item });
    setEditingTestimonial(item.id);
    setIsNewTestimonial(false);
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    try {
      if (isNewTestimonial) {
        await apiRequest("/api/admin/testimonials", {
          method: "POST",
          body: JSON.stringify(testForm),
        });
        showToast("New testimonial published to website.");
      } else {
        await apiRequest(`/api/admin/testimonials/${editingTestimonial}`, {
          method: "PUT",
          body: JSON.stringify(testForm),
        });
        showToast("Testimonial updated.");
      }
      setIsNewTestimonial(false);
      setEditingTestimonial(null);
      await fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed saving testimonial.", "error");
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await apiRequest(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      showToast("Testimonial removed from website.");
      await fetchAdminData();
    } catch (err) {
      showToast(err.message || "Failed deleting testimonial.", "error");
    }
  };

  const filteredOrgs = (data?.organizations || []).filter((org) => {
    const matchesSearch =
      org.name?.toLowerCase().includes(searchWorkspace.toLowerCase()) ||
      org.ownerEmail?.toLowerCase().includes(searchWorkspace.toLowerCase()) ||
      org.slug?.toLowerCase().includes(searchWorkspace.toLowerCase());

    const matchesPlan = planFilter === "ALL" || org.plan === planFilter;
    const matchesStatus = statusFilter === "ALL" || org.subscriptionStatus === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div style={{ padding: "32px 40px 100px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Toast Alert */}
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

      {/* Superadmin Top Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px",
        borderBottom: "1px solid var(--hairline)",
        paddingBottom: "22px"
      }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(252, 163, 17, 0.12)",
            border: "1px solid rgba(252, 163, 17, 0.4)",
            borderRadius: "40px",
            padding: "4px 12px",
            color: "var(--brass)",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "8px"
          }}>
            <ShieldAlert size={14} /> SUPERADMIN CONSOLE · VERSALYLABS@GMAIL.COM
          </div>
          <h1 style={{ fontFamily: "'Glorase', serif", fontSize: "32px", margin: 0, color: "#ffffff", fontWeight: 400 }}>
            Executive Platform & CMS Terminal
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
            Real-time subscriber telemetry, revenue metrics, tenant quota controls, and dynamic landing page management.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-ghost"
            onClick={fetchAdminData}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn-primary"
            onClick={onGoToApp}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            CRM Workspace <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "28px",
        borderBottom: "1px solid var(--hairline)",
        paddingBottom: "12px",
        overflowX: "auto"
      }}>
        {[
          { key: "analytics", label: "Executive Analytics & MRR", icon: TrendingUp },
          { key: "workspaces", label: `Workspaces & Subscribers (${data?.organizations?.length || 0})`, icon: Building2 },
          { key: "pricing", label: "Website Pricing Manager", icon: DollarSign },
          { key: "testimonials", label: `Testimonials CMS (${testimonialsDraft?.length || 0})`, icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "8px",
                background: isActive ? "var(--brass)" : "transparent",
                color: isActive ? "#14213d" : "var(--text-muted)",
                fontWeight: isActive ? "700" : "500",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === "analytics" && (
        <div>
          {/* Top KPI Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px"
          }}>
            {/* Total Users */}
            <div className="stat-card" style={{
              background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.7) 100%)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Total Users</span>
                <Users size={16} color="var(--brass)" />
              </div>
              <div style={{ fontSize: "34px", fontWeight: "700", color: "#ffffff", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                {data?.metrics?.totalUsers || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--signal)" }}>
                Active platform accounts
              </div>
            </div>

            {/* Total Workspaces */}
            <div className="stat-card" style={{
              background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.7) 100%)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Workspaces</span>
                <Building2 size={16} color="var(--brass)" />
              </div>
              <div style={{ fontSize: "34px", fontWeight: "700", color: "#ffffff", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                {data?.metrics?.totalOrganizations || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Isolated multi-tenant teams
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="stat-card" style={{
              background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.7) 100%)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "14px",
              padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Paid Active</span>
                <CreditCard size={16} color="var(--signal)" />
              </div>
              <div style={{ fontSize: "34px", fontWeight: "700", color: "var(--signal)", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                {data?.metrics?.activeOrgs || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {data?.metrics?.trialingOrgs || 0} currently on 14-day trial
              </div>
            </div>

            {/* Monthly Recurring Revenue */}
            <div className="stat-card" style={{
              background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.7) 100%)",
              backdropFilter: "blur(18px)",
              border: "1.5px solid var(--brass)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 0 25px rgba(252, 163, 17, 0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--brass)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>
                <span>Live Monthly MRR</span>
                <TrendingUp size={16} color="var(--brass)" />
              </div>
              <div style={{ fontSize: "30px", fontWeight: "700", color: "#ffffff", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                KES {(data?.metrics?.mrrKes || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Projected: KES {(data?.metrics?.projectedMrrKes || 0).toLocaleString()}
              </div>
            </div>

            {/* Prospects Qualified */}
            <div className="stat-card" style={{
              background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.7) 100%)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Prospects Qualified</span>
                <Sparkles size={16} color="var(--brass)" />
              </div>
              <div style={{ fontSize: "34px", fontWeight: "700", color: "#ffffff", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                {data?.metrics?.totalProspects || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {data?.metrics?.totalAiAnalyses || 0} deep AI gap evaluations
              </div>
            </div>
          </div>

          {/* Subscriptions Tier Breakdown */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "20px",
            marginBottom: "32px"
          }}>
            {/* By Plan Tier */}
            <div className="panel" style={{ padding: "24px", borderRadius: "14px" }}>
              <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "19px", margin: "0 0 16px", color: "#ffffff" }}>
                Distribution by Subscription Tier
              </h3>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span><strong>Starter Plan (KES 6,500/mo)</strong></span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{data?.metrics?.starterOrgs || 0} workspaces</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${data?.metrics?.totalOrganizations ? ((data.metrics.starterOrgs / data.metrics.totalOrganizations) * 100) : 0}%`,
                      background: "#7ea6d8",
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span><strong>Growth Plan (KES 16,500/mo)</strong></span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{data?.metrics?.growthOrgs || 0} workspaces</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${data?.metrics?.totalOrganizations ? ((data.metrics.growthOrgs / data.metrics.totalOrganizations) * 100) : 0}%`,
                      background: "var(--brass)",
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                    <span><strong>Enterprise / Scale Plan (KES 38,500/mo)</strong></span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{data?.metrics?.enterpriseOrgs || 0} workspaces</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${data?.metrics?.totalOrganizations ? ((data.metrics.enterpriseOrgs / data.metrics.totalOrganizations) * 100) : 0}%`,
                      background: "var(--signal)",
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Lifecycle Status */}
            <div className="panel" style={{ padding: "24px", borderRadius: "14px" }}>
              <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "19px", margin: "0 0 16px", color: "#ffffff" }}>
                Subscriber Lifecycle Health
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ padding: "14px", background: "rgba(252, 163, 17, 0.08)", border: "1px solid rgba(252, 163, 17, 0.3)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--brass)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>Trialing Workspaces</div>
                  <div style={{ fontSize: "26px", fontWeight: "700", color: "#ffffff", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {data?.metrics?.trialingOrgs || 0}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>14-day free trial active</div>
                </div>

                <div style={{ padding: "14px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--signal)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>Active Paid</div>
                  <div style={{ fontSize: "26px", fontWeight: "700", color: "#ffffff", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {data?.metrics?.activeOrgs || 0}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>Active Stripe / manual renewal</div>
                </div>

                <div style={{ padding: "14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>Past Due / Unpaid</div>
                  <div style={{ fontSize: "26px", fontWeight: "700", color: "#ffffff", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {data?.metrics?.pastDueOrgs || 0}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>Card failed / grace period</div>
                </div>

                <div style={{ padding: "14px", background: "rgba(148, 163, 184, 0.08)", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>Canceled</div>
                  <div style={{ fontSize: "26px", fontWeight: "700", color: "#ffffff", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {data?.metrics?.canceledOrgs || 0}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>Terminated subscriptions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACES & SUBSCRIBERS DIRECTORY */}
      {activeTab === "workspaces" && (
        <div>
          {/* Filter Toolbar */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px"
          }}>
            <div className="search-box" style={{ maxWidth: "360px" }}>
              <Search size={15} />
              <input
                placeholder="Search workspace, slug, or owner..."
                value={searchWorkspace}
                onChange={(e) => setSearchWorkspace(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                className="select"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="ALL">All Tiers</option>
                <option value="STARTER">Starter Plan</option>
                <option value="GROWTH">Growth Plan</option>
                <option value="ENTERPRISE">Enterprise Plan</option>
              </select>

              <select
                className="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="TRIALING">Trialing</option>
                <option value="ACTIVE">Active Paid</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Workspace & Owner</th>
                  <th>Plan Tier</th>
                  <th>Status</th>
                  <th>Monthly Quota</th>
                  <th>Prospects</th>
                  <th>Trial Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No workspaces matched your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => {
                    return (
                      <tr key={org.id} className="table-row">
                        <td>
                          <div>
                            <strong style={{ color: "#ffffff", fontSize: "14px" }}>{org.name}</strong>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {org.ownerEmail} · <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px" }}>/{org.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.04em",
                            background: org.plan === "ENTERPRISE" ? "rgba(34, 197, 94, 0.15)" : org.plan === "GROWTH" ? "rgba(252, 163, 17, 0.15)" : "rgba(126, 166, 216, 0.15)",
                            color: org.plan === "ENTERPRISE" ? "var(--signal)" : org.plan === "GROWTH" ? "var(--brass)" : "#7ea6d8",
                            border: `1px solid ${org.plan === "ENTERPRISE" ? "rgba(34, 197, 94, 0.4)" : org.plan === "GROWTH" ? "rgba(252, 163, 17, 0.4)" : "rgba(126, 166, 216, 0.4)"}`
                          }}>
                            {org.plan}
                          </span>
                        </td>
                        <td>
                          <span className={`outreach-status ${org.subscriptionStatus === "ACTIVE" ? "outreach-status-signal" : org.subscriptionStatus === "TRIALING" ? "outreach-status-brass" : "outreach-status-risk"}`}>
                            {org.subscriptionStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ minWidth: "140px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                              <span>{org.leadsUsedThisMonth} / {org.monthlyLeadQuota}</span>
                              <span style={{ fontWeight: "700" }}>{org.usagePercent}%</span>
                            </div>
                            <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{
                                height: "100%",
                                width: `${Math.min(org.usagePercent, 100)}%`,
                                background: org.usagePercent >= 90 ? "var(--risk)" : "var(--brass)",
                                borderRadius: "3px"
                              }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}>
                            {org.prospectsCount}
                          </span>
                        </td>
                        <td>
                          {org.subscriptionStatus === "TRIALING" ? (
                            <span style={{ color: org.daysRemainingInTrial <= 3 ? "var(--risk)" : "var(--brass)", fontWeight: "600", fontSize: "12px" }}>
                              {org.daysRemainingInTrial} {org.daysRemainingInTrial === 1 ? "day" : "days"}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Active Paid</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-ghost"
                            onClick={() => handleOpenWorkspaceModal(org)}
                            style={{ padding: "5px 12px", fontSize: "12px" }}
                          >
                            <Edit3 size={13} /> Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WEBSITE PRICING MANAGER (CMS) */}
      {activeTab === "pricing" && pricingDraft && (
        <div>
          <div style={{
            background: "rgba(252, 163, 17, 0.08)",
            border: "1px solid rgba(252, 163, 17, 0.3)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <strong style={{ color: "var(--brass)", fontSize: "14px" }}>Website Pricing Content Control</strong>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                Modify prices in Kenyan Shillings (KES), features, and tier descriptions. Updates reflect across the landing page and signup flows immediately upon save.
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleSavePricing}
              disabled={isSavingPricing}
              style={{ padding: "10px 22px" }}
            >
              {isSavingPricing ? "Publishing..." : "Save & Publish Pricing"}
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {/* Starter Plan Editor */}
            <div className="panel" style={{ padding: "24px", borderRadius: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "20px", margin: 0 }}>Starter Plan</h3>
                <span className="stamp stamp-sm">BOUTIQUE</span>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div className="field">
                  <label className="field-label">Price in Kenyan Shilling (KES)</label>
                  <input
                    className="input"
                    value={pricingDraft.starter?.priceKes || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      starter: { ...pricingDraft.starter, priceKes: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Billing Period Label</label>
                  <input
                    className="input"
                    value={pricingDraft.starter?.period || "/ month"}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      starter: { ...pricingDraft.starter, period: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Monthly Lead Quota</label>
                  <input
                    type="number"
                    className="input"
                    value={pricingDraft.starter?.leadQuota || 250}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      starter: { ...pricingDraft.starter, leadQuota: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={pricingDraft.starter?.description || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      starter: { ...pricingDraft.starter, description: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Growth Plan Editor (Featured) */}
            <div className="panel" style={{ padding: "24px", borderRadius: "14px", border: "1.5px solid var(--brass)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "20px", margin: 0, color: "var(--brass)" }}>Growth Plan (Featured)</h3>
                <span style={{ background: "var(--brass)", color: "#14213d", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>MOST POPULAR</span>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div className="field">
                  <label className="field-label">Price in Kenyan Shilling (KES)</label>
                  <input
                    className="input"
                    value={pricingDraft.growth?.priceKes || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      growth: { ...pricingDraft.growth, priceKes: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Billing Period Label</label>
                  <input
                    className="input"
                    value={pricingDraft.growth?.period || "/ month"}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      growth: { ...pricingDraft.growth, period: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Monthly Lead Quota</label>
                  <input
                    type="number"
                    className="input"
                    value={pricingDraft.growth?.leadQuota || 1500}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      growth: { ...pricingDraft.growth, leadQuota: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={pricingDraft.growth?.description || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      growth: { ...pricingDraft.growth, description: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Scale Plan Editor */}
            <div className="panel" style={{ padding: "24px", borderRadius: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "20px", margin: 0 }}>Scale / Enterprise</h3>
                <span className="stamp stamp-sm">HIGH-VOLUME</span>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div className="field">
                  <label className="field-label">Price in Kenyan Shilling (KES)</label>
                  <input
                    className="input"
                    value={pricingDraft.scale?.priceKes || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      scale: { ...pricingDraft.scale, priceKes: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Billing Period Label</label>
                  <input
                    className="input"
                    value={pricingDraft.scale?.period || "/ month"}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      scale: { ...pricingDraft.scale, period: e.target.value }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Monthly Lead Quota</label>
                  <input
                    type="number"
                    className="input"
                    value={pricingDraft.scale?.leadQuota || 10000}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      scale: { ...pricingDraft.scale, leadQuota: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={pricingDraft.scale?.description || ""}
                    onChange={(e) => setPricingDraft({
                      ...pricingDraft,
                      scale: { ...pricingDraft.scale, description: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TESTIMONIALS CMS */}
      {activeTab === "testimonials" && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px"
          }}>
            <div>
              <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "22px", margin: "0 0 4px", color: "#ffffff" }}>
                Landing Page Client Testimonials
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13.5px", margin: 0 }}>
                Manage verified client feedback, agency results, and case study quotes displayed on the public website.
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={handleOpenNewTestimonial}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Testimonial
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "20px"
          }}>
            {testimonialsDraft.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.75) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "rgba(252, 163, 17, 0.15)",
                        border: "1px solid var(--brass)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "var(--brass)"
                      }}>
                        {t.avatar || t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ color: "#ffffff", fontSize: "14.5px" }}>{t.name}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.role} · {t.company}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="#fca311" color="#fca311" />
                      ))}
                    </div>
                  </div>

                  {t.result && (
                    <div style={{
                      display: "inline-block",
                      background: "rgba(34, 197, 94, 0.12)",
                      border: "1px solid rgba(34, 197, 94, 0.35)",
                      color: "var(--signal)",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      marginBottom: "12px"
                    }}>
                      {t.result}
                    </div>
                  )}

                  <p style={{
                    color: "var(--text-muted)",
                    fontSize: "13.5px",
                    lineHeight: "1.6",
                    fontStyle: "italic",
                    margin: "0 0 16px"
                  }}>
                    "{t.content}"
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--hairline)"
                }}>
                  <span style={{ fontSize: "11.5px", color: t.published ? "var(--signal)" : "var(--text-muted)" }}>
                    {t.published ? "● Published on Site" : "○ Hidden Draft"}
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => handleEditTestimonial(t)}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => handleDeleteTestimonial(t.id)}
                      style={{ color: "var(--risk)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT WORKSPACE MODAL */}
      {selectedOrg && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8, 14, 26, 0.85)",
          backdropFilter: "blur(8px)",
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
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "20px", margin: 0, color: "#ffffff" }}>
                Manage Workspace: {selectedOrg.name}
              </h3>
              <button
                onClick={() => setSelectedOrg(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 20px" }}>
              Owner: <strong>{selectedOrg.ownerEmail}</strong> · Slug: <strong>/{selectedOrg.slug}</strong>
            </p>

            <div style={{ display: "grid", gap: "14px" }}>
              <div className="field">
                <label className="field-label">Subscription Plan Tier</label>
                <select
                  className="select"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                >
                  <option value="STARTER">Starter Plan (KES 6,500/mo · 250 leads)</option>
                  <option value="GROWTH">Growth Plan (KES 16,500/mo · 1,500 leads)</option>
                  <option value="ENTERPRISE">Enterprise Plan (KES 38,500/mo · 10,000 leads)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Subscription Status</label>
                <select
                  className="select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="TRIALING">TRIALING (14-day free access)</option>
                  <option value="ACTIVE">ACTIVE (Paid & renewing)</option>
                  <option value="PAST_DUE">PAST_DUE (Payment failed)</option>
                  <option value="CANCELED">CANCELED (Access paused)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Monthly Lead Quota</label>
                <input
                  type="number"
                  className="input"
                  value={editQuota}
                  onChange={(e) => setEditQuota(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label className="field-label">Extend Trial By (Days)</label>
                <select
                  className="select"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                >
                  <option value={0}>Do not extend</option>
                  <option value={7}>+7 Days Extension</option>
                  <option value={14}>+14 Days Extension</option>
                  <option value={30}>+30 Days Extension</option>
                  <option value={60}>+60 Days VIP Extension</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button className="btn-ghost" onClick={() => setSelectedOrg(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveWorkspace}
                disabled={isUpdatingOrg}
              >
                {isUpdatingOrg ? "Updating..." : "Save Workspace Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT TESTIMONIAL MODAL */}
      {(isNewTestimonial || editingTestimonial) && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8, 14, 26, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <form
            onSubmit={handleSaveTestimonial}
            style={{
              background: "#14213d",
              border: "1px solid #26385d",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontFamily: "'Glorase', serif", fontSize: "20px", margin: 0, color: "#ffffff" }}>
                {isNewTestimonial ? "Add New Testimonial" : "Edit Testimonial"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsNewTestimonial(false); setEditingTestimonial(null); }}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="field">
                  <label className="field-label">Author Name</label>
                  <input
                    className="input"
                    placeholder="e.g. David Mwangi"
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Job Title</label>
                  <input
                    className="input"
                    placeholder="e.g. Head of Outbound"
                    value={testForm.role}
                    onChange={(e) => setTestForm({ ...testForm, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="field">
                  <label className="field-label">Company Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Kipawa Tech Ventures"
                    value={testForm.company}
                    onChange={(e) => setTestForm({ ...testForm, company: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Highlight Result Tag</label>
                  <input
                    className="input"
                    placeholder="e.g. +310% Pipeline"
                    value={testForm.result}
                    onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Quote Content</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="What was their feedback or measurable result with Versaleads?"
                  value={testForm.content}
                  onChange={(e) => setTestForm({ ...testForm, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field-label">Star Rating (1 - 5)</label>
                  <select
                    className="select"
                    value={testForm.rating}
                    onChange={(e) => setTestForm({ ...testForm, rating: Number(e.target.value) })}
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                  </select>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#ffffff", cursor: "pointer", marginTop: "16px" }}>
                  <input
                    type="checkbox"
                    checked={testForm.published}
                    onChange={(e) => setTestForm({ ...testForm, published: e.target.checked })}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setIsNewTestimonial(false); setEditingTestimonial(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save & Publish Testimonial
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
