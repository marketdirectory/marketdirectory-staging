"use strict";
const DB="https://ldwhbhsispjzmstcsgas.supabase.co", KEY="sb_publishable_oemv1UCnnNgVKORSMhRuKQ_NSXXFo63", STORE="market-images", PREVIEW="https://marketdirectory-v14c-glass-review.marketdirectory-review.workers.dev", PREFIX="hero-cards/v14c/", roles=[
{role:"shopper",title:"Shopper",note:"Browsing a bustling British market",original:"owner-shopper.webp"},
{role:"trader",title:"Trader",note:"A male trader selling fresh baked goods",original:"owner-trader.png"},
{role:"organiser",title:"Market organiser",note:"Organising and supporting a thriving market",original:"owner-organiser.png"}
];
const client=window.supabase?.createClient(DB,KEY,{auth:{storageKey:"marketdirectory-auth-token",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=s=>document.querySelector(s);
let editing=false,overrides={},modes={},drafts={},previews={},recents={},factor=null;
const pathFor=(role,name)=>PREFIX+role+"/"+name;
const valid=(role,path)=>typeof path==="string"&&new RegExp("^"+PREFIX+role+"/[A-Za-z0-9_-]{6,80}\\.(png|jpe?g|webp)$","i").test(path);
const url=path=>client.storage.from(STORE).getPublicUrl(path).data.publicUrl;
function message(text,tone=""){const el=$("#message");el.textContent=text;el.className="banner "+(tone==="error"?"error":tone==="ok"?"ok":"");}
function gate(title,description,href,label){
 $("#editor").classList.add("hidden");$("#auth").classList.remove("hidden");$("#auth-heading").textContent=title;$("#auth-explainer").textContent=description;$("#auth-actions").replaceChildren();
 if(href){const a=document.createElement("a");a.href=href;a.textContent=label;$("#auth-actions").append(a);}
}
function makeOtp(factorId){
 factor=factorId;gate("Verify your authenticator","Enter the six-digit code from your authenticator app to manage homepage images.");
 const form=document.createElement("form");const input=document.createElement("input");input.required=true;input.pattern="[0-9]{6}";input.maxLength=6;input.autocomplete="one-time-code";input.inputMode="numeric";input.placeholder="000000";input.setAttribute("aria-label","Authenticator code");const btn=document.createElement("button");btn.className="primary";btn.textContent="Verify";btn.type="submit";
 form.append(input,btn);$("#auth-actions").append(form);form.addEventListener("submit",async ev=>{ev.preventDefault();btn.disabled=true;try{const c=await client.auth.mfa.challenge({factorId:factor});if(c.error)throw c.error;const r=await client.auth.mfa.verify({factorId:factor,challengeId:c.data.id,code:input.value});if(r.error)throw r.error;message("Authenticator verified.","ok");await initialize();}catch(e){message("Verification failed: "+(e.message||e),"error");}finally{btn.disabled=false;input.value="";}});}
async function initialize(){
 try{
  if(!client){gate("Editor unavailable","The secure session library could not load.");return;}
  const auth=await client.auth.getUser();if(auth.error||!auth.data?.user){gate("Please sign in first","Open the normal MarketDirectory admin login, then return to this page after signing in.","/admin/login","Open admin login");return;}
  const aal=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(aal.error)throw aal.error;
  if(aal.data.currentLevel!=="aal2"){
   const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
   const active=(factors.data?.totp||[]).find(x=>x.status==="verified");
   if(active){makeOtp(active.id);return;}
   gate("Two-factor security required","Set up your authenticator in the normal admin panel, then return to manage your hero images.","/admin/mfa-setup","Set up authentication");return;
  }
  const {data:profile,error}=await client.from("profiles").select("id,role,is_banned").eq("id",auth.data.user.id).maybeSingle();
  if(error)throw error;
  if(!profile||profile.id!==auth.data.user.id||profile.is_banned||!["super_admin","admin","editor"].includes(profile.role)){
   gate("Admin access required","This account does not have permission to change MarketDirectory imagery.","/admin/dashboard","Back to admin");return;
  }
  $("#auth").classList.add("hidden");$("#editor").classList.remove("hidden");
  await load();
 }catch(e){gate("Unable to check permissions","The editor could not verify your account. Nothing has been changed.");message(e.message||"Could not verify admin access.","error");}
}
async function readSettings(){
 const {data,error}=await client.from("site_settings").select("settings").eq("settings_key","default").maybeSingle();
 if(error)throw error;if(!data||typeof data.settings!=="object"||!data.settings)throw Error("Site settings are missing; changes stopped.");
 return data.settings;
}
function normalize(raw){const result={};for(const {role} of roles){const v=raw?.[role];if(valid(role,v?.path))result[role]={path:v.path,mode:v.mode==="full"?"full":"photo"};}return result;}
function release(role){if(previews[role])URL.revokeObjectURL(previews[role]);delete previews[role];delete drafts[role];}
function card(role){return document.querySelector('[data-role="'+role+'"]');}
function refresh(role){
 const node=card(role);if(!node)return;
 const selected=overrides[role],original=roles.find(x=>x.role===role).original;
 node.querySelector("img.visual").src=previews[role]||(selected?.path?url(selected.path):PREVIEW+"/assets/"+original);
 node.querySelector("select").value=modes[role]||selected?.mode||"photo";
 node.querySelector(".status").textContent=drafts[role]?"New image selected — not saved":selected?.path?"Custom image is active":"Current preview image (owner-approved)";
 node.querySelector(".save").disabled=editing||(!drafts[role]&&!selected?.path);
 node.querySelector(".foot").disabled=editing||!selected?.path;
 const tiles=node.querySelector(".tiles");tiles.replaceChildren();
 for(const item of recents[role]||[]){
  if(!valid(role,pathFor(role,item.name)))continue;
  const btn=document.createElement("button");btn.title="Use "+item.name;btn.type="button";btn.disabled=editing;
  const image=document.createElement("img");image.alt="Previously uploaded "+role+" artwork";image.loading="lazy";image.src=url(pathFor(role,item.name));
  btn.append(image);btn.addEventListener("click",()=>save(role,pathFor(role,item.name)));tiles.append(btn);
 }
 node.querySelector("details").classList.toggle("hidden",!(recents[role]||[]).length);
}
function paint(){for(const {role} of roles)refresh(role);}
function setEditing(value){editing=value;document.querySelectorAll("#editor button,#editor input,#editor select").forEach(n=>{n.disabled=value;});paint();}
async function loadHistory(role){
 const res=await client.storage.from(STORE).list(PREFIX+role,{limit:30,sortBy:{column:"created_at",order:"desc"}});
 if(res.error)throw res.error;recents[role]=(res.data||[]).filter(x=>x.id&&valid(role,pathFor(role,x.name)));refresh(role);
}
async function load(){
 const settings=await readSettings();overrides=normalize(settings.heroCardImages);
 $("#cards").replaceChildren();
 for(const {role,title,note} of roles){
  modes[role]=overrides[role]?.mode||"photo";
  const section=document.createElement("section");section.className="card";section.dataset.role=role;
  section.innerHTML='<div class="cardhead"><h2>'+title+'</h2><p>'+note+'</p></div><div class="art"><div><img class="visual" alt="'+title+' selected image"></div></div><div class="cardbody"><label class="caption">Image type<select><option value="photo">Photo only — keep website text</option><option value="full">Finished artwork — use image text</option></select></label><label class="choose">Choose replacement image<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload '+title+' card image"></label><div class="status" role="status"></div><button type="button" class="primary save">Upload & save this card</button><details class="history"><summary>Previously uploaded images</summary><div class="tiles"></div></details><button type="button" class="foot">↶ Restore original image</button></div>';
  $("#cards").append(section);
  section.querySelector("select").addEventListener("change",ev=>{modes[role]=ev.target.value;});
  section.querySelector("input").addEventListener("change",async ev=>{
   const f=ev.target.files?.[0];ev.target.value="";if(!f)return;
   try{await checkFile(f);release(role);drafts[role]=f;previews[role]=URL.createObjectURL(f);refresh(role);message("Selected image. Click Upload & save to apply it.");}
   catch(e){message(e.message||"Image rejected.","error");}
  });
  section.querySelector(".save").addEventListener("click",()=>save(role,null));
  section.querySelector(".foot").addEventListener("click",()=>restore(role));
  refresh(role);
 }
 await Promise.all(roles.map(async({role})=>{try{await loadHistory(role);}catch(e){card(role).querySelector(".status").textContent="Saved images unavailable; new uploads still work.";}}));
}
async function checkFile(file){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error("Choose a JPG, PNG or WebP image.");
 if(!file.size||file.size>10*1024*1024)throw Error("The file must be smaller than 10 MB.");
 const u=URL.createObjectURL(file);
 try{const dim=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve({w:im.naturalWidth,h:im.naturalHeight});im.onerror=()=>reject(Error("This image could not be decoded."));im.src=u;});if(dim.w<600||dim.h<800)throw Error("Use at least 600 × 800 pixels.");}
 finally{URL.revokeObjectURL(u);}
}
async function commit(role,path,restore=false){
 const current=await readSettings();const values=normalize(current.heroCardImages);
 if(restore)delete values[role];else{if(!valid(role,path))throw Error("Image path rejected.");values[role]={path,mode:modes[role]==="full"?"full":"photo"};}
 const {data,error}=await client.from("site_settings").update({settings:{...current,heroCardImages:values}}).eq("settings_key","default").select("settings").single();
 if(error)throw error;overrides=normalize(data.settings.heroCardImages);
}
async function save(role,history){
 if(editing)return;const file=history?null:drafts[role],path=history||(!file?overrides[role]?.path:null);
 if(!file&&!path){message("Choose an image before saving.","error");return;}
 setEditing(true);message("Saving "+role+" image…");
 try{
  let target=path;
  if(file){
   await checkFile(file);const ext=file.type==="image/webp"?"webp":file.type==="image/png"?"png":"jpg";
   target=pathFor(role,crypto.randomUUID()+"."+ext);
   const uploaded=await client.storage.from(STORE).upload(target,file,{contentType:file.type,cacheControl:"31536000",upsert:false});
   if(uploaded.error)throw uploaded.error;
  }
  await commit(role,target);release(role);await loadHistory(role);
  message("Saved "+role+" image! Refresh the V14C preview to see it.","ok");
 }catch(e){message(/row-level security/i.test(String(e?.message||e)) ? "Upload blocked by staging image-storage permissions. Your current pictures remain unchanged." : "Could not save "+role+": "+(e.message||e),"error");}
 finally{setEditing(false);paint();}
}
async function restore(role){
 if(editing)return;setEditing(true);
 try{await commit(role,null,true);modes[role]="photo";release(role);message("Restored original "+role+" artwork. Your previous uploads are still available.","ok");}
 catch(e){message("Could not restore: "+(e.message||e),"error");}
 finally{setEditing(false);paint();}
}
initialize();