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
  nn: LSget('replica-pl-nn', '2'),              /* noches de la reserva de prueba */
  dv: '2',                                      /* escritorio definitivo: D2 · Tarjeta flotante (las demás quedan en el código como referencia) */              /* maquetación de escritorio: 0 = actual · 1 mitad y mitad · 2 tarjeta flotante · 3 banner panorámico · 4 minimal centrado */
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
  hash: '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };

var LANGS = [['EN', 'English'], ['ES', 'Español'], ['FR', 'Français'], ['DE', 'Deutsch'], ['IT', 'Italiano'], ['PT', 'Português']];
/* ---------- estado del flujo (solo en memoria) ---------- */
var S;
function reset(){
  S = { phase: 'form', method: methods()[0], f: { name: '', prop: '', cin: '', cout: '', code: '', email: '', cName: '', cEmail: '', guests: 1, cCin: '', cCout: '' },
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
  var ti = c ? 'Tell us about your stay' : 'Let\'s find your booking';
  var ds = c ? 'Your dates and how many of you are coming.' : hint;
  var lang = '<button type="button" class="pl-gh-lang" data-a="lang" aria-label="Language: ' + LANGS[S.lang][1] + '">' + ic('globe', 15) + LANGS[S.lang][1] + ic('down', 14) + '</button>';
  var welcome = c ? '' : '<div class="pl-gh-m"><p class="pl-wel">Welcome to</p><p class="pl-gh-name">' + esc(HOST().name) + '</p><div class="pl-gh-row"><p class="pl-loc">' + ic('pin', 15) + (isUser() ? '6 homes in Spain' : 'Albacete, Spain') + '</p>' + lang + '</div></div>';   /* solo móvil: bienvenida sobre la foto, con el idioma en la línea de la ubicación */
  return '<section class="pl-gh' + (c ? ' pl-dsk' : '') + '"><img src="' + PHOTO() + '" alt="">' + welcome
    + '<div class="pl-gh-gl"><span class="pl-gh-ic">' + ic(c ? 'cal' : 'search', 24) + '</span><div class="pl-gh-tx"><span class="pl-gh-eye">' + eye + '</span><h1>' + ti + '</h1><p>' + ds + '</p></div></div></section>';
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
function vChooser(){
  var ms = methods();
  var list = '<div class="pl-mo" role="list">' + ms.map(function(m){ var o = MO2[m];
    return '<button type="button" role="listitem" class="pl-mo-b" data-a="pickm" data-m="' + m + '"><span class="pl-mo-ic">' + ic(o.i, 22) + '</span><span class="pl-mo-tx"><b>' + o.t + (o.k ? '<em>' + o.k + '</em>' : '') + '</b><span>' + o.d + '</span><small>' + ic(o.meta[0], 13) + o.meta[1] + '</small></span><span class="pl-mo-go">' + ic('right', 18) + '</span></button>'; }).join('') + '</div>';
  var card = '<section class="pl-card pl-main-card" aria-labelledby="pl-h">' + dwel() + '<h2 id="pl-h">Let\'s find your booking</h2><p class="pl-lead pl-keep">How would you like to search? Choose the one you have to hand.</p>' + list + '</section>';
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
  if (S.sheet === 'search') return ({ '2': sSearchFull, '3': sV3, '4': sV4, '5': sV5, '6': sV6, '7': sV7, '8': sV8 }[C.av] || sSearch)();
  var inner = S.sheet === 'prop' ? sProp() : S.sheet === 'lang' ? sLang() : S.sheet === 'contact' ? sContact() : /^tip:/.test(S.sheet) ? sTip(S.sheet.slice(4)) : sCal();
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
  var m = root.querySelector('.pl-main'); FIT.forEach(function(c){ root.classList.remove(c); });
  if (!m || !isMob()) return;
  for (var i = 0; i < FIT.length && m.scrollHeight - m.clientHeight > 0; i++) root.classList.add(FIT[i]);
}
window.addEventListener('resize', function(){ if (root) fit(); });
function render(){
  document.documentElement.classList.remove('pl-nophoto');
  ['pl-dx', 'pl-d1', 'pl-d2', 'pl-d22', 'pl-d3', 'pl-d4'].forEach(function(c){ document.documentElement.classList.remove(c); });
  if (C.dv !== '0') document.documentElement.classList.add('pl-dx', 'pl-d' + (C.dv === '22' ? '2' : C.dv));
  if (C.dv === '22') document.documentElement.classList.add('pl-d22');   /* D2.2: como D2, pero la parte blanca es la hoja del móvil pegada al borde derecho */   /* maquetación de escritorio (solo afecta a ≥ 1024 px) */
  document.documentElement.classList.toggle('pl-pat', C.ph === '0' && /^t/.test(C.gi));   /* patrones: más suaves para que el texto se lea */   /* sin foto de la propiedad: ahora se usa una imagen genérica (PHOTO), no el degradado solo */
  var body = S.phase === 'blocked' ? vBlocked() : S.phase === 'create' ? vCreate() : vForm();
  root.className = (S.notice ? 'pl-has-note ' : '') + (S.needCout ? 'pl-has-cout' : '');   /* sin modo compacto: al fallar no cambia el tamaño de nada (el aviso va junto al botón y el error de cada campo sustituye a su ayuda) */
  root.innerHTML = header() + '<main class="pl-main">' + body + '</main>' + sheet();
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
  if (S.sheet === 'search' && t.getAttribute('data-a') !== 'cancel') return;   /* mientras busca, solo vale «Go back» */
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

/* ---------- panel ---------- */
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); onPick(b.getAttribute(attr)); [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ c.classList.toggle('on', c === b); }); }, true);
  return d; };
var multi = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (cur.indexOf(o[0]) >= 0 ? ' on' : '') + '" ' + attr + '="' + o[0] + '" aria-pressed="' + (cur.indexOf(o[0]) >= 0) + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var on = [].filter.call(d.querySelectorAll('[' + attr + ']'), function(c){ return c === b ? !c.classList.contains('on') : c.classList.contains('on'); });
    if (!on.length) return;   /* siempre al menos un método */
    [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ var x = on.indexOf(c) >= 0; c.classList.toggle('on', x); c.setAttribute('aria-pressed', x); });
    onPick(on.map(function(c){ return c.getAttribute(attr); }).join('')); }, true);
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
  rows.m = multi([['n', 'Nombre + fecha'], ['c', 'Código'], ['e', 'Email + fecha']], C.methods, 'data-pm', function(v){ C.methods = v; LSset('replica-pl-m', v); changed(); });
  rows.askp = seg([['1', 'Sí'], ['0', 'No']], C.askProp, 'data-pa', function(k){ C.askProp = k; LSset('replica-pl-askp', k); changed(); });
  rows.create = seg([['1', 'Sí'], ['0', 'No']], C.create, 'data-pc', function(k){ C.create = k; LSset('replica-pl-create', k); changed(); });
  rows.out = seg([['found', 'Encontrada'], ['multi', 'Varias → con salida'], ['ambig', 'Varias → sin resolver'], ['none', 'No encontrada'], ['net', 'Sin conexión'], ['block', 'Demasiados intentos']], C.out, 'data-po', function(k){ C.out = k; LSset('replica-pl-out', k); changed(); });
  window.__repPanel.add('Tipo de enlace', rows.type, 1.1);
  window.__repPanel.add('Cómo buscan la reserva (una o varias, mín. 1)', rows.m, 1.2);
  window.__repPanel.add('Pedir la propiedad', rows.askp, 1.3);
  window.__repPanel.add('Crear la reserva si no aparece', rows.create, 1.4);
  window.__repPanel.add('Resultado de la búsqueda', rows.out, 20);
  rows.mv = seg([['1', 'V1 · Pestañas'], ['2', 'V2 · Tarjetas']], C.mv, 'data-pv', function(k){ C.mv = k; LSset('replica-pl-mv', k); changed(); });
  window.__repPanel.add('Elegir cómo buscar', rows.mv, 19);
  rows.av = seg([['1', 'V1 · Hoja'], ['2', 'V2 · Pantalla completa'], ['3', 'V3 · Desde el botón'], ['4', 'V4 · Se abre la foto'], ['5', 'V5 · Tarjeta de reserva'], ['6', 'V6 · Puertas'], ['7', 'V7 · Tus datos encajan'], ['8', 'V8 · V3 abriéndose como V4']], C.av, 'data-pz', function(k){ C.av = k; LSset('replica-pl-av', k); changed(); });
  /* «Animación de búsqueda» ya no se elige: V8 definitiva */
  rows.ph = seg([['1', 'Con foto de la propiedad'], ['0', 'Sin foto (imagen genérica)']], C.ph, 'data-pf', function(k){ C.ph = k; LSset('replica-pl-ph', k); changed(); });
  window.__repPanel.add('Foto de la propiedad', rows.ph, 19.2);
  rows.dv = seg([['0', 'Actual'], ['1', 'D1 · Mitad y mitad'], ['2', 'D2 · Tarjeta flotante'], ['22', 'D2.2 · Hoja como en móvil'], ['3', 'D3 · Banner panorámico'], ['4', 'D4 · Minimal centrado']], C.dv, 'data-pd', function(k){ C.dv = k; LSset('replica-pl-dv', k); changed(); });
  /* «Escritorio» ya no se elige: D2 definitiva */
  rows.gi = seg([['f1', 'Foto · Llaves en la entrada'], ['f2', 'Foto · Llave en mano'], ['f3', 'Foto · Puertas al balcón'], ['f4', 'Foto · Maleta'], ['f5', 'Foto · Maleta abierta'], ['t1', 'Patrón · Geométrico'], ['t2', 'Patrón · Curvas de papel'], ['t3', 'Patrón · Pliegues'], ['t4', 'Patrón · Azulejos'], ['t5', 'Patrón · Terrazo'], ['r', 'Recepcionista (la tuya)']], C.gi, 'data-pg', function(k){ C.gi = k; LSset('replica-pl-gi', k); changed(); });
  /* «Imagen genérica» ya no se elige: curvas de papel */
  rows.nn = seg([['2', '2 noches'], ['7', '7 noches'], ['15', '15 noches']], C.nn, 'data-pn', function(k){ C.nn = k; LSset('replica-pl-nn', k); setNights(k); changed(); });
  window.__repPanel.add('Duración de la reserva (prueba)', rows.nn, 20.5);
  setTimeout(relevance, 0);
}, 50);
})();
/* email: al salir del campo, si el dominio parece mal escrito («gmial.com»), se sugiere el bueno */
document.addEventListener('focusout', function(e){ if (!e.target || e.target.id !== 'pl-email') return; var v = e.target.value, sg = (function(){ try { return window.__plSuggest ? window.__plSuggest(v) : ''; } catch (x) { return ''; } })(); if (window.__plSetSug) window.__plSetSug(sg); });
