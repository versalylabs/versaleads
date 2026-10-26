import React, { useState, useEffect } from "react";
import {
  Sparkles, CheckCircle2, ArrowRight, Check,
  Globe, Search, BrainCircuit, Users,
  ChevronDown, ChevronUp, Lock, BarChart2,
  Mail, Building, Award, Compass, Layers, Menu, X, Star, ShieldAlert
} from "lucide-react";
import LegalModal, { CookieBanner } from "./LegalModal.jsx";

/* ============================================================
   VERSALEADS LANDING PAGE
   Theme: Consistent with Versaly System Branding
   - Canvas: #080e1a (Midnight Navy base)
   - Surface / Cards: #14213d (Versaly Oxford Navy)
   - Elevated Cards: #1c2c50 (Elevated Navy)
   - Hairline: #26385d (Navy Border)
   - Primary Action / Accent: #fca311 (Versaly Amber / Gold)
   - Foreground Text: #ffffff & #e5e5e5 (Platinum)
   - Secondary Text: #cbd5e1 & #94a3b8
   ============================================================ */
const landingStyles = `
html, body, #root {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  min-height: 100% !important;
  background-color: #080e1a !important;
  overflow-x: hidden;
}

.versaleads-root {
  --color-canvas: #080e1a;
  --color-card: #14213d;
  --color-card-elevated: #1c2c50;
  --color-border: #26385d;
  --color-gold: #fca311;
  --color-gold-hover: #e5920d;
  --color-platinum: #e5e5e5;
  --color-text-primary: #ffffff;
  --color-text-muted: #cbd5e1;
  --color-text-secondary: #94a3b8;
  --color-signal: #22c55e;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
  background-color: var(--color-canvas);
  color: var(--color-platinum);
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.versaleads-root * {
  box-sizing: border-box;
}

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

/* Typography scale per Mercury spec with Versaly colors */
.versaleads-display {
  font-family: 'Glorase', serif;
  font-size: clamp(38px, 5.5vw, 65px);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
}

.versaleads-heading-lg {
  font-family: 'Glorase', serif;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: 0.01em;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
}

.versaleads-heading {
  font-family: 'Glorase', serif;
  font-size: 26px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.015em;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.versaleads-body-lg {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.versaleads-body {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.versaleads-caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
}

/* Layout container */
.versaleads-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.versaleads-section {
  padding: 72px 0;
  position: relative;
}

/* Top Navigation Bar */
.versaleads-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 16px 0;
  transition: background-color 0.25s ease, backdrop-filter 0.25s ease, border-color 0.25s ease;
  background-color: transparent;
}

.versaleads-nav-scrolled {
  background-color: rgba(8, 14, 26, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
}

.versaleads-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
}

.versaleads-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--color-text-primary);
  cursor: pointer;
  flex-shrink: 0;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
}

.versaleads-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background-color: var(--color-card);
  border: 1px solid var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Glorase', serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--color-gold);
  flex-shrink: 0;
}

.versaleads-brand-name {
  font-family: 'Glorase', serif;
  font-size: 19px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--color-text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.versaleads-brand-tag {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gold);
  border: 1px solid rgba(252, 163, 17, 0.4);
  padding: 3px 9px;
  border-radius: 40px;
  background: rgba(252, 163, 17, 0.08);
  white-space: nowrap;
  flex-shrink: 0;
}

.versaleads-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
}

@media (max-width: 900px) {
  .versaleads-nav-links {
    display: none;
  }
}

.versaleads-nav-link {
  background: transparent;
  border: none;
  color: var(--color-platinum);
  font-size: 13.5px;
  font-weight: 400;
  padding: 8px 14px;
  border-radius: 40px;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.versaleads-nav-link:hover {
  color: var(--color-gold);
  background-color: rgba(255, 255, 255, 0.04);
}

.versaleads-nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;
}

/* Primary CTA Button (Versaly Gold with Deep Navy Text) */
.versaleads-btn-primary {
  background-color: var(--color-gold);
  color: #14213d;
  font-size: 15px;
  font-weight: 700;
  border-radius: 32px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: opacity 0.18s ease, transform 0.15s ease;
  white-space: nowrap;
}

.versaleads-btn-primary:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

/* Ghost Outline Button */
.versaleads-btn-ghost {
  background: transparent;
  border: 1px solid var(--color-platinum);
  color: var(--color-platinum);
  font-size: 15px;
  font-weight: 500;
  border-radius: 40px;
  padding: 11px 22px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.versaleads-btn-ghost:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background-color: rgba(252, 163, 17, 0.06);
}

/* Hero Section */
.versaleads-hero {
  position: relative;
  min-height: 94vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 140px 24px 80px;
  background-color: var(--color-canvas);
  overflow: hidden;
}

.versaleads-hero-bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.versaleads-hero-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  opacity: 0.16;
  filter: contrast(1.1) brightness(0.88);
}

.versaleads-hero-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(252, 163, 17, 0.18), transparent 70%),
    radial-gradient(circle at 50% 60%, rgba(20, 33, 61, 0.45), transparent 75%),
    linear-gradient(180deg, rgba(8, 14, 26, 0.55) 0%, rgba(8, 14, 26, 0.3) 40%, rgba(8, 14, 26, 0.85) 85%, #080e1a 100%);
  pointer-events: none;
}

.versaleads-hero-content {
  max-width: 820px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.versaleads-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 40px;
  padding: 6px 16px;
  font-size: 13px;
  color: var(--color-platinum);
  margin-bottom: 24px;
}

.versaleads-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-gold);
}

.versaleads-hero-subtext {
  font-size: clamp(17px, 2.2vw, 20px);
  line-height: 1.5;
  color: var(--color-text-muted);
  max-width: 640px;
  margin: 0 auto 36px;
}

/* Inline Email Capture Form */
.versaleads-email-form {
  display: flex;
  align-items: stretch;
  justify-content: center;
  max-width: 540px;
  margin: 0 auto 18px;
  width: 100%;
}

.versaleads-email-input {
  flex: 1;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-right: none;
  color: var(--color-text-primary);
  font-size: 15px;
  padding: 14px 22px;
  border-radius: 32px 0 0 32px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.versaleads-email-input:focus {
  border-color: var(--color-gold);
}

.versaleads-email-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.versaleads-email-btn {
  background-color: var(--color-gold);
  color: #14213d;
  border: none;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 26px;
  border-radius: 0 32px 32px 0;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s ease;
  font-family: inherit;
}

.versaleads-email-btn:hover {
  opacity: 0.92;
}

@media (max-width: 580px) {
  .versaleads-email-form {
    flex-direction: column;
    gap: 10px;
  }
  .versaleads-email-input {
    border-right: 1px solid var(--color-border);
    border-radius: 32px;
  }
  .versaleads-email-btn {
    border-radius: 32px;
  }
}

.versaleads-hero-guarantees {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 18px;
}

.versaleads-hero-guarantee-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* React Bits Inspired Liquid Glass System */
.liquid-glass {
  background: linear-gradient(135deg, rgba(20, 33, 61, 0.48) 0%, rgba(10, 18, 34, 0.72) 100%);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 18px 45px -10px rgba(0, 0, 0, 0.55),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 0%, rgba(252, 163, 17, 0.1) 0%, transparent 60%),
              radial-gradient(circle at 80% 100%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
  pointer-events: none;
  border-radius: inherit;
}

/* Versaly Cards System with Liquid Glass */
.versaleads-card {
  background: linear-gradient(135deg, rgba(20, 33, 61, 0.5) 0%, rgba(10, 18, 34, 0.75) 100%);
  backdrop-filter: blur(22px) saturate(185%);
  -webkit-backdrop-filter: blur(22px) saturate(185%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 16px 40px -10px rgba(0, 0, 0, 0.52),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease;
}

.versaleads-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 0%, rgba(252, 163, 17, 0.08) 0%, transparent 60%);
  pointer-events: none;
  border-radius: inherit;
}

.versaleads-card-interactive:hover {
  border-color: rgba(252, 163, 17, 0.55);
  box-shadow: 
    0 24px 55px -10px rgba(0, 0, 0, 0.7),
    0 0 30px rgba(252, 163, 17, 0.2),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.35);
  transform: translateY(-3px);
}

.versaleads-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.versaleads-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 960px) {
  .versaleads-grid-3, .versaleads-grid-2 {
    grid-template-columns: 1fr;
  }
}

.versaleads-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-color: rgba(20, 33, 61, 0.7);
  border: 1px solid rgba(252, 163, 17, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gold);
  margin-bottom: 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Interactive Simulator with Liquid Glass */
.versaleads-simulator {
  background: linear-gradient(135deg, rgba(16, 28, 52, 0.62) 0%, rgba(8, 14, 28, 0.82) 100%);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  padding: 40px;
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 22px 55px -12px rgba(0, 0, 0, 0.65),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4);
}

.versaleads-simulator::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 18% 0%, rgba(252, 163, 17, 0.12) 0%, transparent 55%),
              radial-gradient(circle at 85% 100%, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
  pointer-events: none;
  border-radius: inherit;
}

.versaleads-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
}

.versaleads-tab {
  background-color: var(--color-card-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  padding: 9px 18px;
  border-radius: 40px;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.versaleads-tab-active {
  background-color: var(--color-gold);
  color: #14213d;
  font-weight: 600;
  border-color: var(--color-gold);
}

.versaleads-sim-body {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 860px) {
  .versaleads-sim-body {
    grid-template-columns: 1fr;
  }
}

.versaleads-score-display {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 12px 0 20px;
}

.versaleads-score-big {
  font-size: 56px;
  font-weight: 600;
  line-height: 1;
  color: var(--color-gold);
  font-family: 'IBM Plex Mono', monospace, sans-serif;
}

.versaleads-score-scale {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.versaleads-sim-factor {
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
}

.versaleads-sim-factor:first-child {
  border-top: none;
}

.versaleads-sim-factor-head {
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: var(--color-platinum);
  margin-bottom: 6px;
}

.versaleads-progress-track {
  height: 5px;
  background-color: var(--color-card-elevated);
  border-radius: 40px;
  overflow: hidden;
}

.versaleads-progress-fill {
  height: 100%;
  background-color: var(--color-gold);
  border-radius: 40px;
  transition: width 0.4s ease;
}

/* Pricing Grid */
.versaleads-pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 960px) {
  .versaleads-pricing-grid {
    grid-template-columns: 1fr;
  }
}

.versaleads-pricing-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  border-radius: 18px;
}

.versaleads-pricing-featured {
  border: 1.5px solid rgba(252, 163, 17, 0.7);
  box-shadow: 
    0 24px 60px -12px rgba(0, 0, 0, 0.7),
    0 0 35px rgba(252, 163, 17, 0.22),
    inset 0 1px 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 2px 0 rgba(252, 163, 17, 0.2);
}

.versaleads-pricing-featured::before {
  background: radial-gradient(circle at 50% 0%, rgba(252, 163, 17, 0.2) 0%, transparent 65%);
}

.versaleads-pricing-badge {
  position: absolute;
  top: 18px;
  right: 20px;
  background-color: var(--color-gold);
  color: #14213d;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 40px;
  box-shadow: 0 4px 14px rgba(252, 163, 17, 0.35);
}

.versaleads-price-box {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 18px 0;
}

.versaleads-price-num {
  font-size: 42px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1;
}

.versaleads-price-period {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.versaleads-feature-list {
  list-style: none;
  padding: 0;
  margin: 24px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.versaleads-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14.5px;
  color: var(--color-platinum);
  line-height: 1.45;
}

.versaleads-feature-item svg {
  color: var(--color-gold);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Accordion FAQ */
.versaleads-faq-item {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.versaleads-faq-question {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-platinum);
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}

.versaleads-faq-answer {
  padding: 0 28px 24px;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.6;
}

/* Footer & Disclaimer */
.versaleads-footer {
  border-top: 1px solid var(--color-border);
  padding: 64px 0 40px;
  background-color: var(--color-canvas);
}

.versaleads-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 32px;
  margin-top: 40px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.versaleads-disclaimer {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 900px;
  margin-top: 24px;
}

/* Mobile Navigation Toggle & Drawer */
.versaleads-mobile-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-platinum);
  padding: 6px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.versaleads-mobile-toggle:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

@media (max-width: 860px) {
  .versaleads-mobile-toggle {
    display: inline-flex;
  }
}

.versaleads-mobile-menu {
  position: fixed;
  top: 68px;
  left: 0;
  right: 0;
  background-color: rgba(8, 14, 26, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--color-border);
  padding: 24px;
  z-index: 99;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 16px 32px rgba(0,0,0,0.5);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.versaleads-mobile-menu-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.versaleads-mobile-nav-link {
  background: transparent;
  border: none;
  color: var(--color-platinum);
  font-size: 16px;
  font-weight: 500;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.versaleads-mobile-nav-link:hover {
  background-color: var(--color-card);
  color: var(--color-gold);
}

.versaleads-mobile-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

@media (max-width: 600px) {
  .versaleads-brand-tag {
    display: none;
  }
  .versaleads-nav-actions .versaleads-btn-ghost {
    display: none;
  }
  .versaleads-nav-actions .versaleads-btn-primary {
    font-size: 13px;
    padding: 8px 14px;
  }
  .versaleads-simulator {
    padding: 20px 16px;
  }
  .versaleads-score-big {
    font-size: 42px;
  }
}

@media (max-width: 480px) {
  .versaleads-container {
    padding: 0 16px;
  }
  .versaleads-hero {
    padding: 110px 16px 50px;
  }
  .versaleads-section {
    padding: 50px 0;
  }
}

@media (max-width: 440px) {
  .versaleads-brand-name {
    font-size: 16px;
  }
  .versaleads-nav-actions .versaleads-btn-primary {
    display: none;
  }
}
`;

const DEMO_INDUSTRIES = [
  {
    key: "saas",
    name: "Tech & B2B SaaS",
    company: "Apex Cloud Orchestration",
    score: 88,
    qualification: "HIGH PRIORITY",
    website: "apexcloud.io",
    signals: [
      { name: "Commercial Fit", value: 92, note: "Clear ACV model, enterprise tier, self-serve trial flow." },
      { name: "Digital Footprint", value: 85, note: "Modern Next.js stack, active LinkedIn presence, SOC2 seal." },
      { name: "Decision Maker", value: 87, note: "Verified VP of Growth & CTO contacts on public roster." },
      { name: "Growth Bottleneck", value: 88, note: "No interactive ROI calculator or high-converting demo pipeline." }
    ],
    recommendedPitch: "B2B Performance Lead Acquisition & Pipeline Automation",
    deliverable: "Custom demo-booking funnel with live ROI qualification workflow."
  },
  {
    key: "healthcare",
    name: "Healthcare & MedTech",
    company: "Novacare Specialty Clinics",
    score: 84,
    qualification: "HIGH PRIORITY",
    website: "novacarehealth.org",
    signals: [
      { name: "Commercial Fit", value: 88, note: "Multi-location practice network with insured elective specialties." },
      { name: "Digital Footprint", value: 78, note: "Legacy CMS with slow patient portal causing intake leakage." },
      { name: "Decision Maker", value: 82, note: "Chief Clinical Officer and Clinic Operations Lead identified." },
      { name: "Growth Bottleneck", value: 88, note: "High website traffic with 40% patient drop-off on legacy booking." }
    ],
    recommendedPitch: "Patient Intake Optimization & HIPAA-Ready Growth Funnels",
    deliverable: "High-speed mobile intake gateway integrated with automated reminders."
  },
  {
    key: "finance",
    name: "Financial & Advisory",
    company: "Vanguard Asset Partners",
    score: 91,
    qualification: "PREMIUM FIT",
    website: "vanguardasset.ke",
    signals: [
      { name: "Commercial Fit", value: 95, note: "High deal-size wealth advisory managing over $50M in regional assets." },
      { name: "Digital Footprint", value: 82, note: "Conservative branding with outdated institutional layout." },
      { name: "Decision Maker", value: 90, note: "Managing Partner with direct verified corporate email." },
      { name: "Growth Bottleneck", value: 94, note: "Zero digital lead capture for next-generation wealth clients." }
    ],
    recommendedPitch: "Executive Authority Funnel & High-Net-Worth Lead Engines",
    deliverable: "Exclusive investor briefing microsite with gated portfolio intelligence."
  },
  {
    key: "ecommerce",
    name: "E-Commerce & Retail",
    company: "Luminary Living D2C",
    score: 79,
    qualification: "QUALIFIED",
    website: "luminaryliving.co",
    signals: [
      { name: "Commercial Fit", value: 82, note: "Sustainable home goods brand with $120 average order value." },
      { name: "Digital Footprint", value: 85, note: "Shopify Plus store with strong visual catalog and Instagram." },
      { name: "Decision Maker", value: 72, note: "Founder and Brand Lead discovered via LinkedIn." },
      { name: "Growth Bottleneck", value: 80, note: "Heavy ad spend but unoptimized post-purchase lifecycle email." }
    ],
    recommendedPitch: "Omnichannel Lifecycle Retention & High-LTV Outbound Strategy",
    deliverable: "Multi-channel automated retention flows and wholesale acquisition funnel."
  }
];

export default function LandingPage({
  user,
  onOpenLogin,
  onStartTrial,
  onGoToApp,
  onGoToAdmin,
  onLogout
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroEmail, setHeroEmail] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(DEMO_INDUSTRIES[0]);
  const [openFaq, setOpenFaq] = useState(0);
  const [legalTab, setLegalTab] = useState(null);
  const [siteContent, setSiteContent] = useState(null);

  const isSuperAdmin = user?.email?.toLowerCase() === "versalylabs@gmail.com";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/admin/public-content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSiteContent(data);
      })
      .catch(() => {});
  }, []);

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    onStartTrial({ email: heroEmail.trim(), plan: "growth" });
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="versaleads-root">
      <style>{landingStyles}</style>

      {/* Top Navigation Bar */}
      <nav className={`versaleads-nav ${scrolled ? "versaleads-nav-scrolled" : ""}`}>
        <div className="versaleads-container versaleads-nav-inner">
          <div className="versaleads-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="versaleads-brand-mark">V</div>
            <span className="versaleads-brand-name">Versaleads</span>
            <span className="versaleads-brand-tag">By Versaly</span>
          </div>

          <div className="versaleads-nav-links">
            <button className="versaleads-nav-link" onClick={() => scrollTo("features")}>Platform</button>
            <button className="versaleads-nav-link" onClick={() => scrollTo("engine")}>Qualification Engine</button>
            <button className="versaleads-nav-link" onClick={() => scrollTo("simulator")}>Live Sandbox</button>
            <button className="versaleads-nav-link" onClick={() => scrollTo("testimonials")}>Testimonials</button>
            <button className="versaleads-nav-link" onClick={() => scrollTo("pricing")}>Pricing & Trial</button>
            <button className="versaleads-nav-link" onClick={() => scrollTo("faq")}>FAQ</button>
          </div>

          <div className="versaleads-nav-actions">
            {isSuperAdmin && onGoToAdmin && (
              <button
                className="versaleads-btn-ghost"
                onClick={onGoToAdmin}
                style={{
                  borderColor: "var(--color-gold)",
                  color: "var(--color-gold)",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(252, 163, 17, 0.08)"
                }}
              >
                <ShieldAlert size={14} /> Admin Platform
              </button>
            )}

            {user ? (
              <>
                <button className="versaleads-btn-primary" onClick={onGoToApp}>
                  Go to CRM Workspace <ArrowRight size={15} />
                </button>
                <button className="versaleads-btn-ghost" onClick={onLogout} style={{ padding: "8px 16px", fontSize: "13px" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="versaleads-btn-ghost" onClick={onOpenLogin}>
                  Sign In
                </button>
                <button className="versaleads-btn-primary" onClick={() => onStartTrial({ email: "", plan: "growth" })}>
                  Start Free Trial
                </button>
              </>
            )}
            <button
              className="versaleads-mobile-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="versaleads-mobile-menu">
            <div className="versaleads-mobile-menu-links">
              <button className="versaleads-mobile-nav-link" onClick={() => { scrollTo("features"); setMobileMenuOpen(false); }}>Platform</button>
              <button className="versaleads-mobile-nav-link" onClick={() => { scrollTo("engine"); setMobileMenuOpen(false); }}>Qualification Engine</button>
              <button className="versaleads-mobile-nav-link" onClick={() => { scrollTo("simulator"); setMobileMenuOpen(false); }}>Live Sandbox</button>
              <button className="versaleads-mobile-nav-link" onClick={() => { scrollTo("pricing"); setMobileMenuOpen(false); }}>Pricing & 14-Day Trial</button>
              <button className="versaleads-mobile-nav-link" onClick={() => { scrollTo("faq"); setMobileMenuOpen(false); }}>FAQ</button>
            </div>
            <div className="versaleads-mobile-menu-actions">
              {user ? (
                <>
                  <button className="versaleads-btn-primary" style={{ width: "100%" }} onClick={() => { onGoToApp(); setMobileMenuOpen(false); }}>
                    Go to CRM Workspace <ArrowRight size={15} />
                  </button>
                  <button className="versaleads-btn-ghost" style={{ width: "100%" }} onClick={() => { onLogout(); setMobileMenuOpen(false); }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button className="versaleads-btn-ghost" style={{ width: "100%" }} onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}>
                    Sign In
                  </button>
                  <button className="versaleads-btn-primary" style={{ width: "100%" }} onClick={() => { onStartTrial({ email: "", plan: "growth" }); setMobileMenuOpen(false); }}>
                    Start 14-Day Free Trial
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Full-Bleed Hero Section */}
      <section className="versaleads-hero">
        <div className="versaleads-hero-bg-layer" aria-hidden="true">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="versaleads-hero-bg-img"
          />
          <div className="versaleads-hero-gradient-overlay" />
        </div>

        <div className="versaleads-hero-content">
          <div className="versaleads-pill-badge">
            <span className="versaleads-pill-dot" />
            <span>Versaleads Intelligence System · 14-Day Full Access Trial</span>
          </div>

          <h1 className="versaleads-display">
            High-precision lead qualification, automated at scale.
          </h1>

          <p className="versaleads-hero-subtext">
            Stop pitching unvetted companies. Versaleads crawls websites, verifies decision makers, 
            scores prospects from 0 to 100 on objective commercial criteria, and drafts tailored outreach.
          </p>

          <form className="versaleads-email-form" onSubmit={handleHeroSubmit}>
            <input
              type="email"
              className="versaleads-email-input"
              placeholder="Enter your work email address"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              required
            />
            <button type="submit" className="versaleads-email-btn">
              Start 14-Day Free Trial
            </button>
          </form>

          <div className="versaleads-hero-guarantees">
            <div className="versaleads-hero-guarantee-item">
              <CheckCircle2 size={15} color="#fca311" />
              <span>14-day free trial on all plans</span>
            </div>
            <div className="versaleads-hero-guarantee-item">
              <CheckCircle2 size={15} color="#fca311" />
              <span>No credit card required to start</span>
            </div>
            <div className="versaleads-hero-guarantee-item">
              <CheckCircle2 size={15} color="#fca311" />
              <span>Universal across all B2B industries</span>
            </div>
            <div className="versaleads-hero-guarantee-item">
              <CheckCircle2 size={15} color="#fca311" />
              <span>Isolated tenant workspaces</span>
            </div>
          </div>
        </div>
      </section>

      {/* Backend System Live Mockup / Value Preview */}
      <section className="versaleads-section" id="engine" style={{ paddingTop: 0 }}>
        <div className="versaleads-container">
          <div className="versaleads-card" style={{ padding: "36px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
                  Live System Architecture
                </span>
                <h3 className="versaleads-heading" style={{ margin: "4px 0 0" }}>Inside the Versaleads Intelligence Engine</h3>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span className="versaleads-caption" style={{ background: "rgba(252, 163, 17, 0.12)", color: "var(--color-gold)", padding: "6px 12px", borderRadius: "40px", border: "1px solid rgba(252, 163, 17, 0.3)" }}>
                  Connected to PostgreSQL Backend
                </span>
                <button className="versaleads-btn-ghost" onClick={user ? onGoToApp : onOpenLogin} style={{ padding: "8px 16px", fontSize: "13px" }}>
                  {user ? "Open CRM Backend" : "View Live Demo"}
                </button>
              </div>
            </div>

            <div className="versaleads-grid-3">
              <div style={{ background: "var(--color-card-elevated)", border: "1px solid var(--color-border)", padding: "24px", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: "600" }}>
                  <Globe size={16} color="#fca311" /> Deep Website Research Bot
                </div>
                <p className="versaleads-body" style={{ fontSize: "13.5px", margin: 0 }}>
                  Extracts company positioning, technical stack, commercial offering, and trust seals directly from root domains.
                </p>
                <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--color-gold)", fontFamily: "monospace" }}>
                  STATUS: 200 OK · 14 signals observed
                </div>
              </div>

              <div style={{ background: "var(--color-card-elevated)", border: "1px solid var(--color-border)", padding: "24px", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: "600" }}>
                  <Award size={16} color="#fca311" /> 100-Point Explainable Score
                </div>
                <p className="versaleads-body" style={{ fontSize: "13.5px", margin: 0 }}>
                  Every lead is ranked with transparent point deductions and evidence citations. Zero arbitrary rankings.
                </p>
                <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--color-gold)", fontFamily: "monospace" }}>
                  ALGORITHM: Cross-Industry Fit v3.2
                </div>
              </div>

              <div style={{ background: "var(--color-card-elevated)", border: "1px solid var(--color-border)", padding: "24px", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: "600" }}>
                  <Mail size={16} color="#fca311" /> High-Relevance Outreach
                </div>
                <p className="versaleads-body" style={{ fontSize: "13.5px", margin: 0 }}>
                  Synthesizes real marketing gaps and verified pain points into tailored executive outreach and 3-step follow-ups.
                </p>
                <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--color-gold)", fontFamily: "monospace" }}>
                  CONVERSION: Tailored Pitch Generated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section className="versaleads-section" id="simulator">
        <div className="versaleads-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 36px" }}>
            <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
              Interactive Sandbox
            </span>
            <h2 className="versaleads-heading-lg">See how Versaleads qualifies leads in real time</h2>
            <p className="versaleads-body-lg">
              Select an industry to observe how the qualification engine extracts commercial signals, 
              computes score factors, and matches the optimal service pitch.
            </p>
          </div>

          <div className="versaleads-tabs" style={{ justifyContent: "center" }}>
            {DEMO_INDUSTRIES.map((ind) => (
              <button
                key={ind.key}
                className={`versaleads-tab ${selectedIndustry.key === ind.key ? "versaleads-tab-active" : ""}`}
                onClick={() => setSelectedIndustry(ind)}
              >
                {ind.name}
              </button>
            ))}
          </div>

          <div className="versaleads-simulator">
            <div className="versaleads-sim-body">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <Building size={16} color="#fca311" />
                  <span style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>{selectedIndustry.company}</span>
                  <span className="versaleads-caption" style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "4px" }}>
                    {selectedIndustry.website}
                  </span>
                </div>

                <div className="versaleads-score-display">
                  <div className="versaleads-score-big">{selectedIndustry.score}</div>
                  <div className="versaleads-score-scale">/ 100</div>
                  <div style={{ marginLeft: "14px", padding: "4px 10px", borderRadius: "40px", fontSize: "12px", background: "rgba(252, 163, 17, 0.15)", color: "var(--color-gold)", border: "1px solid rgba(252, 163, 17, 0.3)" }}>
                    {selectedIndustry.qualification}
                  </div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {selectedIndustry.signals.map((sig, idx) => (
                    <div className="versaleads-sim-factor" key={idx}>
                      <div className="versaleads-sim-factor-head">
                        <span>{sig.name}</span>
                        <strong style={{ color: "#ffffff" }}>{sig.value} / 100</strong>
                      </div>
                      <div className="versaleads-progress-track">
                        <div className="versaleads-progress-fill" style={{ width: `${sig.value}%` }} />
                      </div>
                      <p className="versaleads-body" style={{ fontSize: "12.5px", margin: "6px 0 0" }}>
                        {sig.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--color-card-elevated)", padding: "28px", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-gold)", display: "block", marginBottom: "8px" }}>
                  Automated Recommendation
                </span>
                <h4 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 10px 0", color: "#ffffff" }}>
                  {selectedIndustry.recommendedPitch}
                </h4>
                <p className="versaleads-body" style={{ fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                  {selectedIndustry.deliverable}
                </p>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "16px" }}>
                  <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", display: "block", marginBottom: "8px" }}>
                    Evidence Backlog
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                    ✓ Root domain headers audited<br />
                    ✓ SSL & infrastructure verified<br />
                    ✓ Commercial pricing tiers detected<br />
                    ✓ Verified contact points saved to case file
                  </div>
                </div>

                <button
                  className="versaleads-btn-primary"
                  style={{ width: "100%", marginTop: "24px" }}
                  onClick={() => onStartTrial({ email: "", plan: "growth" })}
                >
                  Qualify Your Own Leads Free <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Features Grid */}
      <section className="versaleads-section" id="features">
        <div className="versaleads-container">
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 52px" }}>
            <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
              Engine Capabilities
            </span>
            <h2 className="versaleads-heading-lg">Engineered for client acquisition teams</h2>
            <p className="versaleads-body-lg">
              Everything required to discover, audit, score, and close high-value B2B accounts across any industry.
            </p>
          </div>

          <div className="versaleads-grid-3">
            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <Compass size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>Universal Industry Discovery</h3>
              <p className="versaleads-body">
                Search and surface verified businesses across 12+ industry sectors in any domestic or international market without regional barriers.
              </p>
            </div>

            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <Layers size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>Audit-Proof Evidence Logs</h3>
              <p className="versaleads-body">
                Every score deduction and recommended pitch is rooted in verifiable web citations, page evidence, and observable digital signals.
              </p>
            </div>

            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <BrainCircuit size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>Strategic AI Analysis</h3>
              <p className="versaleads-body">
                Synthesizes verified case files into decision-maker guidance, competitive context, anticipated client objections, and counter-strategies.
              </p>
            </div>

            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <Mail size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>Contextual Sequence Generator</h3>
              <p className="versaleads-body">
                Generates multi-step executive email drafts tailored to each prospect's verified operational gaps, saving hours of manual research.
              </p>
            </div>

            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <Lock size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>True Tenant Isolation</h3>
              <p className="versaleads-body">
                Each team account is isolated in its own private workspace with individual lead records, outreach sequences, and zero demo data bleed.
              </p>
            </div>

            <div className="versaleads-card versaleads-card-interactive">
              <div className="versaleads-card-icon">
                <BarChart2 size={22} />
              </div>
              <h3 className="versaleads-heading" style={{ fontSize: "20px" }}>Pipeline Status Tracker</h3>
              <p className="versaleads-body">
                Monitor outreach cycles, next follow-up milestones, and lead qualification distributions in a unified, distraction-free control panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Testimonials Section (Live Dynamic CMS) */}
      <section className="versaleads-section" id="testimonials">
        <div className="versaleads-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
            <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
              Verified Client Outcomes
            </span>
            <h2 className="versaleads-heading-lg">Trusted by high-growth acquisition teams</h2>
            <p className="versaleads-body-lg">
              From enterprise SaaS consultants to high-volume outbound agencies, see how client acquisition specialists use our qualification intelligence.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {(siteContent?.testimonials || [
              {
                id: "t-1",
                name: "David Mwangi",
                role: "Head of Outbound Growth",
                company: "Kipawa Tech Ventures",
                avatar: "DM",
                rating: 5,
                result: "+310% Qualified Pipeline",
                content: "Versaleads cut our SDR prospecting time from 4 hours daily to under 15 minutes. The 100-point qualification audit gives our reps instant talking points that actually convert enterprise buyers in Nairobi and globally.",
                published: true
              },
              {
                id: "t-2",
                name: "Elena Rostova",
                role: "Managing Director",
                company: "SaaS Bridge Agency",
                avatar: "ER",
                rating: 5,
                result: "4.8x Reply Rate",
                content: "Before Versaleads, 60% of our outbound emails bounced off generic gatekeepers. With live commercial evidence extraction, our personalized first touch replies quadrupled in the first three weeks.",
                published: true
              },
              {
                id: "t-3",
                name: "Brian Ochieng",
                role: "Co-founder & CRO",
                company: "Aura Logistics Group",
                avatar: "BO",
                rating: 5,
                result: "1,200+ Vetted Targets / Mo",
                content: "The tenant isolation and sequence engine make it effortless to scale multiple client campaigns simultaneously. Versaleads is the single highest-ROI prospecting software our agency has adopted.",
                published: true
              }
            ]).filter(t => t.published !== false).map((t) => (
              <div
                key={t.id}
                className="versaleads-card liquid-glass"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "32px",
                  borderRadius: "16px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "3px" }}>
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} size={15} fill="#fca311" color="#fca311" />
                      ))}
                    </div>
                    {t.result && (
                      <span style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        border: "1px solid rgba(34, 197, 94, 0.4)",
                        color: "var(--color-signal)",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "4px"
                      }}>
                        {t.result}
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: "15px",
                    lineHeight: "1.65",
                    color: "var(--color-platinum)",
                    fontStyle: "italic",
                    margin: "0 0 20px"
                  }}>
                    "{t.content}"
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(252, 163, 17, 0.15)",
                    border: "1px solid var(--color-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "13px",
                    color: "var(--color-gold)"
                  }}>
                    {t.avatar || t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "14.5px", display: "block" }}>{t.name}</strong>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>{t.role} · {t.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with 14-Day Free Trial */}
      <section className="versaleads-section" id="pricing">
        <div className="versaleads-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
            <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
              Transparent Investment
            </span>
            <h2 className="versaleads-heading-lg">14 days free. Cancel anytime.</h2>
            <p className="versaleads-body-lg">
              Start with a full-featured 14-day free trial on any plan. No credit card required to begin qualifying leads.
            </p>
          </div>

          <div className="versaleads-pricing-grid">
            {/* Starter Plan */}
            <div className="versaleads-card versaleads-pricing-card">
              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>
                  {siteContent?.pricing?.starter?.badge || "Boutique & Solo"}
                </span>
                <h3 className="versaleads-heading" style={{ fontSize: "24px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.starter?.name || "Starter"}
                </h3>
                <p className="versaleads-body" style={{ fontSize: "14px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.starter?.description || "Ideal for solo founders and consultants qualifying their initial outbound targets."}
                </p>

                <div className="versaleads-price-box">
                  <span className="versaleads-price-num">
                    <span style={{ fontSize: "19px", fontWeight: "600", marginRight: "6px", color: "var(--color-gold)", letterSpacing: "0.04em" }}>KES</span>
                    {siteContent?.pricing?.starter?.priceKes || "6,500"}
                  </span>
                  <span className="versaleads-price-period">{siteContent?.pricing?.starter?.period || "/ month"}</span>
                </div>

                <ul className="versaleads-feature-list">
                  {siteContent?.pricing?.starter?.features && siteContent.pricing.starter.features.length > 0 ? (
                    siteContent.pricing.starter.features.map((feat, idx) => (
                      <li key={idx} className="versaleads-feature-item">
                        <Check size={16} /> <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>250 qualified leads / month</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Real-time live website research bot</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>100-point qualification scoring engine</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>AI strategic gap analysis</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>1 isolated workspace seat</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <button
                  className="versaleads-btn-ghost"
                  style={{ width: "100%" }}
                  onClick={() => onStartTrial({ email: "", plan: "starter" })}
                >
                  Start 14-Day Free Trial
                </button>
                <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "10px" }}>
                  No credit card required
                </div>
              </div>
            </div>

            {/* Growth / Pro Plan (Featured) */}
            <div className="versaleads-card versaleads-pricing-card versaleads-pricing-featured">
              <span className="versaleads-pricing-badge">{siteContent?.pricing?.growth?.popularBadge || "Most Popular"}</span>
              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
                  {siteContent?.pricing?.growth?.badge || "Agencies & Growth Teams"}
                </span>
                <h3 className="versaleads-heading" style={{ fontSize: "24px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.growth?.name || "Growth"}
                </h3>
                <p className="versaleads-body" style={{ fontSize: "14px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.growth?.description || "For scaling acquisition agencies requiring high-volume discovery and team collaboration."}
                </p>

                <div className="versaleads-price-box">
                  <span className="versaleads-price-num">
                    <span style={{ fontSize: "19px", fontWeight: "600", marginRight: "6px", color: "var(--color-gold)", letterSpacing: "0.04em" }}>KES</span>
                    {siteContent?.pricing?.growth?.priceKes || "16,500"}
                  </span>
                  <span className="versaleads-price-period">{siteContent?.pricing?.growth?.period || "/ month"}</span>
                </div>

                <ul className="versaleads-feature-list">
                  {siteContent?.pricing?.growth?.features && siteContent.pricing.growth.features.length > 0 ? (
                    siteContent.pricing.growth.features.map((feat, idx) => (
                      <li key={idx} className="versaleads-feature-item">
                        <Check size={16} /> <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span><strong>1,500 qualified leads / month</strong></span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span><strong>Universal Multi-Industry Discovery Engine</strong></span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Multi-step tailored outreach sequence generator</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Deep competitor and objection analysis</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>5 team seats with role permissions</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>CSV and CRM data export</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <button
                  className="versaleads-btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => onStartTrial({ email: "", plan: "growth" })}
                >
                  Start 14-Day Free Trial
                </button>
                <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "10px" }}>
                  Full features · Cancel anytime
                </div>
              </div>
            </div>

            {/* Scale / Enterprise */}
            <div className="versaleads-card versaleads-pricing-card">
              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>
                  {siteContent?.pricing?.scale?.badge || "High-Volume Outbound"}
                </span>
                <h3 className="versaleads-heading" style={{ fontSize: "24px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.scale?.name || "Scale"}
                </h3>
                <p className="versaleads-body" style={{ fontSize: "14px", margin: "6px 0 0" }}>
                  {siteContent?.pricing?.scale?.description || "For enterprise sales development teams managing continuous high-velocity campaigns."}
                </p>

                <div className="versaleads-price-box">
                  <span className="versaleads-price-num">
                    <span style={{ fontSize: "19px", fontWeight: "600", marginRight: "6px", color: "var(--color-gold)", letterSpacing: "0.04em" }}>KES</span>
                    {siteContent?.pricing?.scale?.priceKes || "38,500"}
                  </span>
                  <span className="versaleads-price-period">{siteContent?.pricing?.scale?.period || "/ month"}</span>
                </div>

                <ul className="versaleads-feature-list">
                  {siteContent?.pricing?.scale?.features && siteContent.pricing.scale.features.length > 0 ? (
                    siteContent.pricing.scale.features.map((feat, idx) => (
                      <li key={idx} className="versaleads-feature-item">
                        <Check size={16} /> <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>5,000+ qualified leads / month</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Dedicated scraping bot proxies</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Custom qualification factor weighting</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>Unlimited team seats</span>
                      </li>
                      <li className="versaleads-feature-item">
                        <Check size={16} /> <span>REST API and webhook integration</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <button
                  className="versaleads-btn-ghost"
                  style={{ width: "100%" }}
                  onClick={() => onStartTrial({ email: "", plan: "scale" })}
                >
                  Start 14-Day Free Trial
                </button>
                <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "10px" }}>
                  Includes priority onboarding
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section className="versaleads-section" id="faq">
        <div className="versaleads-container" style={{ maxWidth: "860px" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gold)" }}>
              Frequently Asked Questions
            </span>
            <h2 className="versaleads-heading-lg">Everything you need to know</h2>
          </div>

          <div>
            {[
              {
                q: "How does the 14-day free trial work?",
                a: "You receive full, unrestricted access to the Versaleads lead qualification CRM for 14 days upon registration. No credit card is required to sign up. You can discover leads, crawl live websites, test the 100-point qualification engine, and generate personalized outreach sequences immediately."
              },
              {
                q: "How does Versaleads qualify leads across different industries?",
                a: "Unlike generic scrapers that only check company headcounts, Versaleads executes a deep digital audit evaluating commercial viability, positioning clarity, verified decision makers, and tangible operational gaps across 12+ industries (Tech/SaaS, Healthcare, Financial Services, E-Commerce, Hospitality, Real Estate, Legal, etc.). Every point awarded or deducted is backed by verifiable case evidence."
              },
              {
                q: "Will my leads and prospecting notes be kept private?",
                a: "Yes. Versaleads operates on a multi-tenant database architecture. Every user and organization has an isolated workspace keyed to their private user ID. No other user can view, search, or export your prospect case files."
              },
              {
                q: "Does Versaleads invent or hallucinate company details?",
                a: "No. Our AI strategic analysis engine is strictly grounded on the supplied case-file evidence and live website audit. If evidence is missing for a particular signal, Versaleads clearly flags it as unverified rather than fabricating information."
              },
              {
                q: "Can I export data to my existing CRM or email sequencer?",
                a: "Yes. You can export qualified lead dossiers, decision-maker contact points, and generated outreach messages directly into your CRM or outbound tool via CSV or clipboard."
              }
            ].map((faq, idx) => (
              <div className="versaleads-faq-item" key={idx}>
                <button
                  className="versaleads-faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} color="var(--color-gold)" /> : <ChevronDown size={18} color="var(--color-text-secondary)" />}
                </button>
                {openFaq === idx && (
                  <div className="versaleads-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Footer Action Banner */}
      <section className="versaleads-section" style={{ backgroundColor: "var(--color-card)", borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
        <div className="versaleads-container" style={{ maxWidth: "720px" }}>
          <h2 className="versaleads-heading-lg" style={{ color: "#ffffff" }}>
            Ready to upgrade your client acquisition pipeline?
          </h2>
          <p className="versaleads-body-lg" style={{ marginBottom: "32px" }}>
            Join forward-thinking agencies and sales teams qualifying B2B leads with audit-proof precision.
          </p>

          <form className="versaleads-email-form" onSubmit={handleHeroSubmit}>
            <input
              type="email"
              className="versaleads-email-input"
              placeholder="Enter your work email address"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              required
            />
            <button type="submit" className="versaleads-email-btn">
              Start 14-Day Free Trial
            </button>
          </form>

          <div className="versaleads-caption" style={{ color: "var(--color-text-secondary)", marginTop: "12px" }}>
            Instant setup · 14-day full access · No payment details needed
          </div>
        </div>
      </section>

      {/* Footer & Disclaimer */}
      <footer className="versaleads-footer">
        <div className="versaleads-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px" }}>
            <div>
              <div className="versaleads-brand" style={{ marginBottom: "12px" }}>
                <div className="versaleads-brand-mark">V</div>
                <span className="versaleads-brand-name">Versaleads</span>
              </div>
              <p className="versaleads-body" style={{ maxWidth: "340px", fontSize: "14px", margin: 0 }}>
                Universal B2B Lead Intelligence, Qualification & Client Acquisition CRM.
              </p>
            </div>

            <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-platinum)", display: "block", marginBottom: "12px" }}>
                  Product
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <a href="#features" className="versaleads-nav-link" style={{ padding: "0" }}>Features</a>
                  <a href="#engine" className="versaleads-nav-link" style={{ padding: "0" }}>Qualification Engine</a>
                  <a href="#pricing" className="versaleads-nav-link" style={{ padding: "0" }}>Pricing & 14-Day Trial</a>
                  <a href="#simulator" className="versaleads-nav-link" style={{ padding: "0" }}>Interactive Sandbox</a>
                </div>
              </div>

              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-platinum)", display: "block", marginBottom: "12px" }}>
                  Legal & Compliance
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <button className="versaleads-nav-link" onClick={() => setLegalTab("terms")} style={{ padding: 0, textAlign: "left", background: "none", border: "none" }}>Terms of Service</button>
                  <button className="versaleads-nav-link" onClick={() => setLegalTab("privacy")} style={{ padding: 0, textAlign: "left", background: "none", border: "none" }}>Privacy Policy</button>
                  <button className="versaleads-nav-link" onClick={() => setLegalTab("security")} style={{ padding: 0, textAlign: "left", background: "none", border: "none" }}>Security & Isolation</button>
                </div>
              </div>

              <div>
                <span className="versaleads-caption" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-platinum)", display: "block", marginBottom: "12px" }}>
                  Access
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  {user ? (
                    <button className="versaleads-nav-link" onClick={onGoToApp} style={{ padding: 0, textAlign: "left" }}>CRM Workspace</button>
                  ) : (
                    <>
                      <button className="versaleads-nav-link" onClick={onOpenLogin} style={{ padding: 0, textAlign: "left" }}>Sign In</button>
                      <button className="versaleads-nav-link" onClick={() => onStartTrial({ email: "", plan: "growth" })} style={{ padding: 0, textAlign: "left" }}>Start Free Trial</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="versaleads-disclaimer">
            Versaleads is an autonomous lead intelligence and qualification platform. All qualification scoring and service recommendations are based on verifiable public digital evidence. Subscriptions are billed monthly with standard self-service cancellation.
          </div>

          <div className="versaleads-footer-bottom">
            <div>
              © {new Date().getFullYear()} Versaleads Intelligence. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ cursor: "pointer" }} onClick={() => setLegalTab("terms")}>Terms</span>
              <span>·</span>
              <span style={{ cursor: "pointer" }} onClick={() => setLegalTab("privacy")}>Privacy</span>
              <span>·</span>
              <span style={{ cursor: "pointer" }} onClick={() => setLegalTab("security")}>Security</span>
              <span>·</span>
              <span style={{ cursor: "pointer" }} onClick={() => scrollTo("pricing")}>Pricing</span>
              <span>·</span>
              <span style={{ cursor: "pointer" }} onClick={onOpenLogin}>Login</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal & Compliance Modal */}
      <LegalModal
        isOpen={!!legalTab}
        onClose={() => setLegalTab(null)}
        initialTab={legalTab || "terms"}
      />

      {/* Cookie Consent Banner */}
      <CookieBanner />
    </div>
  );
}
