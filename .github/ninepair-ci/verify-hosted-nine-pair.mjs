#!/usr/bin/env node
// REVIEW ONLY. Staging HTTP GET proof. Never deploys, writes Git objects, connects DB or mutates refs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const EXPECTED_MANIFEST_BLOB='fb452638cd10385c4cff91474844f25d78d23f4d';
const fail=(code)=>{throw new Error('STOP_HOSTED_NINE_PAIR_'+code);};
const check=(condition,code)=>{if(!condition)fail(code);};
const oid=b=>crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const strictPath=(p)=>typeof p==='string' && /^(?:(?:market-photos|assets)\/[a-zA-Z0-9_.-]+|(?:index|deploy-info|asset-retention)\.html|(?:deploy-info|asset-retention)\.json)$/.test(p) && !p.includes('..');
const imageMime='image/webp';
function expectedMime(p){if(p.endsWith('.webp'))return [imageMime];if(p.endsWith('.js'))return ['application/javascript','text/javascript'];if(p.endsWith('.css'))return ['text/css'];if(p.endsWith('.json'))return ['application/json','text/json'];if(p.endsWith('.html'))return ['text/html'];fail('MIME_UNEXPECTED_PATH');}

export function loadManifestBytes(bytes,{expectedManifestBlob=EXPECTED_MANIFEST_BLOB}={}){
  check(Buffer.isBuffer(bytes),'MANIFEST_NOT_BUFFER');
  check(oid(bytes)===expectedManifestBlob,'MANIFEST_GIT_BLOB');
  let m;try{m=JSON.parse(bytes.toString('utf8'));}catch{fail('MANIFEST_NOT_JSON');}
  check(m.kind==='NINE_PAIR_STAGING_ASSET_ONLY_HOSTED_READBACK_REVIEW'&&m.version===1,'MANIFEST_KIND');
  check(m.host==='https://cms.marketdirectory.co.uk','UNEXPECTED_HOST');
  check(m.baseline_commit==='499c547213c5dc528397382e63da0ec69cc51b9a'&&
    m.candidate_commit==='b5bd2fa7869c7eca46d79e14f02bf23db8eebead'&&
    m.baseline_tree==='bff8ef3b66750f8ec39e1d0a015fd0719569a8fe'&&
    m.candidate_tree==='21676dba9620d8b39a98e3ff630081591de73947'&&
    m.photo_tree==='65984149251097da0af6c655362c8eefa8695d06','GIT_PINS');
  check(Array.isArray(m.photos)&&m.photos.length===80&&Array.isArray(m.protectedHostedFiles)&&m.protectedHostedFiles.length===5,'FILE_COUNTS');
  check(m.photos.filter(x=>x.history==='existing').length===62&&m.photos.filter(x=>x.history==='new').length===18,'PHOTO_SPLIT');
  check(m.preExistingFiles===459&&m.resultFiles===477&&m.preExistingPhotos===62&&m.newPhotos===18,'RETAINED_COUNTS');
  const paths=[...m.photos.map(x=>x.path),...m.protectedHostedFiles.map(x=>x.path)];
  check(paths.length===new Set(paths.map(x=>x.toLowerCase())).size&&paths.every(strictPath),'PATH_SAFETY');
  check(m.protectedHostedFiles.some(x=>x.path==='index.html')&&m.protectedHostedFiles.some(x=>x.path==='deploy-info.json')&&
    m.protectedHostedFiles.some(x=>x.path==='asset-retention.json')&&
    m.protectedHostedFiles.some(x=>x.path==='assets/index-AM8WeFAX.js')&&
    m.protectedHostedFiles.some(x=>x.path==='assets/index-D20WEbEL.css'),'PROTECTED_SET');
  for(const entry of [...m.photos,...m.protectedHostedFiles]){
    check(/^[a-f0-9]{40}$/.test(entry.blob)&&Number.isInteger(entry.bytes)&&entry.bytes>0,'FILE_METADATA');
    if(entry.history==='new')check(/^[a-f0-9]{64}$/.test(entry.sha256)&&!!entry.credit&&!!entry.licence&&!!entry.licenceUrl,'NEW_PHOTO_CREDIT_OR_SHA');
  }
  check(typeof m.expectedReportOnlyCsp==='string'&&m.expectedReportOnlyCsp.length>100&&
    m.expectedDeployInfo?.assetRetentionDeployments===10&&
    m.expectedDeployInfo?.sourceSha==='97f69a7f38f0680f6406c1b20e68c0b08e045021','HOSTED_METADATA_PINS');
  return m;
}

export async function auditHosted(manifest,mode,{fetchImpl=globalThis.fetch,nonce=crypto.randomBytes(6).toString('hex'),concurrency=4}={}){
  check(mode==='baseline'||mode==='candidate','MODE');
  check(typeof fetchImpl==='function'&&/^[a-zA-Z0-9-]{1,64}$/.test(nonce),'READONLY_FETCH_SETUP');
  check(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=8,'CONCURRENCY');
  const host=new URL(manifest.host);
  let count=0;
  async function request(relative,{missing=false,expected}={}){
    const target=new URL(relative?'/'+relative:'/',host);
    target.searchParams.set('ninepair_readback',nonce+'_'+(count++));
    let response;
    try{response=await fetchImpl(target.toString(),{method:'GET',redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},signal:AbortSignal.timeout(20000)});}catch(e){fail('NETWORK_OR_TIMEOUT_'+relative);}
    check(response&&typeof response.status==='number'&&typeof response.url==='string','INVALID_HTTP_RESPONSE');
    check(new URL(response.url).origin===host.origin&&new URL(response.url).pathname===target.pathname,'ORIGIN_OR_PATH_REDIRECT_'+relative);
    if(missing){check(response.status===404||response.status===410,'UNEXPECTED_PREEXISTING_NEW_PHOTO_'+relative);return {path:relative,status:response.status};}
    check(response.status===200,'HTTP_STATUS_'+relative);
    const mime=(response.headers.get('content-type')||'').toLowerCase().split(';')[0].trim();
    check(expectedMime(relative||'index.html').includes(mime),'MIME_'+relative);
    const bytes=Buffer.from(await response.arrayBuffer());
    check(bytes.length===expected.bytes,'BYTE_SIZE_'+relative);
    check(oid(bytes)===expected.blob,'GIT_BLOB_'+relative);
    if(expected.sha256)check(sha256(bytes)===expected.sha256,'SHA256_'+relative);
    return {path:relative||'/',status:response.status,oid:expected.blob,bytes:bytes.length,body:bytes,headers:response.headers};
  }
  const files=manifest.protectedHostedFiles;
  const protectedResults=[];
  for(const entry of files)protectedResults.push(await request(entry.path,{expected:entry}));
  const index=protectedResults.find(x=>x.path==='index.html');
  const root=await request('',{expected:files.find(x=>x.path==='index.html')});
  const info=JSON.parse(protectedResults.find(x=>x.path==='deploy-info.json').body.toString('utf8'));
  const retention=JSON.parse(protectedResults.find(x=>x.path==='asset-retention.json').body.toString('utf8'));
  check(info.sourceSha===manifest.expectedDeployInfo.sourceSha&&info.assetRetentionDeployments===10&&
    info.distBundle===manifest.expectedDeployInfo.distBundle&&info.distCss===manifest.expectedDeployInfo.distCss,'DEPLOY_INFO_FIELDS');
  check(retention.retentionDeployments===10&&retention.deployments?.length===10,'RETENTION_10');
  check(index.body.includes(Buffer.from(info.distBundle))&&index.body.includes(Buffer.from(info.distCss)),'BUNDLE_LINKS');
  for(const response of [root,protectedResults.find(x=>x.path==='deploy-info.json')]){
    check(response.headers.get('content-security-policy-report-only')===manifest.expectedReportOnlyCsp,'CSP_REPORT_ONLY_'+response.path);
    check((response.headers.get('x-content-type-options')||'').toLowerCase()==='nosniff','NOSNIFF_'+response.path);
  }
  const photoList=mode==='baseline'?manifest.photos.filter(x=>x.history==='existing'):manifest.photos;
  const missing=mode==='baseline'?manifest.photos.filter(x=>x.history==='new'):[];
  const jobs=[...photoList.map(entry=>()=>request(entry.path,{expected:entry})),...missing.map(entry=>()=>request(entry.path,{missing:true}))];
  const results=new Array(jobs.length);
  let next=0,failed=null;
  const workers=Array.from({length:Math.min(concurrency,jobs.length)},async()=>{
    while(!failed){const i=next++;if(i>=jobs.length)return;try{results[i]=await jobs[i]();}catch(e){failed=e;return;}}
  });
  await Promise.all(workers);
  if(failed)throw failed;
  return Object.freeze({result:mode==='baseline'?'BASELINE_HOSTED_READBACK_PASS':'CANDIDATE_HOSTED_READBACK_PASS',mode,
    host:manifest.host,candidate:manifest.candidate_commit,retentionDeployments:10,
    photosVerified:photoList.length,newPhotosAbsent:missing.length,protectedFilesVerified:files.length,
    rootVerified:true,publicationExecuted:false,metadataExecuted:false});
}

async function main(){
 const args=process.argv.slice(2);
 check(args.length===4&&args[0]==='--manifest'&&args[2]==='--mode','CLI_USAGE');
 const abs=path.resolve(args[1]);
 check(fs.existsSync(abs)&&fs.lstatSync(abs).isFile()&&!fs.lstatSync(abs).isSymbolicLink(),'MANIFEST_PATH');
 const m=loadManifestBytes(fs.readFileSync(abs));
 const result=await auditHosted(m,args[3]);
 console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))main().catch(e=>{console.error(e.message);process.exitCode=1;});
