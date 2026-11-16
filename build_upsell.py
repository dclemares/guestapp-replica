#!/usr/bin/env python3
"""Deal propio del anfitrión (upselling): genera site/screens/upsell-*.{m,d}.html a partir de la pantalla de Pagos ya construida
(site/screens/cart.*.html) y copia upsell.js / upsell.css / upsell-flows.html a site/. No hace falta rehacer toda la réplica."""
import os, re, json, shutil, time
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, 'site')
UPS = ['detail', 'options', 'pay', 'failed', 'confirmed', 'requested', 'approved', 'rejected', 'list', 'empty', 'mine']   # list · empty · mine: upsell-hub.js

def upsell_screen(html, state):
    """Se parte de Pagos, como «Virtual keys» y la IV con QR, y upsell.js rellena el hueco con el diseño y el paso del flujo.
    Sin Vela: upsell.css oculta el panel del asistente y deja la rejilla de escritorio en dos columnas."""
    html = html.replace('payments-view', 'ups-view').replace('class="my-cart ', 'class="ups-old ')
    html = html.replace('Your Payments', 'Extras')
    html = html.replace('data-active="true"', 'data-active="false"')
    html = html.replace('<html', '<html data-ups="%s"' % state, 1)
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/access.css"><link rel="stylesheet" href="../assets/upsell.css"><link rel="stylesheet" href="../assets/upsell-hub.css"></head>', 1)
    html = html.replace('<i id="rep-end" hidden></i>', '<script src="../assets/upsell.js"></script><script src="../assets/upsell-hub.js"></script><i id="rep-end" hidden></i>', 1)
    return html

ver = str(int(time.time()))
for v in ('m', 'd'):
    base = open(os.path.join(SITE, 'screens', 'cart.%s.html' % v), encoding='utf-8').read()
    for s in UPS:
        sid = 'upsell-' + s
        h = re.sub(r'window\.__SCREEN=\{[^}]*\}', 'window.__SCREEN=' + json.dumps({'id': sid, 'v': v, 'has': ['d', 'm']}), base, count=1)
        h = upsell_screen(h, s)
        h = re.sub(r'((?:src|href)="\.\./assets/(?:upsell|upsell-hub|access)\.(?:js|css))(")', r'\1?v=' + ver + r'\2', h)
        open(os.path.join(SITE, 'screens', '%s.%s.html' % (sid, v)), 'w', encoding='utf-8').write(h)
for f in ('upsell.js', 'upsell.css', 'upsell-hub.js', 'upsell-hub.css'):
    shutil.copy(os.path.join(HERE, f), os.path.join(SITE, 'assets', f))
fl = open(os.path.join(HERE, 'upsell-flows.html'), encoding='utf-8').read().replace('</body>', '<script src="assets/i18n-en.js?v=%s"></script></body>' % ver, 1)   # como el resto de páginas del build
open(os.path.join(SITE, 'upsell-flows.html'), 'w', encoding='utf-8').write(fl)
print('upsell:', len(UPS) * 2, 'pages')
