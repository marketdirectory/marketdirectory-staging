import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {auditHosted,loadManifestBytes} from './verify-hosted-nine-pair.mjs';
const sha1=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=new Map();
function entry(p,content,history){const b=Buffer.from(content);bytes.set(p,b);return {path:p,blob:sha1(b),bytes:b.length,...(history?{history}:{}),...(history==='new'?{sha256:sha256(b),credit:'Synthetic creator',licence:'CC BY-SA 3.0',licenceUrl:'https://creativecommons.org/licenses/by-sa/3.0/'}:{})};}
function setup(){
 bytes.clear();
 const script='assets/index-AM8WeFAX.js',css='assets/index-D20WEbEL.css';
 const html=entry('index.html',`<html><script src="${script}"></script><link href="${css}"></html>`);
 const info=entry('deploy-info.json',JSON.stringify({sourceSha:'97f69a7f38f0680f6406c1b20e68c0b08e045021',assetRetentionDeployments:10,distBundle:script,distCss:css}));
 const retain=entry('asset-retention.json',JSON.stringify({retentionDeployments:10,deployments:Array.from({length:10},(_,i)=>({i}))}));
 const protectedHostedFiles=[html,info,retain,entry(script,'fixture-js'),entry(css,'fixture-css')];
 const photos=[];
 for(let i=0;i<80;i++){const history=i<62?'existing':'new';photos.push(entry(`market-photos/photo-${String(i).padStart(2,'0')}-480.webp`,'RIFF---WEBP synthetic #'+i,history));}
 const m={kind:'NINE_PAIR_STAGING_ASSET_ONLY_HOSTED_READBACK_REVIEW',version:1,
  host:'https://cms.marketdirectory.co.uk',baseline_commit:'499c547213c5dc528397382e63da0ec69cc51b9a',
  candidate_commit:'b5bd2fa7869c7eca46d79e14f02bf23db8eebead',baseline_tree:'bff8ef3b66750f8ec39e1d0a015fd0719569a8fe',
  candidate_tree:'21676dba9620d8b39a98e3ff630081591de73947',photo_tree:'65984149251097da0af6c655362c8eefa8695d06',
  preExistingFiles:459,preExistingPhotos:62,newPhotos:18,resultFiles:477,resultPhotos:80,
  expectedReportOnlyCsp:'A synthetic very long content security policy for original host and browser staging only, intentionally longer than a hundred characters.',
  expectedDeployInfo:{sourceSha:'97f69a7f38f0680f6406c1b20e68c0b08e045021',assetRetentionDeployments:10,distBundle:script,distCss:css},
  protectedHostedFiles,photos};
 return m;
}
const mime=p=>p.endsWith('.webp')?'image/webp':p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html';
function fakeFetch(m,mode,mutate=()=>{}){
 const config={wrongMime:null,wrongBody:null,wrongStatus:null,redirect:null,badCsp:false,badNosniff:false,staleNew:false,htmlFallback:false,tamperFallback:false,fallbackWrongMime:false};mutate(config);
 const calls=[];
 const fn=async url=>{
  const u=new URL(url),p=u.pathname==='/'?'index.html':u.pathname.slice(1);calls.push(p);
  const isNew=m.photos.some(x=>x.path===p&&x.history==='new');
  const expectedMissing=mode==='baseline'&&isNew&&!config.staleNew;
  const status=config.wrongStatus===p?500:expectedMissing?(config.htmlFallback?200:404):200;
  const data=config.wrongBody===p?Buffer.from('TAMPERED'):
    expectedMissing&&config.htmlFallback?(config.tamperFallback?Buffer.from('WRONG INDEX'):bytes.get('index.html')):
    bytes.get(p)||Buffer.from('NOT FOUND');
  const headers=new Headers({'content-type':mime(p),'content-security-policy-report-only':config.badCsp?'different':m.expectedReportOnlyCsp,
  'x-content-type-options':config.badNosniff?'wrong':'nosniff'});
  if(expectedMissing&&config.htmlFallback)headers.set('content-type',config.fallbackWrongMime?'image/webp':'text/html');
  if(config.wrongMime===p)headers.set('content-type','text/html');
  return {url:config.redirect===p?'https://other.invalid/evil':url,status,headers,async arrayBuffer(){return data;}};
 };
 return {fetchImpl:fn,calls};
}
async function run(m,mode,mutate){const f=fakeFetch(m,mode,mutate);return auditHosted(m,mode,{fetchImpl:f.fetchImpl,nonce:'fixture',concurrency:3});}
test('valid synthetic baseline verifies 62 hosted originals and 18 absent new paths',async()=>{const m=setup(),result=await run(m,'baseline');assert.equal(result.photosVerified,62);assert.equal(result.newPhotosAbsent,18);assert.equal(result.protectedFilesVerified,5);});
test('valid synthetic candidate verifies all 80 photo content hashes',async()=>{const m=setup(),r=await run(m,'candidate');assert.equal(r.photosVerified,80);assert.equal(r.newPhotosAbsent,0);assert.equal(r.publicationExecuted,false);});
test('pinned manifest blob is mandatory',()=>{const m=setup(),b=Buffer.from(JSON.stringify(m));assert.throws(()=>loadManifestBytes(b),/MANIFEST_GIT_BLOB/);assert.equal(loadManifestBytes(b,{expectedManifestBlob:sha1(b)}).photos.length,80);});
test('hosted root must match exact old HTML',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongBody='index.html'),/BYTE_SIZE_index.html/);});
test('old photo bytes may not drift even if HTTP status is 200',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongBody=m.photos[0].path),/BYTE_SIZE_market-photos/);});
test('new photo bytes may not drift',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongBody=m.photos[79].path),/BYTE_SIZE_market-photos/);});
test('baseline must refuse a new photo already served before candidate release',async()=>{const m=setup();await assert.rejects(()=>run(m,'baseline',c=>c.staleNew=true),/UNEXPECTED_PREEXISTING_NEW_PHOTO/);});
test('exact original SPA HTML fallback with 200 proves new photos absent',async()=>{
 const m=setup();const r=await run(m,'baseline',c=>c.htmlFallback=true);
 assert.equal(r.newPhotosAbsent,18);assert.equal(r.newPhotoSpaFallbacks,18);
});
test('SPA fallback with wrong body refuses baseline',async()=>{
 const m=setup();await assert.rejects(()=>run(m,'baseline',c=>{c.htmlFallback=true;c.tamperFallback=true;}),/UNEXPECTED_PREEXISTING_NEW_PHOTO/);
});
test('SPA fallback with 200 and image mime refuses baseline',async()=>{
 const m=setup();await assert.rejects(()=>run(m,'baseline',c=>{c.htmlFallback=true;c.fallbackWrongMime=true;}),/UNEXPECTED_PREEXISTING_NEW_PHOTO/);
});
test('wrong content type fails even when bytes are correct',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongMime=m.photos[10].path),/MIME_market-photos/);});
test('cross-origin redirect fails',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.redirect='deploy-info.json'),/ORIGIN_OR_PATH_REDIRECT/);});
test('HTTP 500 fails',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongStatus=m.photos[5].path),/HTTP_STATUS_market-photos/);});
test('missing CSP report-only header fails',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.badCsp=true),/CSP_REPORT_ONLY/);});
test('missing nosniff header fails',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.badNosniff=true),/NOSNIFF/);});
test('preserved compiled JS bytes must match',async()=>{const m=setup();await assert.rejects(()=>run(m,'candidate',c=>c.wrongBody='assets/index-AM8WeFAX.js'),/BYTE_SIZE_assets/);});
test('duplicate photo paths in manifest fail before network',()=>{const m=setup();m.photos[1].path=m.photos[0].path;const b=Buffer.from(JSON.stringify(m));assert.throws(()=>loadManifestBytes(b,{expectedManifestBlob:sha1(b)}),/PATH_SAFETY/);});
test('wrong candidate tree pin fails before network',()=>{const m=setup();m.candidate_tree='f'.repeat(40);const b=Buffer.from(JSON.stringify(m));assert.throws(()=>loadManifestBytes(b,{expectedManifestBlob:sha1(b)}),/GIT_PINS/);});
test('missing new credit is refused',()=>{const m=setup();delete m.photos[78].credit;const b=Buffer.from(JSON.stringify(m));assert.throws(()=>loadManifestBytes(b,{expectedManifestBlob:sha1(b)}),/NEW_PHOTO_CREDIT_OR_SHA/);});
test('invalid mode refuses without network call',async()=>{const m=setup();await assert.rejects(()=>run(m,'publish'),/MODE/);});
