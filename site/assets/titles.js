/* Títulos con palabra remarcada: el azul no es plano, sino un degradado que nace del color del título a mitad de la palabra anterior,
   se hace azul en la(s) palabra(s) remarcada(s) y vuelve al color del título a mitad de la palabra siguiente (si la remarcada es la última, termina en azul).
   Se aplica a los h1/h2 (y a los títulos de sección de la Home) que ya llevan palabras en azul. No toca el DOM: pinta el degradado como fondo recortado al texto, una capa por línea. */
(function(){
if (new URLSearchParams(location.search).get('embed') === '1' && false) return;
var LETTERS = 3, BLUE = 'rgb(56, 91, 248)', C1 = '#2e4bd0', C2 = '#5470f0';
var SEL = 'h1,h2,#gbs .bk-h1';   /* los títulos de Vela nunca llevan degradado */
var RULES = [   /* [expresión con la parte remarcada en el grupo 1] */
  [/^Which (document) will you use$/], [/^Choose your (document)$/], [/^Scan your (document)$/],
  [/^Photograph the (front side)$/], [/^Photograph the (back side)$/], [/^Photograph the (photo page)$/], [/^Photograph the (back) of your /],
  [/^Fit the .+ (in the frame)$/], [/^Fit your face (in the oval)$/], [/^Get ready for your (selfie)$/], [/^Now the (back side)$/],
  [/^Verifying your (identity|document)$/], [/^(?:Identity|Document) (verified)$/],
  [/^Frame the (photo page)$/], [/^Get your (passport) ready$/], [/^Pick your (cover) before paying$/]
];
var rgb = function(c){ var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; };
var words = function(h){   /* palabras con su rango (nodo, inicio, fin) y si pertenecen a una zona azul */
  var out = [], w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  var full = '', segs = [];
  for (var n = w.nextNode(); n; n = w.nextNode()) { var el = n.parentElement, blue = false; for (var p = el; p && p !== h.parentElement; p = p.parentElement) { if (getComputedStyle(p).color === BLUE) { blue = true; break; } if (p === h) break; } segs.push({ n: n, s: full.length, e: full.length + n.nodeValue.length, blue: blue }); full += n.nodeValue; }
  var re = /\S+/g, m;
  while ((m = re.exec(full))) {
    var a = m.index, b = a + m[0].length, parts = [], blue = false;
    segs.forEach(function(sg){ var s = Math.max(a, sg.s), e = Math.min(b, sg.e); if (e > s) { parts.push([sg.n, s - sg.s, e - sg.s]); if (sg.blue && /[\wÀ-ÿ]/.test(full.slice(s, e))) blue = true; } });
    out.push({ parts: parts, blue: blue, text: m[0] });
  }
  return out;
};
var lettersOf = function(ws){   /* todas las letras (sin espacios) con su rect, en orden, y a qué palabra pertenecen */
  var out = [];
  ws.forEach(function(w, wi){ w.parts.forEach(function(p){ var t = p[0].nodeValue; for (var i = p[1]; i < p[2]; i++) { if (!/[\wÀ-ÿ]/.test(t.charAt(i))) continue; var g = document.createRange(); g.setStart(p[0], i); g.setEnd(p[0], i + 1); var q = g.getClientRects()[0]; if (q && q.width > 0) out.push({ q: q, w: wi }); } }); });
  return out;
};
var rectsOf = function(wd){ var r = []; wd.parts.forEach(function(p){ var g = document.createRange(); g.setStart(p[0], p[1]); g.setEnd(p[0], p[2]); [].forEach.call(g.getClientRects(), function(q){ if (q.width > 0) r.push(q); }); }); return r; };
var fx = function(h){
  if (h.closest('#rep-panel,#rep-panel-set,[data-rep-bar],#gbs .gb-hd')) return;   /* los títulos de sección dentro del guidebook no llevan degradado */
  var cs = getComputedStyle(h), base = rgb(cs.color);
  if (base[0] > 90 || base[1] > 90) { clear(h); return; }   /* solo títulos oscuros sobre fondo claro */
  var ws = words(h), idx = []; ws.forEach(function(w, i){ if (w.blue) idx.push(i); });
  if (!idx.length) {   /* títulos sin palabra azul propia (los del flujo de verificación y escaneo): se remarca por regla */
    var tx = ws.map(function(w){ return w.text; }).join(' ').replace(/[?!.,:…]+$/, '');
    for (var r = 0; r < RULES.length && !idx.length; r++) { var m = RULES[r][0].exec(tx); if (!m) continue; var em = m[1].split(' '), pre = tx.slice(0, m.index + m[0].indexOf(m[1])).split(' ').filter(Boolean).length; for (var k = 0; k < em.length; k++) idx.push(pre + k); }
    idx = idx.filter(function(i){ return ws[i]; });
    if (idx.length) idx.forEach(function(i){ ws[i].blue = true; });
  }
  if (!idx.length) { clear(h); return; }
  var i0 = idx[0], i1 = idx[idx.length - 1], prev = ws[i0 - 1], next = ws[i1 + 1];
  var hr = h.getBoundingClientRect(), navy = 'rgb(' + base.join(',') + ')';
  /* x de cada punto clave por línea */
  var lines = {};   /* top → {l, r, t, b} del contenido del título */
  ws.forEach(function(w){ rectsOf(w).forEach(function(q){ var k = Math.round(q.top); var L = lines[k] || (lines[k] = { top: q.top, bottom: q.bottom, left: q.left, right: q.right }); L.left = Math.min(L.left, q.left); L.right = Math.max(L.right, q.right); L.top = Math.min(L.top, q.top); L.bottom = Math.max(L.bottom, q.bottom); }); });
  var keys = Object.keys(lines).sort(function(a, b){ return a - b; });
  var layers = [], sizes = [], poss = [];
  keys.forEach(function(k){
    var L = lines[k], mid = function(w){ var rs = rectsOf(w).filter(function(q){ return Math.round(q.top) === +k || Math.abs(q.top - L.top) < 4; }); if (!rs.length) return null; var a = Math.min.apply(0, rs.map(function(q){ return q.left; })), b = Math.max.apply(0, rs.map(function(q){ return q.right; })); return { a: a, b: b, m: (a + b) / 2 }; };
    var blueR = ws.slice(i0, i1 + 1).filter(function(w){ return w.blue; }).map(mid).filter(Boolean);
    if (!blueR.length) return;
    var bs = Math.min.apply(0, blueR.map(function(r){ return r.a; })), be = Math.max.apply(0, blueR.map(function(r){ return r.b; }));
    var pm = prev ? mid(prev) : null, nm = next ? mid(next) : null;
    var W = L.right - L.left, x0, x3;
    /* 3 letras antes y 3 después de la(s) palabra(s) remarcada(s), medidas letra a letra (no dependen de lo largas que sean las palabras vecinas) */
    var LT = lettersOf(ws), fi = -1, la = -1; LT.forEach(function(l, i){ if (ws[l.w].blue) { if (fi < 0) fi = i; la = i; } });
    var ls = LT[Math.max(0, fi - LETTERS)], le = LT[Math.min(LT.length - 1, la + LETTERS)], onLine = function(l){ return Math.abs(l.q.top - L.top) < 4 || Math.round(l.q.top) === +k; };
    var hasNext = !!next && la < LT.length - 1;
    x0 = prev ? (onLine(ls) ? ls.q.left : (ls.q.top < L.top ? L.left : be + 1e6)) : bs;
    x3 = hasNext ? (onLine(le) ? le.q.right : (le.q.top > L.top ? L.right : L.left)) : be;
    nm = hasNext ? { m: x3 } : null;
    if (x0 > L.right) return;   /* la rampa empieza en una línea posterior */
    if (hasNext && x3 <= L.left) return;   /* la rampa terminó en una línea anterior */
    var px = function(x){ return Math.max(0, Math.min(W, x - L.left)); };
    var st = [navy + ' 0', navy + ' ' + px(x0) + 'px', C1 + ' ' + px(bs) + 'px', C2 + ' ' + px(be) + 'px'];
    if (nm && nm.m > be) st.push(navy + ' ' + px(x3) + 'px'); else st.push(C2 + ' ' + W + 'px');
    layers.push('linear-gradient(90deg,' + st.join(',') + ')'); sizes.push(Math.ceil(W) + 'px ' + Math.ceil(L.bottom - L.top) + 'px'); poss.push(Math.round(L.left - hr.left) + 'px ' + Math.round(L.top - hr.top) + 'px');
  });
  if (!layers.length) { clear(h); return; }
  layers.push('linear-gradient(' + navy + ',' + navy + ')'); sizes.push('100% 100%'); poss.push('0 0');   /* capa base: el resto del título (otras líneas) conserva su color */
  var s = h.style;
  s.setProperty('background-image', layers.join(','), 'important'); s.setProperty('background-size', sizes.join(','), 'important'); s.setProperty('background-position', poss.join(','), 'important');
  s.setProperty('background-repeat', 'no-repeat', 'important'); s.setProperty('-webkit-background-clip', 'text', 'important'); s.setProperty('background-clip', 'text', 'important'); s.setProperty('-webkit-text-fill-color', 'transparent', 'important');
  h.setAttribute('data-tfx', '1');
};
window.__tfx = function(h){ return fx(h); };
var clear = function(h){ if (!h.hasAttribute('data-tfx')) return; ['background-image', 'background-size', 'background-position', 'background-repeat', '-webkit-background-clip', 'background-clip', '-webkit-text-fill-color'].forEach(function(p){ h.style.removeProperty(p); }); h.removeAttribute('data-tfx'); };
var seen = (typeof WeakSet !== 'undefined') ? new WeakSet() : null;
var ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(function(es){ es.forEach(function(e){ queue(e.target); }); }) : null;
var pend = new Set(), raf = 0;
var queue = function(h){ pend.add(h); if (!raf) raf = setTimeout(function(){ raf = 0; var l = Array.from(pend); pend.clear(); l.forEach(function(x){ try { fx(x); } catch (e) {} }); }, 30); };
var watch = function(h){ if (seen && seen.has(h)) return; if (seen) seen.add(h); if (ro) ro.observe(h); new MutationObserver(function(){ queue(h); }).observe(h, { childList: true, characterData: true, subtree: true }); queue(h); };
var scan = function(root){ [].forEach.call((root || document).querySelectorAll ? (root || document).querySelectorAll(SEL) : [], watch); if (root && root.matches && root.matches(SEL)) watch(root); };
var go = function(){ scan(document); new MutationObserver(function(ms){ ms.forEach(function(m){ [].forEach.call(m.addedNodes, function(n){ if (n.nodeType === 1) scan(n); }); }); }).observe(document.body, { childList: true, subtree: true }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ scan(document); [].forEach.call(document.querySelectorAll('[data-tfx]'), queue); }); window.addEventListener('resize', function(){ [].forEach.call(document.querySelectorAll('[data-tfx]'), queue); }); };
if (document.readyState !== 'loading') go(); else document.addEventListener('DOMContentLoaded', go);
})();
