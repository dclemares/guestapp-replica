/* =====================================================================================
   #1100 · IV con QR en la propiedad (Italia) · OLD DESIGN V2
   Las pantallas y los casos de uso del diseño nuevo (#1098, especificación de producción: A · enlace de la reserva y
   B · QR de la propiedad) con el aspecto del diseño antiguo (#1095–#1097): tarjetas Aurora, cartel con el marco de
   escaneo, filas de cristal, éxito con el aro que se dibuja. Pantallas ivqr-v2-a-* / ivqr-v2-b-*.
   Plazo: desde el día antes del check-in (24 Nov) hasta el check-out (27 Nov). Sin estado.
   ===================================================================================== */
(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var desk = /\.d\.html/.test(location.pathname), EXT = desk ? '.d.html' : '.m.html';
var LS = { get: function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} } };
var SA = ['registered', 'sum-before', 'sum-in', 'intro', 'scan', 'wrong', 'outside', 'unreadable', 'denied', 'desk'];
var SB = ['landing', 'find', 'multi', 'notfound', 'unreg', 'ivstart', 'done-all', 'done-rem', 'outside'];
var NA = { registered: 'Registrado (fuera de plazo)', 'sum-before': 'Resumen (fuera de plazo)', 'sum-in': 'Resumen (en plazo)', intro: 'Intro del escaneo', scan: 'Escáner', wrong: 'Propiedad equivocada', outside: 'Fuera de plazo', unreadable: 'Ilegible', denied: 'Cámara denegada', desk: 'Escritorio' };
var NB = { landing: 'Portada', find: 'Buscar', multi: 'Varias reservas (+ dato)', notfound: 'No encontrada', unreg: 'Sin registrar → registro', ivstart: 'Inicio de la IV', 'done-all': 'Final (todos)', 'done-rem': 'Final (quedan huéspedes)', outside: 'Fuera de plazo' };
var m = /^ivqr-v2-(a|b)-(.+)$/.exec(SID), flow = m ? m[1] : '', state = m ? m[2] : '';
var isQ = !!m;

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


var PROP = 'Villa Calipso', CIN = 'Wed 25 Nov', WIN_FROM = '24 Nov 2026', WIN = '24–27 Nov 2026', EMAIL = 'carmen.demo@gmail.com';
var GUESTS = [{ n: 'Carmen Demo', r: 'Lead guest', a: 'CD' }, { n: 'Marco Rossi', r: 'Guest 2', a: 'MR' }];
var go = function(s){ location.href = 'ivqr-v2-' + s + EXT; };
var IVSTD = function(){ return 'g2-ivh' + EXT; };   /* el flujo de IV estándar de la réplica (documento + selfie) */
/* ajustes de vista del cuadro (nunca el resultado del flujo) */
var resK = function(){ var v = LS.get('replica-ivqb-res', 'one'); return ['one', 'multi', 'none', 'unreg'].indexOf(v) > -1 ? v : 'one'; };
var fieldK = function(){ var v = LS.get('replica-ivqb-field', 'doc'); return ['doc', 'dob', 'cout'].indexOf(v) > -1 ? v : 'doc'; };
var matchK = function(){ return LS.get('replica-ivqb-match', 'yes') === 'no' ? 'no' : 'yes'; };
var readK = function(){ return LS.get('replica-ivq-read', 'auto') === 'tap' ? 'tap' : 'auto'; };

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

var V = {};
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


P.userp = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>';
P.send = '<path d="M21 3 10 14"/><path d="M21 3 14.500 21l-4.500-7-7-4.500z"/>';
var thumb = function(){ return '<span class="ivq-thumb">' + entrance().replace('viewBox="0 0 320 190"', 'viewBox="150 22 132 112"').replace('<svg class="ivq-ent"', '<svg class="ivq-ent" preserveAspectRatio="xMidYMid slice"') + '</span>'; };
var POINTS = ['Verify your presence at the property', 'Access identity verification (document + selfie)', 'Complete the check-in process'];
/* bloque «Look for the QR code»: se puede pulsar (abre dónde está el cartel) */
var look = function(){ return '<button type="button" class="ivq-look" data-ivq="where">' + thumb() + '<span class="ivq-look__t"><b>Look for the QR code</b><span>Available from the day before check-in: ' + WIN_FROM + '</span></span><span class="ivq-look__c">' + ic('chev', 18, 2.4) + '</span></button>'; };
/* caja azul (fuera de plazo) / verde (en plazo) */
var box = function(tone, icon, title, text, pts, extra){
  return '<div class="ivq-box" data-tone="' + tone + '"><div class="ivq-box__h"><span class="ivq-box__i">' + ic(icon, 18) + '</span><b>' + title + '</b></div>' + (text ? '<p>' + text + '</p>' : '')
    + (pts ? '<ul class="ivq-pts">' + pts.map(function(t){ return '<li><i>' + ic('check', 13, 3) + '</i>' + t + '</li>'; }).join('') + '</ul>' : '') + (extra || '') + '</div>';
};
/* piezas del diseño antiguo con los textos de producción */
var ART = function(){ return '<div class="ivq-au__art"><div class="ivq-artbox">' + poster() + CORNERS + '</div></div>'; };
var OPENS = '<span class="ivq-badge">' + ic('cal', 15) + 'Opens 24 Nov · the day before check-in</span>';
var LIVE = function(t){ return '<span class="ivq-badge ivq-badge--ok"><i class="ivq-live"></i>' + t + '</span>'; };
var GLYPH = '<div class="ivq-glyph">' + ic('qr', 30, 1.8) + '<i>' + ic('clock', 14, 2.4) + '</i></div>';
var STEPS3 = [['Verify your presence at the property', 'Scan the QR on the sign at the entrance'], ['Access identity verification', 'A photo of your ID (document) and a selfie'], ['Complete the check-in process', 'Every guest, about 2 minutes each']];
var CHECKS3 = function(done){ return checks([['pin', 'Verify your presence at the property', 'The QR only works at the entrance'], ['shield', 'Access identity verification', 'Document + selfie'], ['users', 'Complete the check-in process', (done || 0) + ' of 2 guests verified']]); };
/* registrado (fuera de plazo): tarjeta Aurora «QR scan required at property» + «Look for the QR code» */
var BOX_REQ = function(){ return hero('info', '<div class="ivq-au__in"><div class="ivq-au__main">' + OPENS + '<h3>QR scan required at property</h3><p>When you arrive at the property, you must scan the QR code located at the entrance to confirm your identity and complete verification.</p></div>'
  + '<div class="ivq-au__side"><p class="ivq-au__eye">When you arrive</p>' + steps(STEPS3) + '</div></div>') + '<div class="ivq-rows ivq-rows--v2">' + look() + '</div>'; };
var guests = function(){ return label('Guests · 2 of 2 registered') + '<div class="ivq-gl">' + GUESTS.map(function(g){ return '<button type="button" class="ivq-g ivq-g--btn" data-ivq="guest"><span class="ivq-g__a">' + g.a + '</span><span class="ivq-g__t"><b>' + g.n + '</b><span>' + g.r + ' · Registered</span></span><span class="ivq-tag ivq-tag--warn"><i class="ivq-dot"></i>Verification pending</span><span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span></button>'; }).join('') + '</div>'; };
var A = {};
A.sum = function(inWin){
  if (!inWin) return hero('info', '<div class="ivq-au__in"><div class="ivq-au__main">' + OPENS + GLYPH + '<h3>Verification process required upon arrival</h3><p>To complete your check-in, you must scan the QR code located at the property entrance upon arrival. This will allow you to verify your identity and access your accommodation.</p></div>'
    + '<div class="ivq-au__side"><p class="ivq-au__eye">What you’ll do when you arrive</p>' + steps(STEPS3) + '</div></div>') + '<div class="ivq-rows ivq-rows--v2">' + look() + '</div>' + guests();
  return hero('ok', '<div class="ivq-au__in"><div class="ivq-au__main">' + LIVE('Verification open · until 27 Nov') + '<h3>Verification process available</h3><p>The identity verification process is now available. Complete the verification by scanning the QR code at the property entrance to access your accommodation.</p>'
    + (desk ? '' : ART()) + CHECKS3() + '</div>' + (desk ? '<div class="ivq-au__side ivq-au__art--d">' + ART() + '</div>' : '') + '</div>') + guests();
};
/* «Scan QR Code at Property»: la tarjeta del día del check-in del diseño antiguo */
A.intro = function(handoffToo){
  var side = desk ? '<div class="ivq-au__side ivq-au__side--ho">' + handoff(true) + '</div>' : '';
  return hero('ok', '<div class="ivq-au__in"><div class="ivq-au__main">' + LIVE('First step to complete your check-in') + '<h3>Scan QR Code at Property</h3><p>Scan the QR code located at the property entrance. It confirms you’re at the property and opens identity verification.</p>'
    + (desk ? '' : ART()) + '<p class="ivq-au__eye ivq-au__eye--req">QR Code Required</p>' + CHECKS3()
    + (desk ? '<div class="ivq-acts ivq-acts--in">' + btn('Continue to Scan', 'scan', { cls: 'ivq-btn--w', i: 'cam' }) + '<button type="button" class="ivq-txt ivq-txt--w" data-ivq="back"><span>Back</span></button></div>' : '') + '</div>' + side + '</div>')
    + '<div class="ivq-rows ivq-rows--v2">' + look() + '</div>'
    + (handoffToo && !desk ? '<div class="ivq-card ivq-card--soft ivq-ho2">' + handoff(true) + '</div>' : '');
};
/* escritorio: «Continue on your phone» del diseño antiguo, como bloque secundario de la intro */
A.desk = function(){
  return hero('info', '<div class="ivq-au__in ivq-au__in--ho"><div class="ivq-au__main"><span class="ivq-badge">' + ic('laptop', 15) + 'You’re on a computer</span>'
    + '<h3>Continue on your phone</h3><p>Identity verification needs your phone’s camera at the entrance of ' + PROP + '. You stay signed in, nothing to type.</p>'
    + steps([['Open your phone’s camera', 'No app needed'], ['Point it at this code', 'Tap the link that appears'], ['Scan the QR at the entrance', 'Then verify your identity']]) + '</div>'
    + '<div class="ivq-au__side ivq-au__side--ho">' + handoff(false, true) + '</div></div>')
    + '<div class="ivq-rows ivq-rows--v2">' + look() + '</div>';
};
A.denied = V.denied;

/* ===================== FLUJO B · QR de la propiedad (web pública) ===================== */
var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><linearGradient id="ivqvc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fd0ea"/><stop offset="1" stop-color="#3556c4"/></linearGradient></defs><path d="M6 33V17a14 14 0 0 1 28 0v16" fill="none" stroke="url(#ivqvc)" stroke-width="1.6" stroke-linecap="round"/><path d="M15.500 29c.600-5 .300-9-1.500-13" fill="none" stroke="url(#ivqvc)" stroke-width="1.800" stroke-linecap="round"/><path d="M14 16c-3-2-6-1.500-7.500.500 2.500-.500 5 0 7.500-.500zM14 16c1-3 4-4.500 6.500-4-2 .800-4.500 2.500-6.500 4zM14 16c-1.500-2.500-1-5.500 1-7-.500 2.500-.500 4.500-1 7zM14 16c3-.500 6 .500 7.500 3-2.500-1.500-5-2-7.500-3z" fill="url(#ivqvc)"/><path d="M24 29.500c.300-3.500 0-6-1.300-8.500" fill="none" stroke="url(#ivqvc)" stroke-width="1.500" stroke-linecap="round"/><path d="M22.700 21c-2.200-1.200-4.300-.700-5.300.700 1.800-.300 3.500.100 5.300-.700zM22.700 21c.800-2.200 3-3.200 4.800-2.800-1.500.600-3.300 1.700-4.800 2.800zM22.700 21c2.200-.200 4.300.600 5.300 2.300-1.800-1.100-3.600-1.500-5.300-2.300z" fill="url(#ivqvc)"/><path d="M4 31c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0M4 35c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0" fill="none" stroke="url(#ivqvc)" stroke-width="1.600" stroke-linecap="round"/></svg>';
var PH = 'https://images.unsplash.com/photo-1758448500688-3ababa93fd67?w=1600&q=72&auto=format&fit=crop';
var field = function(id, lab, ph, val, extra){ return '<div class="ivq-f" data-f="' + id + '"><label for="ivq-' + id + '">' + lab + '</label><div class="ivq-field"><input id="ivq-' + id + '" type="text" placeholder="' + ph + '"' + (val ? ' value="' + esc(val) + '"' : '') + (extra || '') + '></div><p class="ivq-errt" hidden></p></div>'; };
var glyph = function(i, tone){ return '<span class="ivq-bg' + (tone ? ' ivq-bg--' + tone : '') + '">' + ic(i, 26, 1.9) + '</span>'; };
var doneMark = '<div class="ivq-done ivq-done--l"><svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="ivq-done__c" cx="26" cy="26" r="23"/><path class="ivq-done__k" d="m15.500 26.500 7 7 14-15"/></svg></div>';
var auB = function(tone, inner){ return hero(tone, '<div class="ivq-au__in ivq-au__in--c">' + inner + '</div>'); };
var DONE = '<div class="ivq-done"><svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="ivq-done__c" cx="26" cy="26" r="23"/><path class="ivq-done__k" d="m15.500 26.500 7 7 14-15"/></svg></div>';
var SCANNED = '<p class="ivq-eyb">' + ic('check', 13, 3) + 'QR scanned at the entrance</p>';
var B = {
  landing: function(){ return [SCANNED + '<h2>Verify your identity at the property</h2><p class="ivq-lk__lead">Enter your name to find your reservation and start the identity verification process.</p>'
    + '<div class="ivq-pitems"><span>' + ic('id', 18) + 'Scan your ID</span><span>' + ic('smile', 18) + 'Take a selfie</span></div><p class="ivq-pnote">' + ic('id', 17) + '<span>You will be asked to scan your ID and take a selfie.</span></p>', btn('Start', 'b-find', { after: 'arrow' })]; },
  find: function(pre){ return ['<button type="button" class="ivq-bback" data-ivq="b-landing">' + ic('chev', 16, 2.4) + 'Back</button><h2>Find your reservation</h2><p class="ivq-lk__lead">Enter your name as it appears on the reservation</p>'
    + field('fn', 'First name', 'e.g. Carmen', pre ? 'Carmen' : '', ' autocomplete="given-name" autocapitalize="words"') + field('ln', 'Last name', 'e.g. Demo', pre ? 'Demo' : '', ' autocomplete="family-name" autocapitalize="words"'),
    btn('Find reservation', 'b-search', { extra: pre ? '' : ' disabled' })]; },
  notfound: function(){ return [auB('off', '<div class="ivq-glyph ivq-glyph--off">' + ic('search', 30, 1.8) + '</div><p class="ivq-au__eye">No match</p><h3>We couldn’t find your reservation</h3><p>We couldn’t find any reservation with that information. Try again or use the reservation link sent by the property.</p>'), btn('Try again', 'b-find') + '<button type="button" class="ivq-txt" data-ivq="b-landing"><span>Back to start</span></button>']; },
  unreg: function(){ return [hero('info', '<div class="ivq-au__in ivq-au__in--pick"><div class="ivq-au__main">' + LIVE('Reservation found') + '<h3>Complete your registration first</h3><p>Carmen, your guest details aren’t registered yet. Fill them in here and then verify your identity.</p>'
    + steps([['Guest registration', 'Your personal and ID details · about 2 min'], ['Identity verification', 'Scan your ID and take a selfie']]) + '</div></div>'), btn('Start registration', 'b-form', { after: 'arrow' })]; },
  ivstart: function(){ return [hero('ok', '<div class="ivq-au__in ivq-au__in--pick"><div class="ivq-au__main">' + LIVE('Reservation found · at the property') + '<h3>Identity verification</h3><p>To complete your check-in, we need to verify your identity. This process is secure and only takes a few seconds.</p>'
    + checks([['id', 'Scan your ID', 'Passport or ID card'], ['smile', 'Take a selfie', 'To match the photo on the ID']]) + '</div></div>'), btn('Start verification', 'b-iv', { after: 'arrow' })]; },
  'done-all': function(){ return [auB('ok', DONE + '<p class="ivq-au__eye">Check-in complete</p><h3>Identity successfully verified</h3><p>Everyone in your reservation is verified. Your check-in at ' + PROP + ' is complete.</p><div class="ivq-meta"><span>' + ic('users', 15) + '2 of 2 guests verified</span></div>'), btn('View guest summary', 'b-hub')]; },
  'done-rem': function(){ return [auB('ok', DONE + '<p class="ivq-au__eye">Identity verified</p><h3>Identity successfully verified</h3><p>Ask the other guests to validate their identity.</p><div class="ivq-meta"><span>' + ic('userp', 15) + '1 guest remaining to register</span></div>'), btn('View guest summary', 'b-hub')]; },
  outside: function(){ return [auB('off', '<div class="ivq-glyph ivq-glyph--off">' + ic('calX', 30, 1.8) + '</div><p class="ivq-au__eye">Outside check-in period</p><h3>Identity verification not available</h3><p>You can verify your identity at the property from the day before check-in until check-out.</p><div class="ivq-meta"><span>' + ic('cal', 15) + 'Available ' + WIN + '</span></div>'), btn('Back to start', 'b-landing')]; }
};
B.multi = B.find;
var FIELD = { doc: ['Document number', 'ID, passport, etc.'], dob: ['Date of birth', 'DD/MM/YYYY'], cout: ['Check-out date', 'DD/MM/YYYY'] };
function multiModal(){
  var f = FIELD[fieldK()];
  return '<div class="ivq-sheet ivq-sheet--b on" role="dialog" aria-modal="true" aria-labelledby="ivq-mh"><div class="ivq-sheet__p"><i class="ivq-sheet__grab"></i><span class="ivq-bg">' + ic('users', 24, 1.9) + '</span><h3 id="ivq-mh">We found multiple reservations</h3><p>To make sure it’s really you, we need one more detail.</p>'
    + field('x', f[0], f[1], '', fieldK() === 'doc' ? ' autocapitalize="characters"' : ' inputmode="numeric"')
    + '<div class="ivq-macts">' + btn('Continue', 'b-cont', { extra: ' disabled' }) + '<button type="button" class="ivq-txt" data-ivq="b-cancel"><span>Cancel</span></button></div></div></div>';
}
function bPage(st){
  var c = (B[st] || B.landing)(st === 'multi');
  return '<div class="ivq-lk ivq-pb" data-b="' + st + '"><div class="ivq-lk__hero"><img src="' + PH + '" alt=""><i class="ivq-lk__veil"></i>'
    + '<span class="ivq-pbrand"><span class="ivq-pbrand__l">' + LOGO + '</span>' + PROP + '</span>'
    + '<div class="ivq-lk__hb"><p class="ivq-lk__wel">Welcome to</p><h1>' + PROP + '</h1><p class="ivq-lk__loc">' + ic('pin', 15) + 'Albacete, Spain</p></div></div>'
    + '<div class="ivq-lk__col"><section class="ivq-lk__card">' + c[0] + '</section><div class="ivq-lk__dock">' + c[1] + '</div></div>'
    + '<p class="ivq-pby">Identity check by Chekin</p></div>';
}

/* ---------- visor de cámara (A): móvil a pantalla completa, escritorio dentro de la página ---------- */
var ERR = {
  wrong: ['alert', 'Wrong QR code', 'This QR code does not belong to this property. Please scan the QR code located at the property entrance.', function(){ return btn('Try again', 'rescan', { i: 'scan' }) + '<button type="button" class="ivq-txt" data-ivq="back"><span>Back</span></button>'; }],
  outside: ['cal', 'Outside the verification period', 'Identity verification is only available from the day before your check-in until check-out. Please try again when you arrive at the property.', function(){ return '<p class="ivq-cam__date">' + ic('cal', 15) + 'Available ' + WIN + '</p>' + btn('Back to summary', 'sum'); }],
  unreadable: ['scan', 'Couldn’t read the QR code', 'We couldn’t read this QR code. Please make sure it’s clearly visible and try again.', function(){ return btn('Try again', 'rescan', { i: 'scan' }) + '<button type="button" class="ivq-txt" data-ivq="torch">' + ic('torch', 17) + '<span>Turn on the light</span></button>'; }]
};
function camera(kind){
  var e = ERR[kind];
  var feed = '<div class="ivq-cam__feed"><i class="ivq-cam__wall"></i><div class="ivq-cam__pst' + (kind === 'unreadable' ? ' is-blur' : '') + '">' + poster(kind === 'wrong' ? 'Casa Bianca' : PROP, kind === 'wrong' ? 19 : 7) + '</div></div>';
  var top = '<div class="ivq-cam__top"><button type="button" class="ivq-cam__b" data-ivq="close" aria-label="Close">' + ic('x', 20, 2.4) + '</button><b>Scan the QR code</b><button type="button" class="ivq-cam__b" data-ivq="torch" aria-label="Flashlight" aria-pressed="false">' + ic('torch', 19) + '</button></div>';
  var frame = '<div class="ivq-cam__frame" data-ivq="frame">' + CORNERS + '<i class="ivq-cam__line"></i><span class="ivq-cam__ok">' + ic('check', 34, 3) + '</span></div>';
  var hint = '<p class="ivq-cam__hint" aria-live="polite"><span data-h="look">Position the QR code inside the frame</span><span data-h="read">Reading the code…</span><span data-h="done">QR code verified</span></p>';
  var bottom = '<div class="ivq-cam__bot"><div class="ivq-cam__info"><b><i class="ivq-live"></i>Check-in day active</b><span>After scanning the QR, you can access the full identity verification process.</span></div></div>';
  var sheet = !e ? '' : '<div class="ivq-cam__sheet" role="alertdialog" aria-labelledby="ivq-wt"><span class="ivq-glyph ivq-glyph--bad ivq-glyph--s">' + ic(e[0], 24, 2) + '</span><h3 id="ivq-wt">' + e[1] + '</h3><p>' + e[2] + '</p><div class="ivq-cam__acts">' + e[3]() + '</div></div>';
  return '<div class="ivq-cam' + (desk ? ' ivq-cam--d' : '') + '" data-st="' + (e ? 'bad' : 'look') + '" role="dialog" aria-label="Scan the QR code">' + feed + '<i class="ivq-cam__dim"></i>' + top + '<div class="ivq-cam__mid">' + frame + hint + '</div>' + (e ? '' : bottom) + sheet + '</div>';
}
var camT = [];
function camFlow(el){
  camT.forEach(clearTimeout); camT = [];
  var setSt = function(s){ el.setAttribute('data-st', s); };
  var read = function(){ if (el.getAttribute('data-st') !== 'look') return; setSt('read'); camT.push(setTimeout(function(){ setSt('done'); camT.push(setTimeout(function(){ location.href = IVSTD(); }, 1000)); }, 1300)); };   /* QR válido: directo a la IV estándar */
  el._read = read;
  if (el.getAttribute('data-st') === 'look' && readK() === 'auto') camT.push(setTimeout(read, 3200));
}

/* ---------- hojas ---------- */
function sheet(inner, cls){
  closeSheet(true);
  var s = document.createElement('div'); s.className = 'ivq-sheet' + (cls ? ' ' + cls : ''); s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'ivq-sh');
  s.innerHTML = '<div class="ivq-sheet__p"><i class="ivq-sheet__grab"></i><button type="button" class="ivq-sheet__x" data-ivq="shx" aria-label="Close">' + ic('x', 18, 2.4) + '</button>' + inner + '</div>';
  document.body.appendChild(s); document.documentElement.classList.add('ivq-lock');
  requestAnimationFrame(function(){ s.classList.add('on'); });
}
function whereSheet(){
  sheet('<div class="ivq-sheet__art">' + entrance() + '</div><h3 id="ivq-sh">On a sign next to the main door</h3><p>Look at eye level beside the entrance of ' + PROP + '. The sign says “Scan to verify your identity” and has the ' + PROP + ' name on top.</p>'
    + '<button type="button" class="ivq-row ivq-row--soft" data-ivq="noop"><span class="ivq-row__i">' + ic('chat', 19) + '</span><span class="ivq-row__t"><b>Can’t find it?</b><span>Message your host</span></span><span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span></button>' + btn('Got it', 'shx'));
}
/* resumen fuera de plazo: al pulsar un huésped */
function outsideSheet(){
  sheet('<span class="ivq-bg ivq-bg--warn">' + ic('cal', 24, 1.9) + '</span><h3 id="ivq-sh">Verification isn’t available yet</h3><p>Identity verification opens the day before check-in and stays open until check-out. When you arrive, scan the QR code at the property entrance to verify your identity.</p>'
    + '<div class="ivq-pdate">' + ic('cal', 17) + '<span>Available <b>' + WIN + '</b><br>Check-in: ' + CIN + ' 2026</span></div>' + btn('Got it', 'shx'), 'ivq-sheet--c');
}
function closeSheet(now){ var s = document.querySelector('.ivq-sheet:not(.ivq-sheet--b)'); if (!s) return; s.classList.remove('on'); var rm = function(){ s.remove(); if (!document.querySelector('.ivq-cam:not(.ivq-cam--d),.ivq-lk')) document.documentElement.classList.remove('ivq-lock'); }; if (now === true) rm(); else setTimeout(rm, 220); }

/* ---------- montaje ---------- */
var mount = null, dockEl = null;
function dockSet(html){
  if (!dockEl) return;
  var w = dockEl.querySelector('.contents') || dockEl;
  if (desk || !html) { dockEl.style.display = 'none'; return; }
  dockEl.style.display = ''; dockEl.classList.add('ivq-dock'); w.innerHTML = html;
}
var HEAD = { 'sum-before': ['Guest summary', 'Guest <span>summary</span>', 'Registration is done. Identity verification happens at the property.'], 'sum-in': ['Guest summary', 'Guest <span>summary</span>', 'Registration is done. Identity verification is now available at the property.'] };
function heads(){
  var hd = HEAD[state] || ['Identity verification', 'Identity <span>verification</span>', 'Scan the QR code at the property entrance, then verify your identity.'];
  [].forEach.call(document.querySelectorAll('header span, header h1, header p, header b'), function(e){ if (e.children.length === 0 && /^(Identity check|Guest summary|Identity verification)$/.test(e.textContent.trim())) e.textContent = hd[0]; });
  var h1 = document.querySelector('.ivq-view h1'); if (h1 && /Verify at the|Guest|Identity/.test(h1.textContent)) h1.innerHTML = hd[1].replace('<span>', '<span class="text-[var(--chekin-color-brand-blue)]">');
  var sub = document.querySelector('.ivq-view p[class*="max-w-[480px]"]'); if (sub) sub.textContent = hd[2];
}
function render(){
  document.documentElement.setAttribute('data-ivq-state', flow + '-' + state);
  [].forEach.call(document.querySelectorAll('.ivq-cam:not(.ivq-cam--d),.ivq-lk,.ivq-sheet'), function(e){ e.remove(); });
  document.documentElement.classList.remove('ivq-lock');
  if (flow === 'b') {
    var f = document.createElement('div'); f.innerHTML = bPage(state) + (state === 'multi' ? multiModal() : '');
    while (f.firstChild) document.body.appendChild(f.firstChild);
    document.documentElement.classList.add('ivq-lock'); if (dockEl) dockEl.style.display = 'none';
    return;
  }
  if (!mount) return;
  heads();
  var camK = ['scan', 'wrong', 'outside', 'unreadable'].indexOf(state) > -1 ? state : '';
  var body = state === 'sum-before' ? A.sum(false) : state === 'sum-in' ? A.sum(true) : state === 'denied' ? A.denied() : state === 'desk' ? A.desk() : camK ? (desk ? camera(camK) : A.intro()) : A.intro();
  mount.innerHTML = '<div class="ivq-wrap" data-s="' + state + '">' + body + '</div>';
  dockSet(state === 'intro' ? btn('Continue to Scan', 'scan', { i: 'cam' }) + '<button type="button" class="ivq-btn ivq-btn--soft" data-ivq="back"><span>Back</span></button>' : state === 'desk' ? btn('Email me the link', 'email', { i: 'mail' }) : state === 'denied' ? btn('Try again', 'scan', { i: 'refresh' }) : '');
  if (camK && !desk) { var c = document.createElement('div'); c.innerHTML = camera(camK); var el = c.firstChild; document.body.appendChild(el); document.documentElement.classList.add('ivq-lock'); if (camK === 'scan') camFlow(el); }
  else if (camK === 'scan') camFlow(mount.querySelector('.ivq-cam'));
}
/* A · página de huésped registrado (registered.js): la caja azul debajo del titular */
function registeredBox(){
  var n = 0, t = setInterval(function(){
    var hero = document.querySelector('.rg-hero'); if (!hero && ++n < 40) return; clearInterval(t); if (!hero || document.querySelector('.ivq-rgbox')) return;
    var d = document.createElement('div'); d.className = 'ivq-rgbox'; d.innerHTML = BOX_REQ(); hero.insertAdjacentElement('afterend', d);
  }, 120);
}

/* vista «Móvil + escritorio»: lo que no navega se repite en el otro marco (mensaje ui-door, como las puertas de «Virtual keys») */
var MIRROR = { where: 1, shx: 1, torch: 1, frame: 1, rescan: 1, how: 1, guest: 1, copy: 1, email: 1, 'b-cancel': 1 }, mirroring = false;
function mirror(a, k){ if (mirroring) return; try { var T = window.top; if (T === window || !T.__phoneSplit) return; T.postMessage({ rep: 'ui-door', w: 'ivq', a: a, k: k || '' }, '*'); } catch (_) {} }
window.addEventListener('message', function(ev){
  var mm = ev.data; if (!mm || mm.rep !== 'ui-door' || mm.w !== 'ivq' || !MIRROR[mm.a]) return;
  var sel = '[data-ivq="' + mm.a + '"]' + (mm.k ? '[data-k="' + mm.k + '"]' : ''), all = document.querySelectorAll(sel);
  var el = [].filter.call(all, function(x){ return x.getClientRects().length; })[0] || all[0];
  mirroring = true;
  try { if (el) act(mm.a, el); else if (mm.a === 'where') whereSheet(); else if (mm.a === 'shx') closeSheet(); } catch (_) {}
  mirroring = false;
});
function onClick(e){
  var t = e.target.closest('[data-ivq]:not(html)');
  if (!t) { if (e.target.classList && e.target.classList.contains('ivq-sheet') && !e.target.classList.contains('ivq-sheet--b')) { mirror('shx'); closeSheet(); } return; }
  var a = t.getAttribute('data-ivq'); e.preventDefault();
  if (t.disabled) return;
  if (MIRROR[a]) mirror(a, t.getAttribute('data-k'));
  act(a, t);
}
function busy(t, txt, then){ t.classList.add('is-busy'); t.setAttribute('aria-busy', 'true'); t.querySelector('span').textContent = txt; setTimeout(then, 1100); }
function act(a, t){
  var cam = t.closest('.ivq-cam');
  if (a === 'scan') go('a-scan');
  else if (a === 'back') go(state === 'intro' || state === 'desk' ? 'a-sum-in' : 'a-intro');
  else if (a === 'close') go('a-intro');
  else if (a === 'sum') go('a-sum-before');
  else if (a === 'guest') { if (state === 'sum-before') outsideSheet(); else go('a-intro'); }
  else if (a === 'where') whereSheet();
  else if (a === 'shx') closeSheet();
  else if (a === 'torch') { var c = cam || document.querySelector('.ivq-cam'); if (!c) return; var on = !c.classList.contains('is-torch'); c.classList.toggle('is-torch', on); [].forEach.call(c.querySelectorAll('[data-ivq="torch"][aria-pressed]'), function(b){ b.setAttribute('aria-pressed', String(on)); }); }
  else if (a === 'frame') { if (cam && cam._read) cam._read(); }
  else if (a === 'rescan') { var nc = document.createElement('div'); nc.innerHTML = camera('scan'); var el = nc.firstChild; cam.parentNode.replaceChild(el, cam); camFlow(el); }
  else if (a === 'how') { var k = t.getAttribute('data-k'), card = t.closest('.ivq-card'); [].forEach.call(card.querySelectorAll('[data-ivq="how"]'), function(b){ var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); [].forEach.call(card.querySelectorAll('.ivq-how'), function(o){ o.hidden = o.getAttribute('data-how') !== k; }); }
  else if (a === 'copy' || a === 'email') { var sp = t.querySelector('span'), o = sp.getAttribute('data-l') || sp.textContent; sp.setAttribute('data-l', o); sp.textContent = a === 'copy' ? 'Copied' : 'Sent to ' + EMAIL; t.classList.add('is-ok'); if (a === 'copy') try { navigator.clipboard.writeText('https://guest.chekin.com/v/CHK-4829'); } catch (_) {} clearTimeout(t._t); t._t = setTimeout(function(){ sp.textContent = o; t.classList.remove('is-ok'); }, 1800); }
  /* B */
  else if (a === 'b-find') go('b-find');
  else if (a === 'b-landing') go('b-landing');
  else if (a === 'b-search') busy(t, 'Finding reservation…', function(){ go('b-' + { one: 'ivstart', multi: 'multi', none: 'notfound', unreg: 'unreg' }[resK()]); });
  else if (a === 'b-cancel') { var mo = document.querySelector('.ivq-sheet--b'); if (mo) { mo.classList.remove('on'); setTimeout(function(){ mo.remove(); }, 220); } }
  else if (a === 'b-cont') {
    var f = t.closest('.ivq-sheet__p').querySelector('.ivq-f'), er = f.querySelector('.ivq-errt');
    if (matchK() === 'no') { f.classList.add('ivq-err'); er.textContent = 'This information doesn’t match our records'; er.hidden = false; return; }
    busy(t, 'Checking…', function(){ go('b-ivstart'); });
  }
  else if (a === 'b-form') location.href = (desk ? 'form-empty' : 'g2-form-empty') + EXT;   /* decisión nueva (no en producción): registro completo aquí y luego la IV */
  else if (a === 'b-iv') location.href = IVSTD();
  else if (a === 'b-hub') location.href = 'hub-after-1' + EXT;
}
/* «Find reservation» y «Continue» se activan cuando están rellenos */
function onInput(e){
  var el = e.target; if (!el.closest) return;
  var f = el.closest('.ivq-f.ivq-err'); if (f) { f.classList.remove('ivq-err'); f.querySelector('.ivq-errt').hidden = true; }
  var card = el.closest('.ivq-lk__col');
  if (card) { var ok = [].every.call(card.querySelectorAll('input'), function(i){ return i.value.trim(); }), b = card.querySelector('[data-ivq="b-search"]'); if (b) b.disabled = !ok; }
  var mo = el.closest('.ivq-sheet--b'); if (mo) { var c2 = mo.querySelector('[data-ivq="b-cont"]'); if (c2) c2.disabled = !el.value.trim(); }
}
function initScreen(){
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  if (flow === 'a' && state === 'registered') registeredBox();
  else {
    var root = document.querySelector('.ivq-view'), old = root && root.querySelector('.ivq-old');
    if (old) { mount = document.createElement('div'); mount.className = 'ivq-mount'; old.parentNode.insertBefore(mount, old); }
    render();
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('input', onInput, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
}

/* ---------- cuadro: dos grupos (en todas las pantallas) ---------- */
var b = function(g, k, l, on){ return '<button type="button" data-g="' + g + '" data-k="' + k + '" class="' + (on ? 'on' : '') + '">' + l + '</button>'; };
var swA = document.createElement('div'); swA.className = 'acc-switch vk-sw-lb ivq-sw';
var swB = document.createElement('div'); swB.className = 'acc-switch vk-sw-lb ivq-sw';
function paintSw(){
  var r = readK(), rs = resK(), fk = fieldK(), mk = matchK();
  swA.innerHTML = ivdRow() + '<span>Pantalla</span>' + SA.map(function(s){ return b('a', s, NA[s], flow === 'a' && s === state); }).join('')
    + '<span>Lectura del QR</span>' + b('read', 'auto', 'Automática', r === 'auto') + b('read', 'tap', 'Al tocar el marco', r === 'tap');
  swB.innerHTML = '<span>Pantalla</span>' + SB.map(function(s){ return b('b', s, NB[s], flow === 'b' && s === state); }).join('')
    + '<span>Resultado de la búsqueda</span>' + [['one', 'Una'], ['multi', 'Varias'], ['none', 'Ninguna'], ['unreg', 'Sin registrar']].map(function(o){ return b('res', o[0], o[1], rs === o[0]); }).join('')
    + '<span>Dato extra</span>' + [['doc', 'Nº de documento'], ['dob', 'Fecha de nacimiento'], ['cout', 'Fecha de check-out']].map(function(o){ return b('field', o[0], o[1], fk === o[0]); }).join('')
    + '<span>¿Coincide el dato?</span>' + b('match', 'yes', 'Sí', mk === 'yes') + b('match', 'no', 'No', mk === 'no');
}
function onSw(e){
  var t = e.target.closest('button'); if (!t) return; e.preventDefault(); e.stopPropagation();
  var g = t.getAttribute('data-g'), k = t.getAttribute('data-k');
  if (g === 'ivd') { ivdGo(k); return; }
  if (g === 'a' || g === 'b') { location.href = 'ivqr-v2-' + g + '-' + k + EXT; return; }
  LS.set({ read: 'replica-ivq-read', res: 'replica-ivqb-res', field: 'replica-ivqb-field', match: 'replica-ivqb-match' }[g], k);
  paintSw();
  if (g === 'field' && flow === 'b' && state === 'multi') render();
  if (g === 'field' && !(flow === 'b' && state === 'multi')) location.href = 'ivqr-v2-b-multi' + EXT;
}
swA.addEventListener('click', onSw, true); swB.addEventListener('click', onSw, true);

function init(){
  if (isQ) initScreen();
  paintSw();
  if (!isQ && IVD !== 'v2') return;   /* los grupos de la v2 solo con Old design v2 */
  if (window.__repPanel) { window.__repPanel.add('IV QR v2 · Reservation link', swA, isQ ? 18.5 : 34); window.__repPanel.add('IV QR v2 · Property QR', swB, isQ ? 18.6 : 34.1); }
  else if (isQ) { document.body.appendChild(swA); document.body.appendChild(swB); }
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
