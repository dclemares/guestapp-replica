/* =====================================================================================
   Deal propio del anfitrión (upselling) · pantallas upsell-*
   Vista de detalle de una oferta propia, rediseñada para vender. Tres diseños (control «Diseño del deal»):
   - V1 · Directo: todo en una pantalla, la primera opción libre ya elegida y el total en la barra de compra.
   - V2 · Escaparate: foto grande, comparativa con/sin el extra, qué incluye, nota del anfitrión y otras ofertas; las opciones en una hoja.
   - V3 · Guiado: tres pasos (elegir · revisar · pagar).
   - V4 · At a glance: cuándo, dónde y para quién antes de nada; luego qué incluye y cómo funciona en tres pasos.
   - V5 · Story: el titular es el resultado y cambia con lo elegido; precio pegado a la foto y comparativa con/sin el extra.
   - V6 · Pick one: la decisión es una lista de opciones, cada una con su beneficio y su precio.
   - V7 · Express: pantalla corta con las dudas resueltas y pago con cartera en un toque, sin hoja de pago.
   - V8 · Ticket, V9 · Chat, V10 · Stories y V11 · Your day: diseños de pantalla completa con su propio lenguaje (ver su bloque más abajo).
   Pantallas: upsell-detail · upsell-options · upsell-pay · upsell-failed · upsell-confirmed · upsell-requested · upsell-approved · upsell-rejected.
   Configuración del deal (lo que permite el dashboard de Chekin) en «Ajustes de la reserva»: oferta, precio, disponibilidad, confirmación y cobro.
   Estado de la oferta (disponible, pocas unidades, agotado, fuera de plazo, ya comprado) en «Controles».
   Todo se guarda en localStorage (replica-ups-*), así el escritorio y el móvil ven lo mismo. La URL puede fijar ?st= ?cf= ?upd= (la usa upsell-flows.html).
   ===================================================================================== */
(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var m = /^upsell-(.+)$/.exec(SID); if (!m) return;
var SC = m[1];
/* los grupos de IV con QR (ivqr*.js) no pintan nada en estas pantallas: se quedan fuera del cuadro de controles (ellos se añaden al cargar la página, después de este script) */
if (window.__repPanel) { var _add = window.__repPanel.add; window.__repPanel.add = function(t){ if (/^IV /.test(t)) return; return _add.apply(this, arguments); }; }
var desk = /\.d\.html/.test(location.pathname), EXT = desk ? '.d.html' : '.m.html';
var LS = { get: function(k, d){ try { var v = localStorage.getItem('replica-ups-' + k); return v === null ? d : v; } catch (e) { return d; } }, set: function(k, v){ try { localStorage.setItem('replica-ups-' + k, v); } catch (e) {} } };
var Q = new URLSearchParams(location.search);
function opt(k, list, d, qk){ var u = qk && Q.get(qk); if (u && list.indexOf(u) > -1) LS.set(k, u); var v = LS.get(k, d); return list.indexOf(v) > -1 ? v : d; }

var IMG = '../assets/vela/deals/';
var STAY = { prop: 'Villa Calipso', host: 'Marta', guests: 2, arrive: 'Wed 25 Nov', leave: 'Fri 27 Nov', days: [['Wed', '25'], ['Thu', '26'], ['Fri', '27']] };
var TYPES = {
  early: { n: 'Early check-in', k: 'Early check-in', img: 'early-checkin.jpg', chip: 'For your arrival', base: 25, unit: 'fixed', avail: 'slots', slots: ['10:00', '11:00', '12:00', '13:00'], taken: ['10:00'], std: '15:00', mode: 'in',
    pitch: 'Skip the wait. Drop your bags and start your trip hours earlier.', incl: ['The house ready from the time you pick', 'Door code sent on the morning you arrive', 'Free luggage drop if you land even earlier'],
    quote: 'Most flights land before noon. Pick a time and I’ll have everything ready for you.',
    head: 'Start your trip hours earlier', where: 'Villa Calipso', how2: 'Your door code arrives the morning of your stay', how3: 'Walk in from the time you picked', note: 'Standard check-in is 15:00. Without this extra the house isn’t ready before then.',
    chat: 'Hi! Check-in is normally at 15:00, but I can have the house ready earlier for you.', dTitle: 'Your arrival day',
    dOff: [['Morning', 'You get to Villa Calipso', 'The house isn’t ready yet', ''], ['15:00', 'Check in', 'Standard time', '']], dOn: [['Morning', 'Check in early', 'The house is ready for you', 'key'], ['15:00', 'Standard check-in time', 'You’re already settled', 'mute']] },
  late: { n: 'Late check-out', k: 'Late check-out', img: 'habitacion.jpg', chip: 'For your last day', base: 20, unit: 'fixed', avail: 'slots', slots: ['12:00', '13:00', '14:00'], taken: [], std: '11:00', mode: 'out',
    pitch: 'Enjoy a slow last morning. Pack, have lunch, leave when you’re ready.', incl: ['Keep the house until the time you pick', 'No cleaning knock at 11:00', 'Leave the keys as usual when you go'],
    quote: 'Flying in the evening? Stay a few more hours, there’s no booking right after yours.',
    head: 'A slow last morning', where: 'Villa Calipso', how2: 'Nobody knocks at 11:00', how3: 'Leave the keys as usual at the time you picked', note: 'Standard check-out is 11:00.',
    chat: 'Hi! Check-out is normally at 11:00, but you can keep the house longer on your last day.', dTitle: 'Your last day',
    dOff: [['11:00', 'Check out', 'Standard time', ''], ['Afternoon', 'Hours to fill before you travel', 'Bags with you', 'wait']], dOn: [['11:00', 'Standard check-out time', 'The house is still yours', 'mute'], ['Afternoon', 'Check out later', 'Leave the keys as usual', 'key']] },
  parking: { n: 'Private parking', k: 'Parking', img: 'parking.jpg', chip: 'During your stay', base: 15, unit: 'night', avail: 'dates',
    pitch: 'A covered spot next to the house, so you never have to look for a space.', incl: ['Covered spot in the private garage', 'Garage remote handed over with the keys', 'In and out as often as you like'],
    quote: 'Street parking fills up fast in summer. The garage saves you a lot of stress.',
    head: 'Park at the door, every night', where: 'Private garage', how2: 'The garage remote comes with your keys', how3: 'Park in your spot, in and out any time', note: 'One car per booking.',
    chat: 'Hi! If you’re coming by car, I have a covered spot in the garage right next to the house.', dTitle: 'Your stay with a car',
    dOff: [['Arrival', 'Look for street parking', 'Spaces fill up fast in summer', 'wait'], ['Each night', 'Move the car if you have to', '', ''], ['Departure', 'Walk to wherever you parked', '', '']], dOn: [['Arrival', 'Drive straight into the garage', 'Remote handed over with your keys', 'key'], ['Each night', 'Your covered spot, in and out any time', '', 'gain'], ['Departure', 'Load the car at the door', '', '']] },
  transfer: { n: 'Airport transfer', k: 'Transfer', img: 'transfer-sedan.jpg', chip: 'For your arrival', base: 45, unit: 'fixed', avail: 'slots', slots: ['09:00', '12:00', '15:00', '18:00', '21:00'], taken: ['09:00'],
    pitch: 'A driver waits at arrivals with your name and takes you straight to the door.', incl: ['Pick-up at the airport, any terminal', 'Up to 4 passengers with luggage', 'Fixed price, tolls and waiting time included'],
    quote: 'Our usual driver, Luis, speaks English and knows exactly where to stop.',
    head: 'From arrivals to the door, no queues', where: 'Airport → Villa Calipso', how2: 'Send your flight number to your host', how3: 'Meet your driver at arrivals', note: 'Up to 4 passengers with luggage.',
    chat: 'Hi! I can send our driver to meet you at the airport and bring you straight to the door.', dTitle: 'Your arrival day',
    dOff: [['Landing', 'Find a taxi or the bus', 'Queue with your luggage', 'wait'], ['On the way', 'Explain the address', 'The price depends on the meter', ''], ['Arrival', 'Villa Calipso', '', '']], dOn: [['{slot}', 'Your driver waits at arrivals', 'With your name on a sign', 'key'], ['On the way', 'Straight to the door', 'Fixed price, tolls included', 'gain'], ['Arrival', 'Villa Calipso', '', '']] },
  basket: { n: 'Welcome basket', k: 'Basket', img: 'mesa.jpg', chip: 'Ready when you arrive', base: 18, unit: 'guest', avail: 'stock',
    pitch: 'Breakfast sorted for your first morning, with produce from the local market.', incl: ['Bread, cheese, fruit and a bottle of wine', 'Coffee, milk and orange juice', 'Waiting in the kitchen when you walk in'],
    quote: 'Everything comes from the market in town, picked up the morning you arrive.',
    head: 'Breakfast waiting when you walk in', where: 'Villa Calipso', how2: 'Your host shops the morning you arrive', how3: 'Find it in the kitchen when you walk in', note: 'Tell your host about allergies after booking.',
    chat: 'Hi! I can leave breakfast ready in the kitchen for your first morning.', dTitle: 'Your first morning',
    dOff: [['Arrival', 'An empty kitchen', 'Shops may be closed when you get in', 'wait'], ['First morning', 'Go out to find breakfast', '', '']], dOn: [['Arrival', 'Your basket is in the kitchen', 'Bread, cheese, fruit and wine', 'key'], ['First morning', 'Breakfast at home', 'Coffee, milk and orange juice', 'gain']] }
};
var UNIT = { free: 'Free', fixed: 'per booking', guest: 'per guest', night: 'per night', gn: 'per guest · night' };

/* ---------- estado (localStorage + URL) ---------- */
var S = {
  d: opt('design', ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11'], 'v1', 'upd'),
  type: opt('type', Object.keys(TYPES), 'early'),
  status: opt('state', ['ok', 'low', 'soldout', 'deadline', 'bought'], 'ok', 'st'),
  confirm: opt('confirm', ['auto', 'approval'], 'auto', 'cf'),
  charge: opt('charge', ['hold', 'charge'], 'hold'),
  deadline: LS.get('deadline', '1') === '1', xsell: LS.get('xsell', '1') === '1', social: LS.get('social', '0') === '1'
};
S.unit = opt('unit', ['free', 'fixed', 'guest', 'night', 'gn'], TYPES[S.type].unit);
S.avail = opt('avail', ['none', 'slots', 'dates', 'stock'], TYPES[S.type].avail);
if (S.status === 'low' && S.avail !== 'stock') S.status = 'ok';
if (['approved', 'rejected', 'requested'].indexOf(SC) > -1) S.confirm = 'approval';
if (SC === 'confirmed') S.confirm = 'auto';
function T(){ return TYPES[S.type]; }
function slotsOf(){ return T().slots || ['10:00', '12:00', '14:00', '16:00']; }
function takenOf(){ return T().taken || []; }
function defSel(){ var f = slotsOf().filter(function(x){ return takenOf().indexOf(x) < 0; })[0]; return { slot: S.avail === 'slots' ? f : null, day: 0, nights: [0, 1], guests: STAY.guests, qty: 1, key: S.type + S.avail + S.unit }; }
var sel = (function(){ try { var o = JSON.parse(LS.get('sel', 'null')); if (o && o.key === S.type + S.avail + S.unit) return o; } catch (e) {} return defSel(); })();
function saveSel(){ LS.set('sel', JSON.stringify(sel)); }
function nightsOn(){ return S.unit === 'night' || S.unit === 'gn'; }
function guestsOn(){ return S.unit === 'guest' || S.unit === 'gn'; }
function qtyOn(){ return S.avail === 'stock' || S.avail === 'none'; }
function stockLeft(){ return S.status === 'low' ? 2 : 5; }
function mult(){ var k = 1; if (guestsOn()) k *= sel.guests; if (nightsOn()) k *= sel.nights.length; if (qtyOn()) k *= sel.qty; return k; }
function total(){ return S.unit === 'free' ? 0 : T().base * mult(); }
function eur(n){ return (n % 1 ? n.toFixed(2).replace('.', ',') : String(n)) + '€'; }
function priceTag(){ return S.unit === 'free' ? 'Free' : eur(T().base); }
function free(){ return S.unit === 'free'; }
function appr(){ return S.confirm === 'approval'; }
function blocked(){ return S.status === 'soldout' || S.status === 'deadline'; }
function ready(){ if (S.avail === 'slots' && !sel.slot) return false; if (nightsOn() && !sel.nights.length) return false; return true; }
function when(){ var t = T(); if (nightsOn()) return sel.nights.map(function(i){ return STAY.days[i][0] + ' ' + STAY.days[i][1]; }).join(', ') + ' Nov'; if (S.avail === 'dates') return STAY.days[sel.day].join(' ') + ' Nov'; return t.mode === 'out' ? STAY.leave : STAY.arrive; }
function summary(){ var t = T(), p = [];
  if (S.avail === 'slots') p.push((t.mode === 'out' ? 'Leave at ' : t.mode === 'in' ? 'Check in at ' : 'Pick-up at ') + sel.slot);
  if (S.avail === 'dates' && !nightsOn()) p.push(STAY.days[sel.day].join(' ') + ' Nov');
  if (nightsOn()) p.push(sel.nights.length + (sel.nights.length === 1 ? ' night' : ' nights'));
  if (guestsOn()) p.push(sel.guests + (sel.guests === 1 ? ' guest' : ' guests'));
  if (qtyOn()) p.push(sel.qty + (sel.qty === 1 ? ' unit' : ' units'));
  return p.join(' · '); }
function breakdown(){ if (free()) return 'Free'; var p = [eur(T().base)]; if (guestsOn()) p.push(sel.guests + ' guest' + (sel.guests > 1 ? 's' : '')); if (nightsOn()) p.push(sel.nights.length + ' night' + (sel.nights.length > 1 ? 's' : '')); if (qtyOn() && sel.qty > 1) p.push(sel.qty + ' units'); return p.join(' × '); }
function payVerb(){ if (free()) return appr() ? 'Request for free' : 'Add for free'; return appr() ? 'Request · ' + eur(total()) : 'Pay ' + eur(total()); }

/* ---------- iconos ---------- */
var P = { x: '<path d="M18 6 6 18M6 6l12 12"/>', chk: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', no: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  apple: '<path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.9-.8-3.1-.8c-1.6 0-3 .9-3.9 2.3-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.4-1-2.4-3.9zM14.2 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" fill="currentColor" stroke="none"/>' };
function ic(n){ return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function img(t){ return IMG + t.img; }
/* Extras, «My extras» y sin extras (upsell-list · upsell-mine · upsell-empty) los pinta upsell-hub.js con estos mismos datos */
window.__UPS = { TYPES: TYPES, STAY: STAY, UNIT: UNIT, IMG: IMG, ic: ic, esc: esc, eur: eur, LS: LS, desk: desk, EXT: EXT, SC: SC };
if (['list', 'empty', 'mine'].indexOf(SC) > -1) return;

/* ---------- piezas ---------- */
function gain(withTl){ var t = T(); if (S.avail !== 'slots' || !t.std || !sel.slot) return '';
  var h = function(s){ return parseInt(s, 10); }, d = t.mode === 'in' ? h(t.std) - h(sel.slot) : h(sel.slot) - h(t.std);
  var pc = function(x){ return ((x - 8) / 8 * 100).toFixed(1) + '%'; };
  var bar = function(x, c){ return t.mode === 'in' ? '<i style="left:' + pc(h(x)) + ';right:0;background:' + c + '"></i>' : '<i style="left:0;width:' + pc(h(x)) + ';background:' + c + '"></i>'; };
  return '<div class="ups-gain"><div class="big">+' + d + 'h</div><div><b>' + (t.mode === 'in' ? 'Check in at ' + sel.slot + ' instead of ' + t.std : 'Leave at ' + sel.slot + ' instead of ' + t.std) + '</b><small>' + (t.mode === 'in' ? STAY.arrive : STAY.leave) + ' · ' + d + ' extra hour' + (d > 1 ? 's' : '') + ' of your trip</small></div></div>'
    + (withTl ? '<div class="ups-tl"><div class="row"><span>Standard</span><div class="bar">' + bar(t.std, '#c9cee4') + '</div></div><div class="row"><b>With ' + esc(t.k.toLowerCase()) + '</b><div class="bar">' + bar(sel.slot, 'var(--u-blue)') + '</div></div><div class="ticks"><span></span><div><span>08:00</span><span>12:00</span><span>16:00</span></div></div></div>' : ''); }
function stepper(k, v, min, max){ return '<div class="ups-stp"><button type="button" data-ups-st="' + k + '" data-d="-1" aria-label="Less ' + k + '"' + (v <= min || blocked() ? ' disabled' : '') + '>−</button><output>' + v + '</output><button type="button" data-ups-st="' + k + '" data-d="1" aria-label="More ' + k + '"' + (v >= max || blocked() ? ' disabled' : '') + '>+</button></div>'; }
function selectors(skip){ var t = T(), h = '';
  if (S.avail === 'slots' && skip !== 'slot') h += '<div class="ups-blk" data-blk="slot"><p class="ups-lbl">' + (t.mode === 'out' ? 'Leave at' : t.mode === 'in' ? 'Check in from' : 'Pick-up time') + '<span>' + (t.mode === 'out' ? STAY.leave : STAY.arrive) + '</span></p><div class="ups-slots">'
    + slotsOf().map(function(s){ var off = takenOf().indexOf(s) > -1; return '<button type="button" class="ups-slot" data-ups-slot="' + s + '" aria-pressed="' + (sel.slot === s) + '"' + (off || blocked() ? ' disabled' : '') + '>' + s + '<small>' + (off ? 'Taken' : free() ? 'Free' : eur(t.base)) + '</small></button>'; }).join('') + '</div></div>';
  if ((nightsOn() || S.avail === 'dates') && skip !== 'days') { var multi = nightsOn();
    h += '<div class="ups-blk" data-blk="days"><p class="ups-lbl">' + (multi ? 'Nights' : 'Day') + '<span>' + (multi ? sel.nights.length + ' of 2 selected' : 'Pick one') + '</span></p><div class="ups-days" style="grid-template-columns:repeat(' + (multi ? 2 : 3) + ',1fr)">'
      + STAY.days.slice(0, multi ? 2 : 3).map(function(d, i){ var on = multi ? sel.nights.indexOf(i) > -1 : sel.day === i; return '<button type="button" class="ups-day" data-ups-day="' + i + '" aria-pressed="' + on + '"' + (blocked() ? ' disabled' : '') + '><small>' + d[0] + '</small><b>' + d[1] + '</b></button>'; }).join('') + '</div></div>'; }
  var st = '';
  if (guestsOn()) st += '<div class="ups-step"><div><b>Guests</b><small>' + eur(t.base) + ' each' + (nightsOn() ? ' per night' : '') + '</small></div>' + stepper('guests', sel.guests, 1, STAY.guests + 2) + '</div>';
  if (qtyOn()) st += '<div class="ups-step"><div><b>Quantity</b><small>' + (S.avail === 'stock' ? (S.status === 'low' ? '<span class="ups-urg"><i></i>Only 2 left for your dates</span>' : '5 available for your dates') : 'How many you need') + '</small></div>' + stepper('qty', sel.qty, 1, S.avail === 'stock' ? stockLeft() : 9) + '</div>';
  if (st) h += '<div class="ups-blk">' + st + '</div>';
  return h; }
function banner(){
  if (S.status === 'soldout') return '<div class="ups-info warn">' + ic('no') + '<div><b>Sold out for your dates</b><br>All ' + (S.avail === 'slots' ? 'times are' : 'units are') + ' booked for this stay. Other extras below are still available.</div></div>';
  if (S.status === 'deadline') return '<div class="ups-info warn">' + ic('clock') + '<div><b>No longer available for this stay</b><br>' + STAY.host + ' takes requests until 24 h before arrival.</div></div>';
  if (S.status === 'bought') return '<div class="ups-info ok">' + ic('chk') + '<div><b>Added to your stay</b><br>' + esc(summary()) + ' · ' + (free() ? 'free' : 'paid ' + eur(total())) + '. Receipt sent by email.</div></div>';
  return ''; }
function trust(){ var t = [];
  t.push(appr() ? '<div>' + ic('msg') + (S.charge === 'hold' ? 'You’re only charged if ' + STAY.host + ' confirms' : 'Full refund if ' + STAY.host + ' can’t confirm') + '</div>' : '<div>' + ic('chk') + 'Confirmed instantly, no waiting</div>');
  t.push('<div>' + ic('lock') + 'Secure payment in the same app as your booking</div>');
  if (S.deadline && !blocked() && S.status !== 'bought') t.push('<div>' + ic('clock') + 'Book until 24 h before arrival · ' + (S.type === 'late' ? 'Thu 26 Nov' : 'Tue 24 Nov') + ', 15:00</div>');
  return '<div class="ups-trust">' + t.join('') + '</div>'; }
function incl(){ return '<ul class="ups-incl">' + T().incl.map(function(x){ return '<li><span class="ups-ck">' + ic('chk') + '</span>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
function host(){ return '<div class="ups-card ups-host"><div class="av">M</div><div><q>“' + esc(T().quote) + '”</q><small>' + STAY.host + ', your host · ' + STAY.prop + '</small></div></div>'; }
function social(){ return S.social && !blocked() ? '<div class="ups-social">' + ic('star') + '34 guests at ' + STAY.prop + ' added this in the last 6 months</div>' : ''; }
function others(){ if (!S.xsell) return ''; var ks = Object.keys(TYPES).filter(function(k){ return k !== S.type; });
  return '<div><p class="ups-lbl">Guests also add</p><div class="ups-xs">' + ks.map(function(k){ var t = TYPES[k]; return '<button type="button" class="ups-xc" data-ups-type="' + k + '"><img src="' + img(t) + '" alt=""><div><b>' + esc(t.n) + '</b><small>' + eur(t.base) + ' ' + UNIT[t.unit] + '</small></div></button>'; }).join('') + '</div></div>'; }
function lines(){ return '<div class="ups-card ups-lines"><div><span>' + esc(T().n) + '</span><span>' + esc(breakdown()) + '</span></div><div class="t"><span>Total</span><span>' + (free() ? 'Free' : eur(total())) + '</span></div></div>'; }
function apprInfo(){ if (!appr()) return '';
  return '<div class="ups-info">' + ic('info') + '<div><b>' + STAY.host + ' confirms this request.</b> ' + (free() ? 'You’ll get an email and a notification here when it’s confirmed.' : S.charge === 'hold' ? 'We hold ' + eur(total()) + ' on your card now and only charge it once it’s confirmed. If not, the hold is released.' : 'You pay ' + eur(total()) + ' now. If it can’t be confirmed, you get a full refund to the same card.') + '</div></div>'; }

/* barra de compra: qué botón y qué total */
function buyHtml(label, act, from){
  if (S.status === 'bought') return '<button type="button" class="ups-cta ghost full" data-ups-go="home">Back to your stay</button>';
  if (blocked()) return '<div class="ups-buy"><div class="tot"><b>' + priceTag() + '</b><small>' + (S.status === 'soldout' ? 'Sold out' : 'Closed') + '</small></div><button type="button" class="ups-cta" disabled>' + (S.status === 'soldout' ? 'Sold out' : 'No longer available') + '</button></div>';
  return '<div class="ups-buy"><div class="tot"><b>' + (from ? '<small style="display:inline;font-size:12px;font-weight:500;color:var(--u-sec)">from </small>' + priceTag() : free() ? 'Free' : eur(total())) + '</b><small>' + (from ? UNIT[S.unit] : mult() > 1 ? esc(breakdown()) : free() ? 'No charge' : 'total · taxes incl.') + '</small></div><button type="button" class="ups-cta" data-ups-act="' + act + '">' + label + '</button></div>'; }

/* ---------- diseños ---------- */
function v1(){ var t = T();
  return { body: '<div class="ups-hero"><img src="' + img(t) + '" alt=""></div>'
    + '<div class="ups-ttl"><span class="ups-chip b">' + esc(t.chip) + '</span><h2>' + esc(t.n) + '</h2><p>' + esc(t.pitch) + '</p><div class="ups-pl"><span class="pr">' + priceTag() + '</span><small>' + (free() ? 'offered by your host' : UNIT[S.unit]) + '</small></div></div>'
    + banner() + social() + gain(false)
    + (S.status === 'bought' ? '' : '<div class="ups-card ups-sel">' + selectors() + '</div>')
    + '<div class="ups-card">' + incl() + '</div>' + trust() + (blocked() ? others() : ''),
    buy: buyHtml(payVerb(), free() ? 'finish' : 'pay') }; }
function v2(){ var t = T();
  return { body: '<div class="ups-hero"><img src="' + img(t) + '" alt=""><span class="ups-shade"></span><div class="ups-over"><span class="ups-chip">' + esc(t.chip) + '</span><h2>' + esc(t.n) + '</h2><p>' + esc(t.pitch) + '</p></div></div>'
    + banner() + social() + (gain(true) ? '<div class="ups-card">' + gain(true) + '</div>' : '')
    + '<div class="ups-card"><p class="ups-lbl">What you get</p>' + incl() + '</div>' + host() + trust() + others(),
    buy: buyHtml(S.avail === 'slots' ? 'Choose a time' : nightsOn() || S.avail === 'dates' ? 'Choose dates' : 'Continue', 'options', true) }; }
/* ---------- V4–V7 · piezas ---------- */
function facts(){ var t = T(), w = S.avail === 'slots' && sel.slot ? (t.mode === 'out' ? STAY.leave : STAY.arrive) + ', ' + sel.slot : when();
  return '<div class="ups-facts">' + [['When', w], ['Where', t.where], ['For', guestsOn() ? sel.guests + (sel.guests === 1 ? ' guest' : ' guests') : 'Your whole booking']].map(function(f){ return '<div><small>' + f[0] + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>'; }
function how(){ var t = T(), st = [appr() ? ['Send your request', STAY.host + ' confirms it and you get a notification'] : [free() ? 'Add it in one tap' : 'Pay in the app', 'Confirmed instantly, receipt by email'], [t.how2, ''], [t.how3, '']];
  return '<div class="ups-card"><p class="ups-lbl">How it works</p><ol class="ups-how">' + st.map(function(x, i){ return '<li><i>' + (i + 1) + '</i><div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</div></li>'; }).join('') + '</ol></div>'; }
function note(){ return '<div class="ups-info">' + ic('info') + '<div><b>Good to know.</b> ' + esc(T().note) + '</div></div>'; }
function headline(){ var t = T(); if (t.std && S.avail === 'slots' && sel.slot) return t.mode === 'in' ? 'Start your trip at ' + sel.slot + ', not ' + t.std : 'Keep the house until ' + sel.slot + ', not ' + t.std; return t.head; }
function sticker(){ return '<span class="ups-stk"><b>' + priceTag() + '</b>' + (free() ? '' : '<small>' + UNIT[S.unit] + '</small>') + '</span>'; }
function chooser(){ return S.status === 'bought' ? '' : '<div class="ups-card ups-sel">' + selectors() + '</div>'; }
/* V6: cada opción es una tarjeta con lo que ganas y lo que cuesta */
function optCards(){ var t = T(), hh = function(x){ return parseInt(x, 10); }, k = guestsOn() ? sel.guests : 1;
  if (S.avail === 'slots') { var fr = slotsOf().filter(function(x){ return takenOf().indexOf(x) < 0; }), best = t.mode === 'out' ? fr[fr.length - 1] : t.mode === 'in' ? fr[0] : null;
    return slotsOf().map(function(x){ var off = takenOf().indexOf(x) > -1, d = t.std ? (t.mode === 'in' ? hh(t.std) - hh(x) : hh(x) - hh(t.std)) : 0;
      return '<button type="button" class="ups-opt" data-ups-slot="' + x + '" aria-pressed="' + (sel.slot === x) + '"' + (off || blocked() ? ' disabled' : '') + '><span class="ups-ord"></span><span class="ups-otx"><b>' + (t.mode === 'in' ? 'Check in at ' : t.mode === 'out' ? 'Leave at ' : 'Pick-up at ') + x + (x === best && !off ? '<em>Most time</em>' : '') + '</b><small>' + (off ? 'Already taken' : d ? '+' + d + ' hour' + (d > 1 ? 's' : '') + ' of your trip' : t.mode === 'out' ? STAY.leave : STAY.arrive) + '</small></span><span class="ups-opr">' + (off ? '' : free() ? 'Free' : eur(t.base * k)) + '</span></button>'; }).join(''); }
  if (nightsOn()) return [[[0, 1], 'Whole stay', 'Wed 25 – Fri 27 Nov · 2 nights', 'Every night'], [[0], 'First night only', 'Wed 25 Nov'], [[1], 'Second night only', 'Thu 26 Nov']].map(function(o){
    return '<button type="button" class="ups-opt" data-ups-nights="' + o[0].join(',') + '" aria-pressed="' + (sel.nights.join(',') === o[0].join(',')) + '"' + (blocked() ? ' disabled' : '') + '><span class="ups-ord"></span><span class="ups-otx"><b>' + o[1] + (o[3] ? '<em>' + o[3] + '</em>' : '') + '</b><small>' + o[2] + '</small></span><span class="ups-opr">' + (free() ? 'Free' : eur(t.base * k * o[0].length)) + '</span></button>'; }).join('');
  return ''; }
function faq(){ var q = [['When am I charged?', free() ? 'This extra is free. Nothing is charged.' : appr() ? (S.charge === 'hold' ? 'We hold ' + eur(total()) + ' on your card now and only charge it once ' + STAY.host + ' confirms. If not, the hold is released.' : 'You pay ' + eur(total()) + ' now. If ' + STAY.host + ' can’t confirm, you get a full refund to the same card.') : 'Right away, with the card or wallet you choose. You get a receipt by email.'],
    ['Who provides it?', STAY.host + ', your host at ' + STAY.prop + '. She is your contact if anything changes.'], ['What do I need to do after?', T().how2 + '. ' + T().how3 + '.']];
  return '<div class="ups-card ups-faq">' + q.map(function(x){ return '<details><summary>' + esc(x[0]) + '</summary><p>' + esc(x[1]) + '</p></details>'; }).join('') + '</div>'; }

/* V4 · At a glance: qué es, cuándo, dónde y para quién antes de nada; luego qué incluye y cómo funciona */
function v4(){ var t = T();
  return { body: '<div class="ups-hero"><img src="' + img(t) + '" alt=""><span class="ups-chip ups-hc">' + esc(t.chip) + '</span></div>'
    + '<div class="ups-ttl"><h2>' + esc(t.n) + '</h2><p>' + esc(t.pitch) + '</p><div class="ups-pl"><span class="pr">' + priceTag() + '</span><small>' + (free() ? 'offered by your host' : UNIT[S.unit]) + '</small></div></div>'
    + banner() + social() + facts() + chooser()
    + '<div class="ups-card"><p class="ups-lbl">What you get</p>' + incl() + '</div>' + how() + note() + trust() + (blocked() ? others() : ''),
    buy: buyHtml(payVerb(), free() ? 'finish' : 'pay') }; }
/* V5 · Story: el titular es el resultado y cambia con lo que eliges; la comparativa con/sin el extra va justo debajo */
function v5(){ var t = T();
  return { body: '<div class="ups-hero"><img src="' + img(t) + '" alt=""><span class="ups-shade"></span>' + sticker() + '<div class="ups-over"><span class="ups-chip">' + esc(t.n) + '</span><h2>' + esc(headline()) + '</h2><p>' + esc(t.pitch) + '</p></div></div>'
    + banner() + social() + (gain(true) ? '<div class="ups-card">' + gain(true) + '</div>' : '') + chooser()
    + '<div class="ups-card"><p class="ups-lbl">What you get</p>' + incl() + '</div>' + host() + how() + trust() + others(),
    buy: buyHtml(payVerb(), free() ? 'finish' : 'pay') }; }
/* V6 · Pick one: la decisión es una lista de opciones con su beneficio y su precio; el resto es apoyo */
function v6(){ var t = T(), cards = optCards(), rest = selectors(S.avail === 'slots' ? 'slot' : nightsOn() ? 'days' : '');
  return { body: '<div class="ups-hero"><img src="' + img(t) + '" alt=""><span class="ups-chip ups-hc">' + esc(t.chip) + '</span></div>'
    + '<div class="ups-ttl"><h2>' + esc(t.n) + '</h2><p>' + esc(t.pitch) + '</p></div>' + banner() + social()
    + (S.status === 'bought' ? '' : cards ? '<div><p class="ups-lbl">Choose your option<span>' + (t.mode === 'out' ? STAY.leave : S.avail === 'slots' ? STAY.arrive : '') + '</span></p><div class="ups-opts">' + cards + '</div></div>' + (rest ? '<div class="ups-card ups-sel">' + rest + '</div>' : '') : chooser())
    + '<div class="ups-card"><p class="ups-lbl">Every option includes</p>' + incl() + '</div>' + how() + trust() + (blocked() ? others() : ''),
    buy: buyHtml(payVerb(), free() ? 'finish' : 'pay') }; }
/* V7 · Express: todo lo necesario en una pantalla corta y el pago con cartera en un toque, sin hoja intermedia */
function v7(){ var t = T(), ok = !blocked() && S.status !== 'bought' && !free();
  return { body: '<div class="ups-x7"><img src="' + img(t) + '" alt=""><div><span class="ups-chip b">' + esc(t.chip) + '</span><h2>' + esc(t.n) + '</h2><p>' + esc(t.pitch) + '</p></div></div>'
    + banner() + social() + chooser() + gain(false)
    + '<div class="ups-card"><p class="ups-lbl">What you get</p>' + incl() + '</div>' + apprInfo() + faq() + (blocked() ? others() : ''),
    buy: ok ? '<div class="ups-x7b"><div class="ups-x7t"><span>' + esc(summary()) + '</span><b>' + eur(total()) + '</b></div><button type="button" class="ups-wallet" data-ups-act="charge">' + ic('apple') + (appr() ? 'Request with Pay' : 'Pay') + '</button><button type="button" class="ups-x7c" data-ups-act="pay">' + (appr() ? 'or request with card' : 'or pay with card') + '</button></div>' : buyHtml(payVerb(), 'finish') }; }
function prog(n){ var l = ['Choose', 'Review', free() ? 'Confirm' : 'Pay']; return '<div class="ups-prog">' + l.map(function(x, i){ return '<div class="' + (i + 1 < n ? 'done' : i + 1 === n ? 'on' : '') + '">' + (i + 1) + '. ' + x + '</div>'; }).join('') + '</div>'; }
function mini(){ var t = T(); return '<div class="ups-card ups-mini"><img src="' + img(t) + '" alt=""><div style="min-width:0"><b>' + esc(t.n) + '</b><small>' + esc(t.pitch) + '</small></div></div>'; }
function v3a(){ return { body: prog(1) + mini() + banner() + social() + (S.status === 'bought' ? '' : '<div class="ups-card ups-sel">' + selectors() + '</div>') + gain(false) + '<div class="ups-card"><p class="ups-lbl">What you get</p>' + incl() + '</div>', buy: buyHtml('Continue', 'options') }; }
function v3b(){ var t = T(); return { body: prog(2) + mini()
  + '<div class="ups-card"><div class="ups-rv"><span>Your choice</span><b>' + esc(summary() || '—') + '</b></div><div class="ups-rv"><span>When</span><b>' + esc(when()) + '</b></div><div class="ups-rv"><span>Confirmation</span><b>' + (appr() ? 'Host confirms' : 'Instant') + '</b></div><div class="ups-rv"><span>Change</span><button type="button" class="ups-edit" data-ups-go="detail">Edit options</button></div></div>'
  + lines() + apprInfo() + trust(), buy: buyHtml(free() ? payVerb() : 'Continue to payment', free() ? 'finish' : 'pay') }; }
function payBlock(err){ var t = T();
  return '<div class="ups-card ups-item"><img src="' + img(t) + '" alt=""><div><b>' + esc(t.n) + '</b><small>' + esc(summary()) + '</small></div><span class="pr">' + eur(total()) + '</span></div>'
    + lines() + apprInfo()
    + (err ? '<div class="ups-info warn">' + ic('alert') + '<div><b>Your card was declined.</b> Nothing was charged. Try another card or Apple Pay.</div></div>' : '')
    + '<button type="button" class="ups-wallet" data-ups-act="charge">' + ic('apple') + 'Pay</button><div class="ups-or">or pay with card</div>'
    + '<div class="ups-cardf' + (err ? ' err' : '') + '"><span>' + ic('card') + '•••• ' + (err ? '0002' : '4242') + '</span><span>12/28</span><span>•••</span></div>'
    + '<div class="ups-secure">' + ic('lock') + 'Secure payment · charged by ' + STAY.prop + '</div>'; }
function v3c(err){ return { body: prog(3) + payBlock(err), buy: '<div class="ups-buy"><div class="tot"><b>' + eur(total()) + '</b><small>total · taxes incl.</small></div><button type="button" class="ups-cta" data-ups-act="charge">' + payVerb() + '</button></div>' }; }
function sheetOptions(){ var t = T();
  return '<div class="ups-sh-h"><h3>' + esc(t.n) + '</h3><button type="button" class="ups-x" data-ups-go="detail" aria-label="Close">' + ic('x') + '</button></div>'
    + '<div class="ups-sh-b"><div class="ups-card ups-sel">' + selectors() + '</div>' + gain(false) + '</div>'
    + '<div class="ups-sh-f"><div class="ups-buy"><div class="tot"><b>' + (free() ? 'Free' : eur(total())) + '</b><small>' + esc(breakdown()) + '</small></div><button type="button" class="ups-cta" data-ups-act="' + (free() ? 'finish' : 'pay') + '">' + payVerb() + '</button></div></div>'; }
function sheetPay(err){
  return '<div class="ups-sh-h"><h3>' + (appr() ? 'Send request' : 'Confirm and pay') + '</h3><button type="button" class="ups-x" data-ups-go="' + (S.d === 'v2' ? 'options' : 'detail') + '" aria-label="Close">' + ic('x') + '</button></div>'
    + '<div class="ups-sh-b">' + payBlock(err) + '</div><div class="ups-sh-f"><button type="button" class="ups-cta full" data-ups-act="charge">' + payVerb() + '</button></div>'; }

/* ---------- resultados ---------- */
function steps(state){ return '<div class="ups-card"><ul class="ups-tline">'
  + '<li class="done"><span class="dot">' + ic('chk') + '</span><div><b>Request sent</b><small>' + (free() ? 'No charge' : S.charge === 'hold' ? eur(total()) + ' on hold, not charged' : eur(total()) + ' paid') + '</small></div></li>'
  + '<li class="' + (state === 'wait' ? 'now' : 'done') + '"><span class="dot">' + ic(state === 'wait' ? 'clock' : 'chk') + '</span><div><b>' + STAY.host + ' reviews it</b><small>' + (state === 'wait' ? 'You’ll get an email and a notification here' : 'Reviewed') + '</small></div></li>'
  + '<li class="' + (state === 'ok' ? 'done' : '') + '"><span class="dot">' + ic(state === 'no' ? 'x' : 'chk') + '</span><div><b>' + (state === 'no' ? 'Not confirmed' : 'Confirmed') + '</b><small>' + (state === 'ok' ? (S.charge === 'hold' && !free() ? eur(total()) + ' charged' : 'All set') : state === 'no' ? (free() ? 'Nothing to refund' : S.charge === 'hold' ? 'Hold released' : 'Refund issued') : 'Pending') + '</small></div></li></ul></div>'; }
function result(){ var t = T(), sum = esc(summary()), h = '', back = '<button type="button" class="ups-cta full' + (SC === 'confirmed' || SC === 'approved' ? '' : ' ghost') + '" data-ups-go="home">Back to your stay</button>';
  if (SC === 'confirmed') h = '<div class="ups-badge ok">' + ic('chk') + '</div><h2>' + esc(t.n) + ' confirmed</h2><p class="lead">' + sum + ' · ' + esc(when()) + '.<br>' + (free() ? 'Enjoy it.' : 'Paid ' + eur(total()) + '. Receipt sent to your email.') + '</p>' + lines() + others();
  else if (SC === 'requested') h = '<div class="ups-badge wait">' + ic('clock') + '</div><h2>Request sent to ' + STAY.host + '</h2><p class="lead">' + esc(t.n) + ' · ' + sum + '</p>' + steps('wait') + others();
  else if (SC === 'approved') h = '<div class="ups-badge ok">' + ic('chk') + '</div><h2>' + STAY.host + ' confirmed your ' + esc(t.n.toLowerCase()) + '</h2><p class="lead">' + sum + ' · ' + esc(when()) + '</p>' + steps('ok') + others();
  else { var alt = S.avail === 'slots' ? slotsOf().filter(function(s){ return s !== sel.slot && takenOf().indexOf(s) < 0; }).slice(-1)[0] : null;
    h = '<div class="ups-badge no">' + ic('x') + '</div><h2>' + STAY.host + ' couldn’t confirm it</h2><p class="lead">' + (free() ? 'Nothing was charged.' : S.charge === 'hold' ? 'The ' + eur(total()) + ' hold on your card has been released. You weren’t charged.' : 'We’ve refunded ' + eur(total()) + ' to your card. Banks take 5–10 days to show it.') + '</p>'
      + steps('no') + (alt ? '<div class="ups-card"><p class="ups-lbl">Still available</p><div class="ups-step" style="padding:0"><div><b>' + esc(t.n) + ' at ' + alt + '</b><small>' + (free() ? 'Free' : eur(total())) + '</small></div><button type="button" class="ups-cta" style="flex:none;height:40px;font-size:13.5px" data-ups-alt="' + alt + '">Request ' + alt + '</button></div></div>' : '') + others(); }
  return { body: h, buy: back, res: true }; }

/* =====================================================================================
   V8–V11 · diseños de pantalla completa. Cada uno tiene su propio lenguaje y no comparte piezas con V1–V7:
   - V8 · Ticket: el deal es un billete (qué, cuándo, dónde, para quién); el talón lleva el total y el pago, y al comprar se sella.
   - V9 · Chat: la anfitriona lo ofrece en una conversación; se elige con respuestas rápidas y la oferta llega como mensaje con su botón.
   - V10 · Stories: tres pantallas a toda foto (qué ganas · qué incluye · elige y paga) que avanzan solas o con un toque.
   - V11 · Your day: el día del huésped como itinerario a escala y un interruptor que lo cambia con y sin el extra.
   En móvil ocupan toda la pantalla (sin cabecera ni dock de la app); en escritorio viven en la columna central.
   ===================================================================================== */
var IMM = { v8: t8, v9: t9, v10: t10, v11: t11 };
var first = true, story = 0, storyT = 0, storyAuto = true, dayOn = true, chatGo = false;
var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
P.left = '<path d="m15 18-6-6 6-6"/>'; P.right = '<path d="m9 18 6-6-6-6"/>';
function isRes(){ return ['confirmed', 'requested', 'approved', 'rejected'].indexOf(SC) > -1; }
function locked(){ return isRes() || blocked() || S.status === 'bought'; }
/* la elección principal del deal, igual para los cuatro: franjas, noches o días */
function prim(){
  var t = T(), k = (guestsOn() ? sel.guests : 1) * (qtyOn() ? sel.qty : 1), n = nightsOn() ? Math.max(1, sel.nights.length) : 1;
  if (S.avail === 'slots') return slotsOf().map(function(x){ return { l: x, on: sel.slot === x, off: takenOf().indexOf(x) > -1, p: t.base * k * n, attr: 'data-ups-slot="' + x + '"' }; });
  if (nightsOn()) return [[[0, 1], 'Whole stay', '2 nights'], [[0], 'Wed 25', '1 night'], [[1], 'Thu 26', '1 night']].map(function(o){ var v = o[0].join(','); return { l: o[1], s: o[2], on: sel.nights.join(',') === v, off: false, p: t.base * k * o[0].length, attr: 'data-ups-nights="' + v + '"' }; });
  if (S.avail === 'dates') return STAY.days.map(function(d, i){ return { l: d[0] + ' ' + d[1], on: sel.day === i, off: false, p: t.base * k, attr: 'data-ups-day="' + i + '"' }; });
  return [];
}
function primQ(){ var t = T(); return S.avail === 'slots' ? (t.mode === 'in' ? 'What time would you like to get in?' : t.mode === 'out' ? 'Until what time would you like to stay?' : 'What time should the driver pick you up?') : nightsOn() ? 'Which nights do you need it?' : S.avail === 'dates' ? 'Which day would you like it?' : ''; }
function primA(){ var t = T(); if (S.avail === 'slots') return t.mode === 'in' ? sel.slot + ' works for me' : t.mode === 'out' ? 'Until ' + sel.slot + ', please' : 'Pick me up at ' + sel.slot; if (nightsOn()) return sel.nights.length === 2 ? 'The whole stay, please' : 'Just ' + STAY.days[sel.nights[0]].join(' ') + ' Nov'; return STAY.days[sel.day].join(' ') + ' Nov, please'; }
function whenFull(){ return S.avail === 'slots' && sel.slot ? when() + ', ' + sel.slot : when(); }
function secRows(){ var t = T(), h = '', row = function(l, s, c){ return '<div class="ups-sec"><span><b>' + l + '</b><small>' + s + '</small></span>' + c + '</div>'; };
  if (nightsOn() && S.avail === 'slots') h += row('Nights', free() ? 'Free' : eur(t.base) + ' per night', '<span class="ups-nt">' + STAY.days.slice(0, 2).map(function(d, i){ return '<button type="button" data-ups-day="' + i + '" aria-pressed="' + (sel.nights.indexOf(i) > -1) + '">' + d[0] + ' ' + d[1] + '</button>'; }).join('') + '</span>');
  if (guestsOn()) h += row('Guests', free() ? 'Free' : eur(t.base) + ' each', stepper('guests', sel.guests, 1, STAY.guests + 2));
  if (qtyOn()) h += row('Quantity', S.avail === 'stock' ? (S.status === 'low' ? 'Only 2 left for your dates' : '5 available for your dates') : 'How many you need', stepper('qty', sel.qty, 1, S.avail === 'stock' ? stockLeft() : 9));
  return h; }
function cta(){ return S.status === 'bought' ? { l: 'Back to your stay', go: 'home' } : S.status === 'soldout' ? { l: 'Sold out', dis: 1 } : S.status === 'deadline' ? { l: 'No longer available', dis: 1 } : { l: payVerb(), act: free() ? 'finish' : 'pay' }; }
function ctaBtn(cls){ var c = cta(); return '<button type="button" class="' + cls + '"' + (c.dis ? ' disabled' : c.go ? ' data-ups-go="' + c.go + '"' : ' data-ups-act="' + c.act + '"') + '>' + c.l + '</button>'; }
function assure(){ return appr() ? (free() ? STAY.host + ' confirms your request' : S.charge === 'hold' ? 'Only charged if ' + STAY.host + ' confirms' : 'Full refund if ' + STAY.host + ' can’t confirm') : free() ? 'Free, offered by your host' : 'Confirmed instantly · secure payment'; }
function dline(){ return S.deadline && !blocked() && S.status !== 'bought' ? 'Book until ' + (S.type === 'late' ? 'Thu 26 Nov' : 'Tue 24 Nov') + ', 15:00' : ''; }
function stLine(){
  if (S.status === 'soldout') return ['warn', 'Sold out for your dates', 'All ' + (S.avail === 'slots' ? 'times' : 'units') + ' are booked for this stay.'];
  if (S.status === 'deadline') return ['warn', 'No longer available for this stay', STAY.host + ' takes requests until 24 h before arrival.'];
  if (S.status === 'bought') return ['ok', 'Already added to your stay', summary() + ' · ' + (free() ? 'free' : 'paid ' + eur(total())) + '.'];
  if (S.status === 'low') return ['warn', 'Only 2 left for your dates', ''];
  return null; }
function altSlot(){ return S.avail === 'slots' ? slotsOf().filter(function(x){ return x !== sel.slot && takenOf().indexOf(x) < 0; }).slice(-1)[0] : null; }
function resInfo(){ if (!isRes()) return null; var t = T(), f = free(), e = eur(total()), hold = S.charge === 'hold';
  if (SC === 'confirmed') return { k: 'ok', stamp: 'Confirmed', h: t.n + ' confirmed', p: summary() + ' · ' + when(), m: f ? 'Nothing to pay.' : 'Paid ' + e + '. Receipt sent to your email.' };
  if (SC === 'requested') return { k: 'wait', stamp: 'Pending', h: 'Request sent to ' + STAY.host, p: t.n + ' · ' + summary(), m: f ? 'No charge.' : hold ? e + ' on hold, not charged.' : e + ' paid. Refunded in full if it isn’t confirmed.', n: 'You’ll get an email and a notification here when ' + STAY.host + ' answers.' };
  if (SC === 'approved') return { k: 'ok', stamp: 'Confirmed', h: STAY.host + ' confirmed your ' + t.n.toLowerCase(), p: summary() + ' · ' + when(), m: f ? 'Nothing to pay.' : hold ? e + ' charged to your card.' : 'Already paid. Receipt sent to your email.' };
  return { k: 'no', stamp: 'Not confirmed', h: STAY.host + ' couldn’t confirm it', p: t.n + ' · ' + summary(), m: f ? 'Nothing was charged.' : hold ? 'The ' + e + ' hold has been released. You weren’t charged.' : 'We’ve refunded ' + e + '. Banks take 5–10 days to show it.', alt: altSlot() }; }
function resBtns(r, a, b){ return (r.alt ? '<button type="button" class="' + a + '" data-ups-alt="' + r.alt + '">Request ' + r.alt + ' instead</button>' : '') + '<button type="button" class="' + (r.alt ? b : a) + '" data-ups-go="home">Back to your stay</button>'; }
function ticks(){ return T().incl.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join(''); }
function backBtn(c){ return '<button type="button" class="' + c + '" data-ups-go="home" aria-label="Back to your stay">' + ic('left') + '</button>'; }

/* ---------- V8 · Ticket ---------- */
function bigVal(){ var t = T();
  if (S.avail === 'slots') return [sel.slot, t.std ? 'instead of <s>' + t.std + '</s> · +' + Math.abs(parseInt(t.std, 10) - parseInt(sel.slot, 10)) + ' h' : (t.mode === 'out' ? STAY.leave : STAY.arrive)];
  if (nightsOn()) return [sel.nights.length + (sel.nights.length === 1 ? ' night' : ' nights'), esc(when())];
  if (S.avail === 'dates') return [STAY.days[sel.day].join(' '), 'November'];
  if (guestsOn()) return [sel.guests + (sel.guests === 1 ? ' guest' : ' guests'), 'ready when you arrive'];
  return ['× ' + sel.qty, sel.qty === 1 ? 'one for your booking' : 'for your booking']; }
function t8(){ var t = T(), r = resInfo(), bv = bigVal(), ps = prim(), st = stLine(), lk = locked(), stub;
  var arrow = function(d, l){ return ps.length && !lk ? '<button type="button" data-ups-cyc="' + d + '" aria-label="' + l + '">' + ic(d < 0 ? 'left' : 'right') + '</button>' : '<span></span>'; };
  if (r) stub = '<span class="u8-stamp ' + r.k + '">' + r.stamp + '</span><p class="u8-rm"><b>' + esc(r.h) + '</b>' + esc(r.m) + (r.n ? ' ' + esc(r.n) : '') + '</p>' + (r.k === 'ok' ? '<div class="u8-code" aria-hidden="true"></div>' : '') + '<div class="u8-bt">' + resBtns(r, 'u8-pay', 'u8-gh') + '</div>';
  else if (S.status === 'bought') stub = '<span class="u8-stamp ok">Added</span><p class="u8-rm"><b>Already part of your stay</b>' + (free() ? 'Free.' : 'Paid ' + eur(total()) + '.') + ' Receipt sent by email.</p><div class="u8-code" aria-hidden="true"></div><div class="u8-bt">' + ctaBtn('u8-pay') + '</div>';
  else stub = '<div class="u8-tot"><small>Total</small><b>' + (free() ? 'Free' : eur(total())) + '</b><em>' + (mult() > 1 ? esc(breakdown()) : free() ? 'offered by your host' : UNIT[S.unit]) + '</em></div>' + ctaBtn('u8-pay');
  return '<div class="u8-top">' + backBtn('u8-back') + '<span>' + STAY.prop + ' · extra for your stay</span></div>'
    + '<div class="u8-tk"><div class="u8-ph"><img src="' + img(t) + '" alt=""><span>' + esc(t.chip) + '</span></div>'
    + '<div class="u8-main"><p class="u8-k">' + esc(t.n) + '</p>'
    + '<div class="u8-val">' + arrow(-1, 'Previous option') + '<div><b>' + bv[0] + '</b><small>' + bv[1] + '</small></div>' + arrow(1, 'Next option') + '</div>'
    + (ps.length && !lk ? '<div class="u8-alt">' + ps.map(function(o){ return '<button type="button" ' + o.attr + ' aria-pressed="' + o.on + '"' + (o.off ? ' disabled' : '') + '>' + o.l + '</button>'; }).join('') + '</div>' : '')
    + (st && !r && S.status !== 'bought' ? '<p class="u8-st"><b>' + st[1] + '</b> ' + st[2] + '</p>' : '')
    + '<dl class="u8-f">' + [['Date', when()], ['Place', t.where], ['For', guestsOn() ? sel.guests + (sel.guests === 1 ? ' guest' : ' guests') : 'Your whole booking'], ['Provided by', STAY.host + ', your host']].map(function(f){ return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>'
    + (lk ? '' : secRows()) + '<ul class="u8-in">' + ticks() + '</ul></div>'
    + '<div class="u8-perf"></div><div class="u8-stub">' + stub + '</div></div>'
    + (lk ? '' : '<p class="u8-as">' + assure() + (dline() ? ' · ' + dline() : '') + '</p>'); }

/* ---------- V9 · Chat ---------- */
function chatDone(){ return !prim().length || LS.get('chat', '') === sel.key || isRes() || S.status === 'bought'; }
function t9(){ var t = T(), r = resInfo(), st = stLine(), ps = prim(), done = chatDone(), h = '';
  var H = function(x, c){ return '<div class="u9-m h' + (c ? ' ' + c : '') + '">' + x + '</div>'; }, G = function(x){ return '<div class="u9-m g"><p>' + esc(x) + '</p></div>'; }, Y = function(x, c){ return '<div class="u9-sys' + (c ? ' ' + c : '') + '">' + x + '</div>'; };
  var QR = function(x){ return '<div class="u9-qr">' + x + '</div>'; }, home = '<button type="button" data-ups-go="home">Back to your stay</button>';
  h += '<div class="u9-day">' + (t.mode === 'out' ? 'Before you leave' : 'Before you arrive') + '</div>';
  h += H('<div class="u9-img"><img src="' + img(t) + '" alt=""><span><b>' + esc(t.n) + '</b>' + priceTag() + (free() ? '' : ' ' + UNIT[S.unit]) + '</span></div><p>' + esc(t.chat) + '</p>');
  h += H('<p>Here’s what you get:</p><ul>' + ticks() + '</ul>');
  if (blocked()) { h += Y('<b>' + st[1] + '.</b> ' + st[2], 'warn');
    if (S.xsell) h += H('<p>These are still available for your stay:</p>') + QR(Object.keys(TYPES).filter(function(k){ return k !== S.type; }).map(function(k){ return '<button type="button" data-ups-type="' + k + '">' + esc(TYPES[k].n) + ' · ' + eur(TYPES[k].base) + '</button>'; }).join(''));
    return head9() + '<div class="u9-th">' + h + QR(home) + '</div>'; }
  if (S.status === 'low') h += Y('Only 2 left for your dates', 'warn');
  if (ps.length) { h += H('<p>' + primQ() + '</p>');
    if (!done) h += QR(ps.map(function(o){ return '<button type="button" ' + o.attr + ' data-ups-chat="1"' + (o.off ? ' disabled' : '') + '>' + o.l + (o.off ? ' · taken' : free() ? '' : ' · ' + eur(o.p)) + '</button>'; }).join('')); }
  if (done) { if (ps.length) h += G(primA());
    h += H((r || S.status === 'bought' ? '' : '<p>' + (ps.length ? 'Perfect. Here’s your ' + esc(t.n.toLowerCase()) + ':' : 'Here it is, ready to add:') + '</p>')
      + '<div class="u9-oc"><b>' + esc(t.n) + '</b><div class="u9-or"><span>When</span><b>' + esc(whenFull()) + '</b></div><div class="u9-or"><span>Where</span><b>' + esc(t.where) + '</b></div>' + (r || S.status === 'bought' ? '' : secRows())
      + '<div class="u9-or t"><span>Total</span><b>' + (free() ? 'Free' : eur(total())) + '</b></div>' + (r || S.status === 'bought' ? '' : ctaBtn('u9-pay') + (ps.length ? '<button type="button" class="u9-chg" data-ups-chat="0">Change my answer</button>' : '')) + '</div>', 'u9-of');
    if (SC === 'failed') h += Y('<b>Card declined.</b> Nothing was charged.', 'warn');
    else if (!r && S.status !== 'bought') h += Y(assure() + (dline() ? ' · ' + dline() : '')); }
  if (S.status === 'bought' && !r) h += Y('<b>Already added to your stay.</b> ' + (free() ? 'Free.' : 'Paid ' + eur(total()) + '.'), 'ok') + QR(home);
  if (r) {
    if (SC === 'confirmed') h += Y(esc(r.m), 'ok') + H('<p>All set! ' + esc(t.how2) + '. See you soon.</p>') + QR(home);
    else if (SC === 'requested') h += G('Request sent') + Y(esc(r.m)) + H('<span class="u9-dots" role="img" aria-label="' + STAY.host + ' is reviewing your request"><i></i><i></i><i></i></span>') + Y(esc(r.n)) + QR(home);
    else if (SC === 'approved') h += H('<p>Good news, it’s confirmed! ' + esc(t.how2) + '.</p>') + Y(esc(r.m), 'ok') + QR(home);
    else h += H('<p>I’m sorry, I can’t make it work this time.' + (r.alt ? ' I can still do ' + r.alt + ' if that helps.' : '') + '</p>') + Y(esc(r.m)) + QR((r.alt ? '<button type="button" data-ups-alt="' + r.alt + '">Request ' + r.alt + ' instead</button>' : '') + home); }
  return head9() + '<div class="u9-th">' + h + '</div>'; }
function head9(){ return '<div class="u9-h">' + backBtn('u9-back') + '<span class="u9-av">M</span><span><b>' + STAY.host + '</b><small>Your host at ' + STAY.prop + '</small></span></div>'; }

/* ---------- V10 · Stories ---------- */
function t10(){ var t = T(), r = resInfo(), st = stLine(), ps = prim(), s = r ? 3 : story, c = '', foot = '';
  var jump = '<button type="button" class="u10-cta" data-ups-story="go">' + (blocked() ? 'See availability' : S.status === 'bought' ? 'See your extra' : (S.avail === 'slots' ? 'Choose your time' : nightsOn() ? 'Choose your nights' : S.avail === 'dates' ? 'Choose your day' : 'Add to my stay') + ' · ' + priceTag()) + '</button><p class="u10-hint">Tap the photo to see more</p>';
  if (r) { c = '<span class="u10-rs ' + r.k + '">' + ic(r.k === 'ok' ? 'chk' : r.k === 'wait' ? 'clock' : 'x') + '</span><h2>' + esc(r.h) + '</h2><p>' + esc(r.p) + '</p><p class="u10-m">' + esc(r.m) + (r.n ? ' ' + esc(r.n) : '') + '</p>'; foot = resBtns(r, 'u10-cta', 'u10-cta gh'); }
  else if (s === 0) { c = '<span class="u10-chip">' + esc(t.n) + '</span><h2>' + esc(headline()) + '</h2><p>' + esc(t.pitch) + '</p><div class="u10-pr"><b>' + priceTag() + '</b>' + (free() ? 'offered by your host' : UNIT[S.unit]) + '</div>'; foot = jump; }
  else if (s === 1) { c = '<h3>What you get</h3><ul class="u10-in">' + ticks() + '</ul><ol class="u10-how">' + [appr() ? 'Send your request' : free() ? 'Add it in one tap' : 'Pay in the app', t.how2, t.how3].map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="u10-note">' + esc(t.note) + '</p>'; foot = jump; }
  else { c = (st ? '<p class="u10-st ' + st[0] + '"><b>' + st[1] + '.</b> ' + st[2] + '</p>' : '')
      + (blocked() || S.status === 'bought' ? '' : '<h3>' + (primQ() || 'Add it to your stay') + '</h3>' + (ps.length ? '<div class="u10-pl">' + ps.map(function(o){ return '<button type="button" ' + o.attr + ' aria-pressed="' + o.on + '"' + (o.off ? ' disabled' : '') + '>' + o.l + '<small>' + (o.off ? 'Taken' : o.s ? o.s + (free() ? '' : ' · ' + eur(o.p)) : free() ? 'Free' : eur(o.p)) + '</small></button>'; }).join('') + '</div>' : '') + secRows())
      + '<div class="u10-sum"><span>' + esc(t.n) + (summary() ? '<br>' + esc(summary()) : '') + '</span><b>' + (free() ? 'Free' : eur(total())) + '</b></div>';
    foot = ctaBtn('u10-cta') + (blocked() || S.status === 'bought' ? '' : '<p class="u10-hint">' + assure() + (dline() ? ' · ' + dline() : '') + '</p>'); }
  return '<div class="u10" data-s="' + s + '"><img class="u10-bg" src="' + img(t) + '" alt=""><span class="u10-sh"></span>'
    + (r ? '' : '<div class="u10-bar">' + [0, 1, 2].map(function(i){ return '<i class="' + (i < s ? 'done' : i === s ? 'on' + (storyAuto && s < 2 && !RM ? ' auto' : '') : '') + '"></i>'; }).join('') + '</div>')
    + '<div class="u10-top"><span class="u10-who"><i>M</i>' + STAY.host + ' · your host</span><button type="button" class="u10-x" data-ups-go="home" aria-label="Close">' + ic('x') + '</button></div>'
    + (r ? '' : '<button type="button" class="u10-tap l" data-ups-story="-1" aria-label="Previous"></button><button type="button" class="u10-tap r" data-ups-story="1" aria-label="Next"></button>')
    + '<div class="u10-c">' + c + '</div><div class="u10-ft">' + foot + '</div></div>'; }

/* ---------- V11 · Your day ---------- */
function dayRows(on){ var t = T();
  if (t.std && S.avail === 'slots' && sel.slot) { var d = Math.abs(parseInt(t.std, 10) - parseInt(sel.slot, 10)), hs = d + ' hour' + (d > 1 ? 's' : '');
    if (t.mode === 'in') return on ? [[sel.slot, 'Check in · the house is ready', 'Door code sent that morning', 'key'], ['', hs + ' more in the house', 'Unpack, shower, lunch on the terrace', 'gain', d], [t.std, 'Standard check-in time', 'You’re already settled', 'mute']]
      : [[sel.slot, 'You get to ' + STAY.prop, 'The house isn’t ready yet', ''], ['', hs + ' waiting', 'Bags with you until check-in', 'wait', d], [t.std, 'Check in', 'Standard time', '']];
    return on ? [['09:00', 'Slow morning', 'No rush to pack', ''], [t.std, 'Standard check-out time', 'The house is still yours', 'mute'], ['', hs + ' more in the house', 'Lunch at home before you go', 'gain', d], [sel.slot, 'Check out', 'Leave the keys as usual', 'key']]
      : [['09:00', 'Pack and tidy up', 'Before the cleaning team arrives', ''], [t.std, 'Check out', 'Standard time', ''], ['', hs + ' to fill before you travel', 'Bags with you', 'wait', d]]; }
  return (on ? t.dOn : t.dOff).map(function(x){ return [x[0] === '{slot}' ? (S.avail === 'slots' && sel.slot ? sel.slot : 'Landing') : x[0], x[1], x[2], x[3]]; }); }
function t11(){ var t = T(), r = resInfo(), st = stLine(), ps = prim(), lk = !!r || S.status === 'bought', off = blocked(), on = lk ? (r ? r.k !== 'no' : true) : off ? false : dayOn, foot;
  if (r) foot = '<div class="u11-bt">' + resBtns(r, 'u11-pay', 'u11-pay gh') + '</div>';
  else if (S.status === 'bought' || off) foot = '<div class="u11-bt">' + ctaBtn('u11-pay') + '</div>';
  else if (on) foot = '<div class="u11-tot"><b>' + (free() ? 'Free' : eur(total())) + '</b><small>' + assure() + '</small></div>' + ctaBtn('u11-pay');
  else foot = '<div class="u11-bt"><button type="button" class="u11-pay nv" data-ups-sw="on">Add ' + esc(t.n.toLowerCase()) + ' · ' + priceTag() + '</button></div>';
  return '<div class="u11-top">' + backBtn('u11-back') + '<span>' + (t.mode === 'out' ? STAY.leave : STAY.arrive) + ' · ' + STAY.prop + '</span></div><h2>' + esc(t.dTitle) + '</h2>'
    + '<div class="u11-sw' + (on ? ' on' : '') + '"><img src="' + img(t) + '" alt=""><span><b>' + esc(t.n) + '</b><small>' + priceTag() + (free() ? '' : ' ' + UNIT[S.unit]) + ' · by ' + STAY.host + ', your host</small></span><button type="button" class="u11-t" role="switch" aria-checked="' + on + '" aria-label="Add ' + esc(t.n) + ' to my stay" data-ups-sw="t"' + (lk || off ? ' disabled' : '') + '><i></i></button></div>'
    + (r ? '<p class="u11-rs ' + r.k + '"><b>' + esc(r.h) + '.</b> ' + esc(r.m) + (r.n ? ' ' + esc(r.n) : '') + '</p>' : st ? '<p class="u11-rs ' + (st[0] === 'ok' ? 'ok' : 'no') + '"><b>' + st[1] + '.</b> ' + st[2] + '</p>' : '')
    + (on && !lk && (ps.length || secRows()) ? '<div class="u11-pk">' + (ps.length ? '<p>' + primQ() + '</p><div class="u11-ch">' + ps.map(function(o){ return '<button type="button" ' + o.attr + ' aria-pressed="' + o.on + '"' + (o.off ? ' disabled' : '') + '>' + o.l + '</button>'; }).join('') + '</div>' : '') + secRows() + '</div>' : '')
    + '<ol class="u11-tl">' + dayRows(on).map(function(x){ return '<li class="k-' + (x[3] || 'std') + '"' + (x[4] ? ' style="--h:' + x[4] + '"' : '') + '><time>' + x[0] + '</time><i></i><div><b>' + esc(x[1]) + '</b>' + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '</div></li>'; }).join('') + '</ol>'
    + (on ? '<div class="u11-in"><p>Included</p><ul>' + ticks() + '</ul>' + (dline() ? '<small>' + dline() + '</small>' : '') + '</div>' : '<p class="u11-hint">' + (off ? '' : 'Turn it on to see how your day changes.') + '</p>')
    + '<div class="u11-ft">' + foot + '</div>'; }
function flip(want){ if (dayOn === want) return; dayOn = want; var sw = document.querySelector('.u11-t'), box = document.querySelector('.u11-sw'); if (sw) sw.setAttribute('aria-checked', String(want)); if (box) box.classList.toggle('on', want); setTimeout(function(){ if (S.d === 'v11') keep(render); }, RM ? 0 : 260); }

/* ---------- montaje de V8–V11 ---------- */
function renderImm(){
  if (nightsOn() && !sel.nights.length) sel.nights = [0, 1];
  if (S.avail === 'slots' && !sel.slot) sel.slot = defSel().slot;
  clearTimeout(storyT);
  if (first && SC !== 'detail') { story = 2; storyAuto = false; }
  var intro = S.d === 'v11' && first && SC === 'detail' && !RM && !locked();   /* el interruptor arranca apagado y se enciende solo: se ve el día cambiar */
  if (intro) dayOn = false;
  title(T().n);
  mount.innerHTML = '<div class="ups ups-full ups-' + S.d + (first ? ' ups-in' : '') + '" data-d="' + S.d + '">' + IMM[S.d]() + '</div>';
  if (dockEl) dockEl.style.display = 'none';
  if (ov) { ov.remove(); ov = null; } document.documentElement.classList.remove('ups-lock');
  if ((SC === 'pay' || SC === 'failed') && !blocked() && S.status !== 'bought' && !free()) { ov = document.createElement('div'); ov.className = 'ups-ov'; ov.innerHTML = '<div class="ups-dim" data-ups-go="detail"></div><div class="ups-sheet" role="dialog" aria-modal="true" aria-label="Payment">' + sheetPay(SC === 'failed') + '</div>'; document.body.appendChild(ov); document.documentElement.classList.add('ups-lock'); }
  if (S.d === 'v9' && (chatGo || (first && chatDone()))) setTimeout(function(){ var f = mount.querySelector('.ups-full'), l = mount.querySelector('.u9-th').lastElementChild; if (desk) { if (l && chatGo) l.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); } else if (f) f.scrollTop = f.scrollHeight; chatGo = false; }, 30);
  if (S.d === 'v10' && storyAuto && story < 2 && !RM && !isRes()) storyT = setTimeout(function(){ if (S.d !== 'v10') return; story++; render(); }, 6000);
  if (intro) setTimeout(function(){ if (S.d === 'v11' && !dayOn) flip(true); }, 900);
  first = false;
}

/* ---------- montaje en la pantalla de la app ---------- */
var mount = null, dockEl = null, ov = null;
function title(s){ [].forEach.call(document.querySelectorAll('header span, header h1, header p, header b'), function(e){ if (e.children.length === 0 && (e.getAttribute('data-ups-t') || /^(Extras|Your Payments)$/.test(e.textContent.trim()))) { e.setAttribute('data-ups-t', '1'); e.textContent = s; } }); }
function render(){
  var sc = SC, page;
  document.documentElement.setAttribute('data-ups', S.d + ' ' + sc);
  document.documentElement.classList.toggle('ups-imm', !!IMM[S.d]);
  if (IMM[S.d]) { renderImm(); return; }
  clearTimeout(storyT);
  if (['confirmed', 'requested', 'approved', 'rejected'].indexOf(sc) > -1) page = result();
  else if (S.d === 'v3') page = sc === 'detail' ? v3a() : sc === 'options' ? v3b() : v3c(sc === 'failed');
  else page = ({ v2: v2, v4: v4, v5: v5, v6: v6, v7: v7 }[S.d] || v1)();
  title(page.res ? T().n : S.d === 'v3' ? (sc === 'detail' ? 'Choose your options' : sc === 'options' ? 'Review' : appr() ? 'Send request' : 'Pay') : T().n);
  mount.innerHTML = '<div class="ups' + (page.res ? ' ups-res' : '') + '" data-d="' + S.d + '">' + page.body + (desk ? '<div class="ups-dk">' + page.buy + '</div>' : '') + '</div>';
  if (dockEl) { var w = dockEl.querySelector('.contents') || dockEl; if (desk) dockEl.style.display = 'none'; else { dockEl.style.display = ''; w.innerHTML = '<div class="ups-dock ups-ov">' + page.buy + '</div>'; } }
  /* hojas: opciones (V2) y pago (V1 y V2) */
  if (ov) { ov.remove(); ov = null; } document.documentElement.classList.remove('ups-lock');
  var sh = S.d !== 'v3' && !page.res ? (sc === 'options' && S.d === 'v2' ? sheetOptions() : (sc === 'pay' || sc === 'failed') ? sheetPay(sc === 'failed') : '') : '';
  if (sh && !blocked() && S.status !== 'bought') { ov = document.createElement('div'); ov.className = 'ups-ov'; ov.innerHTML = '<div class="ups-dim" data-ups-go="' + (sc === 'options' || S.d !== 'v2' ? 'detail' : 'options') + '"></div><div class="ups-sheet" role="dialog" aria-modal="true" aria-label="' + (sc === 'options' ? 'Choose options' : 'Payment') + '">' + sh + '</div>'; document.body.appendChild(ov); document.documentElement.classList.add('ups-lock'); }
}
function keep(fn){ var els = [document.scrollingElement].concat([].slice.call(document.querySelectorAll('.ups-sh-b,.ups-full,.u10-c'))), pos = els.map(function(x){ return x ? x.scrollTop : 0; }); fn(); var now = [document.scrollingElement].concat([].slice.call(document.querySelectorAll('.ups-sh-b,.ups-full,.u10-c'))); now.forEach(function(x, i){ if (x && pos[i] != null) x.scrollTop = pos[i]; }); }
function go(s){ location.href = (s === 'home' ? 'home' : 'upsell-' + s) + EXT; }

function onClick(e){
  var el = e.target.closest && e.target.closest('[data-ups-go],[data-ups-act],[data-ups-slot],[data-ups-day],[data-ups-st],[data-ups-type],[data-ups-alt],[data-ups-nights],[data-ups-cyc],[data-ups-chat],[data-ups-story],[data-ups-sw]'); if (!el) return;
  e.preventDefault(); e.stopPropagation();
  clearTimeout(storyT); storyAuto = false;
  if (el.hasAttribute('data-ups-go')) { go(el.getAttribute('data-ups-go')); return; }
  if (el.hasAttribute('data-ups-chat')) { if (el.getAttribute('data-ups-chat') === '1') { LS.set('chat', sel.key); chatGo = true; } else { LS.set('chat', ''); keep(render); return; } }
  if (el.hasAttribute('data-ups-story')) { var sv = el.getAttribute('data-ups-story'); story = sv === 'go' ? 2 : Math.max(0, Math.min(2, story + (+sv))); render(); return; }
  if (el.hasAttribute('data-ups-sw')) { flip(el.getAttribute('data-ups-sw') === 'on' ? true : !dayOn); return; }
  if (el.hasAttribute('data-ups-cyc')) { var os = prim().filter(function(o){ return !o.off; }), ci = -1; os.forEach(function(o, i){ if (o.on) ci = i; }); var nx = os[(ci + (+el.getAttribute('data-ups-cyc')) + os.length) % os.length], bt = nx && document.querySelector('.u8-alt [' + nx.attr + ']'); if (bt) bt.click(); return; }
  if (el.hasAttribute('data-ups-type')) { var k = el.getAttribute('data-ups-type'); LS.set('type', k); LS.set('unit', TYPES[k].unit); LS.set('avail', TYPES[k].avail); LS.set('state', 'ok'); LS.set('sel', ''); go('detail'); return; }
  if (el.hasAttribute('data-ups-alt')) { sel.slot = el.getAttribute('data-ups-alt'); saveSel(); go('pay'); return; }
  if (el.hasAttribute('data-ups-nights')) { sel.nights = el.getAttribute('data-ups-nights').split(',').map(Number); saveSel(); keep(render); return; }
  if (el.hasAttribute('data-ups-slot')) { sel.slot = el.getAttribute('data-ups-slot'); saveSel(); keep(render); return; }
  if (el.hasAttribute('data-ups-day')) { var i = +el.getAttribute('data-ups-day'); if (nightsOn()) { var p = sel.nights.indexOf(i); if (p > -1) sel.nights.splice(p, 1); else sel.nights.push(i); sel.nights.sort(); } else sel.day = i; saveSel(); keep(render); return; }
  if (el.hasAttribute('data-ups-st')) { var key = el.getAttribute('data-ups-st'); sel[key] += +el.getAttribute('data-d'); saveSel(); keep(render); return; }
  var a = el.getAttribute('data-ups-act');
  if (!ready()) { var b = document.querySelector('.ups-blk'); if (b) { b.classList.remove('need'); void b.offsetWidth; b.classList.add('need'); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
  if (a === 'options') go('options');
  else if (a === 'pay') go('pay');
  else if (a === 'finish') go(appr() ? 'requested' : 'confirmed');
  else if (a === 'charge') {
    if (el.disabled) return;
    [].forEach.call(document.querySelectorAll('[data-ups-act="charge"]'), function(x){ x.disabled = true; if (x.classList.contains('ups-cta')) x.innerHTML = '<span class="ups-spin"></span>Processing…'; });
    setTimeout(function(){ go(SC === 'failed' || LS.get('decline', '0') !== '1' ? (appr() ? 'requested' : 'confirmed') : 'failed'); }, 1100);
  }
}

/* ---------- cuadro de controles ---------- */
var b = function(g, k, l, on, dis){ return '<button type="button" data-g="' + g + '" data-k="' + k + '" class="' + (on ? 'on' : '') + '"' + (dis ? ' disabled style="opacity:.4;cursor:not-allowed"' : '') + '>' + l + '</button>'; };
var SCN = [['detail', 'Deal'], ['options', 'Options'], ['pay', 'Payment'], ['failed', 'Payment declined'], ['confirmed', 'Confirmed'], ['requested', 'Request sent'], ['approved', 'Approved'], ['rejected', 'Rejected']];
function scnOff(k){ return (k === 'options' && S.d !== 'v2' && S.d !== 'v3') || ((k === 'pay' || k === 'failed') && free()) || (k === 'confirmed' && appr()) || (['requested', 'approved', 'rejected'].indexOf(k) > -1 && !appr()); }
var swV = document.createElement('div'); swV.className = 'acc-switch vk-sw-lb ups-sw';
var swS = document.createElement('div'); swS.className = 'acc-switch vk-sw-lb ups-sw';
var swC = document.createElement('div'); swC.className = 'acc-switch vk-sw-lb ups-sw';
function paintSw(){
  swV.innerHTML = '<span>Design</span>' + [['v1', 'V1 · Direct'], ['v2', 'V2 · Showcase'], ['v3', 'V3 · Guided'], ['v4', 'V4 · At a glance'], ['v5', 'V5 · Story'], ['v6', 'V6 · Pick one'], ['v7', 'V7 · Express'], ['v8', 'V8 · Ticket'], ['v9', 'V9 · Chat'], ['v10', 'V10 · Stories'], ['v11', 'V11 · Your day']].map(function(o){ return b('d', o[0], o[1], S.d === o[0]); }).join('')
    + '<span>Screen</span>' + SCN.map(function(o){ return b('sc', o[0], o[1], o[0] === SC, scnOff(o[0])); }).join('')
    + '<span>Offer state</span>' + [['ok', 'Available'], ['low', 'Few left'], ['soldout', 'Sold out'], ['deadline', 'Past deadline'], ['bought', 'Already bought']].map(function(o){ return b('st', o[0], o[1], S.status === o[0], o[0] === 'low' && S.avail !== 'stock'); }).join('')
    + '<span>Test card</span>' + b('dec', '0', 'Accepted', LS.get('decline', '0') !== '1') + b('dec', '1', 'Declined', LS.get('decline', '0') === '1');
  swS.innerHTML = '<span>Offer (template or custom)</span>' + [['early', 'Early check-in'], ['late', 'Late check-out'], ['parking', 'Parking'], ['transfer', 'Transfer'], ['basket', 'Custom']].map(function(o){ return b('type', o[0], o[1], S.type === o[0]); }).join('')
    + '<span>Price (to confirm)</span>' + [['free', 'Free'], ['fixed', 'Fixed'], ['guest', 'Per guest'], ['night', 'Per night'], ['gn', 'Per guest & night']].map(function(o){ return b('unit', o[0], o[1], S.unit === o[0]); }).join('')
    + '<span>Availability</span>' + [['none', 'No limit'], ['slots', 'Time slots'], ['dates', 'Days'], ['stock', 'Limited quantity']].map(function(o){ return b('avail', o[0], o[1], S.avail === o[0]); }).join('')
    + '<span>Confirmation</span>' + b('confirm', 'auto', 'Automatic', !appr()) + b('confirm', 'approval', 'Host approval', appr())
    + (appr() ? '<span>Charge with approval (to confirm)</span>' + b('charge', 'hold', 'Hold, charge on approval', S.charge === 'hold') + b('charge', 'charge', 'Charge, refund if rejected', S.charge === 'charge') : '');
  swC.innerHTML = '<span>Booking deadline (24 h before)</span>' + b('deadline', '1', 'Shown', S.deadline) + b('deadline', '0', 'Hidden', !S.deadline)
    + '<span>Other host offers</span>' + b('xsell', '1', 'Yes', S.xsell) + b('xsell', '0', 'No', !S.xsell)
    + '<span>Social proof (new data, not available today)</span>' + b('social', '1', 'Yes', S.social) + b('social', '0', 'No', !S.social);
}
function onSw(e){
  var t = e.target.closest('button[data-g]'); if (!t || t.disabled) return; e.preventDefault(); e.stopPropagation();
  var g = t.getAttribute('data-g'), k = t.getAttribute('data-k');
  if (g === 'sc') { go(k); return; }
  if (g === 'd') { LS.set('design', k); S.d = k; if (k === 'v1' && SC === 'options') { go('detail'); return; } }
  else if (g === 'st') { LS.set('state', k); S.status = k; if (k === 'soldout' || k === 'deadline' || k === 'bought') { if (SC !== 'detail') { go('detail'); return; } } }
  else if (g === 'dec') LS.set('decline', k);
  else if (g === 'type') { LS.set('type', k); LS.set('unit', TYPES[k].unit); LS.set('avail', TYPES[k].avail); LS.set('state', 'ok'); S.type = k; S.unit = TYPES[k].unit; S.avail = TYPES[k].avail; S.status = 'ok'; sel = defSel(); saveSel(); }
  else if (g === 'unit' || g === 'avail') { LS.set(g, k); S[g] = k; if (g === 'avail' && k !== 'stock' && S.status === 'low') { S.status = 'ok'; LS.set('state', 'ok'); } sel = defSel(); saveSel(); }
  else if (g === 'confirm') { LS.set('confirm', k); S.confirm = k; if (['confirmed', 'requested', 'approved', 'rejected'].indexOf(SC) > -1) { go('detail'); return; } }
  else if (g === 'charge') { LS.set('charge', k); S.charge = k; }
  else { LS.set(g, k); S[g] = k === '1'; }
  if (scnOff(SC)) { go('detail'); return; }
  paintSw(); keep(render);
}
swV.addEventListener('click', onSw, true); swS.addEventListener('click', onSw, true); swC.addEventListener('click', onSw, true);

function init(){
  document.documentElement.classList.toggle('ups-desk', desk);
  var root = document.querySelector('.ups-view'), old = root && root.querySelector('.ups-old');
  if (old) { mount = document.createElement('div'); mount.className = 'ups-mount'; old.parentNode.insertBefore(mount, old); }
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  if (dockEl) dockEl.classList.add('ivq-dock');   /* pay-views.js trata cualquier botón del dock como el «Pay» del carrito, salvo en un dock marcado así */
  if (!mount) return;
  if (scnOff(SC) && SC !== 'detail') { go('detail'); return; }
  render(); paintSw();
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov) go(SC === 'pay' && S.d === 'v2' ? 'options' : 'detail'); });
  if (window.__repPanel) {
    window.__repPanel.add('Deal · Settings', swS, 5.1);
    window.__repPanel.add('Deal · Extras', swC, 5.2);
    window.__repPanel.add('Deal · View', swV, 18.4);
  }
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
