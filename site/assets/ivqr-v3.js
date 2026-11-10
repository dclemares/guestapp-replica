/* =====================================================================================
   #1102 · IV con QR en la propiedad (Italia) · OLD DESIGN V3
   El aspecto del diseño antiguo (tarjetas Aurora, cartel con el marco de escaneo, filas de cristal) con los flujos y
   los textos que hay HOY en producción (probado el 5 nov 2026 en guest.chekin.com con una propiedad de Italia en
   «On check-in day»). Diferencias con la especificación (v2 / nuevo):
   - plazo desde el DÍA del check-in (el día antes sigue bloqueado);
   - registrado: «QR scan required at property» con 3 puntos y sin fecha; con el último huésped en plazo, sin caja;
   - resumen: la misma caja en los dos plazos (sin verde), y al pulsar un huésped fuera de plazo, pantalla «Verification unavailable»;
   - intro «Scan QR code at your accommodation» solo con «Continue to scan»;
   - cámara bloqueada: modal «Service temporarily unavailable» y visor «Camera access is blocked»;
   - B: búsqueda sin botón desactivado; varias reservas = aviso «We need more information» + campo de documento en el
     mismo formulario; sin registrar o fuera de plazo = «We couldn’t find your reservation» (hoja); encontrada = vuelve a
     pedir escanear el QR en la guestapp.
   Pantallas ivqr-v3-a-* / ivqr-v3-b-*. Sin estado.
   ===================================================================================== */
(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var desk = /\.d\.html/.test(location.pathname), EXT = desk ? '.d.html' : '.m.html';
var LS = { get: function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} } };
var SA = ['registered', 'registered-in', 'sum-before', 'unavailable', 'sum-in', 'intro', 'scan', 'wrong', 'outside', 'unreadable', 'denied', 'desk'];
var SB = ['landing', 'multi', 'notfound', 'doc-wrong'];
var NA = { registered: 'Registrado (fuera de plazo)', 'registered-in': 'Registrado (en plazo, último)', unavailable: 'No disponible (pulsar huésped)', 'sum-before': 'Resumen (fuera de plazo)', 'sum-in': 'Resumen (en plazo)', intro: 'Intro del escaneo', scan: 'Escáner', wrong: 'Propiedad equivocada', outside: 'Fuera de plazo', unreadable: 'Ilegible', denied: 'Cámara denegada', desk: 'Escritorio' };
var NB = { landing: 'Portada (buscar)', multi: 'Varias reservas (+ documento)', notfound: 'No encontrada', 'doc-wrong': 'Documento no coincide' };
var m = /^ivqr-v3-(a|b)-(.+)$/.exec(SID), flow = m ? m[1] : '', state = m ? m[2] : '';
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


var PROP = 'Villa Calipso', CIN = 'Wed 25 Nov', CIN_LONG = '25 November 2026', WIN_FROM = '25 Nov 2026', WIN = '25–27 Nov 2026', EMAIL = 'carmen.demo@gmail.com';
var GUESTS = [{ n: 'Carmen Demo', r: 'Lead guest', a: 'CD' }, { n: 'Marco Rossi', r: 'Guest 2', a: 'MR' }];
var go = function(s){ location.href = 'ivqr-v3-' + s + EXT; };
var IVSTD = function(){ return 'g2-ivh' + EXT; };   /* el flujo de IV estándar de la réplica (documento + selfie) */
/* ajustes de vista del cuadro (nunca el resultado del flujo) */
var resK = function(){ var v = LS.get('replica-ivqb3-res', 'one'); return ['one', 'multi', 'none', 'unreg'].indexOf(v) > -1 ? v : 'one'; };   /* en producción, «sin registrar» = no encontrada */
var matchK = function(){ return LS.get('replica-ivqb3-match', 'yes') === 'no' ? 'no' : 'yes'; };
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
/* ===================== FLUJO A · enlace de la reserva (producción, con el aspecto antiguo) ===================== */
var ART = function(){ return '<div class="ivq-au__art"><div class="ivq-artbox">' + poster() + CORNERS + '</div></div>'; };
var LIVE = function(t){ return '<span class="ivq-badge ivq-badge--ok"><i class="ivq-live"></i>' + t + '</span>'; };
var BADGE = function(i, t){ return '<span class="ivq-badge">' + ic(i, 15) + t + '</span>'; };
var GLYPH = '<div class="ivq-glyph">' + ic('qr', 30, 1.8) + '</div>';
/* registrado fuera de plazo: «QR scan required at property» (producción: 3 puntos, sin fecha ni «Look for the QR code») */
var BOX_REQ = function(){ return hero('info', '<div class="ivq-au__in"><div class="ivq-au__main">' + BADGE('qr', 'At the property') + '<h3>QR scan required at property</h3><p>When you arrive at the property, you must <b>scan the QR code located at the entrance</b>. This allows you to:</p></div>'
  + '<div class="ivq-au__side">' + checks([['user', 'Verify your presence at the property', ''], ['id', 'Access identity verification', ''], ['check', 'Complete your check-in process', '']]) + '</div></div>'); };
var guests = function(){ return label('Guests · 2 of 2 registered') + '<div class="ivq-gl">' + GUESTS.map(function(g){ return '<button type="button" class="ivq-g ivq-g--btn" data-ivq="guest"><span class="ivq-g__a">' + g.a + '</span><span class="ivq-g__t"><b>' + g.n + '</b><span>' + g.r + '</span></span><span class="ivq-tag ivq-tag--warn"><i class="ivq-dot"></i>Verification pending</span><span class="ivq-row__c">' + ic('chev', 18, 2.4) + '</span></button>'; }).join('') + '</div>'; };
var A = {};
/* resumen: en producción la caja es la misma (azul) en los dos plazos; solo cambia el texto */
A.sum = function(inWin, boxOnly){
  if (boxOnly) return A.sum(inWin).replace(guests(), '');
  if (!inWin) return hero('info', '<div class="ivq-au__in ivq-au__in--pick"><div class="ivq-au__main">' + BADGE('cal', 'Before check-in day') + GLYPH + '<h3>Verification required upon arrival</h3><p>When you arrive, scan the QR code at the entrance to complete your identity verification.</p></div></div>') + guests();
  return hero('info', '<div class="ivq-au__in ivq-au__in--pick"><div class="ivq-au__main">' + LIVE('Check-in day') + GLYPH + '<h3>Identity verification is now available</h3><p>The identity verification process is now available. Scan the QR code at the property entrance to access.</p></div></div>') + guests();
};
/* #1116 · sección del resumen DEFINITIVA (V1.2 · Titular, elegida entre #1114 y #1115): dentro de la tarjeta de progreso, una frase que lo dice todo */
var sumK = function(){ return LS.get('replica-ivqa3-sum', 'v12') === 'au' ? 'au' : 'v12'; };   /* #1117: V1.2 (final) o V5 · tarjeta Aurora (cuadro «Versión del resumen») */
var regQ = new URLSearchParams(location.search).get('ivreg');   /* #1128: la página de flujos pide el caso por la URL (?ivreg=all|pend); manda sobre el cuadro */
var regK = function(){ if (regQ === 'pend' || regQ === 'all') return regQ; return LS.get('replica-ivqa3-reg', 'all') === 'pend' ? 'pend' : 'all'; };   /* #1125: todos registrados (como estaba) o con huéspedes pendientes */
function sumBox(){ setTimeout(regK() === 'pend' ? sumPend : (sumK() === 'au' ? sumAu : sumIn), 0); return ''; }
/* #1125/#1131 · resumen con huéspedes pendientes de registrar (versión elegida: P1): lo primero es el registro (la tarjeta de progreso de siempre)
   y la IV en la propiedad va en una caja translúcida dentro de la tarjeta. En escritorio la pinta hub.js (y «Share a link» va en Vela); en móvil, aquí. */
function sumPend(){
  if (desk) return;
  var box = document.querySelector('.hv5c'), h = box && box.querySelector('.v5-hero'); if (!h || box.querySelector('.ivq-pv')) return;
  var inWin = state === 'sum-in', d = document.createElement('p');
  d.className = 'ivq-pv ivq-pv1'; d.innerHTML = ic('qr', 16, 2) + '<span><b>' + (inWin ? 'Then:' : 'Then, when you arrive:') + '</b> scan the QR code at the entrance to verify your identity.</span>';
  var st = h.querySelector('.v5h-st'); if (st) st.parentNode.insertBefore(d, st.nextSibling); else h.appendChild(d);
}
/* #1117 · V5 · tarjeta Aurora: la tarjeta de progreso se sustituye por la tarjeta grande del diseño antiguo, que deja claro que el registro está hecho y que falta la verificación en la propiedad */
function sumAu(){
  var h = document.querySelector('.hv5c .v5-hero'); if (!h) return;
  var inWin = state === 'sum-in', nb = h.querySelector('.v5h-big b'), N = nb ? nb.textContent.trim() : '2';
  var st = '<ol class="ivq-steps ivq-steps--done"><li class="is-done"><i>' + ic('check', 14, 3) + '</i><div><b>Register all guests</b><span>Done · ' + N + ' of ' + N + ' registered</span></div></li>'
    + '<li><i>2</i><div><b>Scan the QR code at the entrance</b><span>' + (inWin ? 'On the sign at the door, available now' : 'On the sign at the door, from ' + CIN) + ' <button type="button" class="ivq-x__where" data-ivq="where">See where the sign is</button></span></div></li>'   /* #1119: abre la hoja «On a sign next to the main door» */
    + '<li><i>3</i><div><b>Verify your identity</b><span>A photo of your ID and a selfie, on your phone with internet access</span></div></li></ol>';
  var gl = '<div class="ivq-glyph">' + ic('qr', 30, 1.8) + '<i>' + ic('clock', 14, 2.4) + '</i></div>';
  /* #1136 · cabecera definitiva (H3): titular a la izquierda («Last step:» en menta) e icono a la derecha, tan alto como el titular (glyphFit) */
  var ttl = inWin ? 'verify your identity now' : 'verify your identity at the property', hk = 'h3';
  var head = '<div class="ivq-sau__row"><h3 class="ivq-sau__t3"><span>Last step:</span> ' + ttl + '</h3><div class="ivq-sau__r">' + gl + '</div></div>';
  var main = '<div class="ivq-au__main ivq-sau__main ivq-sau--h3">' + head
    + '<p>' + (inWin ? 'Registration is complete. Scan the QR code at the property entrance and verify your identity to finish your check-in.' : 'Registration is complete. To finish your check-in, scan the QR code at the property entrance when you arrive and verify your identity on the spot.') + '</p></div>';
  var side = '<div class="ivq-au__side"><p class="ivq-au__eye">' + 'Your check-in · 1 of 3 done' + '</p>' + st + '</div>';
  var d = document.createElement('div'); d.className = 'ivq-sau' + (inWin ? ' is-in' : '');
  d.innerHTML = hero(inWin ? 'ok' : 'info', '<div class="ivq-au__in">' + main + side + '</div>');   /* #1121: fuera la fila «Look for the QR code» (ya está en el paso 2) */
  h.parentNode.replaceChild(d, h);
  if (hk === 'h3') { glyphFit(); addEventListener('resize', glyphFit); }
}   /* se mete en la tarjeta de progreso después de que hub.js la pinte */
/* #1134 · H3: el icono es un cuadrado tan alto como el titular (que cambia de líneas según el ancho); se ajusta un par de veces porque el icono también cambia el ancho del titular */
function glyphFit(){
  var t = document.querySelector('.ivq-sau__t3'), g = document.querySelector('.ivq-sau__r .ivq-glyph'); if (!t || !g) return;
  for (var n = 0, last = 0; n < 4; n++) { var hh = Math.round(t.getBoundingClientRect().height); if (Math.abs(hh - last) < 1) break; last = hh; g.style.setProperty('--gs', Math.max(48, Math.min(112, hh)) + 'px'); }
}
function sumIn(){
  var h = document.querySelector('.hv5c .v5-hero'); if (!h || h.querySelector('.ivq-sb')) return;
  var inWin = state === 'sum-in', st = h.querySelector('.v5h-st'), d = document.createElement('div');
  if (st) st.hidden = true;   /* el bloque ya dice lo siguiente; fuera «Next, verify your identity at the property.» */
  d.className = 'ivq-sb' + (inWin ? ' is-in' : '');
  d.innerHTML = '<span class="ivq-x__eye">' + (inWin ? 'Now, at the property' : 'When you arrive') + '</span>'
    + '<p class="ivq-x__big">' + (inWin ? 'Scan the QR code at the entrance and verify your identity.' : 'Scan the QR code at the entrance to verify your identity on the spot.') + '</p>'
    + '<p class="ivq-x__need">' + ic('phone', 14) + 'Bring your ID and your phone with internet access</p>';
  h.appendChild(d);
}
/* fuera de plazo, al pulsar un huésped: pantalla «Verification unavailable» (producción) */
/* #1137 · 7 · huésped pulsado fuera de plazo: la fecha manda (calendario grande), una frase clara y lo que necesitará al llegar */
A.unavailable = function(){
  var cal = '<div class="ivq-un__cal" aria-hidden="true"><small>Nov</small><b>25</b><span>Wed</span></div>';
  var top = '<div class="ivq-un__top">' + cal + '<div><p class="ivq-au__eye">Not available yet</p><h3>Identity verification opens on your check-in day</h3></div></div>'
    + '<p class="ivq-un__p">You’ll verify your identity at ' + PROP + ' from <b>' + CIN_LONG + '</b>, by scanning the QR code at the entrance.</p>';
  var need = '<p class="ivq-un__lb">When you arrive</p><div class="ivq-un__list">'
    + '<button type="button" class="ivq-un__row" data-ivq="where"><span class="ivq-un__i">' + ic('qr', 18) + '</span><span class="ivq-un__t"><b>Scan the QR code at the entrance</b><span>On the sign next to the main door</span></span><span class="ivq-un__c">' + ic('chev', 16, 2.4) + '</span></button>'
    + '<div class="ivq-un__row"><span class="ivq-un__i">' + ic('id', 18) + '</span><span class="ivq-un__t"><b>Have your ID or passport ready</b><span>The one you registered with</span></span></div>'
    + '<div class="ivq-un__row"><span class="ivq-un__i">' + ic('phone', 18) + '</span><span class="ivq-un__t"><b>Use a phone with camera and internet</b><span>It takes about 2 minutes</span></span></div></div>';
  return hero('off', '<div class="ivq-au__in ivq-un">' + top + (desk ? '<div class="ivq-acts ivq-acts--in">' + btn('Back to summary', 'sum', { cls: 'ivq-btn--w' }) + '</div>' : '') + '</div>') + need;
};
/* intro «Scan QR code at your accommodation»: solo «Continue to scan» (sin los tres puntos ni «Back») */
A.intro = function(){
  var side = desk ? '<div class="ivq-au__side ivq-au__side--ho">' + handoff(true) + '</div>' : '';
  return hero('ok', '<div class="ivq-au__in"><div class="ivq-au__main">' + LIVE('Check-in day') + '<h3>Scan QR code at your accommodation</h3><p>You will find the QR code printed at the property entrance. Use your device camera to scan it in the next step.</p>'
    + (desk ? '' : ART()) + (desk ? '<div class="ivq-acts ivq-acts--in">' + btn('Continue to scan', 'scan', { cls: 'ivq-btn--w', i: 'cam' }) + '</div>' : '') + '</div>' + side + '</div>');
};
/* escritorio (no probado en producción): «Continue on your phone» del diseño antiguo */
A.desk = function(){
  return hero('info', '<div class="ivq-au__in ivq-au__in--ho"><div class="ivq-au__main"><span class="ivq-badge">' + ic('laptop', 15) + 'You’re on a computer</span>'
    + '<h3>Continue on your phone</h3><p>Identity verification needs your phone’s camera at the entrance of ' + PROP + '.</p>'
    + steps([['Open your phone’s camera', 'No app needed'], ['Point it at this code', 'Tap the link that appears'], ['Scan the QR at the entrance', 'Then verify your identity']]) + '</div>'
    + '<div class="ivq-au__side ivq-au__side--ho">' + handoff(false, true) + '</div></div>');
};

/* ===================== FLUJO B · QR de la propiedad (web pública) ===================== */
var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><linearGradient id="ivqvc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fd0ea"/><stop offset="1" stop-color="#3556c4"/></linearGradient></defs><path d="M6 33V17a14 14 0 0 1 28 0v16" fill="none" stroke="url(#ivqvc)" stroke-width="1.6" stroke-linecap="round"/><path d="M15.500 29c.600-5 .300-9-1.500-13" fill="none" stroke="url(#ivqvc)" stroke-width="1.800" stroke-linecap="round"/><path d="M14 16c-3-2-6-1.500-7.500.500 2.500-.500 5 0 7.500-.500zM14 16c1-3 4-4.500 6.500-4-2 .800-4.500 2.500-6.500 4zM14 16c-1.500-2.500-1-5.500 1-7-.500 2.500-.500 4.500-1 7zM14 16c3-.500 6 .500 7.500 3-2.500-1.500-5-2-7.500-3z" fill="url(#ivqvc)"/><path d="M24 29.500c.300-3.500 0-6-1.300-8.500" fill="none" stroke="url(#ivqvc)" stroke-width="1.500" stroke-linecap="round"/><path d="M22.700 21c-2.200-1.200-4.300-.700-5.300.700 1.800-.300 3.500.100 5.300-.700zM22.700 21c.800-2.200 3-3.200 4.800-2.800-1.500.600-3.300 1.700-4.800 2.800zM22.700 21c2.200-.200 4.300.600 5.300 2.300-1.800-1.100-3.600-1.500-5.300-2.300z" fill="url(#ivqvc)"/><path d="M4 31c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0M4 35c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0" fill="none" stroke="url(#ivqvc)" stroke-width="1.600" stroke-linecap="round"/></svg>';
var PH = 'https://images.unsplash.com/photo-1758448500688-3ababa93fd67?w=1600&q=72&auto=format&fit=crop';
var field = function(id, lab, ph, val, extra){ return '<div class="ivq-f" data-f="' + id + '"><label for="ivq-' + id + '">' + lab + '</label><div class="ivq-field"><input id="ivq-' + id + '" type="text" placeholder="' + ph + '"' + (val ? ' value="' + esc(val) + '"' : '') + (extra || '') + '></div><p class="ivq-errt" hidden></p></div>'; };
var glyph = function(i, tone){ return '<span class="ivq-bg' + (tone ? ' ivq-bg--' + tone : '') + '">' + ic(i, 26, 1.9) + '</span>'; };
var doneMark = '<div class="ivq-done ivq-done--l"><svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="ivq-done__c" cx="26" cy="26" r="23"/><path class="ivq-done__k" d="m15.500 26.500 7 7 14-15"/></svg></div>';
var auB = function(tone, inner){ return hero(tone, '<div class="ivq-au__in ivq-au__in--c">' + inner + '</div>'); };
var DONE = '<div class="ivq-done"><svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="ivq-done__c" cx="26" cy="26" r="23"/><path class="ivq-done__k" d="m15.500 26.500 7 7 14-15"/></svg></div>';
var SCANNED = '<p class="ivq-eyb">' + ic('check', 13, 3) + 'QR scanned at the entrance</p>';
/* B con el diseño del Property Link / One click (plink.css): cabecera con el patrón «Curvas de papel» (sin foto de la propiedad,
   como Villa Calipso en producción), tarjeta blanca, campos suaves, avisos en línea (pl-note) y la búsqueda dentro del CTA.
   En móvil el aviso va en el dock, junto al botón; en escritorio, dentro de la tarjeta flotante (D2). Flujo y textos: producción. */
P.globe = '<circle cx="12" cy="12" r="9.500"/><path d="M2.500 12h19M12 2.500c2.500 2.700 3.800 5.900 3.800 9.500s-1.300 6.800-3.800 9.500c-2.500-2.700-3.800-5.900-3.800-9.500S9.500 5.200 12 2.500z"/>';
P.down = '<path d="m6 9 6 6 6-6"/>';
P.info = '<circle cx="12" cy="12" r="9.500"/><path d="M12 11v5.500M12 7.500h.01"/>';
P.lock = '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
var PAT = 'https://images.unsplash.com/photo-1650611250959-1e823abf6841?w=1600&q=72&auto=format&fit=crop';
var plField = function(id, lab, hint, val, extra, cls){ return '<div class="pl-f' + (cls ? ' ' + cls : '') + '" data-f="' + id + '"><div class="pl-lrow"><label for="ivq-' + id + '">' + lab + '</label></div><div class="pl-field"><input id="ivq-' + id + '" placeholder="' + hint[0] + '"' + (val ? ' value="' + esc(val) + '"' : '') + (extra || '') + '></div><p class="pl-errt" hidden></p>' + (hint[1] ? '<p class="pl-hint">' + hint[1] + '</p>' : '') + '</div>'; };
var plBtn = function(l, a, cls){ return '<button type="button" class="pl-btn ' + (cls || 'pri') + '" data-ivq="' + a + '"><span>' + l + '</span></button>'; };
/* #1104: la portada y la búsqueda son una sola pantalla. #1109: queda una sola versión (la V5.3 · línea de pasos, con el texto de Dani de #1106);
   las demás (V1–V5, V5.1, V5.2 y el control «Version») se quitaron. */
var ERRT = { fn: 'Enter your first name', ln: 'Enter your last name', doc: 'Enter your document number' };
var noteBox = function(tone, title, body){ return '<div class="pl-note ' + tone + '" role="' + (tone === 'err' ? 'alert' : 'status') + '">' + ic(tone === 'err' ? 'alert' : 'info', 20) + '<div><b>' + title + '</b>' + body + '</div></div>'; };
var VERM = function(t, h, b){ return function(){ return noteBox(t, h, b); }; };
/* línea de pasos: los campos y los avisos viven dentro del paso 1; los pasos 2 y 3 esperan debajo */
var BV = {
    /* #1111: la entrada vuelve al texto de producción («Verify your identity at the property» + lo que va a pasar); el paso 1 ya no repite la explicación */
    top: function(){ return '<h2 id="pl-h" class="ivq-tl__h">Verify your identity at the property</h2><p class="pl-lead ivq-tl__intro">Enter your name to find your reservation and start the identity verification process.</p><ol class="ivq-tl"><li class="on"><span class="ivq-tl__n">1</span><div class="ivq-tl__b"><h3 class="ivq-tl__t">Find your reservation</h3><p class="ivq-tl__s">To find your reservation, please enter these details.</p>'; },
    bottom: '</div></li><li class="ivq-tl__full"><span class="ivq-tl__n">2</span><div class="ivq-tl__b"><b>Scan your ID or passport</b><span>The one you registered with</span></div></li><li class="ivq-tl__full"><span class="ivq-tl__n">3</span><div class="ivq-tl__b"><b>Take a selfie</b><span>We match it to your ID</span></div></li>'
      + '<li class="ivq-tl__mini"><span class="ivq-tl__n">2</span><div class="ivq-tl__b"><b>Then scan your ID and take a selfie</b></div></li></ol>',
    lab: ['First name', 'Last name', 'Document number'],
    multi: VERM('info', 'We found more than one reservation with this name', 'Please also enter the document number you registered with.'),
    none: VERM('err', 'We couldn’t find your reservation', 'Check that your name is spelled as on the booking. If you haven’t registered yet, use the check-in link ' + 'Villa Calipso sent you.'),
    doc: VERM('err', 'This document number doesn’t match', 'Enter it exactly as it appears on the ID or passport you registered with.'),
  cta: 'Find my reservation'
};
/* #1110: reserva encontrada = la animación definitiva del Property Link (V8): la cabecera crece a pantalla completa, la lupa se convierte en la casa,
   «Reservation found / Welcome, Carmen!», la ficha de la estancia y «Opening your reservation»; luego sigue el proceso (la guestapp pide el QR, como en producción).
   Desde el cuadro se puede volver a ver sin salir de la pantalla (stay). */
var FOUND_SVG = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="c" cx="26" cy="26" r="24"/><g class="mg"><circle cx="24" cy="24" r="7.5"/><path d="m29.5 29.5 6 6"/></g><path class="hs" d="M15 26 26 17l11 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 15 36.5z"/><path class="dr" d="M22.5 38v-6.5h7V38"/></svg>';
function bFound(stay){
  var old = document.querySelector('.ivq-found'); if (old) old.remove();
  var fnI = document.querySelector('#pl-root [data-f="fn"] input'), fn = (fnI && fnI.value.trim()) || 'Carmen';
  fn = fn.charAt(0).toUpperCase() + fn.slice(1);
  var gh = document.querySelector('#pl-root .pl-gh'), r = gh ? gh.getBoundingClientRect() : { top: 0, left: 0, right: innerWidth, bottom: innerHeight * .3 };
  var el = document.createElement('div');
  el.className = 'pl-fx pl-v8 ivq-found'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ivq-fh'); el.setAttribute('aria-live', 'polite');
  el.style.cssText = '--t:' + Math.max(0, Math.round(r.top)) + 'px;--l:' + Math.round(r.left) + 'px;--r:' + Math.round(innerWidth - r.right) + 'px;--b:' + Math.round(innerHeight - r.bottom) + 'px';
  el.innerHTML = '<img src="' + PAT + '" alt=""><div class="pl-x-c"><span class="pl-draw pl-found">' + FOUND_SVG + '</span><p class="pl-x-eye">Reservation found</p><h2 id="ivq-fh">Welcome, ' + esc(fn) + '!</h2>'
    + '<div class="pl-x-glass"><div class="row"><div><small>Check-in</small><strong>Wed, 25 Nov</strong></div><span class="pl-n">2 nights</span><div class="r"><small>Check-out</small><strong>Fri, 27 Nov</strong></div></div>'
    + '<div class="meta">' + ic('pin', 16) + PROP + ', Albacete</div><div class="meta">' + ic('user', 16) + GUESTS.length + ' guests</div></div>'
    + '<p class="pl-x-open">Opening your reservation<i></i></p></div>';
  document.body.appendChild(el); document.documentElement.classList.add('ivq-lock');
  if (stay) { el.addEventListener('click', function(){ el.remove(); }); return; }
  setTimeout(function(){ el.classList.add('ivq-found--out'); setTimeout(function(){ location.href = 'ivqr-v3-a-sum-in' + EXT + '#from-found'; }, 520); }, 3900);   /* #1112: al resumen de la guestapp (en plazo), con transición: la ficha se va hacia arriba y la guestapp entra desde ella */
}
/* #1111: nunca scroll. Si no cabe, se recoge por niveles (de lo menos a lo más visible), con los niveles del Property Link (PL-31) y dos propios de la línea de pasos:
   1 fuera las ayudas de los campos · 2 pasos 2 y 3 sin su explicación · 3 espacios más apretados · 4 foto a 150 px · 5 pasos 2 y 3 en una sola línea
   · 6 foto a 118 px · 7 campos más bajos · 8 (último recurso) fuera la entradilla. */
var BFIT = ['pl-fit1', 'ivq-tf1', 'pl-fit3', 'pl-fit4', 'ivq-tf2', 'pl-fit5', 'pl-fit7', 'pl-fit2'];
function bFit(){
  var root = document.getElementById('pl-root'), m = root && root.querySelector('.pl-main'); if (!m) return;
  BFIT.forEach(function(c){ root.classList.remove(c); });
  var card = root.querySelector('.pl-main-card'), mob = innerWidth < 1024;
  var over = mob ? function(){ return m.scrollHeight - m.clientHeight > 0; }
                 : function(){ var r = card.getBoundingClientRect(); return card.scrollHeight - card.clientHeight > 1 || r.bottom > innerHeight - 16; };
  for (var i = 0; i < BFIT.length && over(); i++) root.classList.add(BFIT[i]);
  root.setAttribute('data-fit', i);
}
addEventListener('resize', function(){ if (flow === 'b') bFit(); });
function bPage(st){
  var doc = st === 'multi' || st === 'doc-wrong' || (st === 'notfound' && resK() === 'multi'), pre = st !== 'landing';
  var note = st === 'multi' ? BV.multi() : st === 'notfound' ? BV.none() : st === 'doc-wrong' ? BV.doc() : '';
  var lang = '<button type="button" class="pl-gh-lang" data-ivq="noop" aria-label="Language: English">' + ic('globe', 16) + 'English' + ic('down', 14) + '</button>';
  var head = '<section class="pl-gh"><img src="' + PAT + '" alt=""><div class="pl-gh-m"><p class="pl-wel">Welcome to</p><p class="pl-gh-name">' + PROP + '</p><div class="pl-gh-row"><p class="pl-loc">' + ic('pin', 15) + 'Albacete, Spain</p>' + lang + '</div></div></section>';
  var dwel = '<div class="pl-dwel"><span class="pl-dwel-t">Welcome to <b>' + PROP + '</b></span><span class="pl-dwel-l">' + ic('pin', 15) + 'Albacete, Spain</span>' + lang.replace('class="pl-gh-lang"', 'class="pl-gh-lang pl-dwel-lang"') + '</div>';
  var fields = '<div class="ivq-plrow">' + plField('fn', BV.lab[0], ['e.g. Carmen'], pre ? 'Carmen' : '', ' autocomplete="given-name" autocapitalize="words" enterkeyhint="next"') + plField('ln', BV.lab[1], ['e.g. Demo'], pre ? 'Demo' : '', ' autocomplete="family-name" autocapitalize="words" enterkeyhint="' + (doc ? 'next' : 'search') + '"') + '</div>'
    + (doc ? plField('doc', BV.lab[2], ['ID card or passport number', 'The one you registered with for this stay.'], st === 'doc-wrong' ? 'ZZ0000000' : '', ' autocapitalize="characters" enterkeyhint="search"', (st === 'multi' ? 'pl-new' : '') + (st === 'doc-wrong' ? ' pl-err' : '')) : '');
  var card = '<section class="pl-card pl-main-card ivq-v5c" aria-labelledby="pl-h">' + dwel + BV.top() + fields + note + BV.bottom + '</section>';
  var dock = '<div class="pl-dock"><div>' + plBtn(st === 'notfound' || st === 'doc-wrong' ? 'Try again' : BV.cta, 'b-search') + '</div></div>';
  return '<div class="ivq-plw" data-b="' + st + '"><div id="pl-root"><main class="pl-main">' + head + '<div class="pl-col">' + card + dock + '</div></main></div></div>';   /* #pl-root: la maquetación del Property Link */
}

/* ---------- visor de cámara (A) ---------- */
/* errores tras escanear: no se han podido probar en producción (sin cámara); textos de la especificación, con el plazo de producción */
var ERR = {
  wrong: ['alert', 'Wrong QR code', 'This QR code does not belong to this property. Please scan the QR code located at the property entrance.', function(){ return btn('Try again', 'rescan', { i: 'scan' }) + '<button type="button" class="ivq-txt" data-ivq="close"><span>Back</span></button>'; }],
  outside: ['cal', 'Outside check-in period', 'Identity verification is only available on your check-in day. Please try again when you arrive at the property.', function(){ return '<p class="ivq-cam__date">' + ic('cal', 15) + 'Check-in date: ' + CIN_LONG + '</p>' + btn('Back to summary', 'sum'); }],
  unreadable: ['scan', 'Couldn’t read the QR code', 'We couldn’t read this QR code. Please make sure it’s clearly visible and try again.', function(){ return btn('Try again', 'rescan', { i: 'scan' }); }]
};
function camera(kind){
  var e = ERR[kind], dn = kind === 'denied';
  var feed = dn ? '<div class="ivq-cam__feed ivq-cam__feed--off"></div>' : '<div class="ivq-cam__feed"><i class="ivq-cam__wall"></i><div class="ivq-cam__pst' + (kind === 'unreadable' ? ' is-blur' : '') + '">' + poster(kind === 'wrong' ? 'Casa Bianca' : PROP, kind === 'wrong' ? 19 : 7) + '</div></div>';
  var top = '<div class="ivq-cam__top"><button type="button" class="ivq-cam__b" data-ivq="close" aria-label="Close">' + ic('x', 20, 2.4) + '</button><b>Scan QR Code</b>' + (dn ? '<i class="ivq-cam__sp"></i>' : '<button type="button" class="ivq-cam__b" data-ivq="torch" aria-label="Flashlight" aria-pressed="false">' + ic('torch', 19) + '</button>') + '</div>';
  var frame = '<div class="ivq-cam__frame" data-ivq="frame">' + CORNERS + '<i class="ivq-cam__line"></i><span class="ivq-cam__ok">' + ic('check', 34, 3) + '</span></div>';
  var hint = '<p class="ivq-cam__hint" aria-live="polite"><span data-h="look">Position the QR code inside the frame</span><span data-h="read">Reading the code…</span><span data-h="done">QR code verified</span></p>';
  /* cámara bloqueada (producción): aviso en el visor + modal encima */
  var blocked = '<p class="ivq-cam__top2">Position the QR code inside the frame</p><div class="ivq-cam__blk">' + ic('camOff', 30, 1.9) + '<b>Camera access is blocked</b><span>Allow camera access for this site in your browser settings, then try again.</span><button type="button" class="ivq-cam__pill" data-ivq="scan">Try again</button></div>'
    + '<div class="ivq-cam__modal" data-m="1" role="alertdialog" aria-labelledby="ivq-dm"><div><button type="button" class="ivq-sheet__x" data-ivq="cam-ok" aria-label="Close">' + ic('x', 18, 2.4) + '</button><span class="ivq-glyph ivq-glyph--bad ivq-glyph--s">' + ic('camOff', 24, 2) + '</span><h3 id="ivq-dm">Service temporarily unavailable</h3><p>Allow camera access for this site in your browser settings, then try again.</p>' + btn('OK', 'cam-ok') + '</div></div>';
  var sheet = !e ? '' : '<div class="ivq-cam__sheet" role="alertdialog" aria-labelledby="ivq-wt"><span class="ivq-glyph ivq-glyph--bad ivq-glyph--s">' + ic(e[0], 24, 2) + '</span><h3 id="ivq-wt">' + e[1] + '</h3><p>' + e[2] + '</p><div class="ivq-cam__acts">' + e[3]() + '</div></div>';
  return '<div class="ivq-cam' + (desk ? ' ivq-cam--d' : '') + (dn ? ' ivq-cam--blocked' : '') + '" data-st="' + (e ? 'bad' : dn ? 'blocked' : 'look') + '" role="dialog" aria-label="Scan QR Code">' + feed + '<i class="ivq-cam__dim"></i>' + top + (dn ? blocked : '<div class="ivq-cam__mid">' + frame + hint + '</div>') + sheet + '</div>';
}
/* #1137 · ESCÁNER Y ESTADOS (9–13) rediseñados con la UI de la cámara de la guestapp (la de la IV: título con acento, visor oscuro redondeado
   con esquinas, línea de lectura y chip abajo, CTA en el dock). Ya no es una pantalla negra a pantalla completa con una hoja encima: es una página.
   Los errores tiñen las esquinas y explican debajo del visor qué ha pasado y qué hacer. */
var SC = {
  wrong:      { tone: 'bad',  chip: 'Not the ' + PROP + ' code', ic: 'alert', t: 'This QR code is for another property', p: 'It belongs to <b>Casa Bianca</b>. Look for the <b>' + PROP + '</b> sign next to the main door and scan that one.', more: '<button type="button" class="ivq-sc__lk" data-ivq="where">' + ic('pin', 15) + 'See where the sign is</button>' },
  outside:    { tone: 'bad',  chip: 'Too early to verify', ic: 'cal', t: 'Verification opens on your check-in day', p: 'This is the right code. Come back on <b>' + CIN + '</b>, when you arrive at ' + PROP + ', and scan it again.', more: '' },
  unreadable: { tone: 'warn', chip: 'Code not readable', ic: 'scan', t: 'We couldn’t read the code', p: 'Try these and scan again:', more: '<ul class="ivq-sc__tips"><li>' + ic('scan', 15) + 'Move closer so the code fills the frame</li><li>' + ic('phone', 15) + 'Hold your phone steady for a second</li><li>' + ic('torch', 15) + 'Turn on the flashlight if it’s dark</li></ul>' },
  denied:     { tone: 'info', ic: 'camOff', t: 'Allow camera access to continue', p: 'Your browser is blocking the camera. Turn it on in 3 steps:', more: '' }
};
var HOWC = { ios: ['Tap <b>aA</b> in the address bar', 'Tap <b>Website Settings</b>', 'Set <b>Camera</b> to <b>Allow</b>'], and: ['Tap the <b>lock</b> next to the address', 'Tap <b>Permissions</b>', 'Turn <b>Camera</b> on'] };
function camPage(kind){
  var e = SC[kind], dn = kind === 'denied', st = dn ? 'blocked' : (e ? 'bad' : 'look');
  var feed = dn ? '<div class="ivq-sc__off">' + ic('camOff', 30, 1.9) + '<b>Camera is off</b></div>'
                : '<div class="ivq-sc__pst' + (kind === 'unreadable' ? ' is-blur' : '') + '">' + poster(kind === 'wrong' ? 'Casa Bianca' : PROP, kind === 'wrong' ? 19 : 7) + '</div>';
  var chip = '<p class="ivq-sc__chip" aria-live="polite"><span data-h="look">Align the QR code with the guide</span><span data-h="read"><i class="ivq-sc__spin"></i>Reading the code…</span><span data-h="done">' + ic('check', 14, 3) + 'QR code verified</span>' + (e && e.chip ? '<span data-h="bad">' + ic(e.ic, 14, 2.4) + e.chip + '</span>' : '') + '</p>';
  /* #1139: como la cámara de la IV: el marco envuelve el objeto (el cartel), el visor ocupa todo el alto libre y no hay botones dentro */
  var obj = dn ? feed : '<div class="ivq-sc__obj">' + feed + '<div class="ivq-sc__fr">' + CORNERS + '<i class="ivq-sc__line"></i><span class="ivq-sc__ok">' + ic('check', 30, 3) + '</span></div></div>';
  var stage = '<div class="ivq-sc__stage" data-ivq="frame">' + obj + (dn ? '' : chip) + '</div>';
  var res = '';
  if (e) {
    var how = dn ? '<div class="ivq-sc__seg" role="group" aria-label="Your phone"><button type="button" aria-pressed="true" data-ivq="howc" data-k="ios" class="on">iPhone</button><button type="button" aria-pressed="false" data-ivq="howc" data-k="and">Android</button></div>'
      + ['ios', 'and'].map(function(k, i){ return '<ol class="ivq-sc__how" data-how="' + k + '"' + (i ? ' hidden' : '') + '>' + HOWC[k].map(function(t){ return '<li><span>' + t + '</span></li>'; }).join('') + '</ol>'; }).join('') : '';
    res = '<div class="ivq-sc__res ivq-sc__res--' + e.tone + '" role="' + (e.tone === 'info' ? 'status' : 'alert') + '"><span class="ivq-sc__ri">' + ic(e.ic, 20, 2.2) + '</span><div class="ivq-sc__rt"><b>' + e.t + '</b><p>' + e.p + '</p>' + e.more + how + '</div></div>';
  }
  var top = desk ? '' : '<div class="ivq-sc__head"><h2>' + (dn ? 'Allow <span>camera access</span>' : 'Scan the QR code <span>at the entrance</span>') + '</h2></div>';
  var acts = desk ? '<div class="ivq-sc__acts">' + scActs(kind) + '</div>' : '';
  return '<div class="ivq-sc ivq-sc--' + (kind || 'scan') + '" data-st="' + st + '">' + top + stage + res + acts + '</div>';
}
function scActs(kind){
  if (kind === 'outside') return btn('Back to summary', 'sum');
  if (kind === 'wrong') return btn('Scan again', 'rescan', { i: 'scan' }) + btn('Back to summary', 'sum', { cls: 'ivq-btn--ghost' });
  if (kind === 'unreadable') return btn('Try again', 'rescan', { i: 'scan' }) + btn('Turn on flashlight', 'torch', { cls: 'ivq-btn--ghost', i: 'torch' });
  if (kind === 'denied') return btn('Try again', 'rescan', { i: 'refresh' });
  return btn('Scan QR code', 'frame', { i: 'cam' }) + btn('Where is the QR code?', 'where', { cls: 'ivq-btn--ghost', i: 'pin' });   /* #1140: como en la cámara de la IV, no se lee solo: se pulsa («Take photo» + «Choose from gallery») */
}
/* #1139 · el visor ocupa todo el alto libre entre el titular y los botones (como .iv-prepw en la cámara de la IV) */
function scFit(){
  var sc = document.querySelector('.ivq-sc'); if (!sc) return;
  var top = sc.getBoundingClientRect().top + (window.scrollY || 0), dk = (!desk && dockEl && dockEl.style.display !== 'none') ? dockEl.getBoundingClientRect().height : 0;
  var h = Math.round(innerHeight - top - dk - (desk ? 28 : 12));
  sc.style.height = Math.max(desk ? 420 : 380, Math.min(desk ? 760 : 2000, h)) + 'px';
}
addEventListener('resize', scFit);
var camT = [];
function camFlow(el){
  camT.forEach(clearTimeout); camT = [];
  var setSt = function(s){ el.setAttribute('data-st', s); };
  var read = function(){ if (el.getAttribute('data-st') !== 'look') return; setSt('read'); [].forEach.call(document.querySelectorAll('[data-ivq="frame"].ivq-btn'), function(b){ b.classList.add('is-busy'); b.setAttribute('aria-busy', 'true'); b.querySelector('span').textContent = 'Reading the code…'; }); camT.push(setTimeout(function(){ setSt('done'); camT.push(setTimeout(function(){ location.href = IVSTD(); }, 1000)); }, 1300)); };   /* QR válido: directo a la IV estándar */
  el._read = read;
  /* #1140: sin lectura automática; se lee al pulsar «Scan QR code» (o tocando el visor) */
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
function closeSheet(now){ var s = document.querySelector('.ivq-sheet:not(.ivq-sheet--b)'); if (!s) return; s.classList.remove('on'); var rm = function(){ s.remove(); if (!document.querySelector('.ivq-cam:not(.ivq-cam--d),.ivq-lk')) document.documentElement.classList.remove('ivq-lock'); }; if (now === true) rm(); else setTimeout(rm, 220); }

var mount = null, dockEl = null;
function dockSet(html){
  if (!dockEl) return;
  var w = dockEl.querySelector('.contents') || dockEl;
  if (desk || !html) { dockEl.style.display = 'none'; return; }
  dockEl.style.display = ''; dockEl.classList.add('ivq-dock'); w.innerHTML = html;
}
var HEAD = { scan: ['Scan QR Code', 'Scan the QR code <span>at the entrance</span>', ''], wrong: ['Scan QR Code', 'Scan the QR code <span>at the entrance</span>', ''], outside: ['Scan QR Code', 'Scan the QR code <span>at the entrance</span>', ''], unreadable: ['Scan QR Code', 'Scan the QR code <span>at the entrance</span>', ''], denied: ['Scan QR Code', 'Allow <span>camera access</span>', ''], 'sum-before': ['Guest Summary', 'Guest <span>summary</span>', 'Registration is done. Identity verification happens at the property.'], 'sum-in': ['Guest Summary', 'Guest <span>summary</span>', 'Registration is done. Identity verification is now available at the property.'] };
function heads(){
  var hd = HEAD[state] || ['Scan QR Code', 'Scan QR <span>Code</span>', 'Identity verification at the property.'];
  [].forEach.call(document.querySelectorAll('header span, header h1, header p, header b'), function(e){ if (e.children.length === 0 && /^(Identity check|Guest Summary|Scan QR Code)$/.test(e.textContent.trim())) e.textContent = hd[0]; });
  var h1 = document.querySelector('.ivq-view h1'); if (h1 && /Verify at the|Guest|Scan QR/.test(h1.textContent)) h1.innerHTML = hd[1].replace('<span>', '<span class="text-[var(--chekin-color-brand-blue)]">');
  var sub = document.querySelector('.ivq-view p[class*="max-w-[480px]"]'); if (sub) { sub.textContent = hd[2]; sub.hidden = !hd[2]; }   /* #1139: el escáner, sin subtítulo (como la cámara de la IV) */
  /* Vela (escritorio): en producción el plazo empieza el día del check-in */
  [].forEach.call(document.querySelectorAll('aside p, aside span, aside div'), function(e){ if (e.children.length === 0 && /opens the day before check-in/.test(e.textContent)) e.textContent = 'Identity verification opens on your check-in day. You start it by scanning the QR at the entrance. Ask me anything about it.'; });
}
function render(){
  document.documentElement.setAttribute('data-ivq-state', 'v3-' + flow + '-' + state);
  [].forEach.call(document.querySelectorAll('.ivq-cam:not(.ivq-cam--d),.ivq-lk,.ivq-plw,.ivq-sheet'), function(e){ e.remove(); });
  document.documentElement.classList.remove('ivq-lock');
  if (flow === 'b') {
    var f = document.createElement('div'); f.innerHTML = bPage(state);
    while (f.firstChild) document.body.appendChild(f.firstChild);
    document.documentElement.classList.add('ivq-lock', 'pl-pat', 'pl-dx', 'pl-d2'); if (dockEl) dockEl.style.display = 'none';   /* las clases del Property Link: patrón sin foto y escritorio D2 (tarjeta flotante) */
    bFit(); requestAnimationFrame(bFit); if (document.fonts) document.fonts.ready.then(bFit);
    return;
  }
  if (!mount) return;
  heads();
  var camK = ['scan', 'wrong', 'outside', 'unreadable', 'denied'].indexOf(state) > -1 ? state : '';
  var body = state === 'sum-before' ? A.sum(false) : state === 'sum-in' ? A.sum(true) : state === 'unavailable' ? A.unavailable() : state === 'desk' ? A.desk() : camK ? camPage(camK === 'scan' ? '' : camK) : A.intro();   /* #1137: el escáner es una página (móvil y escritorio) */
  mount.innerHTML = '<div class="ivq-wrap" data-s="' + state + '">' + body + '</div>';
  dockSet(state === 'intro' ? btn('Continue to scan', 'scan') : state === 'unavailable' ? btn('Back to summary', 'sum') : state === 'desk' ? btn('Email me the link', 'email', { i: 'mail' }) : camK ? scActs(camK === 'scan' ? '' : camK) : '');
  if (camK === 'scan') camFlow(mount.querySelector('.ivq-sc'));
  if (camK) { scFit(); requestAnimationFrame(scFit); setTimeout(scFit, 300); }
}
/* A · página de huésped registrado (registered.js): la tarjeta «QR scan required at property» debajo del titular (solo fuera de plazo) */
function registeredBox(){
  var n = 0, t = setInterval(function(){
    var hero = document.querySelector('.rg-hero'); if (!hero && ++n < 40) return; clearInterval(t); if (!hero || document.querySelector('.ivq-rgbox')) return;
    var d = document.createElement('div'); d.className = 'ivq-rgbox'; d.innerHTML = BOX_REQ(); hero.insertAdjacentElement('afterend', d);
  }, 120);
}

/* vista «Móvil + escritorio»: lo que no navega se repite en el otro marco (mensaje ui-door, como las puertas de «Virtual keys») */
var MIRROR = { howc: 1, where: 1, shx: 1, torch: 1, frame: 1, rescan: 1, how: 1, copy: 1, email: 1, 'cam-ok': 1 }, mirroring = false;
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
  var cam = t.closest('.ivq-cam') || document.querySelector('.ivq-sc');
  if (a === 'scan') go('a-scan');
  else if (a === 'close') go('a-intro');
  else if (a === 'sum') go('a-sum-before');
  else if (a === 'guest') go(state === 'sum-before' ? 'a-unavailable' : 'a-intro');
  else if (a === 'where') whereSheet();
  else if (a === 'shx') closeSheet();
  else if (a === 'cam-ok') { var md = (cam || document).querySelector('.ivq-cam__modal'); if (md) md.remove(); }
  else if (a === 'torch') { var c = cam || document.querySelector('.ivq-cam'); if (!c) return; var on = !c.classList.contains('is-torch'); c.classList.toggle('is-torch', on); [].forEach.call(c.querySelectorAll('[data-ivq="torch"][aria-pressed]'), function(b){ b.setAttribute('aria-pressed', String(on)); }); }
  else if (a === 'frame') { if (cam && cam._read) cam._read(); }
  else if (a === 'rescan') go('a-scan');   /* #1137: volver a escanear = el escáner limpio */
  else if (a === 'howc') { var k = t.getAttribute('data-k'), r = t.closest('.ivq-sc'); [].forEach.call(r.querySelectorAll('[data-ivq="howc"]'), function(x){ var on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); [].forEach.call(r.querySelectorAll('.ivq-sc__how'), function(o){ o.hidden = o.getAttribute('data-how') !== k; }); }
  else if (a === 'copy' || a === 'email') { var sp = t.querySelector('span'), o = sp.getAttribute('data-l') || sp.textContent; sp.setAttribute('data-l', o); sp.textContent = a === 'copy' ? 'Copied' : 'Sent to ' + EMAIL; t.classList.add('is-ok'); if (a === 'copy') try { navigator.clipboard.writeText('https://guest.chekin.com/v/CHK-4829'); } catch (_) {} clearTimeout(t._t); t._t = setTimeout(function(){ sp.textContent = o; t.classList.remove('is-ok'); }, 1800); }
  /* B */
  else if (a === 'b-landing') go('b-landing');
  else if (a === 'b-search') {
    var col = t.closest('.pl-col') || document, empty = [].filter.call(col.querySelectorAll('.pl-f'), function(f){ return !f.querySelector('input').value.trim(); });
    if (empty.length) { [].forEach.call(empty, function(f){ f.classList.add('pl-err'); var er = f.querySelector('.pl-errt'); er.textContent = ERRT[f.getAttribute('data-f')] || 'Required'; er.hidden = false; }); empty[0].querySelector('input').focus(); bFit(); return; }
    var hasDoc = !!col.querySelector('[data-f="doc"]');
    t.classList.add('pl-looking'); t.setAttribute('aria-busy', 'true'); t.querySelector('span').textContent = 'Looking for your reservation…';   /* la búsqueda dentro del CTA, como el Property Link */
    setTimeout(function(){
      if (hasDoc) { if (matchK() === 'no') go('b-doc-wrong'); else bFound(); return; }
      var r = resK(); if (r === 'one') { bFound(); return; } go(r === 'multi' ? 'b-multi' : 'b-notfound');   /* encontrada: ficha de la reserva y luego la guestapp vuelve a pedir el QR (producción) */
    }, 1300);
  }
}
function onInput(e){
  var el = e.target; if (!el.closest) return;
  var f = el.closest('.pl-f.pl-err'); if (f) { f.classList.remove('pl-err'); f.querySelector('.pl-errt').hidden = true; if (flow === 'b') bFit(); }
}
function initScreen(){
  /* #1112: llegada desde «reserva encontrada» (QR de la propiedad): cortina azul que se recoge y la guestapp entra. Solo esta vez: se limpia el #from-found */
  if (location.hash === '#from-found' || window.__ivqFromFound) {   /* #1113: el resumen real (hub.js) reescribe la URL antes y se pierde el hash; la marca la deja el <head> */
    window.__ivqFromFound = 0; if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    var cu = document.createElement('div'); cu.className = 'ivq-curtain'; cu.setAttribute('aria-hidden', 'true'); document.body.appendChild(cu);
    document.documentElement.classList.add('ivq-enter'); document.documentElement.classList.remove('ivq-pre');
    setTimeout(function(){ cu.remove(); document.documentElement.classList.remove('ivq-enter'); }, 1300);
  }
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  if (flow === 'a' && state === 'registered') registeredBox();
  else if (flow === 'a' && state === 'registered-in') { /* producción: con el último huésped y dentro de plazo no sale ninguna caja del QR */ }
  else if (flow === 'a' && (state === 'sum-before' || state === 'sum-in')) {   /* #1113: el resumen es la pantalla real (hub.js, todos registrados); solo se añade la sección azul bajo la tarjeta de progreso */
    document.documentElement.setAttribute('data-ivq-state', 'v3-a-' + state);
    window.__ivqBox = sumBox;
    if (window.__hubRender) window.__hubRender();
  }
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
  var r = readK(), rs = resK(), mk = matchK();
  swA.innerHTML = ivdRow() + '<span>Pantalla</span>' + SA.map(function(s){ return b('a', s, NA[s], flow === 'a' && s === state); }).join('')
    + '<span>Registro</span>' + b('reg', 'all', 'Todos registrados', regK() === 'all') + b('reg', 'pend', 'Faltan huéspedes', regK() === 'pend')
    + '<span>Versión del resumen</span>' + b('sum', 'v12', 'V1.2 · Titular (final)', sumK() === 'v12') + b('sum', 'au', 'V5 · Tarjeta Aurora', sumK() === 'au');
  swB.innerHTML = '<span>Pantalla</span>' + SB.map(function(s){ return b('b', s, NB[s], flow === 'b' && s === state); }).join('')
    + '<span>Resultado de la búsqueda</span>' + [['one', 'Una'], ['multi', 'Varias'], ['none', 'Ninguna'], ['unreg', 'Sin registrar']].map(function(o){ return b('res', o[0], o[1], rs === o[0]); }).join('')
    + '<span>¿Coincide el documento?</span>' + b('match', 'yes', 'Sí', mk === 'yes') + b('match', 'no', 'No', mk === 'no')
    + '<span>Reserva encontrada</span>' + b('found', 'play', '▶ Ver animación', false);
}
function onSw(e){
  var t = e.target.closest('button'); if (!t) return; e.preventDefault(); e.stopPropagation();
  var g = t.getAttribute('data-g'), k = t.getAttribute('data-k');
  if (g === 'ivd') { ivdGo(k); return; }
  if (g === 'reg') { LS.set('replica-ivqa3-reg', k); var rk = k; location.href = 'ivqr-v3-a-' + (/^sum-/.test(state) ? state : 'sum-before') + EXT + '?ivreg=' + rk; return; }   /* #1128: el caso va en la URL, así la página de flujos lo sigue */
  if (g === 'sum') { LS.set('replica-ivqa3-sum', k); LS.set('replica-ivqa3-reg', 'all'); location.href = 'ivqr-v3-a-' + (/^sum-/.test(state) ? state : 'sum-before') + EXT + '?ivreg=all'; return; }
  if (g === 'found') { if (flow === 'b') bFound(true); else location.href = 'ivqr-v3-b-landing' + EXT; return; }
  if (g === 'a' || g === 'b') { location.href = 'ivqr-v3-' + g + '-' + k + EXT; return; }
  LS.set({ read: 'replica-ivq-read', res: 'replica-ivqb3-res', match: 'replica-ivqb3-match', }[g], k);
  paintSw();
}
swA.addEventListener('click', onSw, true); swB.addEventListener('click', onSw, true);

function init(){
  if (isQ) initScreen();
  paintSw();
  if (!isQ && IVD !== 'v3') return;   /* los grupos de la v3 solo con Old design v3 */
  if (window.__repPanel) { window.__repPanel.add('IV QR v3 · Reservation link', swA, isQ ? 18.5 : 34); window.__repPanel.add('IV QR v3 · Property QR', swB, isQ ? 18.6 : 34.1); }
  else if (isQ) { document.body.appendChild(swA); document.body.appendChild(swB); }
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
