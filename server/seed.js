import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

async function main() {
  console.log('Seeding demo database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Seed Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@versaleads.com' },
    update: { passwordHash, name: 'Versaleads Demo' },
    create: {
      email: 'demo@versaleads.com',
      name: 'Versaleads Demo',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Seed Versaly Labs Superadmin User
  const versalyPasswordHash = await bcrypt.hash('labversaly-16', 12);
  const versalyUser = await prisma.user.upsert({
    where: { email: 'versalylabs@gmail.com' },
    update: { passwordHash: versalyPasswordHash, name: 'Ted Khalwale' },
    create: {
      email: 'versalylabs@gmail.com',
      name: 'Ted Khalwale',
      passwordHash: versalyPasswordHash,
      role: 'ADMIN',
    },
  });

  const demoProspects = [
    {
      company: 'Apex Cloud Solutions',
      contactName: 'Sarah Jenkins',
      email: 'sjenkins@apexcloud.io',
      phone: '+1 415 555 2401',
      website: 'apexcloud.io',
      location: 'San Francisco, CA, USA',
      country: 'United States',
      score: 88,
      qualification: 'HIGH',
      researchStatus: 'researched',
      caseData: {
        companyName: 'Apex Cloud Solutions',
        contactName: 'Sarah Jenkins',
        contactRole: 'VP of Growth',
        location: 'San Francisco, CA, USA',
        industry: 'Technology & SaaS',
        businessType: 'B2B Cloud Infrastructure',
        website: 'apexcloud.io',
        linkedin: 'https://linkedin.com/company/apex-cloud',
        targetAudience: 'Mid-market DevOps leads and CTOs scaling cloud infrastructure',
        positioning: 'Enterprise-grade multi-cloud cost governance and autoscaling',
        score: 88,
        recommendedService: 'B2B Performance Lead Generation',
        recommendedReason: 'High customer lifetime value ($36k/yr ACV) with unoptimized outbound funnel and long sales cycle',
      },
      evidence: [
        {
          finding: 'Recently raised Series A ($8M) and expanding outbound sales engineering team',
          source: 'TechCrunch & Company Press',
          confidence: 'HIGH',
          kind: 'CONFIRMED',
        },
        {
          finding: 'Current website has no interactive pricing calculator or automated demo scheduler',
          source: 'Live Website Audit',
          confidence: 'HIGH',
          kind: 'CONFIRMED',
        },
      ],
    },
    {
      company: 'Novacare Health Systems',
      contactName: 'Dr. Michael Chen',
      email: 'mchen@novacarehealth.org',
      phone: '+1 312 555 8920',
      website: 'novacarehealth.org',
      location: 'Chicago, IL, USA',
      country: 'United States',
      score: 82,
      qualification: 'HIGH',
      researchStatus: 'researched',
      caseData: {
        companyName: 'Novacare Health Systems',
        contactName: 'Dr. Michael Chen',
        contactRole: 'Chief Clinical Officer',
        location: 'Chicago, IL, USA',
        industry: 'Healthcare & Medical',
        businessType: 'Regional Specialty Clinic Network',
        website: 'novacarehealth.org',
        targetAudience: 'Patients seeking specialized orthopedic and spine rehabilitation',
        positioning: 'Patient-first outpatient surgical recovery network',
        score: 82,
        recommendedService: 'Website & Conversion Optimization',
        recommendedReason: 'High clinic visit volume but outdated patient intake portal causing 40% patient drop-off',
      },
      evidence: [
        {
          finding: 'Expanded to 5 metropolitan clinic locations across Greater Chicago',
          source: 'State Licensing Directory',
          confidence: 'HIGH',
          kind: 'CONFIRMED',
        },
      ],
    },
    {
      company: 'Kilifi Creek Luxury Estates',
      contactName: 'Ahmed Omar',
      email: 'sales@kilificreek.ke',
      phone: '+254 722 987 654',
      website: 'kilificreekvillas.co.ke',
      location: 'Kilifi, Kenya',
      country: 'Kenya',
      score: 91,
      qualification: 'HIGH',
      researchStatus: 'researched',
      caseData: {
        companyName: 'Kilifi Creek Luxury Estates',
        contactName: 'Ahmed Omar',
        contactRole: 'Managing Director',
        location: 'Kilifi, Kenya',
        industry: 'Real Estate & Development',
        businessType: 'Luxury Waterfront Developer',
        website: 'kilificreekvillas.co.ke',
        instagram: '@kilificreekvillas',
        targetAudience: 'High-net-worth local and international coastal investors',
        positioning: 'Ultra-exclusive eco-luxury waterfront living on the Kenyan coast',
        score: 91,
        recommendedService: 'High-Impact Brand & Creative Production',
        recommendedReason: 'Exceptional architectural assets that convert rapidly with 4K drone video campaigns and VIP open-house reels',
      },
      evidence: [
        {
          finding: 'Phase 1 sold out, Phase 2 launching Q4 with 12 beachfront villas',
          source: 'Press Release & Website',
          confidence: 'HIGH',
          kind: 'CONFIRMED',
        },
      ],
    },
  ];

  for (const user of [demoUser, versalyUser]) {
    for (const item of demoProspects) {
      const existing = await prisma.prospect.findFirst({
        where: { ownerId: user.id, company: item.company },
      });
      if (!existing) {
        await prisma.prospect.create({
          data: {
            ownerId: user.id,
            company: item.company,
            contactName: item.contactName,
            email: item.email,
            phone: item.phone,
            website: item.website,
            location: item.location,
            country: item.country,
            score: item.score,
            qualification: item.qualification,
            researchStatus: item.researchStatus,
            caseData: item.caseData,
            evidence: item.evidence ? {
              create: item.evidence.map((ev) => ({
                finding: ev.finding,
                source: ev.source,
                confidence: ev.confidence,
                kind: ev.kind,
              })),
            } : undefined,
          },
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
