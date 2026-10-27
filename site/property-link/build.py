#!/usr/bin/env python3
# Genera las pantallas del property link (móvil y escritorio) a partir de plink.html.
import os, json, glob, time
HERE = os.path.dirname(os.path.abspath(__file__))
idx = os.path.basename(glob.glob(os.path.join(HERE, 'assets', 'index-*.css'))[0])
tpl = open(os.path.join(HERE, 'plink.html'), encoding='utf-8').read()
v = str(int(time.time()))
for d in ('m', 'd'):
    h = tpl.replace('__INDEXCSS__', idx).replace('__SCREENJSON__', json.dumps({'id': 'property-link', 'v': d, 'has': ['m', 'd']}))
    h = h.replace('plink.css"', 'plink.css?v=%s"' % v).replace('plink.js"', 'plink.js?v=%s"' % v).replace('panel.js"', 'panel.js?v=%s"' % v)
    h = h.replace('</body>', '<script src="../assets/i18n-en.js"></script></body>')
    open(os.path.join(HERE, 'screens', 'property-link.%s.html' % d), 'w', encoding='utf-8').write(h)
print('ok')
