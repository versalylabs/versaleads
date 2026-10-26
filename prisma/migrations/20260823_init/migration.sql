-- Initial production schema for Straten Lead Intelligence.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "EvidenceKind" AS ENUM ('CONFIRMED', 'OBSERVED', 'USER_PROVIDED', 'AI_SUGGESTION');
CREATE TYPE "OutreachStatus" AS ENUM ('DRAFTED', 'SENT', 'REPLIED', 'FOLLOW_UP_DUE', 'CLOSED');
CREATE TYPE "DiscoveryStatus" AS ENUM ('NEW', 'APPROVED', 'REJECTED', 'DUPLICATE');
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'NEEDS_REVIEW', 'REJECTED');
CREATE TYPE "DuplicateStatus" AS ENUM ('NONE', 'EXISTING_PROSPECT', 'DISCOVERY_INBOX');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "role" "Role" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prospect" (
  "id" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "location" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Kenya',
  "score" INTEGER NOT NULL DEFAULT 0,
  "qualification" TEXT,
  "researchStatus" TEXT NOT NULL DEFAULT 'idle',
  "aiAnalysis" JSONB,
  "caseData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evidence" (
  "id" TEXT NOT NULL,
  "finding" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "snippet" TEXT,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confidence" "Confidence" NOT NULL DEFAULT 'MEDIUM',
  "kind" "EvidenceKind" NOT NULL DEFAULT 'OBSERVED',
  "prospectId" TEXT NOT NULL,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutreachSequence" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '14-Day Outreach Sequence',
  "status" "OutreachStatus" NOT NULL DEFAULT 'DRAFTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "prospectId" TEXT NOT NULL,
  CONSTRAINT "OutreachSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutreachStep" (
  "id" TEXT NOT NULL,
  "day" INTEGER NOT NULL,
  "channel" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" "OutreachStatus" NOT NULL DEFAULT 'DRAFTED',
  "dueAt" TIMESTAMP(3),
  "sequenceId" TEXT NOT NULL,
  CONSTRAINT "OutreachStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscoveryLead" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "website" TEXT,
  "domain" TEXT,
  "location" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Kenya',
  "companyType" TEXT,
  "discoverySource" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceSnippet" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "searchQuery" TEXT,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "verificationReason" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "duplicateStatus" "DuplicateStatus" NOT NULL DEFAULT 'NONE',
  "duplicateProspectId" TEXT,
  "duplicateReason" TEXT,
  "status" "DiscoveryStatus" NOT NULL DEFAULT 'NEW',
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "prospectId" TEXT,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "DiscoveryLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "DiscoveryLead_ownerId_domain_key" ON "DiscoveryLead"("ownerId", "domain");
CREATE INDEX "DiscoveryLead_ownerId_status_idx" ON "DiscoveryLead"("ownerId", "status");
CREATE INDEX "DiscoveryLead_ownerId_companyName_idx" ON "DiscoveryLead"("ownerId", "companyName");

ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_prospectId_fkey"
  FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachSequence" ADD CONSTRAINT "OutreachSequence_prospectId_fkey"
  FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachStep" ADD CONSTRAINT "OutreachStep_sequenceId_fkey"
  FOREIGN KEY ("sequenceId") REFERENCES "OutreachSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscoveryLead" ADD CONSTRAINT "DiscoveryLead_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
