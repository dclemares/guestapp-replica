#!/usr/bin/env python3
"""Upselling v3 (versión final f6) dentro de la réplica: genera site/screens/ux-*.{m,d}.html a partir del carrito de la réplica
(site/screens/cart.*.html), igual que ~/upselling-v3/build.py, y copia ux.js / ux.css / ux-after.js, pay-views.js, checkout.js y panel.js a site/assets.
Se lanza después de build_replica.py (no necesita red)."""
import os, re, json, shutil, time
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, 'site')
SCREENS = ['list', 'empty', 'instant', 'time', 'request', 'date', 'unavailable', 'mine']
ver = str(int(time.time()))

ACT = ' [background:var(--sidebar-item-active-bg)]'

def side_active(html, label):
    """barra lateral: el resaltado de «Payments» (la página base es el carrito) pasa al apartado de los extras"""
    out, pos = [], 0
    for m in re.finditer(r'<button[^>]*data-sidebar="menu-button"[^>]*>', html):
        tag = m.group(0); txt = re.sub(r'<svg.*?</svg>', '', html[m.end():m.end() + 3000], flags=re.S); txt = re.sub('<[^>]+>', '', txt).strip()
        new = tag.replace(ACT, '')
        if txt.startswith(label): new = re.sub(r'class="([^"]*)"', lambda c: 'class="' + c.group(1) + ACT + '"', new, count=1)
        out.append(html[pos:m.start()] + new); pos = m.end()
    return ''.join(out) + html[pos:]

def screen(html, sid, v):
    html = re.sub(r'window\.__SCREEN=\{[^}]*\}', 'window.__SCREEN=' + json.dumps({'id': sid, 'v': v, 'has': ['d', 'm']}), html, count=1)
    html = html.replace('payments-view', 'ux-view').replace('class="my-cart ', 'class="ux-old ')
    html = html.replace('Your Payments', 'Extras')
    html = html.replace('data-active="true"', 'data-active="false"')
    html = side_active(html, 'Recommendations')
    html = html.replace('<html', '<html data-ux="%s"' % sid, 1)
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/ux.css?v=%s"></head>' % ver, 1)
    html = html.replace('<i id="rep-end" hidden></i>', '<script src="../assets/ux.js?v=%s"></script><i id="rep-end" hidden></i>' % ver, 1)
    return html

for v in ('m', 'd'):
    base = open(os.path.join(SITE, 'screens', 'cart.%s.html' % v), encoding='utf-8').read()
    for s in SCREENS:
        open(os.path.join(SITE, 'screens', 'ux-%s.%s.html' % (s, v)), 'w', encoding='utf-8').write(screen(base, 'ux-' + s, v))
for v in ('m', 'd'):
    fp = os.path.join(SITE, 'screens', 'order-history.%s.html' % v)
    oh = open(fp, encoding='utf-8').read()
    oh = re.sub(r'<script src="\.\./assets/ux-after\.js\?v=\d+"></script>', '', oh)
    oh = oh.replace('<i id="rep-end" hidden></i>', '<script src="../assets/ux-after.js?v=%s"></script><i id="rep-end" hidden></i>' % ver, 1)
    open(fp, 'w', encoding='utf-8').write(oh)
for f in ('ux.js', 'ux.css', 'ux-after.js', 'pay-views.js', 'checkout.js', 'panel.js'):
    shutil.copy(os.path.join(HERE, f), os.path.join(SITE, 'assets', f))
print('ux:', len(SCREENS) * 2, 'pages')
