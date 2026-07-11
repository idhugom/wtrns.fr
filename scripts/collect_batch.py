"""Collect results from a completed OpenAI batch into data/content/<slug>.json."""
import json, os, sys, urllib.request

API_KEY = os.environ['OPENAI_API_KEY']
BID = json.load(open('data/batch_full.json'))['id']
cidmap = json.load(open('data/batch_cidmap.json'))  # custom_id -> slug
posts = {p['slug']: p for p in json.load(open('data/posts.json'))}
os.makedirs('data/content', exist_ok=True)


def api(path):
    req = urllib.request.Request('https://api.openai.com/v1' + path,
                                 headers={'Authorization': f'Bearer {API_KEY}'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def download_file(fid):
    req = urllib.request.Request(f'https://api.openai.com/v1/files/{fid}/content',
                                 headers={'Authorization': f'Bearer {API_KEY}'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read().decode('utf-8')


def extract_text(body):
    """Extract assistant text from a Responses API result body."""
    txt = ''
    for o in body.get('output', []):
        if o.get('type') == 'message':
            for c in o.get('content', []):
                txt += c.get('text', '')
    return txt


def main():
    b = api(f'/batches/{BID}')
    print('batch status:', b.get('status'), 'counts:', b.get('request_counts'))
    out_id = b.get('output_file_id')
    if not out_id:
        print('no output_file_id yet; status=', b.get('status'))
        # still try error file
        if b.get('error_file_id'):
            print('error_file present')
        return 1
    data = download_file(out_id)
    ok = fail = 0
    for line in data.splitlines():
        if not line.strip():
            continue
        rec = json.loads(line)
        cid = rec.get('custom_id')
        slug = cidmap.get(cid)
        if not slug:
            # fallback: strip trailing __id
            slug = cid.rsplit('__', 1)[0] if cid else None
        resp = rec.get('response') or {}
        body = resp.get('body') or {}
        if resp.get('status_code') != 200:
            fail += 1
            continue
        txt = extract_text(body)
        try:
            j = json.loads(txt)
            if not j.get('html'):
                raise ValueError('empty html')
            p = posts.get(slug, {})
            j['title'] = p.get('title', slug)
            j['slug'] = slug
            json.dump(j, open(f'data/content/{slug}.json', 'w'), ensure_ascii=False)
            ok += 1
        except Exception as e:
            fail += 1
            print('parse fail', slug, str(e)[:80])
    print(f'COLLECT DONE ok:{ok} fail:{fail}')
    # also fetch error file summary
    if b.get('error_file_id'):
        try:
            err = download_file(b['error_file_id'])
            print('error lines:', len(err.splitlines()))
        except Exception:
            pass
    return 0


if __name__ == '__main__':
    sys.exit(main())
