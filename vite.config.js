import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function stripTags(value = '') { return decodeHtml(String(value).replace(/<[^>]*>/g, ' ')); }
function matchMeta(html, attr, name) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${name}["'][^>]*>`, 'i');
  const m = html.match(re); return decodeHtml(m?.[1] || m?.[2] || '');
}
function normalizeUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) throw new Error('No website URL was provided.');
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) throw new Error('Local and private network addresses are not supported.');
  return url;
}
function extractPage(html, url, label = 'Homepage') {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(m => stripTags(m[1])).filter(Boolean).slice(0, 8);
  const description = matchMeta(html, 'name', 'description') || matchMeta(html, 'property', 'og:description');
  const text = stripTags(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')).slice(0, 500);
  return { label, url, title: decodeHtml(titleMatch?.[1] || ''), description, headings, snippet: text };
}
function extractCandidates(html, baseUrl) {
  const base = new URL(baseUrl);
  const seen = new Set();
  const items = [];
  const re = /<a\s+[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const url = new URL(m[1], base);
      if (url.origin !== base.origin) continue;
      const path = `${url.pathname}${url.search}`.toLowerCase();
      if (!/(about|company|service|solution|product|contact|project|pricing|portfolio|client|blog|news|insight|team)/.test(path)) continue;
      url.hash = '';
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      const text = stripTags(m[2]) || url.pathname.replace(/^\//, '') || 'Website page';
      items.push({ url: url.href, label: text.slice(0, 80) });
      if (items.length >= 6) break;
    } catch {}
  }
  return items;
}
async function fetchHtml(target, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(target, { signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'Versaleads/1.0 research preview' } });
    if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) throw new Error('The URL did not return an HTML webpage.');
    return { html: (await response.text()).slice(0, 1_500_000), finalUrl: response.url };
  } finally { clearTimeout(timer); }
}
function websiteResearchPlugin() {
  return {
    name: 'versaleads-deep-website-research',
    configureServer(server) {
      server.middlewares.use('/api/research/website', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const incoming = new URL(req.url, 'http://localhost');
          const target = normalizeUrl(incoming.searchParams.get('url'));
          const home = await fetchHtml(target);
          const pages = [extractPage(home.html, home.finalUrl, 'Homepage')];
          const candidates = extractCandidates(home.html, home.finalUrl).filter(c => c.url !== home.finalUrl).slice(0, 4);
          for (const candidate of candidates) {
            try {
              const page = await fetchHtml(candidate.url, 7000);
              pages.push(extractPage(page.html, page.finalUrl, candidate.label));
            } catch {
              // Skip inaccessible subpages; the successful pages remain traceable evidence.
            }
          }
          const first = pages[0];
          res.statusCode = 200;
          res.end(JSON.stringify({
            ...first,
            finalUrl: home.finalUrl,
            pages,
            sourceCount: pages.length,
            fetchedAt: new Date().toISOString(),
            source: 'website'
          }));
        } catch (error) {
          res.statusCode = 422;
          res.end(JSON.stringify({ error: error?.name === 'AbortError' ? 'Website request timed out.' : (error?.message || 'Website research failed.') }));
        }
      });
    }
  };
}

export default defineConfig({ plugins: [react(), websiteResearchPlugin()] });
