(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var hero = document.querySelector('[data-testid="checkin-hero-strip"]');
var isKeys = SID === 'keys';
if (!hero && !isKeys) return;
var q = new URLSearchParams(location.search);
var LS = { get: function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} } };
var desk = /\.d\.html/.test(location.pathname);
var EXT = desk ? '.d.html' : '.m.html';
/* Estados de las llaves (RA):
   locked = faltan tareas · soon = tareas hechas, aún no es la hora de soltarlas · gen = el proveedor aún no ha devuelto el código
   wait = listas, funcionan desde la hora de entrada · open = en uso · moved = fechas cambiadas, llaves nuevas
   err = error del proveedor · expired = tras el check-out · revoked = reserva cancelada */
var STATES = ['locked', 'soon', 'gen', 'wait', 'open', 'moved', 'err', 'expired', 'revoked'];
var qk = q.get('keys'); if (qk === 'unlocked') qk = 'open';
var state = STATES.indexOf(qk) > -1 ? qk : (STATES.indexOf(LS.get('replica-ra-keys', '')) > -1 ? LS.get('replica-ra-keys', '') : 'locked');
/* Tipo de llave: pin = código · link = enlace de apertura · app = llave en la app del fabricante · card = tarjeta física · mix = portal con código + apartamento con enlace */
var KT = ['pin', 'link', 'app', 'card', 'mix'];
var kt = KT.indexOf(q.get('kt')) > -1 ? q.get('kt') : (KT.indexOf(LS.get('replica-ra-kt', 'pin')) > -1 ? LS.get('replica-ra-kt', 'pin') : 'pin');
/* Versión de la pantalla de llaves: V1 pase · V2 foco · V3 foto · V4 bento */
var KV = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v81', 'v9', 'v10', 'v11', 'v12'];
var kv = 'v81';   /* decisión: V8.1 · Aurora es la pantalla definitiva (el resto de versiones ya no se pueden elegir) */
/* Pestañas (móvil): T5 · Cápsula, la definitiva */
var tb = 't5', cta = 'cur';
/* Copiar el código en V8.1 sin CTA: C2 · tocar el código, la definitiva */
/* Número de puertas con llave en V8.1 (1–7): portal, apartamento y puertas extra (garaje, trastero…) */
/* Resultado de abrir una puerta con enlace: ok = se abre · fail = el backend devuelve error y la puerta no se abre */
var op = q.get('op') === 'fail' || (!q.get('op') && LS.get('replica-ra-op', 'ok') === 'fail') ? 'fail' : 'ok';
/* Escritorio con llaves listas (V8.1): D2 · Estancia, la definitiva (horas de entrada y salida y early / late bajo «Your keys») */
var dk = 'd2';
/* Early check-in / late check-out en D2: E1 · tarjeta «Need more time?», la definitiva */
/* «How to get in» en móvil (V8.1): G4 · Ruta, la definitiva */
/* Dirección: A3 · fila compacta · mensaje del anfitrión: H7 · cita con barra (las definitivas) */
/* Help (móvil): P5 · Ask Vela, la definitiva */
var nk = Math.max(1, Math.min(7, parseInt(q.get('nk') || LS.get('replica-ra-nk', '2'), 10) || 2));
/* Vista del estado Bloqueada en V8.1: V2 · Pasos, la definitiva (los pasos que faltan, sin llaves) */
var lk = 'v2';
/* Condiciones que pide el anfitrión */
var cfg = (function(){ var d = { reg: 'all', iv: 'lead', pay: '1', when: '24h' }; try { var c = JSON.parse(LS.get('replica-ra-cfg', '{}')); for (var k in d) if (c[k]) d[k] = c[k]; } catch (e) {} return d; })();
var RANK = { none: 0, lead: 1, all: 2 };
/* Avance del huésped: lo marca el estado del check-in de la réplica (?st=new|way|done) */
var ST = q.get('st'), gDone = ST === 'done', pDone = ST === 'done' || ST === 'way';
var EMAIL = 'carmen.demo@gmail.com', HOST_TEL = '+34 600 123 456', IMG = '../assets/vela/deals/';
var tab = (function(){ try { var t = sessionStorage.getItem('replica-ra-tab'); return ['keys', 'there', 'help'].indexOf(t) > -1 ? t : 'keys'; } catch (e) { return 'keys'; } })(), notified = false, onCal = false;   /* la pestaña se mantiene al cambiar un control */

var svg = function(p, s){ s = s || 22; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
var P = {
  key: '<circle cx="7.500" cy="15.500" r="4.500"/><path d="m10.700 12.300 9.800-9.800M16 7l3 3M14 9l2.500 2.500"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 7.500-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.300 3.900 1.800 18a2 2 0 0 0 1.700 3h17a2 2 0 0 0 1.700-3L13.700 3.900a2 2 0 0 0-3.400 0z"/>',
  off: '<circle cx="12" cy="12" r="9"/><path d="m5.600 5.600 12.800 12.800"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.600-6.400"/><path d="M21 3v6h-6"/>',
  door: '<path d="M13 4h4a1 1 0 0 1 1 1v15M3 20h18M13 4 6 5.500V20h7z"/><path d="M10 12h.01"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.500"/><path d="M11 18h2"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="M3 10h18M7 15h4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.600A8 8 0 1 1 21 12z"/>',
  tick: '<path d="M20 6 9 17l-5-5"/>',
  pin: '<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m3 7 9 6 9-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2.500"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>'
};
var ic = function(n, s){ return svg(P[n], s); };

/* ---------- textos de fechas y condiciones ---------- */
function releaseTxt(){ return cfg.when === '24h' ? 'on Tue 24 Nov at 15:00' : (cfg.when === 'day' ? 'on Wed 25 Nov, your check-in day' : 'as soon as you finish check-in'); }
var VALID = 'Wed 25 Nov 15:00 → Fri 27 Nov 11:00', VALID_MOVED = 'Thu 26 Nov 15:00 → Sat 28 Nov 11:00';
var HOW = {
  pin: '<b>How to enter:</b> type the code on the keypad and press <b>✓</b>. The door opens after the beep.',
  link: '<b>How to enter:</b> stand at the door and tap <b>Open door</b>. You can open it as many times as you need during your stay.',
  app: '<b>How to enter:</b> open the app and hold your phone close to the lock until it turns green.',
  card: '<b>How to enter:</b> tap your card on the reader. If you lose it, the kiosk can print a new one.',
  mix: '<b>How to enter:</b> type the code at the street door, then tap <b>Open door</b> at your apartment.'
};
function conds(){
  var out = [], ivT = cfg.iv === 'all' ? 'everyone verifies their ID' : (cfg.iv === 'lead' ? 'the lead guest verifies their ID' : '');
  var regT = cfg.reg === 'all' ? 'All guests registered' : 'Lead guest registered';
  out.push({ t: 'Guest details', s: regT + (ivT ? ' and ' + ivT : ''), ok: gDone, minors: cfg.iv === 'all' });
  if (cfg.pay === '1') out.push({ t: 'Payments', s: 'Booking, taxes and deposit paid', ok: pDone });
  return out;
}
function leftN(){ return conds().filter(function(c){ return !c.ok; }).length; }
function pend(){ return conds().filter(function(c){ return !c.ok; }); }
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function arrD(){ return state === 'moved' ? 'Thu 26 Nov' : 'Wed 25 Nov'; }
function depD(){ return state === 'moved' ? 'Sat 28 Nov' : 'Fri 27 Nov'; }
function live(){ return state === 'wait' || state === 'open' || state === 'moved'; }
function early(){ return state === 'wait'; }

/* ---------- tarjeta de la Home ---------- */
var tile = document.querySelector('.acc-tile');
var CHIP_OPEN = { pin: ['Show code', 'Show'], link: ['Open door', 'Open'], app: ['Get the app', 'App'], card: ['Pick-up info', 'Info'], mix: ['Show keys', 'Show'] };
function chip(l, s){ return '<em class="acc-chip"><span class="cl">' + l + '</span><span class="cs">' + (s || l) + '</span></em>'; }
function paintTile(){
  if (!tile) return;
  var look = { locked: 'locked', soon: 'wait', gen: 'wait', wait: 'wait', open: 'open', moved: 'open', err: 'err', expired: 'off', revoked: 'off' }[state];
  tile.setAttribute('data-v', 'b'); tile.setAttribute('data-s', look); tile.setAttribute('data-ra', state);
  tile.setAttribute('data-open', look === 'open' ? '1' : '0'); tile.removeAttribute('aria-haspopup');
  var n = leftN(), tot = conds().length, co = CHIP_OPEN[kt];
  var T = {
    locked:  ['lock', 'Unlock your keys', 'Finish check-in to unlock your keys before your arrival', chip(n + (n === 1 ? ' step left' : ' steps left'), n + ' left'), Math.round((tot - n) / tot * 100)],
    soon:    ['clock', 'Your keys are on the way', 'They appear here ' + (cfg.when === '24h' ? 'Tue 24 Nov · 15:00' : 'on Wed 25 Nov'), '', 100],
    gen:     ['refresh', 'Preparing your keys', 'This usually takes a few minutes', '', 100],
    wait:    ['clock', 'Your keys are set', 'Opens Wed 25 Nov · 15:00', '', 100],
    open:    ['unlock', 'Your keys are ready', kt === 'card' ? 'Tap to see where to pick up your card' : (kt === 'app' ? 'Tap to set up your mobile key' : 'Tap to see your keys'), chip(co[0], co[1]), 100],
    moved:   ['unlock', 'You have new keys', 'Your dates changed. Old codes no longer work', chip(co[0], co[1]), 100],
    err:     ['alert', 'Keys unavailable', 'We can’t reach the lock right now', chip('Get help', 'Help'), -1],
    expired: ['off', 'Your stay has ended', 'Your keys stopped working Fri 27 Nov · 11:00', '', -1],
    revoked: ['off', 'Keys cancelled', 'This reservation was cancelled', '', -1]
  }[state];
  var bar = T[4] < 0 || state === 'gen' ? '' : '<i class="acc-bar"><b style="width:' + T[4] + '%"></b></i>';
  tile.innerHTML = '<span class="acc-tile__row">' + ic(T[0]) + '<span class="acc-tile__t"><b>' + T[1] + '</b><span>' + T[2] + '</span></span>' + T[3] + '</span>' + bar;
}

/* =====================================================================================
   Pantalla «Virtual keys» (#1007): estructura de Pagos / Registro (cabecera, titular, pestañas, tarjetas y dock).
   Móvil: pestañas «Keys · Getting there · Help» y la puerta con enlace se abre deslizando.
   Escritorio: sin pestañas (llaves y guía juntas), la puerta se abre con botón y la ayuda vive en Vela.
   ===================================================================================== */
var C = {}, mount = null, dockEl = null, tabsEl = null, tpl = {}, selDoor = 0;
function grab(){
  var d = document.querySelector('[data-slot="cta-dock"]'), pb = d && d.querySelector('button'), old = document.querySelector('.vk-old') || document;
  var lb = old.querySelector('h2');
  C.primary = pb ? pb.className : 'button';
  C.label = lb ? lb.className : 'flex items-center font-bold uppercase text-[12px] mx-1 mb-2.5 mt-0.5';
  for (var k in C) C[k] = String(C[k]).replace(/"/g, '&quot;');   /* las clases de los botones llevan comillas (before:content-[""]) */
}
function raOn(){ return LS.get('replica-remote-access', '1') !== '0'; }
function cmpTrad(){ return LS.get('replica-comp-trad', '0') === '1' && LS.get('replica-comp-chat', '1') === '0'; }

/* estado → titular, texto, tono, chip */
var SI = {
  locked: { tone: 'warn', icon: 'lock', t: 'Finish check-in to unlock your keys', d: function(){ var n = leftN(); return n + (n === 1 ? ' step' : ' steps') + ' left. Your keys appear ' + releaseTxt() + '.'; }, chip: function(){ return leftN() + ' left'; } },
  soon: { tone: 'info', icon: 'clock', t: 'Your keys are on the way', d: function(){ return 'Check-in is done. They appear here ' + releaseTxt() + '.'; }, chip: function(){ return 'Soon'; } },
  gen: { tone: 'info', icon: 'refresh', t: 'Preparing your keys', d: function(){ return 'This usually takes a few minutes. We’ll email ' + EMAIL + ' when they’re ready.'; }, chip: function(){ return 'Preparing'; } },
  wait: { tone: 'info', icon: 'clock', t: 'Your keys are set', d: function(){ return 'They start working on ' + arrD() + ' at 15:00.'; }, chip: function(){ return 'From 15:00'; } },
  open: { tone: 'ok', icon: 'unlock', t: 'Your keys are ready', d: function(){ return 'Valid ' + VALID; }, chip: function(){ return 'Ready'; } },
  moved: { tone: 'warn', icon: 'alert', t: 'You have new keys', d: function(){ return 'Your dates changed, so the old keys no longer work. Valid ' + VALID_MOVED + '.'; }, chip: function(){ return 'New keys'; } },
  err: { tone: 'bad', icon: 'alert', t: 'We can’t load your keys', d: function(){ return 'The lock provider isn’t responding. Your host has been notified and can help you get in.'; }, chip: function(){ return 'Unavailable'; } },
  expired: { tone: 'off', icon: 'off', t: 'Your stay has ended', d: function(){ return 'Your keys stopped working on Fri 27 Nov at 11:00. Thanks for staying with us.'; }, chip: function(){ return 'Expired'; } },
  revoked: { tone: 'off', icon: 'off', t: 'Booking cancelled', d: function(){ return 'This reservation was cancelled, so its keys no longer work. If this is a mistake, contact your host.'; }, chip: function(){ return 'Cancelled'; } }
};
function si(){ var s = SI[state]; return { tone: s.tone, icon: s.icon, t: s.t, d: s.d(), chip: s.chip() }; }

/* acción principal de cada estado (la misma en las cuatro versiones) */
function primary(){
  var n = pend()[0];
  if (kv === 'v81' && (state === 'locked' || state === 'gen')) return null;   /* V8.1: cada paso ya tiene su botón · Generando: sin «Email me when ready», el aviso de email va debajo */
  if (state === 'locked') return { a: 'go', l: 'Continue check-in', step: n && n.t === 'Payments' ? 'pay' : 'reg' };
  if (state === 'soon') return { a: 'cal', l: onCal ? 'Added to your calendar' : 'Add arrival to calendar', i: onCal ? 'tick' : 'cal', done: onCal };
  if (state === 'gen') return { a: 'notify', l: notified ? 'We’ll email you' : 'Email me when ready', i: notified ? 'tick' : 'mail', done: notified };
  if (state === 'err' || state === 'revoked') return { a: 'host', l: 'Message your host', i: 'chat' };
  if (state === 'expired') return { a: 'home', l: 'Back to home' };
  return null;
}
function btn(p){ return '<button type="button" class="' + C.primary + ' vk-cta' + (p.done ? ' is-done' : '') + '" data-vk="' + p.a + '"' + (p.step ? ' data-step="' + p.step + '"' : '') + '>' + (p.i ? ic(p.i, 18) : '') + '<span>' + p.l + '</span></button>'; }
function inline(){ var p = primary(); return p ? '<div class="vk-inline">' + btn(p) + '</div>' : ''; }
function soft(a, l, i){ return '<button type="button" class="vk-soft" data-vk="' + a + '">' + (i ? ic(i, 16) : '') + '<span>' + l + '</span></button>'; }
function label(t, i){ return '<h2 class="' + C.label + '">' + (i ? ic(i, 16) : '') + t + '</h2>'; }
function pill(tone, t){ return '<span class="vk-chip" data-tone="' + tone + '">' + t + '</span>'; }

/* puertas */
function doorsData(){
  var nb = state === 'moved' ? '6150' : '4829', na = state === 'moved' ? '208374' : '731605';
  var B = { n: 'Building door', s: 'Street entrance' }, A = { n: 'Apartment door', s: 'Smart lock, 3rd floor' };
  if (kt === 'app') return [{ ty: 'app', n: 'Mobile key', s: 'Building and apartment' }];
  if (kt === 'card') return [{ ty: 'card', n: 'Key card', s: 'Building and apartment' }];
  var two = kt === 'link' ? [Object.assign({ ty: 'link' }, B), Object.assign({ ty: 'link' }, A)] : kt === 'mix' ? [Object.assign({ ty: 'pin', code: nb }, B), Object.assign({ ty: 'link' }, A)] : [Object.assign({ ty: 'pin', code: nb }, B), Object.assign({ ty: 'pin', code: na }, A)];
  if (kv !== 'v81' || nk === 2) return two;
  if (nk === 1) return [two[1]];
  var mv = state === 'moved';
  var X = [['Garage', 'Underground, level −1', mv ? '3902' : '5173', 'car'], ['Storage room', 'Basement, unit 12', mv ? '71530' : '90412', 'box'], ['Pool', 'Rooftop, 8:00–22:00', mv ? '8135' : '2468', 'pool'], ['Gym', 'Ground floor', mv ? '4407' : '7351', 'gym'], ['Bike room', 'Courtyard', mv ? '259' : '618', 'bike']];
  return two.concat(X.slice(0, nk - 2).map(function(x){ return kt === 'link' ? { ty: 'link', n: x[0], s: x[1], ic: x[3] } : { ty: 'pin', n: x[0], s: x[1], code: x[2], ic: x[3] }; }));
}
var DI = { pin: 'key', link: 'door', app: 'phone', card: 'card' };
function from(){ return 'from ' + arrD() + ', 15:00'; }
/* deslizar para abrir (móvil); en escritorio se ve el botón (el CSS muestra uno u otro) */
function slide(d){
  var dis = early(), pro = kv === 'v81', lb = dis ? 'Opens from 15:00' : (pro ? 'Slide to open' : 'Slide to open door');
  var th = pro ? '<span class="vk-th vk-th--door">' + ic('door', 22) + '</span><span class="vk-th vk-th--open">' + ic('unlock', 22) + '</span><span class="vk-th vk-th--ok">' + ic('tick', 24) + '</span><span class="vk-th vk-th--x">' + ic('alert', 22) + '</span>' : ic('door', 22);
  return '<div class="vk-slide' + (pro ? ' vk-slide--pro' : '') + '"' + (dis ? ' data-dis' : '') + '><span class="vk-slide__fill"></span><span class="vk-slide__lbl" data-l="' + lb + '">' + lb + '</span>' + (pro && !dis ? '<span class="vk-slide__chev" aria-hidden="true"><i></i><i></i><i></i></span>' : '') +
    '<button type="button" class="vk-slide__thumb" role="slider" aria-label="Slide to open ' + d.n.toLowerCase() + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"' + (dis ? ' disabled' : '') + '>' + th + '</button></div>';
}
/* códigos de distinta longitud: todas las casillas miden como las del código más largo y se alinean a la izquierda */
function mixD81(ds){
  var ls = ds.filter(function(d){ return d.ty === 'pin'; }).map(function(d){ return d.code.length; }), mx = Math.max.apply(null, ls.concat(0));
  return ls.some(function(l){ return l !== mx; }) ? ' data-mixd style="--dg:' + mx + '"' : '';
}
function pin81(d){
  var dig = d.code.split('').map(function(c){ return '<i>' + c + '</i>'; }).join('');
  return '<div class="vk-pin vk-cp" data-cp="c2" data-show="1" data-code="' + d.code + '"><button type="button" class="vk-digits vk-cp__tap" data-vk="copy" aria-label="Copy code ' + d.code + '">' + dig + '</button></div>';
}
function act(d){
  if (d.ty === 'pin' && kv === 'v81') return pin81(d);
  if (d.ty === 'pin') return '<div class="vk-pin" data-show="1" data-code="' + d.code + '"><div class="vk-digits">' + d.code.split('').map(function(c){ return '<i>' + c + '</i>'; }).join('') + '</div>' +
    '<div class="vk-btns"><button type="button" class="pri" data-vk="copy">' + ic('copy', 16) + '<span>Copy</span></button></div></div>';
  if (d.ty === 'link') return '<div class="vk-linkbox" data-door="idle">' + slide(d) + '<button type="button" class="vk-open" data-vk="open"' + (early() ? ' disabled' : '') + '><span data-l="' + (kv === 'v81' && lb81 === 'row' ? 'Open' : 'Open door') + '">' + (early() ? (kv === 'v81' && lb81 === 'row' ? 'From 15:00' : 'Opens from 15:00') : (kv === 'v81' && lb81 === 'row' ? 'Open' : 'Open door')) + '</span></button>' +
    '<p class="vk-hint"><span class="vk-hint__m">Keep your phone online. The door unlocks for a few seconds.</span><span class="vk-hint__d">Open it from your phone when you’re at the door.</span></p></div>';
  if (d.ty === 'app') return '<ol class="vk-list"><li><b>Download the lock app</b><span>dormakaba BlueSky Access</span><span class="vk-stores"><a role="button" tabindex="0">App Store</a><a role="button" tabindex="0">Google Play</a></span></li>' +
    '<li><b>Sign in with your phone number</b><span>Use +34 6•• ••• 412, the one you registered with.</span></li><li><b>Hold your phone near the lock</b><span>Your key works ' + from() + '.</span></li></ol>';
  return '<div class="vk-ref"><span>Booking code</span><b>CHK-4829</b></div><ol class="vk-list"><li><b>Go to the kiosk by the entrance</b><span>Ground floor, left of the lifts.</span></li>' +
    '<li><b>Type your booking code</b><span>The kiosk prints one card per guest.</span></li><li><b>Tap the card on the reader</b><span>It works ' + from() + '.</span></li></ol>';
}
function ov(){
  return { locked: ['lock', 'Locked until check-in is done'], soon: ['clock', 'Appears ' + (cfg.when === '24h' ? 'Tue 24 Nov · 15:00' : 'Wed 25 Nov')], gen: ['refresh', 'Preparing your key…'], err: ['alert', 'Can’t reach the lock right now'], expired: ['off', 'No longer valid'], revoked: ['off', 'Cancelled'] }[state];
}
function ph(d){
  var o = ov();
  return '<div class="vk-ph" data-s="' + state + '">' + (d.ty === 'pin' ? '<div class="vk-ph__d"><i></i><i></i><i></i><i></i></div>' : '<div class="vk-ph__b"></div><div class="vk-ph__b vk-ph__b--s"></div>') + '<div class="vk-ph__o">' + ic(o[0], 20) + '<span>' + o[1] + '</span></div></div>';
}
function keyBody(d){ return live() ? act(d) : ph(d); }

/* bloques comunes */
function strip(){ var s = si(); return '<div class="vk-strip" data-tone="' + s.tone + '"><span class="vk-strip__i">' + ic(s.icon, 18) + '</span><div><b>' + s.t + '</b><span>' + s.d + '</span></div></div>'; }
function movedNote(){ return state === 'moved' ? '<div class="vk-moved">' + ic('alert', 18) + '<span><b>Your dates changed.</b> These are new keys. The old ones no longer work.</span></div>' : ''; }
function miniBtn(c){ return '<button type="button" class="vk-mini" data-vk="go" data-step="' + (c.t === 'Payments' ? 'pay' : 'reg') + '">' + (c.t === 'Payments' ? 'Pay 12.00€' : 'Start') + '</button>'; }
function todo(){
  var cs = conds(), items = cs.map(function(c){ return '<li data-ok="' + (c.ok ? 1 : 0) + '"><i>' + (c.ok ? ic('tick', 14) : ic('clock', 14)) + '</i><span><b>' + c.t + '</b><em>' + c.s + '</em></span>' + (c.ok ? pill('ok', 'Done') : miniBtn(c)) + '</li>'; }).join('');
  items += '<li data-ok="2"><i>' + ic('key', 14) + '</i><span><b>Your keys appear here</b><em>' + cap(releaseTxt()) + '</em></span></li>';
  var minors = cs.some(function(c){ return c.minors; }) ? '<p class="vk-foot">Children don’t need to verify their ID.</p>' : '';
  return '<div class="vk-todo"><h3>To unlock your keys</h3><ol>' + items + '</ol>' + minors + '</div>';
}
function mailBlock(){ return '<div class="vk-note" data-tone="info">' + ic('mail', 18) + '<span>' + (state === 'gen' ? 'We’ll email <b>' + EMAIL + '</b> as soon as your keys are ready.' : 'We’ll also email your keys to <b>' + EMAIL + '</b>.') + '</span></div>'; }
function hostBlock(){ return '<div class="vk-note vk-note--host" data-tone="bad">' + ic('help', 18) + '<span><b>From your host:</b> if you arrive and still can’t see your keys, call ' + HOST_TEL + '. A spare key is held at the café next door.</span>' + soft('host', 'Message your host', 'chat') + '</div>'; }
function howBlock(){ return '<div class="vk-note" data-tone="info">' + ic('door', 18) + '<span>' + (desk ? HOW[kt] : HOW[kt].replace('stand at the door and tap <b>Open door</b>', 'stand at the door and slide the button to the end').replace('then tap <b>Open door</b>', 'then slide to open the door')) + ((kt === 'pin' || kt === 'mix') ? ' Codes are personal, so please don’t share them.' : '') + '</span></div>'; }
function below(){
  if (state === 'locked') return todo();
  if (kv === 'v81' && !live()) return '';   /* en V8.1, sin los avisos de email y del anfitrión debajo del panel */
  if (state === 'soon' || state === 'gen') return mailBlock();
  if (state === 'err') return hostBlock();
  if (live()) return kv === 'v81' ? '' : howBlock();   /* en V8.1, «How to enter» va en Help */
  return '';
}
function modeOf(){ return live() ? 'live' : ({ locked: 'dim', soon: 'dim', gen: 'gen', err: 'err', expired: 'off', revoked: 'off' })[state]; }
function stampOf(){ return state === 'expired' ? 'Expired' : (state === 'revoked' ? 'Cancelled' : ''); }

/* ---------- V1 · Pase: un pase por puerta, como en una cartera digital ---------- */
function k1(){
  var ds = doorsData(), n = ds.length, mode = modeOf(), st = stampOf();
  var ps = ds.map(function(d, i){
    return '<article class="vk-pass" data-ps="' + mode + '" data-ty="' + d.ty + '"><div class="vk-pass__top"><span>' + ic('key', 16) + 'Villa Calipso</span><em>' + (n > 1 ? (i + 1) + ' of ' + n : 'Key') + '</em></div>' +
      (state === 'moved' ? '<span class="vk-pass__new">New key</span>' : '') +
      '<div class="vk-pass__name"><small>' + d.s + '</small><b>' + d.n + '</b></div><div class="vk-pass__body">' + keyBody(d) + (st ? '<span class="vk-stamp">' + st + '</span>' : '') + '</div>' +
      '<div class="vk-pass__foot"><span><small>From</small><b>' + arrD() + ' · 15:00</b></span><span><small>Until</small><b>' + depD() + ' · 11:00</b></span></div></article>';
  }).join('');
  return movedNote() + strip() + '<div class="vk-passes" data-n="' + n + '">' + ps + '</div>' + below() + inline();
}

/* ---------- V2 · Foco: un orbe de estado y una puerta cada vez (en escritorio, todas) ---------- */
function k2(){
  var s = si(), ds = doorsData(); if (selDoor >= ds.length) selDoor = 0;
  var hero = '<div class="vk-orbw" data-tone="' + s.tone + '" data-s="' + state + '"><div class="vk-orb"><span>' + ic(s.icon, 36) + '</span></div><h3>' + s.t + '</h3><p>' + s.d + '</p></div>';
  var seg = ds.length > 1 ? '<div class="vk-seg" role="tablist" aria-label="Doors">' + ds.map(function(d, i){ return '<button type="button" role="tab" aria-selected="' + (i === selDoor) + '" class="' + (i === selDoor ? 'on' : '') + '" data-vk="door" data-i="' + i + '">' + ic(DI[d.ty], 16) + '<span>' + d.n.replace(' door', '') + '</span></button>'; }).join('') + '</div>' : '';
  var foci = ds.map(function(d, i){ return '<div class="vk-focus' + (i === selDoor ? ' is-sel' : '') + '" data-i="' + i + '" data-ty="' + d.ty + '"><div class="vk-focus__h"><b>' + d.n + '</b><span>' + d.s + '</span></div>' + keyBody(d) + '</div>'; }).join('');
  return movedNote() + hero + seg + '<div class="vk-foci" data-n="' + ds.length + '">' + foci + '</div>' + below() + inline();
}

/* ---------- V3 · Foto: la entrada del edificio de fondo y las llaves flotando encima ---------- */
function k3(){
  var s = si(), ds = doorsData();
  var hero = '<div class="vk-hero3" data-tone="' + s.tone + '" data-s="' + state + '"><img src="' + IMG + 'gb-street.jpg" alt=""><div class="vk-hero3__o"><span class="vk-hero3__c">' + ic(s.icon, 14) + s.chip + '</span><h3>' + s.t + '</h3><p>' + (live() ? 'Valid ' + (state === 'moved' ? VALID_MOVED : VALID) : s.d) + '</p></div></div>';
  var cards = ds.map(function(d){ return '<div class="vk-c3" data-ty="' + d.ty + '"><div class="vk-c3__h"><span class="vk-c3__i">' + ic(DI[d.ty], 20) + '</span><div><b>' + d.n + '</b><span>' + d.s + '</span></div></div>' + keyBody(d) + '</div>'; }).join('');
  return movedNote() + hero + '<div class="vk-cards3" data-n="' + ds.length + '">' + cards + '</div>' + below() + inline();
}

/* ---------- V4 · Bento: mosaico de teselas con color ---------- */
function k4(){
  var s = si(), ds = doorsData(), t = '';
  t += '<div class="vk-t vk-t--w vk-t--hero" data-tone="' + s.tone + '" data-s="' + state + '"><span class="vk-t__i">' + ic(s.icon, 22) + '</span><div><b>' + s.t + '</b><span>' + s.d + '</span></div>' + pill(s.tone, s.chip) + '</div>';
  t += ds.map(function(d){ return '<div class="vk-t vk-t--d" data-ty="' + d.ty + '"><div class="vk-t__h"><span class="vk-t__i vk-t__i--s">' + ic(DI[d.ty], 18) + '</span><div><b>' + d.n + '</b><span>' + d.s + '</span></div></div>' + keyBody(d) + '</div>'; }).join('');
  t += '<div class="vk-t vk-t--s" data-k="when"><small>' + ic('clock', 14) + 'Valid from</small><b>' + arrD() + '</b><span>15:00</span></div>';
  t += '<div class="vk-t vk-t--s" data-k="until"><small>' + ic('clock', 14) + 'Until</small><b>' + depD() + '</b><span>11:00</span></div>';
  t += '<button type="button" class="vk-t vk-t--s vk-t--act" data-vk="host" data-k="host"><small>' + ic('phone', 14) + 'Need help?</small><b>Call your host</b><span>' + HOST_TEL + '</span></button>';
  t += '<button type="button" class="vk-t vk-t--s vk-t--act" data-vk="maps" data-k="maps"><small>' + ic('pin', 14) + 'Address</small><b>Calle Mayor 12</b><span>Open in Maps</span></button>';
  var b = below(); if (b) t += '<div class="vk-t vk-t--w vk-t--plain">' + b + '</div>';
  return movedNote() + '<div class="vk-bento">' + t + '</div>' + inline();
}

/* ---------- «Getting there»: dirección y tres pasos con foto ---------- */
var GUIDE = [['gb-street.jpg', 'Find the green door', 'Calle Mayor 12, between the bakery and the pharmacy.'], ['gb-hall.jpg', 'Take the lift to the 3rd floor', 'Walk through the hall. The lift is at the end, on the right.'], ['gb-door.jpg', 'Apartment 3B', 'Second door on the left.']];
var HINT = { pin: ['Type the building code on the keypad and press ✓.', 'Type the apartment code on the smart lock.'], link: ['Tap “Open door” for the building door.', 'Tap “Open door” for the apartment door.'], app: ['Hold your phone near the reader by the door.', 'Hold your phone near the lock until it turns green.'], card: ['Pick up your card at the kiosk inside the entrance.', 'Tap your card on the reader.'], mix: ['Type the building code on the keypad and press ✓.', 'Tap “Open door” for the apartment door.'] };
function stepTxt(i){ var h = HINT[kt]; return GUIDE[i][2] + ' ' + (i === 0 ? h[0] : (i === 2 ? h[1] : '')); }
function addr(cls){ return '<div class="vk-addr ' + (cls || '') + '"><span class="vk-addr__i">' + ic('pin', 20) + '</span><div><b>Calle Mayor 12, 3º B</b><span>02001 Albacete, Spain</span></div><button type="button" class="vk-soft" data-vk="maps"><span>Open in Maps</span></button></div>'; }
function hostNote(){ return '<div class="vk-note" data-tone="info">' + ic('help', 18) + '<span><b>From your host:</b> please close the street door behind you. There’s a public car park 2 minutes away, in Plaza del Altozano. Questions? Call ' + HOST_TEL + '.</span></div>'; }
function t1(){
  return addr() + '<ol class="vk-steps">' + [0, 1, 2].map(function(i){ return '<li><img src="' + IMG + GUIDE[i][0] + '" alt="" loading="lazy"><div><small>Step ' + (i + 1) + '</small><b>' + GUIDE[i][1] + '</b><span>' + stepTxt(i) + '</span></div></li>'; }).join('') + '</ol>' + hostNote();
}
function t3(){
  return addr() + '<div class="vk-big">' + [0, 1, 2].map(function(i){ return '<figure><img src="' + IMG + GUIDE[i][0] + '" alt="" loading="lazy"><span class="vk-big__n">' + (i + 1) + '</span><figcaption><b>' + GUIDE[i][1] + '</b><span>' + stepTxt(i) + '</span></figcaption></figure>'; }).join('') + '</div>' + hostNote();
}
function t4(){
  return '<div class="vk-bento vk-bento--g">' + '<div class="vk-t vk-t--w vk-t--addr">' + addr('vk-addr--in') + '</div>' + [0, 1, 2].map(function(i){ return '<div class="vk-t vk-t--g' + (i === 0 ? ' vk-t--w' : '') + '"><img src="' + IMG + GUIDE[i][0] + '" alt="" loading="lazy"><div class="vk-t__g"><small>Step ' + (i + 1) + '</small><b>' + GUIDE[i][1] + '</b><span>' + stepTxt(i) + '</span></div></div>'; }).join('') + '<div class="vk-t vk-t--w vk-t--plain">' + hostNote() + '</div></div>';
}

/* ---------- V8.1 · «How to get in» (móvil): cuatro versiones; en escritorio, la de fotos grandes ---------- */
function there81(){
  /* G4 · ruta: en cada puerta, su llave de verdad (el código, que se copia al tocarlo, o «Open» si es de enlace); las fotos se amplían al tocarlas */
  /* la ruta siempre lleva las dos puertas: portal en el paso 1 y apartamento en el paso 3 (aunque en Keys se muestre otro número de puertas) */
  var nk0 = nk; nk = 2; var ds = doorsData(); nk = nk0; var lv = live();
  var keyRow = function(d){
    if (!d) return '';
    var r = !lv ? '<em class="vk-mc vk-mc--g" data-s="' + state + '">' + ({ locked: 'Locked', soon: 'Soon', gen: 'Generating\u2026', err: 'Unavailable', expired: 'Expired', revoked: 'Cancelled' }[state] || '') + '</em>'
      : d.ty === 'pin' ? '<button type="button" class="vk-rt4__c" data-vk="copy" data-code="' + d.code + '" aria-label="Copy code ' + d.code + '"><span data-l="' + d.code + '">' + d.code + '</span></button>'
      : d.ty === 'link' ? '<button type="button" class="vk-mc vk-mc--o" data-vk="mopen"' + (early() ? ' disabled' : '') + '><span>' + (early() ? 'From 15:00' : 'Open') + '</span></button>'
      : '<button type="button" class="vk-mc vk-mc--o" data-vk="tab" data-tab="keys"><span>See key</span></button>';
    return '<div class="vk-rt4__k">' + ic(d.ic || DI[d.ty] || 'key', 15) + '<span>' + d.n + '</span>' + r + '</div>';
  };
  /* contenido configurable desde el cuadro: dirección, pasos, mensaje del anfitrión, nº de pasos (1–5) y fotos */
  var on = function(k){ return LS.get(k, '1') !== '0'; }, n = Math.max(1, Math.min(5, parseInt(LS.get('replica-ra-hs', '3'), 10) || 3)), pics = on('replica-ra-hp');
  var P5 = {
    green: { img: GUIDE[0][0], t: GUIDE[0][1], d: GUIDE[0][2], k: keyRow(ds[0]) },
    yard: { img: 'gb-alley.jpg', t: 'Cross the courtyard', d: 'Go straight through the courtyard to the glass door at the back.' },
    lift: { img: GUIDE[1][0], t: GUIDE[1][1], d: GUIDE[1][2] },
    flat: { img: GUIDE[2][0], t: GUIDE[2][1], d: GUIDE[2][2], k: keyRow(ds[1]) },
    one: { img: GUIDE[2][0], t: 'Apartment 3B', d: 'Calle Mayor 12, 3rd floor. Open the street door first, then the apartment door.', k: keyRow(ds[0]) + keyRow(ds[1]) },
    lights: { img: 'gb-living.jpg', t: 'Switch on the lights', d: 'The switch is on the right of the door. The spare key box is in the kitchen drawer.' }
  };
  var steps = ({ 1: ['one'], 2: ['green', 'flat'], 3: ['green', 'lift', 'flat'], 4: ['green', 'yard', 'lift', 'flat'], 5: ['green', 'yard', 'lift', 'flat', 'lights'] })[n].map(function(k){ return P5[k]; });
  steps.push({ t: 'You’re in', d: 'Close the door behind you. Wi‑Fi and house rules are in the guidebook.', end: 1 });
  if (!pics) steps.forEach(function(st){ st.img = ''; });
  var place = on('replica-ra-ha') ? place81() : '';
  var host = on('replica-ra-hm') ? host81() : '';
  if (!on('replica-ra-hr')) return place + host;
  return place + '<ol class="vk-rt4">' + steps.map(function(st, i){ return '<li' + (st.end ? ' class="is-end"' : '') + '><span class="vk-rt4__n">' + (st.end ? ic('home', 14) : i + 1) + '</span><div class="vk-rt4__b"><b>' + st.t + '</b><span>' + st.d + '</span>' + (st.k || '') + (st.img ? '<button type="button" class="vk-rt4__ph" data-vk="zoom" data-src="' + IMG + st.img + '" aria-label="Enlarge photo"><img src="' + IMG + st.img + '" alt="" loading="lazy"></button>' : '') + '</div></li>'; }).join('') + '</ol>' + host;
}
function host81(){
  var msg = 'Please close the street door behind you. There’s a public car park 2 minutes away, in Plaza del Altozano.';
  return '<figure class="vk-host7"><blockquote>' + msg + '</blockquote><figcaption><span class="vk-host7__logo" role="img" aria-label="Villa Calypso"><svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><defs><linearGradient id="vcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fd0ea"/><stop offset="1" stop-color="#3556c4"/></linearGradient></defs><path d="M6 33V17a14 14 0 0 1 28 0v16" fill="none" stroke="url(#vcg)" stroke-width="1.6" stroke-linecap="round"/><path d="M15.500 29c.600-5 .300-9-1.500-13" fill="none" stroke="url(#vcg)" stroke-width="1.800" stroke-linecap="round"/><path d="M14 16c-3-2-6-1.500-7.500.500 2.500-.500 5 0 7.500-.500zM14 16c1-3 4-4.500 6.500-4-2 .800-4.500 2.500-6.500 4zM14 16c-1.500-2.500-1-5.500 1-7-.500 2.500-.500 4.500-1 7zM14 16c3-.500 6 .500 7.500 3-2.500-1.500-5-2-7.500-3z" fill="url(#vcg)"/><path d="M24 29.500c.300-3.500 0-6-1.300-8.500" fill="none" stroke="url(#vcg)" stroke-width="1.500" stroke-linecap="round"/><path d="M22.700 21c-2.200-1.200-4.300-.700-5.300.700 1.800-.300 3.500.100 5.300-.700zM22.700 21c.800-2.200 3-3.200 4.800-2.800-1.500.600-3.300 1.700-4.800 2.800zM22.700 21c2.200-.200 4.300.600 5.300 2.300-1.800-1.100-3.600-1.500-5.300-2.300z" fill="url(#vcg)"/><path d="M4 31c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0M4 35c2-1.500 4-1.500 6 0s4 1.500 6 0 4-1.500 6 0 4 1.500 6 0 4-1.500 6 0" fill="none" stroke="url(#vcg)" stroke-width="1.600" stroke-linecap="round"/></svg></span><span><b>Villa Calypso</b>Your host</span><button type="button" data-vk="host">' + ic('phone', 14) + '<span>Call ' + HOST_TEL + '</span></button></figcaption></figure>';
}
function place81(){
  return '<div class="vk-place3"><span class="vk-place3__i">' + ic('pin', 18) + '</span><div><b>Calle Mayor 12, 3º B</b><span>02001 Albacete</span></div><button type="button" class="vk-place3__c" data-vk="copyaddr" aria-label="Copy address"><span class="vk-cp__a">' + ic('copy', 16) + '</span><span class="vk-cp__ok">' + ic('tick', 16) + '</span></button><button type="button" class="vk-place3__m" data-vk="maps">Maps</button></div>';
}
/* foto a pantalla completa (toca o Esc para cerrar) */
function zoomPhoto(src){
  var o = document.createElement('div'); o.className = 'vk-lb'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Photo');
  o.innerHTML = '<div class="vk-lb__m"><img src="' + src + '" alt=""><button type="button" class="vk-lb__x" aria-label="Close">\u00d7</button></div>';
  var close = function(){ o.classList.add('is-out'); document.removeEventListener('keydown', esc); setTimeout(function(){ if (o.parentNode) o.parentNode.removeChild(o); }, 200); };
  var esc = function(e){ if (e.key === 'Escape') close(); };
  /* en escritorio es un modal: se cierra con la ×, con Esc o tocando fuera (no sobre la foto) */
  o.addEventListener('click', function(e){ if (desk && e.target.tagName === 'IMG') return; close(); }); document.addEventListener('keydown', esc); document.body.appendChild(o);
}
/* ---------- Ayuda: preguntas frecuentes (pestaña «Help» en móvil; en escritorio van en Vela) ---------- */
function qa(){
  var q = [], host = 'Call your host on ' + HOST_TEL + '.';
  if (state === 'locked') { q.push({ p: 100, t: 'How do I get my keys?', a: 'Finish check-in: ' + conds().map(function(c){ return c.s.toLowerCase(); }).join(' and ') + '. Your keys then appear ' + releaseTxt() + '.' }); q.push({ p: 75, t: 'When will my keys appear?', a: 'Once check-in is done, ' + releaseTxt() + '.' }); }
  if (state === 'soon') q.push({ p: 100, t: 'Why can’t I see my keys yet?', a: 'Check-in is done. Your host releases keys ' + releaseTxt() + ', and we’ll also email them to you.' });
  if (state === 'gen') q.push({ p: 100, t: 'How long will it take?', a: 'Usually a few minutes. We’ll email ' + EMAIL + ' as soon as your keys are ready.' });
  if (state === 'err') q.push({ p: 100, t: 'I can’t see my keys. What now?', a: 'The lock provider isn’t responding and your host has been notified. ' + host + ' A spare key is held at the café next door.' });
  if (state === 'moved') q.push({ p: 100, t: 'Why do I have new keys?', a: 'Your dates changed, so we created new keys. The old ones no longer work.' });
  if (state === 'expired') q.push({ p: 100, t: 'Can I still get in?', a: 'Your stay ended on Fri 27 Nov at 11:00 and the keys stopped working. ' + host });
  if (state === 'revoked') q.push({ p: 100, t: 'Why were my keys cancelled?', a: 'The reservation was cancelled, so its keys were disabled. If this is a mistake, ' + host.charAt(0).toLowerCase() + host.slice(1) });
  var on = live() || state === 'soon' || state === 'gen';
  if (on && (kt === 'pin' || kt === 'mix')) q.push({ p: live() ? 95 : 55, t: 'My code doesn’t work', a: 'Check you’re using the right door’s code and press ✓. If it still fails, ' + host.charAt(0).toLowerCase() + host.slice(1) });
  if (on && (kt === 'link' || kt === 'mix')) q.push({ p: live() ? 92 : 52, t: 'How do I open the door?', a: (desk ? 'Tap “Open door” when you’re at the door.' : 'Slide the button to the end when you’re at the door.') + ' Keep your phone online. The door unlocks for a few seconds.' });
  if (on && kt === 'app') q.push({ p: live() ? 94 : 54, t: 'How does the mobile key work?', a: 'Install the dormakaba app, sign in with the phone number you registered and hold your phone near the lock until it turns green.' });
  if (on && kt === 'card') q.push({ p: live() ? 94 : 54, t: 'Where do I get my card?', a: 'At the kiosk by the entrance. Type your booking code and it prints one card per guest.' });
  q.push({ p: 60, t: 'When do my keys work?', a: 'From ' + arrD() + ' at 15:00 until ' + depD() + ' at 11:00.' });
  q.push({ p: 50, t: 'Who do I call if I get stuck?', a: host + ' A spare key is held at the café next door.' });
  if (kt === 'pin' || kt === 'mix') q.push({ p: 40, t: 'Can I share my code?', a: 'Codes are personal, so please don’t share them. Everyone staying gets their own keys.' });
  return q.sort(function(a, b){ return b.p - a.p; });
}
function faqHtml(list){ return '<div class="vk-faq">' + list.map(function(o){ return '<details class="vk-q"><summary><span>' + o.t + '</span>' + ic('down', 16) + '</summary><p>' + o.a + '</p></details>'; }).join('') + '</div>'; }
function topic(t){ return /code|open|mobile key|card|share/i.test(t) ? 'keys' : (/when|time/i.test(t) ? 'times' : (/stuck|call|can.t|cancel|still get in|what now/i.test(t) ? 'trouble' : 'getting')); }
function avMsg(o){
  return '<div class="vk-av__q">' + o.t + '</div><div class="vk-av__a"><p>' + o.a + '</p></div>';   /* sin avatar, como en Vela */
}
function help81(){
  /* chat como el de Vela: burbujas tipo mensajería y las preguntas en filas, con un icono de enviar */
  var list = qa();
  return '<div class="vk-av"><div class="vk-av__chat" aria-live="polite">' + avMsg(list[0]) + '</div><h5>Suggested</h5><div class="vk-av__qs">' + list.slice(0, 6).map(function(o, i){ return '<button type="button" class="vk-av__row' + (i === 0 ? ' on' : '') + '" data-av="' + i + '"><span>' + o.t + '</span><i>' + ic('send', 15) + '</i></button>'; }).join('') + '</div></div>';
}
function helpP(){
  if (kv === 'v81' && !desk) return help81();
  return (kv === 'v81' ? howBlock() : '') + hostBlock().replace(' vk-note--host', ' vk-note--host') + '<div class="vk-faq">' + qa().map(function(o){ return '<details class="vk-q"><summary><span>' + o.t + '</span>' + ic('down', 16) + '</summary><p>' + o.a + '</p></details>'; }).join('') + '</div>';
}

/* ---------- Vela (solo escritorio): la ayuda de las llaves con la estructura de Vela del resto de la app ---------- */
function velaPanel(){
  var as = document.querySelector('aside[data-slot="assistant-panel"]'); if (!as) return;
  var gtk = [].slice.call(as.querySelectorAll(':scope > section')).filter(function(x){ return !x.hasAttribute('data-vk-vela'); })[0]; if (!gtk) return;
  [].forEach.call(as.querySelectorAll(':scope > section[data-vk-vela]'), function(x){ x.parentNode.removeChild(x); });
  gtk.style.display = 'none';
  var lab = gtk.children[0], intro = as.querySelector(':scope > p'), trad = cmpTrad();
  if (intro) intro.textContent = trad ? 'Quick answers about getting into Villa Calipso.' : 'Ask me anything about getting in. I’ve picked the questions that fit your keys.';
  var sec = function(title){ var n = gtk.cloneNode(false); n.removeAttribute('style'); n.setAttribute('data-vk-vela', '1'); var l = lab.cloneNode(true); l.textContent = title; n.appendChild(l); return n; };
  var spark = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/></svg>';
  var parts = [], p = primary(), s = si();
  /* tarjeta azul con la acción de ahora, como «Your past payments» en Pagos */
  var cardTitle = { locked: 'Your check-in', soon: 'Your arrival', gen: 'Your keys', err: 'Need a hand now?', expired: 'Your stay', revoked: 'Your booking' }[state] || 'Your keys';
  var cardTxt = state === 'locked' ? leftN() + (leftN() === 1 ? ' step' : ' steps') + ' left before your keys appear.' : (live() ? 'Valid until ' + depD() + ' at 11:00. Need a hand at the door?' : s.t + '.');
  var cb = p ? '<button type="button" class="pv7-vp" data-vk="' + p.a + '"' + (p.step ? ' data-step="' + p.step + '"' : '') + '>' + p.l + '</button>' : '<button type="button" class="pv7-vp" data-vk="host">Message your host</button>';
  var c1;
  if (live()) {   /* llaves listas: en lugar de «Your keys», la sección de Summary, para compartir las llaves */
    c1 = sec('Quick actions'); c1.insertAdjacentHTML('beforeend', '<div class="vk-inv"><strong>Share the keys</strong><span>Send this link to your group so everyone can open the doors from their own phone.</span><div><button type="button" class="vk-inv__p pri" data-inv="copy">Copy link</button><button type="button" class="vk-inv__p" data-inv="share">Share</button></div></div>');
    c1.addEventListener('click', function(e){
      var b = e.target.closest('[data-inv]'); if (!b) return; e.preventDefault(); e.stopPropagation();
      var url = location.origin + '/k/CHK-4829', say = function(t){ var o = b.getAttribute('data-l') || b.textContent; b.setAttribute('data-l', o); b.textContent = t; clearTimeout(b._t); b._t = setTimeout(function(){ b.textContent = o; }, 1400); };
      if (b.getAttribute('data-inv') === 'share' && navigator.share) { navigator.share({ title: 'Your keys · Villa Calypso', url: url }).catch(function(){}); return; }
      try { navigator.clipboard.writeText(url); } catch (_) {} say('Copied');
    });
  } else { c1 = sec(cardTitle); c1.insertAdjacentHTML('beforeend', '<div class="pv7-vc"><strong>' + s.t + '</strong><span>' + cardTxt + '</span><div>' + cb + '</div></div>'); }
  parts.push(c1);
  var q = qa().slice(0, 5);
  if (!trad) {
    var chat = function(o){ return '<div class="vc-q">' + o.t + '</div><div class="vc-a"><span class="vc-av">' + spark + '</span><div>' + o.a + '</div></div>'; };
    var c2 = sec('Ask Vela');
    c2.insertAdjacentHTML('beforeend', '<div class="vx-body"><div class="vc"><div class="vc-chat" aria-live="polite">' + chat(q[0]) + '</div><span class="vc-lb">Suggested</span><div class="vc-chips">' + q.map(function(o, i){ return '<button type="button" class="vc-chip' + (i === 0 ? ' on' : '') + '" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div></div></div>');
    c2.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var i = +b.getAttribute('data-ask'); c2.querySelector('.vc-chat').innerHTML = chat(q[i]); [].forEach.call(c2.querySelectorAll('.vc-chip'), function(x){ x.classList.toggle('on', +x.getAttribute('data-ask') === i); }); });
    parts.push(c2);
  } else {
    var c3 = sec('Good to know');
    c3.insertAdjacentHTML('beforeend', '<div class="vx-body"><div class="vq-list">' + q.map(function(o){ return '<div class="vq"><button type="button" class="vq-b" aria-expanded="false"><span>' + o.t + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="vq-a" hidden>' + o.a + '</div></div>'; }).join('') + '</div></div>');
    c3.addEventListener('click', function(e){ var qb = e.target.closest('.vq-b'); if (!qb) return; e.preventDefault(); e.stopPropagation(); var it = qb.parentNode, open = !it.classList.contains('open'); [].forEach.call(c3.querySelectorAll('.vq'), function(x){ x.classList.remove('open'); x.querySelector('.vq-a').hidden = true; x.querySelector('.vq-b').setAttribute('aria-expanded', 'false'); }); if (open) { it.classList.add('open'); it.querySelector('.vq-a').hidden = false; qb.setAttribute('aria-expanded', 'true'); } });
    parts.push(c3);
  }
  parts.forEach(function(n){ as.insertBefore(n, gtk); });
}

/* =====================================================================================
   V5 · Puerta · V6 · Cartera · V7 · Camino · V8 · Aurora (#1008): versiones creativas, con animaciones
   ===================================================================================== */
P.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>';
P.moon = '<path d="M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/>';
P.send = '<path d="M21 3 10 14"/><path d="M21 3 14.500 21l-4.500-7-7-4.500z"/>';
P.down = '<path d="m6 9 6 6 6-6"/>';
P.car = '<path d="M5 17h14M6 17v2M18 17v2"/><path d="M4 17v-4l2-5h12l2 5v4z"/><path d="M7.500 13.500h.01M16.500 13.500h.01"/>';
P.box = '<path d="M3 7.500 12 3l9 4.500v9L12 21l-9-4.500z"/><path d="m3 7.500 9 4.500 9-4.500M12 12v9"/>';
P.pool = '<path d="M3 17c1.500 1 3 1 4.500 0s3-1 4.500 0 3 1 4.500 0 3-1 4.500 0M3 21c1.500 1 3 1 4.500 0s3-1 4.500 0 3 1 4.500 0 3-1 4.500 0"/><path d="M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0M8 9h8"/>';
P.gym = '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>';
P.bike = '<circle cx="6" cy="16" r="3.500"/><circle cx="18" cy="16" r="3.500"/><path d="m6 16 4-7h5l3 7M10 9 8.500 6H7M15 9l-3 7"/>';
P.lift = '<rect x="5" y="3" width="14" height="18" rx="2.500"/><path d="M12 3v18"/><path d="m8.500 9 1.500-2 1.500 2M12.500 15l1.500 2 1.500-2"/>';
P.home = '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>';
var cdTimer = null, rtSel = 0, CDS = { soon: 23 * 3600 + 41 * 60 + 8, wait: 3 * 3600 + 12 * 60 + 45 };
function segHtml(ds){
  return ds.length > 1 ? '<div class="vk-seg" role="tablist" aria-label="Doors">' + ds.map(function(d, i){ return '<button type="button" role="tab" aria-selected="' + (i === selDoor) + '" class="' + (i === selDoor ? 'on' : '') + '" data-vk="door" data-i="' + i + '">' + ic(DI[d.ty], 16) + '<span>' + d.n.replace(' door', '') + '</span></button>'; }).join('') + '</div>' : '';
}
function fociHtml(ds){
  return '<div class="vk-foci" data-n="' + ds.length + '">' + ds.map(function(d, i){ return '<div class="vk-focus' + (i === selDoor ? ' is-sel' : '') + '" data-i="' + i + '" data-ty="' + d.ty + '"><div class="vk-focus__h"><b>' + d.n + '</b><span>' + d.s + '</span></div>' + keyBody(d) + '</div>'; }).join('') + '</div>';
}
/* confeti al abrir una puerta */
function burst(host){
  return;   /* sin confeti al abrir una puerta */
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var r = host.getBoundingClientRect(), o = document.createElement('div'), cols = ['#385bf8', '#6d8bff', '#16a06a', '#ffc233', '#ff6b9a', '#ffffff'];
  o.className = 'vk-burst'; o.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px';
  for (var i = 0; i < 24; i++) { var p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 110; p.style.cssText = '--dx:' + Math.cos(a) * d + 'px;--dy:' + (Math.sin(a) * d - 50) + 'px;--r:' + (Math.random() * 600 - 300) + 'deg;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * .08) + 's'; o.appendChild(p); }
  document.body.appendChild(o); setTimeout(function(){ if (o.parentNode) o.parentNode.removeChild(o); }, 1500);
}

/* ---------- V5 · Puerta: una puerta de verdad que se abre ---------- */
var LOCK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="sh" d="M8 11V8a4 4 0 0 1 8 0v3"/><rect x="4" y="11" width="16" height="10" rx="3"/></svg>';
function k5(){
  var s = si(), ds = doorsData(); if (selDoor >= ds.length) selDoor = 0;
  var scene = '<div class="vk-d5" data-tone="' + s.tone + '" data-s="' + state + '" data-d="' + selDoor + '" data-unl="' + (live() && state !== 'wait' ? 1 : 0) + '" data-open="0"><div class="vk-d5__stage"><i class="vk-d5__glow"></i><div class="vk-d5__frame"><div class="vk-d5__room"></div>' +
    '<div class="vk-d5__leaf"><span class="vk-d5__pan"></span><span class="vk-d5__pan vk-d5__pan--b"></span><span class="vk-d5__pl">' + (ds.length > 1 && selDoor === 1 ? '3B' : '12') + '</span><span class="vk-d5__kn"></span><span class="vk-d5__lk">' + LOCK + '</span></div></div><i class="vk-d5__floor"></i>' +
    '<span class="vk-d5__tag">' + ic(s.icon, 14) + s.chip + '</span></div><div class="vk-d5__t"><h3>' + s.t + '</h3><p>' + s.d + '</p></div></div>';
  return movedNote() + '<div class="vk-d5w"><div class="vk-d5l">' + scene + '</div><div class="vk-d5r">' + segHtml(ds) + fociHtml(ds) + '</div></div>' + below() + inline();
}

/* ---------- V6 · Cartera: tarjetas apiladas con inclinación 3D y reflejo ---------- */
var NFC = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 8.500a5 5 0 0 1 0 7"/><path d="M11 6a8.500 8.500 0 0 1 0 12"/><path d="M15 3.500a12 12 0 0 1 0 17"/></svg>';
function k6(){
  var ds = doorsData(), mode = modeOf(), st = stampOf(), n = ds.length; if (selDoor >= n) selDoor = 0;
  var cards = ds.map(function(d, i){
    return '<button type="button" class="vk-wc' + (i === selDoor ? ' is-sel' : '') + '" data-vk="door" data-i="' + i + '" data-ps="' + mode + '"><span class="vk-wc__sheen"></span><span class="vk-wc__top"><b>Villa Calipso</b><span class="vk-wc__nfc">' + NFC + '</span></span><span class="vk-wc__chip"></span>' +
      '<span class="vk-wc__name"><small>' + d.s + '</small><b>' + d.n + '</b></span><span class="vk-wc__ft"><span><small>FROM</small>' + arrD() + ' · 15:00</span><span><small>UNTIL</small>' + depD() + ' · 11:00</span></span>' + (st ? '<span class="vk-stamp">' + st + '</span>' : '') + (state === 'moved' ? '<span class="vk-pass__new">New key</span>' : '') + '</button>';
  }).join('');
  var acts = ds.map(function(d, i){ return '<div class="vk-wp' + (i === selDoor ? ' is-sel' : '') + '" data-i="' + i + '"><div class="vk-focus__h"><b>' + d.n + '</b><span>' + d.s + '</span></div>' + keyBody(d) + '</div>'; }).join('');
  return movedNote() + strip() + '<div class="vk-wgrid"><div class="vk-wal" data-n="' + n + '" data-sel="' + selDoor + '">' + cards + '</div><div class="vk-wact">' + acts + '</div></div>' + below() + inline();
}

/* ---------- V7 · Camino: el recorrido hasta la puerta, con un marcador que avanza ---------- */
function routeNodes(){
  var ds = doorsData();
  if (ds.length === 2) return [{ k: 'st', i: 'pin', l: 'Street', x: 8, y: 40 }, { k: 'd', d: 0, i: DI[ds[0].ty], l: 'Building', x: 30, y: 16 }, { k: 'lf', i: 'lift', l: 'Lift', x: 53, y: 38 }, { k: 'd', d: 1, i: DI[ds[1].ty], l: 'Apartment', x: 76, y: 14 }, { k: 'home', i: 'home', l: 'Home', x: 93, y: 36 }];
  return [{ k: 'st', i: 'pin', l: 'Street', x: 10, y: 38 }, { k: 'd', d: 0, i: DI[ds[0].ty], l: ds[0].n.replace(' door', ''), x: 50, y: 14 }, { k: 'home', i: 'home', l: 'Home', x: 90, y: 38 }];
}
function routeGeo(nodes){
  var cum = [0], t = 0; for (var i = 1; i < nodes.length; i++) { t += Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].y - nodes[i - 1].y); cum.push(t); }
  return { cum: cum, total: t, d: 'M' + nodes.map(function(n){ return n.x + ' ' + n.y; }).join(' L') };
}
function k7(){
  var ds = doorsData(), nodes = routeNodes(), g = routeGeo(nodes), lv = live(); rtSel = lv ? 1 : 0;
  var nh = nodes.map(function(n, i){
    var lock = n.k === 'd' && !lv, ic2 = lock ? 'lock' : n.i;
    return '<button type="button" class="vk-rt__n' + (i === rtSel ? ' is-sel' : '') + (i <= rtSel ? ' is-vis' : '') + (lock ? ' is-lock' : '') + '" style="left:' + n.x + '%;top:' + (n.y / 52 * 100) + '%" data-vk="node" data-i="' + i + '" aria-label="' + n.l + '">' + ic(ic2, 20) + '<em>' + n.l + '</em></button>';
  }).join('');
  var cur = nodes[rtSel], pct = Math.round(g.cum[rtSel] / g.total * 100);
  var svg = '<svg viewBox="0 0 100 52" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="vkg" x1="0" x2="1"><stop offset="0" stop-color="#6d8bff"/><stop offset="1" stop-color="#16a06a"/></linearGradient></defs><path class="vk-rt__base" d="' + g.d + '"/><path class="vk-rt__prog" pathLength="100" d="' + g.d + '" style="stroke-dashoffset:' + (100 - pct) + '"/></svg>';
  var dot = '<span class="vk-rt__dot" style="left:' + cur.x + '%;top:' + (cur.y / 52 * 100) + '%">' + ic(state === 'gen' ? 'refresh' : (lv ? 'tick' : 'clock'), 14) + '</span>';
  var panels = nodes.map(function(n, i){
    var body;
    if (n.k === 'd') body = '<div class="vk-focus__h"><b>' + ds[n.d].n + '</b><span>' + ds[n.d].s + '</span></div>' + keyBody(ds[n.d]);
    else if (n.k === 'home') body = '<div class="vk-rtp__home">' + ic('home', 30) + '<b>' + (live() ? 'Welcome to Villa Calipso' : 'Your stay starts here') + '</b><span>' + (live() ? 'Enjoy your stay! Wi-Fi and house rules are in the guidebook.' : 'Wed 25 Nov, from 15:00 · Fri 27 Nov by 11:00') + '</span></div>';
    else { var gi = n.k === 'st' ? 0 : 1; body = '<div class="vk-rtp__g"><img src="' + IMG + GUIDE[gi][0] + '" alt="" loading="lazy"><div><small>' + (n.k === 'st' ? 'Step 1' : 'Step 2') + '</small><b>' + GUIDE[gi][1] + '</b><span>' + stepTxt(gi) + '</span></div></div>'; }
    return '<div class="vk-rtp' + (i === rtSel ? ' is-sel' : '') + '" data-i="' + i + '"' + (n.d != null ? ' data-d="' + n.d + '"' : '') + '>' + body + '</div>';
  }).join('');
  return movedNote() + strip() + '<div class="vk-rtw"><div class="vk-rt" data-s="' + state + '" data-live="' + (lv ? 1 : 0) + '">' + svg + nh + dot + '</div><div class="vk-rtpw">' + panels + '</div></div>' + below() + inline();
}
function routeGo(i){
  var rt = mount && mount.querySelector('.vk-rt'); if (!rt) return;
  var nodes = routeNodes(), g = routeGeo(nodes); if (!nodes[i]) return; rtSel = i;
  [].forEach.call(rt.querySelectorAll('.vk-rt__n'), function(n, j){ n.classList.toggle('is-sel', j === i); n.classList.toggle('is-vis', j <= i); });
  [].forEach.call(mount.querySelectorAll('.vk-rtp'), function(p){ p.classList.toggle('is-sel', +p.getAttribute('data-i') === i); });
  var dot = rt.querySelector('.vk-rt__dot'); dot.style.left = nodes[i].x + '%'; dot.style.top = (nodes[i].y / 52 * 100) + '%';
  rt.querySelector('.vk-rt__prog').style.strokeDashoffset = 100 - Math.round(g.cum[i] / g.total * 100);
  if (nodes[i].k === 'home' && live()) setTimeout(function(){ burst(dot); }, 700);
}

/* ---------- V8 · Aurora: panel oscuro con aurora, anillo de progreso y cuenta atrás ---------- */
function fmtCd(t){ var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, z = function(x){ return (x < 10 ? '0' : '') + x; }; return z(h) + ':' + z(m) + ':' + z(s); }
function k8(){
  var s = si(), ds = doorsData(), tot = conds().length, n = leftN(), lv = live();
  var pct = { locked: Math.max(6, Math.round((tot - n) / tot * 100)), gen: 28, revoked: 0 }[state]; if (pct == null) pct = 100;
  var mid = { locked: '<b>' + (tot - n) + '/' + tot + '</b><small>steps done</small>', soon: '<b class="vk-cd" data-s="soon">' + fmtCd(CDS.soon) + '</b><small>until your keys appear</small>', wait: '<b class="vk-cd" data-s="wait">' + fmtCd(CDS.wait) + '</b><small>until you can enter</small>', gen: '<span class="vk-ring__ic">' + ic('refresh', 30) + '</span><small>Preparing</small>', open: '<span class="vk-ring__ic">' + ic('tick', 36) + '</span><small>Ready</small>', moved: '<span class="vk-ring__ic">' + ic('key', 32) + '</span><small>New keys</small>', err: '<span class="vk-ring__ic">' + ic('alert', 32) + '</span><small>Unavailable</small>', expired: '<span class="vk-ring__ic">' + ic('off', 32) + '</span><small>Ended</small>', revoked: '<span class="vk-ring__ic">' + ic('off', 32) + '</span><small>Cancelled</small>' }[state];
  var ring = '<div class="vk-ring" data-s="' + state + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="vk-ring__bg" cx="60" cy="60" r="52"/><circle class="vk-ring__fg" cx="60" cy="60" r="52" pathLength="100" style="--off:' + (100 - pct) + '"/></svg><div class="vk-ring__m">' + mid + '</div></div>';
  var cards = ds.map(function(d, i){ return '<div class="vk-ag" data-i="' + i + '" data-ty="' + d.ty + '"><div class="vk-ag__h"><span class="vk-ag__i">' + ic(DI[d.ty], 18) + '</span><div><b>' + d.n + '</b><span>' + d.s + '</span></div></div>' + keyBody(d) + '</div>'; }).join('');
  var panel = '<div class="vk-au" data-tone="' + s.tone + '" data-s="' + state + '"><i class="vk-au__b vk-au__b--1"></i><i class="vk-au__b vk-au__b--2"></i><i class="vk-au__b vk-au__b--3"></i><div class="vk-au__in"><div class="vk-au__hero">' + ring + '<h3>' + s.t + '</h3><p>' + (lv ? 'Valid ' + (state === 'moved' ? VALID_MOVED : VALID) : s.d) + '</p></div><div class="vk-au__cards" data-n="' + ds.length + '">' + cards + '</div></div></div>';
  return movedNote() + panel + below() + inline();
}
function startCountdown(){
  clearInterval(cdTimer); if ((kv !== 'v8' && kv !== 'v81') || (state !== 'soon' && state !== 'wait')) return;
  cdTimer = setInterval(function(){ var e = mount && mount.querySelector('.vk-cd'); if (!e) { clearInterval(cdTimer); return; } CDS[state] = Math.max(0, CDS[state] - 1); e.textContent = fmtCd(CDS[state]); }, 1000);
}
/* una puerta se ha abierto: confeti y reacción de cada versión */
function opened(c, i){
  burst(c); openedX(c, i);
  if (i < 0) return;
  var d5 = mount.querySelector('.vk-d5');
  if (d5 && +d5.getAttribute('data-d') === i) { d5.setAttribute('data-open', '1'); setTimeout(function(){ d5.setAttribute('data-open', '0'); }, 3800); }
  if (mount.querySelector('.vk-rt')) {
    var nodes = routeNodes(), idx = -1; nodes.forEach(function(n, j){ if (n.k === 'd' && n.d === i) idx = j; });
    if (idx > -1) { setTimeout(function(){ routeGo(idx + 1); }, 1100); if (nodes[idx + 1] && nodes[idx + 1].k === 'lf') setTimeout(function(){ routeGo(idx + 2); }, 2400); }
  }
}
function pickDoor(i){
  selDoor = i;
  [].forEach.call(mount.querySelectorAll('.vk-seg button'), function(b){ var on = +b.getAttribute('data-i') === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  [].forEach.call(mount.querySelectorAll('.vk-focus,.vk-wp,.vk-wc,.vk-k9k'), function(f){ f.classList.toggle('is-sel', +f.getAttribute('data-i') === i); });
  var d5 = mount.querySelector('.vk-d5'); if (d5) { d5.setAttribute('data-d', i); d5.setAttribute('data-open', '0'); var pl = d5.querySelector('.vk-d5__pl'); if (pl) pl.textContent = i === 1 ? '3B' : '12'; }
  var w = mount.querySelector('.vk-wal'); if (w) w.setAttribute('data-sel', i);
  pickDoorX(i);
}
function wireTilt(){
  mount.addEventListener('pointermove', function(e){
    var c = e.target.closest('.vk-wc.is-sel'); if (!c) return; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', ((x - .5) * 14).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 12).toFixed(1) + 'deg'); c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
  });
  mount.addEventListener('pointerleave', function(){ [].forEach.call(mount.querySelectorAll('.vk-wc'), function(c){ c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }); }, true);
}

/* =====================================================================================
   V9 · Llavero · V10 · Cerradura · V11 · Historias · V12 · Billete (#1009)
   ===================================================================================== */
var stTimer = null, stIdx = 0, stAuto = true;
var KEY9 = '<svg viewBox="0 0 44 120" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle class="h" cx="22" cy="22" r="7"/><rect x="18" y="38" width="8" height="72" rx="3"/><rect x="26" y="80" width="10" height="7" rx="2"/><rect x="26" y="94" width="7" height="7" rx="2"/></svg>';
/* ---------- V9 · Llavero: llaves colgando de una anilla ---------- */
function k9(){
  var s = si(), ds = doorsData(); if (selDoor >= ds.length) selDoor = 0;
  var keys = ds.map(function(d, i){ return '<button type="button" class="vk-k9k' + (i === selDoor ? ' is-sel' : '') + '" data-vk="door" data-i="' + i + '" style="--k:' + i + '" aria-label="' + d.n + '"><i class="vk-k9k__ch"></i><span class="vk-k9k__key">' + KEY9 + '</span><span class="vk-k9k__tag">' + ic(DI[d.ty], 13) + d.n.replace(' door', '') + '</span></button>'; }).join('');
  var stage = '<div class="vk-k9" data-tone="' + s.tone + '" data-s="' + state + '" data-n="' + ds.length + '"><span class="vk-k9__tag">' + ic(s.icon, 14) + s.chip + '</span><i class="vk-k9__hook"></i><i class="vk-k9__ring"></i>' + (state === 'locked' ? '<span class="vk-k9__pad">' + ic('lock', 18) + '</span>' : '') + '<div class="vk-k9__keys">' + keys + '</div></div>';
  return movedNote() + '<div class="vk-d5w"><div class="vk-d5l">' + stage + '<div class="vk-d5__t"><h3>' + s.t + '</h3><p>' + s.d + '</p></div></div><div class="vk-d5r">' + fociHtml(ds) + '</div></div>' + below() + inline();
}
/* ---------- V10 · Cerradura: la cerradura inteligente con anillo de luz; el código se teclea en el teclado ---------- */
function kpad(d){ return d.ty !== 'pin' ? '' : '<div class="vk-kp" aria-hidden="true">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '✓'].map(function(k){ return '<i data-k="' + k + '">' + k + '</i>'; }).join('') + '</div>'; }
function k10(){
  var s = si(), ds = doorsData(); if (selDoor >= ds.length) selDoor = 0;
  var dev = '<div class="vk-lk10" data-tone="' + s.tone + '" data-s="' + state + '" data-d="' + selDoor + '" data-open="0"><div class="vk-lk10__dev"><i class="vk-lk10__led"></i><div class="vk-lk10__knob"><i class="vk-lk10__grip"></i><span>' + ic(live() && state !== 'wait' ? 'unlock' : s.icon, 30) + '</span></div></div><span class="vk-lk10__lbl">' + ds[selDoor].n + '</span></div>';
  var foci = '<div class="vk-foci" data-n="' + ds.length + '">' + ds.map(function(d, i){ return '<div class="vk-focus' + (i === selDoor ? ' is-sel' : '') + '" data-i="' + i + '" data-ty="' + d.ty + '"><div class="vk-focus__h"><b>' + d.n + '</b><span>' + d.s + '</span></div>' + (live() ? act(d) + kpad(d) : ph(d)) + '</div>'; }).join('') + '</div>';
  return movedNote() + '<div class="vk-d5w"><div class="vk-d5l">' + dev + '<div class="vk-d5__t"><h3>' + s.t + '</h3><p>' + s.d + '</p></div></div><div class="vk-d5r">' + segHtml(ds) + foci + '</div></div>' + below() + inline();
}
function kpType(c){
  var f = c.closest('.vk-focus'), kp = f && f.querySelector('.vk-kp'); if (!kp) return;
  var seq = c.getAttribute('data-code').split(''); seq.push('✓');
  seq.forEach(function(ch, j){ setTimeout(function(){ var k = kp.querySelector('[data-k="' + ch + '"]'); if (!k) return; k.classList.add('hit'); setTimeout(function(){ k.classList.remove('hit'); }, 240); }, 350 + j * 330); });
  setTimeout(function(){ var dv = mount.querySelector('.vk-lk10'); if (dv) { dv.setAttribute('data-open', '1'); setTimeout(function(){ dv.setAttribute('data-open', '0'); }, 2600); } }, 350 + seq.length * 330);
}
/* ---------- V11 · Historias: el camino contado en historias a pantalla completa ---------- */
function stories(){
  var ds = doorsData(), s = si(), out = [{ k: 'st', img: 'gb-street.jpg', t: s.t, d: s.d, chip: s.chip }];
  ds.forEach(function(d, i){
    out.push({ k: 'd', d: i, img: d.ty === 'app' || d.ty === 'card' ? 'gb-keys.jpg' : (i === 0 ? 'gb-street2.jpg' : 'gb-door.jpg'), t: d.n });
    if (ds.length === 2 && i === 0) out.push({ k: 'lf', img: 'gb-hall.jpg', t: 'Take the lift to the 3rd floor', d: 'Walk through the hall. The lift is at the end, on the right.' });
  });
  out.push({ k: 'home', img: 'gb-living.jpg', t: live() ? 'Welcome to Villa Calipso' : 'See you soon', d: live() ? 'Enjoy your stay. Wi-Fi and house rules are in the guidebook.' : 'Wed 25 Nov from 15:00 · Fri 27 Nov by 11:00' });
  return out;
}
function k11(){
  var ss = stories(), ds = doorsData(); stIdx = 0; stAuto = true;
  var bars = '<div class="vk-st__bars">' + ss.map(function(o, i){ return '<i data-i="' + i + '"><b></b></i>'; }).join('') + '</div>';
  var hd = '<div class="vk-st__hd"><span class="vk-st__av">' + ic('key', 15) + '</span><span>Villa Calipso<small>Your arrival</small></span></div>';
  var slides = ss.map(function(o, i){
    var body = o.k === 'd' ? '<div class="vk-st__dt"><small>Door ' + (o.d + 1) + ' of ' + ds.length + '</small><h3>' + o.t + '</h3></div><div class="vk-st__card">' + keyBody(ds[o.d]) + '</div>'
      : '<div class="vk-st__txt">' + (o.chip ? '<span class="vk-st__chip">' + ic(si().icon, 14) + o.chip + '</span>' : '') + '<h3>' + o.t + '</h3><p>' + o.d + '</p></div>';
    return '<div class="vk-st__s' + (i === 0 ? ' is-sel' : '') + '" data-i="' + i + '" data-k="' + o.k + '"><img src="' + IMG + o.img + '" alt="" loading="lazy">' + body + '</div>';
  }).join('');
  var nav = '<button type="button" class="vk-st__nav vk-st__nav--p" data-vk="st-prev" aria-label="Previous"></button><button type="button" class="vk-st__nav vk-st__nav--n" data-vk="st-next" aria-label="Next"></button>';
  var toc = '<div class="vk-st__toc">' + ss.map(function(o, i){ return '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-vk="st-go" data-i="' + i + '"><img src="' + IMG + o.img + '" alt=""><span><small>' + (i + 1) + ' of ' + ss.length + '</small><b>' + o.t + '</b></span></button>'; }).join('') + '</div>';
  return movedNote() + '<div class="vk-stw"><div class="vk-st" data-s="' + state + '">' + bars + hd + slides + nav + '</div>' + toc + '</div>' + below() + inline();
}
function stGo(i, user){
  var st = mount && mount.querySelector('.vk-st'); if (!st) return;
  var sl = st.querySelectorAll('.vk-st__s'), n = sl.length; if (i < 0 || i >= n) return;
  if (user) stAuto = false;
  stIdx = i; clearTimeout(stTimer);
  var door = sl[i].getAttribute('data-k') === 'd' && live(), hold = !stAuto || door || i === n - 1;
  [].forEach.call(sl, function(x, j){ x.classList.toggle('is-sel', j === i); });
  [].forEach.call(st.querySelectorAll('.vk-st__bars i'), function(b, j){ b.className = j < i ? 'done' : (j === i ? (hold ? 'hold' : '') : ''); if (j === i && !hold) { void b.offsetWidth; b.className = 'on'; } });
  [].forEach.call(mount.querySelectorAll('.vk-st__toc button'), function(b, j){ b.classList.toggle('on', j === i); });
  if (!hold) stTimer = setTimeout(function(){ stGo(stIdx + 1, false); }, 6000);
}
function startStories(){ clearTimeout(stTimer); if (kv === 'v11' && mount && mount.querySelector('.vk-st')) stGo(0, false); }
/* ---------- V12 · Billete: un billete de embarque hasta el apartamento ---------- */
function k12(){
  var s = si(), ds = doorsData(), mode = modeOf();
  var stamp = { locked: 'Check-in pending', soon: 'Boarding soon', gen: 'Issuing', err: 'On hold', expired: 'Used', revoked: 'Cancelled' }[state];
  var main = '<div class="vk-tk__main"><div class="vk-tk__hd"><span>' + ic('key', 14) + 'KEY PASS</span><b>VILLA CALIPSO</b></div>' +
    '<div class="vk-tk__rt"><div><small>FROM</small><b>STREET</b><span>Calle Mayor 12</span></div><div class="vk-tk__ln"><i></i><span>' + ic('door', 16) + '</span></div><div class="vk-tk__to"><small>TO</small><b>3B</b><span>3rd floor</span></div></div>' +
    '<div class="vk-tk__f"><div><small>GUEST</small><b>Carmen Demo</b></div><div><small>DOORS</small><b>' + ds.length + '</b></div><div><small>CHECK-IN</small><b>' + arrD() + ' · 15:00</b></div><div><small>CHECK-OUT</small><b>' + depD() + ' · 11:00</b></div></div>' +
    '<div class="vk-tk__bc"><i class="vk-tk__scan"></i></div>' + (stamp ? '<span class="vk-tk__stamp">' + stamp + '</span>' : '') + '</div>';
  var stubs = ds.map(function(d, i){ return '<div class="vk-tk__stub" data-i="' + i + '"><div class="vk-tk__sh"><small>GATE ' + (i + 1) + '</small><b>' + d.n + '</b><span>' + d.s + '</span></div>' + keyBody(d) + '<span class="vk-tk__ok">' + ic('tick', 14) + 'Opened</span></div>'; }).join('');
  return movedNote() + strip() + '<div class="vk-tk" data-tone="' + s.tone + '" data-s="' + state + '" data-ps="' + mode + '">' + main + '<div class="vk-tk__perf"></div><div class="vk-tk__stubs">' + stubs + '</div></div>' + below() + inline();
}
/* reacciones al abrir una puerta en V9–V12 */
function openedX(c, i){
  var k9 = mount.querySelector('.vk-k9k.is-sel'); if (k9) { k9.classList.add('is-turn'); setTimeout(function(){ k9.classList.remove('is-turn'); }, 1800); }
  var dv = mount.querySelector('.vk-lk10'); if (dv) { dv.setAttribute('data-open', '1'); setTimeout(function(){ dv.setAttribute('data-open', '0'); }, 3000); }
  if (mount.querySelector('.vk-st')) setTimeout(function(){ stGo(stIdx + 1, false); }, 1400);
  var sb = c.closest('.vk-tk__stub'); if (sb) { sb.classList.add('is-ok'); setTimeout(function(){ sb.classList.remove('is-ok'); }, 3600); }
}
function pickDoorX(i){ var dv = mount.querySelector('.vk-lk10'), ds = doorsData(); if (dv && ds[i]) { dv.setAttribute('data-d', i); dv.querySelector('.vk-lk10__lbl').textContent = ds[i].n; } }

/* ---------- V8.1 · Aurora: fondo de la tarjeta de la Home, sin anillo cuando las llaves están listas, deslizador nuevo ---------- */
var T81 = { open: ['Your keys', function(){ return 'They work until ' + depD() + ' at 11:00.'; }], moved: ['Your keys', function(){ return 'They work until ' + depD() + ' at 11:00.'; }] };
/* Bloqueada V2: en lugar de las llaves, los pasos que faltan para tenerlas */
function steps81(){
  var cs = conds();
  var rows = cs.map(function(c, j){ return '<div class="vk-s81" data-ok="' + (c.ok ? 1 : 0) + '"><span class="vk-s81__n">' + (c.ok ? ic('tick', 15) : (j + 1)) + '</span><div class="vk-s81__t"><b>' + c.t + '</b><span>' + c.s + '</span></div>' + (c.ok ? '<em class="vk-s81__ok">Done</em>' : miniBtn(c)) + '</div>'; }).join('');
  rows += '<div class="vk-s81" data-ok="2"><span class="vk-s81__n">' + ic('key', 15) + '</span><div class="vk-s81__t"><b>Your keys appear here</b><span>' + cap(releaseTxt()) + '</span></div></div>';
  var minors = cs.some(function(c){ return c.minors; }) ? '<p class="vk-s81__m">Children don\u2019t need to verify their ID.</p>' : '';
  return '<div class="vk-ag vk-ag--steps"><div class="vk-s81l">' + rows + '</div>' + minors + '</div>';
}
/* llaves que aún no se pueden usar (Preparada, Generando): el hueco de la llave como fantasma y, encima, una píldora con el estado (sin repetir el texto del titular) */
function pwChip(){
  var when = cfg.when === '24h' ? 'Tue 24 Nov \u00b7 15:00' : 'Wed 25 Nov';
  var C = { soon: ['clock', 'Arrives ' + when], gen: ['refresh', 'Generating\u2026'], err: ['alert', 'Unavailable'], expired: ['off', 'Expired'], revoked: ['off', 'Cancelled'] }[state];
  return '<em class="vk-pwc" data-s="' + state + '">' + ic(C[0], 14) + '<span>' + C[1] + '</span></em>';
}
function pw81(d){
  var gen = state === 'gen', when = cfg.when === '24h' ? 'Tue 24 Nov \u00b7 15:00' : 'Wed 25 Nov';
  var ghost = d.ty === 'pin' ? '<div class="vk-pw__d">' + '<i></i><i></i><i></i><i></i><i></i>' + pwChip() + '</div>'
    : (d.ty === 'link' ? '<div class="vk-pw__s"></div>' : '<div class="vk-pw__b"><i></i><i></i></div>');
  return '<div class="vk-pw" data-s="' + state + '">' + ghost + (d.ty === 'pin' ? '' : pwChip()) + '</div>';
}
/* Si las tarjetas no caben sin scroll, todas las puertas pasan a una lista compacta (sin título):
   'listS' = las de enlace siguen con su deslizador · 'list' = si ni así cabe, las de enlace llevan un botón «Open» */
var lay81 = 'cards';
function list81(ds, waitK, slide){
  var short = { soon: 'Soon', gen: 'Generating\u2026', err: 'Unavailable', expired: 'Expired', revoked: 'Cancelled' }[state];
  var rows = ds.map(function(d, i){
    var head = '<span class="vk-mr__i">' + ic(d.ic || DI[d.ty], 16) + '</span><div class="vk-mr__t"><b>' + d.n + '</b><span>' + d.s + '</span></div>';
    if (waitK) return '<li data-i="' + i + '">' + head + '<em class="vk-mc vk-mc--g" data-s="' + state + '">' + short + '</em></li>';
    if (d.ty === 'pin') return '<li data-i="' + i + '">' + head + '<button type="button" class="vk-mc" data-vk="copy" data-code="' + d.code + '" aria-label="Copy code ' + d.code + '"><span data-l="' + d.code + '">' + d.code + '</span>' + ic('copy', 13) + '</button></li>';
    if (slide) return '<li class="vk-mr--s" data-i="' + i + '">' + head + '<div class="vk-mr__sl">' + act(d) + '</div></li>';
    return '<li data-i="' + i + '">' + head + '<button type="button" class="vk-mc vk-mc--o" data-vk="mopen"' + (early() ? ' disabled' : '') + '><span>' + (early() ? 'From 15:00' : 'Open') + '</span></button></li>';
  }).join('');
  return '<div class="vk-ag vk-more"><ul class="vk-mr">' + rows + '</ul></div>';
}
function hasPin(){ return doorsData().some(function(d){ return d.ty === 'pin'; }); }
function hasLink(){ return doorsData().some(function(d){ return d.ty === 'link'; }); }
/* escritorio con llaves listas: lo que acompaña a «Your keys» en la columna izquierda */
function dkTop(){ return ''; }
function dkBottom(){
  var eci = LS.get('rep-eci', '1') !== '0', lco = LS.get('rep-lco', '1') !== '0';   /* lo que ofrece el anfitrión (mismo ajuste que el Hub) */
  var href = 'offers-all' + EXT;
  var row = function(icn, t, d){ return '<li><span class="vk-dk2__i">' + ic(icn, 16) + '</span><div><b>' + t + '</b><span>' + d + '</span></div></li>'; };
  var out = '<ul class="vk-dk2">' +
    row('clock', 'Check-in from 15:00', 'Your keys work from 15:00 on ' + arrD() + '. The doors won’t open before then.') +
    row('door', 'Check-out by 11:00', 'Leave by 11:00 on ' + depD() + '. Your keys stop working at that time.') + '</ul>';
  if (!offW81) out += offer81();
  return out;
}
var offW81 = false, lb81 = 'row';   /* lb81: puerta con enlace en tarjeta, 'row' = una fila con «Open» a la derecha · 'big' = botón grande debajo */   /* escritorio: «Need more time?» abajo a todo el ancho */
function offer81(){
  var eci = LS.get('rep-eci', '1') !== '0', lco = LS.get('rep-lco', '1') !== '0', href = 'offers-all' + EXT;
  if (!eci && !lco) return '';
  return '<div class="vk-dk2__offer' + (offW81 ? ' vk-dk2__offer--wide' : '') + '"><div><b>Need more time?</b><span>Ask for an early check-in or a late check-out.</span></div><div class="vk-dk2__ob" data-n="' + ((eci ? 1 : 0) + (lco ? 1 : 0)) + '">' +
    (eci ? '<a href="' + href + '">' + ic('sun', 15) + 'Early check-in</a>' : '') + (lco ? '<a href="' + href + '">' + ic('moon', 15) + 'Late check-out</a>' : '') + '</div></div>';
}
function k81(){
  var s = si(), ds = doorsData(), ready = state === 'open' || state === 'moved', hero;
  var tip = '';
  /* sin «They work until…»: lo explica «Check-out by 11:00»; en móvil la sección de horas va justo debajo de «Your keys» */
  if (ready) hero = '<div class="vk-au__hero vk-au__hero--r">' + (desk ? '<h3>' + T81[state][0] + '</h3>' : '') + tip + (desk ? dkBottom() : '<div class="vk-m81">' + dkBottom() + '</div>') + '</div>';
  else { var tmp = document.createElement('div'); tmp.innerHTML = k8(); var hp = tmp.querySelector('.vk-au__hero p'); if (state === 'gen' && hp) hp.textContent = 'This usually takes a few minutes.'; hero = tmp.querySelector('.vk-au__hero').outerHTML; if (tip) hero = hero.replace(/<\/div>$/, tip + '</div>'); }
  var lockV2 = state === 'locked' && lk === 'v2', waitK = ['soon', 'gen', 'err', 'expired', 'revoked'].indexOf(state) > -1;   /* llaves sin usar: hueco fantasma + píldora de estado */
  var toast = false ?   /* sin aviso de llaves regeneradas: Fechas cambiadas se ve igual que Lista */ '<div class="vk-toast" role="status"><span class="vk-toast__i">' + ic('alert', 16) + '</span><div><b>Your keys were regenerated</b><span>These are your new keys.</span></div><button type="button" class="vk-toast__x" data-vk="toastx" aria-label="Dismiss">\u00d7</button></div>' : '';
  var cards = lockV2 ? steps81() : lay81 !== 'cards' ? list81(ds, waitK, lay81 === 'listS') : ds.map(function(d, i){ return '<div class="vk-ag" data-i="' + i + '" data-ty="' + d.ty + '"><div class="vk-ag__h"><span class="vk-ag__i">' + ic(d.ic || DI[d.ty], 18) + '</span><div><b>' + d.n + '</b><span>' + d.s + '</span></div>' + (d.ty === 'pin' && live() && !waitK ? '<button type="button" class="vk-cp__ic" data-vk="copy" aria-label="Copy code"><span class="vk-cp__a">' + ic('copy', 17) + '</span><span class="vk-cp__ok">' + ic('tick', 17) + '</span><em>Copied</em></button>' : '') + '</div>' + (waitK ? pw81(d) : keyBody(d)) + '</div>'; }).join('');
  return (ready ? '' : movedNote()) + toast + '<div class="vk-au vk-au--home" data-tone="' + s.tone + '" data-s="' + state + '"' + (desk && ready ? ' data-dk="' + dk + '"' : '') + ' data-lb="' + lb81 + '"><i class="vk-au__bl vk-au__bl--1"></i><i class="vk-au__bl vk-au__bl--2"></i><div class="vk-au__in">' + hero + '<div class="vk-au__cards" data-n="' + ds.length + '" data-lay="' + (lockV2 ? 'cards' : lay81) + '"' + mixD81(ds) + '>' + cards + '</div>' + (desk && ready && offW81 ? offer81() : '') + '</div></div>' + (lockV2 ? '' : below()) + inline();
}
/* ---------- montaje ---------- */
var KEYS = { v1: k1, v2: k2, v3: k3, v4: k4, v5: k5, v6: k6, v7: k7, v8: k8, v81: k81, v9: k9, v10: k10, v11: k11, v12: k12 }, THERE = { v1: t1, v2: t1, v3: t3, v4: t4, v5: t1, v6: t3, v7: t4, v8: t3, v81: there81, v9: t3, v10: t1, v11: t4, v12: t1 };
var TABS = [['keys', 'Keys', 'key'], ['there', desk ? 'Getting there' : 'How to get in', 'pin'], ['help', 'Help', 'help']];   /* en móvil, «How to get in» */
function prep(){
  var root = document.querySelector('.keys-view'), old = root && root.querySelector('.vk-old'); if (!old) return false;
  grab();
  mount = document.createElement('div'); mount.className = 'vk-mount'; old.parentNode.insertBefore(mount, old);
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  tabsEl = root.querySelector('[role="tablist"]');
  /* pestañas fijas bajo la cabecera móvil al hacer scroll: se mide la altura de la cabecera */
  var topBar = function(){ var b = document.querySelector('header button[aria-label="Back"]'), w = b && b.closest('[class*="sticky"]'); document.documentElement.style.setProperty('--vk-top', ((w && w.offsetHeight) || 64) + 'px'); };
  topBar(); setTimeout(topBar, 300); window.addEventListener('resize', topBar);
  var wrap = tabsEl && tabsEl.closest('header') && tabsEl.closest('header').parentNode; if (wrap) wrap.classList.add('vk-tabwrap');
  window.addEventListener('scroll', function(){ if (wrap) wrap.classList.toggle('is-stuck', wrap.getBoundingClientRect().top <= parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vk-top')) + 9); }, { passive: true });
  var as = tabsEl ? tabsEl.querySelectorAll('a') : [];
  if (as.length) { tpl.on = as[0].cloneNode(true); tpl.off = (as[1] || as[0]).cloneNode(true); } else tabsEl = null;
  return true;
}
/* número de llaves en la pestaña «Keys»: verde si están listas */
function cntTone(){ return { open: 'ok', moved: 'ok', locked: 'warn', err: 'bad', expired: 'off', revoked: 'off' }[state] || 'info'; }
function moveInd(){
  var ind = tabsEl && tabsEl.querySelector('.vk-tabs__ind'), on = tabsEl && tabsEl.querySelector('.vk-tab.on'); if (!ind || !on) return;
  ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px';
}
function paintTabs(){
  if (!tabsEl) return;
  document.documentElement.classList.toggle('vk-tabs-on', raOn());
  if (tpl.cls == null) tpl.cls = tabsEl.className;
  if (tb !== 'cur') {
    var n = doorsData().length, cto = cntTone();
    tabsEl.className = 'vk-tabs vk-tabs--' + tb;
    tabsEl.innerHTML = '<i class="vk-tabs__ind" aria-hidden="true"></i>' + TABS.map(function(t){ return '<button type="button" role="tab" class="vk-tab' + (t[0] === tab ? ' on' : '') + '" aria-selected="' + (t[0] === tab) + '" data-vk="tab" data-tab="' + t[0] + '"><span class="vk-tab__i">' + ic(t[2], 18) + '</span><span class="vk-tab__l">' + t[1] + '</span></button>'; }).join('');
    var ind = tabsEl.querySelector('.vk-tabs__ind'); ind.style.transition = 'none'; moveInd(); requestAnimationFrame(function(){ moveInd(); requestAnimationFrame(function(){ ind.style.transition = ''; }); });
    return;
  }
  tabsEl.className = tpl.cls;
  tabsEl.innerHTML = '';
  TABS.forEach(function(t){
    var a = (t[0] === tab ? tpl.on : tpl.off).cloneNode(true);
    a.removeAttribute('href'); a.setAttribute('data-vk', 'tab'); a.setAttribute('data-tab', t[0]);
    var nk = doorsData().length, cnt = t[0] === 'keys' ? '<span data-tabs-count="" data-tone="' + cntTone() + '" class="tabs__count vk-cnt ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold">' + nk + '</span>' : '';
    a.innerHTML = ic(t[2], 16) + t[1];   /* sin el número de llaves */
    if (t[0] === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    tabsEl.appendChild(a);
  });
}
/* elige la disposición de V8.1: tarjetas → lista con deslizadores → lista con «Open», la primera que quepa sin scroll */
/* elige cómo se ven las puertas según el espacio:
   móvil (y estados sin llaves listas): tarjetas → lista, la primera que quepa sin scroll;
   escritorio con llaves listas: prueba tarjetas / lista × «Need more time?» a la izquierda / abajo a todo el ancho
   y se queda con la que cabe, queda más compacta y con las dos columnas más equilibradas (las tarjetas ganan si la diferencia es pequeña) */
function fit81(){
  var probe = document.createElement('div');
  probe.className = 'vk-panels vk-probe'; probe.setAttribute('data-tab', 'keys'); mount.style.position = 'relative'; mount.insertBefore(probe, mount.firstChild);
  var avail = window.innerHeight - (primary() ? 96 : 0) - 16, ready = state === 'open' || state === 'moved';
  var paint = function(){ probe.innerHTML = '<section class="vk-p vk-p--keys">' + k81() + '</section>'; return probe.querySelector('.vk-au'); };
  offW81 = false;
  if (desk && ready) {
    var best = null, combos = [['cards', false, 'row'], ['cards', true, 'row'], ['list', false, 'row'], ['list', true, 'row']];
    if (hasLink()) combos.push(['cards', false, 'big'], ['cards', true, 'big'], ['cards', false, 'bigc'], ['cards', true, 'bigc']);
    if (doorsData().length >= 4) combos = combos.filter(function(c){ return c[0] === 'list'; });   /* con 4 puertas o más, siempre lista */
    combos.forEach(function(c){
      lay81 = c[0]; offW81 = c[1]; lb81 = c[2]; var au = paint(); if (!au) return;
      var hero = au.querySelector('.vk-au__hero'), cards = au.querySelector('.vk-au__cards'), H = au.offsetHeight;
      var over = au.getBoundingClientRect().bottom + window.scrollY > avail;
      var L = hero.offsetHeight, R = cards.offsetHeight;
      /* mejor que la columna de las puertas quede algo más alta que la de los textos que al revés */
      var score = H + (L > R ? 1.2 * (L - R) : 0.25 * (R - L)) + (over ? 10000 : 0) + (c[0] === 'list' ? 60 : 0) + (hasLink() ? { row: 90, big: 0, bigc: 15 }[c[2]] : 0);   /* si hay sitio, ganan las tarjetas y el botón grande (con nota; sin ella si hace falta ajustar) */
      if (!best || score < best.score) best = { score: score, lay: c[0], w: c[1], lb: c[2] };
    });
    if (best) { lay81 = best.lay; offW81 = best.w; lb81 = best.lb; }
  } else {
    var modes = doorsData().length >= 4 ? ['list'] : ['cards'];   /* móvil: de 1 a 3 puertas, tarjetas (aunque haya scroll); con 4 o más, lista */
    for (var m = 0; m < modes.length; m++) { lay81 = modes[m]; var au2 = paint(); if (!au2) break; var cb = au2.querySelector('.vk-au__cards') || au2; if (cb.getBoundingClientRect().bottom + window.scrollY <= avail) break; }   /* solo cuentan las llaves (no las horas ni «Need more time?») */
  }
  mount.removeChild(probe);
}
var fitT = null; window.addEventListener('resize', function(){ if (kv !== 'v81') return; clearTimeout(fitT); fitT = setTimeout(render, 200); });
function render(){
  if (!mount) return;
  clearInterval(cdTimer); clearTimeout(stTimer);
  mount.setAttribute('data-kv', kv); mount.setAttribute('data-state', state); document.documentElement.setAttribute('data-vkv', kv);
  if (!raOn()) { mount.innerHTML = '<div class="vk-note" data-tone="off">' + ic('off', 18) + '<span><b>Remote access is off.</b> This property doesn’t offer virtual keys.</span></div>'; if (dockEl) dockEl.style.display = 'none'; paintTabs(); return; }
  if (kv === 'v81') fit81();
  mount.innerHTML = '<div class="vk-panels" data-tab="' + tab + '"><section class="vk-p vk-p--keys">' + KEYS[kv]() + '</section><section class="vk-p vk-p--there"><div class="vk-dtop">' + label('Getting in', 'pin') + '</div>' + THERE[kv]() + '</section><section class="vk-p vk-p--help">' + helpP() + '</section></div>';
  var p = primary();
  if (dockEl) { var w = dockEl.querySelector('.contents'); dockEl.style.display = p ? '' : 'none'; if (w) w.innerHTML = p ? btn(p) : ''; }
  paintTabs(); velaPanel(); startCountdown(); startStories();
}
function selectTab(t){
  tab = t; try { sessionStorage.setItem('replica-ra-tab', t); } catch (e) {} var pn = mount && mount.querySelector('.vk-panels'); if (pn) pn.setAttribute('data-tab', t);
  if (tb !== 'cur' && tabsEl && tabsEl.querySelector('.vk-tab')) { [].forEach.call(tabsEl.querySelectorAll('.vk-tab'), function(b){ var on = b.getAttribute('data-tab') === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); moveInd(); } else paintTabs();
  window.scrollTo({ top: 0 });
}

/* acciones */
function doorDone(c){ return c.getAttribute('data-door'); }
/* vista «Móvil + escritorio»: abrir una puerta se repite en la otra pantalla. En móvil se desliza y en escritorio se pulsa, así que panel.js no puede emparejarlos: se envía qué puerta es (su orden dentro de la sección) */
var doorMirror = false;
function doorEls(sec){ return sec.querySelectorAll('.vk-open,[data-vk="mopen"]'); }
function sendDoor(el){
  if (doorMirror) return;
  try { var T = window.top, sec = el.closest('.vk-p'); if (T === window || !T.__phoneSplit || !sec) return; T.postMessage({ rep: 'ui-door', w: sec.classList.contains('vk-p--there') ? 'there' : 'keys', i: [].indexOf.call(doorEls(sec), el) }, '*'); } catch (_) {}
}
window.addEventListener('message', function(ev){
  var m = ev.data, sec = m && m.rep === 'ui-door' && mount ? mount.querySelector('.vk-p--' + m.w) : null, el = sec ? doorEls(sec)[m.i] : null; if (!el) return;
  doorMirror = true;
  try {
    if (el.getAttribute('data-vk') === 'mopen') el.click();
    else { var sl = el.closest('[data-door]').querySelector('.vk-slide'); if (sl && sl.offsetParent) finishSlide(sl); else openDoor(el); }
  } catch (_) {}
  doorMirror = false;
});
function openDoor(b){
  var c = b.closest('[data-door]'), s = b.querySelector('span'), lbl = c.querySelector('.vk-slide__lbl');
  if (c.getAttribute('data-door') !== 'idle') return;
  sendDoor(b);
  var oldF = c.querySelector('.vk-fail'); if (oldF) oldF.parentNode.removeChild(oldF);
  c.setAttribute('data-door', 'busy'); s.textContent = 'Opening…'; if (lbl) lbl.textContent = 'Opening…'; b.disabled = true;
  setTimeout(function(){
    if (op === 'fail') {
      c.setAttribute('data-door', 'fail'); s.textContent = 'Didn’t open'; if (lbl) lbl.textContent = 'Didn’t open'; try { if (navigator.vibrate) navigator.vibrate([30, 60, 30]); } catch (_) {}
      c.insertAdjacentHTML('beforeend', '<div class="vk-fail" role="alert">' + ic('alert', 16) + '<span><b>The door didn’t open.</b> Make sure you’re at the door and your phone is online, then try again. Still stuck? Message your host.</span></div>');
      return;
    }
    c.setAttribute('data-door', 'done'); s.textContent = 'Door open'; if (lbl) lbl.textContent = 'Door open'; var ix = c.closest('[data-i]'); opened(c, ix ? +ix.getAttribute('data-i') : -1);
  }, 1200);
  setTimeout(function(){ c.setAttribute('data-door', 'idle'); s.textContent = op === 'fail' ? 'Try again' : (s.getAttribute('data-l') || 'Open door'); if (lbl) lbl.textContent = op === 'fail' ? 'Slide to try again' : (lbl.getAttribute('data-l') || 'Slide to open door'); b.disabled = false; var sl2 = c.querySelector('.vk-slide'); if (sl2) sl2.classList.remove('is-far'); var th = c.querySelector('.vk-slide__thumb'); if (th) { th.style.transform = ''; th.setAttribute('aria-valuenow', '0'); } var f = c.querySelector('.vk-slide__fill'); if (f) f.style.width = ''; }, 4400);
}
function finishSlide(sl){
  var c = sl.closest('[data-door]'), b = c && c.querySelector('.vk-open'); if (!b) return;
  var th = sl.querySelector('.vk-slide__thumb'), max = sl.clientWidth - th.offsetWidth - 8;
  th.style.transform = 'translateX(' + max + 'px)'; sl.querySelector('.vk-slide__fill').style.width = (max + th.offsetWidth + 8) + 'px'; th.setAttribute('aria-valuenow', '100'); sl.classList.add('is-far'); try { if (navigator.vibrate) navigator.vibrate(18); } catch (_) {}
  openDoor(b);
}
function wireHelp(){
  mount.addEventListener('input', function(e){
    if (!e.target.matches('[data-hs]')) return; var v = e.target.value.trim().toLowerCase(), n = 0;
    [].forEach.call(mount.querySelectorAll('.vk-p--help .vk-q'), function(d){ var hit = !v || d.textContent.toLowerCase().indexOf(v) > -1; d.hidden = !hit; if (hit) n++; });
    var no = mount.querySelector('.vk-hs__none'); if (no) no.hidden = n > 0;
  });
  mount.addEventListener('click', function(e){
    var c = e.target.closest('[data-hq]'); if (c) { var inp = mount.querySelector('[data-hs]'); inp.value = c.getAttribute('data-hq'); inp.dispatchEvent(new Event('input', { bubbles: true })); var d = mount.querySelector('.vk-p--help .vk-q:not([hidden])'); if (d) d.open = true; return; }
    var v = e.target.closest('[data-av]'); if (v) { var o2 = qa()[+v.getAttribute('data-av')], ch2 = mount.querySelector('.vk-av__chat'); ch2.innerHTML = avMsg(o2); [].forEach.call(mount.querySelectorAll('[data-av]'), function(x){ x.classList.toggle('on', x === v); }); return; }
    var b = e.target.closest('[data-ai]'); if (!b) return; var o = qa()[+b.getAttribute('data-ai')], ch = mount.querySelector('.vk-as__chat'), av = mount.querySelector('.vk-as__a .vk-as__av').outerHTML;
    ch.insertAdjacentHTML('beforeend', '<div class="vk-as__q">' + o.t + '</div><div class="vk-as__a">' + av + '<p>' + o.a + '</p></div>'); b.classList.add('on');
  });
}
function wireSlide(){
  mount.addEventListener('pointerdown', function(e){
    var th = e.target.closest('.vk-slide__thumb'); if (!th || th.disabled) return;
    var sl = th.parentNode, c = sl.closest('[data-door]'); if (c.getAttribute('data-door') !== 'idle') return;
    e.preventDefault(); try { th.setPointerCapture(e.pointerId); } catch (_) {}
    var x0 = e.clientX, max = sl.clientWidth - th.offsetWidth - 8, x = 0, fill = sl.querySelector('.vk-slide__fill'), lbl = sl.querySelector('.vk-slide__lbl');
    sl.classList.add('is-drag');
    var move = function(ev){ x = Math.max(0, Math.min(max, ev.clientX - x0)); th.style.transform = 'translateX(' + x + 'px)'; fill.style.width = (x + th.offsetWidth + 8) + 'px'; lbl.style.opacity = String(Math.max(0, 1 - x / (max * .6))); sl.classList.toggle('is-far', x > max * .6); th.setAttribute('aria-valuenow', String(Math.round(x / max * 100))); };
    var up = function(){
      th.removeEventListener('pointermove', move); th.removeEventListener('pointerup', up); th.removeEventListener('pointercancel', up); sl.classList.remove('is-drag'); lbl.style.opacity = '';
      if (x >= max * .82) finishSlide(sl); else { th.style.transform = ''; fill.style.width = ''; th.setAttribute('aria-valuenow', '0'); sl.classList.remove('is-far'); }
    };
    th.addEventListener('pointermove', move); th.addEventListener('pointerup', up); th.addEventListener('pointercancel', up);
  });
  mount.addEventListener('keydown', function(e){
    var th = e.target.closest('.vk-slide__thumb'); if (!th || th.disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); finishSlide(th.parentNode); }
  });
}
function flash(a, t){ var s = a.querySelector('span') || a, o = s.textContent; s.textContent = t; setTimeout(function(){ s.textContent = o; }, 1400); }
function onKeysClick(e){
  var a = e.target.closest('[data-vk]'); if (!a) return;
  e.preventDefault(); e.stopPropagation();
  var k = a.getAttribute('data-vk');
  if (k === 'go') location.href = (a.getAttribute('data-step') === 'pay' ? 'cart' : 'hub-after-1') + EXT;
  else if (k === 'home') location.href = 'home' + EXT;
  else if (k === 'notify') { notified = true; render(); }
  else if (k === 'cal') { onCal = !onCal; render(); }
  else if (k === 'host') flash(a, 'Opening chat…');
  else if (k === 'zoom') zoomPhoto(a.getAttribute('data-src'));
  else if (k === 'copyaddr') { try { navigator.clipboard.writeText('Calle Mayor 12, 3º B, 02001 Albacete, Spain'); } catch (_) {} a.classList.add('is-copied'); a.setAttribute('aria-label', 'Copied'); clearTimeout(a._cpT); a._cpT = setTimeout(function(){ a.classList.remove('is-copied'); a.setAttribute('aria-label', 'Copy address'); }, 1400); }   /* el icono pasa a check verde; no se cambia el contenido */

  else if (k === 'mopen') { if (a._busy) return; a._busy = true; sendDoor(a); a.classList.remove('is-fail'); var kr = a.closest('.vk-rt4__k'), row = kr ? null : a.closest('li'), oldF = kr ? (kr.nextElementSibling && kr.nextElementSibling.classList.contains('vk-fail') ? kr.nextElementSibling : null) : (row && row.querySelector('.vk-fail')); if (oldF) oldF.parentNode.removeChild(oldF); a.querySelector('span').textContent = 'Opening…'; setTimeout(function(){ var bad = op === 'fail'; a.classList.add(bad ? 'is-fail' : 'is-copied'); a.querySelector('span').textContent = bad ? 'Failed' : 'Opened';
      var fh = '<div class="vk-fail" role="alert">' + ic('alert', 16) + '<span><b>The door didn’t open.</b> Make sure you’re at the door and your phone is online, then try again. Still stuck? Message your host.</span></div>';
      if (bad && kr) kr.insertAdjacentHTML('afterend', fh); else if (bad && row) row.insertAdjacentHTML('beforeend', fh);   /* el motivo, debajo de la fila */ setTimeout(function(){ a.classList.remove('is-copied'); a._busy = false; a.querySelector('span').textContent = bad ? 'Retry' : 'Open'; }, 3200); }, 1200); }
  else if (k === 'maps') { if (a.classList.contains('vk-place3__m')) { a.classList.add('is-on'); setTimeout(function(){ a.classList.remove('is-on'); }, 900); } else flash(a, 'Opening Maps…'); }   /* el botón pequeño «Maps» no cambia de texto (se saldría) */
  else if (k === 'tab') selectTab(a.getAttribute('data-tab'));
  else if (k === 'door') pickDoor(+a.getAttribute('data-i'));
  else if (k === 'node') routeGo(+a.getAttribute('data-i'));
  else if (k === 'st-next') stGo(stIdx + 1, true);
  else if (k === 'st-prev') stGo(stIdx - 1, true);
  else if (k === 'st-go') stGo(+a.getAttribute('data-i'), true);
  else if (k === 'toastx') { var tt = a.closest('.vk-toast'); tt.classList.add('is-out'); setTimeout(function(){ if (tt.parentNode) tt.parentNode.removeChild(tt); }, 300); }
  else if (k === 'open') openDoor(a);
  else if (k === 'show') { var c = a.closest('[data-show]'), on = c.getAttribute('data-show') === '1'; c.setAttribute('data-show', on ? '0' : '1'); a.querySelector('span').textContent = on ? 'Show code' : 'Hide code'; if (!on) kpType(c); }
  else if (k === 'copy') {
    var pc = a.closest('[data-code]') || (a.closest('.vk-ag') && a.closest('.vk-ag').querySelector('[data-code]')), d = pc.getAttribute('data-code');
    try { navigator.clipboard.writeText(d); } catch (_) {} kpType(pc);
    var host = a.closest('.vk-cp') || (a.closest('.vk-ag') && a.closest('.vk-ag').querySelector('.vk-cp')) || a, icb = a.closest('.vk-ag') && a.closest('.vk-ag').querySelector('.vk-cp__ic');
    host.classList.add('is-copied'); a.classList.add('is-copied'); if (icb) icb.classList.add('is-copied');
    var s = a.querySelector('span[data-l]') || host.querySelector('span[data-l]') || (a.closest('.vk-cp') ? null : a.querySelector('span'));
    var o = s && (s.getAttribute('data-l') || s.textContent); if (s) s.textContent = 'Copied';
    clearTimeout(a._cpT); a._cpT = setTimeout(function(){ host.classList.remove('is-copied'); a.classList.remove('is-copied'); if (icb) icb.classList.remove('is-copied'); if (s) s.textContent = o; }, 1400);
  }
}

/* ---------- controles de la réplica ---------- */
function setQ(){ var p = new URLSearchParams(location.search); p.set('keys', state === 'open' ? 'unlocked' : state); p.set('kt', kt); p.set('kv', kv); p.delete('tb'); p.delete('cta'); p.delete('lk'); p.delete('cp'); p.set('nk', nk); p.set('op', op); p.delete('dk'); p.delete('ek'); p.delete('gv'); p.delete('av'); p.delete('hv'); p.delete('pv'); history.replaceState(null, '', location.pathname + '?' + p.toString()); }
function saveCfg(){ LS.set('replica-ra-cfg', JSON.stringify(cfg)); LS.set('replica-ra-kt', kt); LS.set('replica-ra-kv', kv); LS.set('replica-ra-nk', String(nk)); LS.set('replica-ra-op', op); LS.set('replica-ra-keys', state); }
var btnS = function(g, k, l, on, dis){ return '<button type="button" data-g="' + g + '" data-k="' + k + '" class="' + (on ? 'on' : '') + '"' + (dis ? ' disabled title="Con «Siempre» no hay espera"' : '') + '>' + l + '</button>'; };
var swV = document.createElement('div'); swV.className = 'acc-switch';
var sw = document.createElement('div'); sw.className = 'acc-switch';
var swK = document.createElement('div'); swK.className = 'acc-switch';
var swC = document.createElement('div'); swC.className = 'acc-switch acc-switch--cfg';
var swN = document.createElement('div'); swN.className = 'acc-switch';
var swO = document.createElement('div'); swO.className = 'acc-switch';
var swX = document.createElement('div'); swX.className = 'acc-switch vk-sw-lb';
var swT = document.createElement('div'); swT.className = 'acc-switch vk-sw-lb';
var ALL = [swN, swT, sw, swK, swO, swX, swC];
function paintSwitch(){
  var TN = { cur: 'Actual', t1: 'T1 · Segmentado', t2: 'T2 · Píldoras', t3: 'T3 · Iconos', t4: 'T4 · Subrayado', t5: 'T5 · Cápsula' };
  var VN = { v1: 'V1 · Pase', v2: 'V2 · Foco', v3: 'V3 · Foto', v4: 'V4 · Bento', v5: 'V5 · Puerta', v6: 'V6 · Cartera', v7: 'V7 · Camino', v8: 'V8 · Aurora', v81: 'V8.1 · Aurora', v9: 'V9 · Llavero', v10: 'V10 · Cerradura', v11: 'V11 · Historias', v12: 'V12 · Billete' };
  swN.innerHTML = '<span>Puertas</span>' + [1, 2, 3, 4, 5, 6, 7].map(function(n){ return btnS('n', String(n), String(n), nk === n); }).join('');
  swO.innerHTML = '<span>Abrir puerta</span>' + btnS('o', 'ok', 'Se abre', op === 'ok') + btnS('o', 'fail', 'Falla', op === 'fail');
  var eciOn = LS.get('rep-eci', '1') !== '0', lcoOn = LS.get('rep-lco', '1') !== '0';   /* mismo ajuste que usa el Hub */
  swX.innerHTML = '<span>Early check-in</span>' + btnS('x-eci', '1', 'Sí', eciOn) + btnS('x-eci', '0', 'No', !eciOn) + '<span>Late check-out</span>' + btnS('x-lco', '1', 'Sí', lcoOn) + btnS('x-lco', '0', 'No', !lcoOn);
  var yn = function(key, label){ var v = LS.get(key, '1') !== '0'; return '<span>' + label + '</span>' + btnS('t-' + key, '1', 'Sí', v) + btnS('t-' + key, '0', 'No', !v); };
  var hsN = parseInt(LS.get('replica-ra-hs', '3'), 10) || 3;
  swT.innerHTML = yn('replica-ra-ha', 'Maps') + yn('replica-ra-hr', 'Pasos') + yn('replica-ra-hm', 'Mensaje del anfitrión') + '<span>Nº de pasos</span>' + [1, 2, 3, 4, 5].map(function(i){ return btnS('t-replica-ra-hs', String(i), String(i), hsN === i); }).join('') + yn('replica-ra-hp', 'Fotos en los pasos');
  swV.innerHTML = '<span>Vista</span>' + KV.map(function(v){ return btnS('v', v, VN[v], kv === v); }).join('');
  var L = { locked: 'Bloqueada', soon: 'Preparada', gen: 'Generando', wait: 'Antes de llegar', open: 'Lista', moved: 'Fechas cambiadas', err: 'Error', expired: 'Caducada', revoked: 'Cancelada' };
  sw.innerHTML = '<span>Estado</span>' + STATES.map(function(s){ return btnS('s', s, L[s], state === s, s === 'soon' && cfg.when === 'any'); }).join('');
  var K = { pin: 'Código', link: 'Enlace', app: 'App', card: 'Tarjeta', mix: 'Código + enlace' };
  swK.innerHTML = '<span>Llave</span>' + KT.map(function(k){ return btnS('k', k, K[k], kt === k); }).join('');
  swC.innerHTML = '<span>Registro</span>' + btnS('reg', 'lead', 'Titular', cfg.reg === 'lead') + btnS('reg', 'all', 'Todos', cfg.reg === 'all') +
    '<span>IV</span>' + btnS('iv', 'none', 'No', cfg.iv === 'none') + btnS('iv', 'lead', 'Titular', cfg.iv === 'lead') + btnS('iv', 'all', 'Todos', cfg.iv === 'all') +
    '<span>Pagos</span>' + btnS('pay', '1', 'Sí', cfg.pay === '1') + btnS('pay', '0', 'No', cfg.pay === '0') +
    '<span>Se sueltan</span>' + btnS('when', 'any', 'Siempre', cfg.when === 'any') + btnS('when', '24h', '24 h antes', cfg.when === '24h') + btnS('when', 'day', 'Día de llegada', cfg.when === 'day');
}
function onSwitch(e){
  var t = e.target.closest('button'); if (!t || t.disabled) return; e.preventDefault(); e.stopPropagation();
  var g = t.getAttribute('data-g'), k = t.getAttribute('data-k');
  if (g === 's') state = k; else if (g === 'k') kt = k; else if (g === 'v') kv = k; else if (g === 'n') nk = +k; else if (g === 'o') op = k; else if (g.indexOf('t-') === 0) LS.set(g.slice(2), k); else if (g === 'x-eci') LS.set('rep-eci', k); else if (g === 'x-lco') LS.set('rep-lco', k); else cfg[g] = k;
  if (g === 'iv' && RANK[k] > RANK[cfg.reg]) cfg.reg = k;      /* verificar a todos exige registrar a todos */
  if (g === 'reg' && RANK[cfg.iv] > RANK[k]) cfg.iv = k;
  if (cfg.when === 'any' && state === 'soon') state = 'wait';
  saveCfg(); paintTile(); paintSwitch(); setQ(); render();
}
ALL.forEach(function(x){ x.addEventListener('click', onSwitch, true); });
function paintRA(){ var on = raOn(); if (tile) tile.style.display = on ? '' : 'none'; ALL.forEach(function(x){ var sec = x.closest('.rp-s'); if (sec) sec.style.display = on ? '' : 'none'; x.hidden = !on; }); render(); }
window.addEventListener('replica-ra-change', paintRA);

function init(){
  if (!isKeys && q.get('page') === 'keys') { location.replace('keys' + EXT + location.search.replace(/[?&]page=keys/, '').replace(/^&/, '?')); return; }
  if (isKeys && !prep()) return;
  if (isKeys) { wireSlide(); wireTilt(); wireHelp(); }
  if (window.__repPanel) { window.__repPanel.add('Nº de puertas (V8.1)', swN, 19.6); window.__repPanel.add('How to get in', swT, 19.7); window.__repPanel.add('Llaves', sw, 20); window.__repPanel.add('Tipo de llave', swK, 21); window.__repPanel.add('Abrir puerta', swO, 21.5); window.__repPanel.add('Early / late check-out', swX, 21.6); window.__repPanel.add('Condiciones RA', swC, 22); }
  else ALL.forEach(function(x){ document.body.appendChild(x); });
  paintTile(); paintSwitch(); paintRA(); setTimeout(paintRA, 0);
  document.addEventListener('click', function(e){
    var t = e.target.closest('.acc-tile'); if (t) { e.preventDefault(); e.stopPropagation(); location.href = 'keys' + EXT + location.search; return; }
    if (isKeys) onKeysClick(e);
  }, true);
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
