import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Attach organizationId and orgRole
    if (!req.user.orgId) {
      let membership = await prisma.organizationMember.findFirst({
        where: { userId: decoded.sub },
        include: { organization: true },
        orderBy: { joinedAt: 'asc' },
      });

      // Self-heal: ensure every authenticated user has an active organization workspace
      if (!membership) {
        const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
        if (user) {
          const orgName = user.name ? `${user.name}'s Workspace` : `${user.email.split('@')[0]} Workspace`;
          const slug = `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

          const newOrg = await prisma.organization.create({
            data: {
              name: orgName,
              slug,
              plan: 'GROWTH',
              subscriptionStatus: 'TRIALING',
              trialEndsAt,
              monthlyLeadQuota: 1500,
              members: {
                create: {
                  userId: user.id,
                  role: 'OWNER',
                },
              },
            },
          });

          membership = {
            role: 'OWNER',
            organizationId: newOrg.id,
            organization: newOrg,
          };
        }
      }

      if (membership) {
        req.user.orgId = membership.organizationId;
        req.user.orgRole = membership.role;
        req.user.organization = membership.organization;
      }
    }

    req.user.organizationId = req.user.orgId || null;
    req.user.isAdmin = String(req.user.email || '').toLowerCase() === 'versalylabs@gmail.com';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Specifically and ONLY allow versalylabs@gmail.com with Superadmin privileges
 */
export function requireSuperAdmin(req, res, next) {
  if (!req.user || String(req.user.email || '').toLowerCase() !== 'versalylabs@gmail.com') {
    return res.status(403).json({
      error: 'Access denied. The Admin Platform is exclusively reserved for versalylabs@gmail.com.',
      code: 'SUPERADMIN_FORBIDDEN',
    });
  }
  next();
}
