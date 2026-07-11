import json, sys, os, urllib.request, concurrent.futures, time, re
sys.path.insert(0, 'scripts')
from gen_common import build_body

API_KEY = os.environ['OPENAI_API_KEY']
posts = json.load(open('data/posts.json'))
os.makedirs('data/content', exist_ok=True)

# diverse selection: walk topics round-robin
from importlib import import_module
sys.path.insert(0, 'src/lib')  # not python, skip
# simple topic regex replicate
TOPIC_RE = [
 ('assurance', r'assurance|mutuelle|credit|crédit|pret|prêt|emprunteur|bourquin|lemoine|banque|juridique|epargne|épargne'),
 ('cuisine', r'recette|magret|canard|cuisine|plat|dessert|gateau|gâteau|sauce|poulet|vin|chocolat|apero|apéro'),
 ('moto', r'moto|scooter|casque|permis|voiture|auto|velo|vélo|conduite|location.*(moto|voiture)'),
 ('deco', r'deco|déco|osier|liege|liège|scandinave|meuble|bijou|collier|sac|mode|tendance|design|cadeau|bois'),
 ('impression', r'impress|imprim|sticker|flyer|affiche|carte.*visite|vitrine|enseigne|brochure'),
 ('immobilier', r'immobili|panneau.*solaire|solaire|maison|appartement|logement|travaux|renovation|rénovation'),
 ('sante', r'sante|santé|bien-etre|bien-être|medecin|dentaire|sport|nutrition|beaute|beauté|soin'),
 ('digital', r'site.*web|seo|referencement|référencement|marketing|entreprise|business|ecommerce|e-commerce'),
]
def topic(p):
    hay = (p['slug']+' '+p['title']).lower()
    for k,rx in TOPIC_RE:
        if re.search(rx, hay): return k
    return 'divers'

buckets = {}
for p in posts:
    buckets.setdefault(topic(p), []).append(p)

# round-robin pick ~30, prefer posts WITH image
N = int(os.environ.get('SAMPLE_N','30'))
sel = []
keys = list(buckets.keys())
idx = {k:0 for k in keys}
while len(sel) < N:
    progressed = False
    for k in keys:
        arr = [x for x in buckets[k] if x.get('image')]
        if idx[k] < len(arr):
            sel.append(arr[idx[k]]); idx[k]+=1; progressed=True
            if len(sel)>=N: break
    if not progressed: break

# skip already generated
sel = [p for p in sel if not os.path.exists(f"data/content/{p['slug']}.json")]
print(f"generating {len(sel)} articles synchronously", flush=True)

def gen(p):
    body = build_body(p)
    data = json.dumps(body).encode()
    req = urllib.request.Request('https://api.openai.com/v1/responses', data=data,
        headers={'Authorization':f'Bearer {API_KEY}','Content-Type':'application/json'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
            txt = ''
            for o in d.get('output',[]):
                if o.get('type')=='message':
                    for c in o.get('content',[]): txt += c.get('text','')
            j = json.loads(txt)
            if not j.get('html'): raise ValueError('empty html')
            j['title'] = p['title']; j['slug'] = p['slug']
            json.dump(j, open(f"data/content/{p['slug']}.json",'w'), ensure_ascii=False)
            return (p['slug'], 'ok', len(j['html']))
        except Exception as e:
            if attempt==3: return (p['slug'], f'FAIL {e}', 0)
            time.sleep(3*(attempt+1))

ok=0; fail=0
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
    for slug,status,n in ex.map(gen, sel):
        if status=='ok': ok+=1; print(f"  ✓ {slug} ({n} chars)",flush=True)
        else: fail+=1; print(f"  ✗ {slug}: {status}",flush=True)
print(f"SYNC DONE ok:{ok} fail:{fail}",flush=True)
