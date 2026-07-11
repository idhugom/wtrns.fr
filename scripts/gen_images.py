"""Generate ultra-realistic featured images with gpt-image-2 for posts that
have no local image yet. Processes in batches; after each batch it rebuilds
and pushes so progress is deployed incrementally and survives session end."""
import os, io, json, time, base64, urllib.request, subprocess, concurrent.futures, sys
from PIL import Image

API = os.environ['OPENAI_API_KEY']
OUT = 'public/img/posts'
os.makedirs(OUT, exist_ok=True)

MODEL = 'gpt-image-2'
SIZE = '1536x1024'
QUALITY = 'medium'
CONC = int(os.environ.get('CONC', '5'))
BATCH = int(os.environ.get('BATCH', '120'))

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

# replicate topic detection from the site lib (lightweight)
import re
TOPIC_RE = [
 ('assurance', r'assurance|mutuelle|credit|crédit|pret|prêt|emprunteur|bourquin|lemoine|banque|hamon|resiliation|résiliation|epargne|épargne|placement|impot|impôt|fiscal|retraite|prevoyance|prévoyance|juridique'),
 ('cuisine', r'recette|magret|canard|cuisine|plat|dessert|gateau|gâteau|sauce|poulet|boeuf|bœuf|vin|fromage|chocolat|apero|apéro|cocktail|patisserie|pâtisserie|repas|marinade|four|cuisson|culinaire|gastronom'),
 ('moto', r'moto|scooter|casque|deux-roues|permis|voiture|auto|velo|vélo|trottinette|conduite|location.*(moto|voiture|vehicule|véhicule)|road.?trip|circuit'),
 ('deco', r'deco|déco|osier|liege|liège|scandinave|meuble|interieur|intérieur|salon|chambre|jardin|bijou|collier|sac|mode|tendance|design|cadeau|artisan|bois|rangement|luminaire|potager|plante'),
 ('impression', r'impress|imprim|sticker|flyer|affiche|carte.*visite|packaging|etiquette|étiquette|vitrine|enseigne|serigraphie|sérigraphie|brochure|papeterie|kakemono|banderole'),
 ('immobilier', r'immobili|panneau.*solaire|solaire|maison|appartement|location.*(saison|meuble)|logement|travaux|renovation|rénovation|isolation|chauffage|toiture|bailleur|locataire|dpe|annonce.*immo'),
 ('sante', r'sante|santé|bien-etre|bien-être|medecin|médecin|dentaire|osteo|ostéo|sport|fitness|nutrition|sommeil|stress|beaute|beauté|soin|cosmetique|cosmétique|meditation|méditation|pilates|yoga'),
 ('digital', r'site.*web|seo|referencement|référencement|marketing|entreprise|business|startup|logiciel|application|crm|ecommerce|e-commerce|reseau|réseau|communication|freelance|auto-entrepreneur|disque.*dur|onduleur|donnee|donnée'),
]
def topic_of(p):
    hay = (p['slug'] + ' ' + p['title']).lower()
    for k, rx in TOPIC_RE:
        if re.search(rx, hay): return k
    return 'divers'

def build_prompt(p):
    hint = TOPIC_HINT.get(topic_of(p), TOPIC_HINT['divers'])
    return (
        f"Photographie éditoriale ultra-réaliste, haute qualité, illustrant le sujet : « {p['title']} ». "
        f"Contexte visuel : {hint}. "
        f"Style photographie professionnelle, lumière naturelle, faible profondeur de champ, cadrage paysage, couleurs naturelles et crédibles. "
        f"IMPORTANT : aucune écriture, aucun texte, aucune lettre, aucun chiffre, aucun logo, aucun filigrane, aucun visage reconnaissable."
    )

def generate(p):
    dest = os.path.join(OUT, f"{p['slug']}.jpg")
    if os.path.exists(dest):
        return ('skip', p['slug'])
    body = {"model": MODEL, "prompt": build_prompt(p), "size": SIZE, "quality": QUALITY}
    data = json.dumps(body).encode()
    for attempt in range(5):
        try:
            req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=data,
                headers={'Authorization': f'Bearer {API}', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=240) as r:
                d = json.load(r)
            b64 = d['data'][0]['b64_json']
            raw = base64.b64decode(b64)
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            # resize to max width 1280 keeping ratio
            w, h = im.size
            if w > 1280:
                im = im.resize((1280, round(h * 1280 / w)), Image.LANCZOS)
            im.save(dest, 'JPEG', quality=82, optimize=True, progressive=True)
            return ('ok', p['slug'])
        except urllib.error.HTTPError as e:
            code = e.code
            wait = 5 * (attempt + 1) if code in (429, 500, 503) else 3 * (attempt + 1)
            if attempt == 4:
                return ('fail', f"{p['slug']} HTTP{code}")
            time.sleep(wait)
        except Exception as e:
            if attempt == 4:
                return ('fail', f"{p['slug']} {str(e)[:60]}")
            time.sleep(4 * (attempt + 1))

def manifest():
    posts = json.load(open('data/posts.json'))
    have = [p['slug'] for p in posts if os.path.exists(os.path.join(OUT, f"{p['slug']}.jpg"))]
    json.dump(have, open('data/img_manifest.json', 'w'))
    return len(have)

def checkpoint(tag):
    n = manifest()
    try:
        subprocess.run(['npm', 'run', 'build'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['git', 'add', 'public/img', 'data/img_manifest.json'], check=True)
        subprocess.run(['git', 'commit', '-m',
            f"content: images IA gpt-image-2 ({n} images) — {tag}\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"],
            check=False)
        for i in range(4):
            r = subprocess.run(['git', 'push', 'origin', 'main'])
            if r.returncode == 0: break
            time.sleep(2 ** (i + 1))
        print(f"CHECKPOINT {tag}: {n} images live", flush=True)
    except Exception as e:
        print('checkpoint error', e, flush=True)

def main():
    posts = json.load(open('data/posts.json'))
    have = set(json.load(open('data/img_manifest.json')))
    todo = [p for p in posts if p['slug'] not in have]
    print(f"to generate: {len(todo)} images (conc={CONC}, batch={BATCH})", flush=True)
    ok = fail = 0
    for bi in range(0, len(todo), BATCH):
        chunk = todo[bi:bi + BATCH]
        with concurrent.futures.ThreadPoolExecutor(max_workers=CONC) as ex:
            for status, info in ex.map(generate, chunk):
                if status == 'ok': ok += 1
                elif status == 'fail': fail += 1; print('  fail', info, flush=True)
        print(f"batch {bi//BATCH+1}: cumulative ok:{ok} fail:{fail}", flush=True)
        checkpoint(f"lot-{bi//BATCH+1}")
    print(f"GEN IMAGES DONE ok:{ok} fail:{fail} total_have:{manifest()}", flush=True)

if __name__ == '__main__':
    main()
