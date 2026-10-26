import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Users, UserPlus, Search, ChevronRight, ChevronLeft,
  Globe, Share2, Link2, Building2, MapPin,
  Sparkles, Clock, CheckCircle2, Circle, FileText, X, ArrowUpDown,
  TrendingUp, ShieldAlert, Target, Activity as ActivityIcon, Plus,
  Pencil, Save, ChevronDown, Inbox, FolderSearch, BarChart3, BriefcaseBusiness, RefreshCw, Mail, MessageCircle, Copy, Trash2, Settings, BrainCircuit, KeyRound, Plug, AlertTriangle, DatabaseZap, ExternalLink, Send, Reply, CalendarClock, ListChecks,
  CreditCard
} from "lucide-react";
import LandingPage from "./LandingPage.jsx";
import BillingWorkspacePage, { TrialBanner, PaywallModal, AcceptInviteModal } from "./BillingWorkspacePage.jsx";
import LegalModal from "./LegalModal.jsx";
import AdminPlatformPage from "./AdminPlatformPage.jsx";
import CompanyProfilePage from "./CompanyProfilePage.jsx";

/* ============================================================
   VERSALEADS — UNIVERSAL B2B LEAD INTELLIGENCE & QUALIFICATION CRM
   Intelligent lead acquisition, multi-source evidence extraction,
   explainable 100-point qualification scoring, and tailored service pitches.
   ============================================================ */

const STORAGE_KEY = "versaleads-intelligence-data";
const AI_SETTINGS_KEY = "versaleads-ai-settings";
const KENYA_MODE_KEY = "versaleads-kenya-only";

const API_BASE = (
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "5173"
        ? "http://localhost:4000"
        : "")
).replace(/\/$/, "");
const AUTH_TOKEN_KEY = "versaleads-auth-token";
const AUTH_USER_KEY = "versaleads-auth-user";

async function apiRequest(path, options = {}, token = localStorage.getItem(AUTH_TOKEN_KEY)) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
    err.status = response.status;
    err.code = payload?.code;
    err.payload = payload;
    throw err;
  }
  return payload;
}

function buildPersistPayload(prospect) {
  const evidence = prospect.research ? buildEvidenceLog(prospect, prospect.research).map((item) => ({
    finding: item.finding || item.text || "", source: item.source || "Case file", sourceUrl: item.sourceUrl || null,
    evidence: item.evidence || item.text || "", confidence: item.confidence || "medium", kind: item.kind || item.sourceType || "observed",
    collectedAt: item.collectedAt || new Date().toISOString()
  })) : [];
  return { ...prospect, evidence };
}

function isKenyaLocation(location = "") { return /\bkenya\b|nairobi|mombasa|kisumu|nakuru|eldoret|thika|malindi|naivasha|nyeri|machakos|kiambu/i.test(String(location)); }

// The database column for `score` is a non-nullable Int defaulting to 0
// (a fresh, unresearched prospect has no meaningful score yet). Everything
// in the UI treats `score === null` as "not yet scored" — so every prospect
// coming back from the API is normalized here, once, at the boundary.
function normalizeProspect(p) {
  if (!p) return p;
  const hasBeenQualified = Boolean(p.research) || Boolean(p.scoreBreakdown);
  return hasBeenQualified ? p : { ...p, score: null };
}

const SERVICES = [
  "Growth & Social Media Management",
  "High-Converting Content Creation",
  "Commercial Video & Visual Marketing",
  "Brand Strategy & Visual Identity",
  "Paid Performance Advertising",
  "B2B Outreach & Lead Generation Systems",
  "Conversion-Optimized Website & Funnel Development",
  "Search Engine Optimization (SEO) & Inbound Strategy",
];


const OUTREACH_STATUS_META = {
  not_started: { label: "Not Started", tone: "muted" },
  drafted: { label: "Draft Ready", tone: "brass" },
  reached_out: { label: "Reached Out", tone: "signal" },
  replied: { label: "Replied", tone: "signal" },
  follow_up_due: { label: "Follow-up Due", tone: "amber" },
  closed: { label: "Closed", tone: "risk" },
};

function getOutreachStatus(prospect) {
  if (prospect?.outreachStatus) return prospect.outreachStatus;
  return Array.isArray(prospect?.outreachMessages) && prospect.outreachMessages.length ? "drafted" : "not_started";
}

function OutreachStatusBadge({ status, size = "sm" }) {
  const meta = OUTREACH_STATUS_META[status] || OUTREACH_STATUS_META.not_started;
  return <span className={`outreach-status outreach-status-${meta.tone} outreach-status-${size}`}>{meta.label}</span>;
}

/* ---------------- shared form field ---------------- */

function Field({ label, required = false, children }) {
  return (
    <div className="field">
      {label ? (
        <label className="field-label">
          {label}{required ? <span className="field-required">*</span> : null}
        </label>
      ) : null}
      {children}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function uid() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getQualification(score) {
  if (score === null || score === undefined) return null;
  if (score >= 80) return "high";
  if (score >= 60) return "strong";
  if (score >= 40) return "nurture";
  return "low";
}

const QUAL_META = {
  high: { label: "High Priority", varName: "--signal" },
  strong: { label: "Strong Prospect", varName: "--brass" },
  nurture: { label: "Nurture", varName: "--amber" },
  low: { label: "Low Priority", varName: "--risk" },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relativeTime(iso) {
  if (!iso) return "—";
  const now = new Date();
  const then = new Date(iso);
  const diffMs = Math.max(0, now - then);
  const day = 86400000;
  const days = Math.floor(diffMs / day);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function caseNumber(n) {
  return "VL-" + String(n).padStart(4, "0");
}


/* ---------------- qualification + recommendation engine ---------------- */

function hasValue(v) { return Boolean(v && String(v).trim()); }

function calculateEvidenceQuality(evidence = []) {
  const now = Date.now();
  const observed = evidence.filter((e) => ['confirmed','observed'].includes(String(e.kind || e.sourceType || '').toLowerCase()));
  const confidenceWeight = { high: 1, medium: 0.65, low: 0.35 };
  const categoryCounts = {};
  let weighted = 0;
  let fresh = 0, aging = 0, stale = 0;
  for (const item of observed) {
    const confidence = confidenceWeight[String(item.confidence || 'medium').toLowerCase()] ?? 0.5;
    const ageDays = item.collectedAt ? Math.max(0, (now - new Date(item.collectedAt).getTime()) / 86400000) : 90;
    const freshness = ageDays <= 30 ? 1 : ageDays <= 90 ? 0.72 : 0.42;
    if (ageDays <= 30) fresh++; else if (ageDays <= 90) aging++; else stale++;
    const category = String(item.category || 'general');
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    weighted += confidence * freshness;
  }
  const corroboratedCategories = Object.values(categoryCounts).filter((n) => n >= 2).length;
  const qualityScore = Math.min(15, Math.round(Math.min(11, weighted * 2) + Math.min(2, corroboratedCategories) + (observed.length >= 5 ? 1 : 0)));
  const freshnessLabel = stale > observed.length / 2 ? 'stale' : fresh >= Math.max(1, observed.length / 2) ? 'fresh' : 'aging';
  return { observed, fresh, aging, stale, corroboratedCategories, qualityScore, freshnessLabel };
}

function calculateLeadQualification(prospect) {
  const text = (v) => String(v || '').toLowerCase();
  const haystack = [prospect.companyName, prospect.industry, prospect.businessType, prospect.services, prospect.positioning, prospect.targetAudience].map(text).join(' ');
  const evidence = buildEvidenceLog(prospect, prospect.research || {}).filter(Boolean);
  const quality = calculateEvidenceQuality(evidence);
  const opportunityItems = prospect.research?.marketingAnalysis?.opportunities?.filter((x) => x.sourceType !== 'unavailable') || [];
  const gapItems = prospect.research?.marketingAnalysis?.marketingGaps?.filter((x) => x.sourceType !== 'unavailable') || [];
  const onlineCount = [prospect.website, prospect.instagram, prospect.linkedin, prospect.facebook, prospect.otherUrl].filter(hasValue).length;

  const hasIndustry = hasValue(prospect.industry) || hasValue(prospect.businessType);
  const hasAudience = hasValue(prospect.targetAudience);
  const hasPositioning = hasValue(prospect.positioning);
  const hasLocation = hasValue(prospect.location) || hasValue(prospect.country);

  let idealFit = (hasIndustry ? 9 : 3) + (hasAudience ? 6 : 0) + (hasPositioning ? 5 : 0) + (hasLocation ? 3 : 0) + (hasValue(prospect.website) ? 2 : 0);
  idealFit = Math.min(25, idealFit);

  let marketingNeed = 5 + Math.min(10, gapItems.length * 3) + Math.min(6, opportunityItems.length * 2);
  if (onlineCount <= 1) marketingNeed += 2;
  if (!hasValue(prospect.website)) marketingNeed += 2;
  if (quality.observed.length >= 3) marketingNeed += 2;
  marketingNeed = Math.min(25, marketingNeed);

  let opportunityValue = 5 + (hasValue(prospect.website) ? 3 : 0) + (hasValue(prospect.contactRole) ? 4 : 0) + (/director|head|marketing|owner|founder|partner|ceo|president|managing|chief|vp/i.test(text(prospect.contactRole)) ? 5 : 0) + (hasAudience && hasPositioning ? 3 : 0);
  opportunityValue = Math.min(20, opportunityValue);

  let digitalPresence = 2 + onlineCount * 3 + (hasValue(prospect.website) ? 2 : 0) + (prospect.research?.websiteResearch?.status === 'success' ? 2 : 0);
  digitalPresence = Math.min(15, digitalPresence);

  const evidenceStrength = prospect.researchStatus === 'researched' ? quality.qualityScore : Math.min(5, quality.qualityScore);
  const evidenceFreshness = quality.freshnessLabel;
  const factors = [
    { key:'idealFit', label:'Ideal Client Fit', score:idealFit, max:25, evidence: hasIndustry ? `Commercial sector identified: ${prospect.industry || prospect.businessType}.` : 'Industry or sector classification is pending verification.', explanation: idealFit >= 18 ? 'Business profile, market niche, and positioning show strong commercial alignment.' : 'Industry or market positioning needs more documentation.' },
    { key:'marketingNeed', label:'Growth & Marketing Need', score:marketingNeed, max:25, evidence: `${gapItems.length} gap(s) and ${opportunityItems.length} opportunity signal(s) identified across ${quality.observed.length} observed evidence item(s).`, explanation: marketingNeed >= 18 ? 'Clear digital and commercial growth gaps exist that Versaleads services can directly solve.' : 'Marketing need is plausible, but deeper research is recommended.' },
    { key:'opportunityValue', label:'Opportunity Value', score:opportunityValue, max:20, evidence: hasValue(prospect.contactRole) ? `Key stakeholder identified: ${prospect.contactRole}.` : 'Decision-maker role has not been verified yet.', explanation: opportunityValue >= 14 ? 'High commercial upside; verified decision-maker presence justifies direct outreach.' : 'Commercial value requires additional stakeholder intelligence.' },
    { key:'digitalPresence', label:'Digital Presence & Footprint', score:digitalPresence, max:15, evidence: `${onlineCount} active digital channel(s)${hasValue(prospect.website) ? ' with verified website' : ''}.`, explanation: digitalPresence >= 10 ? 'Robust digital footprint available for deep qualification and outreach customization.' : 'Limited public presence reduces automated research depth.' },
    { key:'evidenceStrength', label:'Evidence & Verification Quality', score:evidenceStrength, max:15, evidence: `${quality.observed.length} confirmed data point(s); ${quality.fresh} fresh, ${quality.aging} aging, ${quality.stale} stale.`, explanation: evidenceStrength >= 12 ? 'Score is backed by fresh, corroborated evidence.' : evidenceStrength >= 7 ? 'Helpful initial evidence; ongoing corroboration is recommended.' : 'Provisional assessment pending primary website extraction.' },
  ];
  const rawTotal = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0));
  const freshnessPenalty = evidenceFreshness === 'stale' ? 5 : evidenceFreshness === 'aging' ? 2 : 0;
  const total = Math.max(0, Math.min(100, rawTotal - freshnessPenalty));
  const confidence = evidenceStrength >= 12 && evidenceFreshness === 'fresh' ? 'high' : evidenceStrength >= 7 ? 'medium' : 'low';
  const primaryWeakness = [...factors].sort((a,b)=>(a.score/a.max)-(b.score/b.max))[0];
  return { total, rawTotal, freshnessPenalty, evidenceFreshness, factors, confidence, summary: {
    whyThisLead: `${hasIndustry ? `Aligned with ${prospect.industry || 'target industry'}` : 'Commercial profile identified'}; ${gapItems.length || opportunityItems.length ? 'research uncovered specific growth opportunities' : 'growth opportunities require further inquiry'}. Evidence status: ${evidenceFreshness} with ${quality.observed.length} confirmed finding(s).`,
    strongestSignal: [...factors].sort((a,b)=>(b.score/b.max)-(a.score/a.max))[0].label,
    biggestUnknown: primaryWeakness.label,
    nextBestAction: evidenceStrength < 10 ? 'Run automated website research to collect verified evidence.' : evidenceFreshness !== 'fresh' ? 'Refresh research before investing active sales outreach.' : total >= 80 ? 'Prioritize for immediate multi-touch outreach.' : total >= 60 ? 'Refine decision-maker details and launch customized pitch.' : 'Add to nurture sequence until stronger buying intent emerges.'
  }};
}

function recommendVersaleadsService(prospect) {
  const hasWebsite = hasValue(prospect.website);
  const socialCount = [prospect.instagram, prospect.linkedin, prospect.facebook].filter(hasValue).length;
  const audience = hasValue(prospect.targetAudience);
  const positioning = hasValue(prospect.positioning);
  const type = `${prospect.industry || ''} ${prospect.businessType || ''}`.toLowerCase();

  let recommendedService = 'High-Converting Content Creation';
  let mainOpportunity = 'Build a systematic content and lead capture engine around the prospect’s core commercial offering.';
  let why = 'The case file indicates an established business profile that would benefit from consistent, conversion-focused content across key digital touchpoints.';
  let deliverables = ['Content strategy blueprint', 'Monthly production calendar', 'Multi-channel distribution', 'Performance tracking'];

  if (!hasWebsite && socialCount === 0) {
    recommendedService = 'Conversion-Optimized Website & Funnel Development';
    mainOpportunity = 'Establish a primary digital conversion asset to capture market demand.';
    why = 'No official website or public social presence is recorded, creating high friction for inbound prospect acquisition.';
    deliverables = ['High-converting landing page', 'Lead capture funnel', 'Product/Service showcase', 'Analytics & conversion tracking'];
  } else if (!hasWebsite) {
    recommendedService = 'Conversion-Optimized Website & Funnel Development';
    mainOpportunity = 'Direct social interest into a dedicated commercial conversion funnel.';
    why = 'The company has social channels but lacks a dedicated website to convert interest into qualified leads.';
    deliverables = ['Modern responsive website', 'Lead capture forms', 'Booking & consultation integration', 'SEO foundation'];
  } else if (/saas|software|tech|b2b|consulting|corporate|legal|finance|accounting|advisory/i.test(type)) {
    recommendedService = 'B2B Outreach & Lead Generation Systems';
    mainOpportunity = 'Implement direct multi-channel B2B prospecting to engage verified decision-makers.';
    why = 'High contract values and identifiable decision-makers make outbound prospecting the highest ROI client acquisition channel.';
    deliverables = ['Ideal client profile (ICP) list building', 'Multi-touch cold email & LinkedIn sequences', 'Inbox deliverability setup', 'Lead qualification workflow'];
  } else if (/ecommerce|retail|fashion|consumer|beauty|restaurant|hospitality|luxury|property|architect/i.test(type)) {
    recommendedService = 'Commercial Video & Visual Marketing';
    mainOpportunity = 'Elevate visual storytelling to showcase product/service excellence and increase conversions.';
    why = 'The market category is inherently visual, making high-production video and visual assets the most compelling conversion driver.';
    deliverables = ['Brand commercial assets', 'Short-form social video (Reels/TikTok/Shorts)', 'Product/Space spotlight edits', 'Ad-ready video cutdowns'];
  } else if (socialCount <= 1) {
    recommendedService = 'Growth & Social Media Management';
    mainOpportunity = 'Build brand authority and consistent market reach across primary industry platforms.';
    why = 'Limited social channels are currently leveraged, leaving substantial organic reach and customer awareness untapped.';
    deliverables = ['Platform channel management', 'Weekly content publishing', 'Community engagement', 'Monthly ROI reporting'];
  } else if (audience && positioning) {
    recommendedService = 'Brand Strategy & Visual Identity';
    mainOpportunity = 'Clarify market differentiation to win against established category competitors.';
    why = 'Clear audience and positioning foundations are present; unifying these into premium branding will justify premium pricing.';
    deliverables = ['Brand messaging guide', 'Visual identity kit', 'Sales collateral templates', 'Value proposition framework'];
  }

  const qualification = calculateLeadQualification(prospect);
  return { recommendedService, mainOpportunity, recommendedReason: why, deliverables, recommendationConfidence: qualification.confidence, recommendationBasis: qualification.factors.filter(f=>f.score>0).slice(0,3).map(f=>f.evidence) };
}

/* ---------------- demo data ---------------- */

function buildDemoData() {
  const base = [
    {
      companyName: "Meridian Coastal Properties", contactName: "Elena Ruiz", contactRole: "Marketing Director",
      location: "Miami, FL", industry: "Luxury Real Estate", businessType: "Luxury Specialist",
      website: "meridiancoastal.com", instagram: "@meridiancoastal", linkedin: "meridian-coastal-properties",
      facebook: "", otherUrl: "",
      targetAudience: "High-net-worth buyers seeking waterfront and penthouse properties",
      positioning: "Positions itself as the exclusive gateway to Miami's waterfront market",
      score: 88, needsReview: false, daysAgoResearched: 2, daysAgoAdded: 9,
      recommendedService: "Property Video Marketing",
      recommendedReason: "Strong listing inventory with minimal video content to showcase it",
    },
    {
      companyName: "Northgate Realty Group", contactName: "Marcus Webb", contactRole: "Broker/Owner",
      location: "Austin, TX", industry: "Real Estate Brokerage", businessType: "Independent Agency",
      website: "northgaterealty.com", instagram: "@northgaterealtyatx", linkedin: "northgate-realty-group",
      facebook: "northgaterealtyatx", otherUrl: "",
      targetAudience: "First-time buyers and growing families in North Austin suburbs",
      positioning: "Community-first brokerage emphasizing local expertise",
      score: 74, needsReview: false, daysAgoResearched: 5, daysAgoAdded: 14,
      recommendedService: "Real Estate Social Media Management",
      recommendedReason: "Active audience but inconsistent posting cadence across platforms",
    },
    {
      companyName: "Cobalt Urban Developments", contactName: "Priya Nathan", contactRole: "Head of Marketing",
      location: "Toronto, ON", industry: "Real Estate Development", businessType: "Mid-Size Developer",
      website: "cobalturban.ca", instagram: "@cobalturban", linkedin: "cobalt-urban-developments",
      facebook: "", otherUrl: "",
      targetAudience: "Urban professionals and investors buying pre-construction condos",
      positioning: "Design-forward developer targeting design-conscious urban buyers",
      score: 91, needsReview: false, daysAgoResearched: 1, daysAgoAdded: 20,
      recommendedService: "Content Strategy",
      recommendedReason: "Multiple project launches this year without a unified content calendar",
    },
    {
      companyName: "Hearth & Home Realtors", contactName: "Diane Colston", contactRole: "Office Manager",
      location: "Denver, CO", industry: "Real Estate Brokerage", businessType: "Boutique Brokerage",
      website: "hearthandhomerealtors.com", instagram: "@hearthhomedenver", linkedin: "",
      facebook: "hearthandhomerealtors", otherUrl: "",
      targetAudience: "Move-up buyers in established Denver neighborhoods",
      positioning: "Traditional, relationship-driven brokerage",
      score: 55, needsReview: false, daysAgoResearched: 11, daysAgoAdded: 25,
      recommendedService: "Content Creation",
      recommendedReason: "Listing photography quality varies significantly between agents",
    },
    {
      companyName: "Skyline Commercial Partners", contactName: "Rob Ashford", contactRole: "VP Marketing",
      location: "Chicago, IL", industry: "Commercial Real Estate", businessType: "National Franchise",
      website: "skylinecommercial.com", instagram: "", linkedin: "skyline-commercial-partners",
      facebook: "", otherUrl: "",
      targetAudience: "Institutional investors and corporate tenants",
      positioning: "Data-driven commercial advisory for large portfolios",
      score: 62, needsReview: false, daysAgoResearched: 8, daysAgoAdded: 30,
      recommendedService: "Paid Advertising",
      recommendedReason: "Strong reputation but limited digital lead generation for smaller listings",
    },
    {
      companyName: "Palm & Pine Vacation Homes", contactName: "Sofia Almeida", contactRole: "Founder",
      location: "Lisbon, Portugal", industry: "Vacation Rentals", businessType: "Vacation Rental Operator",
      website: "palmandpinehomes.pt", instagram: "@palmandpinehomes", linkedin: "",
      facebook: "palmandpinehomes", otherUrl: "",
      targetAudience: "International travelers seeking boutique coastal stays",
      positioning: "Curated portfolio of design-led coastal rentals",
      score: 79, needsReview: false, daysAgoResearched: 3, daysAgoAdded: 16,
      recommendedService: "Property Video Marketing",
      recommendedReason: "Beautiful properties underrepresented by short-form video",
    },
    {
      companyName: "Dune Ridge Estates", contactName: "Fahad Al-Rashid", contactRole: "Director of Brand",
      location: "Dubai, UAE", industry: "Luxury Real Estate", businessType: "Luxury Specialist",
      website: "duneridgeestates.ae", instagram: "@duneridgeestates", linkedin: "dune-ridge-estates",
      facebook: "duneridgeestates", otherUrl: "",
      targetAudience: "Ultra-high-net-worth buyers and international investors",
      positioning: "Ultra-premium developer of signature desert and coastal residences",
      score: 95, needsReview: false, daysAgoResearched: 1, daysAgoAdded: 33,
      recommendedService: "Brand Strategy",
      recommendedReason: "Rapid expansion has outpaced a cohesive brand narrative",
    },
    {
      companyName: "Baobab Living", contactName: "Wanjiru Kamau", contactRole: "Operations Lead",
      location: "Nairobi, Kenya", industry: "Property Management", businessType: "Property Management Firm",
      website: "baobabliving.co.ke", instagram: "@baobabliving", linkedin: "",
      facebook: "", otherUrl: "",
      targetAudience: "Landlords and diaspora investors managing rental units",
      positioning: "Full-service property management for absentee owners",
      score: 48, needsReview: true, daysAgoResearched: 18, daysAgoAdded: 40,
      recommendedService: "Website or Landing Page Services",
      recommendedReason: "No dedicated site to convert inbound landlord inquiries",
    },
    {
      companyName: "Lagos Prime Homes", contactName: "Chidi Okonkwo", contactRole: "Managing Partner",
      location: "Lagos, Nigeria", industry: "Real Estate Brokerage", businessType: "Independent Agency",
      website: "lagosprimehomes.com", instagram: "@lagosprimehomes", linkedin: "lagos-prime-homes",
      facebook: "lagosprimehomes", otherUrl: "",
      targetAudience: "Diaspora buyers and upper-middle-class local families",
      positioning: "Trusted broker for diaspora property purchases",
      score: 67, needsReview: false, daysAgoResearched: 6, daysAgoAdded: 22,
      recommendedService: "Real Estate Social Media Management",
      recommendedReason: "Engaged following but no consistent content system",
    },
    {
      companyName: "Barcelona Habitat Studio", contactName: "Marta Serra", contactRole: "Creative Director",
      location: "Barcelona, Spain", industry: "Real Estate Marketing / Design", businessType: "Design-Build Studio",
      website: "bhabitatstudio.es", instagram: "@bhabitatstudio", linkedin: "barcelona-habitat-studio",
      facebook: "", otherUrl: "",
      targetAudience: "Architecture-minded buyers of renovated period apartments",
      positioning: "Design studio blending renovation with real estate sales",
      score: 71, needsReview: false, daysAgoResearched: 4, daysAgoAdded: 12,
      recommendedService: "Graphic Design",
      recommendedReason: "Strong design sensibility not yet reflected in marketing collateral",
    },
    {
      companyName: "Cape Point Realty", contactName: "Johan van der Berg", contactRole: "Sales Manager",
      location: "Cape Town, South Africa", industry: "Real Estate Brokerage", businessType: "Boutique Brokerage",
      website: "capepointrealty.co.za", instagram: "", linkedin: "",
      facebook: "capepointrealty", otherUrl: "",
      targetAudience: "Local buyers and semigration relocators",
      positioning: "Unclear — minimal public-facing positioning found",
      score: 36, needsReview: true, daysAgoResearched: 27, daysAgoAdded: 45,
      recommendedService: "Content Creation",
      recommendedReason: "Very limited online presence to build from",
    },
    {
      companyName: "Marina Bay Developments", contactName: "Grace Lim", contactRole: "Marketing Manager",
      location: "Singapore", industry: "Real Estate Development", businessType: "Mid-Size Developer",
      website: "marinabaydevelopments.sg", instagram: "@marinabaydev", linkedin: "marina-bay-developments",
      facebook: "", otherUrl: "",
      targetAudience: "Regional investors and upgrading local families",
      positioning: "Trusted mid-market developer with steady project pipeline",
      score: 83, needsReview: false, daysAgoResearched: 2, daysAgoAdded: 19,
      recommendedService: "Content Strategy",
      recommendedReason: "Consistent launches lack a cross-platform storytelling plan",
    },
    {
      companyName: "Foothill Family Homes", contactName: "Tara Whitfield", contactRole: "Owner",
      location: "Boise, ID", industry: "Real Estate Brokerage", businessType: "Independent Agency",
      website: "foothillfamilyhomes.com", instagram: "@foothillfamilyhomes", linkedin: "",
      facebook: "foothillfamilyhomes", otherUrl: "",
      targetAudience: "Growing families relocating to the Boise foothills",
      positioning: "Warm, family-oriented local brokerage",
      score: 44, needsReview: false, daysAgoResearched: 15, daysAgoAdded: 35,
      recommendedService: "Content Creation",
      recommendedReason: "Sparse posting activity relative to local market growth",
    },
    {
      companyName: "Union Square Lofts", contactName: "Devon Park", contactRole: "Principal Agent",
      location: "San Francisco, CA", industry: "Real Estate Brokerage", businessType: "Boutique Brokerage",
      website: "unionsquarelofts.com", instagram: "@unionsquarelofts", linkedin: "union-square-lofts",
      facebook: "", otherUrl: "",
      targetAudience: "Young professionals purchasing first condos and lofts",
      positioning: "Niche specialist in downtown loft conversions",
      score: 58, needsReview: false, daysAgoResearched: 10, daysAgoAdded: 28,
      recommendedService: "Website or Landing Page Services",
      recommendedReason: "Outdated site with no clear inquiry path for listings",
    },
  ];

  const unresearched = [
    { companyName: "Copperline Estates", contactName: "Bill Sanders", contactRole: "Owner", location: "Portland, OR",
      website: "copperlineestates.com", instagram: "@copperlineestates", linkedin: "", facebook: "", otherUrl: "", daysAgoAdded: 1 },
    { companyName: "Ridgeway & Co. Realty", contactName: "Emma Hartley", contactRole: "Partner", location: "Manchester, UK",
      website: "ridgewayrealty.co.uk", instagram: "", linkedin: "ridgeway-co-realty", facebook: "", otherUrl: "", daysAgoAdded: 3 },
    { companyName: "Sable Point Properties", contactName: "Renee Doucet", contactRole: "Broker", location: "Charleston, SC",
      website: "sablepointproperties.com", instagram: "@sablepointprops", linkedin: "", facebook: "", otherUrl: "", daysAgoAdded: 6 },
    { companyName: "Vantage Row Developments", contactName: "Jamal Reid", contactRole: "Development Manager", location: "Nashville, TN",
      website: "vantagerow.com", instagram: "", linkedin: "vantage-row-developments", facebook: "", otherUrl: "", daysAgoAdded: 8 },
  ];

  const now = new Date("2026-08-23T09:00:00").getTime();
  const day = 86400000;
  const prospects = [];
  const activity = [];
  let n = 1;

  base.forEach((b) => {
    const id = uid();
    const dateAdded = new Date(now - b.daysAgoAdded * day).toISOString();
    const dateResearched = new Date(now - b.daysAgoResearched * day).toISOString();
    prospects.push({
      id, caseNum: n++, isDemo: true,
      companyName: b.companyName, contactName: b.contactName, contactRole: b.contactRole, location: b.location,
      website: b.website, instagram: b.instagram, linkedin: b.linkedin, facebook: b.facebook, otherUrl: b.otherUrl,
      industry: b.industry, businessType: b.businessType, services: "", targetAudience: b.targetAudience,
      positioning: b.positioning,
      researchStatus: "researched",
      score: b.score, needsReview: b.needsReview,
      recommendedService: b.recommendedService, recommendedReason: b.recommendedReason,
      dateAdded, dateResearched,
    });
    activity.push({ id: uid(), type: "prospect_added", prospectId: id, prospectName: b.companyName, timestamp: dateAdded });
    activity.push({ id: uid(), type: "research_completed", prospectId: id, prospectName: b.companyName, timestamp: dateResearched });
  });

  unresearched.forEach((b) => {
    const id = uid();
    const dateAdded = new Date(now - b.daysAgoAdded * day).toISOString();
    prospects.push({
      id, caseNum: n++, isDemo: true,
      companyName: b.companyName, contactName: b.contactName, contactRole: b.contactRole, location: b.location,
      website: b.website, instagram: b.instagram, linkedin: b.linkedin, facebook: b.facebook, otherUrl: b.otherUrl,
      industry: "", businessType: "", services: "", targetAudience: "", positioning: "",
      researchStatus: "not_started",
      score: null, needsReview: false,
      recommendedService: "", recommendedReason: "",
      dateAdded, dateResearched: null,
    });
    activity.push({ id: uid(), type: "prospect_added", prospectId: id, prospectName: b.companyName, timestamp: dateAdded });
  });

  // Phase 3: normalize demo records with transparent score breakdowns and recommendations.
  prospects.forEach((prospect) => {
    if (prospect.researchStatus === "researched") {
      prospect.research = buildResearchFromProspect(prospect);
      const breakdown = calculateLeadQualification(prospect);
      prospect.scoreBreakdown = breakdown;
      prospect.score = breakdown.total;
      prospect.needsReview = breakdown.total < 60;
      prospect.dateQualified = prospect.dateResearched;
      const recommendation = recommendVersaleadsService(prospect);
      prospect.recommendedService = recommendation.recommendedService;
      prospect.recommendedReason = recommendation.recommendedReason;
      prospect.mainOpportunity = recommendation.mainOpportunity;
      prospect.recommendedDeliverables = recommendation.deliverables;
    }
  });
  return { prospects, activity, nextCaseNum: n };
}

/* ---------------- storage layer ---------------- */

async function loadStoredData() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) return JSON.parse(res.value);
    return null;
  } catch (e) {
    return null;
  }
}

async function persistData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), false);
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/* ============================================================
   SHARED UI PRIMITIVES
   ============================================================ */

function Stamp({ qualification, size = "md" }) {
  if (!qualification) {
    return (
      <span className={`stamp stamp-neutral ${size === "sm" ? "stamp-sm" : ""}`}>
        Not Researched
      </span>
    );
  }
  const meta = QUAL_META[qualification];
  return (
    <span
      className={`stamp ${size === "sm" ? "stamp-sm" : ""}`}
      style={{ color: `var(${meta.varName})`, borderColor: `var(${meta.varName})` }}
    >
      {meta.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-state">
      <Icon size={22} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
      <p className="empty-title">{title}</p>
      <p className="empty-body">{body}</p>
      {action}
    </div>
  );
}

function IconLink({ href, icon: Icon, label }) {
  if (!href) return null;
  const url = href.startsWith("http") ? href : href.startsWith("@") ? "#" : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="icon-link"
      title={label + ": " + href}
    >
      <Icon size={14} strokeWidth={1.75} />
      <span>{href}</span>
    </a>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */


/* ============================================================
   PHASE 18 — LEAD DISCOVERY & ACQUISITION ENGINE
   ============================================================ */

const DISCOVERY_CITIES = ["Nairobi","Mombasa","London","New York","San Francisco","Dubai","Toronto","Singapore","Lagos","Johannesburg","Austin","Miami"];
const DISCOVERY_TYPES = [
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
  "Automotive & Mobility"
];

function DiscoveryBadge({ value }) {
  const meta = {
    verified: ["Verified Lead", "signal"],
    needs_review: ["Needs Review", "amber"],
    rejected: ["Rejected", "risk"],
    none: ["No Duplicate", "muted"],
    existing_prospect: ["Existing Prospect", "risk"],
    discovery_inbox: ["Inbox Duplicate", "risk"],
    new: ["New", "brass"],
    approved: ["Approved", "signal"],
    duplicate: ["Duplicate", "risk"],
  }[String(value || '').toLowerCase()] || [String(value || 'Unknown'), "muted"];
  return <span className={`discovery-badge discovery-badge-${meta[1]}`}>{meta[0]}</span>;
}

function DiscoveryEngine({ user, onApproved, onCountChange, onGoToProfile }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("active");
  const [city, setCity] = useState("Nairobi");
  const defaultTypes = (user?.organization?.targetIndustries && user.organization.targetIndustries.length > 0)
    ? user.organization.targetIndustries
    : ["Tech & SaaS", "Financial & Professional Services", "Real Estate & Property"];
  const [types, setTypes] = useState(defaultTypes);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ companyName:"", website:"", location:"", companyType:"Tech & SaaS", contactEmail:"", contactPhone:"" });

  useEffect(() => {
    if (user?.organization?.targetIndustries && user.organization.targetIndustries.length > 0) {
      setTypes(user.organization.targetIndustries);
    }
  }, [user?.organization?.targetIndustries]);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await apiRequest('/api/discovery');
      setLeads(rows);
      onCountChange?.(rows.filter(l=>['new','duplicate'].includes(l.status)).length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const toggleType = (type) => setTypes(current => current.includes(type) ? current.filter(x=>x!==type) : [...current, type]);

  const runSearch = async () => {
    if (!types.length) return setError("Select at least one industry type.");
    setSearching(true); setError(""); setNotice("");
    try {
      const result = await apiRequest('/api/discovery/search', {method:'POST', body:JSON.stringify({city, companyTypes:types, maxPerQuery:6})});
      setNotice(`Discovery completed: ${result.added} lead(s) added from ${result.found} result(s).`);
      await load();
    } catch (e) { setError(e.message); }
    finally { setSearching(false); }
  };

  const updateLead = async (id, action, body={}) => {
    setError(""); setNotice("");
    try {
      const updated = await apiRequest(`/api/discovery/${id}/${action}`, {method:'POST', body:JSON.stringify(body)});
      if (updated?.prospect) return updated;
      setLeads(current => current.map(l => l.id===id ? updated : l));
      onCountChange?.(leads.filter(l=>l.id===id ? false : ['new','duplicate'].includes(l.status)).length);
      return updated;
    } catch (e) { setError(e.message); return null; }
  };

  const deleteDiscoveryLead = async (id) => {
    setError(""); setNotice("");
    try {
      await apiRequest(`/api/discovery/${id}`, { method: 'DELETE' });
      setLeads(current => current.filter(l => l.id !== id));
      onCountChange?.(leads.filter(l => l.id !== id && ['new', 'duplicate'].includes(l.status)).length);
      setNotice("Lead removed from Discovery Inbox.");
    } catch (e) { setError(e.message); }
  };

  const approve = async (lead) => {
    setError(""); setNotice("");
    try {
      const result = await apiRequest(`/api/discovery/${lead.id}/approve`, {method:'POST', body:'{}'});
      setLeads(current => current.map(l=>l.id===lead.id ? {...l,status:'approved',approvedAt:new Date().toISOString()} : l));
      onCountChange?.(leads.filter(l=>l.id!==lead.id && ['new','duplicate'].includes(l.status)).length);
      setNotice(`${lead.companyName} was added to Prospects. Starting automatic research and qualification…`);
      await onApproved?.(result.prospect);
      setNotice(`${lead.companyName} is now in Prospects and has entered the research → qualification workflow.`);
    } catch (e) { setError(e.message); }
  };

  const addManual = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await apiRequest('/api/discovery/manual',{method:'POST',body:JSON.stringify(manual)});
      setManual({ companyName:"", website:"", location:"", companyType:"Tech & SaaS", contactEmail:"", contactPhone:"" });
      setManualOpen(false); setNotice("Lead added to the Discovery Inbox."); await load();
    } catch (e) { setError(e.message); }
  };

  const visible = leads.filter(l => {
    if (filter==="active") return ['new','duplicate'].includes(l.status);
    if (filter==="verified") return l.verificationStatus==='verified' && l.status==='new';
    if (filter==="review") return l.verificationStatus==='needs_review' && l.status==='new';
    if (filter==="duplicates") return l.status==='duplicate';
    if (filter==="approved") return l.status==='approved';
    if (filter==="rejected") return l.status==='rejected';
    return true;
  });

  return <div>
    <div className="page-eyebrow">Lead Acquisition Engine</div>
    <h1 className="page-title">Lead Discovery</h1>
    <p className="page-sub">Discover high-potential business opportunities across all industries, verify domain signals, prevent duplicates, then move approved leads directly into automated research and qualification.</p>

    {/* Active Company Industry & Target ICP Banner */}
    <div style={{
      background: "linear-gradient(135deg, rgba(20, 33, 61, 0.6) 0%, rgba(10, 18, 34, 0.8) 100%)",
      border: "1px solid rgba(252, 163, 17, 0.35)",
      borderRadius: "12px",
      padding: "16px 20px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "14px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "8px",
          background: "rgba(252, 163, 17, 0.15)",
          border: "1px solid var(--brass)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--brass)",
          fontSize: "20px"
        }}>
          🎯
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <strong style={{ color: "#ffffff", fontSize: "14.5px" }}>
              {user?.organization?.name || "Your Company"}
            </strong>
            <span style={{
              background: "rgba(252, 163, 17, 0.15)",
              color: "var(--brass)",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: "600",
              border: "1px solid rgba(252, 163, 17, 0.3)"
            }}>
              {user?.organization?.industry || "Technology & SaaS"}
            </span>
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Targeting Leads in: <strong style={{ color: "var(--text-primary)" }}>{types.slice(0, 3).join(", ")}{types.length > 3 ? ` +${types.length - 3} more` : ""}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={onGoToProfile}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <Sliders size={14} /> Customize Industry & ICP
      </button>
    </div>

    <section className="panel discovery-search-panel">
      <div className="panel-head"><div><h2>Discovery Search</h2><span className="panel-kicker">Multi-industry live search &amp; lead capture</span></div><button className="btn-secondary" onClick={()=>setManualOpen(v=>!v)}><Plus size={14}/> Add Manually</button></div>
      <div className="discovery-search-grid">
        <Field label="Target Hub / City"><select className="input" value={city} onChange={e=>setCity(e.target.value)}>{DISCOVERY_CITIES.map(c=><option key={c}>{c}</option>)}</select></Field>
        <div className="field"><label>Industry Types</label><div className="discovery-type-grid">{DISCOVERY_TYPES.map(type=><label key={type} className={`discovery-type ${types.includes(type)?'discovery-type-active':''}`}><input type="checkbox" checked={types.includes(type)} onChange={()=>toggleType(type)}/><span>{type}</span></label>)}</div></div>
      </div>
      <div className="discovery-search-actions"><button className="btn-primary" disabled={searching} onClick={runSearch}>{searching?<><RefreshCw size={15} className="spin"/>Searching…</>:<><Search size={15}/>Discover Companies</>}</button><span className="muted">Live discovery uses your server-side TAVILY_API_KEY. Manual discovery works anytime without external keys.</span></div>
    </section>

    {manualOpen && <section className="panel discovery-manual"><div className="panel-head"><h2>Add a Discovered Lead</h2><button className="icon-btn" onClick={()=>setManualOpen(false)} aria-label="Close"><X size={15}/></button></div><form className="research-form" onSubmit={addManual}>
      <div className="research-fields">
        <Field label="Company Name"><input className="input" value={manual.companyName} onChange={e=>setManual(m=>({...m,companyName:e.target.value}))} placeholder="Company name"/></Field>
        <Field label="Website"><input className="input" value={manual.website} onChange={e=>setManual(m=>({...m,website:e.target.value}))} placeholder="https://example.com"/></Field>
        <Field label="Location"><input className="input" value={manual.location} onChange={e=>setManual(m=>({...m,location:e.target.value}))} placeholder="e.g. Nairobi, London, New York"/></Field>
        <Field label="Industry / Type"><select className="input" value={manual.companyType} onChange={e=>setManual(m=>({...m,companyType:e.target.value}))}>{DISCOVERY_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
        <Field label="Public Email"><input className="input" value={manual.contactEmail} onChange={e=>setManual(m=>({...m,contactEmail:e.target.value}))} placeholder="Optional"/></Field>
        <Field label="Public Phone"><input className="input" value={manual.contactPhone} onChange={e=>setManual(m=>({...m,contactPhone:e.target.value}))} placeholder="Optional"/></Field>
      </div>
      <div className="form-actions"><button className="btn-primary" type="submit"><Inbox size={15}/>Add to Discovery Inbox</button></div>
    </form></section>}

    {(error || notice) && <div className={error?'discovery-alert discovery-alert-error':'discovery-alert'}>{error || notice}</div>}

    <section className="panel discovery-inbox">
      <div className="panel-head"><div><h2>Discovery Inbox</h2><span className="panel-kicker">{leads.length} discovered · {leads.filter(l=>l.status==='new').length} ready for review</span></div><button className="btn-secondary" onClick={load} disabled={loading}><RefreshCw size={14}/>Refresh</button></div>
      <div className="discovery-filters">{[
        ['active','Active'],['verified','Verified Leads'],['review','Needs Review'],['duplicates','Duplicates'],['approved','Approved'],['rejected','Rejected'],['all','All']
      ].map(([key,label])=><button key={key} className={`filter-chip ${filter===key?'filter-chip-active':''}`} onClick={()=>setFilter(key)}>{label}</button>)}</div>
      {loading ? <EmptyState icon={RefreshCw} title="Loading Discovery Inbox" body="Retrieving discovered companies and verification results."/> :
      visible.length===0 ? <EmptyState icon={Inbox} title="Discovery Inbox is clear" body="Run an industry discovery search or add a company manually. New companies stay here until you approve them."/> :
      <div className="discovery-list">{visible.map(lead=><div className="discovery-row" key={lead.id}>
        <div className="discovery-company">
          <div className="discovery-company-head"><strong>{lead.companyName}</strong><DiscoveryBadge value={lead.status}/><DiscoveryBadge value={lead.verificationStatus}/>{lead.duplicateStatus!=='none'&&<DiscoveryBadge value={lead.duplicateStatus}/>}</div>
          <div className="discovery-meta"><span><MapPin size={12}/>{lead.location || 'Location not confirmed'}</span><span><Building2 size={12}/>{lead.companyType || 'Type needs review'}</span><span><Globe size={12}/>{lead.website || 'No website'}</span></div>
          {lead.sourceSnippet && <p className="discovery-snippet">{lead.sourceSnippet}</p>}
          <div className="discovery-evidence"><span>Source: {lead.discoverySource}</span><span>Discovered {formatDate(lead.discoveredAt)}</span>{lead.contactEmail&&<span>{lead.contactEmail}</span>}{lead.contactPhone&&<span>{lead.contactPhone}</span>}</div>
          {lead.verificationReason && <div className="discovery-reason">{lead.verificationReason}</div>}
          {lead.duplicateReason && <div className="discovery-reason discovery-reason-risk">{lead.duplicateReason}</div>}
        </div>
        <div className="discovery-actions">
          {lead.status==='new' && <><button className="btn-secondary" onClick={()=>updateLead(lead.id,'verify',{verificationStatus:'VERIFIED',reason:'Manually verified as a legitimate target-market company.'})}><CheckCircle2 size={14}/>Verify Lead</button><button className="btn-secondary" onClick={()=>updateLead(lead.id,'verify',{verificationStatus:'NEEDS_REVIEW',reason:'Lead information requires further manual review.'})}><ShieldAlert size={14}/>Flag</button><button className="btn-success" onClick={()=>approve(lead)}><ChevronRight size={14}/>Approve & Qualify</button><button className="icon-btn" title="Reject" onClick={()=>updateLead(lead.id,'reject',{reason:'Rejected during Discovery Inbox review.'})}><X size={15}/></button></>}
          {lead.status==='duplicate' && <div style={{display:'flex',alignItems:'center',gap:8}}><span className="muted">Duplicate prevented</span><button className="icon-btn" title="Remove from inbox" onClick={()=>deleteDiscoveryLead(lead.id)}><Trash2 size={13}/></button></div>}
          {lead.status==='approved' && <span className="muted">Moved to Prospects</span>}
          {lead.status==='rejected' && <div style={{display:'flex',alignItems:'center',gap:8}}><span className="muted">Rejected</span><button className="icon-btn" title="Remove from inbox" onClick={()=>deleteDiscoveryLead(lead.id)}><Trash2 size={13}/></button></div>}
        </div>
      </div>)}</div>}
    </section>
  </div>;
}

function Sidebar({ view, setView, prospectCount, discoveryCount=0, mobileOpen, setMobileOpen, onOpenLanding, user }) {
  const isSuperAdmin = user?.email?.toLowerCase() === "versalylabs@gmail.com";
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "prospects", label: "Prospects", icon: Users },
    { key: "add", label: "Add Prospect", icon: UserPlus },
    { key: "discovery", label: "Lead Discovery", icon: Search },
    { key: "outreach", label: "Outreach", icon: Mail },
    { key: "outreach-tracker", label: "Sequences", icon: ListChecks },
    { key: "billing", label: "Billing & Team", icon: CreditCard },
    ...(isSuperAdmin ? [{ key: "admin", label: "Admin Platform", icon: ShieldAlert, isSpecialAdmin: true }] : []),
    { key: "settings", label: "Industry & ICP", icon: Target },
  ];
  return (
    <>
      {mobileOpen && (
        <button className="sidebar-scrim" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">VERSALEADS</div>
            <div className="brand-sub">Lead Intelligence CRM</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {items.map((it) => {
            const Icon = it.icon;
            const active = view === it.key;
            return (
              <button
                key={it.key}
                className={`nav-item ${active ? "nav-item-active" : ""}`}
                style={it.isSpecialAdmin ? {
                  background: active ? "var(--surface-raised)" : "rgba(252, 163, 17, 0.08)",
                  border: "1px solid rgba(252, 163, 17, 0.35)",
                  color: "var(--brass)",
                  fontWeight: "600"
                } : {}}
                onClick={() => { setView(it.key); setMobileOpen(false); }}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{it.label}</span>
                {it.isSpecialAdmin && <span style={{ fontSize: "9px", background: "var(--brass)", color: "#14213d", padding: "1px 5px", borderRadius: "3px", fontWeight: "700", marginLeft: "auto" }}>SUPER</span>}
                {it.key === 'discovery' && discoveryCount > 0 && <span className="nav-count">{discoveryCount}</span>}
                {active && <span className="nav-tick" />}
              </button>
            );
          })}

          {onOpenLanding && (
            <button
              className="nav-item"
              style={{ marginTop: "14px", borderTop: "1px solid var(--hairline)", paddingTop: "12px", color: "var(--brass)" }}
              onClick={() => { onOpenLanding(); setMobileOpen(false); }}
            >
              <Globe size={16} strokeWidth={1.75} />
              <span>Website & Pricing</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-count">{prospectCount}</div>
          <div className="sidebar-footer-label">active files</div>
        </div>
      </aside>
    </>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <Icon size={14} strokeWidth={1.75} style={{ color: accent ? `var(${accent})` : "var(--text-muted)" }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-underline" style={{ background: accent ? `var(${accent})` : "var(--hairline)" }} />
    </div>
  );
}

function Dashboard({ data, openProspect, setView }) {
  const { prospects, activity } = data;

  const metrics = useMemo(() => {
    const total = prospects.length;
    const researched = prospects.filter((p) => p.researchStatus === "researched").length;
    const high = prospects.filter((p) => getQualification(p.score) === "high").length;
    const strong = prospects.filter((p) => getQualification(p.score) === "strong").length;
    const review = prospects.filter((p) => p.needsReview).length;
    const scored = prospects.filter((p) => typeof p.score === "number");
    const avg = scored.length ? Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length) : null;
    const reachedOut = prospects.filter((p) => ["reached_out", "replied", "follow_up_due", "closed"].includes(getOutreachStatus(p))).length;
    return { total, researched, high, strong, review, avg, reachedOut };
  }, [prospects]);

  const recentResearch = useMemo(
    () =>
      prospects
        .filter((p) => p.researchStatus === "researched")
        .sort((a, b) => new Date(b.dateResearched) - new Date(a.dateResearched))
        .slice(0, 5),
    [prospects]
  );

  const highPriority = useMemo(
    () =>
      prospects
        .filter((p) => getQualification(p.score) === "high")
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [prospects]
  );

  const recentActivity = useMemo(
    () => [...activity].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 7),
    [activity]
  );

  return (
    <div>
      <div className="page-eyebrow">Briefing — {formatDate(new Date().toISOString())}</div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">A live overview of every prospect file currently open in your Versaleads workspace.</p>

      <div className="stat-grid">
        <StatCard label="Total Prospects" value={metrics.total} icon={Users} />
        <StatCard label="Researched" value={metrics.researched} icon={FolderSearch} />
        <StatCard label="High Priority" value={metrics.high} icon={Target} accent="--signal" />
        <StatCard label="Strong Prospects" value={metrics.strong} icon={TrendingUp} accent="--brass" />
        <StatCard label="Requiring Review" value={metrics.review} icon={ShieldAlert} accent="--amber" />
        <StatCard label="Avg. Lead Score" value={metrics.avg ?? "—"} icon={ActivityIcon} />
        <StatCard label="Reached Out" value={metrics.reachedOut} icon={Send} accent="--signal" />
      </div>

      <div className="dash-grid">
        <div className="dash-col-main">
          <section className="panel">
            <div className="panel-head">
              <h2>Recent Research</h2>
              <button className="link-btn" onClick={() => setView("prospects")}>View all <ChevronRight size={13} /></button>
            </div>
            {recentResearch.length === 0 ? (
              <EmptyState icon={FolderSearch} title="No research yet" body="Add prospects or run discovery to start collecting company intelligence." action={<button className="btn-primary" style={{marginTop:12}} onClick={()=>setView("add")}><Plus size={14}/> Add Prospect</button>} />
            ) : (
              <div className="list">
                {recentResearch.map((p) => (
                  <button key={p.id} className="list-row" onClick={() => openProspect(p.id)}>
                    <div className="list-row-main">
                      <span className="mono-tag">{caseNumber(p.caseNum)}</span>
                      <span className="list-row-title">{p.companyName}</span>
                    </div>
                    <div className="list-row-side">
                      <span className="list-row-meta">{relativeTime(p.dateResearched)}</span>
                      <Stamp qualification={getQualification(p.score)} size="sm" />
                      <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>High-Priority Opportunities</h2>
              <button className="link-btn" onClick={() => setView("prospects")}>View all <ChevronRight size={13} /></button>
            </div>
            {highPriority.length === 0 ? (
              <EmptyState icon={Target} title="No high-priority leads" body="Prospects scoring 80 or above will surface here." />
            ) : (
              <div className="list">
                {highPriority.map((p) => (
                  <button key={p.id} className="list-row" onClick={() => openProspect(p.id)}>
                    <div className="list-row-main">
                      <span className="mono-tag">{caseNumber(p.caseNum)}</span>
                      <span className="list-row-title">{p.companyName}</span>
                      <span className="list-row-industry">{p.industry}</span>
                    </div>
                    <div className="list-row-side">
                      <span className="score-pill" style={{ borderColor: "var(--signal)", color: "var(--signal)" }}>{p.score}</span>
                      <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dash-col-side">
          <section className="panel">
            <div className="panel-head"><h2>Quick Actions</h2></div>
            <div className="quick-actions">
              <button className="quick-action" onClick={() => setView("add")}>
                <UserPlus size={16} strokeWidth={1.75} />
                <div>
                  <div className="quick-action-title">Research New Prospect</div>
                  <div className="quick-action-sub">Open a new case file</div>
                </div>
              </button>
              <button className="quick-action" onClick={() => setView("prospects")}>
                <Users size={16} strokeWidth={1.75} />
                <div>
                  <div className="quick-action-title">View All Prospects</div>
                  <div className="quick-action-sub">{metrics.total} files on record</div>
                </div>
              </button>
              <button className="quick-action" onClick={() => setView("outreach-tracker")}>
                <ListChecks size={16} strokeWidth={1.75} />
                <div>
                  <div className="quick-action-title">Track Outreach</div>
                  <div className="quick-action-sub">{metrics.reachedOut} leads contacted</div>
                </div>
              </button>
              <button className="quick-action" onClick={() => setView("prospects-high")}>
                <Target size={16} strokeWidth={1.75} />
                <div>
                  <div className="quick-action-title">View High-Priority Leads</div>
                  <div className="quick-action-sub">{metrics.high} flagged 80+</div>
                </div>
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Recent Activity</h2></div>
            {recentActivity.length === 0 ? (
              <EmptyState icon={ActivityIcon} title="No activity yet" body="Actions across your prospects will appear here." />
            ) : (
              <ul className="activity-feed">
                {recentActivity.map((a) => (
                  <li key={a.id} className="activity-item">
                    <span className="activity-dot" style={{
                      background: a.type === "research_completed" ? "var(--signal)" : "var(--brass)"
                    }} />
                    <div>
                      <div className="activity-text">
                        {a.type === "research_completed" ? "Research completed for " : a.type === "lead_qualified" ? "Lead qualified for " : a.type === "outreach_sent" ? "Reached out to " : "Added new prospect "}
                        <button className="activity-link" onClick={() => openProspect(a.prospectId)}>{a.prospectName}</button>
                      </div>
                      <div className="activity-time">{relativeTime(a.timestamp)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROSPECTS LIST
   ============================================================ */

function ProspectsList({ data, openProspect, setView, initialQualFilter, kenyaOnly = false, onToggleKenyaOnly }) {
  const [search, setSearch] = useState("");
  const [qualFilter, setQualFilter] = useState(initialQualFilter || "all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [outreachFilter, setOutreachFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");

  const industries = useMemo(() => {
    const set = new Set(data.prospects.map((p) => p.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [data.prospects]);

  const filtered = useMemo(() => {
    let list = data.prospects.filter((p) => {
      const matchesSearch =
        !search ||
        p.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (p.location || "").toLowerCase().includes(search.toLowerCase());
      const qual = getQualification(p.score);
      const matchesQual =
        qualFilter === "all" ||
        (qualFilter === "unresearched" ? p.researchStatus !== "researched" : qual === qualFilter);
      const matchesIndustry = industryFilter === "all" || p.industry === industryFilter;
      const matchesOutreach = outreachFilter === "all" || getOutreachStatus(p) === outreachFilter;
      return matchesSearch && matchesQual && matchesIndustry && matchesOutreach;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "score-desc") return (b.score ?? -1) - (a.score ?? -1);
      if (sortBy === "score-asc") return (a.score ?? 999) - (b.score ?? 999);
      if (sortBy === "name") return a.companyName.localeCompare(b.companyName);
      if (sortBy === "date") return new Date(b.dateAdded) - new Date(a.dateAdded);
      return 0;
    });
    return list;
  }, [data.prospects, search, qualFilter, industryFilter, outreachFilter, sortBy]);

  return (
    <div>
      <div className="page-eyebrow">All Files</div>
      <h1 className="page-title">Prospects</h1>
      <p className="page-sub">{filtered.length} of {data.prospects.length} case files shown.</p>

      <div className="toolbar">
        <div className="search-box">
          <Search size={15} strokeWidth={1.75} />
          <input
            placeholder="Search by company or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select" value={qualFilter} onChange={(e) => setQualFilter(e.target.value)}>
          <option value="all">All qualifications</option>
          <option value="high">High Priority</option>
          <option value="strong">Strong Prospect</option>
          <option value="nurture">Nurture</option>
          <option value="low">Low Priority</option>
          <option value="unresearched">Not Researched</option>
        </select>

        <select className="select" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
          <option value="all">All industries</option>
          {industries.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select className="select" value={outreachFilter} onChange={(e) => setOutreachFilter(e.target.value)}>
          <option value="all">All outreach statuses</option>
          {Object.entries(OUTREACH_STATUS_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
        </select>

        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="score-desc">Score: High to Low</option>
          <option value="score-asc">Score: Low to High</option>
          <option value="name">Company Name</option>
          <option value="date">Date Added</option>
        </select>

        <button className="btn-primary" onClick={() => setView("add")}>
          <Plus size={15} strokeWidth={2} /> Add Prospect
        </button>
      </div>

      {data.prospects.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Your workspace is empty"
          body="You don't have any prospects yet. Create your first case file manually or use the Lead Discovery engine to find verified companies."
          action={
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-primary" onClick={() => setView("add")}><Plus size={15} /> Add Prospect</button>
              <button className="btn-ghost" onClick={() => setView("discovery")}><Search size={15} /> Discover Leads</button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No prospects match these filters"
          body="Try clearing a filter, or add a new prospect to start a case file."
          action={<button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(""); setQualFilter("all"); setIndustryFilter("all"); setOutreachFilter("all"); }}>Clear filters</button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Company</th>
                <th>Industry</th>
                <th>Location</th>
                <th>Score</th>
                <th>Qualification</th>
                <th>Recommended Service</th>
                <th>Research Date</th>
                <th>Outreach</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row" onClick={() => openProspect(p.id)}>
                  <td className="mono-tag">{caseNumber(p.caseNum)}</td>
                  <td>
                    <div className="table-company">
                      {p.companyName}
                      {p.isDemo && <span className="demo-badge">DEMO</span>}
                    </div>
                  </td>
                  <td className="muted">{p.industry || "—"}</td>
                  <td className="muted">{p.location || "—"}</td>
                  <td>{typeof p.score === "number" ? <span className="score-num">{p.score}</span> : <span className="muted">—</span>}</td>
                  <td><Stamp qualification={getQualification(p.score)} size="sm" /></td>
                  <td className="muted">{p.recommendedService || "—"}</td>
                  <td className="muted">{p.dateResearched ? formatDate(p.dateResearched) : "—"}</td>
                  <td><OutreachStatusBadge status={getOutreachStatus(p)} /></td>
                  <td><ChevronRight size={14} style={{ color: "var(--text-muted)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ADD PROSPECT FORM
   ============================================================ */

class PageErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Page render error:', error, info); }
  render() {
    if (this.state.error) {
      return <div className="panel page-error-state"><div className="page-eyebrow">Page Error</div><h1 className="page-title">This page could not open</h1><p className="page-sub">{this.props.label || 'This page'} hit an error, but the rest of the app is still available.</p><pre className="form-error diagnostic-error">{this.state.error?.message || 'Unknown rendering error'}</pre><div className="form-actions"><button className="btn-ghost" onClick={() => window.location.reload()}>Reload App</button>{this.props.onBack && <button className="btn-primary" onClick={this.props.onBack}>Back to Prospects</button>}</div></div>;
    }
    return this.props.children;
  }
}

function AddProspect({ onAdd, setView }) {
  const [form, setForm] = useState({ companyName:'', industry:'Tech & SaaS', contactName:'', contactRole:'', email:'', phone:'', location:'', website:'', instagram:'', linkedin:'', facebook:'', otherUrl:'' });
  const [error, setError] = useState('');
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (!form.companyName.trim()) { setError('Company name is required to create a prospect.'); return; }
    Promise.resolve(onAdd({ ...form, companyName: form.companyName.trim() })).catch((err) => setError(err?.message || 'Could not add prospect.'));
  };
  const fields = [
    ['companyName','Company Name','e.g. Apex Technologies, Zenith Health, Nova Corp','text',true],
    ['industry','Industry Sector','e.g. Tech & SaaS, Healthcare, Real Estate, E-Commerce','text',false],
    ['contactName','Contact Name','e.g. Elena Ruiz / Marcus Webb','text',false],
    ['contactRole','Contact Role','e.g. Founder, CEO, Marketing Director','text',false],
    ['email','Email','e.g. name@company.com','email',false],
    ['phone','Phone','e.g. +1 555 0192 / +254 700 000 000','tel',false],
    ['location','Location','e.g. New York, London, Nairobi, Dubai, Singapore','text',false],
  ];
  const online = [
    ['website','Website URL','e.g. company.com'], ['instagram','Instagram URL','e.g. @company'], ['linkedin','LinkedIn URL','e.g. company-page'], ['facebook','Facebook URL','e.g. company'], ['otherUrl','Other Relevant URL','Optional']
  ];
  return <section className="add-prospect-page">
    <div className="page-eyebrow">New Case File</div>
    <h1 className="page-title">Add Prospect</h1>
    <p className="page-sub">Enter what you know. Only the company name is required.</p>
    <form className="panel form-panel" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div><h3 className="form-section-title">Basic Information</h3><div className="form-fields">
          {fields.map(([key,label,placeholder,type,required]) => <div className="field" key={key}><label className="field-label" htmlFor={`add-${key}`}>{label}{required ? <span className="field-required">*</span> : null}</label><input id={`add-${key}`} className="input" type={type} value={form[key]} placeholder={placeholder} onChange={(e)=>update(key,e.target.value)} /></div>)}
        </div></div>
        <div><h3 className="form-section-title">Online Presence</h3><div className="form-fields">
          {online.map(([key,label,placeholder]) => <div className="field" key={key}><label className="field-label" htmlFor={`add-${key}`}>{label}</label><input id={`add-${key}`} className="input" value={form[key]} placeholder={placeholder} onChange={(e)=>update(key,e.target.value)} /></div>)}
        </div></div>
      </div>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      <div className="form-actions"><button type="button" className="btn-ghost" onClick={()=>setView('prospects')}>Cancel</button><button type="submit" className="btn-primary">Add &amp; Open Case File</button></div>
    </form>
  </section>;
}

/* ============================================================
   PROSPECT DETAIL (case file view — stub research section)
   ============================================================ */

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value || <span className="muted">Not provided</span>}</div>
    </div>
  );
}

function buildResearchFromProspect(prospect, websiteResearch = null) {
  const f = (text, sourceType, sourceUrl = '') => ({ text, sourceType, sourceUrl });
  const known = (v, demoType = "user_provided") => v ? [f(v, prospect.isDemo ? demoType : "user_provided")] : [f("Not available from the information currently on file.", "unavailable")];
  const hasSocial = [prospect.instagram, prospect.linkedin, prospect.facebook].some(Boolean);
  const web = websiteResearch || prospect.websiteResearch;
  const webConfirmed = web?.status === 'success';
  const pageFacts = webConfirmed ? web : null;
  const h1Text = pageFacts?.headings?.[0] || '';
  const description = pageFacts?.description || '';
  const title = pageFacts?.title || '';
  const researchedPages = Array.isArray(pageFacts?.pages) ? pageFacts.pages : [];
  const deepEvidence = Array.isArray(pageFacts?.evidence) ? pageFacts.evidence : [];
  const signals = pageFacts?.signals || {};
  const extraPageLabels = researchedPages.slice(1).map((page) => page.label || page.url).filter(Boolean);
  const websiteFinding = pageFacts
    ? [f(`Website research collected ${pageFacts.sourceCount || 1} page source${(pageFacts.sourceCount || 1) === 1 ? '' : 's'} from the company website.`, 'confirmed', pageFacts.finalUrl || prospect.website), ...(title ? [f(`Homepage title: ${title}`, 'observed', pageFacts.finalUrl || prospect.website)] : []), ...(description ? [f(description, 'observed', pageFacts.finalUrl || prospect.website)] : []), ...(extraPageLabels.length ? [f(`Additional pages analyzed: ${extraPageLabels.join(', ')}.`, 'confirmed', pageFacts.finalUrl || prospect.website)] : [])]
    : (prospect.website ? [f(`Website recorded in the case file: ${prospect.website}`, 'user_provided', prospect.website)] : [f('No website was provided.', 'unavailable')]);
  const contentFinding = pageFacts && (title || h1Text || description)
    ? [f(`Website signals found: ${[h1Text, title, description].filter(Boolean).slice(0,2).join(' · ')}`, 'observed', pageFacts.finalUrl || prospect.website), ...researchedPages.slice(1, 4).filter((page) => page.title || page.headings?.[0]).map((page) => f(`${page.label || 'Website page'}: ${page.title || page.headings?.[0]}`, 'observed', page.url))]
    : [f('Content types cannot be verified until website research is run successfully.', 'unavailable')];
  const qualityFinding = pageFacts
    ? [f('Website structure and messaging were successfully extracted. Visual quality still requires human review.', 'observed', pageFacts.finalUrl || prospect.website)]
    : [f('Content quality cannot be verified from links alone.', 'unavailable')];
  const gapFinding = pageFacts
    ? [f('AI suggestion: compare the collected website pages with social content and conversion paths to identify gaps.', 'ai_suggestion'), ...(researchedPages.length < 2 ? [f('Only the homepage was available for automated collection; deeper website coverage may need manual review.', 'unavailable')] : [])]
    : [f('A complete gap analysis requires verified website or social research.', 'unavailable')];
  return {
    companyInformation: {
      industry: known(prospect.industry, 'confirmed'), businessType: known(prospect.businessType, 'confirmed'), location: known(prospect.location),
      services: known(prospect.services, 'confirmed'), targetAudience: known(prospect.targetAudience, 'confirmed'), positioning: known(prospect.positioning, 'observed')
    },
    digitalPresence: {
      websitePresence: websiteFinding,
      socialMediaActivity: pageFacts ? [f(signals.social > 0 ? `Social profile link signals detected (${signals.social}). Posting frequency still requires direct social-source research.` : (hasSocial ? 'Social profile links are recorded in the case file, but no direct social links were detected in analyzed website content.' : 'No social profile links were detected in the analyzed website content.'), signals.social > 0 ? 'observed' : (hasSocial ? 'user_provided' : 'unavailable'), pageFacts.finalUrl || prospect.website)] : [f(hasSocial ? 'Social profile links are recorded. Posting activity has not been independently verified yet.' : 'No social profile links were provided.', hasSocial ? 'user_provided' : 'unavailable')],
      contentTypes: contentFinding,
      videoUsage: pageFacts ? [f(signals.video === 0 ? 'No embedded video signals were detected across the analyzed website pages.' : `Video presence detected with ${signals.video} video-related signal(s) across the analyzed pages.`, signals.video === 0 ? 'confirmed' : 'confirmed', pageFacts.finalUrl || prospect.website)] : [f('Video usage cannot be verified until website research is run successfully.', 'unavailable')],
      brandConsistency: pageFacts ? [f('A website was analyzed, but cross-channel brand consistency needs social-source evidence.', 'unavailable')] : [f('Brand consistency cannot be verified from links alone.', 'unavailable')],
      contentQuality: qualityFinding
    },
    marketingAnalysis: {
      strengths: pageFacts ? [f('A live website is available and yielded extractable business messaging.', 'confirmed', pageFacts.finalUrl || prospect.website)] : (prospect.positioning ? [f('An existing positioning or market focus is recorded in the case file.', prospect.isDemo ? 'observed' : 'user_provided')] : [f('No marketing strength can be verified yet.', 'unavailable')]),
      opportunities: [f(prospect.recommendedReason || (pageFacts ? 'AI suggestion: use the verified website messaging as a base for a more targeted commercial offer.' : (hasSocial || prospect.website ? 'AI suggestion: review the recorded digital presence for marketing gaps and service opportunities.' : 'More information is needed before a specific opportunity can be identified.')), prospect.recommendedReason ? 'observed' : (pageFacts || hasSocial || prospect.website ? 'ai_suggestion' : 'unavailable'))],
      marketingGaps: [...gapFinding, ...deepEvidence.filter((item) => ['video','conversion','trust','content'].includes(item.category)).map((item) => f(item.finding, item.confidence === 'high' ? 'confirmed' : 'observed', item.sourceUrl))],
      contentOpportunities: [...(deepEvidence.length ? deepEvidence.filter((item) => ['video','content','real_estate'].includes(item.category)).map((item) => f(item.finding, item.confidence === 'high' ? 'confirmed' : 'observed', item.sourceUrl)) : []), f(prospect.targetAudience ? 'AI suggestion: build future content around the recorded audience and positioning.' : (pageFacts ? 'AI suggestion: turn the verified website messaging into reusable content themes.' : 'More audience information is needed before suggesting content opportunities.'), prospect.targetAudience || pageFacts ? 'ai_suggestion' : 'unavailable')]
    }
  };
}

async function researchWebsite(url) {
  if (!url) return null;
  return apiRequest(`/api/research/deep?url=${encodeURIComponent(url)}`);
}
const SOURCE_META = { user_provided:"USER PROVIDED", confirmed:"CONFIRMED", observed:"OBSERVED", ai_suggestion:"AI SUGGESTION", unavailable:"UNAVAILABLE" };
function confidenceForFinding(finding) {
  if (finding.sourceType === 'confirmed') return 'High';
  if (finding.sourceType === 'observed') return 'Medium';
  if (finding.sourceType === 'user_provided') return 'Medium';
  if (finding.sourceType === 'ai_suggestion') return 'Low';
  return 'Low';
}
function buildEvidenceLog(prospect, research) {
  const collectedAt = prospect.dateResearched || new Date().toISOString();
  const safe = research || {};
  const sections = [
    ['Company Intelligence', safe.companyInformation],
    ['Digital & Marketing Presence', safe.digitalPresence],
    ['Marketing Analysis', safe.marketingAnalysis],
  ];
  return sections.flatMap(([section, fields]) => Object.entries(fields || {}).flatMap(([finding, items]) =>
    (items || []).filter(item => item.sourceType !== 'unavailable').map(item => ({
      id: `${section}-${finding}-${item.text}`,
      finding: `${finding}: ${item.text}`,
      source: item.sourceType === 'ai_suggestion' ? 'AI analysis' : (item.sourceType === 'user_provided' ? 'Case file' : (item.sourceUrl ? 'Website' : 'Research workflow')),
      sourceUrl: item.sourceUrl || '', evidence: item.text,
      collectedAt, confidence: confidenceForFinding(item), section
    }))
  ));
}
function EvidenceLog({ prospect, research }) {
  const entries = buildEvidenceLog(prospect, research);
  return <section className="research-section evidence-system"><div className="evidence-system-head"><div><div className="research-source-kicker"><ShieldAlert size={13}/> RESEARCH SOURCE & EVIDENCE</div><h3>Research Evidence Log</h3></div><span className="evidence-count">{entries.length} traceable finding{entries.length === 1 ? '' : 's'}</span></div>
    {entries.length ? <div className="evidence-log evidence-log-detailed">{entries.map((entry, i) => <div className="evidence-row evidence-detailed" key={entry.id}><span className="evidence-index">{String(i+1).padStart(2,'0')}</span><div><strong>{entry.finding}</strong><small><b>Source:</b> {entry.source} · <b>Collected:</b> {formatDate(entry.collectedAt)} · <b>Confidence:</b> <span className={`confidence confidence-${entry.confidence.toLowerCase()}`}>{entry.confidence}</span></small><div className="evidence-snippet">{entry.evidence}</div>{entry.sourceUrl && <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="evidence-url"><ExternalLink size={12}/> {entry.sourceUrl}</a>}</div></div>)}</div> : <p className="muted">No traceable evidence has been collected yet. Run research to build the evidence log.</p>}</section>;
}
function ResearchFinding({ finding }) { return <div className="research-finding"><div>{finding.text}</div><span className={`evidence-badge evidence-${finding.sourceType}`}>{SOURCE_META[finding.sourceType]}</span></div>; }
function ResearchSection({ title, fields }) { return <section className="research-section"><h3>{title}</h3><div className="research-fields">{fields.map(([label, items]) => <div className="research-field" key={label}><div className="research-field-label">{label}</div>{items.map((x,i)=><ResearchFinding finding={x} key={i}/>)}</div>)}</div></section>; }

function ProspectDetail({ prospect, onBack, onUpdate, onDelete, onRunResearch, aiAnalysisCard }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(prospect);
  const [researching, setResearching] = useState(false);
  const [researchStage, setResearchStage] = useState(0);

  useEffect(() => { setForm(prospect); setEditing(false); }, [prospect.id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = () => {
    onUpdate(form);
    setEditing(false);
  };

  const runResearch = async () => {
    if (researching) return;
    setResearching(true); setResearchStage(0);
    let websiteResearch = null;
    let websiteError = '';
    try {
      setResearchStage(1);
      if (prospect.website) websiteResearch = await researchWebsite(prospect.website);
      setResearchStage(2);
      await new Promise((resolve) => setTimeout(resolve, 450));
      setResearchStage(2);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setResearchStage(3);
      onRunResearch(prospect.id, websiteResearch, websiteError);
    } catch (error) {
      websiteError = error.message || 'Website could not be researched.';
      setResearchStage(2);
      await new Promise((resolve) => setTimeout(resolve, 450));
      setResearchStage(2);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setResearchStage(3);
      onRunResearch(prospect.id, null, websiteError);
    } finally { setResearching(false); }
  };

  const research = prospect.research || (prospect.researchStatus === "researched" ? buildResearchFromProspect(prospect) : null);

  const qual = getQualification(prospect.score);

  return (
    <div>
      <button className="back-link" onClick={onBack}><ChevronLeft size={15} /> All Prospects</button>

      <div className="detail-header">
        <div>
          <div className="page-eyebrow">
            {caseNumber(prospect.caseNum)}
            {prospect.isDemo && <span className="demo-badge" style={{ marginLeft: 8 }}>DEMO</span>}
          </div>
          <h1 className="page-title">{prospect.companyName}</h1>
          <p className="page-sub">Added {formatDate(prospect.dateAdded)} · {prospect.location || "Location unknown"}</p>
        </div>
        <div className="detail-header-side">
          <Stamp qualification={qual} />
          {!editing ? (
            <>
              <button className="btn-ghost" onClick={() => setEditing(true)}><Pencil size={14} strokeWidth={1.75} /> Edit</button>
              {onDelete && (
                <button
                  className="btn-ghost"
                  style={{ color: "var(--risk)", borderColor: "rgba(239, 68, 68, 0.4)" }}
                  onClick={() => onDelete(prospect.id)}
                  title="Delete this prospect"
                >
                  <Trash2 size={14} strokeWidth={1.75} /> Delete
                </button>
              )}
            </>
          ) : (
            <button className="btn-primary" onClick={save}><Save size={14} strokeWidth={1.75} /> Save Changes</button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          <section className="panel">
            <div className="panel-head"><h2>Basic Information</h2></div>
            {!editing ? (
              <div className="detail-field-grid">
                <DetailField label="Company Name" value={prospect.companyName} />
                <DetailField label="Contact Name" value={prospect.contactName} />
                <DetailField label="Contact Role" value={prospect.contactRole} />
                <DetailField label="Location" value={prospect.location} />
              </div>
            ) : (
              <div className="form-fields form-fields-2col">
                <Field label="Company Name" required>
                  <input className="input" value={form.companyName} onChange={set("companyName")} />
                </Field>
                <Field label="Contact Name"><input className="input" value={form.contactName} onChange={set("contactName")} /></Field>
                <Field label="Contact Role"><input className="input" value={form.contactRole} onChange={set("contactRole")} /></Field>
                <Field label="Location"><input className="input" value={form.location} onChange={set("location")} /></Field>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Online Presence</h2></div>
            {!editing ? (
              <div className="icon-link-list">
                <IconLink href={prospect.website} icon={Globe} label="Website" />
                <IconLink href={prospect.instagram} icon={Share2} label="Instagram" />
                <IconLink href={prospect.linkedin} icon={Share2} label="LinkedIn" />
                <IconLink href={prospect.facebook} icon={Share2} label="Facebook" />
                <IconLink href={prospect.otherUrl} icon={Link2} label="Other" />
                {!prospect.website && !prospect.instagram && !prospect.linkedin && !prospect.facebook && !prospect.otherUrl && (
                  <span className="muted">No online presence recorded yet.</span>
                )}
              </div>
            ) : (
              <div className="form-fields form-fields-2col">
                <Field label="Website URL"><input className="input" value={form.website} onChange={set("website")} /></Field>
                <Field label="Instagram URL"><input className="input" value={form.instagram} onChange={set("instagram")} /></Field>
                <Field label="LinkedIn URL"><input className="input" value={form.linkedin} onChange={set("linkedin")} /></Field>
                <Field label="Facebook URL"><input className="input" value={form.facebook} onChange={set("facebook")} /></Field>
                <Field label="Other Relevant URL"><input className="input" value={form.otherUrl} onChange={set("otherUrl")} /></Field>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Prospect Intelligence Profile</h2>{research && <button className="btn-ghost btn-sm" onClick={runResearch} disabled={researching}><Sparkles size={13} /> {researching ? "Researching…" : "Re-run Research"}</button>}</div>
            {researching ? (
              <div className="research-progress">{["Reviewing prospect information", prospect.website ? "Collecting relevant website pages" : "Checking available digital information", "Extracting page evidence and marketing signals", "Building intelligence profile"].map((label, i) => <div className={`research-stage ${i <= researchStage ? "research-stage-active" : ""}`} key={label}>{i < researchStage ? <CheckCircle2 size={15}/> : <Clock size={15}/>} {label}</div>)}</div>
            ) : research ? (
              <div className="research-dossier">
                <section className="research-source-card">
                  <div className="research-source-head"><div><div className="research-source-kicker"><DatabaseZap size={13}/> WEBSITE RESEARCH</div><strong>{prospect.website ? 'Live website evidence' : 'No website to research'}</strong></div>{prospect.websiteResearch?.status === 'success' ? <span className="evidence-badge evidence-confirmed">FETCHED</span> : <span className="evidence-badge evidence-unavailable">LIMITED</span>}</div>
                  {prospect.websiteResearch?.status === 'success' ? <><div className="research-source-url"><ExternalLink size={13}/><a href={prospect.websiteResearch.finalUrl} target="_blank" rel="noreferrer">{prospect.websiteResearch.finalUrl}</a></div><p>{prospect.websiteResearch.description || 'Website fetched successfully. Structured page evidence is included below.'}</p><div className="evidence-log">{(prospect.websiteResearch.pages || []).map((page, i) => <a key={`${page.url}-${i}`} className="evidence-row" href={page.url} target="_blank" rel="noreferrer"><span className="evidence-index">{String(i + 1).padStart(2, '0')}</span><span><strong>{page.label || 'Website page'}</strong><small>{page.title || page.description || page.headings?.[0] || page.url}</small></span><ExternalLink size={13}/></a>)}</div></> : <p>{prospect.websiteResearch?.error || (prospect.website ? 'The website URL is recorded, but no live website evidence has been collected yet.' : 'Add a website URL to enable live website research.')}</p>}
                </section>
                <ResearchSection title="Company Intelligence" fields={[["Industry", research.companyInformation.industry], ["Business Type", research.companyInformation.businessType], ["Location", research.companyInformation.location], ["Services", research.companyInformation.services], ["Target Audience", research.companyInformation.targetAudience], ["Positioning", research.companyInformation.positioning]]} />
                <ResearchSection title="Digital & Marketing Presence" fields={[["Website Presence", research.digitalPresence.websitePresence], ["Social Media Activity", research.digitalPresence.socialMediaActivity], ["Content Types", research.digitalPresence.contentTypes], ["Video Usage", research.digitalPresence.videoUsage], ["Brand Consistency", research.digitalPresence.brandConsistency], ["Content Quality", research.digitalPresence.contentQuality]]} />
                <ResearchSection title="Marketing Analysis" fields={[["Strengths", research.marketingAnalysis.strengths], ["Opportunities", research.marketingAnalysis.opportunities], ["Potential Marketing Gaps", research.marketingAnalysis.marketingGaps], ["Content Opportunities", research.marketingAnalysis.contentOpportunities]]} />
                <EvidenceLog prospect={prospect} research={research} />
              </div>
            ) : (
              <EmptyState icon={FolderSearch} title="No research on file yet" body="Run research to analyze the prospect information and, when a website is provided, collect live website evidence. Social activity is not claimed unless a supported source is actually connected." action={<button className="btn-primary" onClick={runResearch}><Sparkles size={15} /> Run Research</button>} />
            )}
          </section>
        </div>

        <div className="detail-col-side">
          <section className="panel">
            <div className="panel-head"><h2>Lead Score</h2></div>
            {typeof prospect.score === "number" ? (
              <div className="score-block">
                <div className="score-big" style={{ color: `var(${QUAL_META[qual].varName})` }}>{prospect.score}</div>
                <div className="score-scale">out of 100</div>
                <Stamp qualification={qual} />
                {prospect.needsReview && (
                  <div className="review-flag"><ShieldAlert size={13} strokeWidth={1.75} /> Flagged for review</div>
                )}
                <div className="score-breakdown">
                  {(prospect.scoreBreakdown?.factors || calculateLeadQualification(prospect).factors).map((factor) => (
                    <div className="score-factor" key={factor.key}>
                      <div className="score-factor-head"><span>{factor.label}</span><strong>{factor.score}/{factor.max}</strong></div>
                      <div className="score-factor-track"><span style={{ width: `${(factor.score / factor.max) * 100}%` }} /></div>
                      <p>{factor.explanation}</p>
                    </div>
                  ))}
                </div>
                {prospect.scoreBreakdown?.summary && <div className="qualification-summary">
                  <div className="qualification-summary-item"><span>Qualification confidence</span><strong>{String(prospect.scoreBreakdown.confidence || 'medium').toUpperCase()}</strong></div>
                  <div className="qualification-summary-item"><span>Why this lead?</span><p>{prospect.scoreBreakdown.summary.whyThisLead}</p></div>
                  <div className="qualification-summary-item"><span>Strongest signal</span><p>{prospect.scoreBreakdown.summary.strongestSignal}</p></div>
                  <div className="qualification-summary-item"><span>Biggest unknown</span><p>{prospect.scoreBreakdown.summary.biggestUnknown}</p></div>
                  <div className="qualification-summary-item"><span>Next best action</span><p>{prospect.scoreBreakdown.summary.nextBestAction}</p></div>
                </div>}
                <p className="score-footnote">Score reflects the information currently on file and is explainable by the evidence shown above.</p>
              </div>
            ) : (
              <EmptyState icon={Target} title="Not yet scored" body="Scoring runs automatically once research is complete." />
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Recommended Service</h2></div>
            {prospect.recommendedService ? (
              <div>
                <div className="service-chip">{prospect.recommendedService}</div>
                <div className="recommendation-label">Main opportunity</div>
                <p className="service-reason">{prospect.mainOpportunity || prospect.recommendedReason}</p>
                <div className="recommendation-label">Why this fits</div>
                <p className="service-reason">{prospect.recommendedReason}</p>
                {prospect.recommendationBasis?.length ? <><div className="recommendation-label">Evidence used</div><div className="evidence-basis-list">{prospect.recommendationBasis.map((item,i)=><div key={i}>{item}</div>)}</div></> : null}
                {prospect.recommendationConfidence ? <div className="recommendation-confidence">Recommendation confidence: {String(prospect.recommendationConfidence).toUpperCase()}</div> : null}
                {prospect.recommendedDeliverables?.length ? <div className="deliverable-list">{prospect.recommendedDeliverables.map((item) => <span key={item}>{item}</span>)}</div> : null}
              </div>
            ) : (
              <EmptyState icon={FileText} title="Not yet determined" body="A recommendation will appear once research is complete." />
            )}
          </section>

          {aiAnalysisCard}
          <section className="panel">
            <div className="panel-head"><h2>Timeline</h2></div>
            <div className="timeline">
              <div className="timeline-item">
                <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: "var(--brass)" }} />
                <div>
                  <div className="timeline-title">Added to Versaleads Intelligence</div>
                  <div className="timeline-date">{formatDate(prospect.dateAdded)}</div>
                </div>
              </div>
              <div className="timeline-item">
                {prospect.researchStatus === "researched" ? (
                  <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: "var(--brass)" }} />
                ) : (
                  <Circle size={14} strokeWidth={1.75} style={{ color: "var(--text-muted)" }} />
                )}
                <div>
                  <div className="timeline-title">Research completed</div>
                  <div className="timeline-date">{prospect.dateResearched ? formatDate(prospect.dateResearched) : "Pending"}</div>
                </div>
              </div>
              {prospect.scoreBreakdown && (
                <div className="timeline-item">
                  <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: "var(--signal)" }} />
                  <div><div className="timeline-title">Lead qualified and service recommendation generated</div><div className="timeline-date">{prospect.dateQualified ? formatDate(prospect.dateQualified) : "Current case file"}</div></div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   PHASE 4 — AI OUTREACH ASSISTANT (TRUSTWORTHY TEMPLATE ENGINE)
   ============================================================ */
const OUTREACH_TYPES = [
  { key: 'email', label: 'Cold Email' },
  { key: 'instagram', label: 'Instagram DM' },
  { key: 'linkedin', label: 'LinkedIn Message' },
  { key: 'whatsapp', label: 'WhatsApp Message' },
  { key: 'followup', label: 'Follow-up' },
];

function generateOutreach(prospect, type) {
  const contact = prospect.contactName ? prospect.contactName.split(' ')[0] : '';
  const greeting = contact ? `Hi ${contact},` : 'Hello,';
  const service = prospect.recommendedService || 'growth and marketing support';
  const opportunity = prospect.mainOpportunity || 'an opportunity to strengthen your client acquisition approach';
  const reason = prospect.recommendedReason || 'the commercial intelligence identified in your company profile';
  const company = prospect.companyName;
  const base = `I’m reaching out from Versaleads. While reviewing the information available in your prospect profile for ${company}, we identified ${opportunity.toLowerCase()}. Based on the case file, ${service} looks like the strongest fit because ${reason.toLowerCase()}`;
  const close = `Would you be open to a brief conversation about what this could unlock for ${company}?`;
  if (type === 'email') return { subject: `A growth idea for ${company}`, body: `${greeting}\n\n${base}\n\n${close}\n\nBest,\nVersaleads Outreach Team` };
  if (type === 'instagram') return { subject: '', body: `${greeting}\n\n${base}\n\n${close}` };
  if (type === 'linkedin') return { subject: '', body: `${greeting}\n\nI came across ${company} while researching leaders in your sector for Versaleads. ${base.replace("I’m reaching out from Versaleads. ", '')}\n\n${close}` };
  if (type === 'whatsapp') return { subject: '', body: `${greeting} I’m reaching out from Versaleads. ${base.replace("I’m reaching out from Versaleads. ", '')}\n\n${close}` };
  return { subject: `Following up — ${company}`, body: `${greeting}\n\nJust following up on my earlier message about ${opportunity.toLowerCase()} at ${company}. I thought ${service} could be a practical way to address it.\n\nIf this is relevant to your goals, I’d be glad to share a few insights.\n\nBest,\nVersaleads Outreach Team` };
}

function OutreachAssistant({ data, onUpdateProspect, openProspect, onMarkReachedOut }) {
  const [selectedId, setSelectedId] = useState(data.prospects[0]?.id || '');
  const [type, setType] = useState('email'); const [draft, setDraft] = useState(null); const [copied,setCopied]=useState(false);
  const prospect = data.prospects.find(p=>p.id===selectedId) || data.prospects[0];
  useEffect(() => { if (prospect) setDraft(generateOutreach(prospect, type)); }, [selectedId, type]);
  if(!prospect) return <EmptyState icon={Mail} title="No prospects available" body="Add a prospect before generating outreach."/>;
  const saved = prospect.outreachMessages || [];
  const saveDraft = () => {
    const message = { id: uid(), type, subject: draft?.subject||'', body: draft?.body||'', createdAt:new Date().toISOString(), status:'draft' };
    const status = getOutreachStatus(prospect) === 'not_started' ? 'drafted' : getOutreachStatus(prospect);
    onUpdateProspect({ ...prospect, outreachMessages: [message, ...saved], outreachStatus: status });
  };
  const markReachedOut = () => {
    const now = new Date().toISOString();
    const existing = saved.find((m) => m.body === (draft?.body||'') && m.type === type && m.subject === (draft?.subject||''));
    const message = existing ? { ...existing, status:'sent', sentAt: now } : { id: uid(), type, subject:draft?.subject||'', body:draft?.body||'', createdAt:now, status:'sent', sentAt:now };
    const messages = existing ? saved.map((m)=>m.id===existing.id?message:m) : [message,...saved];
    onMarkReachedOut(prospect, { ...prospect, outreachMessages: messages, outreachStatus:'reached_out', lastOutreachAt:now, nextFollowUpAt:null });
  };
  const copyDraft = async () => { try { await navigator.clipboard.writeText(`${draft.subject ? draft.subject+'\n\n' : ''}${draft.body}`); setCopied(true); setTimeout(()=>setCopied(false),1500); } catch {} };
  return <div>
    <div className="page-eyebrow">Personalized Outreach</div><h1 className="page-title">Outreach Assistant</h1>
    <p className="page-sub">Generate drafts from the information actually stored in each prospect's intelligence profile. Edit every message before sending.</p>
    <div className="outreach-layout"><section className="panel outreach-controls">
      <Field label="Prospect"><select className="input" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{data.prospects.map(p=><option key={p.id} value={p.id}>{p.companyName}</option>)}</select></Field>
      <div className="outreach-current-status"><span>OUTREACH STATUS</span><OutreachStatusBadge status={getOutreachStatus(prospect)} size="md"/></div>
      <div className="outreach-types">{OUTREACH_TYPES.map(t=><button key={t.key} className={`type-btn ${type===t.key?'type-btn-active':''}`} onClick={()=>setType(t.key)}>{t.label}</button>)}</div>
      <div className="outreach-context"><div className="mono-tag">CASE CONTEXT</div><strong>{prospect.recommendedService || 'Research required'}</strong><p>{prospect.mainOpportunity || 'Run research and qualification to give the assistant stronger context.'}</p></div>
      <button className="btn-primary" onClick={()=>setDraft(generateOutreach(prospect,type))}><RefreshCw size={15}/> Regenerate Draft</button>
      <button className="btn-ghost" onClick={()=>openProspect(prospect.id)}>Open Intelligence Profile</button>
    </section>
    <section className="panel outreach-editor"><div className="panel-head"><h2>Draft</h2><span className="stamp stamp-sm">EDITABLE</span></div>
      {type==='email' || type==='followup' ? <Field label="Subject"><input className="input" value={draft?.subject||''} onChange={e=>setDraft({...draft,subject:e.target.value})}/></Field> : null}
      <Field label="Message"><textarea className="input outreach-textarea" value={draft?.body||''} onChange={e=>setDraft({...draft,body:e.target.value})}/></Field>
      <div className="outreach-actions"><button className="btn-primary" onClick={saveDraft}><Save size={15}/> Save Draft</button><button className="btn-ghost" onClick={copyDraft}><Copy size={15}/> {copied?'Copied':'Copy'}</button><button className="btn-success" onClick={markReachedOut}><Send size={15}/> Mark as Reached Out</button></div>
      <div className="trust-note"><ShieldAlert size={14}/> Generated only from information stored in this prospect's case file. No personal or business facts are invented.</div>
    </section></div>
    <section className="panel saved-panel"><div className="panel-head"><h2>Saved Messages</h2></div>{saved.length ? <div className="saved-list">{saved.map(m=><div key={m.id} className="saved-message"><div><strong>{OUTREACH_TYPES.find(t=>t.key===m.type)?.label}</strong><div className="muted">{m.subject || m.body.slice(0,90)}{m.body.length>90?'…':''}</div></div><div className="saved-message-actions">{m.status==='sent'&&<OutreachStatusBadge status="reached_out"/>}<button className="btn-ghost" onClick={()=>setDraft({subject:m.subject,body:m.body})}>Load</button></div></div>)}</div> : <div className="muted">No messages saved for this prospect yet.</div>}</section>
  </div>;
}

const SEQUENCE_BLUEPRINT = [
  { day: 1, type: 'email', label: 'Cold Email' },
  { day: 3, type: 'linkedin', label: 'LinkedIn connection/message' },
  { day: 6, type: 'followup', label: 'Follow-up Email' },
  { day: 10, type: 'instagram', label: 'Instagram DM' },
  { day: 14, type: 'followup', label: 'Final Follow-up' },
];

function buildSequence(prospect) {
  const createdAt = new Date().toISOString();
  return {
    id: uid(), name: '14-Day Prospecting Sequence', createdAt, status: 'drafted',
    steps: SEQUENCE_BLUEPRINT.map((step) => ({ id: uid(), ...step, status: 'drafted', dueAt: null, completedAt: null, message: generateOutreach(prospect, step.type) }))
  };
}

function sequenceStatusFromSteps(steps) {
  if (steps.some(s => s.status === 'replied')) return 'replied';
  if (steps.every(s => s.status === 'closed')) return 'closed';
  if (steps.some(s => s.status === 'follow_up_due')) return 'follow_up_due';
  if (steps.some(s => s.status === 'sent')) return 'reached_out';
  return 'drafted';
}

function OutreachTracker({ data, onUpdateProspect, openProspect }) {
  const [selectedId, setSelectedId] = useState(data.prospects[0]?.id || '');
  const [search, setSearch] = useState('');
  const prospect = data.prospects.find(p => p.id === selectedId) || data.prospects[0];
  const sequence = prospect?.outreachSequence;
  const counts = useMemo(() => Object.keys(OUTREACH_STATUS_META).reduce((acc,key)=>{acc[key]=data.prospects.filter(p=>getOutreachStatus(p)===key).length;return acc;},{}), [data.prospects]);
  const updateSequence = (steps) => {
    const status = sequenceStatusFromSteps(steps);
    const nextDue = steps.find(s => ['follow_up_due','drafted'].includes(s.status) && s.day > 1);
    onUpdateProspect({ ...prospect, outreachSequence: { ...sequence, steps, status }, outreachStatus: status, nextFollowUpAt: nextDue ? (nextDue.dueAt || null) : null });
  };
  const createSequence = () => {
    const created = buildSequence(prospect);
    onUpdateProspect({ ...prospect, outreachSequence: created, outreachStatus: 'drafted' });
  };
  const markStep = (step, status) => {
    const now = new Date().toISOString();
    const steps = sequence.steps.map(s => s.id === step.id ? { ...s, status, completedAt: status === 'sent' || status === 'replied' || status === 'closed' ? now : s.completedAt, dueAt: status === 'follow_up_due' ? (s.dueAt || now) : s.dueAt } : s);
    updateSequence(steps);
  };
  const updateMessage = (stepId, field, value) => updateSequence(sequence.steps.map(s => s.id===stepId ? { ...s, message: { ...s.message, [field]: value } } : s));
  const activeLeads = data.prospects.filter(p => {
    const t=`${p.companyName} ${p.contactName||''}`.toLowerCase(); return !search || t.includes(search.toLowerCase());
  });
  if (!prospect) return <EmptyState icon={ListChecks} title="No prospects available" body="Add a prospect before building an outreach sequence."/>;
  return <div>
    <div className="page-eyebrow">Phase 11 · Outreach Sequences</div><h1 className="page-title">Sequence Campaigns</h1><p className="page-sub">Build and manage a complete multi-step prospecting workflow instead of isolated messages. Every step stays editable and can be tracked from draft through reply or close.</p>
    <div className="tracker-stats">
      <div className="tracker-stat"><Send size={17}/><strong>{(counts.reached_out||0)+(counts.follow_up_due||0)}</strong><span>Active Outreach</span></div>
      <div className="tracker-stat"><Reply size={17}/><strong>{counts.replied||0}</strong><span>Replied</span></div>
      <div className="tracker-stat"><CalendarClock size={17}/><strong>{counts.follow_up_due||0}</strong><span>Follow-up Due</span></div>
      <div className="tracker-stat"><CheckCircle2 size={17}/><strong>{counts.closed||0}</strong><span>Closed</span></div>
    </div>
    <div className="sequence-toolbar panel">
      <Field label="Prospect"><select className="input" value={prospect.id} onChange={e=>setSelectedId(e.target.value)}>{data.prospects.map(p=><option key={p.id} value={p.id}>{p.companyName}</option>)}</select></Field>
      <div className="sequence-toolbar-actions"><OutreachStatusBadge status={getOutreachStatus(prospect)} size="md"/><button className="btn-ghost btn-sm" onClick={()=>openProspect(prospect.id)}>Open Case</button></div>
    </div>
    {!sequence ? <section className="panel sequence-empty"><ListChecks size={22}/><div><h2>Start the 14-day campaign</h2><p>Create the sequence below: Day 1 cold email, Day 3 LinkedIn, Day 6 follow-up email, Day 10 Instagram DM, and Day 14 final follow-up. Drafts are generated from the prospect's recorded case file.</p><button className="btn-primary" onClick={createSequence}><Plus size={15}/> Create Outreach Sequence</button></div></section> : <>
      <section className="sequence-overview panel"><div><div className="mono-tag">CAMPAIGN</div><h2>{sequence.name}</h2><p className="muted">Created {formatDate(sequence.createdAt)} · {sequence.steps.length} planned touchpoints</p></div><div className="sequence-overview-actions"><button className="btn-ghost btn-sm" onClick={createSequence}><RefreshCw size={14}/> Rebuild sequence</button></div></section>
      <div className="sequence-list">{sequence.steps.map((step, index) => <section className="panel sequence-step" key={step.id}>
        <div className="sequence-rail"><span>DAY</span><strong>{step.day}</strong>{index < sequence.steps.length-1 && <i/>}</div>
        <div className="sequence-content"><div className="sequence-step-head"><div><div className="mono-tag">STEP {index+1}</div><h2>{step.label}</h2></div><OutreachStatusBadge status={step.status === 'sent' ? 'reached_out' : step.status}/></div>
          {(step.type==='email' || step.type==='followup') && <Field label="Subject"><input className="input" value={step.message?.subject||''} onChange={e=>updateMessage(step.id,'subject',e.target.value)}/></Field>}
          <Field label="Message"><textarea className="input sequence-message" value={step.message?.body||''} onChange={e=>updateMessage(step.id,'body',e.target.value)}/></Field>
          <div className="sequence-step-actions"><button className="btn-primary btn-sm" onClick={()=>markStep(step,'sent')}><Send size={14}/> Mark Sent</button><button className="btn-ghost btn-sm" onClick={()=>markStep(step,'replied')}><Reply size={14}/> Replied</button><button className="btn-ghost btn-sm" onClick={()=>markStep(step,'follow_up_due')}><CalendarClock size={14}/> Follow-up Due</button><button className="btn-ghost btn-sm" onClick={()=>markStep(step,'closed')}><CheckCircle2 size={14}/> Closed</button></div>
        </div>
      </section>)}</div>
    </>}
    <section className="panel sequence-leads"><div className="panel-head"><div><h2>Campaign Lead Monitor</h2><p className="muted">Quickly review sequence status across your prospect list.</p></div></div><div className="toolbar"><div className="search-box"><Search size={15}/><input placeholder="Search campaign leads…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="tracker-list">{activeLeads.map(p=><div className="sequence-lead-row" key={p.id}><div><strong>{p.companyName}</strong><span>{p.outreachSequence ? `${p.outreachSequence.steps.filter(s=>['sent','replied','closed'].includes(s.status)).length}/${p.outreachSequence.steps.length} steps progressed` : 'No sequence yet'}</span></div><OutreachStatusBadge status={getOutreachStatus(p)}/><button className="btn-ghost btn-sm" onClick={()=>setSelectedId(p.id)}>Manage</button></div>)}</div></section>
  </div>;
}


/* ============================================================
   PHASE 5 — REAL AI INTEGRATION SETTINGS
   Uses an OpenAI-compatible Chat Completions endpoint supplied by the user.
   The API key is kept in browser storage for this local prototype.
   ============================================================ */
function loadAiSettings() {
  try { return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY)) || { endpoint: '', apiKey: '', model: '', enabled: false }; } catch { return { endpoint: '', apiKey: '', model: '', enabled: false }; }
}
function saveAiSettings(settings) { localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings)); }

function normalizeAiList(value) { return Array.isArray(value) ? value.filter(Boolean).map(String) : []; }

function buildAdvancedAiPrompt(prospect, company = null) {
  const evidence = prospect.research ? buildEvidenceLog(prospect, prospect.research).map(({finding,source,sourceUrl,evidence,collectedAt,confidence}) => ({finding,source,sourceUrl,evidence,collectedAt,confidence})) : [];
  const evaluatorCompany = {
    name: company?.name || "Versaleads Enterprise",
    industry: company?.industry || "Technology & B2B Services",
    coreOfferings: company?.companyDescription || company?.valueProposition || "Tailored B2B services and automated client acquisition solutions"
  };
  const facts = {
    evaluatorCompany,
    targetProspect: {
      companyName: prospect.companyName, contactName: prospect.contactName, contactRole: prospect.contactRole,
      location: prospect.location, industry: prospect.industry, businessType: prospect.businessType,
      website: prospect.website, instagram: prospect.instagram, linkedin: prospect.linkedin, facebook: prospect.facebook,
      otherUrl: prospect.otherUrl, targetAudience: prospect.targetAudience, positioning: prospect.positioning,
      qualification: { score: prospect.score, breakdown: prospect.scoreBreakdown, currentRecommendation: prospect.recommendedService },
      research: prospect.research, evidence
    }
  };
  return `You are the chief lead qualification and client acquisition strategist representing "${evaluatorCompany.name}", an enterprise operating in the "${evaluatorCompany.industry}" industry specializing in: "${evaluatorCompany.coreOfferings}".
Analyze the prospect "${prospect.companyName}" (${prospect.industry || 'B2B Business'}) as a potential commercial client/buyer for "${evaluatorCompany.name}".
Analyze ONLY the supplied case-file data and evidence. Never claim to have browsed, searched, compared competitors, or accessed URLs unless the supplied evidence explicitly proves it. Never invent names, competitors, performance metrics, budgets, campaigns, objections, decision makers, or facts. If evidence is missing, say so and mark the point as an AI inference or needs verification.
Return valid JSON only with exactly these keys:
companySummary, marketingGaps, competitorContext, bestServiceToPitch, pitchRationale, leadScoreExplanation, outreachAngle, suggestedDecisionMaker, objections, nextBestActions, confidenceNotes.
Required types:
companySummary string;
marketingGaps array of strings (identify operational, digital, or commercial gaps in the prospect that ${evaluatorCompany.name} solves);
competitorContext object with status (one of "insufficient_evidence" or "case_file_comparison_only"), summary string, competitorSignals array;
bestServiceToPitch object with service string (specifically what service or product ${evaluatorCompany.name} should pitch to ${prospect.companyName}), reason string, deliverables array;
leadScoreExplanation string;
outreachAngle object with headline string, rationale string, openingLine string;
suggestedDecisionMaker object with role string, namedContact string, rationale string;
objections array of objects with objection string, responseStrategy string;
nextBestActions array of strings;
confidenceNotes array of strings.
Keep conclusions concise, commercially actionable, and traceable to the supplied evidence.
CASE FILE: ${JSON.stringify(facts)}`;
}

async function runAiAnalysis(prospect, company = null) {
  const prompt = buildAdvancedAiPrompt(prospect, company);
  const result = await apiRequest('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ prompt }) });
  const parsed = result?.result || {};
  return {
    companySummary: parsed.companySummary || '', marketingGaps: normalizeAiList(parsed.marketingGaps),
    competitorContext: parsed.competitorContext || {status:'insufficient_evidence',summary:'No supported competitor evidence is in the case file.',competitorSignals:[]},
    bestServiceToPitch: parsed.bestServiceToPitch || {service:'',reason:'',deliverables:[]}, leadScoreExplanation: parsed.leadScoreExplanation || '',
    outreachAngle: parsed.outreachAngle || {headline:'',rationale:'',openingLine:''}, suggestedDecisionMaker: parsed.suggestedDecisionMaker || {role:'',namedContact:'',rationale:''},
    objections: Array.isArray(parsed.objections) ? parsed.objections : [], nextBestActions: normalizeAiList(parsed.nextBestActions), confidenceNotes: normalizeAiList(parsed.confidenceNotes),
    generatedAt: new Date().toISOString(), model: result?.model || 'Server-configured model', phase: 'advanced-analysis'
  };
}

function AiSettingsPage() {
  return <div><div className="page-eyebrow">Universal Intelligence Engine</div><h1 className="page-title">AI Settings</h1><p className="page-sub">AI requests run securely through the Versaleads backend. API credentials are encrypted in server environment variables and never exposed to the browser.</p><section className="panel ai-settings-panel"><div className="trust-note"><ShieldAlert size={15}/> Configure AI_ENDPOINT, AI_API_KEY, and AI_MODEL in the backend environment when you are ready. The browser sends only authenticated case-file analysis requests.</div><p className="muted">This architecture protects provider credentials, ensures tenant data isolation, and delivers cross-industry prospecting intelligence.</p></section></div>;
}

function AiAnalysisCard({ prospect, onUpdate, user }) {
  const [running,setRunning]=useState(false); const [error,setError]=useState('');
  const analysis=prospect.aiAnalysis;
  const run=async()=>{ setError(''); setRunning(true); try { const result=await runAiAnalysis(prospect, user?.organization); onUpdate({...prospect, aiAnalysis:result, aiStatus:'complete'}); } catch(e){setError(e.message);} finally{setRunning(false);} };
  const gapItems = analysis?.marketingGaps || analysis?.opportunities || [];
  return <section className="panel advanced-ai-panel"><div className="panel-head"><div><div className="research-source-kicker"><BrainCircuit size={13}/> PHASE 10 · ADVANCED AI ANALYSIS</div><h2>Strategic Intelligence</h2></div><span className="stamp stamp-sm">AI + EVIDENCE</span></div>
    <div style={{
      background: "rgba(252, 163, 17, 0.08)",
      border: "1px solid rgba(252, 163, 17, 0.25)",
      borderRadius: "6px",
      padding: "6px 12px",
      fontSize: "12px",
      color: "var(--brass)",
      marginBottom: "14px",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    }}>
      🎯 Tailored for: <strong>{user?.organization?.name || "Your Company"}</strong> ({user?.organization?.industry || "Technology & SaaS"})
    </div>
    {analysis ? <div className="advanced-ai-result">
      <div className="ai-summary-card"><div className="recommendation-label">Company summary</div><p className="ai-summary">{analysis.companySummary || analysis.intelligenceSummary}</p></div>
      <div className="ai-grid">
        <div className="ai-module"><div className="recommendation-label">Marketing gaps</div>{gapItems.length ? gapItems.map((x,i)=><div className="finding finding-ai" key={i}>AI INFERENCE · {x}</div>) : <p className="muted">No supported gaps were returned.</p>}</div>
        <div className="ai-module"><div className="recommendation-label">Competitor context</div><p>{analysis.competitorContext?.summary || 'No competitor analysis is available in this older analysis record.'}</p><span className="evidence-badge evidence-unavailable">{analysis.competitorContext?.status === 'case_file_comparison_only' ? 'CASE-FILE COMPARISON ONLY' : 'INSUFFICIENT EVIDENCE'}</span></div>
        <div className="ai-module ai-service-module"><div className="recommendation-label">Best service to pitch</div><strong>{analysis.bestServiceToPitch?.service || analysis.recommendedService || 'Needs analysis'}</strong><p>{analysis.bestServiceToPitch?.reason || analysis.recommendedReason}</p>{(analysis.bestServiceToPitch?.deliverables || analysis.suggestedDeliverables || []).length ? <div className="deliverable-list">{(analysis.bestServiceToPitch?.deliverables || analysis.suggestedDeliverables || []).map((x,i)=><span key={i}>{x}</span>)}</div>:null}</div>
        <div className="ai-module"><div className="recommendation-label">Why this lead scored this way</div><p>{analysis.leadScoreExplanation || 'Re-run advanced analysis to receive an evidence-aware score explanation.'}</p></div>
        <div className="ai-module"><div className="recommendation-label">Best outreach angle</div><strong>{analysis.outreachAngle?.headline || 'Needs analysis'}</strong><p>{analysis.outreachAngle?.rationale}</p>{analysis.outreachAngle?.openingLine && <div className="ai-opening-line">“{analysis.outreachAngle.openingLine}”</div>}</div>
        <div className="ai-module"><div className="recommendation-label">Suggested decision-maker</div><strong>{analysis.suggestedDecisionMaker?.namedContact || 'No named contact verified'}</strong><p>{analysis.suggestedDecisionMaker?.role}{analysis.suggestedDecisionMaker?.rationale ? ` · ${analysis.suggestedDecisionMaker.rationale}` : ''}</p></div>
      </div>
      <div className="ai-grid ai-grid-bottom"><div className="ai-module"><div className="recommendation-label">Likely objections</div>{(analysis.objections||[]).length ? analysis.objections.map((x,i)=><div className="objection-card" key={i}><strong>{x.objection}</strong><span>{x.responseStrategy}</span></div>) : <p className="muted">No objection analysis is available yet.</p>}</div><div className="ai-module"><div className="recommendation-label">Next best actions</div>{(analysis.nextBestActions||[]).map((x,i)=><div className="finding" key={i}>{i+1}. {x}</div>)}</div></div>
      {(analysis.confidenceNotes||[]).length ? <div className="ai-confidence"><ShieldAlert size={14}/><div><strong>Confidence notes</strong>{analysis.confidenceNotes.map((x,i)=><span key={i}>{x}</span>)}</div></div> : null}
      <div className="ai-generated-meta">Generated {formatDate(analysis.generatedAt)} · Model: {analysis.model || 'Unknown'}</div>
    </div> : <div className="ai-empty"><BrainCircuit size={20}/><div><strong>No advanced AI analysis yet</strong><p>Generate an evidence-aware strategic analysis covering marketing gaps, pitch strategy, decision-maker guidance, objections, score explanation, and next actions.</p></div></div>}
    <div className="outreach-actions"><button className="btn-primary" disabled={running} onClick={run}><BrainCircuit size={15}/> {running?'Analyzing evidence…':analysis?'Re-run Advanced Analysis':'Run Advanced Analysis'}</button></div>{error&&<div className="form-error">{error}</div>}
  </section>;
}

/* ============================================================
   PHASE 7 — DATA SAFETY & APP POLISH
   ============================================================ */
function normalizeStoredData(stored) {
  if (!stored || !Array.isArray(stored.prospects)) return null;
  return {
    ...stored,
    prospects: stored.prospects.map((prospect, index) => ({
      ...prospect,
      caseNum: prospect.caseNum ?? index + 1,
      researchStatus: prospect.researchStatus || (prospect.research ? "researched" : "not_started"),
      outreachMessages: Array.isArray(prospect.outreachMessages) ? prospect.outreachMessages : [],
      outreachStatus: prospect.outreachStatus || (Array.isArray(prospect.outreachMessages) && prospect.outreachMessages.length ? "drafted" : "not_started"),
      lastOutreachAt: prospect.lastOutreachAt || null,
      nextFollowUpAt: prospect.nextFollowUpAt || null,
      activity: prospect.activity || [],
      outreachSequence: prospect.outreachSequence || null,
    })),
    activity: Array.isArray(stored.activity) ? stored.activity : [],
    nextCaseNum: stored.nextCaseNum || (stored.prospects.length + 1),
  };
}

/* ============================================================
   APP SHELL
   ============================================================ */

function AuthScreen({ onAuthenticated, initialMode = 'login', initialEmail = '', initialPlan = '', onBackToLanding }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name:'', email: initialEmail || '', password:'' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialEmail) setForm(f => ({ ...f, email: initialEmail }));
  }, [initialMode, initialEmail]);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await apiRequest(`/api/auth/${mode}`, { method:'POST', body:JSON.stringify(form) }, null);
      localStorage.setItem(AUTH_TOKEN_KEY, result.token); localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      onAuthenticated(result.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="auth-shell"><style>{globalStyles}</style><form className="auth-card" onSubmit={submit}>
    {onBackToLanding && (
      <button type="button" className="link-btn" style={{ alignSelf: 'flex-start', marginBottom: '4px' }} onClick={onBackToLanding}>
        ← Back to Website
      </button>
    )}
    <div className="brand-mark auth-mark">V</div><div className="page-eyebrow">Versaleads Lead Intelligence</div><h1 className="page-title">{mode==='login'?'Welcome back':'Create your workspace'}</h1>
    <p className="page-sub">{mode==='login' ? 'Sign in to access your private cross-industry lead intelligence CRM.' : 'Start your 14-day full access trial. No credit card required.'}</p>
    {mode==='register' && (
      <div style={{ background: "rgba(252, 163, 17, 0.12)", border: "1px solid rgba(252, 163, 17, 0.35)", borderRadius: "8px", padding: "10px 14px", fontSize: "12.5px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Sparkles size={15} color="#fca311" />
        <span><strong>14-Day Free Trial Active</strong>{initialPlan ? ` (${initialPlan.toUpperCase()} Plan)` : ""} · Full engine access</span>
      </div>
    )}
    {mode==='register' && <Field label="Name"><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" /></Field>}
    <Field label="Email" required><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@company.com" required /></Field>
    <Field label="Password" required><input className="input" type="password" minLength="8" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="At least 8 characters" required /></Field>
    {error && <div className="form-error">{error}</div>}
    <button className="btn-primary auth-submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign In':'Start 14-Day Free Trial'}</button>
    <button type="button" className="link-btn auth-switch" onClick={()=>{setMode(m=>m==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account (14-day free trial)':'I already have an account'}</button>
  </form></div>;
}

export default function App() {
  const [pageMode, setPageMode] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash === "#app" && localStorage.getItem(AUTH_TOKEN_KEY)) return "app";
      if (hash === "#auth") return "auth";
    }
    return "landing";
  });
  const [authConfig, setAuthConfig] = useState({ mode: 'login', email: '', plan: 'growth' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch { return null; } });
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kenyaOnly, setKenyaOnly] = useState(false);
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [billingStatus, setBillingStatus] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallError, setPaywallError] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [legalTab, setLegalTab] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || (window.location.hash.includes('token=') ? window.location.hash.split('token=')[1]?.split('&')[0] : null);
      if (token) {
        apiRequest(`/api/team/invites/${token}`)
          .then((res) => {
            if (res?.invite) {
              setPendingInvite({ ...res.invite, token });
            }
          })
          .catch((err) => {
            console.warn('Invite token verification notice:', err.message);
          });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    try {
      setAcceptingInvite(true);
      const res = await apiRequest('/api/team/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token: pendingInvite.token }),
      });
      alert(res.message || 'Successfully joined workspace!');
      setPendingInvite(null);
      window.history.replaceState({}, document.title, window.location.pathname);
      const me = await apiRequest('/api/auth/me');
      setUser(me.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me.user));
      await Promise.all([refreshProspects(), refreshBillingStatus()]);
      setView('dashboard');
    } catch (err) {
      alert(err.message || 'Failed to accept invitation');
    } finally {
      setAcceptingInvite(false);
    }
  };

  const refreshBillingStatus = async () => {
    try {
      const res = await apiRequest('/api/billing/status');
      setBillingStatus(res);
    } catch {
      // ignore
    }
  };

  const handleApiError = (e) => {
    if (e.status === 402 || e.status === 403 || e.code === 'QUOTA_EXCEEDED' || e.code === 'TRIAL_EXPIRED' || e.code === 'SUBSCRIPTION_INACTIVE') {
      setPaywallError(e.payload || { message: e.message, code: e.code });
      setPaywallOpen(true);
    } else {
      alert(e.message);
    }
  };

  const refreshProspects = async () => {
    const prospects = await apiRequest('/api/prospects');
    setData({ prospects: prospects.map((p, i) => normalizeProspect({ ...p, caseNum: p.caseNum ?? i + 1 })), activity: [], nextCaseNum: prospects.length + 1 });
  };

  const refreshDiscoveryCount = async () => {
    try {
      const leads = await apiRequest('/api/discovery');
      setDiscoveryCount(leads.filter(l => ['new','duplicate'].includes(l.status)).length);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) { setAuthReady(true); setLoading(false); return; }
      try {
        const me = await apiRequest('/api/auth/me');
        setUser(me.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me.user));
        await refreshProspects();
        await refreshDiscoveryCount();
        await refreshBillingStatus();
      }
      catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
      }
      finally { setAuthReady(true); setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (user && authReady) {
      refreshProspects().catch(console.error);
      refreshDiscoveryCount();
      refreshBillingStatus();
    }
  }, [user]);

  const authenticate = async (authenticatedUser) => {
    setUser(authenticatedUser); setAuthReady(true); setLoading(true);
    try {
      await refreshProspects();
      await refreshBillingStatus();
    } finally { setLoading(false); }
  };
  const logout = () => { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); setUser(null); setData(null); setSelectedId(null); setView('dashboard'); setPageMode('landing'); };

  const handleSwitchWorkspace = async (organizationId) => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/auth/switch-workspace', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });
      if (res?.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, res.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
        setUser(res.user);
        await refreshProspects();
        await refreshDiscoveryCount();
        await refreshBillingStatus();
      }
    } catch (err) {
      alert(`Could not switch workspace: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openProspect = (id) => { setSelectedId(id); setView("detail"); };
  const persistProspect = async (prospect, method = 'PATCH') => {
    const payload = buildPersistPayload(prospect);
    const path = method === 'POST' ? '/api/prospects' : `/api/prospects/${prospect.id}`;
    return apiRequest(path, { method, body: JSON.stringify(payload) });
  };

  const handleAdd = async (form) => {
    const nowIso = new Date().toISOString();
    const draft = { id: uid(), caseNum: data?.nextCaseNum || 1, isDemo:false, ...form, country:form.country || 'Global', industry:form.industry || '', businessType:form.businessType || '', services:form.services || '', targetAudience:form.targetAudience || '', positioning:form.positioning || '', researchStatus:'not_started', research:null, score:null, needsReview:false, recommendedService:'', recommendedReason:'', dateAdded:nowIso, dateResearched:null, outreachMessages:[], outreachSequence:null, outreachStatus:'not_started', lastOutreachAt:null, nextFollowUpAt:null };
    try {
      const created = normalizeProspect(await persistProspect(draft, 'POST'));
      setData(prev => ({ ...prev, prospects:[...prev.prospects, created], activity:[...prev.activity,{id:uid(),type:'prospect_added',prospectId:created.id,prospectName:created.companyName,timestamp:nowIso}], nextCaseNum:prev.nextCaseNum+1 }));
      setSelectedId(created.id);
      setView('detail');
      refreshBillingStatus();
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleRunResearch = async (id, websiteResearch = null, websiteError = '') => {
    const nowIso = new Date().toISOString();
    let target = data?.prospects?.find((p) => p.id === id);
    if (!target) {
      try { target = await apiRequest(`/api/prospects/${id}`); } catch (e) { alert(e.message); return null; }
    }
    const websiteResearchRecord = websiteResearch ? { ...websiteResearch, status:'success', researchedAt:nowIso } : (target.website ? { status:'failed', error:websiteError || 'Live website research could not be completed. The profile uses available case-file data only.', researchedAt:nowIso } : null);
    const candidateForResearch = { ...target, websiteResearch:websiteResearchRecord };
    const research = buildResearchFromProspect(candidateForResearch, websiteResearchRecord);
    const candidate = { ...candidateForResearch, researchStatus:websiteError?'needs_review':'researched', research, dateResearched:nowIso };
    const scoreBreakdown = calculateLeadQualification(candidate);
    const recommendation = recommendVersaleadsService(candidate);
    const qualified = { ...candidate, score:scoreBreakdown.total, scoreBreakdown, needsReview:scoreBreakdown.total<60, dateQualified:nowIso, ...recommendation, recommendedDeliverables:recommendation.deliverables };
    setData(prev => prev ? ({ ...prev, prospects:prev.prospects.map(p=>p.id===id?qualified:p) }) : prev);
    try {
      const saved = normalizeProspect(await persistProspect(qualified));
      setData(prev => prev ? ({ ...prev, prospects:prev.prospects.map(p=>p.id===id?{...saved,caseNum:p.caseNum}:p), activity:[...prev.activity,{id:uid(),type:'research_completed',prospectId:id,prospectName:target.companyName,timestamp:nowIso},{id:uid(),type:'lead_qualified',prospectId:id,prospectName:target.companyName,timestamp:nowIso}] }) : prev);
      return saved;
    } catch (e) {
      console.error(e);
      alert(`Research completed locally but could not be saved: ${e.message}`);
      return qualified;
    }
  };

  const handleApproveDiscovery = async (created) => {
    if (!created?.id) return;
    setData(prev => prev ? ({ ...prev, prospects:[...prev.prospects.filter(p=>p.id!==created.id), normalizeProspect({...created, caseNum:prev.nextCaseNum})], activity:[...prev.activity,{id:uid(),type:'prospect_added',prospectId:created.id,prospectName:created.companyName,timestamp:new Date().toISOString()}], nextCaseNum:prev.nextCaseNum+1 }) : prev);
    let websiteResearch = null, websiteError = '';
    if (created.website) {
      try { websiteResearch = await researchWebsite(created.website); }
      catch (e) { websiteError = e.message || 'Website research could not be completed.'; }
    }
    await handleRunResearch(created.id, websiteResearch, websiteError);
    await refreshDiscoveryCount();
  };

  const handleMarkReachedOut = async (_previous, updated) => {
    setData(prev => ({ ...prev, prospects:prev.prospects.map(p=>p.id===updated.id?updated:p) }));
    try { const saved = normalizeProspect(await persistProspect(updated)); setData(prev => ({ ...prev, prospects:prev.prospects.map(p=>p.id===updated.id?saved:p), activity:[...prev.activity,{id:uid(),type:'outreach_sent',prospectId:updated.id,prospectName:updated.companyName,timestamp:updated.lastOutreachAt||new Date().toISOString()}] })); } catch (e) { alert(e.message); }
  };
  const handleUpdate = async (updated) => {
    setData(prev => ({ ...prev, prospects:prev.prospects.map(p=>p.id===updated.id?updated:p) }));
    try { const saved = normalizeProspect(await persistProspect(updated)); setData(prev => ({ ...prev, prospects:prev.prospects.map(p=>p.id===updated.id?saved:p) })); } catch (e) { console.error(e); alert(`Could not save changes: ${e.message}`); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prospect? This action cannot be undone.")) return;
    try {
      await apiRequest(`/api/prospects/${id}`, { method: 'DELETE' });
      setData(prev => ({
        ...prev,
        prospects: prev.prospects.filter(p => p.id !== id),
        activity: prev.activity.filter(a => a.prospectId !== id)
      }));
      setView('prospects');
    } catch (err) {
      alert(`Could not delete prospect: ${err.message}`);
    }
  };

  if (pageMode === 'landing') {
    return (
      <LandingPage
        user={user}
        onOpenLogin={() => {
          setAuthConfig({ mode: 'login', email: '', plan: '' });
          setPageMode('auth');
        }}
        onStartTrial={({ email, plan }) => {
          setAuthConfig({ mode: 'register', email: email || '', plan: plan || 'growth' });
          setPageMode('auth');
        }}
        onGoToApp={() => setPageMode('app')}
        onGoToAdmin={() => {
          setPageMode('app');
          setView('admin');
        }}
        onLogout={logout}
      />
    );
  }

  if (pageMode === 'auth' || !user) {
    return (
      <>
        {pendingInvite && (
          <AcceptInviteModal
            invite={pendingInvite}
            currentUser={user}
            onAccept={handleAcceptInvite}
            onDecline={() => setPendingInvite(null)}
            loading={acceptingInvite}
            onRequireAuth={(email) => {
              setAuthConfig({ mode: 'login', email: email || pendingInvite.email, plan: 'growth' });
              setPageMode('auth');
            }}
          />
        )}
        <AuthScreen
          initialMode={authConfig.mode}
          initialEmail={authConfig.email}
          initialPlan={authConfig.plan}
          onBackToLanding={() => setPageMode('landing')}
          onAuthenticated={(authenticatedUser) => {
            authenticate(authenticatedUser);
            setPageMode('app');
          }}
        />
      </>
    );
  }

  if (!authReady) return <div className="app-loading"><style>{globalStyles}</style><div className="loading-mark">V</div><div className="loading-text">Connecting to Versaleads…</div></div>;
  if (loading || !data) return <div className="app-loading"><style>{globalStyles}</style><div className="loading-mark">V</div><div className="loading-text">Opening your case files…</div></div>;
  const selectedProspect = data.prospects.find((p) => p.id === selectedId);
  return <div className="app-root"><style>{globalStyles}</style>
    <button className="mobile-menu-btn" aria-label="Open navigation menu" onClick={()=>setMobileOpen(true)}><LayoutDashboard size={16}/> Menu</button>
    <Sidebar
      view={view === 'prospects-high' ? 'prospects' : view === 'detail' ? 'prospects' : view}
      setView={setView}
      prospectCount={data.prospects.length}
      discoveryCount={discoveryCount}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      onOpenLanding={() => setPageMode('landing')}
      user={user}
    />
    <main className="main-content"><div className="main-inner">
      <div className="session-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>Signed in as <strong>{user.name || user.email}</strong></span>
          {user?.workspaces && user.workspaces.length > 1 ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Workspace:</span>
              <select
                value={user.organization?.id}
                onChange={(e) => handleSwitchWorkspace(e.target.value)}
                style={{
                  background: 'rgba(20, 33, 61, 0.9)',
                  color: 'var(--brass)',
                  border: '1px solid var(--hairline)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {user.workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} style={{ background: '#14213d', color: '#ffffff' }}>
                    {ws.name} ({ws.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Workspace: <strong>{user?.organization?.name || "Primary"}</strong>
            </span>
          )}
          {billingStatus && (
            <span
              onClick={() => setView('billing')}
              title="Click to view workspace billing"
              style={{
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: billingStatus.subscriptionStatus === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(252, 163, 17, 0.15)',
                color: billingStatus.subscriptionStatus === 'ACTIVE' ? '#22c55e' : '#fca311',
                border: `1px solid ${billingStatus.subscriptionStatus === 'ACTIVE' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(252, 163, 17, 0.4)'}`,
                fontFamily: 'IBM Plex Mono, monospace'
              }}
            >
              {billingStatus.plan} · {billingStatus.isTrialing ? `${billingStatus.daysRemainingInTrial}d trial` : billingStatus.subscriptionStatus}
            </span>
          )}
        </div>
        {user?.email?.toLowerCase() === 'versalylabs@gmail.com' && (
          <button
            className="link-btn"
            style={{ color: "var(--brass)", fontWeight: "700" }}
            onClick={() => setView('admin')}
          >
            🛡️ Admin Platform
          </button>
        )}
        <button className="link-btn" onClick={() => setView('billing')}>💳 Billing & Team</button>
        <button className="link-btn" onClick={() => setLegalTab('terms')}>⚖️ Legal & Privacy</button>
        <button className="link-btn" onClick={() => setPageMode('landing')}>🌐 View Website & Pricing</button>
        <button className="link-btn" onClick={logout}>Sign out</button>
      </div>

      <LegalModal
        isOpen={!!legalTab}
        onClose={() => setLegalTab(null)}
        initialTab={legalTab || "terms"}
      />

      <TrialBanner billingStatus={billingStatus} onOpenBilling={() => setView('billing')} />

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        paywallError={paywallError}
        onSelectPlan={(_p) => setView('billing')}
      />

      {pendingInvite && (
        <AcceptInviteModal
          invite={pendingInvite}
          currentUser={user}
          onAccept={handleAcceptInvite}
          onDecline={() => setPendingInvite(null)}
          loading={acceptingInvite}
          onRequireAuth={(email) => {
            setAuthConfig({ mode: 'login', email: email || pendingInvite.email, plan: 'growth' });
            setPageMode('auth');
          }}
        />
      )}

      {view==='dashboard' && <PageErrorBoundary key="dashboard-page" label="The dashboard" onBack={()=>setView('prospects')}><Dashboard data={data} openProspect={openProspect} setView={setView}/></PageErrorBoundary>}
      {view==='admin' && <PageErrorBoundary key="admin-page" label="Admin Platform" onBack={()=>setView('dashboard')}><AdminPlatformPage user={user} onGoToApp={()=>setView('dashboard')} apiRequest={apiRequest}/></PageErrorBoundary>}
      {view==='prospects' && <PageErrorBoundary key="prospects-page" label="The prospects list"><ProspectsList data={data} openProspect={openProspect} setView={setView}/></PageErrorBoundary>}
      {view==='prospects-high' && <PageErrorBoundary key="prospects-high-page" label="The high-priority list" onBack={()=>setView('prospects')}><ProspectsList data={data} openProspect={openProspect} setView={setView} initialQualFilter="high"/></PageErrorBoundary>}
      {view==='add' && <PageErrorBoundary key="add-prospect-page" label="The Add Prospect page" onBack={()=>setView('prospects')}><AddProspect onAdd={handleAdd} setView={setView}/></PageErrorBoundary>}
      {view==='discovery' && <PageErrorBoundary key="discovery-page" label="Discovery" onBack={()=>setView('prospects')}><DiscoveryEngine user={user} onApproved={handleApproveDiscovery} onCountChange={setDiscoveryCount} onGoToProfile={()=>setView('settings')}/></PageErrorBoundary>}
      {view==='outreach' && <PageErrorBoundary key="outreach-page" label="Outreach" onBack={()=>setView('prospects')}><OutreachAssistant data={data} onUpdateProspect={handleUpdate} openProspect={openProspect} onMarkReachedOut={handleMarkReachedOut}/></PageErrorBoundary>}
      {view==='outreach-tracker' && <PageErrorBoundary key="outreach-tracker-page" label="The outreach tracker" onBack={()=>setView('prospects')}><OutreachTracker data={data} onUpdateProspect={handleUpdate} openProspect={openProspect}/></PageErrorBoundary>}
      {view==='billing' && <PageErrorBoundary key="billing-page" label="Billing & Workspace" onBack={()=>setView('dashboard')}><BillingWorkspacePage user={user} onSwitchWorkspace={handleSwitchWorkspace} apiRequest={apiRequest} onSelectPlan={() => {}} onOpenPortal={() => {}} /></PageErrorBoundary>}
      {view==='settings' && <PageErrorBoundary key="settings-page" label="Company & ICP Profile" onBack={()=>setView('prospects')}><CompanyProfilePage user={user} onUpdateUser={setUser} apiRequest={apiRequest} onGoToDiscovery={()=>setView('discovery')}/></PageErrorBoundary>}
      {view==='detail' && selectedProspect && <PageErrorBoundary key={`detail-page-${selectedProspect.id}`} label="This case file" onBack={()=>setView('prospects')}><ProspectDetail prospect={selectedProspect} onBack={()=>setView('prospects')} onUpdate={handleUpdate} onDelete={handleDelete} onRunResearch={handleRunResearch} aiAnalysisCard={<AiAnalysisCard prospect={selectedProspect} onUpdate={handleUpdate} user={user}/>}/></PageErrorBoundary>}
    </div></main></div>;
}

/* ============================================================
   STYLES
   ============================================================ */

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

@font-face {
  font-family: 'Glorase';
  src: url('/fonts/Glorase-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Glorase';
  src: url('/fonts/Glorase-Italic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Glorase', serif;
  font-weight: 400;
}

:root {
  --ink: #080e1a;
  --surface: #14213d;
  --surface-raised: #1c2c50;
  --hairline: #26385d;
  --line: #26385d;
  --text: #ffffff;
  --text-muted: #e5e5e5;
  --text-secondary: #cbd5e1;
  --brass: #fca311;
  --signal: #22c55e;
  --amber: #fca311;
  --risk: #ef4444;
}

* { box-sizing: border-box; }
html, body, #root { margin: 0; width: 100%; min-height: 100%; }
html { background: var(--ink); }
body { background: var(--ink); overflow-x: hidden; }
button, input, textarea, select { font: inherit; }
button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
button:disabled { cursor: not-allowed; opacity: .6; }

.app-root, .app-loading {
  font-family: 'Inter', sans-serif;
  background: var(--ink);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0);
  background-size: 28px 28px;
}

.app-loading {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.loading-mark {
  width: 44px; height: 44px; border: 1.5px solid var(--brass); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Glorase', serif; font-size: 20px; color: var(--brass);
  animation: pulse 1.6s ease-in-out infinite;
}
.loading-text { font-size: 13px; color: var(--text-muted); letter-spacing: 0.02em; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ---------- sidebar ---------- */
.sidebar {
  width: 232px; flex-shrink: 0; background: var(--surface);
  border-right: 1px solid var(--hairline);
  display: flex; flex-direction: column; padding: 22px 16px;
  position: sticky; top: 0; height: 100vh;
}
.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 22px; margin-bottom: 18px; border-bottom: 1px solid var(--hairline); }
.brand-mark {
  width: 32px; height: 32px; border-radius: 7px; border: 1px solid var(--brass);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Glorase', serif; font-size: 15px; color: var(--brass); flex-shrink: 0;
}
.brand-name { font-family: 'Glorase', serif; font-size: 15px; letter-spacing: 0.08em; font-weight: 400; }
.brand-sub { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.04em; margin-top: 1px; }

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 7px;
  background: transparent; border: none; color: var(--text-muted); font-size: 13.5px; font-family: inherit;
  cursor: pointer; text-align: left; position: relative; transition: background 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--surface-raised); color: var(--text); }
.nav-item-active { background: var(--surface-raised); color: var(--text); }
.nav-item-active .nav-tick { position: absolute; right: 8px; width: 4px; height: 4px; border-radius: 50%; background: var(--brass); }
.sidebar-footer { border-top: 1px solid var(--hairline); padding-top: 14px; margin-top: 8px; }
.sidebar-footer-count { font-family: 'IBM Plex Mono', monospace; font-size: 20px; color: var(--brass); }
.sidebar-footer-label { font-size: 10.5px; color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-top: 2px; }

.sidebar-scrim { display: none; border: 0; padding: 0; }
.mobile-menu-btn { display: none; }

/* ---------- main ---------- */
.main-content { flex: 1; min-width: 0; width: 100%; }
.main-inner { width: 100%; max-width: none; padding: 40px 44px 80px; margin: 0; }

.page-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--brass); letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; }
.page-title { font-family: 'Glorase', serif; font-size: 32px; font-weight: 400; margin: 6px 0 8px; letter-spacing: -0.01em; }
.page-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; max-width: 640px; line-height: 1.55; }

/* ---------- stat grid ---------- */
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 32px; }
.stat-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 10px; padding: 16px 16px 14px; }
.stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.stat-label { font-size: 11.5px; color: var(--text-muted); letter-spacing: 0.03em; }
.stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 28px; color: var(--text); }
.stat-underline { height: 2px; border-radius: 2px; margin-top: 12px; width: 36px; }

/* ---------- dash layout ---------- */
.dash-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 20px; align-items: start; }
.dash-col-main, .dash-col-side { display: flex; flex-direction: column; gap: 20px; }

.panel { background: var(--surface); border: 1px solid var(--hairline); border-radius: 12px; padding: 20px 20px 16px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.panel-head h2 { font-family: 'Glorase', serif; font-size: 18px; font-weight: 400; margin: 0; }
.link-btn { background: none; border: none; color: var(--text-muted); font-size: 12px; display: flex; align-items: center; gap: 3px; cursor: pointer; font-family: inherit; }
.link-btn:hover { color: var(--brass); }

.list { display: flex; flex-direction: column; }
.list-row {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  background: none; border: none; border-top: 1px solid var(--hairline); padding: 11px 2px;
  cursor: pointer; text-align: left; font-family: inherit; color: var(--text);
}
.list-row:first-child { border-top: none; }
.list-row:hover .list-row-title { color: var(--brass); }
.list-row-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.list-row-title { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.15s; }
.list-row-industry { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }
.list-row-side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.list-row-meta { font-size: 11.5px; color: var(--text-muted); }
.mono-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--text-muted); background: var(--surface-raised); padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.score-pill { font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid; border-radius: 5px; padding: 1px 7px; }

.quick-actions { display: flex; flex-direction: column; gap: 8px; }
.quick-action {
  display: flex; align-items: center; gap: 12px; background: var(--surface-raised); border: 1px solid var(--hairline);
  border-radius: 9px; padding: 12px 13px; cursor: pointer; color: var(--text); text-align: left; font-family: inherit;
  transition: border-color 0.15s;
}
.quick-action:hover { border-color: var(--brass); }
.quick-action-title { font-size: 13px; font-weight: 500; }
.quick-action-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 1px; }

.activity-feed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.activity-item { display: flex; gap: 10px; align-items: flex-start; }
.activity-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.activity-text { font-size: 12.5px; line-height: 1.5; }
.activity-link { background: none; border: none; color: var(--text); font-weight: 500; padding: 0; cursor: pointer; font-family: inherit; font-size: inherit; text-decoration: underline; text-decoration-color: var(--hairline); }
.activity-link:hover { color: var(--brass); }
.activity-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* ---------- stamp / badges ---------- */
.stamp {
  font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase;
  border: 1px solid var(--text-muted); color: var(--text-muted); border-radius: 4px; padding: 3px 8px;
  white-space: nowrap; display: inline-block;
}
.stamp-sm { font-size: 9.5px; padding: 2px 6px; }
.stamp-neutral { border-style: dashed; }
.demo-badge {
  font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--amber); border: 1px solid var(--amber);
  border-radius: 3px; padding: 1px 5px; margin-left: 8px; letter-spacing: 0.05em;
}

/* ---------- empty state ---------- */
.empty-state { padding: 30px 16px; min-height: 150px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.empty-title { font-size: 13.5px; font-weight: 500; margin: 10px 0 4px; }
.empty-body { font-size: 12px; color: var(--text-muted); max-width: 320px; line-height: 1.5; }

/* ---------- toolbar / prospects list ---------- */
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; align-items: center; }
.search-box {
  display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--hairline);
  border-radius: 8px; padding: 8px 12px; flex: 1; min-width: 220px; color: var(--text-muted);
}
.search-box input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; font-family: inherit; width: 100%; }
.select {
  background: var(--surface); border: 1px solid var(--hairline); border-radius: 8px; padding: 8px 10px;
  color: var(--text); font-size: 12.5px; font-family: inherit; cursor: pointer; outline: none;
}
.select:focus, .search-box:focus-within { border-color: var(--brass); }

.table-wrap { background: var(--surface); border: 1px solid var(--hairline); border-radius: 12px; overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 780px; }
.table th {
  text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);
  padding: 13px 16px; border-bottom: 1px solid var(--hairline); font-weight: 500; white-space: nowrap;
}
.table td { padding: 13px 16px; border-bottom: 1px solid var(--hairline); font-size: 13px; vertical-align: middle; }
.table-row { cursor: pointer; transition: background 0.12s; }
.table-row:hover { background: var(--surface-raised); }
.table-row:last-child td { border-bottom: none; }
.table-company { display: flex; align-items: center; font-weight: 500; }
.muted { color: var(--text-muted); }
.score-num { font-family: 'IBM Plex Mono', monospace; }

.kenya-toggle { white-space: nowrap; } .kenya-toggle-active { border-color: var(--brass); color: var(--brass); background: var(--surface-raised); }
.evidence-system { margin-top: 20px; } .evidence-system-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:14px; } .evidence-system-head h3 { margin:5px 0 0; } .evidence-count { font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-muted); border:1px solid var(--hairline); padding:4px 7px; border-radius:999px; } .evidence-detailed { align-items:flex-start; cursor:default; } .evidence-detailed > div { min-width:0; } .evidence-detailed strong { line-height:1.45; display:block; } .evidence-detailed small { margin-top:5px; } .evidence-snippet { font-size:12px; color:var(--text-muted); line-height:1.5; margin-top:7px; } .evidence-url { display:inline-flex; gap:5px; align-items:center; font-size:11px; color:var(--brass); margin-top:8px; text-decoration:none; word-break:break-all; } .confidence { font-family:'IBM Plex Mono',monospace; font-size:10px; } .confidence-high { color:var(--signal); } .confidence-medium { color:var(--brass); } .confidence-low { color:var(--amber); }

/* ---------- form ---------- */
.form-panel { max-width: 880px; }
.page-error-state { padding: 28px; max-width: 760px; }
.diagnostic-error { white-space: pre-wrap; overflow-wrap: anywhere; }
.add-prospect-page { width: 100%; min-width: 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.form-section-title { font-family: 'Glorase', serif; font-size: 15px; font-weight: 400; margin: 0 0 14px; color: var(--brass); }
.form-fields { display: flex; flex-direction: column; gap: 14px; }
.form-fields-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; color: var(--text-muted); }
.field-required { color: var(--risk); margin-left: 3px; }
.input {
  background: var(--surface-raised); border: 1px solid var(--hairline); border-radius: 7px; padding: 9px 11px;
  color: var(--text); font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.15s;
}
.input:focus { border-color: var(--brass); }
.form-error { color: var(--risk); font-size: 12.5px; margin-top: 18px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--hairline); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px; background: var(--brass); color: #14213d; border: none;
  border-radius: 7px; padding: 9px 15px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: opacity 0.15s, transform 0.15s;
}
.btn-primary:hover { opacity: 0.92; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; background: transparent; color: var(--text); border: 1px solid var(--hairline);
  border-radius: 7px; padding: 9px 15px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: border-color 0.15s;
}
.btn-ghost:hover { border-color: var(--brass); }

/* ---------- detail ---------- */
.back-link { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: var(--text-muted); font-size: 12.5px; cursor: pointer; margin-bottom: 18px; font-family: inherit; }
.back-link:hover { color: var(--text); }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
.detail-header-side { display: flex; align-items: center; gap: 10px; }
.detail-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; align-items: start; }
.detail-col-main, .detail-col-side { display: flex; flex-direction: column; gap: 20px; }

.detail-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
.detail-field-value { font-size: 13.5px; line-height: 1.5; }

.icon-link-list { display: flex; flex-direction: column; gap: 10px; }
.icon-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; text-decoration: none; }
.icon-link:hover { color: var(--brass); }

.research-note {
  display: flex; gap: 8px; align-items: flex-start; margin-top: 16px; padding: 12px 13px; background: var(--surface-raised);
  border: 1px dashed var(--hairline); border-radius: 8px; font-size: 12px; color: var(--text-muted); line-height: 1.5;
}
.research-note svg { color: var(--brass); flex-shrink: 0; margin-top: 1px; }

.score-block { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.score-big { font-family: 'IBM Plex Mono', monospace; font-size: 44px; line-height: 1; }
.score-scale { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.review-flag { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--amber); margin-top: 4px; }
.score-footnote { font-size: 11px; color: var(--text-muted); margin-top: 10px; }

.service-chip { display: inline-block; background: var(--surface-raised); border: 1px solid var(--brass); color: var(--brass); border-radius: 6px; padding: 5px 10px; font-size: 12.5px; font-weight: 500; }
.service-reason { font-size: 12.5px; color: var(--text-muted); line-height: 1.55; margin-top: 10px; }

.timeline { display: flex; flex-direction: column; gap: 14px; }
.timeline-item { display: flex; gap: 10px; align-items: flex-start; }
.timeline-title { font-size: 12.5px; }
.timeline-date { font-size: 11px; color: var(--text-muted); margin-top: 1px; }


/* ---------- phase 3 qualification ---------- */
.score-breakdown { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; width: 100%; }
.score-factor { padding-top: 10px; border-top: 1px solid var(--hairline); }
.score-factor-head { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; }
.score-factor-head strong { font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: var(--brass); }
.score-factor-track { height: 4px; background: var(--surface-raised); border-radius: 999px; margin: 7px 0 6px; overflow: hidden; }
.score-factor-track span { display: block; height: 100%; background: var(--brass); border-radius: inherit; transition: width .25s ease; }
.score-factor p { margin: 0; color: var(--text-muted); font-size: 10.8px; line-height: 1.45; }
.recommendation-label { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 16px; }
.deliverable-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.deliverable-list span { font-size: 10.5px; padding: 5px 8px; border: 1px solid var(--hairline); border-radius: 999px; color: var(--text-muted); background: var(--surface-raised); }


/* ---------- outreach ---------- */
.outreach-layout { display:grid; grid-template-columns: 0.9fr 1.4fr; gap:20px; align-items:start; }
.outreach-controls,.outreach-editor { display:flex; flex-direction:column; gap:16px; }
.outreach-types { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.type-btn { background:var(--surface-raised); border:1px solid var(--hairline); color:var(--text-muted); border-radius:7px; padding:10px; cursor:pointer; font-family:inherit; text-align:left; font-size:12px; }
.type-btn-active { border-color:var(--brass); color:var(--brass); background:var(--surface); }
.outreach-context { border:1px solid var(--hairline); background:var(--surface-raised); border-radius:8px; padding:13px; }
.outreach-context strong { display:block; margin-top:8px; font-size:13px; } .outreach-context p { color:var(--text-muted); font-size:12px; line-height:1.5; margin:7px 0 0; }
.outreach-textarea { min-height:300px; resize:vertical; line-height:1.6; } .outreach-actions { display:flex; gap:10px; flex-wrap:wrap; }
.ai-settings-panel { max-width: 760px; }
.check-row { display:flex; align-items:center; gap:9px; font-size:13px; color:var(--text-muted); margin:6px 0 18px; }
.ai-result { display:flex; flex-direction:column; gap:14px; }
.ai-summary { font-size:13px; line-height:1.6; margin:0; color:var(--text); }
.finding-ai { border-left: 2px solid var(--brass); }
.finding-unavailable { border-left: 2px solid var(--amber); }
.trust-note { display:flex; gap:8px; align-items:flex-start; padding:10px 12px; background:var(--surface-raised); border:1px dashed var(--hairline); border-radius:7px; color:var(--text-muted); font-size:11.5px; line-height:1.5; } .trust-note svg { color:var(--amber); flex-shrink:0; margin-top:1px; }
.saved-panel { margin-top:20px; } .saved-list { display:flex; flex-direction:column; gap:10px; } .saved-message { display:flex; justify-content:space-between; gap:16px; align-items:center; padding:12px; border:1px solid var(--hairline); border-radius:8px; background:var(--surface-raised); } .saved-message strong { font-size:12.5px; display:block; margin-bottom:4px; }
@media (max-width: 980px) { .outreach-layout { grid-template-columns:1fr; } }

/* ---------- responsive ---------- */
@media (max-width: 980px) {
  .main-inner { padding: 32px 28px 64px; }
  .dash-grid, .detail-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; gap: 20px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 760px) {
  .app-root { flex-direction: column; }
  .sidebar {
    position: fixed; left: 0; top: 0; height: 100vh; z-index: 40; transform: translateX(-100%);
    transition: transform 0.2s ease; box-shadow: 4px 0 24px rgba(0,0,0,0.4);
  }
  .sidebar-open { transform: translateX(0); }
  .sidebar-scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 30; }
  .mobile-menu-btn {
    display: flex; align-items: center; gap: 6px; position: fixed; top: 14px; left: 14px; z-index: 20;
    background: var(--surface); border: 1px solid var(--hairline); color: var(--text); border-radius: 7px;
    padding: 8px 12px; font-size: 12.5px; font-family: inherit; cursor: pointer;
  }
  .main-inner { padding: 68px 18px 60px; }
  .stat-grid { grid-template-columns: 1fr; }
  .detail-field-grid, .form-fields-2col { grid-template-columns: 1fr; }
  .detail-header { flex-direction: column; }
  .panel { padding: 16px; }
  .page-title { font-size: 28px; }
  .list-row-industry { display: none; }
  .saved-message { align-items: flex-start; flex-direction: column; }
}

/* ---------- research phase 2A ---------- */
.btn-sm { padding: 7px 10px; font-size: 12px; }
.research-dossier { display: flex; flex-direction: column; gap: 24px; }
.research-source-card { border: 1px solid var(--hairline); background: var(--surface-raised); border-radius: 10px; padding: 15px; margin-bottom: 20px; }
.research-source-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.research-source-kicker { display: flex; align-items: center; gap: 6px; color: var(--brass); font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: .08em; margin-bottom: 5px; }
.research-source-card strong { font-size: 13px; }
.research-source-card p { margin: 10px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.55; }
.research-source-url { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 12px; }
.research-source-url a { color: var(--signal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.research-section { border-top: 1px solid var(--hairline); padding-top: 18px; }
.research-section:first-child { border-top: none; padding-top: 0; }
.research-section h3 { margin: 0 0 14px; font-family: 'Glorase', serif; font-size: 19px; font-weight: 400; }
.research-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.research-field { background: var(--surface-raised); border: 1px solid var(--hairline); border-radius: 8px; padding: 13px; }
.research-field-label { font-family: 'IBM Plex Mono', monospace; color: var(--brass); font-size: 10px; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 8px; }
.research-finding { font-size: 12.5px; line-height: 1.55; padding: 8px 0; border-top: 1px solid rgba(255,255,255,.05); }
.research-finding:first-of-type { border-top: 0; padding-top: 0; }
.evidence-badge { display: inline-block; margin-top: 7px; padding: 3px 6px; border: 1px solid var(--hairline); border-radius: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 8.5px; letter-spacing: .04em; }
.evidence-user_provided { color: var(--brass); } .evidence-confirmed { color: var(--signal); } .evidence-observed { color: #7ea6d8; } .evidence-ai_suggestion { color: var(--amber); } .evidence-unavailable { color: var(--text-muted); }
.research-progress { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
.research-stage { display: flex; align-items: center; gap: 10px; color: var(--text-muted); padding: 11px 12px; border: 1px solid var(--hairline); border-radius: 7px; font-size: 13px; }
.research-stage-active { color: var(--text); background: var(--surface-raised); border-color: var(--brass); }
@media (max-width: 760px) { .research-fields { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }


/* ---------- phase 10 advanced AI analysis ---------- */
.advanced-ai-panel .panel-head h2 { margin-top:5px; } .advanced-ai-result { display:grid; gap:14px; } .ai-summary-card { padding:15px; border:1px solid var(--hairline); border-radius:10px; background:rgba(252,163,17,.08); } .ai-summary-card p { margin:8px 0 0; line-height:1.65; } .ai-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; } .ai-module { border:1px solid var(--hairline); border-radius:10px; padding:14px; min-width:0; } .ai-module p { margin:8px 0 0; color:var(--text-muted); line-height:1.55; } .ai-module > strong { display:block; margin-top:7px; font-size:15px; } .ai-service-module { background:rgba(34,197,94,.08); } .ai-opening-line { margin-top:10px; padding:10px; border-left:2px solid var(--brass); color:var(--text); font-style:italic; line-height:1.5; } .objection-card { display:grid; gap:5px; padding:10px 0; border-bottom:1px solid var(--hairline); } .objection-card:last-child { border-bottom:0; padding-bottom:0; } .objection-card span { color:var(--text-muted); font-size:12px; line-height:1.45; } .ai-confidence { display:flex; gap:10px; align-items:flex-start; padding:12px; border:1px solid rgba(252,163,17,.35); border-radius:9px; color:var(--text-muted); font-size:12px; } .ai-confidence strong,.ai-confidence span { display:block; } .ai-confidence span { margin-top:4px; line-height:1.45; } .ai-generated-meta { color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:10px; } .ai-empty { display:flex; gap:12px; align-items:flex-start; padding:12px 0; color:var(--text-muted); } .ai-empty strong { color:var(--text); } .ai-empty p { margin:5px 0 0; line-height:1.5; } @media (max-width:760px){ .ai-grid { grid-template-columns:1fr; } }

/* ---------- phase 8 evidence + outreach tracking ---------- */
.evidence-log { margin-top: 14px; display: grid; gap: 7px; }
.evidence-row { display: grid; grid-template-columns: 30px 1fr auto; gap: 10px; align-items: center; padding: 10px 11px; border: 1px solid var(--hairline); border-radius: 8px; color: var(--text); text-decoration: none; background: rgba(255,255,255,.015); }
.evidence-row:hover { border-color: var(--brass); }
.evidence-index { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--brass); }
.evidence-row strong, .evidence-row small { display: block; }
.evidence-row small { color: var(--text-muted); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.outreach-status { display: inline-flex; align-items: center; border: 1px solid var(--hairline); border-radius: 999px; padding: 4px 8px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: .05em; text-transform: uppercase; white-space: nowrap; }
.outreach-status-md { font-size: 10px; padding: 5px 9px; }
.outreach-status-muted { color: var(--text-muted); }
.outreach-status-brass { color: var(--brass); border-color: color-mix(in srgb, var(--brass) 45%, var(--hairline)); }
.outreach-status-signal { color: var(--signal); border-color: color-mix(in srgb, var(--signal) 45%, var(--hairline)); }
.outreach-status-amber { color: var(--amber); border-color: color-mix(in srgb, var(--amber) 45%, var(--hairline)); }
.outreach-status-risk { color: var(--risk); border-color: color-mix(in srgb, var(--risk) 45%, var(--hairline)); }
.outreach-current-status { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 0; border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline); font-family:'IBM Plex Mono', monospace; font-size:10px; color:var(--text-muted); letter-spacing:.05em; }
.btn-success { border: 1px solid var(--signal); background: var(--signal); color: #000000; border-radius: 7px; padding: 9px 12px; font-weight: 700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; }
.btn-success:hover { filter: brightness(1.06); }
.saved-message-actions { display:flex; align-items:center; gap:8px; }
.tracker-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
.tracker-stat { text-align:left; border:1px solid var(--hairline); background:var(--surface); color:var(--text); border-radius:10px; padding:14px; cursor:pointer; display:grid; grid-template-columns:auto 1fr; column-gap:9px; align-items:center; }
.tracker-stat:hover, .tracker-stat-active { border-color:var(--brass); background:var(--surface-raised); }
.tracker-stat strong { font-family:'IBM Plex Mono', monospace; font-size:22px; }
.tracker-stat span { grid-column:1 / -1; color:var(--text-muted); font-size:11px; margin-top:5px; }
.tracker-list { display:grid; gap:10px; }
.tracker-row { margin:0; display:grid; grid-template-columns:minmax(0,1.2fr) auto auto; gap:20px; align-items:center; }
.tracker-company { display:flex; flex-direction:column; gap:4px; }
.tracker-company strong { font-size:15px; }
.tracker-meta { display:flex; flex-direction:column; align-items:flex-end; gap:7px; color:var(--text-muted); font-size:11px; }
.tracker-actions { display:flex; align-items:center; gap:8px; }
.tracker-select { min-width:145px; }
@media (max-width: 900px) { .tracker-stats { grid-template-columns:repeat(2,1fr); } .tracker-row { grid-template-columns:1fr; gap:12px; } .tracker-meta { align-items:flex-start; } }
@media (max-width: 620px) { .tracker-stats { grid-template-columns:1fr; } .tracker-actions { flex-wrap:wrap; } .evidence-row { grid-template-columns:24px 1fr auto; } .outreach-actions { flex-wrap:wrap; } }

/* ---------- phase 11 outreach sequences ---------- */
.sequence-toolbar { display:flex; justify-content:space-between; align-items:flex-end; gap:18px; margin-bottom:18px; } .sequence-toolbar .field { flex:1; margin:0; } .sequence-toolbar-actions { display:flex; gap:10px; align-items:center; padding-bottom:1px; } .sequence-empty { display:flex; gap:16px; align-items:flex-start; margin-bottom:18px; } .sequence-empty h2,.sequence-overview h2,.sequence-step h2 { margin:4px 0 6px; } .sequence-empty p { max-width:760px; color:var(--text-muted); line-height:1.6; margin:0 0 14px; } .sequence-overview { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom:14px; } .sequence-overview .muted { margin:0; } .sequence-list { display:grid; gap:12px; } .sequence-step { display:grid; grid-template-columns:76px minmax(0,1fr); gap:18px; } .sequence-rail { display:flex; flex-direction:column; align-items:center; padding-top:5px; font-family:'IBM Plex Mono',monospace; } .sequence-rail span { color:var(--text-muted); font-size:9px; letter-spacing:.08em; } .sequence-rail strong { font-size:26px; color:var(--brass); margin-top:2px; } .sequence-rail i { flex:1; width:1px; min-height:35px; background:var(--hairline); margin-top:10px; } .sequence-step-head { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; margin-bottom:8px; } .sequence-message { min-height:150px; resize:vertical; line-height:1.55; } .sequence-step-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; } .sequence-leads { margin-top:18px; } .sequence-lead-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:14px; align-items:center; padding:12px 0; border-top:1px solid var(--hairline); } .sequence-lead-row:first-of-type { border-top:0; } .sequence-lead-row strong,.sequence-lead-row span { display:block; } .sequence-lead-row span { color:var(--text-muted); font-size:12px; margin-top:4px; } @media (max-width:760px){ .sequence-toolbar,.sequence-overview { flex-direction:column; align-items:stretch; } .sequence-toolbar-actions { padding:0; justify-content:space-between; } .sequence-step { grid-template-columns:1fr; } .sequence-rail { flex-direction:row; justify-content:flex-start; gap:7px; padding:0; } .sequence-rail i { display:none; } .sequence-lead-row { grid-template-columns:1fr; align-items:flex-start; } }



/* ---------- phase 18 discovery engine ---------- */
.nav-count{margin-left:auto;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:rgba(252,163,17,.16);color:var(--brass);display:inline-flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:9px}
.panel-kicker{display:block;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:10px;margin-top:5px}
.discovery-search-grid{display:grid;grid-template-columns:220px minmax(0,1fr);gap:18px;align-items:start}
.discovery-type-grid{display:flex;flex-wrap:wrap;gap:8px}
.discovery-type{display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid var(--hairline);border-radius:8px;color:var(--text-muted);font-size:12px;cursor:pointer;background:rgba(255,255,255,.01)}
.discovery-type input{accent-color:var(--brass)}
.discovery-type-active{border-color:var(--brass);color:var(--text);background:rgba(252,163,17,.08)}
.discovery-search-actions{display:flex;align-items:center;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid var(--hairline)}
.discovery-search-actions .muted{font-size:11px}
.discovery-alert{margin:16px 0;padding:12px 14px;border:1px solid rgba(34,197,94,.4);border-radius:999px;background:rgba(34,197,94,.07);color:var(--text);font-size:13px}
.discovery-alert-error{border-color:rgba(239,68,68,.55);background:rgba(239,68,68,.08)}
.discovery-inbox{margin-top:18px}.discovery-filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}.filter-chip{border:1px solid var(--hairline);background:transparent;color:var(--text-muted);padding:7px 10px;border-radius:999px;font-size:11px;cursor:pointer}.filter-chip-active{border-color:var(--brass);color:var(--brass);background:rgba(252,163,17,.12)}
.discovery-list{display:grid;gap:10px}.discovery-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;padding:16px;border:1px solid var(--hairline);border-radius:10px;background:rgba(255,255,255,.012)}
.discovery-company-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.discovery-company-head strong{font-size:15px}.discovery-badge{display:inline-flex;border:1px solid var(--hairline);border-radius:999px;padding:4px 7px;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)}
.discovery-badge-signal{color:var(--signal);border-color:rgba(34,197,94,.45)}.discovery-badge-amber{color:var(--amber);border-color:rgba(252,163,17,.45)}.discovery-badge-risk{color:var(--risk);border-color:rgba(239,68,68,.5)}.discovery-badge-brass{color:var(--brass);border-color:rgba(252,163,17,.45)}
.discovery-meta,.discovery-evidence{display:flex;gap:12px;flex-wrap:wrap;color:var(--text-muted);font-size:11px;margin-top:8px}.discovery-meta span{display:inline-flex;align-items:center;gap:4px}.discovery-snippet{color:var(--text-muted);font-size:12px;line-height:1.55;margin:10px 0 0}.discovery-evidence{font-family:'IBM Plex Mono',monospace;font-size:9px}.discovery-reason{margin-top:9px;padding:8px 10px;border-left:2px solid var(--brass);background:rgba(252,163,17,.08);color:var(--text-muted);font-size:11px}.discovery-reason-risk{border-left-color:var(--risk);background:rgba(239,68,68,.08)}
.discovery-actions{display:flex;flex-direction:column;align-items:stretch;gap:7px;min-width:150px;justify-content:flex-start}.discovery-actions .btn-secondary,.discovery-actions .btn-success{justify-content:center;white-space:nowrap}.discovery-actions .muted{font-size:11px;text-align:center;padding:9px}.discovery-manual{margin-top:18px}
.spin{animation:discovery-spin 1s linear infinite}@keyframes discovery-spin{to{transform:rotate(360deg)}}
@media(max-width:850px){.discovery-search-grid{grid-template-columns:1fr}.discovery-row{grid-template-columns:1fr}.discovery-actions{flex-direction:row;flex-wrap:wrap;align-items:center}.discovery-actions .btn-secondary,.discovery-actions .btn-success{width:auto}.discovery-search-actions{align-items:flex-start;flex-direction:column}}

.auth-shell { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--ink); }
.auth-card { width:min(100%,480px); padding:32px; border:1px solid var(--hairline); border-radius:16px; background:var(--surface); display:grid; gap:14px; }
.auth-card .page-title { margin:0; } .auth-card .page-sub { margin:0 0 8px; } .auth-mark { margin-bottom:4px; } .auth-submit { width:100%; justify-content:center; } .auth-switch { justify-self:center; margin-top:4px; }
.session-bar { display:flex; justify-content:flex-end; align-items:center; gap:12px; font-size:12px; color:var(--text-muted); margin-bottom:12px; }

/* Phase 14 qualification intelligence */
.qualification-summary{margin-top:18px;border-top:1px solid var(--line);display:grid;gap:0}.qualification-summary-item{padding:13px 0;border-bottom:1px solid var(--line)}.qualification-summary-item span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:5px}.qualification-summary-item strong{font-size:13px}.qualification-summary-item p{margin:0;color:var(--text-secondary);line-height:1.5}.evidence-basis-list{display:grid;gap:8px;margin-top:8px}.evidence-basis-list div{padding:10px 12px;border:1px solid var(--line);border-radius:8px;color:var(--text-secondary);font-size:13px}.recommendation-confidence{margin-top:12px;font-size:12px;font-weight:700;letter-spacing:.04em;color:var(--brass)}
`;
