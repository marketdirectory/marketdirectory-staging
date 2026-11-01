#!/usr/bin/env node
/** Strictly public Commons primary metadata discovery for 62 UNREVIEWED markets.
 * Does not download any photo pixels, license source, create WebPs or publish.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const inPath='.github/market-photo-venue-sweep-batch03/targets.json';
const outPath='market-photo-batch03-discovery.json';
const input=JSON.parse(fs.readFileSync(inPath,'utf8'));
const unique=new Set(input.targets.map(t=>t.slug));
if(input.kind!=='MARKETDIRECTORY_BATCH03_TARGETED_COMMONS_SOURCE_DISCOVERY_REVIEW_ONLY'||unique.size!==62||input.targets.length!==62||input.previouslyVisualChecked38.length!==38||input.targets.some(t=>input.previouslyVisualChecked38.includes(t.slug)||t.slug===input.hardStopExcluded))throw Error('STOP_TARGET_INPUT_SCOPE');
const api='https://commons.wikimedia.org/w/api.php';
const UA='MarketDirectoryVenueSpecificPhotoResearch/1.0 (https://github.com/marketdirectory/marketdirectory; source-review-only)';
const sleep=(t)=>new Promise(resolve=>setTimeout(resolve,t));
let requests=0,errors=[],cutoff=false;
const plain=s=>String(s||'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replaceAll('_',' ').replaceAll(/[^a-z0-9 ]/g,' ').replaceAll(/\s+/g,' ').trim();
const baseWords=new Set(['market','markets','farmers','farmer','artisan','craft','indoor','outdoor','makers','the','and','of','at','place','hall','street','sunday','saturday','speciality','fayre','festival','charter','variety','open','old','uk','england']);
function specificWords(slug){return plain(slug.replaceAll('-',' ')).split(' ').filter(x=>x.length>2&&!baseWords.has(x));}
function selectQueries(t){
 const natural=t.slug.replaceAll('-',' ').replace(/farmers and craft/g,'farmers craft');
 const q=[];
 for(const hint of t.queryHints.slice(0,2)){
   q.push('intitle:"'+hint+'"');
   q.push('"'+hint+'"');
 }
 q.push('intitle:"'+natural+'"');
 const keywords=specificWords(t.slug);
 if(keywords.length)q.push('intitle:"'+keywords.slice(0,2).join(' ')+'" market');
 q.push('"'+natural+'"');
 return [...new Set(q)].slice(0,5);
}
function rank(title,description,slug){
 const text=plain(title.replace(/^File:/i,''));
 const descr=plain(description.replace(/<[^>]*>/g,' '));
 const needed=specificWords(slug);
 const toks=new Set(text.split(' '));
 const matched=needed.filter(x=>toks.has(x)).length;
 const fraction=needed.length?matched/needed.length:0;
 const named=plain(slug).replace(/farmers and craft/,'farmers craft');
 const direct=text.includes(named)?100:0;
 const marketWords=/(?:\bmarket\b|\bstalls\b|\btraders\b|\bbazaar\b|\bfair\b|\bmarche\b|\bpannier\b)/.test(text);
 const negative=/(?:cattle market|horse market|christmas market|pub |inn |hotel |market street|market place|market square|shopping mall|market arms|market cross|market house|market road|market lane|car park|old market|market sign|heritage plaque|landmark|georgian|advert|illustration|coin|token)/.test(text);
 const descriptionEvidence=needed.length>0&&needed.every(w=>descr.includes(w))?15:0;
 return Math.round(fraction*90)+direct+(marketWords?20:0)+descriptionEvidence-(negative?55:0);
}
async function call(params){
 const u=new URL(api);Object.entries({...params,format:'json',formatversion:2}).forEach(([k,v])=>u.searchParams.set(k,String(v)));
 let r;try{r=await fetch(u,{headers:{'User-Agent':UA,'Accept':'application/json'},redirect:'error',signal:AbortSignal.timeout(22000)});}catch(e){errors.push({kind:'TRANSPORT',message:String(e).slice(0,150),query:params.srsearch||params.titles?.slice(0,160)});return null}
 requests++;
 if(!r.ok){errors.push({kind:'HTTP_'+r.status,query:params.srsearch||params.titles?.slice(0,160)});if([403,429].includes(r.status))cutoff=true;return null}
 try{const j=await r.json();if(j.error){errors.push({kind:'API_ERROR',details:j.error.code});return null}return j;}catch(e){errors.push({kind:'INVALID_JSON',message:String(e).slice(0,60)});return null}
}
function licenseOK(info){
 const name=info.extmetadata?.LicenseShortName?.value||'';
 const uri=info.extmetadata?.LicenseUrl?.value||'';
 return /^(?:CC[ -]BY(?:[ -]SA)?(?:\s|$)|CC0(?:\s|$)|Public domain)/i.test(name)&&(/^(?:https?:)\/\/creativecommons\.org\/(?:licenses\/by(?:-sa)?\/|publicdomain\/)/i.test(uri)||/^Public domain/i.test(name));
}
function yearFrom(c){
 const strings=[c.dateTaken||'',c.title||'',c.uploaded||''];
 const years=strings.flatMap(s=>Array.from(s.matchAll(/\b(?:19\d{2}|20\d{2})\b/g),m=>Number(m[0]))).filter(y=>y>=1990&&y<=2026);
 return years.length?years[0]:null;
}
const decisions=[];
for(const [i,t] of input.targets.entries()){
 const results=new Map();
 const queries=selectQueries(t);
 for(const q of queries){
   if(cutoff)break;
   const j=await call({action:'query',list:'search',srsearch:q,srnamespace:6,srlimit:35});
   for(const row of j?.query?.search||[]){
     if(row.title?.startsWith('File:'))results.set(row.title,{title:row.title,query:q});
   }
   await sleep(280);
 }
 const potential=[...results.values()].slice(0,100);
 const hits=[];
 // Each Commons imageinfo batch at most 35 titles, within MediaWiki API max title-bound.
 for(let p=0;p<potential.length&&!cutoff;p+=35){
   const group=potential.slice(p,p+35);
   const j=await call({action:'query',prop:'imageinfo',titles:group.map(x=>x.title).join('|'),iiprop:'size|mime|url|sha1|timestamp|extmetadata',iilimit:1});
   for(const page of j?.query?.pages||[]){
     const v=page.imageinfo?.[0];
     if(!v||!page.title)continue;
     const rights=licenseOK(v);
     const size=(v.width||0)>=960&&(v.height||0)>=540&&v.mime==='image/jpeg';
     const data={title:page.title,score:0,originalWidth:v.width,originalHeight:v.height,originalBytes:v.size,originalSha1:v.sha1||null,originalUrl:v.url||null,sourcePage:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),licenseName:v.extmetadata?.LicenseShortName?.value||'',licenseURL:v.extmetadata?.LicenseUrl?.value||'',artistHTML:(v.extmetadata?.Artist?.value||'').slice(0,220),dateTaken:(v.extmetadata?.DateTimeOriginal?.value||'').slice(0,160),uploaded:v.timestamp||null,descriptionHTML:(v.extmetadata?.ImageDescription?.value||'').slice(0,500),metadataEligible:!!(rights&&size)};
     data.score=rank(page.title,data.descriptionHTML,t.slug);data.year=yearFrom(data);
     hits.push(data);
   }
   await sleep(280);
 }
 hits.sort((a,b)=>Number(b.metadataEligible)-Number(a.metadataEligible)||b.score-a.score||(b.year||0)-(a.year||0)||(b.originalWidth*b.originalHeight)-(a.originalWidth*a.originalHeight));
 const qualified=hits.filter(c=>c.metadataEligible);
 decisions.push({slug:t.slug,priorHold:t.priorHold,previousMetadataHits:t.previousMetadataHits,queries,searchResults:results.size,metadataEligible:qualified.length,topCandidates:qualified.slice(0,12),positiveLead:qualified.some(c=>c.score>=90),status:cutoff?'CUTOFF_REVIEW_STOP':'NEW_METADATA_ONLY_UNSELECTED'});
 if(i%8===0)console.log('BATCH03_PROGRESS',i+1+'/'+input.targets.length,'requests',requests,'eligibleMarkets',decisions.filter(x=>x.metadataEligible>0).length);
 if(cutoff)break;
 await sleep(250);
}
const receipt={kind:'MARKETDIRECTORY_VENUE_AWARE_COMMONS_SOURCE_SWEEP_UNSELECTED',date:new Date().toISOString(),inputSha256:crypto.createHash('sha256').update(fs.readFileSync(inPath)).digest('hex'),targetsProvided:input.targets.length,targetsAttempted:decisions.length,requests,errors,cutoff,targetsWithMetadataCandidates:decisions.filter(x=>x.metadataEligible>0).length,targetsWithHighIdentityScore:decisions.filter(x=>x.positiveLead).length,totalMetadataCandidates:decisions.reduce((sum,x)=>sum+x.metadataEligible,0),decisions,limitations:'Source discovery only; metadata name, date and licence are NOT photo market identity; zero original or thumb bytes downloaded, no hero assets, 0 approved or published'};
fs.writeFileSync(outPath,JSON.stringify(receipt,null,2)+'\n');
console.log('BATCH03_SUMMARY',JSON.stringify({targets:receipt.targetsAttempted,requests,errors:errors.length,cutoff,withMetadata:receipt.targetsWithMetadataCandidates,highScoreMarkets:receipt.targetsWithHighIdentityScore,metadataTotal:receipt.totalMetadataCandidates}));
for(const d of decisions){if(d.positiveLead)console.log('BATCH03_EXACT_LEAD',JSON.stringify({slug:d.slug,hold:d.priorHold,high:d.topCandidates.filter(c=>c.score>=90).slice(0,3).map(c=>({title:c.title,score:c.score,year:c.year,dimensions:[c.originalWidth,c.originalHeight],license:c.licenseName,sha1:c.originalSha1}))}))}
if(cutoff||errors.length||decisions.length!==input.targets.length)process.exitCode=2;
