"""Robust topic classifier. Normalizes accents then matches accent-free
patterns with word boundaries — consistent between Python (site data) and
JS (site runtime), and free of substring collisions like 'four' in 'fournis'."""
import re, unicodedata

def norm(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.lower()

# (key, label, color, accent-free regex with \b boundaries)
TOPICS = [
 ('assurance', 'Assurance & Finance', 'violet',
   r'\bassur|\bmutuelle|\bcredit|\bemprunt|\bbanqu|\bbancaire|\bepargne|\bimpot|\bfiscal|\bretraite|\bprevoyance|\bjuridique|\bjuriste|\bavocat|\bnotaire|bourquin|lemoine|hamon|\bresiliation|\bplacement|\bpatrimoine|\bprets?\b|\bfinanc|\bcotisation|\bsinistre|\bassureur'),
 ('cuisine', 'Cuisine & Recettes', 'orange',
   r'\brecette|\bmagret|\bcanard|\bcuisin|\bculinaire|\bplats?\b|\bdessert|\bgateau|\bsauce|\bpoulet|\bboeuf|\bagneau|\bvins?\b|\bfromage|\bchocolat|\bapero|\baperitif|\bcocktail|\bpatiss|\brepas|\bmarinade|\bmariner|\bfour\b|\bcuisson|\bgastronom|\bconfit|\brecettes'),
 ('moto', 'Moto & Mobilité', 'cyan',
   r'\bmoto|\bscooter|\bcasque|deux-roues|\bpermis|\bvoiture|\bauto\b|\bautomobile|\bvelos?\b|\btrottinette|\bconduite|\bconduire|\bcircuit|road.?trip|\bpneu|\bmobylette|\bcylindr'),
 ('deco', 'Déco & Lifestyle', 'pink',
   r'\bdecor|\bosier|\bliege|\bscandinave|\bmeuble|\bmobilier|\binterieur|\bsalon\b|\bchambre|\bjardin|\bbijou|\bcollier|\bsacs?\b|\bmode\b|\btendance|\bdesign|\bcadeau|\bartisan|\bbois\b|\brangement|\bluminaire|\bpotager|\bplantes?\b|\bcoussin|\brideau|\btapis\b|\bceramique|\bosier'),
 ('impression', 'Impression & Print', 'lime',
   r'\bimprim|\bimpress|\bsticker|\bflyer|\baffiche|carte.*visite|\bpackaging|\betiquette|\bvitrine|\benseigne|\bserigraph|\bbrochure|\bpapeterie|\bkakemono|\bbanderole|\bgravure'),
 ('immobilier', 'Immobilier & Habitat', 'yellow',
   r'\bimmobili|\bsolaire|\bpanneau|\bmaison|\bappartement|\blogement|\btravaux|\brenovation|\bisolation|\bchauffage|\btoiture|\btoit\b|\bbailleur|\blocataire|\bdpe\b|location.*(saison|meubl)|\bparcelle|\bterrain|\bhabitat|\bplomberie|\bphotovolta'),
 ('sante', 'Santé & Bien-être', 'cyan',
   r'\bsante\b|bien-etre|\bmedecin|\bdentaire|\bdentiste|\bosteo|\bsport|\bfitness|\bnutrition|\bsommeil|\bstress|\bbeaute|\bsoins?\b|\bcosmetique|\bmeditation|\bpilates|\byoga|\bmassage|\bcheveux|\bcapillaire|\bmusculation|\bcomplement'),
 ('digital', 'Digital & Business', 'violet',
   r'site.*web|\bseo\b|\breferencement|\bmarketing|\bentreprise|\bbusiness|\bstartup|\blogiciel|\bapplication|\bcrm\b|\becommerce|e-commerce|\bfreelance|auto-entrepreneur|\btelesecretariat|\bteletravail|disque.*dur|\bonduleur|\bdonnees?\b|\bordinateur|\binformatique|\bnumerique|smartphone'),
]

def classify(slug, title):
    hay = norm(slug + ' ' + title)
    for key, label, color, rx in TOPICS:
        if re.search(rx, hay):
            return key, label, color
    return 'divers', 'Le mag', 'lime'

if __name__ == '__main__':
    import json
    posts = json.load(open('data/posts.json'))
    OLD = [
     ('assurance', r'assurance|mutuelle|credit|crédit|pret|prêt|emprunteur|bourquin|lemoine|banque|hamon|resiliation|résiliation|epargne|épargne|placement|impot|impôt|fiscal|retraite|prevoyance|prévoyance|juridique'),
     ('cuisine', r'recette|magret|canard|cuisine|plat|dessert|gateau|gâteau|sauce|poulet|boeuf|bœuf|vin|fromage|chocolat|apero|apéro|cocktail|patisserie|pâtisserie|repas|marinade|four|cuisson|culinaire|gastronom'),
     ('moto', r'moto|scooter|casque|deux-roues|permis|voiture|auto|velo|vélo|trottinette|conduite|location.*(moto|voiture|vehicule|véhicule)|road.?trip|circuit'),
     ('deco', r'deco|déco|osier|liege|liège|scandinave|meuble|interieur|intérieur|salon|chambre|jardin|bijou|collier|sac|mode|tendance|design|cadeau|artisan|bois|rangement|luminaire|potager|plante'),
     ('impression', r'impress|imprim|sticker|flyer|affiche|carte.*visite|packaging|etiquette|étiquette|vitrine|enseigne|serigraphie|sérigraphie|brochure|papeterie|kakemono|banderole'),
     ('immobilier', r'immobili|panneau.*solaire|solaire|maison|appartement|location.*(saison|meuble)|logement|travaux|renovation|rénovation|isolation|chauffage|toiture|bailleur|locataire|dpe|annonce.*immo'),
     ('sante', r'sante|santé|bien-etre|bien-être|medecin|médecin|dentaire|osteo|ostéo|sport|fitness|nutrition|sommeil|stress|beaute|beauté|soin|cosmetique|cosmétique|meditation|méditation|pilates|yoga'),
     ('digital', r'site.*web|seo|referencement|référencement|marketing|entreprise|business|startup|logiciel|application|crm|ecommerce|e-commerce|reseau|réseau|communication|freelance|auto-entrepreneur|disque.*dur|onduleur|donnee|donnée'),
    ]
    def old_topic(p):
        hay=(p['slug']+' '+p['title']).lower()
        for k,rx in OLD:
            if re.search(rx,hay): return k
        return 'divers'
    changed=[]
    for p in posts:
        old=old_topic(p); new=classify(p['slug'],p['title'])[0]
        if old!=new: changed.append((p['slug'],old,new,p['title'][:45]))
    json.dump([c[0] for c in changed], open('data/reclassified.json','w'))
    from collections import Counter
    print(f"changed: {len(changed)} / {len(posts)}")
    print("new distribution:", dict(Counter(classify(p['slug'],p['title'])[0] for p in posts)))
