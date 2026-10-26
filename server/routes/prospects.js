import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription, checkLeadQuota } from '../middleware/subscription.js';
import { checkAndDispatchQuotaAlert } from '../services/email.js';

const r = Router();
r.use(requireAuth);
const kenyaOnly = String(process.env.KENYA_ONLY || 'false').toLowerCase() === 'true';
const owned = (req) =>
  req.user.organizationId
    ? { organizationId: req.user.organizationId }
    : { ownerId: req.user.sub };

function countryFor(body) {
  return body.country || (body.location && body.location.includes(',') ? body.location.split(',').pop().trim() : (kenyaOnly ? 'Kenya' : 'Global'));
}

function normalizeEvidence(items = []) {
  const confidenceMap = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
  const kindMap = { confirmed: 'CONFIRMED', observed: 'OBSERVED', user_provided: 'USER_PROVIDED', ai_suggestion: 'AI_SUGGESTION' };
  return items.filter(Boolean).map((item) => ({
    finding: String(item.finding || item.text || '').slice(0, 5000),
    source: String(item.source || item.label || 'Prospect research').slice(0, 500),
    sourceUrl: item.sourceUrl || item.url || null,
    snippet: item.evidence || item.snippet || item.text || null,
    confidence: confidenceMap[String(item.confidence || '').toLowerCase()] || 'MEDIUM',
    kind: kindMap[String(item.kind || item.sourceType || '').toLowerCase()] || 'OBSERVED',
    collectedAt: item.collectedAt ? new Date(item.collectedAt) : new Date(),
  })).filter((x) => x.finding);
}

function toClient(p) {
  const extra = p.caseData && typeof p.caseData === 'object' && !Array.isArray(p.caseData) ? p.caseData : {};
  return {
    ...extra,
    id: p.id,
    companyName: p.company,
    contactName: p.contactName || extra.contactName || '',
    email: p.email || extra.email || '',
    phone: p.phone || extra.phone || '',
    website: p.website || extra.website || '',
    location: p.location || extra.location || '',
    country: p.country,
    score: p.score ?? extra.score ?? null,
    qualification: p.qualification || extra.qualification || null,
    researchStatus: p.researchStatus || extra.researchStatus || 'not_started',
    aiAnalysis: p.aiAnalysis || extra.aiAnalysis || null,
    dateAdded: extra.dateAdded || p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    evidence: (p.evidence || []).map((e) => ({ ...e, collectedAt: e.collectedAt.toISOString() })),
    outreachSequence: p.sequences?.[0] ? {
      id: p.sequences[0].id,
      name: p.sequences[0].name,
      status: String(p.sequences[0].status || '').toLowerCase(),
      steps: p.sequences[0].steps.map((s) => ({ ...s, status: String(s.status || '').toLowerCase(), dueAt: s.dueAt?.toISOString() || null }))
    } : (extra.outreachSequence || null),
  };
}

function clean(value) {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  return value;
}

function optionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function coreData(body, ownerId, organizationId) {
  const company = String(body.companyName || body.company || '').trim();
  if (!company) { const err = new Error('Company name is required'); err.status = 400; throw err; }
  const country = countryFor(body);
  if (kenyaOnly && country !== 'Kenya') { const err = new Error('Kenya-only mode is enabled'); err.status = 400; throw err; }
  return {
    company,
    contactName: optionalText(body.contactName),
    email: optionalText(body.email),
    phone: optionalText(body.phone),
    website: optionalText(body.website),
    location: optionalText(body.location),
    country,
    score: Number.isFinite(Number(body.score)) ? Number(body.score) : 0,
    qualification: typeof body.qualification === 'string' ? body.qualification : null,
    researchStatus: body.researchStatus || 'not_started',
    aiAnalysis: body.aiAnalysis || null,
    caseData: clean(body),
    ...(ownerId ? { ownerId } : {}),
    ...(organizationId ? { organizationId } : {}),
  };
}

async function syncRelations(tx, prospectId, body) {
  if (Array.isArray(body.evidence)) {
    await tx.evidence.deleteMany({ where: { prospectId } });
    const evidence = normalizeEvidence(body.evidence);
    if (evidence.length) await tx.evidence.createMany({ data: evidence.map((e) => ({ ...e, prospectId })) });
  }
  if (body.outreachSequence && Array.isArray(body.outreachSequence.steps)) {
    await tx.outreachSequence.deleteMany({ where: { prospectId } });
    const statusMap = { drafted: 'DRAFTED', sent: 'SENT', replied: 'REPLIED', follow_up_due: 'FOLLOW_UP_DUE', closed: 'CLOSED' };
    await tx.outreachSequence.create({ data: {
      name: body.outreachSequence.name || '14-Day Outreach Sequence',
      status: statusMap[body.outreachSequence.status] || 'DRAFTED',
      prospectId,
      steps: { create: body.outreachSequence.steps.map((s) => ({ day: Number(s.day) || 1, channel: s.channel || 'Email', subject: s.subject || null, body: s.body || '', status: statusMap[s.status] || 'DRAFTED', dueAt: s.dueAt ? new Date(s.dueAt) : null })) }
    }});
  }
}

const include = {
  evidence: { orderBy: { collectedAt: 'desc' } },
  sequences: { include: { steps: { orderBy: { day: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 1 }
};

r.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.prospect.findMany({
      where: { ...owned(req), ...(kenyaOnly ? { country: 'Kenya' } : {}) },
      include,
      orderBy: { updatedAt: 'desc' }
    });
    res.json(rows.map(toClient));
  } catch (e) { next(e); }
});

r.post('/', requireActiveSubscription, checkLeadQuota, async (req, res, next) => {
  try {
    const created = await prisma.$transaction(async (tx) => {
      const p = await tx.prospect.create({
        data: coreData(req.body, req.user.sub, req.user.organizationId)
      });
      await syncRelations(tx, p.id, req.body);

      // Increment quota counter on organization
      if (req.user.organizationId) {
        await tx.organization.update({
          where: { id: req.user.organizationId },
          data: { leadsUsedThisMonth: { increment: 1 } }
        });
      }

      return tx.prospect.findUnique({ where: { id: p.id }, include });
    });

    if (req.user.organizationId) {
      checkAndDispatchQuotaAlert(req.user.organizationId).catch((err) => {
        console.error('[Prospects] Quota alert dispatch error:', err.message);
      });
    }

    res.status(201).json(toClient(created));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.prospect.findFirst({ where: { id: req.params.id, ...owned(req) }, include });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(toClient(p));
  } catch (e) { next(e); }
});

r.patch('/:id', requireActiveSubscription, async (req, res, next) => {
  try {
    const existing = await prisma.prospect.findFirst({ where: { id: req.params.id, ...owned(req) } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const body = { ...(existing.caseData || {}), ...req.body };
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.prospect.update({ where: { id: existing.id }, data: coreData(body) });
      await syncRelations(tx, p.id, body);
      return tx.prospect.findUnique({ where: { id: p.id }, include });
    });
    res.json(toClient(updated));
  } catch (e) { next(e); }
});

r.delete('/:id', requireActiveSubscription, async (req, res, next) => {
  try {
    const p = await prisma.prospect.findFirst({ where: { id: req.params.id, ...owned(req) } });
    if (!p) return res.status(404).json({ error: 'Not found' });
    await prisma.prospect.delete({ where: { id: p.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

r.post('/:id/evidence', requireActiveSubscription, async (req, res, next) => {
  try {
    const p = await prisma.prospect.findFirst({ where: { id: req.params.id, ...owned(req) } });
    if (!p) return res.status(404).json({ error: 'Not found' });
    const [item] = normalizeEvidence([req.body]);
    if (!item) return res.status(400).json({ error: 'Evidence finding is required' });
    res.status(201).json(await prisma.evidence.create({ data: { ...item, prospectId: p.id } }));
  } catch (e) { next(e); }
});

export default r;
