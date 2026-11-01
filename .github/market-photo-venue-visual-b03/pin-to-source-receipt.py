#!/usr/bin/env python3
"""Pin exact 11 sources to the unmodified 62-market receipt; no pixel download here."""
import hashlib
import json
from pathlib import Path
root=Path('.github/market-photo-venue-visual-b03')
config=json.loads((root/'SELECTED_SOURCE_TITLES.json').read_text())
raw=Path('venue-discovery-original/market-photo-batch03-discovery.json').read_bytes()
if hashlib.sha256(raw).hexdigest()!=config['priorSourceReceiptSha256']:
    raise SystemExit('STOP_SOURCE_RECEIPT_DIGEST')
report=json.loads(raw)
if report['kind']!='MARKETDIRECTORY_VENUE_AWARE_COMMONS_SOURCE_SWEEP_UNSELECTED' or report['targetsAttempted']!=62 or report['errors'] or report['cutoff']:
    raise SystemExit('STOP_PRIOR_DISCOVERY_INVARIANT')
entries=config['entries']
if config['kind']!='MARKETDIRECTORY_BATCH03_VENUE_SOURCE_VISUAL_REVIEW_ONLY' or not config['allUnselected'] or not config['holdRetained'] or len(entries)!=11 or len({e['slug'] for e in entries})!=9 or any(e['selected'] for e in entries):
    raise SystemExit('STOP_INPUT_SELECTION_OR_SCOPE')
index={d['slug']:d for d in report['decisions']}
pinned=[]
for req in entries:
    row=index.get(req['slug'])
    if not row:
        raise SystemExit('STOP_MARKET_NOT_IN_RECEIPT')
    matches=[c for c in row['topCandidates'] if c['title']==req['file_title']]
    if len(matches)!=1 or not matches[0]['metadataEligible']:
        raise SystemExit('STOP_NOT_ORIGINAL_METADATA_QUALIFIED_'+req['slug'])
    c=matches[0]
    if c['originalWidth']<960 or c['originalHeight']<540 or len(c.get('originalSha1') or '')!=40 or c.get('licenseName','').upper().startswith('PUBLIC DOMAIN'):
        raise SystemExit('STOP_SOURCE_LICENSE_OR_SIZE_'+req['slug'])
    pinned.append({'slug':req['slug'],'file_title':c['title'],
      'expected_sha1':c['originalSha1'],'expected_width':c['originalWidth'],
      'expected_height':c['originalHeight'],'license':c['licenseName'],
      'license_url':c['licenseURL'],'prior_hold':row['priorHold'],
      'review_tier':'TARGETED_SOURCE_VISUAL_REVIEW_ONLY',
      'source_page':c['sourcePage']})
inp={'kind':'MARKETDIRECTORY_UNSELECTED_PUBLIC_COMMONS_THUMBNAIL_VISUAL_PREFLIGHT',
  'source_commit':'62-market receipt sha256 '+config['priorSourceReceiptSha256'],
  'source_run':config['priorSourceRun'],'all_unselected':True,'retain_holds':True,
  'entries':pinned}
dst=Path('.github/market-photo-visual-preflight/INPUT_REVIEW_ONLY.json')
dst.write_text(json.dumps(inp,indent=2)+'\n')
(root/'SOURCE_INPUT_RECEIPT.json').write_text(json.dumps(inp,indent=2)+'\n')
print('BATCH03_EXACT_11_INPUT_VERIFIED',len(pinned))
