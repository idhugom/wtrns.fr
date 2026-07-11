"""Regenerate featured images for articles whose topic was corrected by the
fixed classifier (their previous image used a wrong topic hint)."""
import os, io, json, time, base64, urllib.request, concurrent.futures, sys
sys.path.insert(0, 'scripts')
from classify import classify
from PIL import Image

API = os.environ['OPENAI_API_KEY']
OUT = 'public/img/posts'

TOPIC_HINT = {
  'assurance': "bureau clair et moderne, documents/contrat, calculatrice, poignée de main professionnelle, maquette de maison ou de voiture, ambiance rassurante",
  'cuisine': "plat dressé avec soin, ingrédients frais, table conviviale, photographie culinaire appétissante",
  'moto': "moto ou scooter sur une route ouverte, équipement (casque, gants), ambiance dynamique, lumière dorée",
  'deco': "intérieur design et chaleureux, objet déco mis en scène, matières naturelles, lumière douce",
  'impression': "atelier d'imprimerie moderne, presse et échantillons imprimés colorés, gros plan sur la matière et l'encre",
  'immobilier': "belle maison ou intérieur rénové, clés, plans, panneaux solaires si pertinent, lumière naturelle",
  'sante': "scène de bien-être et de santé, activité sportive ou soin, ambiance saine, lumineuse et apaisante",
  'digital': "espace de travail moderne, ordinateur et écrans, ambiance tech épurée",
  'divers': "scène concrète, réaliste et pertinente illustrant le sujet",
}

def build_prompt(p):
    hint = TOPIC_HINT.get(classify(p['slug'], p['title'])[0], TOPIC_HINT['divers'])
    return (
        f"Photographie éditoriale ultra-réaliste, haute qualité, illustrant le sujet : « {p['title']} ». "
        f"Contexte visuel : {hint}. "
        f"Style photographie professionnelle, lumière naturelle, faible profondeur de champ, cadrage paysage, couleurs naturelles et crédibles. "
        f"IMPORTANT : aucune écriture, aucun texte, aucune lettre, aucun chiffre, aucun logo, aucun filigrane, aucun visage reconnaissable."
    )

def generate(p):
    dest = os.path.join(OUT, f"{p['slug']}.jpg")
    body = {"model": "gpt-image-2", "prompt": build_prompt(p), "size": "1536x1024", "quality": "medium"}
    data = json.dumps(body).encode()
    for attempt in range(5):
        try:
            req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=data,
                headers={'Authorization': f'Bearer {API}', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=240) as r:
                d = json.load(r)
            raw = base64.b64decode(d['data'][0]['b64_json'])
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            w, h = im.size
            if w > 1280:
                im = im.resize((1280, round(h * 1280 / w)), Image.LANCZOS)
            im.save(dest, 'JPEG', quality=82, optimize=True, progressive=True)
            return ('ok', p['slug'])
        except urllib.error.HTTPError as e:
            if attempt == 4:
                return ('fail', f"{p['slug']} HTTP{e.code}")
            time.sleep(5 * (attempt + 1))
        except Exception as e:
            if attempt == 4:
                return ('fail', f"{p['slug']} {str(e)[:50]}")
            time.sleep(4 * (attempt + 1))

def main():
    slugs = set(json.load(open('data/reclassified.json')))
    posts = [p for p in json.load(open('data/posts.json')) if p['slug'] in slugs]
    print(f"regenerating {len(posts)} reclassified images", flush=True)
    ok = fail = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        for status, info in ex.map(generate, posts):
            if status == 'ok': ok += 1
            else: fail += 1; print('  fail', info, flush=True)
            if (ok + fail) % 20 == 0: print(f"  {ok+fail}/{len(posts)}", flush=True)
    print(f"REGEN DONE ok:{ok} fail:{fail}", flush=True)

if __name__ == '__main__':
    main()
