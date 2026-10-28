/* Property link / User link: la entrada pública al check-in online, antes de tener reserva.
   Ajustes (panel → «Ajustes de la reserva»), como en el Dashboard (Account → Online check-in → Guest Reservation Lookup):
     · Tipo de enlace: Property link (una propiedad, puede crear la reserva) o User link (toda la cuenta, nunca crea).
     · Cómo buscan la reserva: nombre + fecha de entrada · código de reserva · email + fecha de entrada (uno o varios).
     · Pedir la propiedad (solo User link con nombre + fecha).
     · Crear la reserva si no aparece (solo Property link).
   Vista (panel → «Controles»): qué devuelve la búsqueda, para ver cada estado.
   Sin estado: solo se guardan los ajustes; al recargar, el flujo vuelve al principio. */
(function(){
'use strict';
var S0 = window.__SCREEN || {}, DESK = S0.v === 'd';
var root = document.getElementById('pl-root');
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

/* ---------- ajustes ---------- */
var C = {
  type: LSget('replica-pl-type', 'prop'),       /* prop · user */
  methods: LSget('replica-pl-m', 'nce'),        /* n = nombre + fecha · c = código · e = email + fecha */
  askProp: LSget('replica-pl-askp', '1'),
  create: LSget('replica-pl-create', '1'),
  out: LSget('replica-pl-out', 'found'),        /* found · multi · ambig · none · block */
  ph: LSget('replica-pl-ph', '1'),
  gi: 't2',                                     /* sin foto de la propiedad: patrón «Curvas de papel» (definitivo) */              /* imagen genérica elegida (sin foto) */              /* foto de la propiedad en la cabecera y en las animaciones: 1 = con foto · 0 = sin foto */
  av: '8',                                      /* animación definitiva: V8 (las demás quedan en el código como referencia) */              /* animación de búsqueda: 1 = hoja · 2 = pantalla completa */
  nn: LSget('replica-pl-nn', '2'),
  ocs: LSget('replica-oc-s', '0'),              /* one click: sesión iniciada al entrar (0 no · 1 sí) */
  ocv: (function(v){ return v === 'miss5' ? 'miss' : v; })(LSget('replica-oc-v', 'miss')),           /* one click: huéspedes guardados (none · ok · miss = uno con un dato pendiente) */
  ocg: (function(v){ return ['2', '4', '6', '9', '14'].indexOf(v) >= 0 ? v : '4'; })(LSget('replica-oc-g', '4')),   /* ajustes de la reserva (como en la Gestap): número de huéspedes */
  bmin: LSget('replica-oc-min', '1'),             /* hay menores en la reserva */
  bpay: LSget('replica-oc-pay', 'reservation'),   /* pagos pendientes, separados por comas (vacío = solo registro de huéspedes): deposit, taxes, reservation */
  bdep: LSget('replica-oc-dep', 'hold'),          /* tipo de depósito: retención (hold) o tarjeta guardada (token) */
  bra: LSget('replica-oc-ra', '1'),               /* remote access (llaves) */
  ocwc: 'g',                                     /* tarjeta del huésped pendiente («What's left»): gris de la Gestap (decidido); naranja y amarillo quedan solo en el CSS */
  ocx: '5',                                      /* «Complete the missing details»: definitiva V5 · tarjeta oscura + campo (2026-10-28); V0–V4 quedan solo en el código */               /* «Complete the missing details»: 4 versiones con el formulario de la Gestap */
  ocf: '2',                                      /* pantalla final (abriendo la reserva): definitiva 2 · Lista animada (2026-10-28); 1 resumen y 3 llaves quedan solo en el código */
  ocl: '4',                                      /* «What's left»: huésped con datos pendientes = V4 · Destacada (definitiva 2026-10-28); V1–V3 quedan solo en el código */
  oca: 'c',                                      /* «Almost done»: definitiva C · Lo que falta (2026-10-28); A lista y B anillo quedan solo en el código */
  gcm: LSget('replica-oc-gcm', 'ages'),         /* modal de huéspedes entre el paso 1 y el 2: «Por edad» (adultos + menores) o «Total», como en la Gestap */
  ocw: '13',                                     /* one click: entrada definitiva W13 (decidida 2026-10-28); W1–W12 quedan solo en el código como referencia */
  dv: '2',                                      /* escritorio definitivo: D2 · Tarjeta flotante (las demás quedan en el código como referencia) */              /* maquetación de escritorio: 0 = actual · 1 mitad y mitad · 2 tarjeta flotante · 3 banner panorámico · 4 minimal centrado */
  cv: '41',                                     /* tarjetas definitivas: C4.1 · Dónde + descripción (las demás quedan en el código como referencia) */              /* tarjetas de elección de método (V2): 0 actual · 1 recomendada · 2 lo que vas a escribir · 3 ayuda primero · 4 dónde encontrarlo */
  mv: LSget('replica-pl-mv', '1')               /* cómo se elige el método: 1 = pestañas · 2 = tarjetas de selección */
};
if (!/^[nce]+$/.test(C.methods)) C.methods = 'nce';
var ORDER = ['n', 'c', 'e'];
var methods = function(){ return ORDER.filter(function(m){ return C.methods.indexOf(m) >= 0; }); };
var isUser = function(){ return C.type === 'user'; };
var askProp = function(){ return isUser() && C.askProp === '1'; };
var canCreate = function(){ return !isUser() && C.create === '1'; };

/* ---------- datos de prueba ---------- */
var TODAY = new Date(2026, 9, 27);
var PROPS = [
  { id: 'vc', name: 'Villa Calipso', city: 'Albacete', bg: 'linear-gradient(135deg,#15153f,#2e46c8)' },
  { id: 'cl', name: 'Casa Lola', city: 'Valencia', bg: 'linear-gradient(135deg,#7a3cf0,#c86bfa)' },
  { id: 'gv', name: 'Ático Gran Vía', city: 'Madrid', bg: 'linear-gradient(135deg,#0f766e,#34d399)' },
  { id: 'ma', name: 'Mar Azul Apartments', city: 'Alicante', bg: 'linear-gradient(135deg,#0369a1,#38bdf8)' },
  { id: 'lr', name: 'Loft Ruzafa', city: 'Valencia', bg: 'linear-gradient(135deg,#b45309,#fbbf24)' },
  { id: 'cp', name: 'Masía Can Pons', city: 'Girona', bg: 'linear-gradient(135deg,#9f1239,#fb7185)' }
];
var HOST = function(){ return isUser() ? { name: 'Calipso Stays', logo: 'C' } : { name: 'Villa Calipso', logo: 'V' }; };
var BOOKING = { prop: 'vc', cin: new Date(2026, 10, 25), cout: new Date(2026, 10, 27), guests: 14 };
/* imágenes genéricas para cuando la propiedad no tiene foto: la de Dani (recepción) y 5 de Unsplash (licencia libre, enlazadas desde images.unsplash.com) */
var UNS = function(id){ return 'https://images.unsplash.com/photo-' + id + '?w=1600&q=72&auto=format&fit=crop'; };
/* genéricas: nada que indique un hotel concreto (sirven para apartamentos, casas y hoteles). Fotos (f*) y patrones (t*) */
var GEN = {
  r: '../assets/img/generic.jpg',
  f1: UNS('1741156386380-0236c72eb6f9'), f2: UNS('1733244766159-f58f4184fd38'), f3: UNS('1773277482770-785862e3960a'), f4: UNS('1670888664952-efff442ec0d2'), f5: UNS('1502301197179-65228ab57f78'),
  t1: UNS('1605106702842-01a887a31122'), t2: UNS('1650611250959-1e823abf6841'), t3: UNS('1714715362537-4aa538a6f0ab'), t4: UNS('1789654496055-db59d5df136f'), t5: UNS('1774356599784-c7589417c134')
};
var PROP_PHOTO = UNS('1758448500688-3ababa93fd67');   /* foto de la propiedad: el lobby de mármol (Unsplash) */
var PHOTO = function(){ return C.ph === '0' ? (GEN[C.gi] || GEN.t2) : PROP_PHOTO; };   /* sin foto de la propiedad: imagen genérica de recepción, con el mismo tratamiento */
var setNights = function(n){ BOOKING.cout = new Date(2026, 10, 25 + (+n || 2)); };   /* duración de prueba (panel): 2 · 7 · 15 noches */
setNights(C.nn);

/* ---------- fechas ---------- */
var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var MOL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var key = function(d){ return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
var parse = function(k){ var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
var add = function(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; };
var same = function(a, b){ return a && b && key(a) === key(b); };
var fmt = function(d){ return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()]; };
var nights = function(a, b){ return Math.round((b - a) / 864e5); };

/* ---------- iconos ---------- */
var P = {
  cal: '<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/><path d="M9 21.5v-7h6v7"/>',
  down: '<path d="m6 9 6 6 6-6"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.4 8.4 0 1 1 21 11.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  crown: '<path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 11H5z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 8 7 9.5 4.1-1.5 7-5.3 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };

var LANGS = [['EN', 'English'], ['ES', 'Español'], ['FR', 'Français'], ['DE', 'Deutsch'], ['IT', 'Italiano'], ['PT', 'Português']];
/* ---------- estado del flujo (solo en memoria) ---------- */
var S;
function reset(){
  S = { phase: 'form', method: methods()[0], f: { name: '', prop: '', cin: '', cout: '', code: '', email: '', cName: '', cEmail: '', guests: 1, cCin: '', cCout: '', bd: '', exp: '', nat: '', addr: '', city: '', zip: '' },
        oc: { why: false, save: null, step: C.ocs === '1' ? (C.ocv === 'none' ? 'new' : 'pick') : C.ocs === 'c' ? 'count' : 'welcome', sel: [], count: +C.ocg, ad: ocSplit()[0], mi: ocSplit()[1], busy: '', signed: C.ocs !== '0', fixd: {}, fq: [], fi: 0 },
        lang: 0, tip: null, picked: false, fails: 0, sug: '', until: 0, needCout: false, notice: null, err: {}, busy: false, sheet: null, cal: null, q: '' };
}
reset();

/* ---------- piezas ---------- */
var LABEL = { n: 'Name', c: 'Booking code', e: 'Email' };
/* cabecera: en móvil, la misma que la guestapp (botón cuadrado a la izquierda, nombre de la propiedad en el centro, logo de Chekin a la derecha); en escritorio, nombre a la izquierda e idioma a la derecha */
function header(){
  var h = HOST(), back = S.phase === 'create';
  var left = back ? '<button type="button" class="pl-sq" data-a="back" aria-label="Back">' + ic('left', 16) + '</button>' : '<span class="pl-sq pl-sq-empty" aria-hidden="true"></span>';   /* el idioma va sobre la foto; el hueco mantiene el nombre centrado */
  return '<header class="pl-top pl-top-m' + (back ? '' : ' pl-gone') + '">' + left + '<div class="pl-ttl"><b>' + esc(back ? 'New check-in' : h.name) + '</b></div><img class="pl-chk" src="../assets/logo-check.jpg" alt="Chekin" width="40" height="40"></header>'
    + '<header class="pl-top pl-top-d">' + (back ? '<button type="button" class="pl-back" data-a="back" aria-label="Back">' + ic('left', 20) + '</button><div class="pl-brand"><b>New check-in</b></div>'
    : '<div class="pl-brand"><span class="pl-logo" aria-hidden="true">' + h.logo + '</span><b>' + esc(h.name) + '</b></div>')
    + '<button type="button" class="pl-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 16) + LANGS[S.lang][0] + '</button></header>';
}
/* tarjeta de bienvenida con la UI de la cabecera del guidebook (V6): foto en duotono azul y caja de cristal abajo a la izquierda con icono, antetítulo, título y subtítulo.
   Solo guía a la búsqueda: dónde estás (antetítulo) y qué haces ahora (título y el dato que basta) */
var NEED = { n: 'your name and arrival date', c: 'your booking code', e: 'your email and arrival date' };
function heroHint(){ var ms = methods(); return ms.length > 1 ? NEED[ms[0]].charAt(0).toUpperCase() + NEED[ms[0]].slice(1) + ' are enough.' : 'You only need ' + NEED[ms[0]] + '.'; }
function hero(){
  var c = S.phase === 'create', hint = heroHint();
  var eye = c ? 'New check-in · ' + esc(prop(BOOKING.prop).name) : 'Welcome to ' + esc(HOST().name);
  var ti = c ? 'Tell us about your stay' : OC ? 'Let\'s check you in' : 'Let\'s find your booking';
  var ds = c ? 'Your dates and how many of you are coming.' : OC ? fmt(BOOKING.cin) + ' – ' + fmt(BOOKING.cout) + ' · ' + S.oc.count + (S.oc.count === 1 ? ' guest' : ' guests') : hint;
  var lang = '<button type="button" class="pl-gh-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button>';
  if (OC && C.ocw === '4' && S.oc.step === 'welcome') {   /* W4: la reserva sobre la foto */
    var nn = nights(BOOKING.cin, BOOKING.cout);
    var w4 = '<div class="pl-gh-m pl-w4h"><div class="pl-gh-row" style="margin:0 0 10px"><p class="pl-wel">Your stay at</p>' + lang + '</div><p class="pl-gh-name">' + esc(prop(BOOKING.prop).name) + '</p>'
      + '<div class="pl-w4tl"><div><small>Check-in</small><b>' + fmt(BOOKING.cin) + '</b><span>from ' + BK.tin + '</span></div><i><em>' + nn + (nn === 1 ? ' night' : ' nights') + '</em></i><div class="r"><small>Check-out</small><b>' + fmt(BOOKING.cout) + '</b><span>by ' + BK.tout + '</span></div></div>'
      + '<p class="pl-w4f"><span>' + ic('users', 14) + S.oc.count + (S.oc.count === 1 ? ' guest' : ' guests') + '</span><span>' + ic('hash', 14) + BK.ref + '</span><span>' + ic('pin', 14) + BK.city + '</span></p></div>';
    return '<section class="pl-gh pl-w4"><img src="' + PHOTO() + '" alt="">' + w4 + '</section>';
  }
  var welcome = c ? '' : '<div class="pl-gh-m"><p class="pl-wel">Welcome to</p><p class="pl-gh-name">' + esc(HOST().name) + '</p><div class="pl-gh-row"><p class="pl-loc">' + ic('pin', 15) + (isUser() ? '6 homes in Spain' : 'Albacete, Spain') + '</p>' + lang + '</div></div>';   /* solo móvil: bienvenida sobre la foto, con el idioma en la línea de la ubicación */
  return '<section class="pl-gh' + (c ? ' pl-dsk' : '') + '"><img src="' + PHOTO() + '" alt="">' + welcome
    + '<div class="pl-gh-gl"><span class="pl-gh-ic">' + ic(c ? 'cal' : OC ? 'users' : 'search', 24) + '</span><div class="pl-gh-tx"><span class="pl-gh-eye">' + eye + '</span><h1>' + ti + '</h1><p>' + ds + '</p></div></div></section>';
}
function prop(id){ for (var i = 0; i < PROPS.length; i++) if (PROPS[i].id === id) return PROPS[i]; return null; }
/* guías: dónde encontrar cada dato (icono «?» junto a la etiqueta; la burbuja flota y no mueve nada) */
var TIPS = {
  name: { t: 'Whose name?', d: 'The person who made the booking, as it appears on the confirmation. If someone booked for you (a friend, your company or a travel agency), use their name.' },
  prop: { t: 'Which property?', d: 'The name of the accommodation shown on your booking confirmation.' },
  cin: { t: 'Arrival date', d: 'The check-in date on your booking: the day you arrive, not the day you booked.' },
  cout: { t: 'Departure date', d: 'The check-out date on your booking: the day you leave.' },
  code: { t: 'Where to find your booking code', l: [['Booking.com', '“Booking number” in your confirmation email (10 digits).'], ['Airbnb', '“Confirmation code” in Trips, inside your reservation (starts with HM).'], ['Other sites or booked direct', 'The reference in your confirmation email.']] },
  email: { t: 'Which email?', d: 'The email address where you received your booking confirmation.' },
  cEmail: { t: 'Why your email?', d: 'We send you a link so you can come back to your check-in at any time. Optional.' }
};
/* móvil: el «?» abre la guía en una hoja (modal) · escritorio: aparece al pasar el ratón (o con el foco del teclado) */
function tipBody(k){ var t = TIPS[k]; return (t.d ? '<p>' + t.d + '</p>' : '') + (t.l ? '<ul>' + t.l.map(function(x){ return '<li><strong>' + x[0] + '</strong>' + x[1] + '</li>'; }).join('') + '</ul>' : ''); }
function tipBtn(k){ if (!TIPS[k]) return ''; return '<span class="pl-tipw"><button type="button" class="pl-tipb" data-a="tip" data-k="' + k + '" aria-label="Where do I find this?" aria-describedby="pl-tip-' + k + '">?</button><span class="pl-tip" id="pl-tip-' + k + '" role="tooltip"><b>' + TIPS[k].t + '</b>' + tipBody(k) + '</span></span>'; }
function tipBox(){ return ''; }
function sTip(k){ return '<div class="pl-ph"><h3 id="pl-sh">' + TIPS[k].t + '</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div><div class="pl-tipsheet">' + tipBody(k) + '</div><button type="button" class="pl-btn pri" data-a="close">Got it</button>'; }
function field(o){
  var err = S.err[o.k];
  return '<div class="pl-f' + (err ? ' pl-err' : '') + (o.isNew ? ' pl-new' : '') + (S.tip === o.k ? ' pl-tipon' : '') + '">'
    + '<div class="pl-lrow">' + (o.input ? '<label for="pl-' + o.k + '">' + o.label + '</label>' : '<span class="pl-lab" id="pl-l-' + o.k + '">' + o.label + '</span>') + tipBtn(o.k) + '</div>' + tipBox(o.k)
    + o.body
    + (err ? '<p class="pl-errt" role="alert">' + err + '</p>' : (o.hint ? '<p class="pl-hint">' + o.hint + '</p>' : '')) + '</div>';
}
function textField(k, label, ph, hint, attrs, isNew){
  return field({ k: k, label: label, hint: hint, input: true, isNew: isNew,
    body: '<div class="pl-field"><input id="pl-' + k + '" name="' + k + '" placeholder="' + ph + '" value="' + esc(S.f[k]) + '" ' + (attrs || '') + (S.err[k] ? ' aria-invalid="true"' : '') + '></div>' });
}
function dateField(k, label, hint, isNew, quick){
  var v = S.f[k] ? fmt(parse(S.f[k])) : '';
  var chips = '';
  if (quick) chips = '<div class="pl-quick">' + [[TODAY, 'Today'], [add(TODAY, 1), 'Tomorrow']].map(function(c){ var kk = key(c[0]); return '<button type="button" class="pl-chip' + (S.f[k] === kk ? ' on' : '') + '" data-a="quick" data-k="' + k + '" data-d="' + kk + '">' + c[1] + '</button>'; }).join('') + '</div>';
  return field({ k: k, label: label, hint: hint, isNew: isNew,
    body: '<button type="button" class="pl-field" data-a="cal" data-k="' + k + '" aria-labelledby="pl-l-' + k + '">' + (v ? '<span class="val">' + v + '</span>' : '<span class="val ph">Choose a date</span>') + ic('cal', 20) + '</button>' + chips });
}
function propField(){
  var p = prop(S.f.prop);
  return field({ k: 'prop', label: 'Where are you staying?', hint: 'Choose the property on your booking.',
    body: '<button type="button" class="pl-field" data-a="prop" aria-labelledby="pl-l-prop">' + (p ? '<span class="val">' + esc(p.name) + ' · ' + esc(p.city) + '</span>' : '<span class="val ph">Choose a property</span>') + ic('down', 20) + '</button>' });
}

/* ---------- avisos ---------- */
function otherWays(){
  var o = methods().filter(function(m){ return m !== S.method; });
  if (!o.length) return '';
  var t = { n: 'your name', c: 'your booking code', e: 'your email' };
  return '<p style="margin:8px 0 0">Or search with ' + o.map(function(m){ return '<button type="button" class="pl-link" data-a="tab" data-m="' + m + '">' + t[m] + '</button>'; }).join(' or ') + '.</p>';
}
function contact(){
  return '<div class="pl-contact"><a class="pl-btn sec sm" href="#" data-a="noop">' + ic('phone', 16) + 'Call</a><a class="pl-btn sec sm" href="#" data-a="noop">' + ic('chat', 16) + 'WhatsApp</a><a class="pl-btn sec sm" href="#" data-a="noop">' + ic('mail', 16) + 'Email</a></div>';
}
/* avisos de búsqueda: qué ha pasado, por qué puede ser y qué hacer ahora (sin culpar). En móvil van junto al botón en versión corta */
var KEYTIP = { n: 'Use the full name of whoever booked, and check the arrival date.', c: 'Copy the code exactly as it appears in your confirmation.', e: 'Use the email where you got your confirmation, and check the date.' };
function notice(){
  var n = S.notice; if (!n) return '';
  if (n === 'multi') return '<div class="pl-note info" role="status">' + ic('info', 20) + '<div><b>One more detail and we have it</b>More than one booking matches. Add your departure date to find yours.</div></div>';
  if (n === 'net') return '<div class="pl-note warn" role="alert">' + ic('alert', 20) + '<div><b>We couldn\'t connect</b>Check your internet connection and try again. Your details are still here.</div></div>';
  if (n === 'ambig') return '<div class="pl-note warn" role="alert">' + ic('alert', 20) + '<div><b>We can\'t tell which booking is yours</b><span class="pl-ctry">Several bookings share these details. </span><span class="pl-key">Please contact ' + esc(hostName()) + ' and they\'ll send you your check-in link.</span>' + otherWays() + '</div></div>';
  var again = S.fails > 1;
  var tips = S.method === 'c' ? ['Copy the code exactly as it appears in your confirmation email.', 'On Airbnb or Booking.com it is in the reservation details.']
    : S.method === 'e' ? ['Use the email address where you received the confirmation.', 'Check the arrival date: the day you arrive, not the day you booked.']
    : ['Use the full name of the person who made the booking.', 'Check the arrival date: the day you arrive, not the day you booked.'].concat(askProp() ? ['Make sure you chose the right property.'] : []);
  if (again) tips.push('Booked very recently? Try again a little later.', 'Still stuck? Please contact ' + hostName() + ' directly.');
  return '<div class="pl-note err" role="alert">' + ic('alert', 20) + '<div><b>' + (again ? 'Still no booking with these details' : 'No booking found with these details') + '</b><span class="pl-ctry">Check them and try again:</span><span class="pl-key">' + (again ? 'Still stuck? Please contact ' + esc(hostName()) + ' directly.' : KEYTIP[S.method]) + '</span><ul>' + tips.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul>' + otherWays() + '</div></div>';
}
function hostName(){ var p = isUser() && S.f.prop ? prop(S.f.prop) : null; return p ? p.name : HOST().name; }

/* ---------- pantallas ---------- */
/* V2: el método se elige con tarjetas de selección (una pantalla de elección y luego su formulario) */
var MO2 = {
  n: { i: 'user', t: 'Name and arrival date', d: 'The name of whoever booked and the day you arrive.', meta: ['check', 'Easiest · nothing to look up'] },
  c: { i: 'hash', t: 'Booking code', d: 'The reference in your confirmation email, or on Airbnb or Booking.com.', meta: ['mail', 'e.g. HMX4K2P9TR'] },
  e: { i: 'mail', t: 'Email and arrival date', d: 'The email address you booked with and the day you arrive.', meta: ['check', 'No code needed'] }
};
/* bienvenida dentro de la tarjeta (solo la usan algunas maquetaciones de escritorio, p. ej. D4) */
function dwel(){ return '<div class="pl-dwel"><span class="pl-dwel-t">Welcome to <b>' + esc(HOST().name) + '</b></span><span class="pl-dwel-l">' + ic('pin', 14) + (isUser() ? '6 homes in Spain' : 'Albacete, Spain') + '</span><button type="button" class="pl-gh-lang pl-dwel-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button></div>'; }
/* C1–C4: cuatro formas de elegir cómo buscar, pensadas para resolver las dudas de ese momento (cuál elijo, qué necesito, dónde está, y si no lo tengo) */
var PRE = { n: [['user', 'Maria Lowe'], ['cal', '25 Nov']], c: [['hash', 'HMX4K2P9TR']], e: [['mail', 'maria@email.com'], ['cal', '25 Nov']] };
var NEEDS = { n: ['Name', 'Arrival date'], c: ['Booking code'], e: ['Email', 'Arrival date'] };
var WHERE = { n: ['Your booking confirmation'], c: ['Email', 'Airbnb', 'Booking.com'], e: ['Your confirmation email'] };
var SHORT = { n: 'Name + arrival date', c: 'Booking code', e: 'Email + arrival date' };
function chooserList(ms){
  var cv = C.cv, go = '<span class="pl-mo-go">' + ic('right', 18) + '</span>';
  if (cv === '1') {   /* recomendada + alternativas */
    var main = ms[0], rest = ms.slice(1), o = MO2[main];
    return '<button type="button" class="pl-c1-main" data-a="pickm" data-m="' + main + '"><span class="pl-mo-ic">' + ic(o.i, 24) + '</span><span class="pl-mo-tx"><em class="pl-rec">' + ic('check', 12) + (main === 'n' ? 'Recommended · always works' : 'Recommended') + '</em><b>' + o.t + '</b><span>' + o.d + '</span></span>' + go + '</button>'
      + (rest.length ? '<p class="pl-c1-or">Or use</p><div class="pl-c1-rest">' + rest.map(function(m){ var r = MO2[m]; return '<button type="button" class="pl-c1-row" data-a="pickm" data-m="' + m + '"><span class="pl-mo-ic sm">' + ic(r.i, 18) + '</span><b>' + r.t + '</b>' + ic('right', 16) + '</button>'; }).join('') + '</div>' : '');
  }
  if (cv === '2') {   /* lo que vas a escribir */
    return '<div class="pl-c2">' + ms.map(function(m){ var o = MO2[m]; return '<button type="button" class="pl-c2-b" data-a="pickm" data-m="' + m + '"><span class="pl-c2-top"><b>' + o.t + '</b>' + go + '</span><span class="pl-c2-pre">' + PRE[m].map(function(x){ return '<span class="pl-c2-f">' + ic(x[0], 15) + x[1] + '</span>'; }).join('') + '</span></button>'; }).join('') + '</div>';
  }
  if (cv === '3') {   /* ayuda primero + lista compacta */
    var hasN = ms.indexOf('n') >= 0;
    return '<div class="pl-c3-help">' + ic('info', 18) + '<span><b>Not sure which?</b> ' + (hasN ? 'Your name and arrival date always work.' : 'Any option finds the same booking.') + '</span></div>'
      + '<div class="pl-c3">' + ms.map(function(m){ var o = MO2[m]; return '<button type="button" class="pl-c3-b" data-a="pickm" data-m="' + m + '"><span class="pl-mo-ic sm">' + ic(o.i, 18) + '</span><span class="pl-c3-tx"><b>' + o.t + '</b><span class="pl-c3-need">You\'ll need ' + NEEDS[m].map(function(x){ return '<i>' + x + '</i>'; }).join('') + '</span></span>' + ic('right', 18) + '</button>'; }).join('') + '</div>';
  }
  if (cv === '4' || cv === '41') {   /* dónde encontrarlo (C4.1: + la descripción de las tarjetas actuales) */
    return '<div class="pl-c4' + (cv === '41' ? ' pl-c41' : '') + '">' + ms.map(function(m){ var o = MO2[m]; return '<button type="button" class="pl-c4-b" data-a="pickm" data-m="' + m + '"><span class="pl-c4-top"><span class="pl-mo-ic sm">' + ic(o.i, 18) + '</span><span class="pl-c4-tt"><b>' + o.t + '</b>' + (cv === '41' ? '<span class="pl-c4-d">' + o.d + '</span>' : '') + '</span>' + go + '</span><span class="pl-c4-where"><small>Find it in</small>' + WHERE[m].map(function(x){ return '<i>' + x + '</i>'; }).join('') + '</span></button>'; }).join('') + '</div>';
  }
  return null;
}
function vChooser(){
  var ms = methods();
  var list = '<div class="pl-mo" role="list">' + ms.map(function(m){ var o = MO2[m];
    return '<button type="button" role="listitem" class="pl-mo-b" data-a="pickm" data-m="' + m + '"><span class="pl-mo-ic">' + ic(o.i, 22) + '</span><span class="pl-mo-tx"><b>' + o.t + (o.k ? '<em>' + o.k + '</em>' : '') + '</b><span>' + o.d + '</span><small>' + ic(o.meta[0], 13) + o.meta[1] + '</small></span><span class="pl-mo-go">' + ic('right', 18) + '</span></button>'; }).join('') + '</div>';
  var alt = chooserList(ms); if (alt) list = alt;
  var lead = { '1': 'Pick the option you have to hand.', '2': 'What do you have to hand? Tap the one you recognise.', '3': 'Choose one. You only need what\'s shown.', '4': 'Choose the one you can find most easily.', '41': 'Choose the one you can find most easily.' }[C.cv] || 'How would you like to search? Choose the one you have to hand.';
  var card = '<section class="pl-card pl-main-card pl-cv' + C.cv + '" aria-labelledby="pl-h">' + dwel() + '<h2 id="pl-h">Let\'s find your booking</h2><p class="pl-lead pl-keep">' + lead + '</p>' + list + '</section>';
  return hero() + '<div class="pl-col">' + card + '</div>';
}
function mbar(){
  var o = MO2[S.method];
  return '<div class="pl-mbar"><span class="pl-mo-ic sm">' + ic(o.i, 18) + '</span><span class="pl-mbar-tx"><small>Searching with</small><b>' + o.t + '</b></span><button type="button" class="pl-link" data-a="changem">Change</button></div>';
}
function vForm(){
  var ms = methods(), m = S.method, f = '', v2 = C.mv === '2' && ms.length > 1;
  if (v2 && !S.picked) return vChooser();
  var lead = ms.length > 1 ? 'Use whichever you have to hand.' : { n: 'Enter the name on the booking and your arrival date.', c: 'Enter the code from your booking confirmation.', e: 'Enter the email you booked with and your arrival date.' }[m];
  if (v2) f += mbar();
  else if (ms.length > 1) f += '<div class="pl-tabs" role="tablist" aria-label="Search with">' + ms.map(function(x){ return '<button type="button" role="tab" class="pl-tab' + (x === m ? ' on' : '') + '" aria-selected="' + (x === m) + '" data-a="tab" data-m="' + x + '">' + LABEL[x] + '</button>'; }).join('') + '</div>';
  var mob = isMob(), nt = notice();
  if (!mob) f += nt;   /* en móvil el aviso va junto al botón, en el hueco libre: así el formulario no se mueve */
  if (m === 'n') {
    f += textField('name', 'Name on the booking', 'e.g. Maria Lowe', 'First name and surname of whoever booked.', 'autocomplete="name" autocapitalize="words" enterkeyhint="next"');
    if (askProp()) f += propField();
    f += dateField('cin', 'Arrival date', '', false, true);
  } else if (m === 'c') {
    f += textField('code', 'Booking code', 'e.g. HMX4K2P9TR', 'In your confirmation email, or on Airbnb or Booking.com.', 'autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="search"');
  } else {
    f += textField('email', 'Email you booked with', 'name@email.com', S.sug ? 'Did you mean <b>' + esc(S.sug) + '</b>? <button type="button" class="pl-link" data-a="usesug">Use it</button>' : 'Where you received your booking confirmation.', 'type="email" inputmode="email" autocomplete="email" autocapitalize="off" enterkeyhint="next"');
    f += dateField('cin', 'Arrival date', '', false, true);
  }
  if (S.needCout) f += dateField('cout', 'Departure date', 'Only needed to tell similar bookings apart.', S.notice === 'multi', false);
  var card = '<section class="pl-card pl-main-card" aria-labelledby="pl-h">' + dwel() + '<h2 id="pl-h"><span class="pl-om">Let\'s find your booking</span><span class="pl-od">Your booking details</span></h2><p class="pl-lead"><span class="pl-om">' + (v2 ? { n: 'Enter the name on the booking and your arrival date.', c: 'Enter the code from your booking confirmation.', e: 'Enter the email you booked with and your arrival date.' }[m] : heroHint() + ' ' + (ms.length > 1 ? 'Or use another option below.' : '')) + '</span><span class="pl-od">' + lead + '</span></p>' + f + '</section>';
  var alt = '';
  /* la reserva nueva solo se ofrece a partir del 2.º intento fallido (evita duplicar reservas que sí existen). No hay forma de contactar con el alojamiento: no se ofrece */
  var offerCreate = S.notice === 'none' && canCreate() && S.fails > 1;
  if (offerCreate) alt = '<section class="pl-alt"><h3>Still not finding it?</h3><p>If you\'re sure you\'re staying at ' + esc(hostName()) + ', start your check-in with your dates. ' + esc(hostName()) + ' receives it straight away.</p><button type="button" class="pl-btn sec sm" data-a="create">Start a new check-in' + ic('arrow', 16) + '</button></section>';
  var extra = '';
  if (mob && alt) { extra = '<div class="pl-dn-act"><button type="button" class="pl-btn sec sm" data-a="create">Start a new check-in' + ic('arrow', 16) + '</button></div>'; alt = ''; }
  var dock = '<div class="pl-dock"><div>' + (mob && nt ? '<div class="pl-dnote">' + nt + extra + '</div>' : '') + '<button type="button" class="pl-btn pri' + (S.cta ? ' pl-looking' : '') + '" data-a="search"' + (S.cta ? ' aria-busy="true"' : '') + '><span>' + (S.cta ? 'Looking for your booking…' : S.notice === 'net' ? 'Try again' : 'Find my booking') + '</span></button></div></div>';
  return hero() + '<div class="pl-col">' + card + alt + dock + '</div>';
}
/* demasiados intentos: cuenta atrás en vivo, los datos se guardan y al terminar vuelve sola al formulario */
var cdT = 0;
function mmss(ms){ var t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
function vBlocked(){
  clearInterval(cdT);
  cdT = setInterval(function(){ var el = document.getElementById('pl-cd'), left = S.until - Date.now(); if (left <= 0) { clearInterval(cdT); S.phase = 'form'; S.notice = null; render(); return; } if (el) el.textContent = mmss(left); }, 1000);
  var card = '<section class="pl-card pl-main-card" aria-labelledby="pl-h">' + dwel() + '<div class="pl-block"><span class="pl-block-ic">' + ic('clock', 26) + '</span><h2 id="pl-h">Let\'s take a short break</h2><p class="pl-lead">To keep bookings safe, searching is paused after several tries. Your details are kept.</p><p class="pl-cdw">You can try again in <b id="pl-cd" aria-live="off">' + mmss(S.until - Date.now()) + '</b></p><p class="pl-lead" style="margin-top:14px">In a hurry? Please contact ' + esc(hostName()) + ' directly.</p></div></section>';
  var dock = '';
  return hero() + '<div class="pl-col">' + card + dock + '</div>';
}
function vCreate(){
  var f = '';
  f += '<div class="pl-two">' + dateField('cCin', 'Arrival', '', false, false) + dateField('cCout', 'Departure', '', false, false) + '</div>';
  f += field({ k: 'guests', label: 'How many guests?', hint: 'Including you. Children count too.', body: '<div class="pl-step"><span>Guests</span><div class="ctl"><button type="button" data-a="gm" aria-label="One guest less"' + (S.f.guests <= 1 ? ' disabled' : '') + '>−</button><output aria-live="polite">' + S.f.guests + '</output><button type="button" class="add" data-a="gp" aria-label="One guest more"' + (S.f.guests >= 16 ? ' disabled' : '') + '>+</button></div></div>' });
  f += textField('cName', 'Your name', 'e.g. Maria Lowe', '', 'autocomplete="name" autocapitalize="words"');
  f += textField('cEmail', 'Your email', 'name@email.com', 'We send you a link to come back to your check-in.', 'type="email" inputmode="email" autocomplete="email" autocapitalize="off"');
  var card = '<section class="pl-card" aria-labelledby="pl-h"><h2 id="pl-h">Your stay</h2><p class="pl-lead">Villa Calipso receives this check-in with your dates.</p>' + f + '</section>';
  var dock = '<div class="pl-dock"><div><button type="button" class="pl-btn pri" data-a="cgo"' + (S.busy ? ' aria-busy="true"' : '') + '>' + (S.busy ? '<span class="pl-spin" aria-hidden="true"></span>Starting…' : 'Start check-in' + ic('arrow', 18)) + '</button></div></div>';
  return hero() + '<div class="pl-col">' + card + dock + '</div>';
}
function titleCase(s){ return s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)(\S)/g, function(m, a, b){ return a + b.toUpperCase(); }); }
function add15(){ var d = new Date(); d.setMinutes(d.getMinutes() + 5); return d; }
function hhmm(d){ return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

/* ---------- hojas ---------- */
function sheet(){
  if (!S.sheet) return '';
  if (S.sheet === 'ocdone') return sOcDone();
  if (S.sheet === 'search') return ({ '2': sSearchFull, '3': sV3, '4': sV4, '5': sV5, '6': sV6, '7': sV7, '8': sV8 }[C.av] || sSearch)();
  var inner = S.sheet === 'ochow' ? sOcHow() : S.sheet === 'ocwhy' ? sOcWhy() : S.sheet === 'ocmiss' ? sOcMiss() : S.sheet === 'occount' ? sOcCount() : S.sheet === 'prop' ? sProp() : S.sheet === 'lang' ? sLang() : S.sheet === 'contact' ? sContact() : /^tip:/.test(S.sheet) ? sTip(S.sheet.slice(4)) : sCal();
  return '<div class="pl-sheet" data-a="close" role="presentation"><div class="pl-pane" role="dialog" aria-modal="true" aria-labelledby="pl-sh">' + '<div class="pl-grab"></div>' + inner + '</div></div>';
}
function sSearch(){
  var b = BOOKING, p = prop(isUser() && S.f.prop ? S.f.prop : b.prop) || prop('vc'), who = S.f.name ? titleCase(S.f.name) : '';
  var body = S.sr === 'looking'
    ? '<div class="pl-radar" aria-hidden="true"><i></i><i></i><span>' + ic('search', 26) + '</span></div><h3 id="pl-sh">Looking for your booking…</h3><p class="pl-sp">Checking ' + esc(isUser() && !S.f.prop ? 'all ' + HOST().name + ' properties' : p.name) + '. This only takes a moment.</p>'
    : '<span class="pl-ok">' + ic('check', 28) + '</span><h3 id="pl-sh">We found your booking</h3>'
      + '<div class="pl-stay"><div class="row"><div><small>Check-in</small><strong>' + fmt(b.cin) + '</strong></div><span class="pl-n">' + nights(b.cin, b.cout) + ' nights</span><div class="r"><small>Check-out</small><strong>' + fmt(b.cout) + '</strong></div></div><hr>'
      + '<div class="meta">' + ic('pin', 16) + esc(p.name) + ', ' + esc(p.city) + '</div><div class="meta">' + ic('user', 16) + b.guests + ' guests' + (who ? ' · booked by ' + esc(who) : '') + '</div></div>'
      + '<div class="pl-open"><span>Opening your booking…</span><i><b></b></i></div>'
      + '<button type="button" class="pl-btn txt" data-a="cancel">Not your booking? Go back</button>';
  return '<div class="pl-sheet pl-srch" role="presentation"><div class="pl-pane" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><div class="pl-grab"></div>' + body + '</div></div>';
}
/* idioma: solo la hoja (la réplica sigue en inglés) */
function sLang(){
  return '<div class="pl-ph"><h3 id="pl-sh">Language</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<div class="pl-list" role="listbox" aria-label="Language">' + LANGS.map(function(l, i){ var on = S.lang === i; return '<button type="button" role="option" aria-selected="' + on + '" class="pl-opt' + (on ? ' on' : '') + '" data-a="setlang" data-i="' + i + '"><span class="th pl-lth">' + l[0] + '</span><span><b>' + l[1] + '</b></span>' + (on ? '<span class="ck">' + ic('check', 18) + '</span>' : '') + '</button>'; }).join('') + '</div>';
}
/* V2: pantalla completa sobre la foto en duotono. «Looking for your booking…» es solo un instante, sin spinner; si no aparece, se vuelve al formulario con el error */
function sSearchFull(){
  var b = BOOKING, p = prop(isUser() && S.f.prop ? S.f.prop : b.prop) || prop('vc'), who = S.f.name ? titleCase(S.f.name) : '';
  var body = S.sr === 'looking'
    ? '<div class="pl-fs-c pl-fs-look"><h2 id="pl-sh">Looking for your booking…</h2></div>'
    : '<div class="pl-fs-c pl-fs-found"><span class="pl-fs-ok">' + ic('check', 30) + '</span><p class="pl-fs-eye">Booking found</p><h2 id="pl-sh">Welcome' + (who ? ', ' + esc(who.split(' ')[0]) : '') + '!</h2>'
      + '<div class="pl-fs-stay"><div class="row"><div><small>Check-in</small><strong>' + fmt(b.cin) + '</strong></div><span class="pl-n">' + nights(b.cin, b.cout) + ' nights</span><div class="r"><small>Check-out</small><strong>' + fmt(b.cout) + '</strong></div></div>'
      + '<div class="meta">' + ic('pin', 16) + esc(p.name) + ', ' + esc(p.city) + '</div><div class="meta">' + ic('user', 16) + b.guests + ' guests' + (who ? ' · booked by ' + esc(who) : '') + '</div></div>'
      + '<p class="pl-fs-open">Opening your booking…</p></div>'
      + '<div class="pl-fs-foot"><button type="button" class="pl-fs-back" data-a="cancel">Not your booking? Go back</button></div>';
  return '<div class="pl-fs" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt="">' + body + '</div>';
}
/* ---------- V3–V6: animaciones de «reserva encontrada» ---------- */
function stayData(){ var b = BOOKING, p = prop(isUser() && S.f.prop ? S.f.prop : b.prop) || prop('vc'), who = S.f.name ? titleCase(S.f.name) : ''; return { b: b, p: p, who: who, first: who ? who.split(' ')[0] : '' }; }
function hello(d){ return 'Welcome' + (d.first ? ', ' + esc(d.first) : '') + '!'; }
/* «reserva encontrada» sin tick: una lupa que se convierte en la casa (lo que buscabas es tu alojamiento) */
var FOUND_SVG = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="c" cx="26" cy="26" r="24"/><g class="mg"><circle cx="24" cy="24" r="7.5"/><path d="m29.5 29.5 6 6"/></g><path class="hs" d="M15 26 26 17l11 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 15 36.5z"/><path class="dr" d="M22.5 38v-6.5h7V38"/></svg>';
var CHECK_SVG = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="c" cx="26" cy="26" r="24"/><path class="k" d="M15 27l7.5 7.5L38 18"/></svg>';
function goBack(dark){ return '<div class="pl-x-foot"><button type="button" class="pl-x-back' + (dark ? ' dk' : '') + '" data-a="cancel">Not your booking? Go back</button></div>'; }
function openTxt(){ return '<p class="pl-x-open">Opening your booking<i></i></p>'; }
/* V3 · Desde el botón: el azul del CTA se expande en círculo hasta llenar la pantalla; el check se dibuja y la reserva sube */
function sV3(){
  var d = stayData(), o = S.org || { x: innerWidth / 2, y: innerHeight - 40 };
  return '<div class="pl-fx pl-v3" style="--x:' + o.x + 'px;--y:' + o.y + 'px" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt="">'
    + '<div class="pl-x-c"><span class="pl-draw">' + CHECK_SVG + '</span><p class="pl-x-eye">Booking found</p><h2 id="pl-sh">' + hello(d) + '</h2>'
    + '<div class="pl-x-glass"><div class="row"><div><small>Check-in</small><strong>' + fmt(d.b.cin) + '</strong></div><span class="pl-n">' + nights(d.b.cin, d.b.cout) + ' nights</span><div class="r"><small>Check-out</small><strong>' + fmt(d.b.cout) + '</strong></div></div>'
    + '<div class="meta">' + ic('pin', 16) + esc(d.p.name) + ', ' + esc(d.p.city) + '</div><div class="meta">' + ic('user', 16) + d.b.guests + ' guests</div></div>' + openTxt() + '</div>' + goBack() + '</div>';
}
/* V4 · Se abre la foto: la foto de la cabecera crece hasta ocupar toda la pantalla y pasa del duotono al color real; la bienvenida y la reserva aparecen encima */
/* V8 · V3 abriéndose como V4: la cabecera (foto en duotono) crece desde su sitio hasta llenar la pantalla y, dentro, el contenido de V3 (check que se dibuja, bienvenida y la reserva en cristal) */
function sV8(){
  var d = stayData(), h = S.hr || { t: 0, l: 0, r: 0, b: Math.round(innerHeight * .7) };
  return '<div class="pl-fx pl-v8" style="--t:' + h.t + 'px;--l:' + h.l + 'px;--r:' + h.r + 'px;--b:' + h.b + 'px" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt="">'
    + '<div class="pl-x-c"><span class="pl-draw pl-found">' + FOUND_SVG + '</span><p class="pl-x-eye">Booking found</p><h2 id="pl-sh">' + hello(d) + '</h2>'
    + '<div class="pl-x-glass"><div class="row"><div><small>Check-in</small><strong>' + fmt(d.b.cin) + '</strong></div><span class="pl-n">' + nights(d.b.cin, d.b.cout) + ' nights</span><div class="r"><small>Check-out</small><strong>' + fmt(d.b.cout) + '</strong></div></div>'
    + '<div class="meta">' + ic('pin', 16) + esc(d.p.name) + ', ' + esc(d.p.city) + '</div><div class="meta">' + ic('user', 16) + d.b.guests + ' guests</div></div>' + openTxt() + '</div></div>';
}
function sV4(){
  var d = stayData(), h = S.hr || { t: 0, l: 0, r: 0, b: Math.round(innerHeight * .7) };
  return '<div class="pl-fx pl-v4" style="--t:' + h.t + 'px;--l:' + h.l + 'px;--r:' + h.r + 'px;--b:' + h.b + 'px" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt=""><i class="pl-v4-tint"></i><i class="pl-v4-scrim"></i>'
    + '<div class="pl-v4-c"><p class="pl-x-eye">' + ic('check', 14) + 'Booking found</p><h2 id="pl-sh">' + hello(d) + '</h2><p class="pl-v4-sub">Your stay at ' + esc(d.p.name) + '</p>'
    + '<div class="pl-v4-pills"><span>' + ic('cal', 15) + fmt(d.b.cin) + ' → ' + fmt(d.b.cout) + '</span><span>' + nights(d.b.cin, d.b.cout) + ' nights</span><span>' + ic('user', 15) + d.b.guests + ' guests</span></div>' + openTxt() + '</div>' + goBack() + '</div>';
}
/* V5 · Tarjeta de reserva: una tarjeta tipo billete sube con muelle desde abajo, con la foto, las fechas en grande y el sello «Found» */
function sV5(){
  var d = stayData(), ci = d.b.cin, co = d.b.cout;
  var day = function(x, lab, al){ return '<div class="' + (al || '') + '"><small>' + lab + '</small><strong>' + x.getDate() + ' ' + MO[x.getMonth()] + '</strong><span>' + WD[x.getDay()] + '</span></div>'; };
  return '<div class="pl-fx pl-v5" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><div class="pl-v5-c"><p class="pl-x-eye lt">Booking found</p><h2 id="pl-sh">' + hello(d) + '</h2>'
    + '<div class="pl-tk"><div class="pl-tk-ph"><img src="' + PHOTO() + '" alt=""><span class="pl-tk-nm"><b>' + esc(d.p.name) + '</b>' + ic('pin', 13) + esc(d.p.city) + '</span><span class="pl-stamp">' + ic('check', 14) + 'Found</span></div>'
    + '<div class="pl-tk-d">' + day(ci, 'Check-in') + '<span class="pl-tk-n"><i></i>' + nights(ci, co) + ' nights<i></i></span>' + day(co, 'Check-out', 'r') + '</div>'
    + '<div class="pl-tk-cut"></div><div class="pl-tk-f">' + ic('user', 16) + d.b.guests + ' guests' + (d.who ? ' · booked by ' + esc(d.who) : '') + '</div></div>' + openTxt() + '</div>' + goBack() + '</div>';
}
/* V6 · Puertas: dos hojas azules se abren desde el centro y descubren la propiedad a todo color; la bienvenida sube en el centro */
function sV6(){
  var d = stayData();
  return '<div class="pl-fx pl-v6" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt=""><i class="pl-v6-scrim"></i>'
    + '<i class="pl-door l"></i><i class="pl-door r"></i><span class="pl-v6-seal">' + ic('check', 26) + '</span>'
    + '<div class="pl-v6-c"><p class="pl-x-eye">Booking found</p><h2 id="pl-sh">' + hello(d) + '</h2><p class="pl-v6-sub">' + esc(d.p.name) + ' is ready for you</p>'
    + '<div class="pl-x-glass sm"><div class="row"><div><small>Check-in</small><strong>' + fmt(d.b.cin) + '</strong></div><span class="pl-n">' + nights(d.b.cin, d.b.cout) + ' nights</span><div class="r"><small>Check-out</small><strong>' + fmt(d.b.cout) + '</strong></div></div></div>' + openTxt() + '</div>' + goBack() + '</div>';
}
/* V7 · Tus datos encajan: lo que escribió el huésped (nombre, fecha, código o email) despega de sus campos, converge en el centro y se funde en el check;
   de ahí sale la bienvenida y su semana: los días de la estancia se encienden uno a uno y una barra los une. Mensaje: «lo que has puesto es tu reserva» */
/* la estancia en V7, según cuánto dure:
   · cabe en 1 o 2 semanas → calendario de lunes a domingo (una fila por semana): los días se encienden uno a uno y una barra los une (partida entre filas)
   · más larga → línea de tiempo: entrada, una línea que se dibuja con las noches en medio, y salida */
function stayView(ci, co, span){
  var mon = add(ci, -((ci.getDay() + 6) % 7)), sun = add(co, (7 - co.getDay()) % 7), rows = Math.round((sun - mon) / 864e5 + 1) / 7;
  var mlab = ci.getMonth() === co.getMonth() ? MOL[ci.getMonth()] + ' ' + ci.getFullYear() : MOL[ci.getMonth()] + ' – ' + MOL[co.getMonth()] + ' ' + co.getFullYear();
  if (rows <= 2) {
    var step = Math.min(160, Math.round(900 / Math.max(1, span))), html = '<p class="pl-wk-m">' + mlab + '</p>';
    for (var r = 0; r < rows; r++) {
      var r0 = add(mon, r * 7), r6 = add(r0, 6), days = '';
      for (var i = 0; i < 7; i++) {
        var x = add(r0, i), inS = x >= ci && x <= co, k = Math.round((x - ci) / 864e5);
        days += '<span class="pl-wk-d' + (inS ? ' on' : '') + (same(x, ci) ? ' ci' : '') + (same(x, co) ? ' co' : '') + (x.getDate() === 1 ? ' m1' : '') + '"' + (inS ? ' style="animation-delay:' + (1350 + k * step) + 'ms"' : '') + '><small>' + (x.getDate() === 1 ? MO[x.getMonth()] : WD[x.getDay()].charAt(0)) + '</small><b>' + x.getDate() + '</b></span>';
      }
      /* tramo de barra en esta fila: de centro a centro de celda, o hasta el borde si sigue en la otra fila */
      var a0 = ci > r0 ? Math.round((ci - r0) / 864e5) : -1, a1 = co < r6 ? Math.round((co - r0) / 864e5) : 7;
      var from = a0 < 0 ? 0 : (a0 + .5) / 7 * 100, to = a1 > 6 ? 100 : (a1 + .5) / 7 * 100;
      var bar = (ci <= r6 && co >= r0) ? '<i class="pl-wk-bar" style="left:' + from.toFixed(2) + '%;width:' + (to - from).toFixed(2) + '%;animation-delay:' + (1450 + r * 350) + 'ms"></i>' : '';
      html += '<div class="pl-wk-row">' + bar + days + '</div>';
    }
    return html;
  }
  return '<p class="pl-wk-m">' + mlab + '</p><div class="pl-tl"><div class="pl-tl-d"><small>Check-in</small><b>' + ci.getDate() + '</b><span>' + WD[ci.getDay()] + ' · ' + MO[ci.getMonth()] + '</span></div>'
    + '<div class="pl-tl-mid"><i class="pl-tl-ln"></i><em>' + span + ' nights</em></div>'
    + '<div class="pl-tl-d r"><small>Check-out</small><b>' + co.getDate() + '</b><span>' + WD[co.getDay()] + ' · ' + MO[co.getMonth()] + '</span></div></div>';
}
function sV7(){
  var d = stayData(), cx = innerWidth / 2, cy = Math.round(innerHeight * (isMob() ? .3 : .32));
  var chips = (S.chips || []).map(function(c, i){
    var dx = Math.round(cx - (c.x + c.w / 2)), dy = Math.round(cy - (c.y + c.h / 2));
    return '<span class="pl-fly" style="left:' + c.x + 'px;top:' + c.y + 'px;width:' + c.w + 'px;height:' + c.h + 'px;--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + (i * 90) + 'ms">' + esc(c.t) + '</span>';
  }).join('');
  var ci = d.b.cin, co = d.b.cout, span = nights(ci, co), stay = stayView(ci, co, span);
  return '<div class="pl-fx pl-v7" style="--cy:' + cy + 'px" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><i class="pl-v7-bg"></i><img src="' + PHOTO() + '" alt="">' + chips
    + '<span class="pl-v7-ok" style="top:' + cy + 'px">' + CHECK_SVG + '</span><i class="pl-v7-ring" style="top:' + cy + 'px"></i>'
    + '<div class="pl-v7-c" style="padding-top:' + (cy + 52) + 'px"><p class="pl-fx-eye pl-x-eye">It\'s a match</p><h2 id="pl-sh">' + hello(d) + '</h2>'
    + '<div class="pl-wk">' + stay
    + '<p class="pl-wk-f"><span>' + ic('pin', 14) + esc(d.p.name) + '</span><span>' + (stay.indexOf('pl-tl') >= 0 ? '' : span + ' nights · ') + d.b.guests + ' guests</span></p></div>' + openTxt() + '</div>' + goBack() + '</div>';
}
/* contacto del alojamiento en una hoja: tres opciones grandes, sin ocupar sitio en la pantalla */
function sContact(){
  var h = esc(hostName()), row = function(i, t, d){ return '<a class="pl-opt" href="#" data-a="noop"><span class="th" style="background:var(--pl-soft2);color:var(--pl-blue)">' + ic(i, 20) + '</span><span><b>' + t + '</b><span>' + d + '</span></span><span class="ck">' + ic('right', 18) + '</span></a>'; };
  return '<div class="pl-ph"><h3 id="pl-sh">Contact ' + h + '</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<p class="pl-sp" style="text-align:left;margin:0 0 12px">They can find your booking and send you your check-in link.</p><div class="pl-list">' + row('chat', 'WhatsApp', 'Usually the quickest') + row('phone', 'Call', 'Speak to ' + h) + row('mail', 'Email', 'Write to ' + h) + '</div>';
}
function sProp(){
  var q = S.q.trim().toLowerCase(), list = PROPS.filter(function(p){ return !q || (p.name + ' ' + p.city).toLowerCase().indexOf(q) >= 0; });
  return '<div class="pl-ph"><h3 id="pl-sh">Where are you staying?</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<div class="pl-field pl-search">' + ic('search', 18) + '<input id="pl-q" name="q" placeholder="Search by name or city" value="' + esc(S.q) + '" autocomplete="off"></div>'
    + '<div class="pl-list" role="listbox" aria-label="Properties">' + (list.length ? list.map(function(p){ var on = S.f.prop === p.id; return '<button type="button" role="option" aria-selected="' + on + '" class="pl-opt' + (on ? ' on' : '') + '" data-a="pick" data-p="' + p.id + '"><span class="th" style="background:' + p.bg + '">' + p.name.charAt(0) + '</span><span><b>' + esc(p.name) + '</b><span>' + esc(p.city) + '</span></span>' + (on ? '<span class="ck">' + ic('check', 18) + '</span>' : '') + '</button>'; }).join('') : '<p class="pl-empty">No property matches “' + esc(S.q) + '”.</p>') + '</div>';
}
function sCal(){
  var k = S.sheet.split(':')[1], isOut = k === 'cout' || k === 'cCout';
  var start = isOut ? (S.f[k === 'cout' ? 'cin' : 'cCin'] ? parse(S.f[k === 'cout' ? 'cin' : 'cCin']) : null) : null;
  var min = isOut && start ? add(start, 1) : add(TODAY, -1);
  var sel = S.f[k] ? parse(S.f[k]) : null;
  var m = S.cal, y = m.getFullYear(), mo = m.getMonth(), first = new Date(y, mo, 1), off = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  var canPrev = new Date(y, mo, 0) >= new Date(min.getFullYear(), min.getMonth(), 1);
  var g = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function(w){ return '<span class="wd">' + w + '</span>'; }).join('');
  for (var i = 0; i < off; i++) g += '<span></span>';
  for (var d = 1; d <= days; d++) {
    var dt = new Date(y, mo, d), dis = dt < min, cls = [];
    if (same(dt, TODAY)) cls.push('today');
    if (same(dt, sel) || (isOut && same(dt, start))) cls.push('sel');
    else if (isOut && start && sel && dt > start && dt < sel) cls.push('rng');
    g += '<button type="button" data-a="day" data-d="' + key(dt) + '" class="' + cls.join(' ') + '"' + (dis ? ' disabled' : '') + ' aria-label="' + fmt(dt) + '"' + (same(dt, sel) ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
  }
  var t = { cin: 'Arrival date', cout: 'Departure date', cCin: 'Arrival', cCout: 'Departure' }[k];
  var quick = k === 'cin' ? '<div class="pl-quick" style="margin:0 0 4px">' + [[TODAY, 'Today'], [add(TODAY, 1), 'Tomorrow']].map(function(c){ return '<button type="button" class="pl-chip" data-a="day" data-d="' + key(c[0]) + '">' + c[1] + ' · ' + fmt(c[0]) + '</button>'; }).join('') + '</div>' : '';
  return '<div class="pl-ph"><h3 id="pl-sh">' + t + '</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>' + quick
    + '<div class="pl-cal-h"><button type="button" data-a="mprev" aria-label="Previous month"' + (canPrev ? '' : ' disabled') + '>' + ic('left', 18) + '</button><b>' + MOL[mo] + ' ' + y + '</b><button type="button" data-a="mnext" aria-label="Next month">' + ic('right', 18) + '</button></div>'
    + '<div class="pl-grid">' + g + '</div>';
}

/* ---------- pintar ---------- */
/* móvil sin scroll nunca: si el contenido no cabe, se recoge por niveles (de lo menos a lo más visible) hasta que cabe */
var FIT = ['pl-fit1', 'pl-fit2', 'pl-fit3', 'pl-fit4', 'pl-fit5', 'pl-fit6', 'pl-fit7'];
function fit(){
  var m = OC ? root.querySelector('.pl-col>.pl-card') : root.querySelector('.pl-main'); FIT.forEach(function(c){ root.classList.remove(c); });   /* one click: se mide la caja, no la pantalla (la cabecera no se toca) */
  if (OC && !isMob()) { var lg = root.querySelector('.pl-gh-lang'), lr = lg && lg.getBoundingClientRect(); if (lr && lr.height) root.style.setProperty('--pl-lb', Math.max(24, Math.round(innerHeight - lr.bottom)) + 'px'); }   /* escritorio: la caja no baja más que la cajita del idioma («English») */
  ocDFit();
  ocMore();
  if (!m || !isMob()) return;
  for (var i = 0; i < FIT.length && m.scrollHeight - m.clientHeight > 0; i++) root.classList.add(FIT[i]);
}
/* escritorio: la caja del one click nunca hace scroll. Si no cabe: 1 compacta márgenes · 2 quita textos secundarios (notas, consejos, ayudas) · 3 campos en dos columnas y sin ayudas · 4 reduce el tamaño del contenido lo justo (mínimo 70 %) */
var DFIT = ['pl-dfit1', 'pl-dfit2', 'pl-dfit3'];   /* 3: campos en dos columnas y sin ayudas (varios datos pendientes) */
function ocDFit(){
  if (!OC || !root) return; var c = root.querySelector('.pl-col>.pl-card:not(.pl-ghost)'); DFIT.forEach(function(k){ root.classList.remove(k); }); if (!c) return; c.style.removeProperty('--dz');
  if (isMob()) return;
  var over = function(){ return c.scrollHeight - c.clientHeight > 1; };
  for (var i = 0; i < DFIT.length && over(); i++) root.classList.add(DFIT[i]);
  for (var z = 1, n = 0; n < 6 && over() && z > .7; n++) { z = Math.max(.7, z * (c.clientHeight / c.scrollHeight) - .005); c.style.setProperty('--dz', z.toFixed(3)); }
}
/* si la caja tiene más contenido debajo (muchos huéspedes), sombra encima del botón hasta llegar al final */
function ocMore(){ if (!OC || !root) return; var c = root.querySelector('.pl-col>.pl-card:not(.pl-ghost)'), col = c && c.parentNode; if (!col) return; col.classList.toggle('pl-more', c.scrollHeight - c.clientHeight - c.scrollTop > 2); }
document.addEventListener('scroll', function(e){ if (e.target && e.target.classList && e.target.classList.contains('pl-card')) ocMore(); }, true);
window.addEventListener('resize', function(){ if (root) fit(); });
window.matchMedia('(max-width:1023px)').addEventListener('change', function(){ if (root && OC) render(); });   /* W13 cambia de estructura entre móvil y escritorio */
/* ============ ONE CLICK CHECK-IN (screens/one-click.*) — mismas piezas que el property link ============
   IT-3894: el huésped que vuelve (con sesión) elige sus huéspedes guardados y se registran en un toque; si a alguno le falta un dato, solo se pide ese dato.
   Sin sesión: se registra a mano (formulario de la réplica), con la invitación a iniciar sesión para la próxima vez. Sin estado: nada se guarda. */
var OC = S0.id === 'one-click';
/* ajustes de la reserva (como en la Gestap): reparto adultos/menores por número de huéspedes y pagos pendientes */
function ocSplit(){ var a = ({ 2: [2, 0], 4: [3, 1], 6: [4, 2], 9: [6, 3], 14: [10, 4] })[+C.ocg] || [+C.ocg, 0];   /* mismo reparto que la Gestap (GCA) */ return C.bmin === '1' ? [a[0], a[1]] : [a[0] + a[1], 0]; }
var PAYS = { deposit: ['Security deposit', 'Held on your card, released after your stay.'], taxes: ['Tourist tax', 'Per guest and night.'], reservation: ['Reservation payment', 'Pending amount for your booking.'] };
function ocPays(){ return (C.bpay || '').split(',').filter(function(k){ return PAYS[k]; }); }
var SAVED = [
  { id: 'g1', n: 'Maria Lowe', you: true, adult: true, doc: 'Passport ··· 4821', bg: 'linear-gradient(135deg,#385bf8,#7a8cff)' },
  { id: 'g2', n: 'James Lowe', adult: true, doc: 'ID card ··· 1093', bg: 'linear-gradient(135deg,#0f766e,#34d399)' },
  { id: 'g3', n: 'Lucía Lowe', adult: false, age: 8, doc: 'Passport ··· 7740', bg: 'linear-gradient(135deg,#b45309,#fbbf24)' },
  { id: 'g4', n: 'Tom Baker', adult: true, doc: 'Passport ··· 3317', bg: 'linear-gradient(135deg,#7a3cf0,#c86bfa)' }
];
var ocG = function(id){ for (var i = 0; i < SAVED.length; i++) if (SAVED[i].id === id) return SAVED[i]; return null; };
/* qué le falta a cada huésped: «miss» → Lucía 1 dato y Tom 1 dato · «miss5» → Lucía 1 dato y Tom 5 */
var MFD = {
  bd: { l: 'Birth date', l0: 'Date of birth', d: 1, e: 'Enter the date of birth, e.g. 14 / 03 / 2018.' },
  exp: { l: 'Passport expiry date', l0: 'Passport expiry date', d: 1, e: 'Enter the expiry date, e.g. 22 / 08 / 2031.' },
  nat: { l: 'Nationality', l0: 'Nationality', ph: 'e.g. British', e: 'Enter the nationality.' },
  addr: { l: 'Address', l0: 'Home address', ph: 'Street and number', e: 'Enter the address.' },
  city: { l: 'City', l0: 'City', ph: 'e.g. Manchester', e: 'Enter the city.' },
  zip: { l: 'Postal code', l0: 'Postal code', ph: 'e.g. M1 1AE', e: 'Enter the postal code.' }
};
var MFS = { miss: { g3: ['bd'], g4: ['nat', 'exp', 'addr', 'city', 'zip'] } };   /* Lucía: 1 dato · Tom: 5 (antes había un estado aparte «miss5»; se juntan para que siempre salgan los 5) */
function mfOf(id){ var m = MFS[C.ocv]; return (m && m[id]) || []; }
var ocMiss = function(g){ return mfOf(g.id).length > 0; };   /* huéspedes incompletos (Lucía y Tom); con «miss5» a Tom le faltan 5 datos */
var ocFirst = function(n){ return n.split(' ')[0]; };
var ocInit = function(g, s){ s = s || 40; return '<span class="pl-oc-av" style="width:' + s + 'px;height:' + s + 'px;background:' + g.bg + '">' + g.n.charAt(0) + '</span>'; };
function ocLead(){ for (var i = 0; i < S.oc.sel.length; i++) { var g = ocG(S.oc.sel[i]); if (g && g.adult) return g.id; } return ''; }
function ocNames(list){ var n = list.map(function(g){ return '<b>' + esc(ocFirst(g.n)) + '</b>'; }); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }
function ocStay(){ return '<div class="pl-oc-stay"><span>' + ic('cal', 15) + fmt(BOOKING.cin) + ' – ' + fmt(BOOKING.cout) + '</span><span>' + ic('users', 15) + S.oc.count + (S.oc.count === 1 ? ' guest' : ' guests') + '</span></div>'; }
function ocAcc(){ return '<div class="pl-oc-acc">' + ocInit(SAVED[0], 28) + '<span>Signed in as <b>maria.lowe@gmail.com</b></span></div>'; }   /* sin «Not you?» (pedido por Dani) */
var GSVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.9 11.9 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';
var ASVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5a10.6 10.6 0 0 0 1.4-2.9 4.5 4.5 0 0 1-2.6-4.1zM13.9 5.1a4.5 4.5 0 0 0 1-3.3 4.6 4.6 0 0 0-3 1.6 4.3 4.3 0 0 0-1.1 3.1 3.8 3.8 0 0 0 3.1-1.4z"/></svg>';
/* W13 · copy del paso «Online check-in» (el «cercano», elegido por Dani) */
var COPY13 = { t: '0 of {g} checked in', d: 'Do it before you arrive. Tip: sign up with Google or Apple and next time it\'s just one tap.', r: 'Been here before? Sign in to use your saved guests.', s: 'No thanks, continue without an account' };
/* datos de la reserva que sí conocemos en el one click (al contrario que en el property link) */
var BK = { ref: 'HMX4K2P9TR', by: 'Maria Lowe', via: 'Airbnb', tin: '15:00', tout: '11:00', addr: 'Calle Mayor 12, Albacete', city: 'Albacete' };
/* qué hace iniciar sesión y qué no (sin prometer de más) */
var SIGN_YES = [['Saves your guests\' details', 'for your next stays'], ['One tap next time', 'just pick who\'s coming'], ['Edit your guests anytime', 'from your account']];
var SIGN_NO = [['Not needed to check in today', 'you can continue without it'], ['Doesn\'t change your booking', 'dates, price and host stay the same'], ['Never posts anything', 'on your Google or Apple account']];
var SHORT_YES = ['Saves your guests', 'One tap next time', 'Edit them anytime'], SHORT_NO = ['Not needed today', 'Doesn\'t change your booking', 'Never posts for you'];
/* feedback U1–U3: el camino sin cuenta se lee como camino; estado del check-in y qué hará falta, en todas las entradas */
var SKIP = 'Check in without an account';
function ocState(dark){ var g = S.oc.count; return '<div class="pl-oc-state' + (dark ? ' dk' : '') + '"><span class="pl-oc-st miss">Check-in pending</span><b>0 of ' + g + (g === 1 ? ' guest' : ' guests') + '</b><span class="pl-oc-due">Before you arrive</span><p>' + ic('clock', 13) + 'About 2 min per guest · have their ID or passport ready</p></div>'; }
function ocNeed(cls){ return '<p class="pl-oc-need' + (cls ? ' ' + cls : '') + '">' + ic('clock', 14) + '<span>About 2 min per guest · have their ID or passport ready</span></p>'; }
function ocWelcome(){
  var b = BOOKING, nn = nights(b.cin, b.cout), p = prop(b.prop), g = S.oc.count + (S.oc.count === 1 ? ' guest' : ' guests');
  var yes = function(t){ return '<li class="y">' + ic('check', 13) + '<span>' + t + '</span></li>'; }, no = function(t){ return '<li class="n">' + ic('shield', 13) + '<span>' + t + '</span></li>'; }, con = function(t){ return '<li class="c">' + ic('x', 13) + '<span>' + t + '</span></li>'; };
  var full = function(list, cls){ return list.map(function(x){ return '<li class="' + cls + '">' + ic(cls === 'y' ? 'check' : 'shield', 13) + '<span><b>' + x[0] + '</b> <i>' + x[1] + '</i></span></li>'; }).join(''); };
  if (C.ocw === '1') {   /* W1 · billete + dos columnas */
    return '<h2 id="pl-h">Your booking</h2>'
      + '<div class="pl-w1tk"><div class="pl-w1top"><b>' + esc(p.name) + '</b><span>' + ic('pin', 13) + BK.addr + '</span></div>'
      + '<div class="pl-w1d"><div><small>Check-in</small><strong>' + fmt(b.cin) + '</strong><span>from ' + BK.tin + '</span></div><span class="pl-w1n"><i></i>' + nn + (nn === 1 ? ' night' : ' nights') + '<i></i></span><div class="r"><small>Check-out</small><strong>' + fmt(b.cout) + '</strong><span>by ' + BK.tout + '</span></div></div>'
      + '<div class="pl-w1cut"></div><div class="pl-w1f"><div><small>Guests</small><b>' + S.oc.count + '</b></div><div><small>' + BK.via + ' code</small><b>' + BK.ref + '</b></div><div><small>Booked by</small><b>' + BK.by + '</b></div></div></div>'
      + ocState() + '<p class="pl-w1q">Why sign in? <em>It\'s optional</em></p><div class="pl-w1cols"><ul>' + SHORT_YES.map(yes).join('') + '</ul><ul>' + SHORT_NO.map(no).join('') + '</ul></div>';
  }
  if (C.ocw === '2') {   /* W2 · ficha + desplegable */
    var row = function(i, l, v, s2){ return '<div class="pl-w2r"><span class="pl-w2i">' + ic(i, 17) + '</span><span class="pl-w2l">' + l + '</span><span class="pl-w2v">' + v + (s2 ? '<small>' + s2 + '</small>' : '') + '</span></div>'; };
    return '<h2 id="pl-h">Your booking at ' + esc(p.name) + '</h2>'
      + '<div class="pl-w2">' + row('cal', 'Check-in', fmt(b.cin), 'from ' + BK.tin) + row('cal', 'Check-out', fmt(b.cout), 'by ' + BK.tout) + row('users', 'Guests', g, nn + (nn === 1 ? ' night' : ' nights')) + row('hash', 'Booking', BK.ref, 'via ' + BK.via) + row('user', 'Booked by', BK.by) + '</div>' + ocState()
      + '<button type="button" class="pl-w2why' + (S.oc.why ? ' on' : '') + '" data-a="ocwhy" aria-expanded="' + S.oc.why + '"><span class="pl-oc-ben-ic">' + ic('bolt', 18) + '</span><span><b>Why sign in?</b><small>Optional · not needed to check in today</small></span>' + ic('down', 18) + '</button>'
      + (S.oc.why ? '<div class="pl-w2more"><ul>' + full(SIGN_YES, 'y') + full(SIGN_NO, 'n') + '</ul></div>' : '');
  }
  if (C.ocw === '3') {   /* W3 · dos caminos */
    return '<h2 id="pl-h">How do you want to check in?</h2>'
      + '<div class="pl-w3stay"><b>' + esc(p.name) + '</b><span>' + fmt(b.cin) + ' ' + BK.tin + ' → ' + fmt(b.cout) + ' ' + BK.tout + '</span><span>' + nn + (nn === 1 ? ' night' : ' nights') + ' · ' + g + ' · ' + BK.via + ' ' + BK.ref + '</span><span>Booked by ' + BK.by + '</span></div>'
      + '<div class="pl-w3"><div class="pl-w3c on"><em>Faster next time</em><b>With an account</b><ul>' + SHORT_YES.map(yes).join('') + '</ul></div>'
      + '<div class="pl-w3c"><em>Just today</em><b>Without an account</b><ul>' + ['Fill in each guest now', 'Nothing is saved', 'Same check-in for the host'].map(function(t, i){ return i === 2 ? yes(t) : con(t); }).join('') + '</ul></div></div>'
      + '<p class="pl-w3n">' + ic('shield', 14) + 'Signing in never changes your booking or posts on your account.</p>' + ocState();
  }
  /* W4 · la reserva va en la foto; aquí solo iniciar sesión y su para qué */
  return '<h2 id="pl-h">Check in for your stay</h2><p class="pl-lead pl-keep">Booked by ' + BK.by + ' via ' + BK.via + '. Sign in to save your guests for next time, or continue without it.</p>'
    + '<div class="pl-w4l"><p>' + ic('bolt', 15) + 'Signing in</p><ul>' + full(SIGN_YES, 'y') + '</ul><p class="n">' + ic('shield', 15) + 'Good to know</p><ul>' + full(SIGN_NO, 'n') + '</ul></div>' + ocState();
}
/* ---------- W5–W8: entradas libres (fuera de la estructura foto + tarjeta) ---------- */
function ocWx(btn){
  var b = BOOKING, nn = nights(b.cin, b.cout), p = prop(b.prop), g = S.oc.count, gs = g + (g === 1 ? ' guest' : ' guests'), N = nn + (nn === 1 ? ' night' : ' nights');
  var lang = '<button type="button" class="pl-gh-lang pl-wx-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button>';
  var auth = function(light){ return btn('ocgoogle', 'pl-soc g' + (light ? ' lt' : ''), GSVG + 'Continue with Google', 'Signing in…') + btn('ocapple', 'pl-soc a', ASVG + 'Continue with Apple', 'Signing in…'); };
  var skip = function(t){ return '<button type="button" class="pl-btn txt pl-oc-skip" data-a="ocskip">' + (t || SKIP) + ic('arrow', 16) + '</button>'; };
  var why = '<button type="button" class="pl-link pl-wx-why" data-a="ocwhy2">What does signing in do?</button>';
  if (C.ocw === '5') {   /* W5 · tarjeta de embarque sobre fondo azul */
    return '<div class="pl-wx pl-w5"><img class="pl-w5bg" src="' + PHOTO() + '" alt=""><div class="pl-w5in"><div class="pl-w5top"><span class="pl-w5brand">Online check-in</span>' + lang + '</div>'
      + '<div class="pl-w5pass"><div class="pl-w5ph"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b>' + ic('pin', 12) + BK.addr + '</span></div>'
      + '<div class="pl-w5d"><div><small>Check-in</small><strong>' + fmt(b.cin) + '</strong><span>from ' + BK.tin + '</span></div><span class="pl-w5n">' + ic('right', 14) + N + '</span><div class="r"><small>Check-out</small><strong>' + fmt(b.cout) + '</strong><span>by ' + BK.tout + '</span></div></div>'
      + '<div class="pl-w5g"><div><small>Guests</small><b>' + g + '</b></div><div><small>' + BK.via + ' code</small><b>' + BK.ref + '</b></div><div><small>Booked by</small><b>' + BK.by + '</b></div></div>'
      + '<div class="pl-w5cut"></div><div class="pl-w5st"><span class="pl-oc-st miss">Check-in pending</span><span>0 of ' + gs + ' · before you arrive</span></div></div>'
      + '<div class="pl-w5gl"><b>Save your guests for next time?</b><span>Optional. You can check in today without it.</span><div class="pl-oc-auth">' + auth(true) + skip() + '</div>' + ocNeed('lt') + why + '</div></div></div>';
  }
  if (C.ocw === '6') {   /* W6 · conversación con el alojamiento */
    var bub = function(i, html, cls){ return '<div class="pl-w6b' + (cls ? ' ' + cls : '') + '" style="animation-delay:' + (i * 90) + 'ms">' + html + '</div>'; };
    return '<div class="pl-wx pl-w6"><div class="pl-w6top"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b><small>Online check-in · via Chekin</small></span>' + lang + '</div>'
      + '<div class="pl-w6chat">' + bub(0, 'Hello! Your stay at ' + esc(p.name) + ' is confirmed.')
      + bub(1, '<div class="pl-w6card"><div class="pl-w6d"><div><small>Check-in</small><b>' + fmt(b.cin) + '</b><span>from ' + BK.tin + '</span></div><em>' + N + '</em><div class="r"><small>Check-out</small><b>' + fmt(b.cout) + '</b><span>by ' + BK.tout + '</span></div></div><div class="pl-w6f"><span>' + ic('users', 13) + gs + '</span><span>' + ic('hash', 13) + BK.via + ' ' + BK.ref + '</span><span>' + ic('user', 13) + 'Booked by ' + BK.by + '</span></div></div>', 'card')
      + bub(2, ocState() + 'Each guest needs to check in before you arrive. It takes about 2 min each, with their ID or passport.')
      + bub(3, 'Want us to remember them for your next stays? It\'s optional and never changes your booking.') + '</div>'
      + '<div class="pl-w6rep"><div class="pl-oc-auth">' + auth() + skip() + '</div></div></div>';
  }
  if (C.ocw === '7') {   /* W7 · el viaje: la estancia como línea de tiempo */
    var stp = function(cls, icn, t, d, extra){ return '<li class="' + cls + '"><span class="pl-w7dot">' + icn + '</span><div><b>' + t + '</b>' + (d ? '<span>' + d + '</span>' : '') + (extra || '') + '</div></li>'; };
    return '<div class="pl-wx pl-w7"><div class="pl-w7top"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b><small>' + BK.addr + '</small></span>' + lang + '</div>'
      + '<h2 class="pl-w7h">Your stay</h2><ol class="pl-w7tl">'
      + stp('done', ic('check', 13), 'Booked', BK.ref + ' · via ' + BK.via + ' · by ' + BK.by)
      + stp('now', '<i></i>', 'Online check-in', 'You\'re here · 0 of ' + gs + ' checked in', '<div class="pl-w7box"><p><b>Save your guests for next time?</b> Optional: you can check in without it, and it never changes your booking.</p><div class="pl-oc-auth">' + auth() + skip() + '</div>' + ocNeed() + '</div>')
      + stp('next', ic('pin', 13), 'Arrival', fmt(b.cin) + ' · from ' + BK.tin)
      + stp('next', ic('cal', 13), 'Departure', fmt(b.cout) + ' · by ' + BK.tout + ' · ' + N) + '</ol></div>';
  }
  /* W8 · elige y verás: la consecuencia de cada opción, antes de decidir */
  var sv = S.oc.save, tile = function(l, v, s2){ return '<div class="pl-w8t"><small>' + l + '</small><b>' + v + '</b>' + (s2 ? '<span>' + s2 + '</span>' : '') + '</div>'; };
  var yes = function(t){ return '<li class="y">' + ic('check', 13) + '<span>' + t + '</span></li>'; }, no = function(t){ return '<li class="n">' + ic('shield', 13) + '<span>' + t + '</span></li>'; }, con = function(t){ return '<li class="c">' + ic('x', 13) + '<span>' + t + '</span></li>'; };
  return '<div class="pl-wx pl-w8"><div class="pl-w7top"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b><small>' + fmt(b.cin) + ' – ' + fmt(b.cout) + '</small></span>' + lang + '</div>'
    + '<div class="pl-w8grid">' + tile('Check-in', fmt(b.cin), 'from ' + BK.tin) + tile('Check-out', fmt(b.cout), 'by ' + BK.tout) + tile('Nights', nn) + tile('Guests', g) + tile(BK.via + ' code', BK.ref) + tile('Booked by', BK.by) + '</div>' + '<div class="pl-w8st">' + ocState() + '</div>'
    + '<h2 class="pl-w8h">Save your guests for next time?</h2><div class="pl-w8seg" role="radiogroup">'
    + '<button type="button" role="radio" aria-checked="' + (sv === true) + '" class="' + (sv === true ? 'on' : '') + '" data-a="ocsave1">' + ic('bolt', 18) + '<b>Yes, save them</b><span>Sign in</span></button>'
    + '<button type="button" role="radio" aria-checked="' + (sv === false) + '" class="' + (sv === false ? 'on' : '') + '" data-a="ocsave0">' + ic('user', 18) + '<b>Just this time</b><span>No account</span></button></div>'
    + (sv === null ? '<p class="pl-w8hint">' + ic('shield', 14) + 'Both options check you in today. Pick one to see what changes.</p>'
      : '<div class="pl-w8ex pl-ocw" key="' + sv + '"><ul>' + (sv ? yes('Next time, check in with one tap') + yes('Edit your guests anytime') + no('Never changes your booking or posts for you') : con('Fill in each guest now') + con('Nothing is saved for next time') + yes('Your check-in is just as complete')) + '</ul></div>')
    + '<div class="pl-w8cta">' + (sv === null ? '<p class="pl-w8wait">' + ic('right', 15) + 'Choose an option to continue</p>' : sv ? '<div class="pl-oc-auth">' + auth() + '</div>' : '<button type="button" class="pl-btn pri" data-a="ocskip">Check in without an account' + ic('arrow', 18) + '</button>') + '</div></div>';
}
/* ---------- W9–W12: el check-in manda; guardar huéspedes es un detalle ---------- */
function ocWy(btn){
  var b = BOOKING, nn = nights(b.cin, b.cout), p = prop(b.prop), g = S.oc.count, gs = g + (g === 1 ? ' guest' : ' guests'), N = nn + (nn === 1 ? ' night' : ' nights');
  var lang = '<button type="button" class="pl-gh-lang pl-wx-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button>';
  var go = function(t, cls){ return '<button type="button" class="pl-btn pri pl-wy-go' + (cls ? ' ' + cls : '') + '" data-a="ocskip">' + (t || 'Start check-in') + ic('arrow', 18) + '</button>'; };
  var mini = '<span class="pl-wy-mini">' + btn('ocgoogle', 'pl-wy-ic g', GSVG, '…').replace('class="pl-btn ', 'aria-label="Sign in with Google" class="pl-btn ') + btn('ocapple', 'pl-wy-ic a', ASVG, '…').replace('class="pl-btn ', 'aria-label="Sign in with Apple" class="pl-btn ') + '</span>';
  var d0 = new Date(); d0.setHours(0, 0, 0, 0); var left = Math.max(0, Math.round((b.cin - d0) / 864e5));
  var dd = function(d){ return d.getDate(); }, mo = function(d){ return d.toLocaleDateString('en-GB', { month: 'short' }); }, wd = function(d){ return d.toLocaleDateString('en-GB', { weekday: 'short' }); };
  var big = '<div class="pl-wy-big"><div><small>' + wd(b.cin) + ' · from ' + BK.tin + '</small><strong>' + dd(b.cin) + ' ' + mo(b.cin) + '</strong></div><span>' + ic('arrow', 18) + '</span><div class="r"><small>' + wd(b.cout) + ' · by ' + BK.tout + '</small><strong>' + dd(b.cout) + ' ' + mo(b.cout) + '</strong></div></div>';
  var facts = '<div class="pl-wy-facts"><span>' + ic('cal', 14) + N + '</span><span>' + ic('users', 14) + gs + '</span><span>' + ic('hash', 14) + BK.via + ' ' + BK.ref + '</span><span>' + ic('user', 14) + 'Booked by ' + BK.by + '</span></div>';
  if (C.ocw === '9') {   /* W9 · un botón: la foto, las fechas y empezar; guardar huéspedes, en pequeño */
    return '<div class="pl-wx pl-wy pl-w9"><div class="pl-w9ph"><img src="' + PHOTO() + '" alt=""><div class="pl-w9top">' + lang + '</div><div class="pl-w9t"><small>Online check-in</small><b>' + esc(p.name) + '</b><span>' + ic('pin', 13) + BK.addr + '</span></div></div>'
      + '<div class="pl-w9in">' + big + facts
      + '<div class="pl-w9cta">' + go() + '<p class="pl-wy-sub">About 2 min per guest · have their ID or passport ready</p>'
      + '<div class="pl-w9saved"><span><b>Stayed with us before?</b>Use your saved guests</span>' + mini + '</div></div></div></div>';
  }
  if (C.ocw === '10') {   /* W10 · los huéspedes: la tarea se ve (3 huecos que llenar) */
    var slot = function(i){ var lead = i === 0; return '<button type="button" class="pl-w10s' + (lead ? ' lead' : '') + '" data-a="ocskip"><span class="pl-w10av">' + (lead ? esc(BK.by.charAt(0)) : ic('plus', 16)) + '</span><span class="pl-w10t"><b>' + (lead ? esc(BK.by) : 'Guest ' + (i + 1)) + '</b><small>' + (lead ? 'Lead guest · booked it' : (i === 2 ? 'Children included' : 'Name and ID')) + '</small></span><em>' + (lead ? 'Start' : 'Add') + '</em></button>'; };
    var slots = ''; for (var i = 0; i < Math.min(g, 4); i++) slots += slot(i);
    return '<div class="pl-wx pl-wy pl-w10"><div class="pl-w7top"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b><small>' + BK.addr + '</small></span>' + lang + '</div>'
      + '<div class="pl-w10bk"><img class="pl-w10img" src="' + PHOTO() + '" alt=""><div>' + big + facts + '</div></div>'
      + '<div class="pl-w10h"><h2>' + g + ' guests to check in</h2><span class="pl-oc-st miss">0 of ' + g + '</span></div><p class="pl-wy-sub l">Before you arrive · about 2 min each, with their ID or passport</p>'
      + '<div class="pl-w10l">' + slots + (g > 4 ? '<p class="pl-wy-sub l">+ ' + (g - 4) + ' more</p>' : '') + '</div>'
      + '<div class="pl-w10saved"><span>' + ic('bolt', 16) + '<span><b>Fill them in one tap</b>Sign in to use guests you saved before</span></span>' + mini + '</div></div>';
  }
  if (C.ocw === '13') {   /* W13 · foto azul en bucle; «Your stay at» a la izquierda (como W1) y, en lugar del botón, la línea de tiempo de la W7 */
    var auth = btn('ocgoogle', 'pl-soc g', GSVG + 'Continue with Google', 'Signing in…') + btn('ocapple', 'pl-soc a', ASVG + 'Continue with Apple', 'Signing in…');
    var stp = function(cls, icn, t, d, extra){ return '<li class="' + cls + '"><span class="pl-w7dot">' + icn + '</span><div><b>' + t + '</b>' + (d ? '<span>' + d + '</span>' : '') + (extra || '') + '</div></li>'; };
    /* copy del paso «Online check-in» (mismo cuadro, 4 textos): qué hay que hacer (antes de llegar), por qué conviene la cuenta, qué pasa si ya la tienes y que se puede seguir sin ella */
    var cp = COPY13;
    var nowBox = '<div class="pl-w7box pl-c13"><p><b>' + cp.t.replace('{g}', gs) + '</b>' + cp.d.replace(/ (Tip:.*)$/, ' <span class="pl-c13tip">$1</span>') + '</p>'
      + '<div class="pl-oc-auth">' + auth + '</div><p class="pl-c13ret">' + cp.r + '</p>'
      + '<button type="button" class="pl-btn txt pl-oc-skip" data-a="ocskip">' + cp.s + ic('arrow', 16) + '</button></div>';
    var stay = '<h2 class="pl-w7h" id="pl-w13t">Your stay</h2><ol class="pl-w7tl">'
      + stp('done', ic('check', 13), 'Booked', BK.ref + ' · via ' + BK.via + ' · by ' + BK.by)
      + stp('now', '<i></i>' + ic('users', 14), 'Online check-in', 'Required before arrival', nowBox)
      + stp('next', ic('pin', 13), 'Arrival', fmt(b.cin) + ' · from ' + BK.tin)
      + stp('next', ic('cal', 13), 'Departure', fmt(b.cout) + ' · by ' + BK.tout + ' · ' + N) + '</ol>';
    /* móvil: como la W1 (foto con «Welcome to» arriba) y la caja blanca es «Your stay» entera */
    return hero() + '<div class="pl-col"><section class="pl-card pl-main-card pl-w13m pl-tl2" aria-labelledby="pl-w13t">' + dwel() + stay + '</section></div>';   /* misma cabecera y misma caja que el property link, en móvil y en escritorio */
    return '<div class="pl-wx pl-wy pl-w11 pl-w13"><img class="pl-w11bg" src="' + PHOTO() + '" alt=""><div class="pl-w11in"><div class="pl-w11top"><span>Online check-in</span>' + lang + '</div>'
      + '<div class="pl-w11b pl-w13l"><p class="pl-w11eye">Welcome to</p><h2>' + esc(p.name) + '</h2><p class="pl-w11addr">' + ic('pin', 13) + BK.addr + '<span class="pl-w13lang">' + lang + '</span></p>' + big + facts
      + '<button type="button" class="pl-btn pl-w11go" data-a="ochow">Check in now' + ic('arrow', 18) + '</button><p class="pl-wy-sub lt">' + gs + ' · about 2 min each</p></div>'   /* móvil: igual que la W11.1; en escritorio el botón cede el sitio a la tarjeta «Your stay» */
      + '<div class="pl-w13w"><p class="pl-wel">Welcome to</p><p class="pl-gh-name">' + esc(HOST().name) + '</p><div class="pl-gh-row"><p class="pl-loc">' + ic('pin', 15) + (isUser() ? '6 homes in Spain' : 'Albacete, Spain') + '</p><button type="button" class="pl-gh-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button></div></div>'   /* escritorio: la bienvenida de la W1, idéntica */
      + '<section class="pl-w13card pl-tl2" aria-labelledby="pl-w13t">' + stay + '</section></div></div>';
  }
  if (C.ocw === '11') {   /* W11 · decidir después: foto a sangre, un solo botón; el «cómo» llega al pulsar */
    return '<div class="pl-wx pl-wy pl-w11"><img class="pl-w11bg" src="' + PHOTO() + '" alt=""><div class="pl-w11in"><div class="pl-w11top"><span>Online check-in</span>' + lang + '</div>'
      + '<div class="pl-w11b"><p class="pl-w11eye">Your stay at</p><h2>' + esc(p.name) + '</h2><p class="pl-w11addr">' + ic('pin', 13) + BK.addr + '</p>' + big + facts
      + '<button type="button" class="pl-btn pl-w11go" data-a="ochow">Check in now' + ic('arrow', 18) + '</button><p class="pl-wy-sub lt">' + gs + ' · about 2 min each</p></div></div></div>';
  }
  /* W12 · interruptor: guardar huéspedes es un ajuste (apagado), no una pregunta */
  var on = !!S.oc.rem;
  return '<div class="pl-wx pl-wy pl-w12"><div class="pl-w7top"><img src="' + PHOTO() + '" alt=""><span><b>' + esc(p.name) + '</b><small>' + BK.addr + '</small></span>' + lang + '</div>'
    + '<div class="pl-w12hero"><img src="' + PHOTO() + '" alt=""><small>Your stay starts in</small><strong>' + left + (left === 1 ? ' day' : ' days') + '</strong>' + big + '</div>'
    + '<dl class="pl-w12dl"><div><dt>Guests</dt><dd>' + gs + '</dd></div><div><dt>Nights</dt><dd>' + nn + '</dd></div><div><dt>' + BK.via + ' code</dt><dd>' + BK.ref + '</dd></div><div><dt>Booked by</dt><dd>' + BK.by + '</dd></div></dl>'
    + '<div class="pl-w12todo"><span class="pl-oc-st miss">To do</span><b>Check in ' + gs + ' before you arrive</b></div>'
    + '<div class="pl-w12cta"><button type="button" class="pl-w12sw" role="switch" aria-checked="' + on + '" data-a="ocrem"><span><b>Remember my guests</b><small>' + (on ? 'Sign in below · next time is one tap' : 'Optional · for your next stays') + '</small></span><i></i></button>'
    + (on ? '<div class="pl-oc-auth pl-w12auth">' + btn('ocgoogle', 'pl-soc g', GSVG + 'Continue with Google', 'Signing in…') + btn('ocapple', 'pl-soc a', ASVG + 'Continue with Apple', 'Signing in…') + '</div>' : go()) + '</div></div>';
}
function sOcHow(){
  return '<div class="pl-ph"><h3 id="pl-sh">How do you want to check in?</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<p class="pl-sp" style="text-align:left;margin:0 0 14px">Both check you in today. Your booking stays the same.</p>'
    + '<button type="button" class="pl-w11o" data-a="ocskip"><span class="pl-oc-ben-ic">' + ic('user', 20) + '</span><span><b>Fill in each guest now</b><small>No account · about 2 min per guest</small></span>' + ic('right', 18) + '</button>'
    + '<div class="pl-w11o s"><span class="pl-oc-ben-ic">' + ic('bolt', 20) + '</span><span><b>Use saved guests</b><small>Sign in · next time it\'s one tap</small></span></div>'
    + '<div class="pl-oc-auth" style="margin-top:8px"><button type="button" class="pl-btn pl-soc g" data-a="ocgoogle">' + GSVG + 'Continue with Google</button><button type="button" class="pl-btn pl-soc a" data-a="ocapple">' + ASVG + 'Continue with Apple</button></div>';
}
function vOc(){
  var st = S.oc.step, card = '', dock = '', busy = S.oc.busy;
  var btn = function(a, cls, label, b){ return '<button type="button" class="pl-btn ' + cls + (busy === a ? ' pl-looking' : '') + '" data-a="' + a + '"' + (busy === a ? ' aria-busy="true"' : '') + '>' + (busy === a ? '<span>' + b + '</span>' : label) + '</button>'; };
  if (st === 'welcome' && +C.ocw >= 9) return ocWy(btn);   /* W9–W12 */
  if (st === 'welcome' && +C.ocw >= 5) return ocWx(btn);   /* W5–W8: maquetaciones libres */
  if (st === 'welcome') {
    card = '<section class="pl-card pl-main-card pl-ocw pl-ocw' + C.ocw + '" aria-labelledby="pl-h">' + dwel() + ocWelcome() + '</section>';
    dock = '<div class="pl-dock"><div class="pl-oc-auth">' + btn('ocgoogle', 'pl-soc g', GSVG + 'Continue with Google', 'Signing in…') + btn('ocapple', 'pl-soc a', ASVG + 'Continue with Apple', 'Signing in…')
      + '<button type="button" class="pl-btn txt pl-oc-skip" data-a="ocskip">' + SKIP + ic('arrow', 16) + '</button></div></div>';
  } else if (st === 'count') {   /* paso 2: cuántos sois (el contenido del modal de la Gestap, dentro de la caja) */
    var oc2 = S.oc, ages = C.gcm !== 'total', tot = ages ? oc2.ad + oc2.mi : oc2.count;
    var stepper = function(k, label, sub, v, min){ return '<div class="pl-gcr"><span class="pl-gcr-ic' + (k === 'mi' ? ' mi' : '') + '">' + ic('user', 18) + '</span><span class="pl-gcr-tx"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>'
      + '<span class="pl-gcr-ctl"><button type="button" class="pl-gcb" data-a="ocgc" data-k="' + k + '" data-d="-1" aria-label="One ' + label.toLowerCase() + ' less"' + (v <= min ? ' disabled' : '') + '>−</button><output aria-live="polite">' + v + '</output><button type="button" class="pl-gcb add" data-a="ocgc" data-k="' + k + '" data-d="1" aria-label="One ' + label.toLowerCase() + ' more"' + (tot >= 20 ? ' disabled' : '') + '>+</button></span></div>'; };
    var pays = ocPays(), tail = ' before you arrive.';   /* sin «to unlock your keys» (sobraba) */
    var reqs = '<li><span>1</span><div><b>Register all ' + tot + (tot === 1 ? ' guest' : ' guests') + '</b><small>Required for everyone staying.</small></div></li>' + pays.map(function(k, i){ return '<li><span>' + (i + 2) + '</span><div><b>' + PAYS[k][0] + '</b><small>' + (k === 'deposit' && C.bdep === 'token' ? 'Save your card for your stay.' : PAYS[k][1]) + '</small></div></li>'; }).join('');
    card = '<section class="pl-card pl-main-card pl-gc" aria-labelledby="pl-h">' + dwel() + ocAcc() + '<h2 id="pl-h">Confirm who\'s coming</h2><p class="pl-lead pl-keep">' + (pays.length ? 'Then finish these steps' : 'Then register all the guests') + tail + '</p>'
      + (pays.length ? '<ol class="pl-gcsteps">' + reqs + '</ol>' : '')
      + (ages ? stepper('ad', 'Adults', '18 or older on arrival day', oc2.ad, 1) + (C.bmin === '1' ? stepper('mi', 'Minors', 'Under 18 on arrival day', oc2.mi, 0) : '') : stepper('n', 'Guests', 'Everyone staying, children included', oc2.count, 1))
      + '<p class="pl-gcnote">' + ic('info', 14) + '<span>Pre-filled from your booking. Change it if your group is different, but it must match your arrival and the reservation you booked.</span></p></section>';
    dock = '<div class="pl-dock"><div>' + btn('ocgcok', 'pri', 'Confirm ' + tot + (tot === 1 ? ' guest' : ' guests'), 'Confirming…') + '</div></div>';
  } else if (st === 'new') {
    card = '<section class="pl-card pl-main-card" aria-labelledby="pl-h">' + dwel() + ocAcc() + '<h2 id="pl-h">You\'re signed in</h2><p class="pl-lead pl-keep">It\'s your first check-in with us. Add each guest once and next time it\'s one tap.</p>' + ocStay()
      + '<div class="pl-oc-ben"><span class="pl-oc-ben-ic">' + ic('check', 20) + '</span><div><b>We\'ll save them for you</b><span>Every guest you add today will be ready for your next stays.</span></div></div></section>';
    dock = '<div class="pl-dock"><div><button type="button" class="pl-btn pri" data-a="ocform">' + ic('plus', 18) + 'Add your first guest</button></div></div>';
  } else if (st === 'pick') {
    var n = S.oc.sel.length, full = n >= S.oc.count, lead = ocLead();
    var rows = SAVED.map(function(g){
      var on = S.oc.sel.indexOf(g.id) >= 0, dis = !on && full, miss = ocMiss(g);
      var sub = (g.you ? 'You · ' : '') + (g.adult ? '' : 'Child, ' + g.age + ' · ') + g.doc;
      var isLead = on && g.id === lead;   /* definitiva (V1.2): sin «Ready»; «Lead guest» con corona en su sitio; iniciales en cuadrado azul (sin elegir) o verde (elegido), con delineado fino */
      var av = '<span class="pl-g11av ol' + (on ? ' on' : '') + '">' + g.n.split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2) + '</span>';
      var right = isLead ? '<i class="pl-g11lead">' + ic('crown', 12) + 'Lead guest</i>' : '';   /* sin «1 detail missing»: lo que falte se pide después del registro */
      return '<button type="button" class="pl-oc-g' + (on ? ' on' : '') + (dis ? ' dis' : '') + '" data-a="ocsel" data-g="' + g.id + '" role="checkbox" aria-checked="' + on + '"' + (dis ? ' aria-disabled="true"' : '') + '><span class="pl-oc-ck">' + ic('check', 14) + '</span>' + av
        + '<span class="pl-oc-gt"><b>' + esc(g.n) + '</b><span>' + sub + '</span></span>'
        + right + '</button>';
    }).join('');
    var err = S.oc.err ? '<p class="pl-errt" role="alert">' + S.oc.err + '</p>' : '';
    card = '<section class="pl-card pl-main-card" aria-labelledby="pl-h">' + dwel() + ocAcc() + '<h2 id="pl-h">Who\'s coming?</h2>'
      + '<p class="pl-oc-cnt">You\'ve checked in with these guests before. Select who\'s coming on this stay.</p>'   /* antes: «This booking is for 3 guests · Change» */
      + ('<div class="pl-oc-list" role="group" aria-label="Your saved guests">' + rows + '<button type="button" class="pl-oc-g pl-oc-add" data-a="ocform"><span class="pl-oc-addic">' + ic('plus', 18) + '</span><span class="pl-oc-gt"><b>Add someone new</b><span>Not in your list yet</span></span></button></div>') + err + '</section>';
    var left = S.oc.count - n;
    dock = '<div class="pl-dock"><div>' + (!n ? '<p class="pl-oc-cap"><button type="button" class="pl-link" data-a="oclaterall">You can add guests later</button></p>'   /* sin nadie elegido: se puede seguir y añadirlos después (pulsable) */
      : '<p class="pl-oc-cap"' + (left > 0 ? '>' : ' style="visibility:hidden" aria-hidden="true">') + 'You can add the other ' + (left === 1 ? 'guest' : (left || 2) + ' guests') + ' later.</p>')   /* todos elegidos: el texto no se ve, pero conserva su hueco (la caja no se encoge) */   /* con alguien elegido: solo informa, ya no se pulsa */
      + btn('ocgo', 'pri' + (n ? '' : ' pl-oc-off'), n ? 'Check in ' + n + (n === 1 ? ' guest' : ' guests') : 'Choose who\'s coming', 'Checking in your guests…') + '</div></div>';
  } else if (st === 'reg') {   /* registrando: la animación de la Gestap (anillo, «Registering…» y los tres hitos) dentro de la caja */
    var rn = S.oc.sel.length, rw = rn === 1 ? esc(ocFirst(ocG(S.oc.sel[0]).n)) : rn + ' guests';
    card = '<section class="pl-card pl-main-card pl-reg" aria-labelledby="pl-h">' + dwel() + '<div class="pl-reg-ring" data-st="run"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="trk" cx="70" cy="70" r="60"/><circle class="arc" cx="70" cy="70" r="60"/></svg><span class="pl-reg-i u">' + ic('users', 38) + '</span><span class="pl-reg-i k">' + ic('check', 48) + '</span></div>'
      + '<h2 id="pl-h" role="status" aria-live="polite">Registering ' + rw + '…</h2><p class="pl-lead pl-keep">Just a moment, this only takes a few seconds.</p>'
      + '<ol class="pl-reg-steps">' + ['Details sent', 'Registering', 'Confirmed'].map(function(t){ return '<li><span class="pl-reg-sd"><i></i>' + ic('check', 14) + '</span><span class="pl-reg-sl">' + t + '</span></li>'; }).join('') + '</ol>'
      + '<p class="pl-reg-note">' + ic('shield', 16) + '<span>Your details are saved on this device until we confirm</span></p></section>';
  } else if (st === 'almost') {   /* quedan huéspedes o datos: en la caja, no en un modal. Texto genérico: no se nombra qué dato falta (pueden ser varios) */
    var asel = S.oc.sel.map(ocG).sort(function(x, y){ return SAVED.indexOf(x) - SAVED.indexOf(y); }), adone = asel.filter(function(g){ return !ocMiss(g); }), amiss = asel.filter(ocMiss), aleft = S.oc.count - asel.length, atot = S.oc.count, nd = adone.length;
    var av = function(g, on){ return '<span class="pl-g11av ol' + (on ? ' on' : '') + '">' + g.n.split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2) + '</span>'; };
    var gl = function(n){ return n === 1 ? '1 more guest' : n + ' more guests'; };
    if (C.oca === 'b') {   /* B · anillo: el progreso manda; lo pendiente, resumido debajo */
      var R = 52, CC = 2 * Math.PI * R, off = CC * (1 - nd / atot);
      card = '<section class="pl-card pl-main-card pl-alm pl-almb" aria-labelledby="pl-h">' + dwel()
        + '<div class="pl-almb-ring" role="img" aria-label="' + nd + ' of ' + atot + ' guests checked in"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#e5e6ee" stroke-width="9"/><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#37e08f" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + CC.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg><b>' + nd + '/' + atot + '</b></div>'
        + '<h2 id="pl-h">' + nd + ' of ' + atot + ' checked in</h2><p class="pl-lead pl-keep">A few things are left before you arrive.</p>'
        + '<div class="pl-almb-left">' + (amiss.length ? '<div><span class="pl-almb-ic">' + ic('user', 16) + '</span><span><b>' + amiss.map(function(g){ return esc(ocFirst(g.n)); }).join(', ') + '</b><small>Some details are missing</small></span></div>' : '')
        + (aleft > 0 ? '<div><span class="pl-almb-ic">' + ic('plus', 16) + '</span><span><b>' + gl(aleft) + '</b><small>Not added yet</small></span></div>' : '') + '</div></section>';
    } else if (C.oca === 'c') {   /* C · lo que falta: lo hecho en una línea verde y, debajo, las tareas pendientes */
      card = '<section class="pl-card pl-main-card pl-alm pl-almc" aria-labelledby="pl-h">' + dwel()
        + (nd ? '<div class="pl-almc-ok"><span class="pl-almc-avs">' + adone.slice(0, 3).map(function(g){ return av(g, true); }).join('') + '</span><span>' + ocNames(adone) + (nd === 1 ? ' is' : ' are') + ' checked in</span>' + ic('check', 16) + '</div>' : '')
        + '<h2 id="pl-h">What\'s left</h2><p class="pl-lead pl-keep">Finish these before you arrive.</p><div class="pl-gs pl-gs' + C.ocl + ' pl-gsc-' + C.ocwc + '">'
        + amiss.map(ocPend).join('')
        + '</div></section>';
    } else {   /* A · lista: los huéspedes de la reserva como en la Gestap, cada uno con su estado */
      var rowsA = adone.map(function(g){ return '<div class="pl-alma-r">' + av(g, true) + '<span class="pl-oc-gt"><b>' + esc(g.n) + '</b><em class="pl-achip ok">' + ic('check', 10) + 'Checked in</em></span></div>'; }).join('')
        + amiss.map(function(g){ return '<div class="pl-alma-r">' + av(g) + '<span class="pl-oc-gt"><b>' + esc(g.n) + '</b><em class="pl-achip">Details pending</em></span><button type="button" class="pl-alma-b" data-a="ocfix">Complete</button></div>'; }).join('')
        + Array.apply(null, Array(Math.max(0, aleft))).map(function(_, k){ return '<div class="pl-alma-r"><span class="pl-g11av pl-alma-e">' + ic('user', 18) + '</span><span class="pl-oc-gt"><b>Guest ' + (asel.length + k + 1) + '</b><em class="pl-achip na">Not added yet</em></span><button type="button" class="pl-alma-b" data-a="ocform">Add</button></div>'; }).join('');
      card = '<section class="pl-card pl-main-card pl-alm pl-alma" aria-labelledby="pl-h">' + dwel()
        + '<h2 id="pl-h">Almost done</h2><p class="pl-lead pl-keep">' + nd + ' of ' + atot + ' guests checked in. Finish the rest before you arrive.</p>'
        + '<div class="pl-alma-bar" aria-hidden="true">' + Array.apply(null, Array(atot)).map(function(_, k){ return '<i' + (k < nd ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'
        + '<div class="pl-alma-list">' + rowsA + '</div></section>';
    }
    dock = '<div class="pl-dock"><div>' + (C.oca === 'c' ? (amiss.length ? '<button type="button" class="pl-btn pri" data-a="ocfix">Complete details</button>' : '') : '<button type="button" class="pl-btn pri" data-a="' + (amiss.length ? 'ocfix' : 'ocform') + '">' + (C.oca === 'b' ? 'Finish check-in' : 'Continue check-in') + '</button>')   /* C (definitiva): sin CTA principal, la acción está en la fila */
      + '<button type="button" class="pl-btn txt" data-a="oclater">I\'ll do it later</button></div></div>';
  } else if (st === 'fix') {   /* completar datos: piezas del formulario de huésped de la Gestap (g2-form-empty): título con la palabra en azul, tarjeta de sección, campo con etiqueta flotante y chips */
    var miss2 = S.oc.sel.map(ocG).filter(ocMiss), fq = S.oc.fq.length ? S.oc.fq : miss2.map(function(g){ return g.id; }), fi = Math.min(S.oc.fi, fq.length - 1), g1 = ocG(fq[fi]), fl = mfOf(g1.id), who = esc(ocFirst(g1.n)) + '\'s', fn = esc(ocFirst(g1.n));
    var h1 = '<h1 id="pl-h" class="pl-ffh m-0 min-w-0 font-semibold text-[var(--chekin-color-brand-navy)] text-[23px] leading-[28px] tracking-[-0.015em]">Complete ' + who + ' <span class="text-[var(--chekin-color-brand-blue)]">details</span></h1><p class="pl-ffs">We only ask for what\'s missing. Everything else is saved.</p>';
    var one = function(k){ var f = MFD[k]; return '<div data-field="' + k + '" class="relative min-w-0">' + ocFF(k, f.l, S.f[k], false, C.ocx === '4' ? '<em class="pl-ffchip miss">Missing</em>' : '', f.d) + (S.err[k] ? '<p class="pl-fferr" role="alert">' + S.err[k] + '</p>' : f.d ? '<p class="pl-ffhint">DD / MM / YYYY, as on ' + fn + '\'s passport</p>' : '') + '</div>'; };
    var bd = fl.map(function(k){ return k === 'city' && fl.indexOf('zip') >= 0 ? '<div class="pl-ffgrid">' + one('city') + one('zip') + '</div>' : k === 'zip' && fl.indexOf('city') >= 0 ? '' : one(k); }).join('');   /* ciudad y código postal, en la misma fila */
    var oldF = '<div class="pl-oc-fix">' + (C.ocx === '5' ? '' : '<div class="pl-oc-fixh">' + ocInit(g1, 32) + '<b>' + esc(g1.n) + '</b><i class="pl-oc-st miss">' + (fl.length === 1 ? MFD[fl[0]].l0 : fl.length + ' details') + '</i></div>')   /* V5: sin la cabecera del huésped, ya lo dice la tarjeta oscura */
      + fl.map(function(k){ var f = MFD[k]; return textField(k, f.l0, f.d ? 'DD / MM / YYYY' : f.ph, f.d ? 'As it appears on ' + fn + '\'s passport.' : '', f.d ? 'inputmode="numeric"' : ''); }).join('') + '</div>';   /* el campo de antes (OC-26): caja suave con sus campos */
    var stepT = fq.length > 1 ? '<p class="pl-ffstep"><span>Guest ' + (fi + 1) + ' of ' + fq.length + '</span>' + fq.map(function(id, k){ return '<i' + (k < fi ? ' class="ok"' : k === fi ? ' class="on"' : '') + '></i>'; }).join('') + (fi > 0 ? '<button type="button" class="pl-ffback" data-a="ocfixback">' + ic('left', 14) + 'Back to ' + esc(ocFirst(ocG(fq[fi - 1]).n)) + '</button>' : '') + '</p>' : '';   /* volver al anterior: enlace pequeño junto al indicador */   /* varios huéspedes incompletos: en cuál vas */
    var dark = '<div class="pl-as1"><div class="pl-as-t"><b>' + esc(ocFirst(g1.n)) + '\'s details are almost complete</b><span><i class="pl-as-l">We kept everything from the last check-in. </i>Only what\'s missing is asked here.</span></div></div>';
    var body;
    if (C.ocx === '0') body = '<div class="pl-mbar"><span class="pl-mo-ic sm">' + ic('users', 18) + '</span><span class="pl-mbar-tx"><small>Your check-in</small><b>' + (S.oc.sel.length - miss2.filter(function(g){ return !S.oc.fixd[g.id]; }).length) + ' of ' + S.oc.sel.length + ' guests checked in</b></span></div>'
      + '<h2 id="pl-h">Complete the missing details</h2><p class="pl-lead pl-keep">We only ask for what\'s missing. Everything else is saved.</p>' + oldF;   /* V0 · la versión anterior, tal cual */
    else if (C.ocx === '5') body = dark + '<div class="pl-ffdiv"><span>Missing details</span></div>' + oldF;   /* V5 · la tarjeta oscura (V3) con el campo de antes */
    else if (C.ocx === '2') body = h1 + '<div class="pl-gs"><div class="pl-gs-row pl-ffrow">' + '<span class="pl-gs-av">' + g1.n.split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2) + '</span><span class="pl-gs-tx"><b>' + esc(g1.n) + '</b><em class="pl-gs-chip">Details pending</em></span></div></div>' + ocSec('Personal information', bd);   /* V2 · la fila del huésped (Guest summary) y debajo la sección */
    else if (C.ocx === '3') body = dark + '<div class="pl-ffdiv"><span>Missing details</span></div>' + ocSec('Personal information', bd);   /* V3 · la tarjeta oscura del formulario («Verify your identity…») y el separador «OR FILL MANUALLY» */
    else if (C.ocx === '4') body = h1 + ocSec('Personal information', '<div class="pl-ffgrid">' + ocFF('n1', 'Name', ocFirst(g1.n), true, '<em class="pl-ffchip ok">Saved</em>') + ocFF('n2', 'Surname', g1.n.split(' ').slice(1).join(' '), true, '<em class="pl-ffchip ok">Saved</em>') + '</div>' + ocFF('doc', 'Identity document', g1.doc, true, '<em class="pl-ffchip ok">Saved</em>') + bd);   /* V4 · la sección con lo guardado (relleno, chip SAVED) y el dato que falta (chip MISSING) */
    else body = h1 + ocSec('Personal information', bd);   /* V1 · título y la sección con el campo */
    card = '<section class="pl-card pl-main-card pl-ffx pl-ffx' + C.ocx + '" aria-labelledby="pl-h">' + dwel() + stepT + body + '</section>';
    dock = '<div class="pl-dock"><div>' + btn('ocsave', 'pri', fi < fq.length - 1 ? 'Save and continue' : 'Save and finish', 'Saving…') + '<button type="button" class="pl-btn txt" data-a="oclater">I\'ll do it later</button></div></div>';
  }
  var ent = S.oc.enter ? ' pl-in-' + S.oc.enter : '';   /* la caja nueva entra con la transición elegida */
  return hero() + '<div class="pl-col' + ent + '">' + card + dock + '</div>';
}
function sOcWhy(){
  var full = function(list, cls){ return list.map(function(x){ return '<li class="' + cls + '">' + ic(cls === 'y' ? 'check' : 'shield', 13) + '<span><b>' + x[0] + '</b> <i>' + x[1] + '</i></span></li>'; }).join(''); };
  return '<div class="pl-ph"><h3 id="pl-sh">Why sign in?</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<div class="pl-ocw pl-whys"><p>' + ic('bolt', 15) + 'Signing in</p><ul>' + full(SIGN_YES, 'y') + '</ul><p class="n">' + ic('shield', 15) + 'Good to know</p><ul>' + full(SIGN_NO, 'n') + '</ul></div>'
    + '<button type="button" class="pl-btn pri" data-a="close">Got it</button>';
}
function sOcMiss(){
  var sel = S.oc.sel.map(ocG), done = sel.filter(function(g){ return !ocMiss(g); }), miss = sel.filter(ocMiss);
  return '<div class="pl-ph"><h3 id="pl-sh">Almost done</h3><button type="button" class="pl-x" data-a="oclater" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<div class="pl-oc-res">' + done.map(function(g){ return '<span class="pl-oc-chip ok">' + ocInit(g, 22) + esc(ocFirst(g.n)) + ic('check', 13) + '</span>'; }).join('') + miss.map(function(g){ return '<span class="pl-oc-chip miss">' + ocInit(g, 22) + esc(ocFirst(g.n)) + '</span>'; }).join('') + '</div>'
    + '<p class="pl-sp" style="text-align:left;margin:12px 0 16px">' + (done.length ? ocNames(done) + (done.length === 1 ? ' is' : ' are') + ' checked in. ' : '') + ocNames(miss) + ' just needs 1 more detail: date of birth.</p>'
    + '<button type="button" class="pl-btn pri" data-a="ocfix">Add ' + esc(ocFirst(miss[0].n)) + '\'s date of birth</button><button type="button" class="pl-btn txt" data-a="oclater">I\'ll do it later</button>';
}
function sOcCount(){
  return '<div class="pl-ph"><h3 id="pl-sh">How many guests?</h3><button type="button" class="pl-x" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div>'
    + '<p class="pl-sp" style="text-align:left;margin:0 0 14px">Everyone staying, children included.</p><div class="pl-step"><span>Guests</span><div class="ctl"><button type="button" data-a="ocm" aria-label="One guest less"' + (S.oc.count <= 1 ? ' disabled' : '') + '>−</button><output aria-live="polite">' + S.oc.count + '</output><button type="button" class="add" data-a="ocp" aria-label="One guest more"' + (S.oc.count >= 8 ? ' disabled' : '') + '>+</button></div></div>'
    + '<button type="button" class="pl-btn pri" data-a="close" style="margin-top:16px">Done</button>';
}
/* registrados: la misma apertura que la V8 (la cabecera crece a pantalla completa) con los huéspedes registrados */
function sOcDone(){
  var h = S.hr || { t: 0, l: 0, r: 0, b: Math.round(innerHeight * .7) }, sel = S.oc.sel.map(ocG).sort(function(x, y){ return SAVED.indexOf(x) - SAVED.indexOf(y); }), done = sel.filter(function(g){ return !ocMiss(g) || S.oc.fixd[g.id]; });
  var gl = S.oc.count - done.length, pays = ocPays(), keys = C.bra === '1';
  var todo = (gl > 0 ? [['users', !done.length ? (gl === 1 ? 'Register your guest' : 'Register all ' + gl + ' guests') : gl === 1 ? 'Register 1 more guest' : 'Register ' + gl + ' more guests', gl === 1 ? '1 guest' : gl + ' guests']] : [])
    .concat(pays.map(function(k){ return [k === 'deposit' ? 'shield' : k === 'taxes' ? 'pin' : 'lock', k === 'deposit' ? (C.bdep === 'token' ? 'Save your card for the deposit' : 'Leave the security deposit') : k === 'taxes' ? 'Pay the tourist tax' : 'Pay your reservation', k === 'deposit' ? 'Deposit' : k === 'taxes' ? 'Tourist tax' : 'Reservation']; }));
  var n = todo.length, wrap = function(cls, inner, nn){ S.finAt = cls === 'pl-fin2' ? 1.35 + (nn || 0) * .32 : cls ? 1.7 : 1.5;  return '<div class="pl-fx pl-v8 pl-fin ' + cls + '" style="--t:' + h.t + 'px;--l:' + h.l + 'px;--r:' + h.r + 'px;--b:' + h.b + 'px;--n:' + (nn || 0) + ';--fa:' + S.finAt + 's" role="dialog" aria-modal="true" aria-labelledby="pl-sh" aria-live="polite"><img src="' + PHOTO() + '" alt=""><div class="pl-x-c">' + inner + openTxt() + '</div></div>'; };
  var chips = '<div class="pl-oc-donel">' + done.map(function(g){ return '<span class="pl-oc-chip lt">' + ocInit(g, 24) + esc(ocFirst(g.n)) + ic('check', 13) + '</span>'; }).join('') + '</div>';
  var regT = done.length === S.oc.count ? (done.length === 1 ? 'Guest registered' : 'All ' + done.length + ' guests registered') : done.length + ' of ' + S.oc.count + ' guests registered';
  if (!n) return wrap('', '<span class="pl-draw">' + CHECK_SVG + '</span><p class="pl-x-eye">Check-in done</p><h2 id="pl-sh">You\'re all set, ' + esc(ocFirst(SAVED[0].n)) + '!</h2><p class="pl-oc-dsub">Everyone is checked in for ' + esc(prop(BOOKING.prop).name) + '.</p>' + chips);   /* nada pendiente: como siempre */
  var left = n + (n === 1 ? ' step' : ' steps') + ' left before you arrive';   /* siempre «before you arrive» (antes, con llaves, «to unlock your keys») */
  if (C.ocf === '2') {   /* 2 · lista animada: lo hecho se marca y lo que falta va apareciendo, uno a uno, hasta «Opening your booking» */
    var rows = done.map(function(g){ return '<li class="ok">' + ic('check', 14) + '<span>' + esc(ocFirst(g.n)) + ' registered</span></li>'; }).concat(todo.map(function(t){ return '<li class="to"><i></i><span>' + t[1] + '</span></li>'; }));
    return wrap('pl-fin2', '<p class="pl-x-eye">' + (done.length ? 'Almost there' : 'Next steps') + '</p><h2 id="pl-sh">' + left.charAt(0).toUpperCase() + left.slice(1) + '</h2><ul class="pl-fin-list">' + rows.map(function(r, k){ return r.replace('<li ', '<li style="--d:' + (1.35 + k * .32).toFixed(2) + 's" '); }).join('') + '</ul>', rows.length);
  }
  if (C.ocf === '3') {   /* 3 · llaves: la tarjeta «Unlock your keys» de la home a la que vas, con lo que falta */
    return wrap('pl-fin3', '<span class="pl-draw">' + CHECK_SVG + '</span><p class="pl-x-eye">' + regT + '</p><h2 id="pl-sh">Next, in your booking</h2>'
      + '<div class="pl-fin-key"><div class="pl-fin-kh"><span class="pl-fin-ki">' + ic(keys ? 'lock' : 'clock', 18) + '</span><span><b>' + (keys ? 'Unlock your keys' : 'Before you arrive') + '</b><small>Due before 25 Nov</small></span><em>' + n + (n === 1 ? ' step' : ' steps') + ' left</em></div>'
      + '<div class="pl-fin-kbar">' + Array.apply(null, Array(n + 1)).map(function(_, k){ return '<i' + (k === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'
      + '<div class="pl-fin-kc">' + todo.map(function(t){ return '<span>' + ic(t[0], 13) + t[2] + '</span>'; }).join('') + '</div></div>');
  }
  /* 1 · resumen: quién se ha registrado y, debajo, lo que queda por hacer en la reserva */
  return wrap('pl-fin1', '<span class="pl-draw">' + CHECK_SVG + '</span><p class="pl-x-eye">Guests registered</p><h2 id="pl-sh">' + regT + '</h2>' + chips
    + '<div class="pl-x-glass pl-fin-todo"><p>Still to do before you arrive</p>' + todo.map(function(t){ return '<div><span>' + ic(t[0], 15) + '</span>' + t[1] + '</div>'; }).join('') + '</div>');
}
function ocDoneNow(){
  var gh = document.querySelector('.pl-gh'); if (gh) { var r = gh.getBoundingClientRect(); S.hr = { t: Math.max(0, Math.round(r.top)), l: Math.round(r.left), r: Math.round(innerWidth - r.right), b: Math.round(innerHeight - r.bottom) }; }
  S.sheet = 'ocdone'; render(); clearTimeout(timer); timer = setTimeout(goApp, Math.round(((S.finAt || 1.5) + OC_LOAD) * 1000) + 150);   /* «Opening your booking» carga como mínimo 6 s desde que aparece */
}
/* cambio de paso con transición (A fundido · B deslizar · C subida escalonada · D barrido): sale la caja actual, cambia el paso y entra la nueva */
function ocGo(step){
  var tr = isMob() ? 'e' : 'b';   /* decidido: en móvil la tarjeta que sube; en escritorio, deslizar */
  var card = root.querySelector('.pl-col>.pl-card'), dock = root.querySelector('.pl-col>.pl-dock'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var swap = function(){ S.oc.step = step; S.oc.enter = tr; render(); S.oc.enter = ''; };
  if (!card || reduce) { S.oc.step = step; render(); return; }
  if (tr === 'e') {   /* E · tarjeta que sube: la caja actual se queda, se vuelve translúcida y la nueva sube por encima con su sombra hasta taparla */
    var ghosts = [card, dock].filter(Boolean).map(function(e){ var g = e.cloneNode(true); g.classList.add('pl-ghost'); g.setAttribute('aria-hidden', 'true'); g.style.top = e.offsetTop + 'px'; g.style.height = e.offsetHeight + 'px'; return g; });
    swap();
    var col = root.querySelector('.pl-col'); ghosts.forEach(function(g){ col.insertBefore(g, col.firstChild); });
    setTimeout(function(){ ghosts.forEach(function(g){ g.remove(); }); }, 680);
    return;
  }
  [card, dock].forEach(function(e){ if (e) e.classList.add('pl-out-' + tr); });
  setTimeout(swap, { a: 176, b: 220, c: 176, d: 352, e: 286 }[tr] || 176);
}
/* registrando: la misma secuencia que la Gestap (registered.js · runProcessing) y, al confirmar, a «Almost done» si falta alguien o a la pantalla final */
function ocReg(){
  var q = function(sel){ return root.querySelector(sel); }, li = function(i, c){ var l = root.querySelectorAll('.pl-reg-steps li')[i]; if (l) l.className = c; };
  var rn = S.oc.sel.length, rd = S.oc.sel.map(ocG).filter(function(g){ return !ocMiss(g); }).length, who = rd < rn ? rd + ' of ' + rn + ' guests' : rn === 1 ? ocFirst(ocG(S.oc.sel[0]).n) + ' is' : rn + ' guests are';   /* si a alguien le falta un dato, no se cuenta como registrado */
  setTimeout(function(){ li(0, 'act'); }, 330);
  setTimeout(function(){ li(0, 'done'); li(1, 'act'); }, 825);
  setTimeout(function(){ li(1, 'done'); li(2, 'act'); }, 2200);
  setTimeout(function(){ li(2, 'done'); var r = q('.pl-reg-ring'), h = q('.pl-reg h2'), p = q('.pl-reg .pl-lead'); if (r) r.setAttribute('data-st', 'ok'); if (h) h.textContent = who + ' registered'; if (p) p.textContent = 'All set'; }, 2585);
  setTimeout(function(){ if (S.oc.step !== 'reg') return; var pend = S.oc.sel.map(ocG).some(ocMiss) || (C.oca !== 'c' && S.oc.sel.length < S.oc.count); if (pend) ocGo('almost'); else ocDoneNow(); }, 3630);   /* C: «What's left» solo si alguien tiene datos pendientes; si solo faltan huéspedes, la pantalla final («2 of 4 checked in») */
}
function goForm(){ if (/[?&]hold=1/.test(location.search)) return; location.href = (location.port === '7794' ? 'http://localhost:7791/screens/' : '../../screens/') + (DESK ? 'form-empty.d.html' : 'g2-form-empty.m.html'); }   /* registro manual: el formulario de la réplica */
function ocAction(a, t){
  var oc = S.oc;
  switch (a) {
    case 'ocgoogle': case 'ocapple': if (oc.busy) return true; S.sheet = null; oc.busy = a; render(); setTimeout(function(){ oc.busy = ''; oc.signed = true; ocGo('count'); }, OC_WAIT); return true;   /* tras iniciar sesión: primero cuántos sois (en la misma caja) */
    case 'ocgc': var gk = t.getAttribute('data-k'), gd = +t.getAttribute('data-d'), gt = C.gcm !== 'total' ? oc.ad + oc.mi : oc.count; if (gd > 0 && gt >= 20) return true; if (gk === 'ad') oc.ad = Math.max(1, oc.ad + gd); else if (gk === 'mi') oc.mi = Math.max(0, oc.mi + gd); else oc.count = Math.max(1, oc.count + gd); break;
    case 'ocgcok': if (oc.busy) return true; if (C.gcm !== 'total') oc.count = oc.ad + oc.mi; oc.sel = oc.sel.slice(0, oc.count); oc.busy = 'ocgcok'; render(); setTimeout(function(){ oc.busy = ''; ocGo(C.ocv === 'none' ? 'new' : 'pick'); }, OC_WAIT); return true;   /* misma cadencia que del paso 1 al 2 */
    case 'ocskip': if (oc.busy) return true; S.sheet = null; oc.sel = []; oc.fixd = {}; ocDoneNow(); return true;   /* sin cuenta: a la home, con la misma pantalla final (lista animada + «Opening your booking»), sin nadie registrado */
    case 'ocform': goForm(); return true;
    case 'ocout': oc.step = 'welcome'; oc.signed = false; break;
    case 'ocsel': var id = t.getAttribute('data-g'), i = oc.sel.indexOf(id); oc.err = ''; if (i >= 0) oc.sel.splice(i, 1); else if (oc.sel.length < oc.count) oc.sel.push(id); else return true; break;
    case 'occount': S.sheet = 'occount'; break;
    case 'ocwhy2': S.sheet = 'ocwhy'; break;
    case 'ochow': S.sheet = 'ochow'; break;
    case 'ocrem': oc.rem = !oc.rem; break;
    case 'ocsave1': oc.save = true; break;
    case 'ocsave0': oc.save = false; break;
    case 'ocwhy': if (isMob()) S.sheet = 'ocwhy'; else oc.why = !oc.why; break;   /* en móvil, en una hoja (no mueve la pantalla) */
    case 'ocm': oc.count = Math.max(1, oc.count - 1); if (oc.sel.length > oc.count) oc.sel = oc.sel.slice(0, oc.count); break;
    case 'ocp': oc.count = Math.min(8, oc.count + 1); break;
    case 'ocgo':
      if (!oc.sel.length || oc.busy) return true;
      if (!ocLead()) { oc.err = 'Choose at least one adult: someone has to be the lead guest.'; break; }
      oc.busy = 'ocgo'; render();
      setTimeout(function(){ oc.busy = ''; ocGo('reg'); ocReg(); }, OC_WAIT);   /* registrando (como la Gestap), dentro de la caja */   /* quedan huéspedes o datos → «Almost done» en la caja; todos registrados → la pantalla final de siempre */
      return true;
    case 'oclaterall': goApp(); return true;   /* «You can add guests later»: sin elegir a nadie, a la estancia */
    case 'ocfix': S.sheet = null; var fg = t.getAttribute('data-g'), q = oc.sel.map(ocG).filter(function(g){ return ocMiss(g) && !oc.fixd[g.id]; }).sort(function(x, y){ return SAVED.indexOf(x) - SAVED.indexOf(y); }).map(function(g){ return g.id; }); if (fg && q.indexOf(fg) > 0) { q.splice(q.indexOf(fg), 1); q.unshift(fg); } oc.fq = q; oc.fi = 0; ocGo('fix'); return true;   /* se completan uno detrás de otro, empezando por el pulsado */
    case 'ocfixback': if (oc.fi > 0) { oc.fi--; S.err = {}; ocGo('fix'); } return true;
    case 'oclater': S.sheet = null; ocDoneNow(); return true;
    case 'ocsave':
      var cg = oc.fq[oc.fi], bad = 0; S.err = {};
      mfOf(cg).forEach(function(k){ var f = MFD[k], v = (S.f[k] || '').trim(), cv = v.replace(/\s/g, ''); if (f.d ? (!/^\d{1,2}\/?\d{1,2}\/?\d{4}$/.test(cv) && !/^\d{8}$/.test(cv.replace(/\D/g, ''))) : !v) { S.err[k] = f.e; bad++; } });
      if (bad) break;
      oc.busy = 'ocsave'; render(); setTimeout(function(){ oc.busy = ''; oc.fixd[cg] = true; if (oc.fi < oc.fq.length - 1) { oc.fi++; ocGo('fix'); } else ocDoneNow(); }, OC_WAIT); return true;   /* siguiente huésped incompleto o, si era el último, la pantalla final */
    default: return false;
  }
  render(); return true;
}
var TR_UCHK = '<path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>';
var TR_UADD = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>';
/* formulario de la Gestap: tarjeta de sección (data-slot="form-section") y campo con etiqueta flotante (.input), copiados de g2-form-empty */
function ocSec(title, body){
  return '<section data-slot="form-section" class="pl-ffsec rounded-[var(--form-section-radius)] border border-[var(--form-section-border)] bg-[var(--form-section-bg)] text-left [--empty-field-background:var(--chekin-color-white)] [--field-border:var(--chekin-border-default)] [--field-label-font-weight:500] [--field-max-width:100%]"><header data-slot="form-section-header" class="flex items-center gap-2.5 border-b border-[var(--form-section-border)] bg-[var(--form-section-header-bg)] px-[var(--form-section-px)] py-[var(--form-section-header-py)] rounded-t-[calc(var(--form-section-radius)-1px)]"><span class="flex shrink-0 items-center text-[var(--form-section-icon-color)] [&amp;_svg]:size-[var(--form-section-icon-size)]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 2v2"></path><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path><path d="M8 2v2"></path><circle cx="12" cy="11" r="3"></circle><rect x="3" y="4" width="18" height="18" rx="2"></rect></svg></span><span class="m-0 flex flex-1 items-center gap-2 uppercase leading-5 text-[var(--form-section-title-color)] [font-size:var(--form-section-title-size)] [font-weight:var(--form-section-title-weight)] [letter-spacing:var(--form-section-title-tracking)]">' + title + '</span></header>'
    + '<div data-slot="form-section-body" class="flex flex-col gap-3.5 p-[var(--form-section-px)]">' + body + '</div></section>';
}
function ocFF(k, label, v, ro, chip, isDate){
  return '<div class="pl-ff' + (v ? ' pl-up' : '') + (ro ? ' pl-ro' : '') + '"><div data-field-name="' + k + '" class="input relative block w-full min-h-[var(--field-min-height,48px)]"><div class="input__content relative w-full cursor-text"><div class="absolute box-border inline-flex max-w-full items-center pl-[3px] pr-5 transition-all duration-100 ease-in cursor-text left-[13px] text-[var(--chekin-color-gray-1)] top-[var(--field-label-top)] input__label"><label for="pl-' + k + '" class="block cursor-[inherit] truncate transition-all duration-100 ease-in text-[length:var(--field-label-font-size)] font-[var(--field-label-font-weight)]">' + label + '</label></div>'
    + '<fieldset aria-hidden="true" class="pointer-events-none absolute -top-[5px] bottom-0 left-0 right-0 m-0 min-w-0 rounded-[var(--field-radius)] border px-[13px] text-left transition-colors duration-75 border-[var(--field-border)] input__fieldset"><legend class="invisible float-none block h-[11px] max-w-[0.01px] whitespace-nowrap p-0 text-[0.75em] transition-[max-width] duration-[50ms] ease-out"><span class="visible inline-block px-1 text-[length:var(--field-label-raised-font-size)] opacity-0 font-[var(--field-label-font-weight)]">' + label + '</span></legend></fieldset>'
    + '<input id="pl-' + k + '" ' + (ro ? 'readonly tabindex="-1"' : 'name="' + k + '"' + (isDate ? ' inputmode="numeric"' : '')) + ' placeholder=" " value="' + esc(v || '') + '"' + (!ro && S.err[k] ? ' aria-invalid="true"' : '') + ' class="input__control m-0 box-border h-12 w-full rounded-[var(--field-radius)] border-0 px-4 text-[16px] font-medium leading-5 outline-none transition-colors duration-200 bg-[var(--empty-field-background)] text-[var(--chekin-color-gray-1)]"></div></div>' + (chip || '') + '</div>';
}
/* huésped con datos pendientes: la fila de Guest summary de la Gestap (hub.js rowH · .v1-row/.v1-av/.v1-tx/.v1-chip/.v1-btn), en 4 versiones */
function ocPend(g){
  var av = '<span class="pl-gs-av">' + g.n.split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2) + '</span>', chip = '<em class="pl-gs-chip">Details pending</em>';
  if (C.ocl === '2') return '<button type="button" class="pl-gs-row pl-gs-tap" data-a="ocfix">' + av + '<span class="pl-gs-tx"><b>' + esc(g.n) + '</b>' + chip + '</span>' + ic('right', 20) + '</button>';   /* V2 · toda la fila se pulsa, con chevron */
  if (C.ocl === '3') return '<div class="pl-gs-row">' + av + '<span class="pl-gs-tx"><b>' + esc(g.n) + '</b><span>Some details are missing</span>' + chip + '</span><button type="button" class="pl-gs-btn" data-a="ocfix">Complete</button></div>';   /* V3 · con la línea gris de Guest summary («You · Details saved») */
  if (C.ocl === '4') return '<div class="pl-gs-row pl-gs-warm"><div class="pl-gs-top">' + av + '<span class="pl-gs-tx"><b>' + esc(g.n) + '</b>' + chip + '</span></div><p>Some details are missing. Complete them before you arrive.</p></div>';   /* sin botón: «Complete details» es el CTA principal de la barra */   /* V4 · destacada en ámbar suave, con el botón a lo ancho */
  return '<div class="pl-gs-row">' + av + '<span class="pl-gs-tx"><b>' + esc(g.n) + '</b>' + chip + '</span><button type="button" class="pl-gs-btn" data-a="ocfix">Complete</button></div>';   /* V1 · la fila tal cual */
}
function ocTask(a, icon, title, desc){   /* copia literal del componente de la Gestap: home-after-1 · task-row pendiente + tag warning «Pending» */
  return '<button data-slot="task-row" data-state="pending" type="button" data-a="' + a + '" class="group relative flex w-full items-center text-left gap-[var(--task-row-gap)] px-[var(--task-row-px)] py-[var(--task-row-py)] border-t border-[color:var(--task-row-divider)] first:border-t-0 transition-colors hover:bg-[var(--task-row-hover-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chekin-color-brand-blue)] [background:var(--task-row-pending-tint)] before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-r before:bg-[var(--task-row-pending-marker)] before:content-[&quot;&quot;] before:[animation:task-row-pending-marker_1.6s_ease-in-out_infinite] motion-reduce:before:animate-none">'
    + '<span class="relative z-[1] grid shrink-0 place-items-center size-[var(--task-row-badge-size)] rounded-[var(--task-row-badge-radius)] border-[3px] [&amp;_svg:not([class*=\'size-\'])]:size-[18px] border-transparent bg-[var(--task-row-badge-pending-bg)] text-[color:var(--task-row-badge-pending-text)] after:absolute after:-inset-[8px] after:rounded-[calc(var(--task-row-badge-radius)+4px)] after:content-[\'\'] after:border-[3px] after:border-[color:var(--task-row-pending-halo)] after:opacity-0 after:[animation:task-row-pending-ring_1.6s_ease-in-out_infinite] motion-reduce:after:animate-none"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" aria-hidden="true">' + icon + '</svg></span>'
    + '<span class="flex min-w-0 flex-1 flex-col"><span class="text-[length:var(--task-row-title-font-size)] font-semibold leading-5 text-[color:var(--task-row-title)]">' + title + '</span><span class="mt-0.5 text-[length:var(--task-row-description-font-size)] leading-[var(--task-row-description-line-height)] text-[color:var(--task-row-description)]">' + desc + '</span></span>'
    + '<span class="ml-auto flex shrink-0 items-center gap-2"><span data-slot="tag" data-tone="warning" data-casing="upper" class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-bold [&amp;&gt;svg]:shrink-0 uppercase tracking-[var(--tag-tracking)] bg-[var(--tag-warning-bg)] text-[color:var(--tag-warning-text)] h-[var(--tag-height-xs)] px-[var(--tag-padding-x-xs)] text-[length:var(--tag-font-size-xs)] [&amp;&gt;svg]:size-[var(--tag-icon-size-xs)]"><span aria-hidden="true" class="size-2 rounded-full bg-[var(--task-row-pending-marker)] [animation:task-row-pending-dot_1.6s_ease-in-out_infinite] motion-reduce:animate-none"></span>Pending</span>'
    + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right size-5 shrink-0 text-[color:var(--task-row-pending-chevron)] transition-[transform,color] group-hover:translate-x-[3px] group-hover:text-[color:var(--chekin-color-brand-blue)]" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></span></button>';
}
var KB0 = Date.now();
/* vista dividida: en el one click el escritorio NO se recarga al tocar el panel (perdía el paso en el que estaba y se desincronizaba del móvil); aplica el ajuste en vivo, igual que el móvil */
window.__liveSettings = !!OC;
var LIVE = { 'replica-oc-s': ['ocs', 1], 'replica-oc-v': ['ocv', 1], 'replica-oc-g': ['ocg', 1], 'replica-oc-min': ['bmin', 1], 'replica-oc-pay': ['bpay', 0], 'replica-oc-dep': ['bdep', 0], 'replica-oc-ra': ['bra', 0], 'replica-oc-gcm': ['gcm', 0] };   /* 1 = el móvil reinicia el flujo (changed) · 0 = solo redibuja */
window.addEventListener('storage', function(e){ var k = OC && LIVE[e.key]; if (!k || e.newValue === null) return; C[k[0]] = e.newValue; if (k[1]) changed(); else render(); });
var OC_LOAD = 4.5;   /* segundos que dura la carga de la reserva en la pantalla final (pedido por Dani; antes 6) */
var OC_WAIT = 990;   /* lo que dura «Signing in… / Confirming… / Checking in…» antes de cambiar de paso (900 ms + 10 %), igual en todos los pasos */
function render(){
  document.documentElement.classList.remove('pl-nophoto');
  ['pl-dx', 'pl-d1', 'pl-d2', 'pl-d22', 'pl-d3', 'pl-d4'].forEach(function(c){ document.documentElement.classList.remove(c); });
  if (C.dv !== '0') document.documentElement.classList.add('pl-dx', 'pl-d' + (C.dv === '22' ? '2' : C.dv));
  if (C.dv === '22') document.documentElement.classList.add('pl-d22');   /* D2.2: como D2, pero la parte blanca es la hoja del móvil pegada al borde derecho */   /* maquetación de escritorio (solo afecta a ≥ 1024 px) */
  document.documentElement.classList.toggle('pl-pat', C.ph === '0' && /^t/.test(C.gi));   /* patrones: más suaves para que el texto se lea */   /* sin foto de la propiedad: ahora se usa una imagen genérica (PHOTO), no el degradado solo */
  var body = OC ? vOc() : S.phase === 'blocked' ? vBlocked() : S.phase === 'create' ? vCreate() : vForm();
  root.className = (S.notice ? 'pl-has-note ' : '') + (S.needCout ? 'pl-has-cout' : '') + (OC ? ' pl-ocm' : '');
  if (OC) root.style.setProperty('--pl-photo', 'url("' + PHOTO() + '")');   /* móvil: la misma foto continúa por detrás de la caja, cada vez más grande hacia abajo */   /* sin modo compacto: al fallar no cambia el tamaño de nada (el aviso va junto al botón y el error de cada campo sustituye a su ayuda) */
  var head = header(), sh = sheet(), ci = OC ? body.indexOf('<div class="pl-col') : -1, top = ci > 0 ? head + body.slice(0, ci) : null, main = root.querySelector(':scope > .pl-main');
  if (top !== null && main && root.__top === top && main.querySelector(':scope > .pl-col')) {   /* one click: si la cabecera no cambia, solo se cambia la caja. La foto y el fondo no se vuelven a crear (antes parpadeaban a oscuro y el zoom daba saltos) */
    var oc0 = main.querySelector(':scope > .pl-col'); while (oc0.nextSibling) main.removeChild(oc0.nextSibling); main.removeChild(oc0);
    main.insertAdjacentHTML('beforeend', body.slice(ci));
    while (main.nextSibling) root.removeChild(main.nextSibling);
    root.insertAdjacentHTML('beforeend', sh);
  } else {
    root.innerHTML = head + '<main class="pl-main">' + body + '</main>' + sh; root.__top = top;
  }
  var kb = -((Date.now() - KB0) / 1000) + 's'; [].forEach.call(root.querySelectorAll('.pl-gh>img,.pl-w13 .pl-w11bg'), function(im){ if (im.__kb) return; im.__kb = 1; im.style.animationDelay = kb; });   /* el zoom en bucle sigue donde iba: solo se coloca en las fotos nuevas (tocarlo en las que ya están hacía saltar el zoom) */
  document.body.style.overflow = S.sheet ? 'hidden' : '';
  fit();
}

/* ---------- validar y buscar ---------- */
/* errores de campo: claros, sin culpar y con el siguiente paso; el error sustituye a la ayuda del campo (no mueve nada) */
var DOMAINS = ['gmail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'yahoo.com', 'yahoo.es', 'icloud.com', 'live.com', 'msn.com', 'aol.com', 'gmx.de', 'web.de', 'orange.fr', 'libero.it', 'proton.me'];
function lev(a, b){ var m = a.length, n = b.length, d = [], i, j; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 0; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
/* «maria@gmial.com» → «maria@gmail.com»: sugerencia, nunca se corrige sola */
function suggest(email){ var m = /^([^\s@]+)@([^\s@]+)$/.exec((email || '').trim().toLowerCase()); if (!m) return ''; if (DOMAINS.indexOf(m[2]) >= 0) return ''; var dom = m[2].replace(/\.con$/, '.com').replace(/\.cmo$/, '.com'), best = '', bd = 3; DOMAINS.forEach(function(x){ var k = lev(dom, x); if (k < bd) { bd = k; best = x; } }); if (!best && dom !== m[2]) best = dom; return best && best !== m[2] ? m[1] + '@' + best : ''; }
function validate(){
  var e = {}, f = S.f, m = S.method;
  if (m === 'n') {
    var nm = f.name.trim(), w = nm.split(/\s+/).filter(Boolean);
    if (!w.length) e.name = 'Enter the name on the booking.';
    else if (nm.indexOf('@') >= 0) e.name = 'That looks like an email. Enter the name of whoever booked.';
    else if (w.length < 2) e.name = 'Add the surname too, e.g. Maria Lowe.';
    if (askProp() && !f.prop) e.prop = 'Choose the property you are staying at.';
  }
  if (m === 'c') {
    var cd = f.code.replace(/[\s-]+/g, '').toUpperCase();
    if (!cd) e.code = 'Enter your booking code.';
    else if (cd.indexOf('@') >= 0) e.code = 'That looks like an email. Search with “Email and arrival date” instead.';
    else if (cd.length < 5) e.code = 'That code looks too short. Copy it from your confirmation.';
    else f.code = cd;   /* sin espacios ni guiones y en mayúsculas, como en la confirmación */
  }
  if (m === 'e') {
    if (!f.email.trim()) e.email = 'Enter the email you booked with.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'This email looks incomplete, e.g. name@email.com.';
  }
  if (m !== 'c' && !f.cin) e.cin = 'Choose your arrival date.';
  if (S.needCout && !f.cout) e.cout = 'Choose your departure date.';
  return e;
}
var timer = 0;
var isMob = function(){ return window.matchMedia('(max-width:1023px)').matches; };
/* «Looking for your booking…» va en el propio botón (en móvil siempre desde V2; en escritorio desde V3): dura menos de un segundo y no merece otra pantalla */
var inCta = function(){ return C.av !== '1' && (isMob() || C.av !== '2'); };
function search(){
  S.err = validate();
  if (Object.keys(S.err).length) { S.notice = S.notice === 'multi' ? 'multi' : null; render(); return; }
  S.notice = null; if (S.method === 'e') S.sug = suggest(S.f.email);   /* la sugerencia de email no bloquea la búsqueda, pero queda a la vista si falla */
  var cta = inCta();
  if (cta) S.cta = 'looking'; else { S.sheet = 'search'; S.sr = 'looking'; }
  render();
  clearTimeout(timer);
  timer = setTimeout(function(){
    var o = C.out;
    if (S.method === 'c' && (o === 'multi' || o === 'ambig')) o = 'found';   /* el código es único: nunca hay varias */
    if (o === 'found' || (o === 'multi' && S.needCout)) {
      /* punto de partida de las animaciones: el centro del botón (V3) y el rectángulo de la foto (V4) */
      var bt = document.querySelector('[data-a="search"]'), gh = document.querySelector('.pl-gh');
      if (bt) { var r = bt.getBoundingClientRect(); S.org = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }
      if (gh) { var h = gh.getBoundingClientRect(); S.hr = { t: Math.max(0, Math.round(h.top)), l: Math.round(h.left), r: Math.round(innerWidth - h.right), b: Math.round(innerHeight - h.bottom) }; }
      /* V7: lo que escribió el huésped sale volando desde sus campos */
      S.chips = [];
      var add1 = function(sel, txt){ var el = document.querySelector(sel); el = el && (el.closest('.pl-field') || el); if (!el || !txt) return; var q = el.getBoundingClientRect(); S.chips.push({ t: txt, x: q.left, y: q.top, w: q.width, h: q.height }); };
      if (S.method === 'n') { add1('#pl-name', titleCase(S.f.name)); if (askProp() && S.f.prop) add1('[data-a="prop"]', prop(S.f.prop).name); add1('[data-a="cal"][data-k="cin"]', S.f.cin ? fmt(parse(S.f.cin)) : ''); }
      else if (S.method === 'c') add1('#pl-code', S.f.code.trim().toUpperCase());
      else { add1('#pl-email', S.f.email.trim()); add1('[data-a="cal"][data-k="cin"]', S.f.cin ? fmt(parse(S.f.cin)) : ''); }
      S.cta = null; S.sheet = 'search'; S.sr = 'found'; render(); timer = setTimeout(goApp, +C.av >= 3 ? 3800 : 3200); return;
    }
    S.cta = null; S.sheet = null;
    if (o === 'block') { S.phase = 'blocked'; S.until = Date.now() + 60000; }
    else if (o === 'net') S.notice = 'net';
    else if (o === 'none') { S.notice = 'none'; S.fails++; }
    else if (!S.needCout) { S.needCout = true; S.notice = 'multi'; }
    else S.notice = 'ambig';
    render();
  }, C.av === '1' ? 1700 : 900);
}
function createGo(){
  var e = {}, f = S.f;
  if (!f.cCin) e.cCin = 'Choose a date.';
  if (!f.cCout) e.cCout = 'Choose a date.';
  if (!f.cName.trim()) e.cName = 'Enter your name.';
  if (f.cEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.cEmail.trim())) e.cEmail = 'This email doesn\'t look complete.';
  S.err = e; if (Object.keys(e).length) { render(); return; }
  S.busy = true; render();
  setTimeout(goApp, 900);
}
function goApp(){ if (/[?&]hold=1/.test(location.search)) return; location.href = (location.port === '7794' ? 'http://localhost:7791/screens/' : '../../screens/') + 'home.' + (DESK ? 'd' : 'm') + '.html'; }   /* en local, la réplica de :7791; publicado, la réplica del mismo sitio */

/* ---------- eventos ---------- */
document.addEventListener('click', function(ev){
  var t = ev.target.closest('[data-a]'); if (!t || !root.contains(t)) return;
  if (S.sheet === 'search' && t.getAttribute('data-a') !== 'cancel') return;
  if (S.sheet === 'ocdone') return;
  if (OC && /^oc/.test(t.getAttribute('data-a'))) { ev.preventDefault(); ocAction(t.getAttribute('data-a'), t); return; }   /* mientras busca, solo vale «Go back» */
  var a = t.getAttribute('data-a');
  if (a === 'close' && t.classList.contains('pl-sheet') && ev.target !== t) return;   /* pulsar dentro de la hoja no la cierra */
  ev.preventDefault();
  var k = t.getAttribute('data-k');
  switch (a) {
    case 'pickm': case 'tab': S.picked = true; S.fails = 0; S.method = t.getAttribute('data-m'); S.notice = null; S.err = {}; S.needCout = false; S.f.cout = ''; break;
    case 'quick': S.f[k] = t.getAttribute('data-d'); delete S.err[k]; if (k === 'cin') { S.f.cout = S.needCout ? '' : S.f.cout; } break;
    case 'cal': S.sheet = 'cal:' + k; var cur = S.f[k] ? parse(S.f[k]) : (k === 'cout' && S.f.cin ? parse(S.f.cin) : k === 'cCout' && S.f.cCin ? parse(S.f.cCin) : TODAY); S.cal = new Date(cur.getFullYear(), cur.getMonth(), 1); break;
    case 'mprev': S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() - 1, 1); break;
    case 'mnext': S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() + 1, 1); break;
    case 'day':
      var kk = S.sheet.split(':')[1]; S.f[kk] = t.getAttribute('data-d'); delete S.err[kk];
      if (kk === 'cin' && S.f.cout && parse(S.f.cout) <= parse(S.f.cin)) S.f.cout = '';
      if (kk === 'cCin' && S.f.cCout && parse(S.f.cCout) <= parse(S.f.cCin)) S.f.cCout = '';
      S.sheet = null;
      if (kk === 'cCin' && !S.f.cCout) { S.sheet = 'cal:cCout'; }   /* llegada elegida: se abre la salida directamente */
      break;
    case 'prop': S.sheet = 'prop'; S.q = ''; break;
    case 'contact': S.sheet = 'contact'; break;
    case 'usesug': S.f.email = S.sug; S.sug = ''; delete S.err.email; break;
    case 'tip': if (!isMob()) return; S.sheet = 'tip:' + k; break;   /* en escritorio la guía sale al pasar el ratón */
    case 'changem': S.picked = false; S.notice = null; S.err = {}; S.needCout = false; S.f.cout = ''; break;
    case 'lang': S.sheet = 'lang'; break;
    case 'setlang': S.lang = +t.getAttribute('data-i'); S.sheet = null; break;
    case 'pick': S.f.prop = t.getAttribute('data-p'); delete S.err.prop; S.sheet = null; break;
    case 'close': S.sheet = null; break;
    case 'search': if (S.sheet !== 'search' && !S.cta) search(); return;
    case 'cancel': clearTimeout(timer); S.sheet = null; S.cta = null; S.needCout = false; S.f.cout = ''; break;
    case 'create': S.phase = 'create'; S.err = {}; S.f.cCin = S.f.cin; S.f.cName = S.f.name ? titleCase(S.f.name) : ''; S.f.cEmail = S.f.email; window.scrollTo(0, 0); break;
    case 'back': S.phase = 'form'; S.err = {}; break;
    case 'gm': S.f.guests = Math.max(1, S.f.guests - 1); break;
    case 'gp': S.f.guests = Math.min(16, S.f.guests + 1); break;
    case 'cgo': if (!S.busy) createGo(); return;
    case 'noop': return;
    default: return;
  }
  render();
});
document.addEventListener('input', function(ev){
  var el = ev.target; if (!el.name || !root.contains(el)) return;
  if (el.name === 'q') { S.q = el.value; var pos = el.selectionStart; render(); var n = document.getElementById('pl-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } return; }
  if (el.name in S.f) { S.f[el.name] = el.value; if (S.err[el.name]) { delete S.err[el.name]; var w = el.closest('.pl-f'); if (w) { w.classList.remove('pl-err'); var m = w.querySelector('.pl-errt'); if (m) m.remove(); } } }
});
document.addEventListener('keydown', function(ev){
  if (ev.key === 'Escape' && S.sheet && S.sheet !== 'search') { S.sheet = null; render(); }
  if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && S.phase === 'form' && ev.target.name !== 'q') { ev.preventDefault(); if (S.sheet !== 'search') search(); }
});
window.addEventListener('scroll', function(){ if (window.scrollY > 4) document.documentElement.setAttribute('data-hscroll', ''); else document.documentElement.removeAttribute('data-hscroll'); }, { passive: true });

window.__plSuggest = suggest; window.__plSetSug = function(sg){ if (sg === S.sug) return; S.sug = sg; render(); };
render();

/* textos del panel: en español en local (:7794) y en inglés en la versión publicada */
var PEN = {"W5 · Tarjeta de embarque": "W5 · Boarding pass", "W6 · Conversación": "W6 · Conversation", "W7 · El viaje": "W7 · The journey", "W8 · Elige y verás": "W8 · Choose and see", "W9 · Un botón": "W9 · One button", "W10 · Los huéspedes": "W10 · The guests", "W11 · Decidir después": "W11 · Decide later", "W13 · Azul + tu estancia": "W13 · Blue + your stay", "T1 · Actual": "T1 · Current", "T2 · Progreso": "T2 · Progress", "T3 · Puntos": "T3 · Dots", "T4 · Baldosas": "T4 · Tiles", "W13 · Línea del viaje": "W13 · Journey line", "C1 · Directo": "C1 · Direct", "C2 · Beneficio": "C2 · Benefit", "C3 · Obligatorio": "C3 · Required", "C4 · Cercano": "C4 · Friendly", "W13 · Copy del check-in (escritorio)": "W13 · Check-in copy (desktop)", "W12 · Interruptor": "W12 · Switch", "W1 · Billete": "W1 · Ticket", "W2 · Ficha + desplegable": "W2 · Details + expandable", "W3 · Dos caminos": "W3 · Two paths", "W4 · La reserva en la foto": "W4 · Booking on the photo", "Entrada (sin sesión)": "Entry (signed out)", "Pantalla": "Screen", "Sesión iniciada al entrar": "Signed in on arrival", "Huéspedes guardados": "Saved guests", "Ninguno": "None", "4, todos completos": "4, all complete", "4, dos con datos pendientes": "4, two missing details", "4, dos pendientes (Tom con 5 datos)": "4, two pending (Tom missing 5)", "V2 · Componentes de la Gestap": "V2 · Guest app components", "V3 · Fichas": "V3 · Tiles", "Paso 1 · Entrada": "Step 1 · Entry", "Paso 2 · Who's coming?": "Step 2 · Who's coming?", "Paso": "Step", "Menores": "Minors", "Pagos (ninguno = solo registro de huéspedes)": "Payments (none = guest registration only)", "Depósito": "Deposit", "Tasas": "Taxes", "Pago reserva": "Reservation payment", "Tipo de depósito": "Deposit type", "Retención": "Hold", "Tarjeta guardada": "Saved card", "Remote access (llaves)": "Remote access (keys)", "A · Fundido": "A · Fade", "B · Deslizar": "B · Slide", "C · Subida escalonada": "C · Staggered rise", "D · Barrido": "D · Sweep", "E · Tarjeta que sube": "E · Card rises", "Transición entre pasos": "Step transition", "Por edad": "By age", "Huéspedes (paso 2)": "Guest count (step 2)", "Paso 2 · Huéspedes": "Step 2 · Guest count", "Paso 3 · Who's coming?": "Step 3 · Who's coming?", "V1.1 · Líder con corona": "V1.1 · Lead guest crown", "V1.2 · V1.1 con delineado": "V1.2 · V1.1 with outline", "V4 · Huecos de la reserva": "V4 · Booking slots", "V5 · Progreso arriba": "V5 · Progress on top", "V6 · Adultos y menores": "V6 · Adults and minors", "Elegir huéspedes (con sesión)": "Pick guests (signed in)", "Huéspedes en la reserva": "Guests in the booking", "C4.1 · Dónde + descripción": "C4.1 · Where + description", "Actual": "Current", "C1 · Recomendada": "C1 · Recommended", "C2 · Lo que vas a escribir": "C2 · What you'll type", "C3 · Ayuda primero": "C3 · Help first", "C4 · Dónde encontrarlo": "C4 · Where to find it", "Tarjetas de método": "Method cards", "Tipo de enlace": "Link type", "Cómo buscan la reserva (una o varias, mín. 1)": "How guests find their booking (one or more, min. 1)", "Nombre + fecha": "Name + date", "Código": "Code", "Email + fecha": "Email + date", "Pedir la propiedad": "Ask for the property", "Crear la reserva si no aparece": "Create booking if not found", "Sí": "Yes", "Resultado de la búsqueda": "Search result", "Encontrada": "Found", "Varias → con salida": "Several → departure date", "Varias → sin resolver": "Several → still ambiguous", "No encontrada": "Not found", "Sin conexión": "Connection error", "Demasiados intentos": "Too many attempts", "Elegir cómo buscar": "Method picker", "V1 · Pestañas": "V1 · Tabs", "V2 · Tarjetas": "V2 · Cards", "Foto de la propiedad": "Property photo", "Con foto de la propiedad": "With property photo", "Sin foto (imagen genérica)": "No photo (generic image)", "Duración de la reserva (prueba)": "Stay length (test)", "2 noches": "2 nights", "7 noches": "7 nights", "15 noches": "15 nights"};
var T = function(x){ return location.port === '7794' ? x : (PEN[x] || x); };
/* ---------- panel ---------- */
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); onPick(b.getAttribute(attr)); [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ c.classList.toggle('on', c === b); }); }, true);
  return d; };
var multi = function(list, cur, attr, onPick, any){   /* any: se pueden desmarcar todos y onPick recibe la lista */ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (cur.indexOf(o[0]) >= 0 ? ' on' : '') + '" ' + attr + '="' + o[0] + '" aria-pressed="' + (cur.indexOf(o[0]) >= 0) + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var on = [].filter.call(d.querySelectorAll('[' + attr + ']'), function(c){ return c === b ? !c.classList.contains('on') : c.classList.contains('on'); });
    if (!on.length && !any) return;   /* siempre al menos un método (salvo any) */
    [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ var x = on.indexOf(c) >= 0; c.classList.toggle('on', x); c.setAttribute('aria-pressed', x); });
    var ks = on.map(function(c){ return c.getAttribute(attr); }); onPick(any ? ks : ks.join('')); }, true);
  return d; };
var rows = {};
function relevance(){
  var hide = function(el, h){ var s = el && el.closest ? el.closest('.rp-s') : null; if (s) s.style.display = h ? 'none' : ''; };
  hide(rows.askp, !(isUser() && C.methods.indexOf('n') >= 0)); hide(rows.create, isUser()); hide(rows.gi, C.ph !== '0');
}
function changed(){ clearTimeout(timer); reset(); S.cta = null; render(); relevance(); }
var tries = 0, tm = setInterval(function(){
  if (!window.__repPanel) { if (++tries > 40) clearInterval(tm); return; } clearInterval(tm);
  rows.type = seg([['prop', 'Property link'], ['user', 'User link']], C.type, 'data-pt', function(k){ C.type = k; LSset('replica-pl-type', k); changed(); });
  rows.m = multi([['n', T('Nombre + fecha')], ['c', T('Código')], ['e', T('Email + fecha')]], C.methods, 'data-pm', function(v){ C.methods = v; LSset('replica-pl-m', v); changed(); });
  rows.askp = seg([['1', T('Sí')], ['0', 'No']], C.askProp, 'data-pa', function(k){ C.askProp = k; LSset('replica-pl-askp', k); changed(); });
  rows.create = seg([['1', T('Sí')], ['0', 'No']], C.create, 'data-pc', function(k){ C.create = k; LSset('replica-pl-create', k); changed(); });
  rows.out = seg([['found', T('Encontrada')], ['multi', T('Varias → con salida')], ['ambig', T('Varias → sin resolver')], ['none', T('No encontrada')], ['net', T('Sin conexión')], ['block', T('Demasiados intentos')]], C.out, 'data-po', function(k){ C.out = k; LSset('replica-pl-out', k); changed(); });
  /* pantalla: property link u one click check-in (enlaces: navegan dentro del marco y el escritorio la sigue) */
  var scr = document.createElement('div'); scr.className = 'rail-switch';
  scr.innerHTML = [['property-link', 'Property link'], ['one-click', 'One click check-in']].map(function(x){ return '<a class="rs-chip' + (S0.id === x[0] ? ' on' : '') + '" href="' + x[0] + '.' + (DESK ? 'd' : 'm') + '.html">' + x[1] + '</a>'; }).join('');
  window.__repPanel.add(T('Pantalla'), scr, 0.5);
  if (OC) {
    rows.ocs = seg([['0', 'No'], ['1', T('Sí')]], C.ocs, 'data-ocs', function(k){ C.ocs = k; LSset('replica-oc-s', k); if (rows.ocstep) [].forEach.call(rows.ocstep.querySelectorAll('[data-ocstep]'), function(c){ c.classList.toggle('on', c.getAttribute('data-ocstep') === k); }); changed(); });
    rows.ocv = seg([['none', T('Ninguno')], ['ok', T('4, todos completos')], ['miss', T('4, dos pendientes (Tom con 5 datos)')]], C.ocv, 'data-ocv', function(k){ C.ocv = k; LSset('replica-oc-v', k); changed(); });
    rows.ocg = seg([['2', '2'], ['4', '4'], ['6', '6'], ['9', '9'], ['14', '14']], C.ocg, 'data-ocg', function(k){ C.ocg = k; LSset('replica-oc-g', k); changed(); });
    rows.bmin = seg([['1', T('Sí')], ['0', 'No']], C.bmin, 'data-bmin', function(k){ C.bmin = k; LSset('replica-oc-min', k); changed(); });
    rows.bpay = multi([['deposit', T('Depósito')], ['taxes', T('Tasas')], ['reservation', T('Pago reserva')]], ocPays(), 'data-bpay', function(v){ C.bpay = v.join(','); LSset('replica-oc-pay', C.bpay); render(); }, true);   /* ninguno = solo registro de huéspedes */
    rows.bdep = seg([['hold', T('Retención')], ['token', T('Tarjeta guardada')]], C.bdep, 'data-bdep', function(k){ C.bdep = k; LSset('replica-oc-dep', k); render(); });
    rows.bra = seg([['1', T('Sí')], ['0', 'No']], C.bra, 'data-bra', function(k){ C.bra = k; LSset('replica-oc-ra', k); render(); });
    /* navegar entre pasos (no hay «atrás» en la pantalla): 1 entrada sin sesión · 2 elegir huéspedes con sesión */
    rows.ocstep = seg([['0', T('Paso 1 · Entrada')], ['c', T('Paso 2 · Huéspedes')], ['1', T('Paso 3 · Who\'s coming?')]], C.ocs, 'data-ocstep', function(k){ C.ocs = k; LSset('replica-oc-s', k); if (k === '1' && C.ocv === 'none') { C.ocv = 'miss'; LSset('replica-oc-v', 'miss'); } [].forEach.call(rows.ocs.querySelectorAll('[data-ocs]'), function(c){ c.classList.toggle('on', c.getAttribute('data-ocs') === k); }); changed(); });
    window.__repPanel.add(T('Paso'), rows.ocstep, 18.7);
    rows.gcm = seg([['ages', T('Por edad')], ['total', 'Total']], C.gcm, 'data-gcm', function(k){ C.gcm = k; LSset('replica-oc-gcm', k); render(); });
    window.__repPanel.add(T('Huéspedes (paso 2)'), rows.gcm, 18.75);   /* versiones: en «Controls», no en «Booking settings» */
    window.__repPanel.add(T('Sesión iniciada al entrar'), rows.ocs, 1.1);
    window.__repPanel.add(T('Huéspedes guardados'), rows.ocv, 1.2);
    window.__repPanel.add(T('Huéspedes en la reserva'), rows.ocg, 1.3);
    window.__repPanel.add(T('Menores'), rows.bmin, 1.31);
    window.__repPanel.add(T('Pagos (ninguno = solo registro de huéspedes)'), rows.bpay, 1.32);
    window.__repPanel.add(T('Tipo de depósito'), rows.bdep, 1.33);
    window.__repPanel.add(T('Remote access (llaves)'), rows.bra, 1.34);
  } else {
  window.__repPanel.add(T('Tipo de enlace'), rows.type, 1.1);
  window.__repPanel.add(T('Cómo buscan la reserva (una o varias, mín. 1)'), rows.m, 1.2);
  window.__repPanel.add(T('Pedir la propiedad'), rows.askp, 1.3);
  window.__repPanel.add(T('Crear la reserva si no aparece'), rows.create, 1.4);
  window.__repPanel.add(T('Resultado de la búsqueda'), rows.out, 20);
  }
  rows.mv = seg([['1', T('V1 · Pestañas')], ['2', T('V2 · Tarjetas')]], C.mv, 'data-pv', function(k){ C.mv = k; LSset('replica-pl-mv', k); changed(); });
  if (!OC) window.__repPanel.add(T('Elegir cómo buscar'), rows.mv, 19);
  rows.cv = seg([['0', T('Actual')], ['1', T('C1 · Recomendada')], ['2', T('C2 · Lo que vas a escribir')], ['3', T('C3 · Ayuda primero')], ['4', T('C4 · Dónde encontrarlo')], ['41', T('C4.1 · Dónde + descripción')]], C.cv, 'data-pcv', function(k){ C.cv = k; LSset('replica-pl-cv', k); if (k !== '0' && C.mv !== '2') { C.mv = '2'; LSset('replica-pl-mv', '2'); } changed(); });
  /* «Tarjetas de método» ya no se elige: C4.1 definitiva */
  rows.av = seg([['1', 'V1 · Hoja'], ['2', 'V2 · Pantalla completa'], ['3', 'V3 · Desde el botón'], ['4', 'V4 · Se abre la foto'], ['5', 'V5 · Tarjeta de reserva'], ['6', 'V6 · Puertas'], ['7', 'V7 · Tus datos encajan'], ['8', 'V8 · V3 abriéndose como V4']], C.av, 'data-pz', function(k){ C.av = k; LSset('replica-pl-av', k); changed(); });
  /* «Animación de búsqueda» ya no se elige: V8 definitiva */
  rows.ph = seg([['1', T('Con foto de la propiedad')], ['0', T('Sin foto (imagen genérica)')]], C.ph, 'data-pf', function(k){ C.ph = k; LSset('replica-pl-ph', k); changed(); });
  window.__repPanel.add(T('Foto de la propiedad'), rows.ph, 19.2);
  rows.dv = seg([['0', 'Actual'], ['1', 'D1 · Mitad y mitad'], ['2', 'D2 · Tarjeta flotante'], ['22', 'D2.2 · Hoja como en móvil'], ['3', 'D3 · Banner panorámico'], ['4', 'D4 · Minimal centrado']], C.dv, 'data-pd', function(k){ C.dv = k; LSset('replica-pl-dv', k); changed(); });
  /* «Escritorio» ya no se elige: D2 definitiva */
  rows.gi = seg([['f1', 'Foto · Llaves en la entrada'], ['f2', 'Foto · Llave en mano'], ['f3', 'Foto · Puertas al balcón'], ['f4', 'Foto · Maleta'], ['f5', 'Foto · Maleta abierta'], ['t1', 'Patrón · Geométrico'], ['t2', 'Patrón · Curvas de papel'], ['t3', 'Patrón · Pliegues'], ['t4', 'Patrón · Azulejos'], ['t5', 'Patrón · Terrazo'], ['r', 'Recepcionista (la tuya)']], C.gi, 'data-pg', function(k){ C.gi = k; LSset('replica-pl-gi', k); changed(); });
  /* «Imagen genérica» ya no se elige: curvas de papel */
  rows.nn = seg([['2', T('2 noches')], ['7', T('7 noches')], ['15', T('15 noches')]], C.nn, 'data-pn', function(k){ C.nn = k; LSset('replica-pl-nn', k); setNights(k); changed(); });
  if (!OC) window.__repPanel.add(T('Duración de la reserva (prueba)'), rows.nn, 20.5);
  setTimeout(relevance, 0);
}, 50);
})();
/* email: al salir del campo, si el dominio parece mal escrito («gmial.com»), se sugiere el bueno */
document.addEventListener('focusout', function(e){ if (!e.target || e.target.id !== 'pl-email') return; var v = e.target.value, sg = (function(){ try { return window.__plSuggest ? window.__plSuggest(v) : ''; } catch (x) { return ''; } })(); if (window.__plSetSug) window.__plSetSug(sg); });
