#!/usr/bin/env node
// Public Commons thumbnail-only visual review: never saves original files or publishes any images.
import fs from 'node:fs';
import crypto from 'node:crypto';
const targets=JSON.parse(fs.readFileSync('.github/visual-preflight/six-sources.json','utf8'));
if(targets.kind!=='MARKETDIRECTORY_PUBLIC_THUMBNAIL_REVIEW_ONLY'||targets.files.length!==6)throw Error('STOP_SOURCE_INPUT');
const api='https://commons.wikimedia.org/w/api.php',receipts=[];
fs.mkdirSync('review-thumbnails',{recursive:true});
for(let i=0;i<targets.files.length;i++){
 const e=targets.files[i];
 if(!e.title.startsWith('File:')||!/^[a-f0-9]{40}$/.test(e.sha1))throw Error('STOP_FILE_PIN');
 const q=new URL(api);for(const [k,v] of Object.entries({action:'query',format:'json',formatversion:'2',prop:'imageinfo',titles:e.title,iiprop:'sha1|size|extmetadata|url',iiurlwidth:'640',iilimit:'1'}))q.searchParams.set(k,v);
 const r=await fetch(q,{headers:{'User-Agent':'MarketDirectoryThumbPreflight/1.0 (+https://github.com/marketdirectory/marketdirectory; review-only)'},signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('STOP_COMMONS_HTTP_'+r.status);
 const j=await r.json();const pg=j.query?.pages?.[0];if(pg?.title!==e.title||!pg.imageinfo?.length)throw Error('STOP_API_FILE_IDENTITY');
 const im=pg.imageinfo[0],meta=im.extmetadata||{};
 if(im.sha1!==e.sha1||(im.width||0)<960||(im.height||0)<540||meta.LicenseShortName?.value!==e.licenseName)throw Error('STOP_SOURCE_HASH_DIM_LICENCE_'+e.slug);
 if(!im.thumburl||!im.thumburl.startsWith('https://upload.wikimedia.org/'))throw Error('STOP_THUMB_SOURCE');
 if(im.thumbwidth>640||im.thumbheight>640)throw Error('STOP_THUMB_TOO_BIG');
 const imr=await fetch(im.thumburl,{signal:AbortSignal.timeout(25000)});if(!imr.ok)throw Error('STOP_THUMB_HTTP_'+imr.status);
 const mime=(imr.headers.get('content-type')||'').toLowerCase();if(!mime.startsWith('image/'))throw Error('STOP_THUMB_MIME');
 const bytes=Buffer.from(await imr.arrayBuffer());if(bytes.length>2000000||bytes.length<3000)throw Error('STOP_THUMB_SIZE');
 const suffix=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';const name=String(i+1).padStart(2,'0')+'-'+e.slug+'.'+suffix;
 fs.writeFileSync('review-thumbnails/'+name,bytes);
 receipts.push({slug:e.slug,status:'THUMBNAIL_PREVIEW_UNSELECTED',sourceFileTitle:e.title,photoDate:e.date,originalSha1:e.sha1,originalWidth:im.width,originalHeight:im.height,creatorSource:e.credit,licence:meta.LicenseShortName?.value,licenceURL:meta.LicenseUrl?.value,thumbnailPath:'review-thumbnails/'+name,thumbnailWidth:im.thumbwidth,thumbnailHeight:im.thumbheight,thumbnailBytes:bytes.length,thumbnailSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),preexistingHold:e.hold});
 console.log('PREVIEW_REVIEW_ONLY',JSON.stringify({slug:e.slug,thumb:name,original:im.width+'x'+im.height,licence:meta.LicenseShortName?.value,bytes:bytes.length}));
 await new Promise(res=>setTimeout(res,250));
}
fs.writeFileSync('review-thumbnails/receipt.json',JSON.stringify({kind:'MARKETDIRECTORY_SIX_PUBLIC_WIKIMEDIA_THUMBNAILS_VISUAL_REVIEW_ONLY',timestamp:new Date().toISOString(),releasePermission:'NONE',selected:0,originalDownloaded:0,thumbs:receipts},null,2)+'\n');
console.log('SIX_THUMBNAILS_REVIEW_ONLY_PASS');
