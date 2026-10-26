import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/site-content.json');

const DEFAULT_CONTENT = {
  pricing: {
    starter: {
      key: 'STARTER',
      name: 'Starter',
      badge: 'Boutique & Solo',
      priceKes: '6,500',
      period: '/ month',
      description: 'Ideal for solo founders and consultants qualifying their initial outbound targets.',
      leadQuota: 250,
      features: [
        '250 qualified leads / month',
        'Real-time live website research bot',
        '100-point qualification scoring engine',
        'AI strategic gap analysis',
        '1 isolated workspace seat',
      ],
    },
    growth: {
      key: 'GROWTH',
      name: 'Growth',
      badge: 'Agencies & Growth Teams',
      popularBadge: 'Most Popular',
      priceKes: '16,500',
      period: '/ month',
      description: 'For scaling acquisition agencies requiring high-volume discovery and team collaboration.',
      leadQuota: 1500,
      features: [
        '1,500 qualified leads / month',
        'Universal Multi-Industry Discovery Engine',
        'Multi-step tailored outreach sequence generator',
        'Deep competitor and objection analysis',
        '5 team seats with role permissions',
        'CSV and CRM data export',
      ],
    },
    scale: {
      key: 'ENTERPRISE',
      name: 'Scale',
      badge: 'High-Volume Outbound',
      priceKes: '38,500',
      period: '/ month',
      description: 'For enterprise sales development teams managing continuous high-velocity campaigns.',
      leadQuota: 10000,
      features: [
        '5,000+ qualified leads / month',
        'Dedicated scraping bot proxies',
        'Custom qualification factor weighting',
        'Unlimited team seats',
        'REST API and webhook integration',
      ],
    },
  },
  testimonials: [
    {
      id: 't-1',
      name: 'David Mwangi',
      role: 'Head of Outbound Growth',
      company: 'Kipawa Tech Ventures',
      avatar: 'DM',
      rating: 5,
      result: '+310% Qualified Pipeline',
      content: 'Versaleads cut our SDR prospecting time from 4 hours daily to under 15 minutes. The 100-point qualification audit gives our reps instant talking points that actually convert enterprise buyers in Nairobi and globally.',
      published: true,
    },
    {
      id: 't-2',
      name: 'Elena Rostova',
      role: 'Managing Director',
      company: 'SaaS Bridge Agency',
      avatar: 'ER',
      rating: 5,
      result: '4.8x Reply Rate',
      content: 'Before Versaleads, 60% of our outbound emails bounced off generic gatekeepers. With live commercial evidence extraction, our personalized first touch replies quadrupled in the first three weeks.',
      published: true,
    },
    {
      id: 't-3',
      name: 'Brian Ochieng',
      role: 'Co-founder & CRO',
      company: 'Aura Logistics Group',
      avatar: 'BO',
      rating: 5,
      result: '1,200+ Vetted Targets / Mo',
      content: 'The tenant isolation and sequence engine make it effortless to scale multiple client campaigns simultaneously. Versaleads is the single highest-ROI prospecting software our agency has adopted.',
      published: true,
    },
  ],
  announcement: {
    enabled: false,
    text: 'Versaleads 2.0 Live Engine with Real-Time Kenyan & Global Industry Verification',
    link: '#pricing',
  },
};

export function getSiteContent() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
      return DEFAULT_CONTENT;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[SiteContent] Failed reading site content:', err.message);
    return DEFAULT_CONTENT;
  }
}

export function saveSiteContent(newContent) {
  try {
    const existing = getSiteContent();
    const merged = { ...existing, ...newContent };
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('[SiteContent] Failed saving site content:', err.message);
    throw err;
  }
}
