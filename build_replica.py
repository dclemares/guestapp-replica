#!/usr/bin/env python3
# Builds the static, click-through replica from the captured DOM snapshots.
import os, re, json, glob, shutil, hashlib, subprocess, urllib.request, urllib.parse, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import changes, changes_ui
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'snaps')
SITE = os.path.join(HERE, 'site')
HOST = 'https://guestapp-v2.stg.chekin.com'

shutil.rmtree(SITE, ignore_errors=True)
for d in ('assets/fonts/Poppins', 'assets/img', 'screens', 'thumbs'):
    os.makedirs(os.path.join(SITE, d), exist_ok=True)

def fetch(url, dest):
    if os.path.exists(dest): return True
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r, open(dest, 'wb') as f: f.write(r.read())
        return True
    except Exception as e:
        print('  ! fetch failed', url[:90], e); return False

screens = {}   # id -> {'m': path, 'd': path}
for v in ('m', 'd'):
    for p in sorted(glob.glob(os.path.join(SRC, v, '*.html'))):
        sid = os.path.basename(p)[:-5]
        if sid.startswith('_'): continue
        screens.setdefault(sid, {})[v] = p
for _n in ('home-sheet-ages','home-sheet-fixed','home-sheet-ages-fixed'): screens[_n] = dict(screens['home-sheet'])
for _n in ('iv-intro-f', 'iv-intro-h'): screens[_n] = dict(screens['iv-1-intro'])   # intro de la verificación de identidad: con IV activa va antes del Step 1
for _n in ('g2-registered', 'g2-registering', 'g2-register-failed'): screens[_n] = {'m': screens['hub-after-1']['m'], 'd': screens['hub-after-1']['d']}
for _n in ('g2-iv', 'g2-ivh', 'g2-ivf'): screens[_n] = {'m': screens['hub-after-1']['m'], 'd': screens['hub-after-1']['d']}   # verificación de identidad: móvil y escritorio (iv.js)   # página "huésped registrado" (solo móvil): parte del resumen y la sustituye registered.js
print(len(screens), 'screens')

# ---------- css ----------
css_urls = set()

def es_money(h):
    """Importes en formato es-ES (coma decimal, punto de millares, símbolo detrás): «€1,500.00» → «1.500,00€», «230.00€» → «230,00€», «€12» → «12€»"""
    th = lambda x: x.replace(',', '.')
    h = re.sub(r'€(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(?!\d)', lambda m: th(m.group(1)) + ',' + m.group(2) + '€', h)
    h = re.sub(r'(?<![\d.,])(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})€', lambda m: th(m.group(1)) + ',' + m.group(2) + '€', h)
    h = re.sub(r'€(\d{1,3}(?:,\d{3})+|\d+)(?![\d.,\w])', lambda m: th(m.group(1)) + '€', h)
    return h

for sid, vs in screens.items():
    for p in vs.values():
        h = open(p, encoding='utf-8').read()
        for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"', h): css_urls.add(m.group(1))
css_local = {}
for u in sorted(css_urls):
    full = u if u.startswith('http') else HOST + u
    name = os.path.basename(urllib.parse.urlparse(full).path)
    dest = os.path.join(SITE, 'assets', name)
    if fetch(full, dest): css_local[u] = name
fonts = set()
for name in set(css_local.values()):
    p = os.path.join(SITE, 'assets', name); t = open(p, encoding='utf-8').read()
    for m in re.finditer(r'url\((/assets/fonts/[^)]+)\)', t): fonts.add(m.group(1).strip('"\''))
    t = re.sub(r'url\(/assets/fonts/', 'url(fonts/', t)
    open(p, 'w', encoding='utf-8').write(t)
for f in sorted(fonts):
    fetch(HOST + f, os.path.join(SITE, 'assets', f.replace('/assets/', '')))
print('css', len(css_local), 'fonts', len(fonts))

# ---------- images ----------
img_map = {}
def local_img(url):
    if url in img_map: return img_map[url]
    full = url if url.startswith('http') else HOST + url
    ext = os.path.splitext(urllib.parse.urlparse(full).path)[1] or '.jpg'
    name = hashlib.md5(full.encode()).hexdigest()[:12] + ext
    ok = fetch(full, os.path.join(SITE, 'assets', 'img', name))
    img_map[url] = ('assets/img/' + name) if ok else None
    return img_map[url]

# ---------- screens ----------
trans = {}
for v in ('m', 'd'):
    for tp in glob.glob(os.path.join(SRC, v, '_trans_*.json')):
        for t in json.load(open(tp)):
            if not t.get('from') or not t.get('to') or not t.get('text'): continue
            trans.setdefault(t['from'], [])
            if not any(x['text'] == t['text'] and x['to'] == t['to'] for x in trans[t['from']]):
                trans[t['from']].append({'text': t['text'], 'index': t.get('index'), 'to': t['to']})

MANUAL = {
 'home-sheet': [('Confirm','home')],
 'home-sheet-ages': [('Confirm','home')],
 'home-sheet-fixed': [('Confirm','home')],
 'home-sheet-ages-fixed': [('Confirm','home')],
 'home': [('Guest details','hub-after-1'),('Payments','cart'),('See all','offers-all'),('Menu','menu'),('Registration','hub-after-1'),('Stay','nav-stay'),('Discover','offers-all')],
 'home-scrolled': [('Guest details','hub-after-1'),('Payments','cart'),('See all','offers-all')],
 'home-after-1': [('Guest details','hub-after-1'),('Payments','cart'),('See all','offers-all'),('Menu','menu')],
 'menu': [('Home','home'),('Registration','hub-after-1'),('Payments','cart'),('Recommendations','offers-all'),('Language','language'),('FAQs','faqs')],
 'hub-after-1': [('Add guest','g2-form-empty'),('Verify ID','iv-1-intro'),('Finish verification','iv-1-intro'),('Change guest count','home-sheet')],
 'g2-form-empty': [('Scan document to autofill','scan-1-country'),('Submit','form-errors-sheet')],
 'g2-form-filled': [('Submit','g2-submit-c')],
 'g2-submit-a': [('Back to guest list','hub-after-1'),("Verify Test's ID",'iv-1-intro')],
 'g2-submit-b': [('Back to guest list','hub-after-1'),("Verify Test's ID",'iv-1-intro')],
 'g2-submit-c': [('Back to guest list','hub-after-1'),("Verify Test's ID",'iv-1-intro')],
 'form-empty': [('Scan document to autofill','scan-1-country'),('Submit','form-errors-sheet')],
 'form-errors-sheet': [('OK','form-errors-inline')],
 'form-filled-mid': [('Submit','submit-1')],
 'form-filled-bottom': [('Submit','submit-1')],
 'scan-3-ready': [('Start scanning','scan-4-camera')],
 'scan-4-camera': [('Scan your document','scan-5-result')],
 'iv-1-intro': [('Begin verification','iv-2-doc-empty')],
 'iv-intro-f': [('Begin verification','g2-ivf'),('Skip for now','g2-form-empty')],
 'iv-intro-h': [('Begin verification','g2-ivh'),('Skip for now','hub-after-1')],
 'iv-2-doc-empty': [('Country of nationality','iv-3-nationality-open'),('Continue','iv-4-doc-types')],
 'iv-4-doc-types': [('Continue','iv-5-front-instructions')],
 'iv-5-front-instructions': [('Take a photo','iv-6-scanning')],
 'pay-0-sheet': [('Show me the two options','pay-1-protection')],
 'pay-1-protection': [("What's covered",'pay-1c-covered-sheet'),('Security Deposit','pay-1e-deposit-selected')],
 'pay-1e-deposit-selected': [('Confirm and continue','cart')],
 'cart': [('Add exemptions','cart-exemptions'),('Pay 15,75€','pay-card-sheet'),('Order history','order-history'),('How authorisations work','cart-how-auth')],
 'cart-exemptions': [('Confirm and go back to Payment','cart'),('Back to payment','cart')],
 'offers-all': [],
}
for _sid in list(screens):
    if _sid.startswith('home-sheet'): MANUAL.setdefault(_sid, [('Confirm','home')])
for k, lst in MANUAL.items():
    trans.setdefault(k, [])
    for text, to in lst:
        if not any(x['text'] == text for x in trans[k]): trans[k].append({'text': text, 'index': None, 'to': to})
json.dump(trans, open(os.path.join(SITE, 'nav.json'), 'w'))

def rewrite(h, depth='../'):
    h = re.sub(r'<link[^>]+rel="(?:manifest|apple-touch-icon|icon|modulepreload|preload)"[^>]*>', '', h)
    def css(m):
        u = m.group(1); n = css_local.get(u)
        return '<link rel="stylesheet" href="%sassets/%s">' % (depth, n) if n else ''
    h = re.sub(r'<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css, h)
    def img(m):
        u = m.group(2)
        if u.startswith('data:') or u.startswith('blob:'): return m.group(0)
        l = local_img(u)
        return '%s="%s%s"' % (m.group(1), depth, l) if l else m.group(0)
    h = re.sub(r'\b(src)="([^"]+\.(?:webp|png|jpe?g|svg|gif)(?:\?[^"]*)?)"', img, h)
    def bg(m):
        u = m.group(1).strip('"\'')
        if u.startswith('data:') or u.startswith('blob:') or u.startswith('#'): return m.group(0)
        l = local_img(u)
        return 'url(%s%s)' % (depth, l) if l else m.group(0)
    h = re.sub(r'url\(([^)]+)\)', lambda m: bg(m) if re.search(r'\.(webp|png|jpe?g|svg|gif)', m.group(1)) else m.group(0), h)
    h = re.sub(r'<iframe[^>]*(?:stripe|__privateStripe)[^>]*>\s*</iframe>', '', h)
    h = re.sub(r'pk_(?:test|live)_[A-Za-z0-9]+', 'pk_REDACTED', h)
    h = h.replace('<meta name="google" content="notranslate">', '<meta name="google" content="notranslate"><meta name="robots" content="noindex">')
    return h

VT_HEAD = ('<style id="rep-vt">'
    # ESCRITORIO (≥ 1025 px): exactamente la transición que funcionaba bien: la vieja se desvanece (0,12 s) y la nueva entra (0,2 s); barra lateral y panel fijos
    '@media (min-width:1025px){@view-transition{navigation:auto}}'
    '@keyframes vtOut{to{opacity:0}}@keyframes vtIn{from{opacity:0}}'
    '::view-transition-old(root){animation:vtOut .12s ease both;mix-blend-mode:normal}::view-transition-new(root){animation:vtIn .2s ease .12s both;mix-blend-mode:normal}'
    '.page-wrapper>div:first-child{view-transition-name:vt-side}aside{view-transition-name:vt-rail}'
    '::view-transition-group(vt-side){animation:none}::view-transition-old(vt-side),::view-transition-new(vt-side){animation:none}'
    # MÓVIL y tableta: corte limpio, sin capas con nombre ni fundido: la vieja se queda hasta que la nueva está pintada
    '@media (max-width:1024px){@view-transition{navigation:auto}.page-wrapper>div:first-child,aside{view-transition-name:none}'
    '::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}'
    '@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}</style>')
for sid, vs in screens.items():
    for v, p in vs.items():
        h = open(p, encoding='utf-8').read()
        h = rewrite(h)
        h = h.replace('asasasa%2C+Albacete', 'Villa+Calipso%2C+Albacete').replace('asasasa', 'Villa Calipso')   # nombre de la propiedad
        h = re.sub(r'(?<![A-Za-z])sasas(?![A-Za-z])', 'Villa Calipso', h)
        h = h.replace('</head>', VT_HEAD + '</head>', 1)   # navegación fluida: fundido entre pantallas, barra lateral y panel fijos
        h = h.replace('</body>', '<script>window.__SCREEN=%s;</script><script src="../assets/panel.js"></script><script src="../replica.js"></script><i id="rep-end" hidden></i></body>' % json.dumps({'id': sid, 'v': v, 'has': sorted(vs.keys())}))
        h = h.replace('guests verified &amp; registered', 'guests registered')   # Guest details: sin "verified &"
        if sid == 'cart-exemptions': h = h.replace('>Edit Tourist taxes</span>', '>Tourist taxes</span>')   # cabecera móvil de Tasas: solo «Tourist taxes»
        h = changes.home_center(h, v)
        h = changes.hero_access(h)
        h = changes.checkin_variants(h)
        if sid == 'hub-after-1': h = changes.hub_style(h, v)
        h = changes.form_assets(h)
        if sid in ('g2-registered', 'g2-registering', 'g2-register-failed'): h = changes.registered_assets(h)
        if sid in ('g2-iv', 'g2-ivh', 'g2-ivf'): h = changes.iv_assets(h)
        if sid in ('iv-intro-f', 'iv-intro-h'): h = changes.ivintro_assets(h)
        if v == 'd': h = changes.home_rail(h)
        # vista Pagos: cuatro propuestas (pay-views.css / pay-views.js). Los controles salen en todas las pantallas; el rediseño, solo en «cart»
        h = h.replace('</head>', '<link rel="stylesheet" href="../assets/pay-views.css"><link rel="stylesheet" href="../assets/taxes.css"><link rel="stylesheet" href="../assets/deposit.css"><link rel="stylesheet" href="../assets/checkout.css"><link rel="stylesheet" href="../assets/own.css"></head>', 1)
        h = h.replace('<script src="../replica.js">', '<script src="../assets/pay-views.js"></script><script src="../assets/taxes.js"></script><script src="../assets/deposit.js"></script><script src="../assets/checkout.js"></script><script src="../assets/own.js"></script><script src="../assets/titles.js"></script><script src="../replica.js">', 1)
        if sid.startswith('home-sheet'):
            # UI B (people pictograms) is the chosen design for the guest-count step
            h = changes_ui.guest_count_ui(h, 'ages' if '-ages' in sid else 'total', not sid.endswith('-fixed'), 'b')
        h = es_money(h)   # importes en es-ES (también los que inyectan changes*.py)
        open(os.path.join(SITE, 'screens', '%s.%s.html' % (sid, v)), 'w', encoding='utf-8').write(h)
        # thumbnail
        png = p[:-5] + '.png'
        if os.path.exists(png) and not sid.startswith('home-sheet'):
            out = os.path.join(SITE, 'thumbs', '%s.%s.jpg' % (sid, v))
            subprocess.run(['sips', '-Z', '520', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60', png, '--out', out], capture_output=True)
print('images', len([v for v in img_map.values() if v]))
shutil.copy(os.path.join(HERE, 'replica.js'), os.path.join(SITE, 'replica.js'))
shutil.copy(os.path.join(HERE, 'panel.js'), os.path.join(SITE, 'assets', 'panel.js'))
shutil.copy(os.path.join(HERE, 'phone.html'), os.path.join(SITE, 'phone.html'))
shutil.copy(os.path.join(HERE, 'split.html'), os.path.join(SITE, 'split.html'))
shutil.copy(os.path.join(HERE, 'compare.html'), os.path.join(SITE, 'compare.html'))
os.makedirs(os.path.join(SITE, 'assets', 'vela'), exist_ok=True)
shutil.copytree(os.path.join(HERE, 'vendor', 'vela', 'deals'), os.path.join(SITE, 'assets', 'vela', 'deals'), dirs_exist_ok=True)
shutil.copy(os.path.join(HERE, 'vendor', 'vela', 'chekin-vela.js'), os.path.join(SITE, 'assets', 'vela', 'chekin-vela.js'))
shutil.copy(os.path.join(HERE, 'vela-rail.css'), os.path.join(SITE, 'assets', 'vela-rail.css'))
shutil.copy(os.path.join(HERE, 'rail-variants.css'), os.path.join(SITE, 'assets', 'rail-variants.css'))
shutil.copy(os.path.join(HERE, 'offers-mobile.css'), os.path.join(SITE, 'assets', 'offers-mobile.css'))
shutil.copy(os.path.join(HERE, 'rail-combo.css'), os.path.join(SITE, 'assets', 'rail-combo.css'))
shutil.copy(os.path.join(HERE, 'rail.js'), os.path.join(SITE, 'assets', 'rail.js'))
shutil.copy(os.path.join(HERE, 'guestcount.js'), os.path.join(SITE, 'guestcount.js'))
shutil.copy(os.path.join(HERE, 'changes.css'), os.path.join(SITE, 'assets', 'changes.css'))
shutil.copy(os.path.join(HERE, 'checkin.css'), os.path.join(SITE, 'assets', 'checkin.css'))
shutil.copy(os.path.join(HERE, 'checkin.js'), os.path.join(SITE, 'assets', 'checkin.js'))
shutil.copy(os.path.join(HERE, 'access.css'), os.path.join(SITE, 'assets', 'access.css'))
shutil.copy(os.path.join(HERE, 'access.js'), os.path.join(SITE, 'assets', 'access.js'))
shutil.copy(os.path.join(HERE, 'hub.css'), os.path.join(SITE, 'assets', 'hub.css'))
shutil.copy(os.path.join(HERE, 'logo-check.jpg'), os.path.join(SITE, 'assets', 'logo-check.jpg'))
shutil.copy(os.path.join(HERE, 'form.css'), os.path.join(SITE, 'assets', 'form.css'))
shutil.copy(os.path.join(HERE, 'form.js'), os.path.join(SITE, 'assets', 'form.js'))
shutil.copy(os.path.join(HERE, 'registered.css'), os.path.join(SITE, 'assets', 'registered.css'))
shutil.copy(os.path.join(HERE, 'registered.js'), os.path.join(SITE, 'assets', 'registered.js'))
shutil.copy(os.path.join(HERE, 'iv.css'), os.path.join(SITE, 'assets', 'iv.css'))
shutil.copy(os.path.join(HERE, 'iv.js'), os.path.join(SITE, 'assets', 'iv.js'))
shutil.copy(os.path.join(HERE, 'ivintro.css'), os.path.join(SITE, 'assets', 'ivintro.css'))
shutil.copy(os.path.join(HERE, 'ivintro.js'), os.path.join(SITE, 'assets', 'ivintro.js'))
shutil.copy(os.path.join(HERE, 'ivskip.css'), os.path.join(SITE, 'assets', 'ivskip.css'))
shutil.copy(os.path.join(HERE, 'ivskip.js'), os.path.join(SITE, 'assets', 'ivskip.js'))
shutil.copy(os.path.join(HERE, 'autofill.css'), os.path.join(SITE, 'assets', 'autofill.css'))
shutil.copy(os.path.join(HERE, 'autofill.js'), os.path.join(SITE, 'assets', 'autofill.js'))
shutil.copy(os.path.join(HERE, 'autofill-data.js'), os.path.join(SITE, 'assets', 'autofill-data.js'))
shutil.copy(os.path.join(HERE, 'pay-views.css'), os.path.join(SITE, 'assets', 'pay-views.css'))
shutil.copy(os.path.join(HERE, 'pay-views.js'), os.path.join(SITE, 'assets', 'pay-views.js'))
shutil.copy(os.path.join(HERE, 'taxes.js'), os.path.join(SITE, 'assets', 'taxes.js'))
shutil.copy(os.path.join(HERE, 'own.js'), os.path.join(SITE, 'assets', 'own.js'))
shutil.copy(os.path.join(HERE, 'titles.js'), os.path.join(SITE, 'assets', 'titles.js'))
shutil.copy(os.path.join(HERE, 'own.css'), os.path.join(SITE, 'assets', 'own.css'))
# guidebook: pantalla de la app (conserva menú lateral, Vela, migas y panel). Se parte de la pantalla «cart-how-auth» (tiene Vela y migas) y se rellena el hueco (gbs.js / gbs.css)
shutil.copy(os.path.join(HERE, 'gbs.js'), os.path.join(SITE, 'assets', 'gbs.js'))
shutil.copy(os.path.join(HERE, 'gbs.css'), os.path.join(SITE, 'assets', 'gbs.css'))
_idx = [f for f in os.listdir(os.path.join(SITE, 'assets')) if re.match(r'index-.*\.css$', f)][0]
for _v in ('m', 'd'):
    _p = os.path.join(SITE, 'screens', 'cart-how-auth.%s.html' % _v)
    if os.path.exists(_p):
        _h = open(_p, encoding='utf-8').read()
        _h = re.sub(r'window\.__SCREEN=\{[^}]*\}', lambda m: m.group(0).replace('"id": "cart-how-auth"', '"id": "guidebook"'), _h, count=1)
        _h = _h.replace('Back to payment', 'Back to home').replace('>Edit Tourist taxes<', '>Guidebook<').replace('>Tourist Taxes<', '>Guidebook<')
        _h = _h.replace('</head>', '<style id="gbs-pend">html:not(.gbs-ready) .taxes-view>*:not(.dbk-row){display:none!important}html:not(.gbs-ready) .taxes-view::after{content:"";display:block;height:210px;margin-top:12px;border-radius:22px;background:linear-gradient(135deg,#15153f,#2e4bd0);box-shadow:0 222px 0 #fff,0 380px 0 #fff;animation:gbs-sk 1.1s ease-in-out infinite alternate}@media(min-width:1024px){html:not(.gbs-ready) .taxes-view::after{height:240px;border-radius:24px}}@keyframes gbs-sk{from{opacity:.92}to{opacity:1}}html:not(.gbs-ready) aside[data-slot="assistant-panel"]>p,html:not(.gbs-ready) aside[data-slot="assistant-panel"] section{visibility:hidden}</style><script>setTimeout(function(){document.documentElement.classList.add("gbs-ready")},3500)</script><link rel="stylesheet" href="../assets/gbs.css"></head>', 1)
        _h = _h.replace('<i id="rep-end" hidden></i>', '<script src="../assets/gbs.js"></script><i id="rep-end" hidden></i>', 1)
        open(os.path.join(SITE, 'screens', 'guidebook.%s.html' % _v), 'w', encoding='utf-8').write(_h)
# editor del guidebook (lado anfitrión, fuera de la app)
open(os.path.join(SITE, 'screens', 'guidebook-editor.html'), 'w', encoding='utf-8').write(open(os.path.join(HERE, 'guidebook-editor.html'), encoding='utf-8').read().replace('__INDEXCSS__', _idx))
shutil.copy(os.path.join(HERE, 'taxes.css'), os.path.join(SITE, 'assets', 'taxes.css'))
shutil.copy(os.path.join(HERE, 'deposit.js'), os.path.join(SITE, 'assets', 'deposit.js'))
shutil.copy(os.path.join(HERE, 'deposit.css'), os.path.join(SITE, 'assets', 'deposit.css'))
shutil.copy(os.path.join(HERE, 'checkout.js'), os.path.join(SITE, 'assets', 'checkout.js'))
shutil.copy(os.path.join(HERE, 'checkout.css'), os.path.join(SITE, 'assets', 'checkout.css'))
shutil.copytree(os.path.join(HERE, 'vendor', 'autofill'), os.path.join(SITE, 'assets', 'autofill'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'vendor', 'autofill-proto'), os.path.join(SITE, 'autofill'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'vendor', 'selfie'), os.path.join(SITE, 'selfie'), dirs_exist_ok=True)   # demo de la gorra y las gafas (selfie)
shutil.copy(os.path.join(HERE, 'hub.js'), os.path.join(SITE, 'assets', 'hub.js'))

# ---------- index ----------
GROUPS = [
 ('Home y navegación', ('home', 'menu', 'language', 'faqs', 'offers', 'offer', 'nav-')),
 ('Registro de huéspedes', ('hub', 'g2-iv', 'form-', 'submit', 'g2-')),
 ('Autofill: escaneo de documento', ('scan-',)),
 ('Verificación de identidad', ('iv-', 'pay-iv')),
 ('Pagos', ('pay-', 'cart', 'order')),
]
def group_of(sid):
    for title, pre in GROUPS:
        if any(sid.startswith(p) for p in pre): return title
    return 'Otras'
by = {}
for sid in sorted(screens): by.setdefault(group_of(sid), []).append(sid)
order = [g[0] for g in GROUPS] + ['Otras']
cards = ''
for g in order:
    if g not in by: continue
    cards += '<h2>%s <span>%d</span></h2><div class="grid">' % (g, len(by[g]))
    for sid in by[g]:
        v = 'm' if 'm' in screens[sid] else 'd'
        has = ''.join('<a href="screens/%s.%s.html">%s</a>' % (sid, x, 'Móvil' if x == 'm' else 'Escritorio') for x in ('m', 'd') if x in screens[sid])
        cards += ('<figure><a href="screens/%s.%s.html"><img loading="lazy" src="thumbs/%s.%s.jpg" alt=""></a>'
                  '<figcaption><b>%s</b><div>%s</div></figcaption></figure>') % (sid, v, sid, v, sid, has)
    cards += '</div>'
index = '''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Réplica guestapp v2</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f7fc;color:#161643;margin:0;padding:28px 16px}main{max-width:1180px;margin:0 auto}
h1{margin:0 0 6px;font-size:26px}p.s{margin:0 0 22px;color:#5a6695;max-width:760px;line-height:1.5}
h2{font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:#385bf8;margin:30px 0 12px}h2 span{color:#8a8ca6;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}figure{margin:0;background:#fff;border:1px solid #e5e6ee;border-radius:14px;overflow:hidden}
figure img{width:100%%;display:block;aspect-ratio:9/16;object-fit:cover;object-position:top;background:#eef0fb}figcaption{padding:8px 10px;font-size:12.5px}figcaption b{display:block;word-break:break-all}
figcaption a{margin-right:8px;color:#385bf8;text-decoration:none;font-weight:600}</style></head><body><main>
<h1>Réplica de la guestapp v2</h1><p class="s">Pantallas capturadas de la guestapp de staging, con sus mismos estilos y componentes. Se pueden recorrer haciendo clic. Ábrela en móvil o en escritorio y se adapta sola. Los datos son los de una reserva de pruebas.</p>
<p class="s"><a href="screens/home.m.html" style="color:#385bf8;font-weight:700">Empezar por la Home →</a></p>
%s</main></body></html>''' % cards
open(os.path.join(SITE, 'screens.html'), 'w', encoding='utf-8').write(index)   # índice de pantallas
shutil.copy(os.path.join(HERE, 'split.html'), os.path.join(SITE, 'index.html'))   # entrada por defecto: mockup móvil + escritorio
# interfaz del prototipo en inglés: panel «Controls», barras de mockup e índice (traducción en tiempo de ejecución)
shutil.copy(os.path.join(HERE, 'i18n-en.js'), os.path.join(SITE, 'assets', 'i18n-en.js'))
for _p in glob.glob(os.path.join(SITE, '*.html')) + glob.glob(os.path.join(SITE, 'screens', '*.html')):
    _t = open(_p, encoding='utf-8').read()
    _rel = '../assets/' if os.sep + 'screens' + os.sep in _p else 'assets/'
    if 'i18n-en.js' not in _t and '</body>' in _t:
        open(_p, 'w', encoding='utf-8').write(_t.replace('</body>', '<script src="%si18n-en.js"></script></body>' % _rel, 1))
print('done', sum(len(v) for v in screens.values()), 'pages')
