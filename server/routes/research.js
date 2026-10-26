import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';

const r = Router();
r.use(requireAuth);
r.use(requireActiveSubscription);

function normalizeUrl(raw = '') {
  const value = String(raw).trim();
  if (!value) throw new Error('No website URL was provided.');
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host.startsWith('127.') || host.startsWith('10.') || host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) throw new Error('Local and private network addresses are not supported.');
  return url;
}
function decodeHtml(value='') { return String(value).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#x27;/g,"'").replace(/\s+/g,' ').trim(); }
function stripTags(value='') { return decodeHtml(String(value).replace(/<[^>]*>/g,' ')); }
function matchMeta(html, attr, name) { const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]*>${attr}=["']${name}["']`, 'i'); const m=html.match(re); return decodeHtml(m?.[1]||m?.[2]||''); }
function extractPage(html,url,label='Homepage') {
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
  const headings=[...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(m=>stripTags(m[1])).filter(Boolean).slice(0,12);
  const description=matchMeta(html,'name','description')||matchMeta(html,'property','og:description');
  const body=stripTags(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,' '));
  const text=body.slice(0,1200);
  const lower=html.toLowerCase();
  const count=(re)=>(lower.match(re)||[]).length;
  return { label,url,title,description,headings,snippet:text, signals:{ videos: count(/youtube\.com|youtu\.be|vimeo\.com|<video\b/g), socialLinks: count(/instagram\.com|linkedin\.com|facebook\.com|twitter\.com|x\.com/g), ctas: count(/contact us|book (a )?(call|demo|consultation|meeting|appointment|viewing)|get in touch|enquire now|start free trial|request quote|schedule (a )?(demo|viewing|consultation|call)|sign up|get started/g), testimonials: count(/testimonial|what our clients say|client review|case study|success story|proven results/g), offeringTerms: count(/solution|service|product|offering|platform|software|consulting|contractor|treatment|healthcare|advisory|package|portfolio|project|listing/g), blogTerms: count(/blog|news|insight|article|resources|case-studies/g) } };
}
function extractCandidates(html,baseUrl) { const base=new URL(baseUrl), seen=new Set(), items=[]; for (const m of html.matchAll(/<a\s+[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) { try { const url=new URL(m[1],base); if(url.origin!==base.origin) continue; const path=`${url.pathname}${url.search}`.toLowerCase(); if(!/(about|company|service|solution|product|contact|project|pricing|portfolio|client|blog|news|insight|team)/.test(path)) continue; url.hash=''; if(seen.has(url.href)) continue; seen.add(url.href); items.push({url:url.href,label:(stripTags(m[2])||url.pathname.replace(/^\//,'')||'Website page').slice(0,80)}); if(items.length>=6) break; } catch {} } return items; }
async function fetchHtml(target,timeout=10000){ const c=new AbortController(), t=setTimeout(()=>c.abort(),timeout); try { const res=await fetch(target,{signal:c.signal,redirect:'follow',headers:{'User-Agent':'Versaleads/1.0 research bot'}}); if(!res.ok) throw new Error(`Website returned HTTP ${res.status}.`); if(!(res.headers.get('content-type')||'').includes('text/html')) throw new Error('The URL did not return an HTML webpage.'); return {html:(await res.text()).slice(0,1500000),finalUrl:res.url}; } finally { clearTimeout(t); } }
function evidence(finding,sourceUrl,snippet,confidence='medium',category='website'){ return {finding,source:'Company website',sourceUrl,snippet,collectedAt:new Date().toISOString(),confidence,kind:'observed',category}; }
function analyzePages(pages){ const total=pages.length||1, sum=(k)=>pages.reduce((n,p)=>n+(p.signals?.[k]||0),0), urls=[...new Set(pages.map(p=>p.url))]; const video=sum('videos'), social=sum('socialLinks'), ctas=sum('ctas'), testimonials=sum('testimonials'), offerings=sum('offeringTerms'), blog=sum('blogTerms'); const evidenceItems=[];
  evidenceItems.push(evidence(`${pages.length} website page(s) analyzed`,urls[0],`Pages: ${pages.map(p=>p.label).join(', ')}`,pages.length>=3?'high':'medium','coverage'));
  if(video===0) evidenceItems.push(evidence('No embedded video signals detected across analyzed pages',urls[0],`Analyzed ${pages.length} page(s); no YouTube, Vimeo or HTML video signal was detected.`,'high','video'));
  else evidenceItems.push(evidence(`Video presence detected (${video} signal${video===1?'':'s'})`,urls[0],`Video-related embed/link signals were found across the analyzed pages.`,'high','video'));
  if(ctas===0) evidenceItems.push(evidence('Limited visible conversion CTA signals',urls[0],`No common contact, consultation, demo, booking or enquiry CTA phrase was detected in the analyzed page text.`,'medium','conversion'));
  else evidenceItems.push(evidence(`Conversion CTA signals detected (${ctas})`,urls[0],`Contact, enquiry, consultation, demo or appointment calls-to-action were detected.`,'medium','conversion'));
  if(offerings>0) evidenceItems.push(evidence('Verified commercial product/service offerings',urls[0],`Detected ${offerings} core solution, service or product keywords across the analyzed content.`,'high','commercial'));
  if(testimonials===0) evidenceItems.push(evidence('No strong testimonial signal detected in analyzed pages',urls[0],`No common testimonial, case study or client-review phrase was detected.`,'medium','trust'));
  else evidenceItems.push(evidence(`Social proof and trust signals detected (${testimonials})`,urls[0],`Client reviews, case studies, or testimonial phrases were identified.`,'high','trust'));
  if(blog===0) evidenceItems.push(evidence('Limited visible blog/news activity signals',urls[0],`No blog, news, insight or article signal was detected in the analyzed page content.`,'medium','content'));
  else evidenceItems.push(evidence(`Active content & thought leadership signals (${blog})`,urls[0],`Articles, insights, or resource articles were identified on the website.`,'medium','content'));
  return { pagesAnalyzed:pages.length, signals:{video,social,ctas,testimonials,offerings,blog}, evidence:evidenceItems, sourceUrls:urls };
}
r.get('/deep', async (req,res,next)=>{ try { const target=normalizeUrl(req.query.url); const home=await fetchHtml(target); const pages=[extractPage(home.html,home.finalUrl,'Homepage')]; for(const c of extractCandidates(home.html,home.finalUrl)){ try { const page=await fetchHtml(c.url,7000); if(!pages.some(p=>p.url===page.finalUrl)) pages.push(extractPage(page.html,page.finalUrl,c.label)); } catch{} }
  const analysis=analyzePages(pages); res.json({status:'success',finalUrl:home.finalUrl,pages,title:pages[0]?.title||'',description:pages[0]?.description||'',headings:pages[0]?.headings||[],sourceCount:pages.length,fetchedAt:new Date().toISOString(),...analysis});
} catch(e){ next(Object.assign(e,{status:422})); } });
export default r;
