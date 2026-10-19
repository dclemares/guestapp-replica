/* Home: «Ofertas propias del anfitrión» (upselling) y «Guidebooks». Tres versiones de cada una, con controles en el panel.
   Ofertas: sustituye el carrusel «Offered by your host» (móvil: columna central · escritorio: panel derecho). 0 = el actual.
   Guidebooks: sección nueva en la columna central, entre la tarjeta del check-in y las ofertas.
   Sin estado: «Add» solo cambia el botón en la página; al recargar vuelve como estaba. */
(function(){
var S = window.__SCREEN || {};
if (!/^home/.test(S.id || '')) return;
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
var q = function(n, ok, d){ var m = location.search.match(new RegExp('[?&]' + n + '=([^&]+)')); if (m && ok.indexOf(m[1]) >= 0) { LSset('replica-own-' + n, m[1]); return m[1]; } var v = LSget('replica-own-' + n, d); return ok.indexOf(v) >= 0 ? v : d; };
var OV = q('ov', ['0', '1', '2', '3'], '1'), GN = q('gn', ['1', '2', '3', '4', '5', '6'], '5');
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var P = {
  plus: '<path d="M12 5v14M5 12h14"/>', chk: '<path d="M20 6 9 17l-5-5"/>', right: '<path d="m9 18 6-6-6-6"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  map: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  car: '<path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  down: '<path d="m6 9 6 6 6-6"/>', ext: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };
var IMG = '../assets/vela/deals/';
var OFFERS = [
  { t: 'Early check-in', s: 'Access from 11:00', p: '25€', img: 'room', m: 0 },
  { t: 'Parking spot', s: 'On-site, per night', p: '15€', img: 'parking', m: 1 },
  { t: 'Late check-out', s: 'Until 14:00', p: '20€', img: 'habitacion', m: 2 },
  { t: 'Welcome groceries', s: 'Stocked on arrival', p: '18€', img: 'mesa', m: 0 },
  { t: 'Beach gear', s: 'Towels & parasol', p: '12€', img: 'beach', m: 1 }
];
var MOM = ['Arrival', 'Stay', 'Departure'];
var go = function(id){ var m = location.pathname.match(/\.([md])\.html/); location.href = id + '.' + (m ? m[1] : 'm') + '.html' + (/[?&]embed=1/.test(location.search) ? '?embed=1' : ''); };
var addBtn = function(i, t){ return '<button type="button" class="own-add" data-add="' + i + '" aria-label="Add ' + esc(t) + '" aria-pressed="false"><span class="a1">' + ic('plus', 16) + '</span><span class="a2">' + ic('chk', 16) + '</span></button>'; };

/* ---------- OFERTAS ---------- */
var thumb = function(o, c){ return '<img class="' + c + '" src="' + IMG + o.img + '.jpg" alt="" loading="lazy">'; };
var offersV1 = function(){   /* Lista: foto pequeña, nombre, precio y un «+» redondo; tres filas y «See all» */
  return '<div class="own own-o1"><div class="o1-card">' + OFFERS.slice(0, 3).map(function(o, i){ return '<div class="o1-row" data-go="offer-detail">' + thumb(o, 'o1-im') + '<span class="o1-t"><b>' + esc(o.t) + '</b><small>' + esc(o.s) + '</small></span><span class="o1-r"><b>' + o.p + '</b>' + addBtn(i, o.t) + '</span></div>'; }).join('')
    + '<button type="button" class="o1-all" data-go="offers-all">See all ' + OFFERS.length + ' offers' + ic('right', 16) + '</button></div></div>';
};
var offersV2 = function(){   /* Destacada: una oferta grande con su botón y el resto como fichas en una fila */
  var f = OFFERS[0];
  return '<div class="own own-o2"><div class="o2-feat" data-go="offer-detail">' + thumb(f, 'o2-im') + '<span class="o2-sh"></span><span class="o2-chip">For your arrival</span><div class="o2-bt"><span class="o2-tx"><b>' + esc(f.t) + '</b><small>' + esc(f.s) + '</small></span><button type="button" class="o2-add" data-add="0" aria-pressed="false"><span class="a1">Add · ' + f.p + '</span><span class="a2">' + ic('chk', 16) + 'Added</span></button></div></div>'
    + '<div class="o2-row">' + OFFERS.slice(1).map(function(o, i){ return '<div class="o2-fc" data-go="offer-detail">' + thumb(o, 'o2-th') + '<span class="o2-ft"><b>' + esc(o.t) + '</b><small>' + o.p + '</small></span>' + addBtn(i + 1, o.t) + '</div>'; }).join('') + '</div></div>';
};
var offersV3 = function(m){   /* Por momento: pestañas Arrival · Stay · Departure y cuadrícula de tarjetas */
  m = m || 0;
  var items = OFFERS.map(function(o, i){ return { o: o, i: i }; }).filter(function(x){ return x.o.m === m; });
  return '<div class="own own-o3"><div class="o3-card"><div class="o3-tabs" role="tablist">' + MOM.map(function(n, k){ var c = OFFERS.filter(function(o){ return o.m === k; }).length; return '<button type="button" role="tab" class="o3-tab' + (k === m ? ' on' : '') + '" aria-selected="' + (k === m) + '" data-mom="' + k + '">' + n + '<i>' + c + '</i></button>'; }).join('') + '</div>'
    + '<div class="o3-grid' + (items.length === 1 ? ' one' : '') + '">' + items.map(function(x){ return '<div class="o3-c" data-go="offer-detail">' + thumb(x.o, 'o3-im') + '<span class="o3-b"><b>' + esc(x.o.t) + '</b><small>' + esc(x.o.s) + '</small></span><span class="o3-f"><b>' + x.o.p + '</b>' + addBtn(x.i, x.o.t) + '</span></div>'; }).join('') + '</div></div></div>';
};

/* ---------- GUIDEBOOKS · V1–V3: las primeras (solo títulos) ---------- */
var GUIDES = [
  { k: 'wifi', i: 'wifi', t: 'Wi-Fi & access', s: 'Network, password, door code' },
  { k: 'rules', i: 'doc', t: 'House rules', s: 'Quiet hours, smoking, pets' },
  { k: 'where', i: 'map', t: 'Getting there', s: 'Directions and arrival tips' },
  { k: 'parking', i: 'car', t: 'Parking', s: 'Where to park and how to get in' }
];
var gHeadOld = '<div class="sec-h"><h2>Guidebooks from your <span>host</span></h2><p>Everything your host has prepared for your stay. Open one to read it in full.</p></div>';
var guidesOld1 = function(){   /* Índice: una fila por guía */
  return '<div class="gb-1"><div class="g1-card">' + GUIDES.map(function(g){ return '<button type="button" class="g1-row" data-book="' + g.k + '"><span class="g-ic">' + ic(g.i, 20) + '</span><span class="g1-t"><b>' + esc(g.t) + '</b><small>' + esc(g.s) + '</small></span><span class="g1-ch">' + ic('right', 18) + '</span></button>'; }).join('') + '</div></div>';
};

/* ---------- GUIDEBOOKS: los de la Home abren la pantalla externa (guidebook.html), donde se lee todo ---------- */
var TINT = { blue: ['rgba(56,91,248,.16)', '#385bf8'], amber: ['rgba(255,194,51,.3)', '#7a5200'], green: ['rgba(55,224,143,.26)', '#0b5c37'], grey: ['#e9ebf6', '#4a5072'] };
var BKS = [
  { k: 'wifi', t: 'Wi-Fi & access', d: 'Network, password, door code', i: 'wifi', c: TINT.blue, n: 4, m: 3 },
  { k: 'rules', t: 'House rules', d: 'Quiet hours, smoking, pets, recycling', i: 'doc', c: TINT.amber, n: 5, m: 3 },
  { k: 'where', t: 'Getting there', d: 'Address, by car, by train, airport', i: 'map', c: TINT.green, n: 4, m: 3 },
  { k: 'parking', t: 'Parking', d: 'Street, garage, reserved spot', i: 'car', c: TINT.grey, n: 4, m: 2 },
  { k: 'local', t: 'Local tips', d: 'Where to eat, what to see, emergencies', i: 'star', c: TINT.blue, n: 4, m: 3 },
  { k: 'out', t: 'Check-out', d: 'Before you leave, keys, rubbish, late check-out', i: 'lock', c: TINT.amber, n: 4, m: 2 }
];
var ALLB = BKS.slice();
var openBook = function(k){ var m = location.pathname.match(/\.([md])\.html/); location.href = 'guidebook.' + (m ? m[1] : 'm') + '.html?g=' + k + '&n=' + GN + (/[?&]embed=1/.test(location.search) ? '&embed=1' : ''); };

/* ---------- montaje ---------- */
var mom = 0;
var offersHtml = function(){ return OV === '1' ? offersV1() : OV === '2' ? offersV2() : OV === '3' ? offersV3(mom) : ''; };
var mountOffers = function(){
  var vs = document.querySelectorAll('.rv-actual chekin-vela'), done = false;
  [].forEach.call(vs, function(v){
    var car = v.querySelector('.vela-carwrap'); if (!car) return; done = true;
    var box = v.querySelector('.own-ov'), sig = OV + ':' + mom;
    if (OV === '0') { if (box) box.remove(); car.style.display = ''; return; }
    car.style.display = 'none';
    var dots = v.querySelector('.vela-dots'); if (dots) dots.style.display = 'none';
    if (!box) { box = document.createElement('div'); box.className = 'own-ov'; car.parentNode.insertBefore(box, car.nextSibling); }
    if (box.getAttribute('data-sig') !== sig) { box.setAttribute('data-sig', sig); box.innerHTML = offersHtml(); }
  });
  return done;
};
var mountGuides = function(){
  var host = document.querySelector('.chk-wrap'); if (!host) return false;
  var sec = document.querySelector('.gb-sec');
  if (!sec) { sec = document.createElement('section'); sec.className = 'gb-sec own'; host.parentNode.insertBefore(sec, host.nextSibling); }
  BKS = ALLB.slice(0, +GN);
  GUIDES = BKS.map(function(b){ return { k: b.k, i: b.i, t: b.t, s: b.d }; });
  var gs = '1:' + GN;
  if (sec.getAttribute('data-sig') !== gs) { sec.setAttribute('data-sig', gs); sec.innerHTML = gHeadOld + guidesOld1(); }
  return true;
};
document.addEventListener('click', function(e){
  var t = e.target; if (!t.closest) return;
  var a = t.closest('[data-add]');
  if (a) { e.preventDefault(); e.stopPropagation(); var on = a.getAttribute('aria-pressed') !== 'true'; a.setAttribute('aria-pressed', on); a.classList.toggle('on', on); return; }
  var mt = t.closest('.o3-tab'); if (mt) { e.preventDefault(); e.stopPropagation(); mom = parseInt(mt.getAttribute('data-mom'), 10); mountOffers(); return; }
  var bk = t.closest('[data-book]'); if (bk) { e.preventDefault(); e.stopPropagation(); openBook(bk.getAttribute('data-book')); return; }
  var g = t.closest('[data-go]'); if (g && g.closest('.own')) { e.preventDefault(); e.stopPropagation(); go(g.getAttribute('data-go')); }
}, true);

/* ---------- controles ---------- */
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); onPick(b.getAttribute(attr)); [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ c.classList.toggle('on', c === b); }); }, true);
  return d; };
var addCtl = function(){ var n = 0, t = setInterval(function(){ if (!window.__repPanel) { if (++n > 40) clearInterval(t); return; } clearInterval(t);
  window.__repPanel.add('Ofertas del anfitrión', seg([['0', 'Actual'], ['1', 'V1 · Lista'], ['2', 'V2 · Destacada'], ['3', 'V3 · Por momento']], OV, 'data-ov', function(k){ OV = k; LSset('replica-own-ov', k); mountOffers(); }), 27.1);
  window.__repPanel.add('Nº de guidebooks', seg([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']], GN, 'data-gn', function(k){ GN = k; LSset('replica-own-gn', k); mountGuides(); }), 27.15);
}, 150); };
/* ---------- píldora flotante «N more sections below» (como «N more guests» del resumen de huéspedes) ---------- */
var scEl = null, scRaf = 0;
var heads = function(){   /* cabeceras de las secciones de la Home: guidebooks, ofertas y extras */
  var out = [], g = document.querySelector('.gb-sec .sec-h'); if (g) out.push(g);
  [].forEach.call(document.querySelectorAll('main .rv-actual chekin-vela'), function(v){
    var h = v.querySelector('.vela-heading'); if (h) out.push(h);
    [].forEach.call(v.querySelectorAll('.vela-sec'), function(x){ if (/extras/i.test(x.textContent)) out.push(x); });
  });
  return out.filter(function(e){ return e.offsetParent !== null; });
};
var scUpdate = function(){
  scRaf = 0; if (!scEl) return;
  var below = heads().filter(function(h){ return h.getBoundingClientRect().top > window.innerHeight - 24; }), n = below.length;
  var col = document.querySelector('main'); if (col && window.innerWidth >= 1025) { var r = col.getBoundingClientRect(); scEl.style.left = Math.round(r.left) + 'px'; scEl.style.right = Math.round(window.innerWidth - r.right) + 'px'; } else { scEl.style.left = scEl.style.right = ''; }
  scEl.querySelector('span').textContent = n + (n === 1 ? ' more section below' : ' more sections below');
  scEl.classList.toggle('on', n > 0); scEl.setAttribute('aria-hidden', n > 0 ? 'false' : 'true'); scEl.querySelector('button').tabIndex = n > 0 ? 0 : -1;
};
var scQueue = function(){ if (!scRaf) scRaf = requestAnimationFrame(scUpdate); };
var setScroll = function(){
  if (scEl) return;
  scEl = document.createElement('div'); scEl.className = 'own-sc'; scEl.setAttribute('aria-hidden', 'true');
  scEl.innerHTML = '<button type="button" aria-label="Scroll to the next section">' + ic('down', 18) + '<span></span></button>';
  document.body.appendChild(scEl);
  scEl.addEventListener('click', function(e){ if (!e.target.closest('button')) return; e.preventDefault(); e.stopPropagation();
    var nx = heads().filter(function(h){ return h.getBoundingClientRect().top > window.innerHeight - 24; })[0]; if (!nx) return;
    nx.style.scrollMarginTop = '84px'; nx.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }, true);
  document.addEventListener('scroll', scQueue, { passive: true, capture: true }); window.addEventListener('resize', scQueue);
  setInterval(scQueue, 1000);   /* las secciones se montan tarde (ofertas, guidebooks) */
  scQueue();
};
var boot = function(){ var n = 0, t = setInterval(function(){ var a = mountGuides(), b = mountOffers(); if ((a && b) || ++n > 60) clearInterval(t); }, 150); setInterval(function(){ mountGuides(); mountOffers(); }, 1200); addCtl(); setScroll(); };
if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
