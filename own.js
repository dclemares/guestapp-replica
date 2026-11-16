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
var IS_M = !/\.d\.html/.test(location.pathname), OVK = IS_M ? 'ovm' : 'ov';   /* móvil y escritorio guardan su versión aparte: en móvil la V4 (como Extras) es la de por defecto */
var OV = q(OVK, ['0', '1', '2', '3', '4'], IS_M ? '4' : '1'), GN = q('gn', ['1', '2', '3', '4', '5', '6'], '5');
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
  { t: 'Early check-in', s: 'Access from 11:00', p: '25€', img: 'room', m: 0, k: 'early' },
  { t: 'Parking spot', s: 'On-site, per night', p: '15€', img: 'parking', m: 1, k: 'parking' },
  { t: 'Late check-out', s: 'Until 14:00', p: '20€', img: 'habitacion', m: 2, k: 'late' },
  { t: 'Welcome groceries', s: 'Stocked on arrival', p: '18€', img: 'mesa', m: 0, k: 'basket' },
  { t: 'Beach gear', s: 'Towels & parasol', p: '12€', img: 'beach', m: 1 }
];
/* escritorio · V1: además de los 5 de arriba, los otros deals del upselling v3 (misma página ux-instant), para llenar el panel derecho hasta donde quepa sin scroll */
var UNS = 'https://images.unsplash.com/photo-';
var OFFERS_D = OFFERS.concat([
  { t: 'Airport transfer', s: 'A driver waits for you at arrivals', p: '45€', img: 'transfer-sedan', m: 0, k: 'transfer' },
  { t: 'Wine tasting at sunset', s: 'Five local wines at a family winery', p: '30€', src: UNS + '1510812431401-41d2bd2722f3?w=300&q=70&auto=format&fit=crop', m: 1, k: 'wine' },
  { t: 'Bring your pet', s: 'Bed, bowls, treats and clean-up', p: '10€', src: UNS + '1548199973-03cce0bbc87b?w=300&q=70&auto=format&fit=crop', m: 0, k: 'pet' }
]);
var MOM = ['Arrival', 'Stay', 'Departure'];
/* cada deal propio abre su página del upselling v3 (antes todos iban a offer-detail, la página de un partner) */
var dgo = function(o){ return o && o.k ? 'ux-instant?o=' + o.k + '&from=home' : 'ux-list'; };
var go = function(id){ var m = location.pathname.match(/\.([md])\.html/), q = id.split('?'), e = /[?&]embed=1/.test(location.search); location.href = q[0] + '.' + (m ? m[1] : 'm') + '.html' + (q[1] || e ? '?' + [q[1], e ? 'embed=1' : ''].filter(Boolean).join('&') : ''); };   /* admite «pantalla?o=deal» (los deals propios abren su página de upselling v3) */
var addBtn = function(i, t){ return '<button type="button" class="own-add" data-add="' + i + '" aria-label="See ' + esc(t) + '"><span class="a1">' + ic('plus', 16) + '</span><span class="a2">' + ic('chk', 16) + '</span></button>'; };

/* ---------- OFERTAS ---------- */
var thumb = function(o, c){ return '<img class="' + c + '" src="' + (o.src || IMG + o.img + '.jpg') + '" alt="" loading="lazy">'; };
var offersV1 = function(){   /* Lista: foto pequeña, nombre, precio y un «+» redondo; tres filas y «See all» */
  return '<div class="own own-o1"><div class="o1-card">' + (IS_M ? OFFERS.slice(0, 3) : OFFERS_D).map(function(o, i){ return '<div class="o1-row" data-go="' + dgo(o) + '">' + thumb(o, 'o1-im') + '<span class="o1-t"><b>' + esc(o.t) + '</b><small>' + esc(o.s) + '</small></span><span class="o1-r"><b>' + o.p + '</b>' + '<span class="o1-go" aria-hidden="true">' + ic('right', 16) + '</span>' + '</span></div>'; }).join('')
    + '<button type="button" class="o1-all" data-go="ux-list">See all ' + (IS_M ? OFFERS : OFFERS_D).length + ' offers' + ic('right', 16) + '</button></div></div>';
};
var offersV2 = function(){   /* Destacada: una oferta grande con su botón y el resto como fichas en una fila */
  var f = OFFERS[0];
  return '<div class="own own-o2"><div class="o2-feat" data-go="' + dgo(f) + '">' + thumb(f, 'o2-im') + '<span class="o2-sh"></span><span class="o2-chip">For your arrival</span><div class="o2-bt"><span class="o2-tx"><b>' + esc(f.t) + '</b><small>' + esc(f.s) + '</small></span><button type="button" class="o2-add" data-add="0" aria-pressed="false"><span class="a1">Add · ' + f.p + '</span><span class="a2">' + ic('chk', 16) + 'Added</span></button></div></div>'
    + '<div class="o2-row">' + OFFERS.slice(1).map(function(o, i){ return '<div class="o2-fc" data-go="' + dgo(o) + '">' + thumb(o, 'o2-th') + '<span class="o2-ft"><b>' + esc(o.t) + '</b><small>' + o.p + '</small></span>' + addBtn(i + 1, o.t) + '</div>'; }).join('') + '</div></div>';
};
var offersV3 = function(m){   /* Por momento: pestañas Arrival · Stay · Departure y cuadrícula de tarjetas */
  m = m || 0;
  var items = OFFERS.map(function(o, i){ return { o: o, i: i }; }).filter(function(x){ return x.o.m === m; });
  return '<div class="own own-o3"><div class="o3-card"><div class="o3-tabs" role="tablist">' + MOM.map(function(n, k){ var c = OFFERS.filter(function(o){ return o.m === k; }).length; return '<button type="button" role="tab" class="o3-tab' + (k === m ? ' on' : '') + '" aria-selected="' + (k === m) + '" data-mom="' + k + '">' + n + '<i>' + c + '</i></button>'; }).join('') + '</div>'
    + '<div class="o3-grid' + (items.length === 1 ? ' one' : '') + '">' + items.map(function(x){ return '<div class="o3-c" data-go="' + dgo(x.o) + '">' + thumb(x.o, 'o3-im') + '<span class="o3-b"><b>' + esc(x.o.t) + '</b><small>' + esc(x.o.s) + '</small></span><span class="o3-f"><b>' + x.o.p + '</b>' + addBtn(x.i, x.o.t) + '</span></div>'; }).join('') + '</div></div></div>';
};

var OFF4 = [   /* los mismos deals que la lista de Extras (upselling v3): foto, titular, precio y unidad */
  { k: 'basket', t: 'Welcome groceries', s: 'Breakfast waiting when you walk in', p: '18€', u: 'per unit', img: 'gb-tapas.jpg' },
  { k: 'transfer', t: 'Airport transfer', s: 'A driver waits for you at arrivals', p: '45€', u: 'per group', img: 'transfer-sedan.jpg' },
  { k: 'parking', t: 'Private parking', s: 'A covered spot next to the house', p: '15€', u: 'per day', img: 'parking.jpg' }
];
var offersV4 = function(){   /* Como Extras: early/late en una cajita (sin la línea de tiempo), 3 deals en tarjetas y «See all» */
  var row = function(k, d, t, p){ return '<button type="button" class="o4-xr" data-go="ux-instant?o=' + k + '&from=home"><span class="o4-xt"><small>' + d + '</small><b>' + t + '</b></span><span class="o4-pill">' + p + '<i>' + ic('right', 14) + '</i></span></button>'; };
  return '<div class="own own-o4"><div class="o4-x"><div class="o4-xh"><b>Make your stay up to <em>10 h</em> longer</b><small>Check in earlier and check out later</small></div>'
    + '<div class="o4-xl">' + row('early', 'Wed 25', 'Early check-in', 'from 10€') + row('late', 'Fri 27', 'Late check-out', 'from 15€') + '</div></div>'
    + '<div class="o4-l">' + OFF4.map(function(o){ return '<div class="o4-r" data-go="ux-instant?o=' + o.k + '&from=home"><img src="' + IMG + o.img + '" alt="" loading="lazy"><span class="o4-t"><b>' + esc(o.t) + '</b><small>' + esc(o.s) + '</small><span class="o4-p"><strong>' + o.p + '</strong> ' + o.u + '</span></span><span class="o4-go" aria-hidden="true">' + ic('right', 18) + '</span></div>'; }).join('') + '</div>'
    + '<button type="button" class="o1-all o4-all" data-go="ux-list">See all 7 offers' + ic('right', 16) + '</button></div>';
};

/* partners con la V4: el bloque «From our partners» de la lista de Extras (tarjeta con iconos de color) en lugar del carrusel «Extras for your stay» */
var PI = { car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 21 3-7 3 3v5M7 12l3-4 4 1 3 3"/>', wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>' };
var pic = function(n, s){ return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PI[n] + '</svg>'; };
var PTN = [['car', 'Private transfers', 'Your ride is ready when you land', ''], ['walk', 'Walking tours', 'Discover the city with local guides', 'Free'], ['wifi', 'eSIM', 'Mobile data with no roaming', 'from 4€']];
var partnersV4 = function(){ return '<div class="own own-p4"><div class="p4-card">' + PTN.map(function(x){ return '<button type="button" class="p4-r"><span class="p4-ic i-' + x[0] + '">' + pic(x[0], 22) + '</span><span class="p4-t"><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + (x[3] ? '<em' + (x[3] === 'Free' ? ' class="fr"' : '') + '>' + x[3] + '</em>' : '') + '<span class="p4-go">' + pic('ext', 17) + '</span></button>'; }).join('')
  + '<p class="p4-n">' + pic('info', 14) + 'Booked and paid on each partner\'s site, not with your stay.</p></div></div>'; };
/* «From our partners» en el panel derecho de escritorio · 5 versiones (Controls › «From our partners (escritorio)»). «p» = la tarjeta con iconos de móvil. Elegida (2026-11-16): V5 · Lista compacta */
var PV = (function(){ var v = LSget('replica-own-pvd', '5'); return ['p', '1', '2', '3', '4', '5'].indexOf(v) >= 0 ? v : '5'; })();
var PNOTE = '<p class="fp-n">' + pic('info', 13) + 'Booked and paid on each partner\'s site, not with your stay.</p>';
var ptag = function(x){ return x[3] ? '<em' + (x[3] === 'Free' ? ' class="fr"' : '') + '>' + x[3] + '</em>' : ''; };
var partnersD = function(){
  var body;
  if (PV === '1') body = '<div class="fp1-g">' + PTN.map(function(x){ return '<button type="button" class="fp1-t i-' + x[0] + '"><span class="fp1-ic">' + pic(x[0], 20) + '</span><b>' + x[1] + '</b>' + (x[3] ? ptag(x) : '<em class="lk">Book</em>') + '</button>'; }).join('') + '</div>';
  else if (PV === '2') body = '<div class="fp2-g">'
      + '<button type="button" class="fp2-ph" style="background-image:url(' + IMG + 'transfer-van.jpg)"><span><small>Private transfers</small><b>Your ride is ready when you land</b></span></button>'
      + '<button type="button" class="fp2-ph" style="background-image:url(' + IMG + 'madrid4.jpg)"><em class="fr">Free</em><span><small>Walking tours</small><b>Discover the city with local guides</b></span></button></div>'
      + '<button type="button" class="fp2-bar"><span class="fp2-ic">' + pic('wifi', 18) + '</span><span class="fp2-bt"><b>eSIM</b><small>Mobile data with no roaming</small></span><em>from 4€</em></button>';
  else if (PV === '3') body = '<button type="button" class="fp3-hero" style="background-image:url(' + IMG + 'transfer-van.jpg)"><span class="fp3-k">' + pic('car', 14) + 'Private transfers</span><b>Your ride is ready when you land</b><span class="fp3-cta">Book your ride ' + pic('ext', 14) + '</span></button>'
      + '<div class="fp3-l">' + PTN.slice(1).map(function(x){ return '<button type="button" class="fp3-r"><span class="fp3-ic i-' + x[0] + '">' + pic(x[0], 16) + '</span><b>' + x[1] + '</b>' + ptag(x) + '<span class="fp3-go">' + pic('ext', 15) + '</span></button>'; }).join('') + '</div>';
  else if (PV === '4') body = '<div class="fp4-l">' + PTN.map(function(x){ return '<button type="button" class="fp4-r i-' + x[0] + '"><span class="fp4-ic">' + pic(x[0], 20) + '</span><span class="fp4-t"><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + ptag(x) + '<span class="fp4-go">' + pic('ext', 16) + '</span></button>'; }).join('') + '</div>';
  else if (PV === '5') body = '<div class="fp5-l">' + PTN.map(function(x){ return '<button type="button" class="fp5-r"><span class="fp5-ic i-' + x[0] + '">' + pic(x[0], 16) + '</span><span class="fp5-t"><b>' + x[1] + '</b><small>' + x[2] + '</small></span>' + ptag(x) + '<span class="fp5-go">' + pic('ext', 16) + '</span></button>'; }).join('') + '</div>';
  else return partnersV4();
  return '<div class="own own-p4 fp fp' + PV + '">' + body + PNOTE + '</div>';
};
var mountPartners = function(v){
  var on = OV === '4' || (!IS_M && OV !== '0'), sc = v.querySelector('.vela-scroll'); if (!sc) return;
  var lab = [].filter.call(sc.querySelectorAll('.vela-sec'), function(x){ return /extras for your stay|from our partners/i.test(x.textContent); })[0];
  var hide = [].slice.call(sc.querySelectorAll('.vela-ride, .vela-tour')).concat([].slice.call(document.querySelectorAll('.rv-actual .rp-esim')));
  hide.forEach(function(e){ e.style.display = on ? 'none' : ''; });
  if (lab) { var tn = [].filter.call(lab.childNodes, function(n){ return n.nodeType === 3 && n.nodeValue.trim(); })[0] || lab.firstChild; if (!lab._t) lab._t = lab.textContent.trim(); var tgt = lab.querySelector('span,b') || lab; if (tgt.childNodes.length <= 1) tgt.textContent = on ? 'From our partners' : lab._t; }
  var box = sc.querySelector('.own-p4'), psig = IS_M ? 'm' : 'd' + PV;
  if (box && box.getAttribute('data-psig') !== psig) { box.remove(); box = null; }
  if (!on) { if (box) box.remove(); return; }
  if (!box && lab) { var d = document.createElement('div'); d.innerHTML = IS_M ? partnersV4() : partnersD(); d.firstChild.setAttribute('data-psig', psig); lab.parentNode.insertBefore(d.firstChild, lab.nextSibling); }
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
var offersHtml = function(){ return OV === '4' ? offersV4() : OV === '1' ? offersV1() : OV === '2' ? offersV2() : OV === '3' ? offersV3(mom) : ''; };
var mountOffers = function(){
  var vs = document.querySelectorAll('.rv-actual chekin-vela'), done = false;
  [].forEach.call(vs, function(v){
    var car = v.querySelector('.vela-carwrap'); if (!car) return; done = true;
    var box = v.querySelector('.own-ov'), sig = OV + ':' + mom;
    mountPartners(v);
    if (OV === '0') { if (box) box.remove(); car.style.display = ''; return; }
    car.style.display = 'none';
    var dots = v.querySelector('.vela-dots'); if (dots) dots.style.display = 'none';
    if (!box) { box = document.createElement('div'); box.className = 'own-ov'; car.parentNode.insertBefore(box, car.nextSibling); }
    if (box.getAttribute('data-sig') !== sig) { box.setAttribute('data-sig', sig); box.innerHTML = offersHtml(); }
  });
  fitDeals();
  return done;
};
/* escritorio: en la V1 se enseñan todos los deals propios que quepan en el panel derecho sin scroll; los que no caben se esconden empezando por el final */
var fitDeals = function(){
  if (IS_M || OV !== '1') return;
  [].forEach.call(document.querySelectorAll('.rv-actual'), function(rv){
    var rows = [].slice.call(rv.querySelectorAll('.own-o1 .o1-row')); if (!rows.length || rv.offsetParent === null) return;
    rows.forEach(function(r){ r.style.display = ''; });
    var last = function(){ var all = rv.querySelectorAll('chekin-vela .vela-scroll > *'), b = 0; [].forEach.call(all, function(e){ if (e.offsetParent !== null) b = Math.max(b, e.getBoundingClientRect().bottom); }); return b; };
    var lim = rv.getBoundingClientRect().bottom - 16;
    for (var n = rows.length - 1; n >= 1 && last() > lim; n--) rows[n].style.display = 'none';
  });
};
window.addEventListener('resize', function(){ clearTimeout(fitDeals._t); fitDeals._t = setTimeout(fitDeals, 80); });
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
  if (a) { e.preventDefault(); e.stopPropagation(); var dg = a.closest('[data-go]'); if (dg) go(dg.getAttribute('data-go')); return; }   /* «+» abre el deal (antes solo se marcaba) */
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
  window.__repPanel.add('Ofertas del anfitrión', seg([['0', 'Actual'], ['1', 'V1 · Lista'], ['2', 'V2 · Destacada'], ['3', 'V3 · Por momento'], ['4', 'V4 · Como Extras']], OV, 'data-ov', function(k){ OV = k; LSset('replica-own-' + OVK, k); mountOffers(); }), 27.1);
  if (!IS_M) window.__repPanel.add('From our partners (escritorio)', seg([['1', 'V1 · Tres tiles'], ['2', 'V2 · Fotos + eSIM'], ['3', 'V3 · Destacada + enlaces'], ['4', 'V4 · Filas de color'], ['5', 'V5 · Lista compacta'], ['p', 'Tarjeta (anterior)']], PV, 'data-pvd', function(k){ PV = k; LSset('replica-own-pvd', k); mountOffers(); }), 27.12);
  window.__repPanel.add('Nº de guidebooks', seg([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']], GN, 'data-gn', function(k){ GN = k; LSset('replica-own-gn', k); mountGuides(); }), 27.15);
}, 150); };
/* ---------- píldora flotante «N more sections below» (como «N more guests» del resumen de huéspedes) ---------- */
var scEl = null, scRaf = 0;
var heads = function(){   /* cabeceras de las secciones de la Home: guidebooks, ofertas y extras */
  var out = [], g = document.querySelector('.gb-sec .sec-h'); if (g) out.push(g);
  [].forEach.call(document.querySelectorAll('main .rv-actual chekin-vela'), function(v){
    var h = v.querySelector('.vela-heading'); if (h) out.push(h);
    [].forEach.call(v.querySelectorAll('.vela-sec'), function(x){ if (/extras|partners/i.test(x.textContent)) out.push(x); });
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
