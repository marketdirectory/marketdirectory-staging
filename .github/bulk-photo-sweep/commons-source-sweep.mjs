#!/usr/bin/env node
/** Read-only public Commons discovery. No downloads, edits, scraping protected data, hosting, or SQL. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const inputFile=process.argv[2]||'targets.json';
const outputFile=process.argv[3]||'results.json';
const data=JSON.parse(fs.readFileSync(inputFile,'utf8'));
if(data.kind!=='MARKETDIRECTORY_PUBLIC_SOURCE_DISCOVERY_ONLY'||!Array.isArray(data.targets)||data.targets.length>110)throw Error('STOP_INPUT_SCHEMA');
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const REQUEST_TIMEOUT_MS=16000;
const api='https://commons.wikimedia.org/w/api.php';
let apiRequests=0,apiErrors=[];
async function call(params){
 const url=new URL(api);Object.entries({...params,format:'json',formatversion:2}).forEach(([k,v])=>url.searchParams.set(k,String(v)));
 let response;try{response=await fetch(url,{headers:{'User-Agent':'MarketDirectoryPublicPhotoDiscovery/1.0 (+https://github.com/marketdirectory/marketdirectory; review-only)',Accept:'application/json'},signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),redirect:'error'});}catch(e){apiErrors.push({kind:'TRANSPORT',message:String(e).slice(0,150)});return null;}
 apiRequests++;
 if(!response.ok){apiErrors.push({kind:'HTTP_'+response.status,query:params.srsearch||params.titles||'category',message:(await response.text()).slice(0,120)});return null;}
 const ct=response.headers.get('content-type')||'';
 if(!ct.includes('json')){apiErrors.push({kind:'NOT_JSON',ct});return null;}
 const value=await response.json();if(value.error){apiErrors.push({kind:'API_ERROR',details:value.error.code||value.error.info});return null;}
 return value;
}
function pretty(slug){return slug.replace(/-farmers-and-craft-market$/,' farmers and craft market').replace(/-farmers-market$/,' farmers market').replace(/-art-and-craft-market$/,' art and craft market').replace(/-market-hall$/,' market hall').replaceAll('-',' ')}
function candidateSearches(t){
 const full=pretty(t.slug).replace(/\bmarket markets\b/g,'market');
 const out=[`intitle:"${full}"`, `"${full}"`];
 if(full.includes(' farmers market'))out.push(`"${full.replace(' farmers market','')}" "market"`);
 if(t.slug==='bury-market')out.unshift('incategory:"Bury Market"');
 return [...new Set(out)];
}
function idScore(title,full){
 const clean=s=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/^file:/,'').replace(/[_.,()\-]/g,' ').replace(/\s+/g,' ').trim();
 const t=clean(title),q=clean(full).split(' ').filter(x=>!['farmers','market','the','and','of','at','indoor','outdoor','craft'].includes(x));
 if(q.length===0)return 0;
 const matched=q.filter(x=>t.split(' ').includes(x)).length;
 const marketEvidence=/\bmarket\b|\bstalls?\b|\bbazaar\b|\bpannier\b/i.test(t);
 return Math.round(100*matched/q.length)+(marketEvidence?12:0);
}
const decisions=[];let cutoff=false;
for(const [i,t] of data.targets.entries()){
 const slug=t.slug; const full=pretty(slug);const matches=new Map();let failCount=0;
 for(const query of candidateSearches(t).slice(0,data.queriesPerTarget||2)){
  if(apiErrors.some(e=>e.kind==='HTTP_403'||e.kind==='HTTP_429')){cutoff=true;break;}
  const res=await call({action:'query',list:'search',srsearch:query,srnamespace:6,srlimit:25});
  if(!res){failCount++;continue;}
  for(const row of res.query?.search||[]){if(row.title.startsWith('File:'))matches.set(row.title,{title:row.title,score:idScore(row.title,full),search:query});}
  await sleep(450);
 }
 const ranked=[...matches.values()].sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).filter(x=>x.score>=36).slice(0,8);
 let candidates=[];
 if(ranked.length&&!cutoff){
  await sleep(400);
  const md=await call({action:'query',prop:'imageinfo',titles:ranked.map(r=>r.title).join('|'),iiprop:'size|extmetadata|sha1|timestamp|url',iilimit:1});
  const meta=new Map((md?.query?.pages||[]).filter(x=>x.title&&x.imageinfo?.length).map(x=>[x.title,x.imageinfo[0]]));
  for(const x of ranked){const y=meta.get(x.title);if(!y)continue;
   const lic=y.extmetadata?.LicenseShortName?.value||'';
   const licUrl=y.extmetadata?.LicenseUrl?.value||'';
   const credit=y.extmetadata?.Artist?.value||'';
   const originalOK=(y.width||0)>=960&&(y.height||0)>=540;
   const rightsOK=/CC(?:-BY|-BY-SA|-0)|public domain/i.test(lic)&&(/^https?:\/\/creativecommons\.org\//.test(licUrl)||/public domain/i.test(lic));
   candidates.push({...x,width:y.width,height:y.height,bytes:y.size,sha1:y.sha1,licenseName:lic,licenseUrl:licUrl,artistHtml:credit.slice(0,350),descriptionHtml:(y.extmetadata?.ImageDescription?.value||'').slice(0,500),dateTaken:y.extmetadata?.DateTimeOriginal?.value||null,filePage:`https://commons.wikimedia.org/wiki/${encodeURIComponent(x.title.replaceAll(' ','_'))}`,originalUrl:y.url||null,sizeOK:originalOK,rightsCandidate:!!rightsOK,qualityGate:'NEEDS_HUMAN_VISUAL_AND_VENUE_REVIEW'});
  }
 }
 const eligible=candidates.filter(c=>c.sizeOK&&c.rightsCandidate);
 decisions.push({slug,previousClass:t.action_class,originalHold:t.original_hold||null,queriesAttempted:candidateSearches(t).slice(0,data.queriesPerTarget||2),searchHits:matches.size,eligibleMetadataCandidates:eligible.length,candidates:candidates.slice(0,6),status:cutoff?'API_BLOCK_STOP':eligible.length?'METADATA_CANDIDATES_NEED_VISUAL_IDENTITY_REVIEW':'NO_NEW_METADATA_VETTED_CANDIDATE',queryFailures:failCount});
 if(i%10===0)console.log(`SWEEP_PROGRESS ${i+1}/${data.targets.length} candidates=${decisions.reduce((n,d)=>n+d.eligibleMetadataCandidates,0)} errors=${apiErrors.length}`);
 if(cutoff)break;
 await sleep(450);
}
const receipt={kind:'MARKETDIRECTORY_REVIEW_ONLY_BULK_COMMONS_METADATA_SWEEP',timestamp:new Date().toISOString(),inputSHA256:crypto.createHash('sha256').update(fs.readFileSync(inputFile)).digest('hex'),targetsProvided:data.targets.length,targetsAttempted:decisions.length,queriesPerTarget:data.queriesPerTarget||2,apiRequests,apiErrors,cutoff,eligibleTargetCount:decisions.filter(x=>x.eligibleMetadataCandidates>0).length,metadataCandidates:decisions.reduce((n,x)=>n+x.eligibleMetadataCandidates,0),decisions,limitations:'Discovery and primary API metadata only. No original files fetched, no derivative generation, no visual/venue/rights approval, no publications or permissions.'};
fs.writeFileSync(outputFile,JSON.stringify(receipt,null,2)+'\n');
console.log('SWEEP_RESULT',JSON.stringify({targets:receipt.targetsAttempted,total:data.targets.length,apiRequests,errors:apiErrors.slice(0,4),cutoff,candidateTargets:receipt.eligibleTargetCount,candidates:receipt.metadataCandidates}));
if(cutoff||apiRequests===0)process.exitCode=2;
