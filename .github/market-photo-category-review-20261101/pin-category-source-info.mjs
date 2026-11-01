#!/usr/bin/env node
/* Strict Commons primary API metadata pinning for five independent source-category leads. */
import fs from 'node:fs';
const root='.github/market-photo-category-review-20261101/';
const input=JSON.parse(fs.readFileSync(root+'INPUT_CANDIDATE_TITLES.json','utf8'));
if(input.kind!=='MARKETDIRECTORY_CATEGORY_DISCOVERY_SOURCE_PREFLIGHT_REVIEW_ONLY'||input.candidates.length!==5||!input.allUnselected||input.candidates.some(x=>!x.hold||x.approved))throw Error('STOP_SOURCE_INPUT');
const u=new URL('https://commons.wikimedia.org/w/api.php');
Object.entries({action:'query',format:'json',formatversion:'2',prop:'imageinfo',titles:input.candidates.map(x=>x.title).join('|'),iiprop:'url|sha1|size|mime|extmetadata|timestamp',iilimit:1}).forEach(([k,v])=>u.searchParams.set(k,v));
const response=await fetch(u,{headers:{'User-Agent':'MarketDirectoryPhotoCategoryReadOnly/1.0 (https://github.com/marketdirectory/marketdirectory)',Accept:'application/json'},signal:AbortSignal.timeout(25000),redirect:'error'});
if(response.status!==200)throw Error('STOP_PRIMARY_API_HTTP_'+response.status);
const data=await response.json();
if(data.error)throw Error('STOP_PRIMARY_API_'+data.error.code);
const pages=data.query?.pages||[],norm=s=>s.replaceAll('_',' ').toLowerCase().trim();
const pins=[]; const stops=[];
for(const c of input.candidates){
 const p=pages.find(p=>norm(p.title||'')===norm(c.title));
 const v=p?.imageinfo?.[0];
 if(!v||!v.sha1||v.mime!=='image/jpeg'||v.width<960||v.height<540){stops.push({title:c.title,reason:'NO_VALID_PRIMARY_JPEG_OR_SIZE'});continue}
 const license=v.extmetadata?.LicenseShortName?.value||'';
 const url=v.extmetadata?.LicenseUrl?.value||'';
 if(!/^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$))/i.test(license)||!/^https?:\/\/creativecommons\.org\/(?:licenses\/by(?:-sa)?\/|publicdomain\/)/.test(url)){stops.push({title:c.title,reason:'LICENSE_NOT_VERIFIED_AS_CC'});continue}
 pins.push({slug:c.slug,file_title:p.title,expected_sha1:v.sha1,expected_width:v.width,expected_height:v.height,license:license,license_url:url,prior_hold:c.hold,review_tier:'CATEGORY_DISCOVERED_SOURCE_HOLD',source_page:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')),note:c.note,photo_date:v.extmetadata?.DateTimeOriginal?.value||null,artist:v.extmetadata?.Artist?.value||null});
}
const obj={kind:'MARKETDIRECTORY_UNSELECTED_PUBLIC_COMMONS_THUMBNAIL_VISUAL_PREFLIGHT',source_commit:'CATEGORY_DISCOVERY_PRIMARY_COMMONS_METADATA_20261101',source_run:0,all_unselected:true,retain_holds:true,entries:pins,blocked:stops};
fs.writeFileSync(root+'SOURCE_API_PIN_RECEIPT.json',JSON.stringify(obj,null,2)+'\n');
fs.writeFileSync(root+'INPUT_REVIEW_ONLY.json',JSON.stringify(obj,null,2)+'\n');
fs.mkdirSync('.github/market-photo-visual-preflight',{recursive:true});
fs.writeFileSync('.github/market-photo-visual-preflight/INPUT_REVIEW_ONLY.json',JSON.stringify(obj,null,2)+'\n');
console.log('CATEGORY_SOURCE_PRIMARY_METADATA',JSON.stringify({candidates:input.candidates.length,matched:pins.length,blocked:stops}));
if(pins.length===0)process.exitCode=2;
