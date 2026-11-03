import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const released=resolve('photo-companion/releases/1.2.3.json');
const j=JSON.parse(readFileSync(released,'utf8'));
test('Windows Node 24: a server in a folder containing spaces runs with fileURLToPath',()=>{
 const dir=mkdtempSync(join(tmpdir(),'D Drive Market Directory Photos '));
 try{
  const childPath=join(dir,'server test file.mjs');
  writeFileSync(childPath,'console.log("WIN_PATH_OK")\n');
  const childUrl=pathToFileURL(childPath);
  assert.ok(childUrl.pathname.includes('%20'));
  assert.notEqual(childUrl.pathname,fileURLToPath(childUrl));
  const good=spawnSync(process.execPath,[fileURLToPath(childUrl)],{encoding:'utf8',timeout:6000});
  assert.equal(good.status,0,good.stderr);
  assert.match(good.stdout,/WIN_PATH_OK/);
  if(process.platform==='win32'){
   const bad=spawnSync(process.execPath,[childUrl.pathname],{encoding:'utf8',timeout:6000});
   assert.notEqual(bad.status,0,'URL.pathname must not be passed to child processes on Windows');
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('Published patch contains exact Windows-safe test source, not a bypass',()=>{
 assert.equal(j.version,'1.2.3');
 assert.equal(j.baseVersion,'1.2.2');
 assert.equal(j.scope,'review-only');
 assert.equal(j.productionAccess,false);
 const file=j.changes['tests.mjs'];
 const bytes=Buffer.from(file.base64,'base64');
 assert.equal(bytes.length,file.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
 const source=bytes.toString('utf8');
 assert.match(source,/fileURLToPath\(new URL\('\.\/server\.mjs'/);
 assert.match(source,/spawn\(process\.execPath,\[u\]/);
 assert.doesNotMatch(source,/spawn\(process\.execPath,\[u\.pathname\]/);
 assert.match(source,/tool code is read-only/);
 assert.match(source,/local server exposes ONLY review endpoints/);
});
