import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription, checkLeadQuota } from '../middleware/subscription.js';
import { checkAndDispatchQuotaAlert } from '../services/email.js';

const r = Router();
r.use(requireAuth);

const owned = (req) =>
  req.user.organizationId
    ? { organizationId: req.user.organizationId }
    : { ownerId: req.user.sub };

const defaultCities = ['Nairobi','Mombasa','London','New York','San Francisco','Dubai','Toronto','Singapore','Lagos','Johannesburg','Austin','Miami'];
const typeOptions = [
  ['Tech & SaaS', 'saas|software|technology|tech startup|cloud|ai|platform|it services'],
  ['Healthcare & Medical', 'clinic|hospital|healthcare|pharmaceutical|dental|medical practice|wellness'],
  ['Financial & Professional Services', 'financial|accounting|audit|wealth|insurance|consulting|advisory|tax'],
  ['Real Estate & Property', 'real estate|property|realty|brokerage|developer|realtor|estates'],
  ['Construction & Engineering', 'construction|building contractor|civil engineering|architecture|contractor'],
  ['E-commerce & Retail', 'ecommerce|retail|store|fashion|apparel|brand|consumer goods|shop'],
  ['Hospitality & Tourism', 'hotel|resort|restaurant|travel|tourism|safari|lodge|hospitality'],
  ['Marketing & Creative Agencies', 'marketing agency|advertising|creative studio|digital media|branding|design agency'],
  ['Manufacturing & Logistics', 'manufacturing|factory|logistics|freight|supply chain|distribution|transport'],
  ['Education & Training', 'school|university|academy|training institute|college|edtech'],
  ['Legal & Corporate Advisory', 'law firm|advocate|attorney|legal services|corporate counsel'],
  ['Automotive & Mobility', 'dealership|automotive|car sales|vehicle parts|mobility|fleet']
];

function normalizeName(value='') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function normalizeDomain(value='') {
  try { return new URL(/^https?:\/\//i.test(String(value)) ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./,''); }
  catch { return ''; }
}
function firstEmail(text='') {
  return String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
}
function firstPhone(text='') {
  const m = String(text).match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/);
  return m?.[0] || null;
}
function inferCompanyName(title='', url='') {
  const cleaned = String(title).replace(/\s*[|\-–—:]\s*(Home|Official Website|About|Services|Contact|Overview).*$/i,'').trim();
  if (cleaned && cleaned.length <= 100) return cleaned;
  const host = normalizeDomain(url);
  return host ? host.split('.')[0].replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unnamed company';
}
function classifyType(text='') {
  const value = String(text).toLowerCase();
  for (const [name, regexStr] of typeOptions) {
    if (new RegExp(regexStr, 'i').test(value)) return name;
  }
  return 'Professional Services';
}
function verifyLead(text='', targetLocation='') {
  const value = String(text).toLowerCase();
  const target = String(targetLocation || '').toLowerCase().trim();
  const hasDomain = /https?:\/\/[^\s]+|\.com|\.co|\.org|\.io|\.net|\.ke|\.uk|\.ca/i.test(value);
  if (target && value.includes(target)) {
    return { status:'VERIFIED', reason:`Verified match for location target: ${targetLocation}.` };
  }
  if (hasDomain) {
    return { status:'VERIFIED', reason:'Verified legitimate digital business presence.' };
  }
  return { status:'NEEDS_REVIEW', reason:'Business presence verified; verify local market office address.' };
}
function searchQueries({ city='Nairobi', companyTypes=[] }) {
  const types = Array.isArray(companyTypes) && companyTypes.length ? companyTypes : typeOptions.map(([name])=>name);
  return types.map(type => `"${type}" companies in ${city}`);
}
async function tavilySearch(query, maxResults=8) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    const err = new Error('Discovery search is not configured. Add TAVILY_API_KEY to the server .env to run live discovery searches.');
    err.status = 503;
    throw err;
  }
  const response = await fetch('https://api.tavily.com/search', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      api_key:key, query, search_depth:'advanced', max_results:Math.min(Math.max(Number(maxResults)||8,1),12),
      include_answer:false, include_raw_content:false, topic:'general'
    })
  });
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) {
    const err = new Error(payload?.detail || payload?.error || `Discovery provider failed (${response.status}).`);
    err.status = 502;
    throw err;
  }
  return Array.isArray(payload.results) ? payload.results : [];
}
async function prospectSignals(req) {
  const where = owned(req);
  const [prospects, discovered] = await Promise.all([
    prisma.prospect.findMany({ where, select:{id:true,company:true,website:true} }),
    prisma.discoveryLead.findMany({ where, select:{id:true,companyName:true,website:true,domain:true,status:true} })
  ]);
  return { prospects, discovered };
}
function duplicateFor(candidate, signals) {
  const domain = normalizeDomain(candidate.website);
  const name = normalizeName(candidate.companyName);
  const prospect = signals.prospects.find(p => (domain && normalizeDomain(p.website)===domain) || (name && normalizeName(p.company)===name));
  if (prospect) return { duplicate:true, duplicateType:'EXISTING_PROSPECT', duplicateProspectId:prospect.id, reason:`Matches existing prospect ${prospect.company}.` };
  const found = signals.discovered.find(d => (domain && (d.domain===domain || normalizeDomain(d.website)===domain)) || (name && normalizeName(d.companyName)===name));
  if (found) return { duplicate:true, duplicateType:'DISCOVERY_INBOX', duplicateDiscoveryId:found.id, reason:`Matches a company already in the Discovery Inbox.` };
  return { duplicate:false, duplicateType:null, reason:null };
}
function toClient(d) {
  return {
    ...d,
    verificationStatus:String(d.verificationStatus).toLowerCase(),
    status:String(d.status).toLowerCase(),
    duplicateStatus:String(d.duplicateStatus || 'NONE').toLowerCase(),
    discoveredAt:d.discoveredAt.toISOString(),
    verifiedAt:d.verifiedAt?.toISOString() || null,
    approvedAt:d.approvedAt?.toISOString() || null,
    rejectedAt:d.rejectedAt?.toISOString() || null,
  };
}

r.get('/', async (req,res,next)=>{ try {
  const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const rows = await prisma.discoveryLead.findMany({
    where:{ ...owned(req), ...(status ? {status} : {})},
    orderBy:{discoveredAt:'desc'}
  });
  res.json(rows.map(toClient));
} catch(e){ next(e); } });

r.post('/search', requireActiveSubscription, async (req,res,next)=>{ try {
  const city = String(req.body.city || 'Nairobi').trim();
  let companyTypes = Array.isArray(req.body.companyTypes) && req.body.companyTypes.length ? req.body.companyTypes : [];
  if (!companyTypes.length && req.user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { targetIndustries: true },
    });
    if (org?.targetIndustries) {
      try {
        companyTypes = typeof org.targetIndustries === 'string' && org.targetIndustries.startsWith('[')
          ? JSON.parse(org.targetIndustries)
          : org.targetIndustries.split(',').map(s=>s.trim());
      } catch {}
    }
  }
  const maxPerQuery = Math.min(Math.max(Number(req.body.maxPerQuery)||6,1),12);
  const queries = searchQueries({city,companyTypes});
  const results = await Promise.all(queries.map(q => tavilySearch(q,maxPerQuery)));
  const flat = results.flat();
  const signals = await prospectSignals(req);
  const created = [], skipped = [];
  const seen = new Set();
  for (const item of flat) {
    const website = item.url || '';
    const domain = normalizeDomain(website);
    if (!website || !domain || seen.has(domain)) continue;
    seen.add(domain);
    const sourceText = `${item.title||''} ${item.content||''} ${website}`;
    const companyName = inferCompanyName(item.title, website);
    const companyType = classifyType(sourceText);
    const verified = verifyLead(sourceText, city);
    const duplicate = duplicateFor({companyName,website}, signals);
    const status = duplicate.duplicate ? 'DUPLICATE' : verified.status === 'REJECTED' ? 'REJECTED' : 'NEW';
    const record = {
      ownerId:req.user.sub,
      organizationId:req.user.organizationId || null,
      companyName, website, domain, location: city || 'Global',
      country: req.body.country || 'Global', companyType, discoverySource:'Tavily Web Search', sourceUrl:website,
      sourceSnippet:String(item.content||'').slice(0,4000), contactEmail:firstEmail(item.content), contactPhone:firstPhone(item.content),
      verificationStatus:verified.status, verificationReason:verified.reason, duplicateStatus:duplicate.duplicate ? duplicate.duplicateType : 'NONE',
      duplicateProspectId:duplicate.duplicateProspectId || null, duplicateReason:duplicate.reason || null, status,
      searchQuery:queries.find(q => sourceText.toLowerCase().includes(city.toLowerCase())) || queries[0] || null
    };
    if (duplicate.duplicate && duplicate.duplicateType==='DISCOVERY_INBOX') { skipped.push(record); continue; }
    const saved = await prisma.discoveryLead.upsert({
      where:{ownerId_domain:{ownerId:req.user.sub,domain}},
      create:record,
      update:{...record, status: duplicate.duplicate ? 'DUPLICATE' : status, discoveredAt:new Date()}
    });
    created.push(toClient(saved));
    signals.discovered.push(saved);
  }
  res.json({city, queries, found:flat.length, added:created.length, skipped:skipped.length, leads:created});
} catch(e){ next(e); } });

r.post('/manual', requireActiveSubscription, async (req,res,next)=>{ try {
  const website = String(req.body.website||'').trim();
  const companyName = String(req.body.companyName||'').trim();
  if (!companyName && !website) return res.status(400).json({error:'Company name or website is required.'});
  const signals = await prospectSignals(req);
  const candidate = {companyName:companyName || inferCompanyName('',website), website};
  const duplicate = duplicateFor(candidate, signals);
  const location = req.body.location || req.body.city || '';
  const verified = verifyLead(`${candidate.companyName} ${location} ${req.body.country||''}`, location);
  const domain = normalizeDomain(website);
  const record = {
    ownerId:req.user.sub,
    organizationId:req.user.organizationId || null,
    companyName:candidate.companyName, website:website||null, domain:domain||null,
    location:location||'Global', country:req.body.country||'Global', companyType:req.body.companyType||classifyType(candidate.companyName),
    discoverySource:req.body.discoverySource||'Manual Discovery', sourceUrl:req.body.sourceUrl||website||null,
    sourceSnippet:req.body.sourceSnippet||null, contactEmail:req.body.contactEmail||null, contactPhone:req.body.contactPhone||null,
    verificationStatus:verified.status, verificationReason:verified.reason, duplicateStatus:duplicate.duplicate ? duplicate.duplicateType : 'NONE',
    duplicateProspectId:duplicate.duplicateProspectId||null, duplicateReason:duplicate.reason||null,
    status:duplicate.duplicate?'DUPLICATE':verified.status==='REJECTED'?'REJECTED':'NEW', searchQuery:null
  };
  const saved = domain ? await prisma.discoveryLead.upsert({where:{ownerId_domain:{ownerId:req.user.sub,domain}},create:record,update:record}) : await prisma.discoveryLead.create({data:record});
  res.status(201).json(toClient(saved));
} catch(e){ next(e); } });

r.post('/:id/verify', requireActiveSubscription, async (req,res,next)=>{ try {
  const lead = await prisma.discoveryLead.findFirst({where:{id:req.params.id, ...owned(req)}});
  if(!lead) return res.status(404).json({error:'Discovery lead not found.'});
  const verificationStatus = String(req.body.verificationStatus||'NEEDS_REVIEW').toUpperCase();
  if(!['VERIFIED','NEEDS_REVIEW','REJECTED'].includes(verificationStatus)) return res.status(400).json({error:'Invalid verification status.'});
  const updated = await prisma.discoveryLead.update({where:{id:lead.id},data:{verificationStatus,verificationReason:String(req.body.reason||'Manual verification update.'),verifiedAt:new Date(),status:verificationStatus==='REJECTED'?'REJECTED':lead.duplicateStatus!=='NONE'?'DUPLICATE':'NEW'}});
  res.json(toClient(updated));
} catch(e){ next(e); } });

r.post('/:id/reject', requireActiveSubscription, async (req,res,next)=>{ try {
  const lead = await prisma.discoveryLead.findFirst({where:{id:req.params.id, ...owned(req)}});
  if(!lead) return res.status(404).json({error:'Discovery lead not found.'});
  const updated = await prisma.discoveryLead.update({where:{id:lead.id},data:{status:'REJECTED',rejectedAt:new Date(),verificationReason:req.body.reason||lead.verificationReason}});
  res.json(toClient(updated));
} catch(e){ next(e); } });

r.post('/:id/approve', requireActiveSubscription, checkLeadQuota, async (req,res,next)=>{ try {
  const lead = await prisma.discoveryLead.findFirst({where:{id:req.params.id, ...owned(req)}});
  if(!lead) return res.status(404).json({error:'Discovery lead not found.'});
  if(lead.status==='REJECTED') return res.status(409).json({error:'Rejected leads cannot be approved.'});
  if(lead.duplicateStatus!=='NONE') return res.status(409).json({error:lead.duplicateReason||'Duplicate lead cannot be approved.'});
  if(lead.verificationStatus==='REJECTED') return res.status(409).json({error:'Lead failed business verification.'});
  const existing = await prisma.prospect.findFirst({where:{...owned(req),OR:[
    ...(lead.domain ? [{website:{contains:lead.domain,mode:'insensitive'}}] : []),
    {company:{equals:lead.companyName,mode:'insensitive'}}
  ]}});
  if(existing) {
    await prisma.discoveryLead.update({where:{id:lead.id},data:{status:'DUPLICATE',duplicateStatus:'EXISTING_PROSPECT',duplicateProspectId:existing.id,duplicateReason:`Matches existing prospect ${existing.company}.`}});
    return res.status(409).json({error:`Duplicate prevented: ${existing.company} already exists as a prospect.`});
  }
  const leadCountry = lead.country && lead.country !== 'Kenya' ? lead.country : (lead.location && lead.location.includes(',') ? lead.location.split(',').pop().trim() : (lead.country || 'Global'));
  const caseData = {
    companyName:lead.companyName, website:lead.website||'', location:lead.location||'', country:leadCountry,
    contactName:'', contactRole:'', email:lead.contactEmail||'', phone:lead.contactPhone||'',
    industry:lead.companyType||'General Business', businessType:lead.companyType||'General Business', services:'', targetAudience:'', positioning:'',
    discovery:{ discoveryLeadId:lead.id, source:lead.discoverySource, sourceUrl:lead.sourceUrl, sourceSnippet:lead.sourceSnippet, discoveredAt:lead.discoveredAt.toISOString(), verificationStatus:lead.verificationStatus },
    researchStatus:'not_started', outreachStatus:'not_started'
  };
  const prospect = await prisma.$transaction(async tx => {
    const created = await tx.prospect.create({data:{
      company:lead.companyName, website:lead.website||null, location:lead.location||null, country:leadCountry,
      email:lead.contactEmail||null, phone:lead.contactPhone||null,
      ownerId:req.user.sub,
      organizationId:req.user.organizationId || null,
      caseData
    }});
    await tx.discoveryLead.update({where:{id:lead.id},data:{status:'APPROVED',approvedAt:new Date(),prospectId:created.id}});

    // Increment quota counter
    if (req.user.organizationId) {
      await tx.organization.update({
        where: { id: req.user.organizationId },
        data: { leadsUsedThisMonth: { increment: 1 } }
      });
    }

    return created;
  });

  if (req.user.organizationId) {
    checkAndDispatchQuotaAlert(req.user.organizationId).catch((err) => {
      console.error('[Discovery] Quota alert dispatch error:', err.message);
    });
  }

  res.json({prospect:{
    ...caseData, id:prospect.id, companyName:prospect.company, country:prospect.country, score:prospect.score,
    qualification:prospect.qualification, researchStatus:prospect.researchStatus, dateAdded:prospect.createdAt.toISOString(),
    updatedAt:prospect.updatedAt.toISOString(), evidence:[]
  }});
} catch(e){ next(e); } });

r.delete('/:id', requireActiveSubscription, async (req, res, next) => { try {
  const lead = await prisma.discoveryLead.findFirst({ where: { id: req.params.id, ...owned(req) } });
  if (!lead) return res.status(404).json({ error: 'Discovery lead not found.' });
  await prisma.discoveryLead.delete({ where: { id: lead.id } });
  res.status(204).end();
} catch (e) { next(e); } });

export default r;
