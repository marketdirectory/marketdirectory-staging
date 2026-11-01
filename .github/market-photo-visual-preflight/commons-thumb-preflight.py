#!/usr/bin/env python3
"""Public-source thumbnails only. No approval, original acquisition, hosting, mutation or publication."""
import hashlib
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(".github/market-photo-visual-preflight")
OUT = Path("public-photo-review-output")
UA = "MarketDirectoryPublicSourcePreflight/1.0 (admin@marketdirectory.co.uk; review only)"
MAX_BYTES = 5_000_000
Image.MAX_IMAGE_PIXELS = 24_000_000
def fail(reason):
    raise ValueError(reason)
def get_bytes(url, limit, *, api=False):
    p = urllib.parse.urlsplit(url)
    allowed = ("commons.wikimedia.org",) if api else ("upload.wikimedia.org", "thumb.wikimedia.org",)
    if p.scheme != "https" or p.hostname not in allowed or p.username or p.password or p.port:
        fail("STOP_UNEXPECTED_NETWORK_ORIGIN host="+str(p.hostname)+" scheme="+str(p.scheme)+" is_api="+str(api))
    if not api:
        query_keys = [k for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True)]
        if p.fragment or not p.path.startswith("/wikipedia/commons/") or any(k not in ("utm_source","utm_campaign","utm_content") for k in query_keys):
            fail("STOP_UNEXPECTED_THUMBNAIL_PATH")
        # Commons imageinfo supplies attribution UTM parameters. Drop ONLY those inert tracking fields.
        url = urllib.parse.urlunsplit((p.scheme,p.netloc,p.path,"",""))
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json" if api else "image/*"})
    with urllib.request.urlopen(req, timeout=30) as response:
        final = urllib.parse.urlsplit(response.geturl())
        if final.scheme != "https" or final.hostname not in allowed or (not api and final.query):
            fail("STOP_REDIRECT_OFF_ORIGIN")
        if response.status != 200:
            fail("STOP_HTTP_" + str(response.status))
        payload = response.read(limit + 1)
        if len(payload) > limit:
            fail("STOP_SIZE_BOUND")
        content_type = response.headers.get("Content-Type","")
        if api and "json" not in content_type:
            fail("STOP_NOT_JSON")
        if not api and not content_type.lower().startswith("image/"):
            fail("STOP_NOT_IMAGE")
        return payload
def norm_license(url):
    p = urllib.parse.urlsplit(url)
    if p.scheme not in ("http", "https") or p.hostname != "creativecommons.org" or p.username:
        fail("STOP_LICENSE_DOMAIN")
    return p.path.lower().rstrip("/")
def validate_item(entry):
    title=entry["file_title"]
    if not title.startswith("File:") or not re.fullmatch("[0-9a-f]{40}",entry["expected_sha1"]):
        fail("STOP_INPUT_IDENTITY")
    query=urllib.parse.urlencode({"action":"query","format":"json","formatversion":"2","prop":"imageinfo",
       "titles":title,"iiprop":"url|size|sha1|mime|extmetadata|timestamp","iiurlwidth":960})
    obj=json.loads(get_bytes("https://commons.wikimedia.org/w/api.php?"+query,1_500_000,api=True))
    pages=obj.get("query",{}).get("pages",[])
    if len(pages)!=1 or pages[0].get("title")!=title:
        fail("STOP_COMMONS_TITLE_MISMATCH")
    records=pages[0].get("imageinfo",[])
    if len(records)!=1:
        fail("STOP_MISSING_PRIMARY_SOURCE")
    item=records[0]
    if item.get("sha1")!=entry["expected_sha1"] or item.get("mime")!="image/jpeg":
        fail("STOP_ORIGINAL_IDENTITY_OR_MIME_DRIFT")
    if item.get("width")!=entry["expected_width"] or item.get("height")!=entry["expected_height"]:
        fail("STOP_ORIGINAL_DIMENSION_DRIFT")
    rights=item.get("extmetadata",{})
    actual_license=rights.get("LicenseUrl",{}).get("value","")
    if norm_license(actual_license)!=norm_license(entry["license_url"]):
        fail("STOP_LICENSE_URL_DRIFT")
    actual_name=rights.get("LicenseShortName",{}).get("value","")
    if actual_name.strip().upper().replace(" ","")!=entry["license"].strip().upper().replace(" ",""):
        fail("STOP_LICENSE_NAME_DRIFT")
    thumb_url=item.get("thumburl")
    if not thumb_url:
        fail("STOP_NO_PRIMARY_API_THUMBNAIL")
    raw=get_bytes(thumb_url,MAX_BYTES)
    with Image.open(io.BytesIO(raw)) as im:
        if im.format not in ("JPEG","PNG"):
            fail("STOP_UNEXPECTED_THUMBNAIL_MIME")
        picture=ImageOps.exif_transpose(im).convert("RGB")
    w,h=picture.size
    if w<500 or h<500:
        fail("STOP_PREVIEW_TOO_SMALL")
    # Review crop only. No hero-ready WebPs or distribution assets generated.
    crop_width=min(w,int(h*16/9))
    crop_height=min(h,int(w*9/16))
    cx=(w-crop_width)//2
    cy=(h-crop_height)//2
    crop=picture.crop((cx,cy,cx+crop_width,cy+crop_height))
    original_thumb_path=OUT/"thumbnails"/(entry["slug"]+"-"+entry["expected_sha1"][:8]+".jpg")
    crop_path=OUT/"review-crops"/(entry["slug"]+"-"+entry["expected_sha1"][:8]+".jpg")
    picture.thumbnail((960,960),Image.Resampling.LANCZOS)
    picture.save(original_thumb_path,"JPEG",quality=84)
    crop.resize((640,360),Image.Resampling.LANCZOS).save(crop_path,"JPEG",quality=84)
    return {
        "slug":entry["slug"],"exact_title":title,"prior_hold":entry["prior_hold"],
        "review_tier":entry["review_tier"],"review_status":"UNSELECTED_VISUAL_REVIEW_ONLY",
        "source_page":entry["source_page"],"original_sha1_primary_api":item["sha1"],
        "original_width":item["width"],"original_height":item["height"],"original_bytes":item["size"],
        "original_metadata_timestamp":item.get("timestamp"),"license_url_primary_api":actual_license,
        "license_name_primary_api":actual_name,"thumbnail_source_from_primary_api":thumb_url,
        "thumbnail_sha256":hashlib.sha256(raw).hexdigest(),"thumbnail_download_bytes":len(raw),
        "thumbnail_dimensions":[w,h],"source_thumb_path":str(original_thumb_path),
        "review_crop_path":str(crop_path),"crop_rectangle_on_thumbnail":[cx,cy,crop_width,crop_height],
        "limitations":"Thumbnail is NOT original bytes or an approved market image. Licence and API SHA-1 refer to original metadata only."
    }
def sheet(rows,key,name):
    col_n=4
    tile_w,tile_h=340,255
    canvas=Image.new("RGB",(col_n*tile_w,((len(rows)+3)//4)*tile_h),"#f6f6f4")
    draw=ImageDraw.Draw(canvas)
    for i,entry in enumerate(rows):
        left=(i%4)*tile_w
        top=(i//4)*tile_h
        draw.text((left+8,top+5),entry["slug"][:41],fill="#111111")
        draw.text((left+8,top+21),entry["review_tier"][:42],fill="#555555")
        if key in entry:
            with Image.open(entry[key]) as pic:
                pic.thumbnail((324,195),Image.Resampling.LANCZOS)
                canvas.paste(pic,(left+8+(324-pic.width)//2,top+45+(195-pic.height)//2))
        else:
            draw.text((left+8,top+65),"HELD: "+entry.get("error","unknown")[:32],fill="#9a1515")
        draw.text((left+8,top+243),"UNSELECTED / NOT FOR PUBLICATION",fill="#6b2020")
    path=OUT/name
    canvas.save(path,"JPEG",quality=85,optimize=True)
    return {"path":str(path),"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
def main():
    data=json.loads((ROOT/"INPUT_REVIEW_ONLY.json").read_text(encoding="utf-8"))
    entries=data["entries"]
    if data.get("kind")!="MARKETDIRECTORY_UNSELECTED_PUBLIC_COMMONS_THUMBNAIL_VISUAL_PREFLIGHT" or not data.get("all_unselected") or not data.get("retain_holds") or len(entries)>22:
        fail("STOP_INPUT_GATE")
    OUT.mkdir(exist_ok=False)
    (OUT/"thumbnails").mkdir()
    (OUT/"review-crops").mkdir()
    outcome=[]
    for number,row in enumerate(entries,1):
        try:
            checked=validate_item(row)
            print("PREVIEW_ONLY_OK",number,row["slug"],checked["original_sha1_primary_api"])
            outcome.append(checked)
        except Exception as exc:
            print("PREFLIGHT_STOP",number,row["slug"],str(exc))
            outcome.append({"slug":row["slug"],"exact_title":row["file_title"],"prior_hold":row["prior_hold"],
               "review_tier":row["review_tier"],"review_status":"STILL_HELD_SOURCE_PREFLIGHT_FAILURE",
               "error":str(exc)[:160]})
        time.sleep(0.2)
    sheets=[sheet(outcome,"source_thumb_path","SOURCE_THUMBNAILS_REVIEW_ONLY.jpg"),
            sheet(outcome,"review_crop_path","CENTRE_16x9_CROPS_REVIEW_ONLY.jpg")]
    result={"kind":"MARKETDIRECTORY_THUMBNAIL_ONLY_VISUAL_PREFLIGHT_RECEIPT",
        "source_input":data["source_commit"],"source_run":data["source_run"],
        "checked":len(outcome),"preview_success":sum(x["review_status"]=="UNSELECTED_VISUAL_REVIEW_ONLY" for x in outcome),
        "preflight_held":sum(x["review_status"]!="UNSELECTED_VISUAL_REVIEW_ONLY" for x in outcome),
        "status":"NO_SOURCES_SELECTED_OR_APPROVED","all_existing_holds_retained":True,
        "no_original_download":True,"no_publication":True,"sheets":sheets,"results":outcome}
    (OUT/"ACTUAL_PREFLIGHT_RECEIPT.json").write_text(json.dumps(result,indent=2)+"\n")
    print("REVIEW_ONLY_RECEIPT",json.dumps({"checked":result["checked"],"preview_success":result["preview_success"],"held":result["preflight_held"]}))
    if result["preflight_held"]:
        raise SystemExit(2)
if __name__=="__main__":
    main()
