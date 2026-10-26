import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';

const r = Router();
r.use(requireAuth);
r.use(requireActiveSubscription);

r.post('/analyze', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!process.env.AI_ENDPOINT || !process.env.AI_API_KEY || !process.env.AI_MODEL) {
      return res.status(503).json({ error: 'Server-side AI is not configured. Configure AI_ENDPOINT, AI_API_KEY, and AI_MODEL in .env' });
    }

    let systemPrompt = 'Return valid JSON only. Never invent facts. Distinguish evidence from recommendations.';
    if (req.user.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
        select: { name: true, industry: true, companyDescription: true, valueProposition: true },
      });
      if (org) {
        systemPrompt = `You are the lead qualification intelligence engine for "${org.name}", an enterprise in the "${org.industry || 'B2B Services'}" sector (${org.companyDescription || org.valueProposition || 'B2B Solutions'}). Analyze prospects from the strategic perspective of how "${org.name}" can serve and convert them. Return valid JSON only. Never invent facts. Distinguish evidence from recommendations.`;
      }
    }

    const upstream = await fetch(process.env.AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.25,
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || 'AI provider returned an error.' });
    }
    const text = String(data.choices?.[0]?.message?.content || '{}').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = { companySummary: text };
    }
    res.json({ model: process.env.AI_MODEL, result });
  } catch (e) {
    next(e);
  }
});

export default r;
