/* =====================================================================================
   #1095 · Verificación de identidad con QR en la propiedad (Italia)
   El anfitrión pone un cartel con QR en la entrada. El huésped se registra en remoto, pero la verificación
   solo se abre el día del check-in y después de escanear el QR, que es la prueba de presencia.
   Una pantalla por estado (ivqr-<estado>.m/.d.html, parten de Pagos como «Virtual keys») + grupo
   «IV at property (QR)» en el cuadro (en todas las pantallas) + tarjeta opcional en la Home.
   Sin estado: escanear, buscar la reserva o verificar no guarda nada; al recargar, todo como antes.
   ===================================================================================== */
(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var desk = /\.d\.html/.test(location.pathname), EXT = desk ? '.d.html' : '.m.html';
var LS = { get: function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} } };
var STATES = ['before', 'day', 'scan', 'denied', 'wrong', 'desk', 'lookup', 'ok', 'pick', 'after'];
var NAMES = { before: 'Antes del día', day: 'Día del check-in', scan: 'Escáner', denied: 'Cámara denegada', wrong: 'QR erróneo', desk: 'Pasar al móvil', lookup: 'Buscar reserva', ok: 'Presencia confirmada', pick: 'Elegir huésped', after: 'Tras el check-out' };
var isQ = SID.indexOf('ivqr-') === 0 && STATES.indexOf(SID.slice(5)) > -1, state = isQ ? SID.slice(5) : '';   /* #1099: solo las pantallas del diseño antiguo (las ivqr-a-* / ivqr-b-* son del nuevo) */
if (isQ && STATES.indexOf(state) < 0) state = 'day';
var isHome = /^home($|-scrolled|-after)/.test(SID);

/* #1099 / #1100 / #1102 · control «Design» (Old design · Old design v2 · Old design v3 · New design): el mismo en ivqr-old.js, ivqr-v2.js, ivqr-v3.js e ivqr.js. Se guarda en localStorage y en la URL (?ivd=old|v2|v3|new) */
var NEWQ = /^ivqr-(a|b)-/.test(SID), V2Q = /^ivqr-v2-(a|b)-/.test(SID), V3Q = /^ivqr-v3-(a|b)-/.test(SID), OLDQ = /^ivqr-(before|day|scan|denied|wrong|desk|lookup|ok|pick|after)$/.test(SID);
var IVDS = ['old', 'v2', 'v3', 'new'];
var IVD = (function(){ var u = new URLSearchParams(location.search).get('ivd'), v = OLDQ ? 'old' : NEWQ ? 'new' : V2Q ? 'v2' : V3Q ? 'v3' : (IVDS.indexOf(u) > -1 ? u : LS.get('replica-ivq-design', 'old')); if (IVDS.indexOf(v) < 0) v = 'old'; LS.set('replica-ivq-design', v); return v; })();
var OLD2NEW = { before: 'a-sum-before', day: 'a-sum-in', scan: 'a-scan', denied: 'a-denied', wrong: 'a-wrong', desk: 'a-desk', lookup: 'b-find', after: 'a-outside' }, NEW2OLD = {};
for (var _k in OLD2NEW) NEW2OLD[OLD2NEW[_k]] = _k;
/* la v3 (producción) tiene pantallas propias: su equivalente en el resto, y qué pantallas existen en la v3 */
var V3ONLY = { 'a-registered-in': 'a-registered', 'a-unavailable': 'a-sum-before', 'b-doc-wrong': 'b-multi' }, STD2V3 = { 'b-find': 'b-landing', 'b-unreg': 'b-notfound', 'b-outside': 'b-notfound', 'b-ivstart': 'a-intro' };   /* #1104: en la v3 la portada y la búsqueda son una sola pantalla */
var V3HAS = ['a-registered', 'a-registered-in', 'a-sum-before', 'a-unavailable', 'a-sum-in', 'a-intro', 'a-scan', 'a-wrong', 'a-outside', 'a-unreadable', 'a-denied', 'a-desk', 'b-landing', 'b-multi', 'b-notfound', 'b-doc-wrong'];
function ivdRow(){ return '<span>Design</span>' + [['old', 'Diseño antiguo'], ['v2', 'Diseño antiguo v2'], ['v3', 'Diseño antiguo v3'], ['new', 'Diseño nuevo']].map(function(o){ return '<button type="button" data-g="ivd" data-k="' + o[0] + '" class="' + (IVD === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join(''); }
function ivdGo(k){
  LS.set('replica-ivq-design', k); var x = /\.d\.html/.test(location.pathname) ? '.d.html' : '.m.html', cur = SID.slice(5);
  var key = OLDQ ? (OLD2NEW[cur] || 'a-registered') : (V2Q || V3Q) ? cur.slice(3) : NEWQ ? cur : '';   /* pantalla equivalente, en la forma de las del diseño nuevo */
  if (!key) { var p = new URLSearchParams(location.search); p.set('ivd', k); location.href = location.pathname + '?' + p.toString(); return; }
  var std = V3ONLY[key] || key;
  var t = k === 'old' ? (NEW2OLD[std] || 'before') : k === 'v3' ? 'v3-' + (V3HAS.indexOf(key) > -1 ? key : STD2V3[std] || (V3HAS.indexOf(std) > -1 ? std : 'a-sum-before')) : (k === 'v2' ? 'v2-' : '') + std;
  location.href = 'ivqr-' + t + x + '?ivd=' + k;
}


/* ajustes del cuadro (solo ajustes de vista, nunca el resultado del flujo) */
var wrongK = function(){ return LS.get('replica-ivq-wrong', 'other') === 'blur' ? 'blur' : 'other'; };
var doneN = function(){ var n = parseInt(LS.get('replica-ivq-done', '0'), 10); return n >= 0 && n <= 2 ? n : 0; };
var readK = function(){ return LS.get('replica-ivq-read', 'auto') === 'tap' ? 'tap' : 'auto'; };
var homeOn = function(){ return LS.get('replica-ivq-home', '0') === '1'; };

var PROP = 'Villa Calipso', CIN = 'Wed 25 Nov', CIN_L = '25 Nov 2026', COUT_L = 'Fri 27 Nov 2026', EMAIL = 'carmen.demo@gmail.com';
var GUESTS = [{ n: 'Carmen Demo', r: 'Lead guest', a: 'CD' }, { n: 'Marco Rossi', r: 'Guest 2', a: 'MR' }];
var go = function(s){ location.href = 'ivqr-' + s + EXT; };

/* ---------- iconos ---------- */
var P = {
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.500"/><rect x="14" y="3" width="7" height="7" rx="1.500"/><rect x="3" y="14" width="7" height="7" rx="1.500"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  cam: '<path d="M14.500 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.500-3z"/><circle cx="12" cy="13" r="3.500"/>',
  camOff: '<path d="m2 2 20 20"/><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16M9.500 4h5L17 7h3a2 2 0 0 1 2 2v7.500"/><path d="M14.100 14.100a3.500 3.500 0 0 1-4.900-4.900"/>',
  cal: '<rect x="3" y="4.500" width="18" height="17" rx="2.500"/><path d="M3 10h18M8 2.500v4M16 2.500v4"/>',
  calX: '<rect x="3" y="4.500" width="18" height="17" rx="2.500"/><path d="M3 10h18M8 2.500v4M16 2.500v4M10 14l4 4M14 14l-4 4"/>',
  pin: '<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  door: '<path d="M13 4h4a1 1 0 0 1 1 1v15M3 20h18M13 4 6 5.500V20h7z"/><path d="M10 12h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  torch: '<path d="M8 2h8v4l-2 4v11a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L8 6z"/><path d="M8 6h8M12 13v2"/>',
  help: '<circle cx="12" cy="12" r="9.500"/><path d="M9.500 9.500a2.600 2.600 0 0 1 5 .9c0 1.700-2.500 2.300-2.500 3.600M12 17h.01"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.500"/><path d="M11 18h2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14a6 6 0 0 1 3.500 6"/>',
  id: '<rect x="2.500" y="5" width="19" height="14" rx="2.500"/><circle cx="8.500" cy="11" r="2"/><path d="M5.500 16a3 3 0 0 1 6 0M14 10h4M14 13.500h3"/>',
  smile: '<circle cx="12" cy="12" r="9.500"/><path d="M8.500 14.500s1.300 1.800 3.500 1.800 3.500-1.800 3.500-1.800M9 9.500h.01M15 9.500h.01"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  alert: '<circle cx="12" cy="12" r="9.500"/><path d="M12 7.500v5.500M12 16.500h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.600-6.400"/><path d="M21 3v6h-6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m3.500 6.500 8.500 6.500 8.500-6.500"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  chat: '<path d="M21 12a8.500 8.500 0 0 1-12.300 7.600L3 21l1.400-5.300A8.500 8.500 0 1 1 21 12z"/>',
  clock: '<circle cx="12" cy="12" r="9.500"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 2.500 4 5.500v6c0 5 3.400 8.700 8 10 4.600-1.300 8-5 8-10v-6z"/><path d="m8.500 12 2.500 2.500 4.500-4.500"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="1.500"/><path d="M2 19h20"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>'
};
var ic = function(n, s, w){ s = s || 20; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + P[n] + '</svg>'; };
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

/* ---------- QR de dibujo (determinista: siempre el mismo para la misma semilla) ---------- */
function qr(seed, color, logo){
  var N = 25, s = seed, rnd = function(){ s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }, d = '';
  var finder = function(x, y){ return x < 7 && y < 7 || x >= N - 7 && y < 7 || x < 7 && y >= N - 7; };
  for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
    if (finder(x, y) || (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)) continue;
    if (logo && x >= 9 && x <= 15 && y >= 9 && y <= 15) continue;
    var on = x === 6 || y === 6 ? (x + y) % 2 === 0 : rnd() > .52;
    if (on) d += 'M' + x + ' ' + y + 'h1v1h-1z';
  }
  var f = function(x, y){ return '<path d="M' + x + ' ' + y + 'h7v7h-7zM' + (x + 1) + ' ' + (y + 1) + 'v5h5v-5z" fill-rule="evenodd"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx=".4"/>'; };
  return '<svg class="ivq-qrsvg" viewBox="-1 -1 27 27" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><g fill="' + (color || '#161643') + '"><path d="' + d + '"/>' + f(0, 0) + f(N - 7, 0) + f(0, N - 7) + '</g>' + (logo ? '<rect x="9.600" y="9.600" width="5.800" height="5.800" rx="1.400" fill="#385bf8"/><path d="m10.900 12.600 1.200 1.200 2.200-2.400" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/>' : '') + '</svg>';
}
/* cartel de la entrada (el que descarga el anfitrión: «Scan to verify your identity») */
function poster(name, seed){
  return '<div class="ivq-poster"><div class="ivq-poster__h"><span class="ivq-poster__mk">' + ic('check', 11, 3.2) + '</span><b>' + esc(name || PROP) + '</b></div><div class="ivq-poster__q">' + qr(seed || 7, '#161643', true) + '</div><b class="ivq-poster__t">Scan to verify your identity</b><span class="ivq-poster__s">Identity check · Chekin</span></div>';
}
/* la entrada: puerta y cartel a la altura de los ojos, con la chincheta que lo señala */
function entrance(){
  return '<svg class="ivq-ent" viewBox="0 0 320 190" aria-hidden="true" focusable="false">'
    + '<rect x="0" y="0" width="320" height="190" fill="#eef1fb"/>'
    + '<rect x="0" y="150" width="320" height="40" fill="#e1e6f6"/>'
    + '<rect x="70" y="26" width="104" height="128" rx="6" fill="#d6dcf3"/>'
    + '<rect x="80" y="36" width="84" height="118" rx="3" fill="#23235d"/>'
    + '<rect x="88" y="46" width="68" height="44" rx="3" fill="#2e3a8c"/><rect x="88" y="98" width="68" height="46" rx="3" fill="#2e3a8c"/>'
    + '<circle cx="150" cy="98" r="3.500" fill="#ffc233"/>'
    + '<rect x="196" y="58" width="50" height="66" rx="6" fill="#fff"/>'
    + '<rect x="204" y="66" width="34" height="5" rx="2.500" fill="#385bf8"/>'
    + '<g transform="translate(205 76) scale(1.280)">' + qr(7, '#161643').replace(/<svg[^>]*>|<\/svg>/g, '') + '</g>'
    + '<rect x="204" y="113" width="34" height="4" rx="2" fill="#c9d0ee"/>'
    + '<g class="ivq-ent__pin"><circle cx="221" cy="34" r="13" fill="#385bf8"/><path d="m215.500 34 4 4 7-7.500" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/><path d="M216 45l5 7 5-7z" fill="#385bf8"/></g>'
    + '<circle class="ivq-ent__ring" cx="221" cy="91" r="40" fill="none" stroke="#385bf8" stroke-width="2"/>'
    + '<rect x="262" y="118" width="22" height="32" rx="6" fill="#c9d0ee"/><path d="M273 118c-10-8-10-22 0-30 10 8 10 22 0 30z" fill="#9fb3ff"/>'
    + '<rect x="16" y="112" width="34" height="38" rx="5" fill="#d6dcf3"/>'
    + '</svg>';
}

/* ---------- piezas ---------- */
/* esquinas del visor dibujadas en SVG (la réplica anula los bordes con html[data-nobd]) */
var CORNERS = '<i class="ivq-corners">' + [0, 1, 2, 3].map(function(){ return '<b><svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M2.500 38V18A15.500 15.500 0 0 1 18 2.500h20"/></svg></b>'; }).join('') + '</i>';
var btn = function(l, a, o){ o = o || {}; return '<button type="button" class="ivq-btn' + (o.cls ? ' ' + o.cls : '') + '" data-ivq="' + a + '"' + (o.extra || '') + '>' + (o.i ? ic(o.i, 18) : '') + '<span>' + l + '</span>' + (o.after ? ic(o.after, 18) : '') + '</button>'; };
var hero = function(tone, inner){ return '<div class="vk-au vk-au--home ivq-au" data-tone="' + tone + '"><i class="vk-au__bl vk-au__bl--1"></i><i class="vk-au__bl vk-au__bl--2"></i>' + inner + '</div>'; };
var row = function(i, t, s, a, href){ var tag = href ? 'a href="' + href + '"' : 'button type="button" data-ivq="' + a + '"'; return '<' + tag + ' class="ivq-row"><span class="ivq-row__i">' + ic(i, 19) + '</span><span class="ivq-row__t"><b>' + t + '</b><span>' + s + '</span></span><span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span></' + (href ? 'a' : 'button') + '>'; };
var label = function(t){ return '<h2 class="ivq-lbl">' + t + '</h2>'; };
var steps = function(list){ return '<ol class="ivq-steps">' + list.map(function(s, i){ return '<li><i>' + (i + 1) + '</i><div><b>' + s[0] + '</b><span>' + s[1] + '</span></div></li>'; }).join('') + '</ol>'; };
var checks = function(list){ return '<ul class="ivq-checks">' + list.map(function(s){ return '<li><i>' + ic(s[0], 17) + '</i><div><b>' + s[1] + '</b><span>' + s[2] + '</span></div></li>'; }).join('') + '</ul>'; };
var handoff = function(compact, bare){
  return '<div class="ivq-ho' + (compact ? ' ivq-ho--c' : '') + '"><div class="ivq-ho__q">' + qr(31, '#161643', true) + '</div><div class="ivq-ho__t">' + (bare ? '<span>Point your phone’s camera here</span>' : '<b>Continue on your phone</b><span>Point your phone’s camera at this code. Your booking opens there, ready to scan the QR at the entrance.</span>')
    + (compact ? '' : '<div class="ivq-ho__a"><button type="button" class="ivq-chip" data-ivq="email">' + ic('mail', 16) + '<span>Email me the link</span></button><button type="button" class="ivq-chip" data-ivq="copy">' + ic('copy', 16) + '<span>Copy link</span></button></div>') + '</div></div>';
};

/* ---------- estados ---------- */
var V = {};
/* «Antes del día»: la información de abajo en cuatro formas (cuadro › Info): Current = tres tarjetas iguales · P1 = en Vela · P2 = dentro de la tarjeta · P3 = filas de acción */
var infoK = function(){ var v = LS.get('replica-ivq-info', 'cur'); return ['cur', 'p1', 'p2', 'p3'].indexOf(v) > -1 ? v : 'cur'; };
var thumb = function(){ return '<span class="ivq-thumb">' + entrance().replace('viewBox="0 0 320 190"', 'viewBox="150 22 132 112"').replace('<svg class="ivq-ent"', '<svg class="ivq-ent" preserveAspectRatio="xMidYMid slice"') + '</span>'; };
var HUB = function(){ return 'hub-after-1' + EXT; };
/* P1 móvil: la ayuda «Ask Vela» de Virtual keys (burbujas, sin avatar, filas con icono de enviar) */
var ASK = [
  { t: 'Where is the QR?', a: 'On a sign next to the main door of ' + PROP + ', at eye level. It says “Scan to verify your identity”.', l: ['See the sign', 'where'] },
  { t: 'Can I register now?', a: 'Yes. Guest details don’t have to wait: register everyone now and on ' + CIN + ' you’ll only scan the QR and verify.', l: ['Register your guests · 0 of 2', 'reg'] },
  { t: 'When does it open?', a: 'On check-in day, ' + CIN + ' 2026, once you scan the QR at the entrance. It stays open until check-out.' },
  { t: 'Why do I need to be there?', a: 'Scanning the QR shows you’re at the property. Your host needs it before guests verify their identity.' }
];
var askMsg = function(o){ return '<div class="vk-av__q">' + o.t + '</div><div class="vk-av__a"><p>' + o.a + (o.l ? '<button type="button" class="ivq-alink" data-ivq="' + o.l[1] + '">' + o.l[0] + ic('arrow', 15) + '</button>' : '') + '</p></div>'; };
P.send = '<path d="M21 3 10 14"/><path d="M21 3 14.500 21l-4.500-7-7-4.500z"/>';
function askVela(){ return '<div class="vk-av ivq-ask"><div class="vk-av__chat" aria-live="polite">' + askMsg(ASK[0]) + '</div><h5>Suggested</h5><div class="vk-av__qs">' + ASK.map(function(o, i){ return '<button type="button" class="vk-av__row' + (i ? '' : ' on') + '" data-ivq="av" data-k="' + i + '"><span>' + o.t + '</span><i>' + ic('send', 15) + '</i></button>'; }).join('') + '</div></div>'; }
/* P1 escritorio: en el panel de Vela («Quick actions» y «Good to know»), con su estilo */
function velaInfo(on){
  var as = document.querySelector('aside[data-slot="assistant-panel"]'); if (!as) return;
  [].forEach.call(as.querySelectorAll(':scope > section[data-ivq-vela]'), function(x){ x.remove(); });
  var gtk = [].filter.call(as.querySelectorAll(':scope > section'), function(x){ return !x.hasAttribute('data-ivq-vela'); })[0]; if (!gtk) return;
  gtk.style.display = on ? 'none' : '';
  var intro = as.querySelector(':scope > p'); if (intro) { if (intro._o == null) intro._o = intro.textContent; intro.textContent = on ? 'Identity verification opens on check-in day. Until then, here’s what you can already do.' : intro._o; }
  if (!on) return;
  var lab = gtk.children[0], sec = function(t){ var n = gtk.cloneNode(false); n.removeAttribute('style'); n.setAttribute('data-ivq-vela', '1'); var l = lab.cloneNode(true); l.textContent = t; n.appendChild(l); return n; };
  var s1 = sec('Quick actions');
  s1.insertAdjacentHTML('beforeend', '<div class="vk-inv"><strong>Register your guests now</strong><span>0 of 2 registered. Guest details don’t have to wait for check-in day.</span><div><button type="button" class="vk-inv__p pri" data-ivq="reg">Register guests</button></div></div>'
    + '<button type="button" class="ivq-vrow" data-ivq="where">' + thumb() + '<span class="ivq-vrow__t"><b>Where is the QR?</b><span>See the sign next to the main door</span></span>' + ic('chev', 16, 2.4) + '</button>');
  var s2 = sec('Good to know');
  s2.insertAdjacentHTML('beforeend', '<p class="ivq-vctx">' + ic('cal', 15) + '<span>Check-in <b>' + CIN + ' 2026</b>. Verification opens that day and stays open until check-out.</span></p>');
  as.insertBefore(s1, gtk); as.insertBefore(s2, gtk);
}
V.before = function(){
  var k = infoK();
  var stepsL = [['Find the QR at the entrance', 'On a sign next to the main door'], ['Scan it with this app', 'It shows you’re at the property'], ['Verify each guest', 'A photo of their ID and a selfie']];
  var side = '<div class="ivq-au__side"><p class="ivq-au__eye">What you’ll do when you arrive</p>' + steps(stepsL) + '</div>';
  if (k === 'p2') side = side.replace('<span>On a sign next to the main door</span>', '<span>On a sign next to the main door</span><button type="button" class="ivq-inlink" data-ivq="where">' + thumb() + '<span>See where the QR is</span>' + ic('chev', 15, 2.4) + '</button>');
  var reg2 = k === 'p2' && desk ? '<div class="ivq-acts ivq-acts--in">' + btn('Register your guests now', 'reg', { cls: 'ivq-btn--w', after: 'arrow' }) + '<span class="ivq-acts__n">0 of 2 registered · you don’t need to wait</span></div>' : '';
  var h = hero('info', '<div class="ivq-au__in"><div class="ivq-au__main"><span class="ivq-badge">' + ic('cal', 15) + 'Opens ' + CIN + '</span>'
    + '<div class="ivq-glyph">' + ic('qr', 30, 1.8) + '<i>' + ic('clock', 14, 2.4) + '</i></div>'
    + '<h3>Identity check opens on check-in day</h3><p>When you arrive at ' + PROP + ', scan the QR at the entrance. Then each guest verifies their identity in about 2 minutes.</p>' + reg2 + '</div>'
    + side + '</div>');
  if (k === 'p1') return h + (desk ? '' : askVela());
  if (k === 'p2') return h;
  if (k === 'p3') return h + '<p class="ivq-ctx">' + ic('cal', 15) + '<span>Check-in date: <b>' + CIN + ' 2026</b></span></p>'
    + '<div class="ivq-arows">'
    + '<button type="button" class="ivq-arow" data-ivq="where">' + thumb() + '<span class="ivq-arow__t"><b>See where the QR is</b><span>The sign next to the main door</span></span><span class="ivq-arow__c">' + ic('chev', 18, 2.4) + '</span></button>'
    + '<a class="ivq-arow" href="' + HUB() + '" data-ivq="reg"><span class="ivq-arow__i">' + ic('users', 20) + '</span><span class="ivq-arow__t"><b>Register your guests now</b><span>0 of 2 registered</span></span><span class="ivq-arow__c">' + ic('chev', 18, 2.4) + '</span></a></div>';
  return h + '<div class="ivq-rows">' + row('cal', 'Check-in date: ' + CIN_L, 'Verification opens that day and stays open until check-out', 'noop') + row('pin', 'Where is the QR?', 'See the sign next to the main door', 'where') + row('users', 'Register your guests now', 'Guest details don’t have to wait for check-in day', '', HUB()) + '</div>';
};
V.day = function(){
  var side = desk ? '<div class="ivq-au__side ivq-au__side--ho">' + handoff(true) + '</div>' : '<div class="ivq-au__art"><div class="ivq-artbox">' + poster() + '' + CORNERS + '</div></div>';
  var h = hero('ok', '<div class="ivq-au__in"><div class="ivq-au__main"><span class="ivq-badge ivq-badge--ok"><i class="ivq-live"></i>Today · check-in day</span>'
    + '<h3>Scan the QR at the entrance</h3><p>It’s on a sign next to the main door of ' + PROP + '. Scanning it opens identity verification for your group.</p>'
    + (desk ? '' : side)
    + checks([['pin', 'Confirm you’re at the property', 'The QR only works at the entrance'], ['shield', 'Open identity verification', 'For everyone in your booking'], ['users', 'Verify every guest', '0 of 2 guests verified']])
    + (desk ? '<div class="ivq-acts ivq-acts--in"><button type="button" class="ivq-txt ivq-txt--w" data-ivq="where">' + ic('help', 17) + '<span>Where is the QR?</span></button></div>' : '') + '</div>' + (desk ? side : '') + '</div>');
  return h + (desk ? '' : '<div class="ivq-rows">' + row('pin', 'Where is the QR?', 'See the sign next to the main door', 'where') + '</div>');
};
V.ok = function(){
  var t = new Date(), hh = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
  var from = /[?&]from=lookup/.test(location.search);
  return hero('ok', '<div class="ivq-au__in ivq-au__in--c"><div class="ivq-done"><svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="ivq-done__c" cx="26" cy="26" r="23"/><path class="ivq-done__k" d="m15.500 26.500 7 7 14-15"/></svg></div>'
    + '<p class="ivq-au__eye">Presence confirmed</p><h3>You’re at ' + PROP + '</h3><p>' + (from ? 'We found your booking. ' : '') + 'Identity verification is now open for your group. It takes about 2 minutes per guest.</p>'
    + '<div class="ivq-meta"><span>' + ic('door', 15) + 'Main entrance</span><span>' + ic('clock', 15) + 'Today, ' + hh + '</span><span>' + ic('users', 15) + '2 guests</span></div>'
    + (desk ? '<div class="ivq-acts ivq-acts--in ivq-acts--c">' + btn('Choose who to verify', 'pick', { cls: 'ivq-btn--w', after: 'arrow' }) + '</div>' : '') + '</div>')
    + label('What each guest needs') + '<div class="ivq-rows">' + row('id', 'Their passport or ID card', 'A photo of the front, in good light', 'noop') + row('smile', 'A quick selfie', 'To match the photo on the ID', 'noop') + '</div>';
};
V.pick = function(){
  var n = doneN(), all = n >= 2, cur = Math.min(n, 1);
  var seg = GUESTS.map(function(g, i){ return '<i class="' + (i < n ? 'on' : i === cur && !all ? 'cur' : '') + '"></i>'; }).join('');
  var h = hero(all ? 'ok' : 'info', '<div class="ivq-au__in ivq-au__in--pick"><div class="ivq-au__main"><span class="ivq-badge' + (all ? ' ivq-badge--ok' : '') + '">' + ic(all ? 'check' : 'shield', 15) + (all ? 'Presence confirmed · all done' : 'Presence confirmed') + '</span>'
    + '<h3>' + (all ? 'Everyone is verified' : 'Who’s verifying now?') + '</h3><p>' + (all ? 'Both guests verified their identity at ' + PROP + '. Your host has everything they need.' : 'Each guest needs their ID and a quick selfie. Hand the phone over between guests, or each guest can use their own.') + '</p>'
    + '<div class="ivq-count"><b>' + (all ? '2 of 2 guests' : (cur + 1) + ' of 2 guests') + '</b><span class="ivq-seg">' + seg + '</span></div></div></div>');
  var list = GUESTS.map(function(g, i){
    var dn = i < n, nx = i === cur && !all;
    return '<div class="ivq-g' + (dn ? ' is-done' : '') + (nx ? ' is-next' : '') + '"><span class="ivq-g__a">' + (dn ? ic('check', 18, 3) : g.a) + '</span><span class="ivq-g__t"><b>' + g.n + '</b><span>' + g.r + ' · ' + (dn ? 'Verified just now' : 'Not verified yet') + '</span></span>'
      + (dn ? '<span class="ivq-tag ivq-tag--ok">' + ic('check', 13, 3) + 'Verified</span>' : '<button type="button" class="ivq-mini' + (nx ? '' : ' ivq-mini--soft') + '" data-ivq="verify">Verify</button>') + '</div>';
  }).join('');
  return h + label(all ? 'Guests' : 'Choose a guest') + '<div class="ivq-gl">' + list + '</div>';
};
V.after = function(){
  return hero('off', '<div class="ivq-au__in ivq-au__in--c"><div class="ivq-glyph ivq-glyph--off">' + ic('calX', 30, 1.8) + '</div>'
    + '<p class="ivq-au__eye">Outside check-in period</p><h3>Identity verification not available</h3><p>Your stay at ' + PROP + ' ended on ' + COUT_L + '. Verification is only available from check-in day until check-out.</p>'
    + '<div class="ivq-meta"><span>' + ic('cal', 15) + 'Check-in date: ' + CIN_L + '</span></div>'
    + (desk ? '<div class="ivq-acts ivq-acts--in ivq-acts--c">' + btn('Back to summary', 'home', { cls: 'ivq-btn--w' }) + '</div>' : '') + '</div>');
};
V.desk = function(){
  return hero('info', '<div class="ivq-au__in ivq-au__in--ho"><div class="ivq-au__main"><span class="ivq-badge">' + ic('laptop', 15) + 'You’re on a computer</span>'
    + '<h3>Continue on your phone</h3><p>Verification needs a phone camera at the entrance of ' + PROP + '. You stay signed in, nothing to type.</p>'
    + steps([['Open your phone’s camera', 'No app needed'], ['Point it at this code', 'Tap the link that appears'], ['Scan the QR at the entrance', 'Then verify each guest']]) + '</div>'
    + '<div class="ivq-au__side ivq-au__side--ho">' + handoff(false, true) + '</div></div>');
};
V.denied = function(){
  var tabs = desk ? [['chrome', 'Chrome'], ['safari', 'Safari']] : [['ios', 'iPhone'], ['android', 'Android']];
  var HOW = { ios: [['Tap “aA” in the address bar', ''], ['Tap Website Settings', ''], ['Set Camera to Allow', '']], android: [['Tap the icon left of the address', ''], ['Tap Permissions', ''], ['Turn on Camera', '']], chrome: [['Click the camera icon in the address bar', ''], ['Choose “Always allow”', ''], ['Click Done and try again', '']], safari: [['Open Safari › Settings for This Website', ''], ['Set Camera to Allow', ''], ['Reload the page', '']] };
  var how = function(k){ return '<ol class="ivq-how" data-how="' + k + '"' + (k === tabs[0][0] ? '' : ' hidden') + '>' + HOW[k].map(function(s, i){ return '<li><i>' + (i + 1) + '</i>' + s[0] + '</li>'; }).join('') + '</ol>'; };
  return '<div class="ivq-card ivq-card--top"><span class="ivq-glyph ivq-glyph--bad">' + ic('camOff', 28, 1.9) + '</span><h3>Allow camera access</h3><p>To scan the QR at the entrance, this ' + (desk ? 'page' : 'app') + ' needs your camera. We only use it to read the code.</p>'
    + '<div class="ivq-seg2" role="group" aria-label="Your device">' + tabs.map(function(t, i){ return '<button type="button" data-ivq="how" data-k="' + t[0] + '" class="' + (i ? '' : 'on') + '" aria-pressed="' + !i + '">' + t[1] + '</button>'; }).join('') + '</div>'
    + tabs.map(function(t){ return how(t[0]); }).join('')
    + (desk ? '<div class="ivq-acts">' + btn('Try again', 'scan', { i: 'refresh' }) + '</div>' : '') + '</div>'
    + '<div class="ivq-or"><span>or</span></div>'
    + (desk ? '<div class="ivq-card ivq-card--soft">' + handoff(true) + '</div>'
            : '<div class="ivq-card ivq-card--soft ivq-alt"><span class="ivq-row__i">' + ic('cam', 19) + '</span><div><b>Use your phone’s camera app</b><span>Open the Camera, point it at the QR on the sign and tap the link that appears. You’ll come straight back here.</span></div></div>');
};

/* ---------- visor de cámara (móvil: pantalla completa; escritorio: visor dentro de la página) ---------- */
function camera(kind){
  var wrong = kind === 'wrong', wk = wrongK();
  var feed = '<div class="ivq-cam__feed"><i class="ivq-cam__wall"></i><i class="ivq-cam__door"></i><div class="ivq-cam__pst' + (wrong && wk === 'blur' ? ' is-blur' : '') + '">' + poster(wrong && wk === 'other' ? 'Casa Bianca' : PROP, wrong && wk === 'other' ? 19 : 7) + '</div></div>';
  var top = '<div class="ivq-cam__top"><button type="button" class="ivq-cam__b" data-ivq="close" aria-label="Close">' + ic('x', 20, 2.4) + '</button><b>Scan the QR code</b><button type="button" class="ivq-cam__b" data-ivq="torch" aria-label="Flashlight" aria-pressed="false">' + ic('torch', 19) + '</button></div>';
  var frame = '<div class="ivq-cam__frame" data-ivq="frame">' + CORNERS + '<i class="ivq-cam__line"></i><span class="ivq-cam__ok">' + ic('check', 34, 3) + '</span></div>';
  var hint = '<p class="ivq-cam__hint" aria-live="polite"><span data-h="look">Position the QR code inside the frame</span><span data-h="read">Reading the code…</span><span data-h="done">You’re at ' + PROP + '</span><span data-h="bad">' + (wk === 'blur' ? 'Can’t read this QR' : 'This QR is for another property') + '</span></p>';
  var bottom = '<div class="ivq-cam__bot"><button type="button" class="ivq-cam__pill" data-ivq="where">' + ic('help', 17) + '<span>Where is the QR?</span></button></div>';
  var sheet = !wrong ? '' : '<div class="ivq-cam__sheet" role="alertdialog" aria-labelledby="ivq-wt"><span class="ivq-glyph ivq-glyph--bad ivq-glyph--s">' + ic(wk === 'blur' ? 'scan' : 'alert', 24, 2) + '</span>'
    + (wk === 'blur' ? '<h3 id="ivq-wt">We couldn’t read this QR</h3><p>Move a little closer and hold the phone still. Avoid reflections, and turn on the light if it’s dark.</p>'
                     : '<h3 id="ivq-wt">This QR is for another property</h3><p>It opens <b>Casa Bianca</b>, not ' + PROP + '. Look for the sign at the entrance of ' + PROP + '.</p>')
    + '<div class="ivq-cam__acts">' + btn('Continue scanning', 'rescan', { i: 'scan' }) + (wk === 'blur' ? '<button type="button" class="ivq-txt" data-ivq="torch">' + ic('torch', 17) + '<span>Turn on the light</span></button>' : '<button type="button" class="ivq-txt" data-ivq="where">' + ic('help', 17) + '<span>Where is the QR?</span></button>') + '</div></div>';
  return '<div class="ivq-cam' + (desk ? ' ivq-cam--d' : '') + '" data-st="' + (wrong ? 'bad' : 'look') + '" role="dialog" aria-label="Scan the QR code">' + feed + '<i class="ivq-cam__dim"></i>' + top + '<div class="ivq-cam__mid">' + frame + hint + '</div>' + (wrong ? '' : bottom) + sheet + '</div>';
}
var camT = [];
function camFlow(el){
  camT.forEach(clearTimeout); camT = [];
  var setSt = function(s){ el.setAttribute('data-st', s); };
  var read = function(){ if (el.getAttribute('data-st') !== 'look') return; setSt('read'); camT.push(setTimeout(function(){ setSt('done'); camT.push(setTimeout(function(){ go('ok'); }, 1100)); }, 1300)); };
  el._read = read;
  if (el.getAttribute('data-st') === 'look' && readK() === 'auto') camT.push(setTimeout(read, 3200));
}

/* ---------- buscar la reserva sin sesión (cámara del sistema → enlace del cartel) ---------- */
function lookup(){
  var PH = 'https://images.unsplash.com/photo-1758448500688-3ababa93fd67?w=1600&q=72&auto=format&fit=crop';
  return '<div class="ivq-lk" role="main"><div class="ivq-lk__hero"><img src="' + PH + '" alt=""><i class="ivq-lk__veil"></i>'
    + '<span class="ivq-lk__badge">' + ic('check', 13, 3) + 'QR scanned at the entrance</span>'
    + '<div class="ivq-lk__hb"><p class="ivq-lk__wel">Welcome to</p><h1>' + PROP + '</h1><p class="ivq-lk__loc">' + ic('pin', 15) + 'Albacete, Spain</p></div></div>'
    + '<div class="ivq-lk__col"><section class="ivq-lk__card" aria-labelledby="ivq-lkh"><h2 id="ivq-lkh">Let’s find your booking</h2><p class="ivq-lk__lead">To open identity verification, tell us whose booking it is. Your name and check-in date are enough.</p>'
    + '<div class="ivq-f" data-f="name"><label for="ivq-n">Name on the booking</label><div class="ivq-field">' + ic('user', 18) + '<input id="ivq-n" type="text" placeholder="e.g. Carmen Demo" autocomplete="name" autocapitalize="words" enterkeyhint="done"></div><p class="ivq-errt" hidden>Enter the name of whoever booked.</p></div>'
    + '<div class="ivq-f"><span class="ivq-f__l">Check-in date</span><div class="ivq-quick" role="group" aria-label="Check-in date"><button type="button" aria-pressed="true" class="ivq-q on" data-ivq="day" data-k="0">Today · 25 Nov</button><button type="button" aria-pressed="false" class="ivq-q" data-ivq="day" data-k="1">Yesterday</button><button type="button" aria-pressed="false" class="ivq-q" data-ivq="day" data-k="2">' + ic('cal', 14) + 'Other date</button></div></div>'
    + '<button type="button" class="ivq-link" data-ivq="noop">Use your booking code instead</button></section>'
    + '<div class="ivq-lk__dock">' + btn('Find my booking', 'find') + '<p class="ivq-lk__note">' + ic('shield', 14) + 'Only guests of this booking can verify here.</p></div></div></div>';
}

/* ---------- hoja «Where is the QR?» ---------- */
function whereSheet(){
  var s = document.createElement('div'); s.className = 'ivq-sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'ivq-sh');
  s.innerHTML = '<div class="ivq-sheet__p"><i class="ivq-sheet__grab"></i><button type="button" class="ivq-sheet__x" data-ivq="shx" aria-label="Close">' + ic('x', 18, 2.4) + '</button><div class="ivq-sheet__art">' + entrance() + '</div>'
    + '<h3 id="ivq-sh">On a sign next to the main door</h3><p>Look at eye level beside the entrance of ' + PROP + '. The sign says “Scan to verify your identity” and has the ' + PROP + ' name on top.</p>'
    + '<button type="button" class="ivq-row ivq-row--soft" data-ivq="noop"><span class="ivq-row__i">' + ic('chat', 19) + '</span><span class="ivq-row__t"><b>Can’t find it?</b><span>Message your host</span></span><span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span></button>'
    + btn('Got it', 'shx') + '</div>';
  document.body.appendChild(s); document.documentElement.classList.add('ivq-lock');
  requestAnimationFrame(function(){ s.classList.add('on'); });
}
function closeSheet(){ var s = document.querySelector('.ivq-sheet'); if (!s) return; s.classList.remove('on'); setTimeout(function(){ s.remove(); if (!document.querySelector('.ivq-cam:not(.ivq-cam--d),.ivq-lk')) document.documentElement.classList.remove('ivq-lock'); }, 220); }

/* ---------- montaje de la pantalla ---------- */
var mount = null, dockEl = null;
function dockSet(html){
  if (!dockEl) return;
  var w = dockEl.querySelector('.contents') || dockEl;
  if (desk || !html) { dockEl.style.display = 'none'; return; }
  dockEl.style.display = ''; dockEl.classList.add('ivq-dock'); w.innerHTML = html;
}
var DOCK = {
  before: function(){ return infoK() === 'p2' ? btn('Register your guests now', 'reg', { after: 'arrow' }) : ''; },
  day: function(){ return btn('Scan QR code', 'scan', { i: 'cam' }); },
  ok: function(){ return btn('Choose who to verify', 'pick', { after: 'arrow' }); },
  pick: function(){ var n = doneN(); return n >= 2 ? btn('Back to summary', 'home') : btn('Verify ' + GUESTS[Math.min(n, 1)].n.split(' ')[0], 'verify', { after: 'arrow' }); },
  denied: function(){ return btn('Try again', 'scan', { i: 'refresh' }); },
  after: function(){ return btn('Back to summary', 'home'); },
  desk: function(){ return btn('Email me the link', 'email', { i: 'mail' }); }
};
function render(){
  if (!mount) return;
  document.documentElement.setAttribute('data-ivq-state', state);
  [].forEach.call(document.querySelectorAll('.ivq-cam:not(.ivq-cam--d),.ivq-lk'), function(e){ e.remove(); });
  document.documentElement.classList.remove('ivq-lock');
  var full = !desk && (state === 'scan' || state === 'wrong') || state === 'lookup';
  var body = '';
  if (state === 'scan' || state === 'wrong') body = desk ? camera(state === 'wrong' ? 'wrong' : 'scan') + '<p class="ivq-dnote">' + ic('phone', 16) + '<span>Laptop cameras struggle with printed codes. <button type="button" class="ivq-link" data-ivq="desk">Continue on your phone</button></span></p>' : V.day();
  else if (state === 'lookup') body = V.day();
  else body = (V[state] || V.day)();
  mount.innerHTML = '<div class="ivq-wrap" data-s="' + state + '">' + body + '</div>';
  var sub = document.querySelector('.ivq-view p[class*="max-w-[480px]"]');   /* escritorio: el subtítulo de la página cuenta en qué punto estás */
  if (sub) sub.textContent = { before: 'Opens on check-in day, ' + CIN + ', at the entrance of ' + PROP + '.', ok: 'You’re at the property. Now verify each guest.', pick: 'You’re at the property. Now verify each guest.', after: 'Your stay at ' + PROP + ' has ended.' }[state] || 'Scan the QR at the entrance, then verify each guest.';
  dockSet(DOCK[state] && !full ? DOCK[state]() : '');
  if (desk) velaInfo(state === 'before' && infoK() === 'p1');
  if (full) {
    var f = document.createElement('div'); f.innerHTML = state === 'lookup' ? lookup() : camera(state === 'wrong' ? 'wrong' : 'scan');
    var el = f.firstChild; document.body.appendChild(el); document.documentElement.classList.add('ivq-lock');
    if (state === 'scan') camFlow(el);
  } else if (state === 'scan') camFlow(mount.querySelector('.ivq-cam'));
}
/* vista «Móvil + escritorio»: lo que no navega (hoja, linterna, pestañas…) se repite en el otro marco. Los textos no coinciden entre móvil y escritorio,
   así que se envía la acción (como las puertas de «Virtual keys», mensaje ui-door que reenvía split.html) y panel.js deja de reenviar estas pulsaciones */
var MIRROR = { av: 1, where: 1, shx: 1, torch: 1, frame: 1, rescan: 1, how: 1, day: 1, copy: 1, email: 1 }, mirroring = false;
function mirror(a, k){ if (mirroring) return; try { var T = window.top; if (T === window || !T.__phoneSplit) return; T.postMessage({ rep: 'ui-door', w: 'ivq', a: a, k: k || '' }, '*'); } catch (_) {} }
window.addEventListener('message', function(ev){
  var m = ev.data; if (!m || m.rep !== 'ui-door' || m.w !== 'ivq' || !MIRROR[m.a]) return;
  var sel = '[data-ivq="' + m.a + '"]' + (m.k ? '[data-k="' + m.k + '"]' : ''), all = document.querySelectorAll(sel);
  var el = [].filter.call(all, function(x){ return x.getClientRects().length; })[0] || all[0];
  mirroring = true;
  try { if (el) act(m.a, el); else if (m.a === 'where') whereSheet(); else if (m.a === 'shx') closeSheet(); } catch (_) {}
  mirroring = false;
});
function onClick(e){
  var t = e.target.closest('[data-ivq]:not(html)'); if (!t) { if (e.target.classList && e.target.classList.contains('ivq-sheet')) { mirror('shx'); closeSheet(); } return; }
  var a = t.getAttribute('data-ivq'); e.preventDefault();
  if (MIRROR[a]) mirror(a, t.getAttribute('data-k'));
  act(a, t);
}
function act(a, t){
  var cam = t.closest('.ivq-cam');
  if (a === 'scan') go('scan');
  else if (a === 'pick') go('pick');
  else if (a === 'home') location.href = 'home' + EXT;
  else if (a === 'desk') go('desk');
  else if (a === 'close') go('day');
  else if (a === 'verify') location.href = 'iv-intro-h' + EXT;
  else if (a === 'reg') location.href = HUB();
  else if (a === 'av') { var i = +t.getAttribute('data-k'), box = t.closest('.ivq-ask'); box.querySelector('.vk-av__chat').innerHTML = askMsg(ASK[i]); [].forEach.call(box.querySelectorAll('.vk-av__row'), function(b){ b.classList.toggle('on', b === t); }); }
  else if (a === 'where') whereSheet();
  else if (a === 'shx') closeSheet();
  else if (a === 'torch') { var c = cam || document.querySelector('.ivq-cam'); if (!c) return; var on = !c.classList.contains('is-torch'); c.classList.toggle('is-torch', on); [].forEach.call(c.querySelectorAll('[data-ivq="torch"][aria-pressed]'), function(b){ b.setAttribute('aria-pressed', String(on)); }); }
  else if (a === 'frame') { if (cam && cam._read) cam._read(); }
  else if (a === 'rescan') {   /* «Continue scanning»: vuelve al visor apuntando ya al cartel bueno */
    var nc = document.createElement('div'); state = 'scan'; nc.innerHTML = camera('scan'); var el = nc.firstChild; cam.parentNode.replaceChild(el, cam); camFlow(el);
  }
  else if (a === 'how') { var k = t.getAttribute('data-k'), card = t.closest('.ivq-card'); [].forEach.call(card.querySelectorAll('[data-ivq="how"]'), function(b){ var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); [].forEach.call(card.querySelectorAll('.ivq-how'), function(o){ o.hidden = o.getAttribute('data-how') !== k; }); }
  else if (a === 'day') { [].forEach.call(t.parentNode.querySelectorAll('.ivq-q'), function(b){ var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); }
  else if (a === 'find') {
    var f = document.querySelector('.ivq-lk [data-f="name"]'), inp = f && f.querySelector('input'), er = f && f.querySelector('.ivq-errt');
    if (inp && !inp.value.trim()) { f.classList.add('ivq-err'); er.hidden = false; inp.focus(); return; }
    t.classList.add('is-busy'); t.querySelector('span').textContent = 'Looking for your booking…'; t.setAttribute('aria-busy', 'true');
    setTimeout(function(){ location.href = 'ivqr-ok' + EXT + '?from=lookup'; }, 1100);
  }
  else if (a === 'copy' || a === 'email') { var sp = t.querySelector('span'), o = sp.getAttribute('data-l') || sp.textContent; sp.setAttribute('data-l', o); sp.textContent = a === 'copy' ? 'Copied' : 'Sent to ' + EMAIL; t.classList.add('is-ok'); if (a === 'copy') try { navigator.clipboard.writeText('https://guest.chekin.com/v/CHK-4829'); } catch (_) {} clearTimeout(t._t); t._t = setTimeout(function(){ sp.textContent = o; t.classList.remove('is-ok'); }, 1800); }
}
function initScreen(){
  var root = document.querySelector('.ivq-view'), old = root && root.querySelector('.ivq-old'); if (!old) return;
  mount = document.createElement('div'); mount.className = 'ivq-mount'; old.parentNode.insertBefore(mount, old);
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  render();
  document.addEventListener('click', onClick, true);
  document.addEventListener('input', function(e){ var f = e.target.closest && e.target.closest('.ivq-f.ivq-err'); if (f) { f.classList.remove('ivq-err'); f.querySelector('.ivq-errt').hidden = true; } });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
}

/* ---------- tarjeta de la Home (opcional: «Home card» en el cuadro) ---------- */
function homeCard(){
  var old = document.querySelector('.ivq-home'); if (old) old.remove();
  if (!homeOn()) return;
  var n4 = document.querySelector('.chk-vn4'); if (!n4) return;
  var last = LS.get('replica-ivq-last', 'before'), st = last === 'before' || last === 'after' ? last : 'day';
  var CHV = '<span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span>';
  var C = {
    before: ['Identity check', 'Opens ' + CIN + ' at the property', CHV],
    day: ['Identity check', 'Scan the QR at the entrance', '<span class="ivq-mini">' + ic('cam', 15) + 'Scan QR</span>'],
    after: ['Identity check', 'Closed after check-out', CHV]
  }[st];
  var a = document.createElement('a'); a.className = 'ivq-home'; a.href = 'ivqr-' + st + EXT; a.setAttribute('data-st', st);
  a.innerHTML = '<span class="ivq-home__i">' + ic(st === 'before' ? 'lock' : 'qr', 20) + '</span><span class="ivq-home__t"><b>' + C[0] + '</b><span>' + C[1] + '</span></span>' + C[2];
  n4.insertAdjacentElement('afterend', a);
}
P.lock = '<rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';

/* ---------- cuadro: grupo «IV at property (QR)» (en todas las pantallas) ---------- */
var sw = document.createElement('div'); sw.className = 'acc-switch vk-sw-lb ivq-sw';
var b = function(g, k, l, on){ return '<button type="button" data-g="' + g + '" data-k="' + k + '" class="' + (on ? 'on' : '') + '">' + l + '</button>'; };
function paintSw(){
  var w = wrongK(), d = doneN(), r = readK(), h = homeOn();
  sw.innerHTML = ivdRow() + '<span>Pantalla</span>' + STATES.map(function(s){ return b('s', s, NAMES[s], s === state); }).join('')
    + '<span>Info</span>' + [['cur', 'Actual'], ['p1', 'P1 · Vela'], ['p2', 'P2 · Dentro de la tarjeta'], ['p3', 'P3 · Filas de acción']].map(function(o){ return b('info', o[0], o[1], infoK() === o[0]); }).join('')
    + '<span>Tarjeta en la Home</span>' + b('home', '1', 'Sí', h) + b('home', '0', 'No', !h)
    + '<span>QR erróneo</span>' + b('wrong', 'other', 'Otra propiedad', w === 'other') + b('wrong', 'blur', 'Ilegible', w === 'blur')
    + '<span>Lectura del QR</span>' + b('read', 'auto', 'Automática', r === 'auto') + b('read', 'tap', 'Al tocar el marco', r === 'tap')
    + '<span>Huéspedes verificados</span>' + b('done', '0', '0', d === 0) + b('done', '1', '1', d === 1) + b('done', '2', '2', d === 2);
}
sw.addEventListener('click', function(e){
  var t = e.target.closest('button'); if (!t) return; e.preventDefault(); e.stopPropagation();
  var g = t.getAttribute('data-g'), k = t.getAttribute('data-k');
  if (g === 'ivd') { ivdGo(k); return; }
  if (g === 's') { LS.set('replica-ivq-last', k); location.href = 'ivqr-' + k + EXT; return; }
  if (g === 'info') { LS.set('replica-ivq-info', k); if (isQ && state !== 'before') { LS.set('replica-ivq-last', 'before'); location.href = 'ivqr-before' + EXT; return; } }
  if (g === 'home') LS.set('replica-ivq-home', k); else if (g === 'wrong') LS.set('replica-ivq-wrong', k); else if (g === 'read') LS.set('replica-ivq-read', k); else if (g === 'done') LS.set('replica-ivq-done', k);
  paintSw();
  if (isQ) render(); if (isHome) homeCard();
  if (g === 'wrong' && isQ && state !== 'wrong') { LS.set('replica-ivq-last', 'wrong'); location.href = 'ivqr-wrong' + EXT; }
  if (g === 'done' && isQ && state !== 'pick') { LS.set('replica-ivq-last', 'pick'); location.href = 'ivqr-pick' + EXT; }
}, true);

function init(){
  if (isQ) { LS.set('replica-ivq-last', state); initScreen(); }
  paintSw();
  if (!isQ && (NEWQ || IVD !== 'old')) return;   /* #1099: el grupo antiguo solo con el diseño antiguo */
  if (window.__repPanel) window.__repPanel.add('IV at property (QR)', sw, isQ ? 19 : 34); else if (isQ) document.body.appendChild(sw);
  if (isHome) { homeCard(); setTimeout(homeCard, 400); }
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
