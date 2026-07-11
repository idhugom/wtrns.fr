import json, urllib.request, urllib.parse, re, time, sys

BASE = "https://wtrns.fr/wp-json/wp/v2"

def get(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent":"wtrns-migrator/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r), dict(r.headers)
        except Exception as e:
            if attempt==4: raise
            time.sleep(2*(attempt+1))

def strip(html):
    txt = re.sub(r'<[^>]+>',' ', html or '')
    txt = re.sub(r'&nbsp;',' ',txt); txt=re.sub(r'&rsquo;',"'",txt)
    txt = re.sub(r'&amp;','&',txt); txt=re.sub(r'&[a-z]+;',' ',txt)
    return re.sub(r'\s+',' ',txt).strip()

# 1. Fetch all posts (paginated)
posts=[]
page=1
while True:
    url=f"{BASE}/posts?per_page=100&page={page}&_fields=id,slug,title,content,excerpt,featured_media,date,modified"
    try:
        data,_=get(url)
    except Exception as e:
        print("stop at page",page,e); break
    if not data: break
    posts.extend(data)
    print(f"page {page}: {len(data)} posts (total {len(posts)})", file=sys.stderr)
    if len(data)<100: break
    page+=1

print(f"TOTAL POSTS: {len(posts)}", file=sys.stderr)

# 2. Resolve featured media
media_ids = sorted({p['featured_media'] for p in posts if p.get('featured_media')})
media_map={}
# fetch media in chunks via include
for i in range(0,len(media_ids),100):
    chunk=media_ids[i:i+100]
    inc=",".join(str(x) for x in chunk)
    url=f"{BASE}/media?include={inc}&per_page=100&_fields=id,source_url,alt_text,media_details"
    try:
        data,_=get(url)
        for m in data:
            media_map[m['id']]={"url":m.get('source_url'),"alt":m.get('alt_text','')}
    except Exception as e:
        print("media chunk fail",i,e,file=sys.stderr)
    print(f"media resolved {len(media_map)}/{len(media_ids)}",file=sys.stderr)

# 3. Build clean records
out=[]
for p in posts:
    fm=p.get('featured_media')
    img=media_map.get(fm,{}) if fm else {}
    out.append({
        "id":p['id'],
        "slug":p['slug'],
        "title":strip(p['title']['rendered']),
        "date":p.get('date'),
        "modified":p.get('modified'),
        "excerpt":strip(p.get('excerpt',{}).get('rendered',''))[:300],
        "image":img.get('url'),
        "image_alt":img.get('alt') or strip(p['title']['rendered']),
        "orig_context":strip(p.get('content',{}).get('rendered',''))[:1600]
    })

json.dump(out, open('data/posts.json','w'), ensure_ascii=False, indent=1)
with_img=sum(1 for x in out if x['image'])
print(f"WROTE data/posts.json: {len(out)} posts, {with_img} with featured image",file=sys.stderr)
