import json, sys, os, urllib.request, time
sys.path.insert(0, 'scripts')
from gen_common import build_body

posts = json.load(open('data/posts.json'))
# build JSONL for ALL posts
lines = []
for p in posts:
    lines.append({
        "custom_id": p['slug'][:60] + "__" + str(p['id']),
        "method": "POST",
        "url": "/v1/responses",
        "body": build_body(p),
    })
with open('data/batch_input.jsonl','w') as f:
    for l in lines:
        f.write(json.dumps(l, ensure_ascii=False) + "\n")
print(f"JSONL lines: {len(lines)}")

# map custom_id -> slug for later
cidmap = {l['custom_id']: p['slug'] for l, p in zip(lines, posts)}
json.dump(cidmap, open('data/batch_cidmap.json','w'), ensure_ascii=False)
print("cidmap written")
