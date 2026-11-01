#!/usr/bin/env python3
"""Build a review-only candidate batch from the exact frozen 100-market Commons sweep."""
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(".github/market-photo-visual-preflight")
SOURCE=Path("public-sweep-source/public-sweep-results.json")
selection=json.loads((ROOT/"BATCH02_SELECTION_REVIEW_ONLY.json").read_text())
raw=SOURCE.read_bytes()
if hashlib.sha256(raw).hexdigest()!=selection["original_sweep_receipt_sha256"]:
    raise SystemExit("STOP_SOURCE_RECEIPT_SHA256_MISMATCH")
sweep=json.loads(raw)
if sweep["targetsAttempted"]!=100 or sweep["metadataCandidates"]!=1056 or sweep["cutoff"] or sweep["apiErrors"]:
    raise SystemExit("STOP_FROZEN_100_TARGET_INVARIANT")
rows=selection["source_selections"]
if len(rows)!=20 or len({(r["slug"],r["file_title"]) for r in rows})!=20:
    raise SystemExit("STOP_REVIEW_BATCH_BOUND_DUPLICATE")
if len({r["slug"] for r in rows})!=19 or not all(r["selected"] is False for r in rows):
    raise SystemExit("STOP_REVIEW_BATCH_19_MARKETS_OR_SELECTION")
prior={"swiss-cottage-market","upper-gardner-street-market","shrewsbury-market-hall","grainger-market","st-albans-market","swansea-market","leicester-market","treacle-market","coventry-market","wednesfield-market","castleford-market","earlham-street-market","preston-outdoor-market","crystal-palace-food-market","grassmarket-market","barnstaple-pannier-market","chesterfield-outdoor-market","beverley-saturday-market","bury-market"}
if any(r["slug"] in prior or r["slug"]=="darlington-outdoor-market" for r in rows):
    raise SystemExit("STOP_PRIOR_BATCH_OR_HARD_STOP")
data={d["slug"]:d for d in sweep["decisions"]}
result=[]
for row in rows:
    d=data[row["slug"]]
    matched=[c for c in d["candidates"] if c["title"]==row["file_title"]]
    if len(matched)!=1:
        raise SystemExit("STOP_NO_EXACT_PRIOR_TITLE")
    c=matched[0]
    if not (c.get("sizeOK") and c.get("rightsCandidate")):
        raise SystemExit("STOP_PRIOR_RIGHTS_OR_SIZE_NOT_QUALIFIED")
    if not (c["width"]>=960 and c["height"]>=540 and len(c["sha1"])==40):
        raise SystemExit("STOP_SOURCE_METADATA_INCOMPLETE")
    parsed=urlsplit(c["filePage"])
    if parsed.scheme!="https" or parsed.netloc!="commons.wikimedia.org":
        raise SystemExit("STOP_INVALID_PRIMARY_SOURCE_URL")
    licurl=urlsplit(c["licenseUrl"])
    if licurl.hostname!="creativecommons.org":
        raise SystemExit("STOP_LICENSE_DEED_ORIGIN")
    if not d["previousClass"]:
        raise SystemExit("STOP_MISSING_PRIOR_HOLD")
    result.append({"slug":row["slug"],"file_title":row["file_title"],
        "expected_sha1":c["sha1"],"expected_width":c["width"],"expected_height":c["height"],
        "license":c["licenseName"],"license_url":c["licenseUrl"],
        "prior_hold":d["previousClass"],"review_tier":"BATCH02_UNSELECTED_VENUE_VISUAL_PRECHECK",
        "source_page":c["filePage"],"research_note":row["risk"]})
input_data={"kind":"MARKETDIRECTORY_UNSELECTED_PUBLIC_COMMONS_THUMBNAIL_VISUAL_PREFLIGHT",
    "source_commit":"100-market immutable source artifact 13066870435 sha256:"+selection["original_sweep_receipt_sha256"],
    "source_run":selection["original_sweep_action_run"],"all_unselected":True,
    "retain_holds":True,"entries":result}
(ROOT/"INPUT_REVIEW_ONLY.json").write_text(json.dumps(input_data,indent=2)+"\n")
print("BATCH02_PINNED_SOURCE_INPUT_PASS",len(result),len({x["slug"] for x in result}))
