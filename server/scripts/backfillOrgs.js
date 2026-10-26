import { prisma } from '../prisma.js';

async function backfill() {
  console.log('Starting Organization backfill...');
  const users = await prisma.user.findMany({
    include: { memberships: true, prospects: true, discoveryLeads: true }
  });
  console.log(`Found ${users.length} users to verify.`);

  for (const user of users) {
    let orgId;
    if (user.memberships.length === 0) {
      const orgName = user.name ? `${user.name}'s Workspace` : `${user.email.split('@')[0]} Workspace`;
      const slug = `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug,
          plan: 'GROWTH',
          subscriptionStatus: 'TRIALING',
          trialEndsAt,
          monthlyLeadQuota: 1500,
          leadsUsedThisMonth: user.prospects.length,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      });
      orgId = org.id;
      console.log(`Created organization for ${user.email} -> ${org.name} (${org.id})`);
    } else {
      orgId = user.memberships[0].organizationId;
    }

    const updatedProspects = await prisma.prospect.updateMany({
      where: { ownerId: user.id, organizationId: null },
      data: { organizationId: orgId }
    });
    if (updatedProspects.count > 0) {
      console.log(`Linked ${updatedProspects.count} prospects for ${user.email} to organization ${orgId}`);
    }

    const updatedLeads = await prisma.discoveryLead.updateMany({
      where: { ownerId: user.id, organizationId: null },
      data: { organizationId: orgId }
    });
    if (updatedLeads.count > 0) {
      console.log(`Linked ${updatedLeads.count} discovery leads for ${user.email} to organization ${orgId}`);
    }
  }

  await prisma.$disconnect();
  console.log('Backfill successfully finished.');
}

backfill().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
