/* =====================================================================================
   Upselling v3 · los casos de uso del flujo de upselling de Vlad, en nuestra guestapp rediseñada, pensados para convertir.
   Todo sale SOLO de lo que el anfitrión configura hoy en el dashboard de Chekin:
   - Title · Highlight · Description · Picture
   - Pricing: Price + Unit (per unit · per person · per group · per day · per pet)
     o, en Early check-in / Late check-out, franjas horarias con su precio (Check-in time / Check-out time + Price, «Add Time»)
   - Confirmation type: Auto (al momento) · Manual (lo confirma el anfitrión: se retiene y solo se cobra si acepta)
   - Delivery date: si está activo, el huésped elige día y hora
   De la reserva salen las fechas, los huéspedes y las horas estándar (check-in 15:00 · check-out 11:00): con ellas se dibuja la ganancia «+X h».
   Diseños: V1 Fotos · V2 Carruseles · V3 Lista rápida · V4 Tu estancia · V5 Pack (?d=).
   Estado de la visita: sessionStorage «ux-state» (?f= lo reinicia). Ajustes del deal: sessionStorage «ux-cfg» (los cambia flows.html).
   Una retención nunca se suma a lo que se paga.
   ===================================================================================== */
(function(){
'use strict';
var SID = (window.__SCREEN && window.__SCREEN.id) || ''; if (!/^ux-/.test(SID)) return;
if (window.__repPanel) window.__repPanel.add = function(){};   /* los controles de otros flujos de la réplica no pintan nada aquí */   /* los controles de otros flujos de la réplica no pintan nada aquí */
var SC = SID.slice(3), desk = /\.d\.html/.test(location.pathname), EXT = desk ? '.d.html' : '.m.html', Q = new URLSearchParams(location.search);
var IMG = '../assets/vela/deals/';
function isrc(f){ return /^https?:/.test(f) ? f : IMG + f; }
var UN = 'https://images.unsplash.com/photo-';
/* la reserva */
var STAY = { prop: 'Villa Calipso', host: 'Marta', guests: 2, card: 'Visa ···· 4242', checkin: '15:00', checkout: '11:00',
  days: [['Wed', '25'], ['Thu', '26'], ['Fri', '27']], range: 'Wed 25 – Fri 27 Nov' };
var TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
var UNIT = { unit: 'per unit', person: 'per person', group: 'per group', day: 'per day', pet: 'per pet' };
var QN = { unit: 'Quantity', person: 'Guests', day: 'Days', pet: 'Pets' };

/* ---------- los deals, tal como los guarda el dashboard ---------- */
var DEF = {
  early: { type: 'early', t: 'Early check-in', hl: 'Get into the house before 15:00', ds: 'Drop your bags and settle in before the standard check-in time. We check the cleaning schedule and confirm it for you.', img: 'early-checkin.jpg', cf: 'manual', slots: [['14:00', 10], ['12:00', 20], ['10:00', 35]] },
  basket: { t: 'Welcome groceries', hl: 'Breakfast waiting when you walk in', ds: 'Bread, cheese, fruit, coffee, milk, orange juice and a bottle of local wine, waiting in the kitchen when you arrive.', img: 'gb-tapas.jpg', p: 18, u: 'unit', cf: 'auto', dd: false },
  transfer: { t: 'Airport transfer', hl: 'A driver waits for you at arrivals', ds: 'Fixed price for up to 4 passengers with luggage, straight to the door of Villa Calipso. Tell us when you land and the driver will be there.', img: 'transfer-sedan.jpg', p: 45, u: 'group', cf: 'auto', dd: true },
  late: { type: 'late', t: 'Late check-out', hl: 'Keep the house longer on your last day', ds: 'Enjoy a slow last morning: pack, have lunch and leave the keys as usual when you go.', img: 'habitacion.jpg', cf: 'auto', slots: [['12:00', 15], ['14:00', 25], ['16:00', 35]] },
  parking: { t: 'Private parking', hl: 'A covered spot next to the house', ds: 'Park in the private garage next to the house. The remote is handed over with your keys.', img: 'parking.jpg', p: 15, u: 'day', cf: 'auto', dd: false },
  wine: { t: 'Wine tasting at sunset', hl: 'Five local wines at a family winery', ds: 'A small-group tasting with local cheese, 10 minutes from the house. Pick-up and drop-off included.', img: UN + '1510812431401-41d2bd2722f3?w=1000&q=70&auto=format&fit=crop', p: 30, u: 'person', cf: 'manual', dd: true },
  pet: { t: 'Bring your pet', hl: 'Bed, bowls, treats and clean-up', ds: 'Your dog is welcome. We leave a bed, bowls and a few treats, and clean up after your stay.', img: UN + '1548199973-03cce0bbc87b?w=1000&q=70&auto=format&fit=crop', p: 10, u: 'pet', cf: 'auto', dd: false },
  luggage: { t: 'Luggage drop', hl: 'Explore hands-free until check-in', ds: 'Leave your bags at the house from 9:00 on your arrival day and pick them up when you check in.', img: 'gb-hall.jpg', p: 5, u: 'unit', cf: 'auto', dd: false, hide: 1 }
};
var GAL = { early: ['gb-hall.jpg', 'room.jpg', 'gb-living.jpg'], basket: ['gb-terrace.jpg', 'gb-living2.jpg'], transfer: ['transfer-van.jpg', 'private-transfer.jpg'], late: ['room.jpg', 'gb-terrace2.jpg', 'gb-pool.jpg'],
  parking: ['gb-parking.jpg'], wine: ['gb-tapas.jpg', 'gb-terrace.jpg'], pet: ['gb-living.jpg', 'gb-terrace2.jpg'], luggage: ['room.jpg'] };
var ORDER = ['early', 'basket', 'transfer', 'late', 'parking', 'wine', 'pet'];
var O = {};
(function(){ var cfg = {}; try { cfg = JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {}; } catch (e) {}
  Object.keys(DEF).forEach(function(k){ var d = JSON.parse(JSON.stringify(DEF[k])), c = cfg[k] || {}; Object.keys(c).forEach(function(f){ d[f] = c[f]; }); d.k = k; O[k] = d; }); })();
/* horas con cuartos (12:15, 12:30, 12:45): «hrs» pasa «HH:MM» a horas decimales y «fh» las enseña como 2 o 1:30 */
function hrs(t){ var m = String(t).split(':'); return (parseFloat(m[0]) || 0) + (parseFloat(m[1]) || 0) / 60; }
function fh(d){ var m = Math.round(d * 60), w = Math.floor(m / 60), r = m % 60; return r ? w + ':' + (r < 10 ? '0' : '') + r : String(w); }
function slotted(x){ return (x.type === 'early' || x.type === 'late') && x.slots && x.slots.length; }
function sortedSlots(x){ return x.slots.slice().sort(function(a, b){ return a[0] < b[0] ? -1 : 1; }); }
function minP(x){ return slotted(x) ? Math.min.apply(null, x.slots.map(function(s){ return s[1]; })) : x.p; }
function manual(x){ return x.cf === 'manual'; }
function priceOf(k){ var x = O[k]; return (slotted(x) && x.slots.length > 1 ? 'from ' : '') + eur(minP(x)); }
function unitOf(k){ var x = O[k]; return slotted(x) ? (x.type === 'early' ? 'by check-in time' : 'by check-out time') : UNIT[x.u]; }

/* ---------- estado ---------- */
function defSel(x){ var s = { q: x.u === 'person' ? STAY.guests : 1, days: [0, 1], d: 0, time: '12:00', slot: null };
  if (slotted(x)) { var ss = sortedSlots(x); s.slot = (ss[Math.floor((ss.length - 1) / 2)] || [null])[0]; }   /* la franja del medio ya elegida */
  if (x.k === 'transfer') s.time = '13:00'; if (x.k === 'wine') { s.d = 1; s.time = '19:00'; }
  return s; }
function mult(x, s){ if (slotted(x)) return 1; if (x.u === 'group') return 1; if (x.u === 'day') return s.days.length || 1; return s.q; }
function amount(x, s){ if (slotted(x)) { var f = x.slots.filter(function(z){ return z[0] === s.slot; })[0]; return f ? f[1] : 0; } return x.p * mult(x, s); }
function dayTxt(i){ return STAY.days[i].join(' ') + ' Nov'; }
function describe(x, s){ var p = [];
  if (slotted(x)) p.push((x.type === 'early' ? 'Check in at ' : 'Check out at ') + s.slot + ' · ' + (x.type === 'early' ? dayTxt(0) : dayTxt(2)));
  else { if (x.u === 'person') p.push(s.q + (s.q > 1 ? ' people' : ' person')); if (x.u === 'unit' && s.q > 1) p.push(s.q + ' units'); if (x.u === 'pet') p.push(s.q + (s.q > 1 ? ' pets' : ' pet')); if (x.u === 'day') p.push(s.days.map(function(i){ return STAY.days[i].join(' '); }).join(', ') + ' Nov');
    if (x.dd) p.push(x.u === 'day' ? 'at ' + s.time : dayTxt(s.d) + ' · ' + s.time); }
  return p.join(' · ') || 'For your stay'; }
function preset(f){ var s = { cart: [], req: {} };
  if (f === 'mine' || f === 'declined') { s.cart.push(line('basket', defSel(O.basket)));
    var se = defSel(O.early); s.req.early = { st: f === 'declined' ? 'declined' : 'waiting', amt: amount(O.early, se), sub: describe(O.early, se), slot: se.slot, at: f === 'declined' ? 'Answered today, 09:05' : 'Sent today, 10:24' };
    var sw = defSel(O.wine); s.req.wine = { st: 'queued', amt: amount(O.wine, sw), sub: describe(O.wine, sw) }; }
  return s; }
function line(k, s){ var x = O[k]; return { id: k, n: x.t + (x.u === 'unit' && s.q > 1 ? ' × ' + s.q : ''), sub: describe(x, s), amt: amount(x, s), sel: s }; }
var st;
try { st = JSON.parse(sessionStorage.getItem('ux-state') || 'null'); } catch (e) {}
if (Q.get('f') || !st) st = preset(Q.get('f'));
function save(){ try { sessionStorage.setItem('ux-state', JSON.stringify(st)); localStorage.setItem('ux-state', JSON.stringify(st)); } catch (e) {} }   /* también en localStorage: el carrito (otra pestaña, «Open alone») lee lo mismo */
save();
try { var UXCAT = {}; Object.keys(O).forEach(function(k){ UXCAT[k] = { t: O[k].t, img: isrc(O[k].img) }; }); sessionStorage.setItem('ux-deals', JSON.stringify(UXCAT)); localStorage.setItem('ux-deals', JSON.stringify(UXCAT)); } catch (e) {}   /* título y foto de cada deal, para el mensaje de después del pago (ux-after.js) */
function inCart(k){ return st.cart.filter(function(x){ return x.id === k; })[0]; }
/* flag «In the cart» de Deal settings: mete Late check-out, Welcome groceries y Bring your pet en el carrito (pendientes de pagar); apagado, se quitan */
(function syncCart(){ var on = false; try { on = !!(JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {})._cart; } catch (e) {}
  st.cart = st.cart.filter(function(x){ return !x.auto; });
  if (on) ['early', 'basket', 'pet'].forEach(function(k){ if (!O[k] || inCart(k) || paid(k)) return; var s0 = defSel(O[k]); if (slotted(O[k])) s0.slot = sortedSlots(O[k])[O[k].type === 'early' ? 0 : O[k].slots.length - 1][0]; var l = line(k, s0); l.auto = true; st.cart.push(l); });
  /* con «Already purchased» activo, Private parking va como solicitud pendiente de aprobación del anfitrión */
  Object.keys(st.req).forEach(function(k){ if (st.req[k].auto) delete st.req[k]; });
  if (boughtOn() && O.parking && !st.req.parking && !inCart('parking')) { var sp = defSel(O.parking); st.req.parking = { st: 'waiting', amt: amount(O.parking, sp), sub: describe(O.parking, sp), at: 'Sent today, 10:24', auto: true }; }
  save(); })();
function toPay(){ return st.cart.reduce(function(a, x){ return a + x.amt; }, 0); }
function keys(states){ return Object.keys(st.req).filter(function(k){ return states.indexOf(st.req[k].st) > -1; }); }
function busy(k){ var r = st.req[k]; return r && (r.st === 'waiting' || r.st === 'queued'); }
/* comprados: los pagados en esta visita + los marcados «Already purchased» en Deal settings (solo para previsualizar) */
/* comprados: solo si el flag «Already purchased» de Deal settings está activado (Welcome groceries + Bring your pet, y lo que se pague en el flujo); desactivado = nada comprado */
function boughtOn(){ try { return !!(JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {})._bought; } catch (e) { return false; } }
function paidList(){ if (!boughtOn()) return []; var L = (st.paid || []).slice(); ['early', 'pet', 'basket'].forEach(function(k){ if (O[k] && !L.some(function(y){ return y.id === k; })) { var x = O[k], s0 = defSel(x); if (slotted(x)) s0.slot = sortedSlots(x)[x.type === 'early' ? 0 : x.slots.length - 1][0]; L.push({ id: k, n: x.t, sub: describe(x, s0), amt: amount(x, s0) }); } }); return L; }
/* lo que se paga en el flujo enciende «Already purchased» de ese deal: comprado = solo lo que tiene el flag activado */
function markBought(){ var c = {}; try { c = JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {}; } catch (e) {} c._bought = true; try { sessionStorage.setItem('ux-cfg', JSON.stringify(c)); } catch (e) {} }
/* solicitud pendiente de aprobación · 3 versiones; gris azulado neutro (esperando, no aviso); la retención nunca se suma a un cobro */
function waitCard(k, r){ var hold = '<span class="ux-wa">' + ic('lock') + eur(r.amt) + ' held</span>', cancel = '<button type="button" class="ux-lk ux-wcx" data-cancel="' + k + '">Cancel request</button>';
  /* cabecera: a la derecha «Cancel request» y, debajo, la retención; sin etiqueta «Pending approval» */
  var head = '<div class="ux-wg">' + thumb(k) + '<b class="tt">' + esc(O[k].t) + '</b>' + cancel + '<small class="dt">' + esc(r.sub) + '</small>' + hold + '</div>';   /* rejilla: título | Cancel · fechas | retención */
  if (WV === '1') return '<div class="ux-w ux-w1">' + head + '<p class="ux-wn">We usually answer within a few hours and email you.</p></div>';
  if (WV === '2') return '<div class="ux-w ux-w2">' + head + '<div class="ux-wp"><i class="on"></i><i class="on half"></i><i></i></div><div class="ux-wl"><span class="d">Sent · ' + esc(r.at.replace('Sent ', '')) + '</span><span class="c">We’re reviewing</span><span>Answer by email</span></div></div>';
  return '<div class="ux-w ux-w3">' + head + '<div class="ux-wm"><span class="av">' + ic('clock') + '</span><p><b>We’re checking it.</b> You’ll get the answer by email, usually within a few hours. The ' + eur(r.amt) + ' is only held, not charged, and is released if we can’t confirm it.</p></div></div>'; }
function paid(k){ return paidList().some(function(y){ return y.id === k; }); }
var K = O[Q.get('o')] ? Q.get('o') : 'basket', o = O[K];
var BACK = Q.get('from') === 'home' ? 'home' : 'list';   /* un deal abierto desde la home vuelve a la home, no a la lista de extras */
var sel = (inCart(K) && inCart(K).sel) || defSel(o);
var DS = ['v644'], D = 'v644';   /* única versión: V6.4.4 (2026-11-11); el resto de versiones se quitaron y cualquier enlace abre esta */
/* lista de extras: original (d=v644) o pulida (d=v644.v2); todo lo demás es la V6.4.4 */
var RAWD = Q.get('d'); if (!RAWD) { try { RAWD = sessionStorage.getItem('ux-d'); } catch (e) {} }
if (!RAWD) RAWD = 'v644.v2.hc32k2.p3.t2.b3b.w3.f6';
/* réplica: sin enlace de flows.html se abre siempre la versión final (f6) */
var FM = ((RAWD || '').match(/\.f([1-6])$/) || [])[1] || '', FV = FM ? '1' : '', EM = FM === '2' || FM === '6', EP = FM === '3', EA = FM === '4', EU = FM === '5', EC = FM === '6'; RAWD = (RAWD || '').replace(/\.f[1-6]$/, '');   /* f6 = como f2 (email en la confirmación), con «Needs approval» y el email en un solo bloque */   /* f5 = como f1, pero «Needs approval» y el email en un solo bloque */   /* f4 = el email se pide después de pagar en el carrito (Review & pay → Order history ?from=pay, ux-after.js) */   /* f3 = página solo para el email, al pulsar Request */   /* f2 = f1 con el email en la hoja de confirmación («Added to your cart») en vez de en las opciones */
   /* FV: cambios del feedback de Vlad (12-nov): contador de producción, sin sombras en escritorio, pedir el email si falta */
var RV = ((RAWD || '').match(/\.r([123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.r[123]$/, '');   /* RV: columna derecha de la lista en escritorio (1 sin columna, 2 resumen de extras, 3 cómo funciona) */
var SV = ((RAWD || '').match(/\.s([1-7])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.s[1-7]$/, '');   /* SV: B2 con resumen de la selección + CTA combinados */
var GV = ((RAWD || '').match(/\.g([123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.g[123]$/, '');   /* GV: galería de fotos en escritorio (1 rejilla 2×2, 2 grande + 2, 3 grande + 4) */
var XV = ((RAWD || '').match(/\.x([1-8])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.x[1-8]$/, ''); var DV = /^[678]$/.test(XV) ? String(XV - 5) : (XV === '2' ? '2' : ''); if (DV) XV = '2'; if (XV === '2' && !GV) GV = '3'; if (XV === '2' && !SV) SV = '6';   /* definitivo: CTA 4 con la selección en verde menta */   /* B2 elegida: descripción «label» y galería en mosaico */   /* x6–x8: B2 con 3 formas de enseñar la descripción */   /* XV 1: panel en la columna de Vela; 2–5: versiones mejoradas */   /* XV: escritorio sin Vela; en su columna, la compra (paso 2 del móvil) */
var WV = ((RAWD || '').match(/\.w([123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.w[123]$/, '');   /* WV: tarjeta de solicitud pendiente en My extras (1 fila, 2 barra fina, 3 mensaje) */
var BV = ((RAWD || '').match(/\.b(3[abc]|[123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.b(3[abc]|[123])$/, '');   /* BV: cómo se ven los deals comprados (1 apagado, 2 aparte, 3 en verde) */
var IV = ((RAWD || '').match(/\.i([123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.i[123]$/, '');   /* IV: vista de dentro del deal de mascotas (1 kit, 2 cuántas, 3 pet-friendly) */
var TV = ((RAWD || '').match(/\.t(2[a-f]|[123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.t(2[a-f]|[123])$/, '');   /* TV: vista exclusiva de mascotas */
var PV = ((RAWD || '').match(/\.p([123])$/) || [])[1] || ''; RAWD = (RAWD || '').replace(/\.p[123]$/, '');   /* PV: versión de «From our partners» */
var LV = /^v644\.v2(\.h([123]|c32k[123]|c32a[123]|c32[abc]|c3[123]|[bc][123]))?$/.test(RAWD || '') ? 'v2' : '', HV = ((RAWD || '').match(/\.h([123]|c32k[123]|c32a[123]|c32[abc]|c3[123]|[bc][123])$/) || [])[1] || '';   /* HV: destacado early + late (A, B, C) */
function isV6(){ return /^v6/.test(D); }
try { sessionStorage.setItem('ux-d', LV ? 'v644.' + LV + (HV ? '.h' + HV : '') + (PV ? '.p' + PV : '') + (TV ? '.t' + TV : '') + (IV ? '.i' + IV : '') + (BV ? '.b' + BV : '') + (WV ? '.w' + WV : '') + (XV ? '.x' + (DV && DV !== '2' ? String(+DV + 5) : XV) : '') + (GV && GV !== '3' ? '.g' + GV : '') + (SV && SV !== '6' ? '.s' + SV : '') + (RV ? '.r' + RV : '') + (FM ? '.f' + FM : '') : 'v644'); } catch (e) {}
document.documentElement.classList.toggle('ux-fv1', FV === '1'); document.documentElement.classList.toggle('ux-fm5', EU || EC); document.documentElement.classList.toggle('ux-fm6', EC);
if (LV === 'v2' && !XV) { XV = '2'; DV = '2'; } if (XV === '2') { GV = GV || '3'; SV = SV || '6'; RV = RV || '3'; }   /* versión final unificada: móvil V6.4.4 final + escritorio B2 con lista 3 */
document.documentElement.classList.toggle('ux-lv2', LV === 'v2'); if (BV) { document.documentElement.classList.add('ux-bv' + BV.charAt(0)); if (BV.length > 1) document.documentElement.classList.add('ux-bv' + BV); }   /* la v2 solo cambia estilos de la lista */


/* ---------- utilidades ---------- */
var P = { mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', right: '<path d="m9 18 6-6-6-6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', left: '<path d="M15 6l-6 6 6 6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  bag: '<path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2"/>', gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-3-6-3-6 0s4 0 6 0c2 0 6 3 6 0s-4-3-6 0"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5zM5 12h14"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  carside: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  bed: '<path d="M3 19V8M3 15h18v4M21 15v-2.5A2.5 2.5 0 0 0 18.5 10H11v5"/><circle cx="7" cy="12" r="1.8"/>', bowl: '<path d="M3 11h18c0 3.9-4 7-9 7s-9-3.1-9-7zM9 7c0-1.2 1.3-2 3-2s3 .8 3 2"/>',
  bone: '<path d="M8.5 15.5 15.5 8.5"/><path d="M15.5 8.5a2.2 2.2 0 1 1 2.6-3.1 2.2 2.2 0 1 1 1.5 3.6 2.2 2.2 0 0 1-4.1-.5zM8.5 15.5a2.2 2.2 0 1 1-2.6 3.1 2.2 2.2 0 1 1-1.5-3.6 2.2 2.2 0 0 1 4.1.5z"/>', clean: '<path d="M14 3 9 12M6 12h8l2 9H4z"/><path d="M8 16v2M12 16v2"/>',
  home: '<path d="M3 11 12 4l9 7v9H3z"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', box: '<path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/>',
  paw: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 21 3-7 3 3v5M7 12l3-4 4 1 3 3"/>', wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>' };
function ic(n, c){ return '<svg class="ux-ic' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; }
function eur(n){ return (n % 1 ? n.toFixed(2).replace('.', ',') : String(n)) + '€'; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function go(s, q){ location.href = (s === 'home' || s === 'cart' ? s : 'ux-' + s) + EXT + (q ? '?' + q : ''); }
function laneTxt(x){ return manual(x) ? 'We confirm' : 'Instant'; }
/* el «+» de la lista solo añade directo cuando no hay nada que elegir; si hay franjas o fecha, abre el deal */
function quickable(x){ return !manual(x) && !slotted(x) && !x.dd; }

/* ---------- tarjetas y filas ---------- */
function tagOf(k){ return ''; }   /* sin etiquetas «Instant» / «Marta confirms» en las tarjetas de la lista */
function tagOf_old(k){ var x = O[k], r = st.req[k];
  if (paid(k) && !inCart(k)) return '<span class="ux-tg ok">' + ic('check') + 'Confirmed</span>';
  if (inCart(k)) return '<span class="ux-tg ok">' + ic('check') + 'Added</span>';
  if (busy(k)) return '<span class="ux-tg rq">' + ic('clock') + (r.st === 'waiting' ? 'Requested' : 'Ready to send') + '</span>';
  return '<span class="ux-tg">' + ic(manual(x) ? 'user' : 'bolt') + laneTxt(x) + '</span>'; }
function addBtn(k, cls){ var x = O[k];
  if (inCart(k)) return '<button type="button" class="ux-add on ' + (cls || '') + '" data-rm="' + k + '" aria-label="Remove ' + esc(x.t) + '">' + ic('check') + '</button>';
  if (paid(k) || busy(k)) return '';
  if (quickable(x)) return '<button type="button" class="ux-add ' + (cls || '') + '" data-quick="' + k + '" aria-label="Add ' + esc(x.t) + ' · ' + priceOf(k) + '">' + ic('plus') + '</button>';
  return '<button type="button" class="ux-add ' + (cls || '') + '" data-open="' + k + '" aria-label="' + esc(x.t) + '">' + ic('right') + '</button>'; }
/* v2: unidad corta para que el precio quepa en una línea («/ day», «/ pet», «by time») */
function unitShort(k){ var x = O[k]; if (slotted(x)) return ''; return ({ unit: '/ unit', person: '/ person', day: '/ day', pet: '/ pet', group: '/ group' })[x.u] || unitOf(k); }
/* v2 · deal en fila: foto a la izquierda; título, subtítulo y precio a la derecha; botón al final */
function lrow(k){ var x = O[k], dest = (paid(k) && !inCart(k)) || busy(k) ? 'data-go="mine"' : 'data-open="' + k + '"';
  var own = paid(k) && !inCart(k), inc = !!inCart(k), pend = !own && !inc && !!st.req[k] && st.req[k].st === 'waiting';
  return '<div class="ux-lr' + (own ? ' own' : '') + (inc ? ' incart' : '') + (pend ? ' pend' : '') + '"><button type="button" class="ux-lrm" ' + dest + '><img src="' + isrc(x.img) + '" alt=""><span class="ux-lrt"><b>' + esc(x.t).replace(/-/g, '\u2011') + '</b><small>' + esc(x.hl).replace(/-/g, '\u2011') + '</small><span class="pr">' + (paid(k) && !inCart(k) ? '<em class="ux-bought">' + ic('check') + 'Purchased</em>' : inc ? '<em class="ux-bought ux-incb">' + ic('cart') + 'In your cart</em>' : pend ? '<em class="ux-bought ux-pendb">' + ic('clock') + 'Pending approval</em>' : '<strong>' + priceOf(k) + '</strong>' + (slotted(x) ? '' : ' ' + unitOf(k))) + '</span></span></button><button type="button" class="ux-add" ' + dest + ' aria-label="' + esc(x.t) + '">' + ic(own && BV.charAt(0) === '3' ? 'check' : inc ? 'cart' : pend ? 'clock' : 'right') + '</button></div>'; }
/* v2 · «Already yours»: los comprados, aparte y en pequeño, al final de «For your stay» */
function ownRows(ks){ return ks.length ? '<p class="ux-ownh">Already yours</p><div class="ux-own">' + ks.map(function(k){ var x = O[k], pl = paidList().filter(function(y){ return y.id === k; })[0] || {}; return '<button type="button" class="ux-ownr" data-go="mine"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><small>' + esc(pl.sub || '') + '</small></span><em>' + ic('check') + eur(pl.amt || 0) + '</em></button>'; }).join('') + '</div>' : ''; }
function card(k){ var x = O[k], dest = (paid(k) && !inCart(k)) || busy(k) ? 'data-go="mine"' : 'data-open="' + k + '"';
  return '<div class="ux-tile"><button type="button" class="ux-tph" ' + dest + ' aria-label="' + esc(x.t) + '"><img src="' + isrc(x.img) + '" alt=""><span class="ux-tsh"></span>' + tagOf(k)
    + '<span class="ux-tnm"><b>' + (LV === 'v2' ? esc(x.t).replace(/-/g, '\u2011') : esc(x.t)) + '</b><small>' + esc(x.hl) + '</small><span class="ux-tpr">' + (paid(k) && !inCart(k) ? 'Paid' : priceOf(k) + '<small> ' + (LV === 'v2' ? unitShort(k) : unitOf(k)) + '</small>') + '</span></span></button>' + addBtn(k) + '</div>'; }
function rowBtn(k){ var x = O[k], r = st.req[k];
  if (inCart(k)) return '<button type="button" class="ux-add on" data-rm="' + k + '" aria-label="Remove ' + esc(x.t) + '">' + ic('check') + '</button>';
  if (paid(k)) return '<span class="ux-st ok">' + ic('check') + 'Paid</span>';
  if (busy(k)) return '<button type="button" class="ux-add ux-txt" data-go="mine">' + (r.st === 'waiting' ? 'Requested' : 'In list') + '</button>';
  if (quickable(x)) return '<button type="button" class="ux-add" data-quick="' + k + '" aria-label="Add ' + esc(x.t) + '">' + ic('plus') + '</button>';
  return '<button type="button" class="ux-add ux-txt" data-open="' + k + '">' + (manual(x) ? 'Request' : 'Choose') + '</button>'; }
function row(k, hint){ var x = O[k];
  return '<div class="ux-rw"><button type="button" class="ux-rwm" data-open="' + k + '"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><small>' + esc(hint || x.hl) + '</small><em class="' + (manual(x) ? 'rq' : '') + '">' + ic(manual(x) ? 'user' : 'bolt') + laneTxt(x) + '</em></span></button>'
    + '<span class="ux-rwp"><b>' + priceOf(k) + '</b><small>' + unitOf(k) + '</small></span>' + rowBtn(k) + '</div>'; }

/* ---------- Explorar extras ---------- */
/* cabecera del destacado Early/Late en la lista (solo Vlad feedback, versión definitiva V1): horas en verde + «Check in earlier and check out later» */
function lhHead(tot){ return '<div class="ux-hCh ux-lh ux-lh1"><span><b>Make your stay up to <u>' + tot + ' h</u> longer</b><small>Check in earlier and check out later</small></span></div>'; }
function listHead(){ var d = keys(['declined']).length, w = keys(['waiting']).length, q = keys(['queued']).length, n = st.cart.length, h = FV ? '<div class="ux-top"><h2>Extras for <em>your stay</em></h2><p>Everything we offer to make your stay even better. Add what you like.</p></div>' : '<div class="ux-top"><h2>Make it <em>your stay</em></h2><p>Extras for your stay. Add them in one tap and pay with your booking.</p></div>';   /* Vlad feedback: título que dice qué es la pantalla y subtítulo con ejemplos */
  var pdN = paidList().length;
  if (LV === 'v2') { if (!(d || w || q || n || pdN)) return h; h += '<button type="button" class="ux-mine ux-mine2' + (d ? ' no' : '') + '" data-go="mine"><span class="ux-mi">' + ic(d ? 'msg' : pdN || n || w || q ? 'bag' : 'bag') + '</span><span><b>' + (d ? 'We answered your request' : 'My extras') + '</b><small>' + (d ? (LV === 'v2' ? 'See our answer' : 'See our answer and a plan B') : [pdN ? pdN + ' purchased' : '', n ? n + ' in your cart' : '', w ? w + ' waiting for approval' : '', q ? q + ' ready to send' : ''].filter(Boolean).join(' · ') || 'What you buy shows up here') + '</small></span>' + (pdN ? '<em>' + pdN + '</em>' : '') + ic('right') + '</button>'; return h; }
  if (d || w || q || n) h += '<button type="button" class="ux-mine' + (d ? ' no' : '') + '" data-go="mine"><span class="ux-mi">' + ic(d ? 'msg' : 'clock') + '</span><span><b>' + (d ? 'We answered your request' : 'My extras') + '</b><small>' + (d ? (LV === 'v2' ? 'See our answer' : 'See our answer and a plan B') : [n ? n + ' added' : '', w ? w + ' waiting for approval' : '', q ? q + ' ready to send' : ''].filter(Boolean).join(' · ')) + '</small></span>' + ic('right') + '</button>';
  return h; }
function listBar(){ return st.cart.length + keys(['queued']).length ? bar() : ''; }
function bar(){ var n = st.cart.length, q = keys(['queued']).length;
  return '<div class="ux-bar"><span><b>' + (n ? eur(toPay()) : q + ' request' + (q > 1 ? 's' : '')) + '</b><small>' + [n ? n + ' extra' + (n > 1 ? 's' : '') : '', q ? q + ' request' + (q > 1 ? 's' : '') + ' to send' : ''].filter(Boolean).join(' · ') + '</small></span><button type="button" class="ux-cta" data-go="mine">' + (n ? 'Go to cart' : 'Review') + ic('right') + '</button></div>'; }
function firstFree(){ return ORDER.filter(function(z){ return !inCart(z) && !busy(z) && !paid(z); })[0]; }
function feat(){ var k = firstFree(); if (!k) return ''; var x = O[k];   /* el primero que pone el anfitrión, con su Highlight */
  return '<button type="button" class="ux-pick" data-open="' + k + '"><img src="' + isrc(x.img) + '" alt=""><span class="ux-psh"></span>'   /* sin etiqueta «Instant» / «Marta confirms» */
    + '<span class="ux-ptx"><small>' + esc(x.t) + '</small><b>' + esc(x.hl) + '</b></span><span class="ux-pbt">' + (slotted(x) ? 'Choose your time' : manual(x) ? 'Request it' : 'Add it') + ' · ' + priceOf(k) + ic('right') + '</span></button>'; }
function partners(){ return '<div class="ux-ptn"><button type="button" class="ux-gl tr" data-partner="Mozio"><img src="' + IMG + 'transfer-van.jpg" alt=""><span class="ux-gsh"></span><span class="ux-gk">' + ic('car') + 'Private transfers</span><b>Your ride is ready when you land</b><span class="ux-gb">Book your ride' + ic('right') + '</span></button>'
  + '<button type="button" class="ux-gl tu" data-partner="GuruWalk"><img src="' + IMG + 'tour-wide.jpg" alt=""><span class="ux-gsh"></span><span class="ux-gk"><em>Free</em> walking tours</span><b>Discover the city with local guides</b><span class="ux-gb y">Explore tours' + ic('right') + '</span></button></div>'; }
/* «From our partners» · 3 versiones (p1 filas, p2 carrusel, p3 tarjeta con iconos) */
var PTN = [{ k: 'Mozio', ic: 'carside', img: 'transfer-van.jpg', tag: 'Private transfers', t: 'Your ride is ready when you land', cta: 'Book your ride', meta: '' },
  { k: 'GuruWalk', ic: 'walk', img: 'tour-wide.jpg', tag: 'Walking tours', t: 'Discover the city with local guides', cta: 'Explore tours', meta: 'Free' },
  { k: 'Airalo', ic: 'wifi', img: '', tag: 'eSIM', t: 'Mobile data with no roaming', cta: 'View plans', meta: 'from 4€' }];
function ptnV(){ var pic = function(x, c){ return x.img ? '<img class="' + c + '" src="' + IMG + x.img + '" alt="">' : '<span class="' + c + ' ux-pvg">' + ic(x.ic) + '</span>'; };
  if (PV === '1') return '<div class="ux-l2">' + PTN.map(function(x){ return '<button type="button" class="ux-pv1" data-partner="' + x.k + '">' + pic(x, 'im') + '<span class="tt"><small>' + x.k + ' · ' + x.tag + '</small><b>' + x.t + '</b>' + (x.meta ? '<em class="' + (x.meta === 'Free' ? 'fr' : '') + '">' + x.meta + '</em>' : '<em class="nm">' + x.cta + '</em>') + '</span><span class="go">' + ic('ext') + '</span></button>'; }).join('') + '</div>';
  if (PV === '2') return '<div class="ux-pv2">' + PTN.map(function(x){ return '<button type="button" class="ux-pv2c" data-partner="' + x.k + '">' + pic(x, 'im') + (x.meta === 'Free' ? '<span class="fr">Free</span>' : '') + '<span class="bd"><small>' + x.k + ' · ' + x.tag + '</small><b>' + x.t + '</b><span class="cta">' + x.cta + (x.meta && x.meta !== 'Free' ? ' · ' + x.meta : '') + ic('ext') + '</span></span></button>'; }).join('') + '</div>';
  return '<div class="ux-pv3">' + PTN.map(function(x){ return '<button type="button" class="ux-pv3r" data-partner="' + x.k + '"><span class="ico i-' + x.ic + '">' + ic(x.ic) + '</span><span class="tt"><b>' + x.tag + '</b><small>' + x.t + '</small></span>' + (x.meta ? '<em class="' + (x.meta === 'Free' ? 'fr' : '') + '">' + x.meta + '</em>' : '') + '<span class="go">' + ic('ext') + '</span></button>'; }).join('') + '<p class="ux-pv3n">' + ic('info') + 'Booked and paid on each partner\'s site, not with your stay.</p></div>'; }
function esim(){ return '<button type="button" class="ux-esim" data-partner="Airalo"><span class="ux-ei">' + ic('wifi') + '</span><span><b>Mobile data from 4€</b><small>eSIM by Airalo · no roaming, no physical SIM</small></span><span class="ux-eb">View plans</span></button>'; }
function vList(){ if (LV === 'v2') return vList1(); return ({ v2: vList2, v3: vList3, v4: vList4, v5: vList5 }[D] || vList1)(); }
/* ---------- V6.4.4 · cuatro versiones de la lista ---------- */
var MOMENT = { transfer: 0, early: 1, basket: 1, parking: 1, wine: 2, pet: 2, late: 3 }, MOMENTS = [['Before you arrive', 'plan it now'], ['When you arrive', STAY.days[0].join(' ') + ' Nov'], ['During your stay', STAY.range], ['On your last day', STAY.days[2].join(' ') + ' Nov']];
function sec(t, s){ return '<div class="ux-sec"><h3>' + t + '</h3><span>' + s + '</span></div>'; }
function tail(){ return sec('From our partners', 'booked on their site') + partners() + esim(); }
/* List 1 · por momento: cada grupo es una fila de tarjetas que se desliza */
function vListM(){ var h = listHead(); MOMENTS.forEach(function(m, i){ var ks = ORDER.filter(function(k){ return MOMENT[k] === i; }); if (!ks.length) return;
    h += sec(m[0], m[1]) + '<div class="ux-hs">' + ks.map(card).join('') + '</div>'; });
  return { body: h + tail(), bar: listBar() }; }
/* List 2 · filas compactas: todo a la vista */
function rowC(k){ var x = O[k];
  return '<div class="ux-rw ux-rwc"><button type="button" class="ux-rwm" data-open="' + k + '"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><small>' + esc(x.hl) + '</small><span class="pr"><strong>' + priceOf(k) + '</strong> ' + unitOf(k) + '<em class="' + (manual(x) ? 'rq' : '') + '">' + ic(manual(x) ? 'user' : 'bolt') + laneTxt(x) + '</em></span></span></button>' + rowBtn(k) + '</div>'; }
function vListR(){ return { body: listHead() + sec('For your stay', STAY.range) + '<div class="ux-rows">' + ORDER.map(rowC).join('') + '</div>' + tail(), bar: listBar() }; }
/* List 3 · tarjetas grandes a todo el ancho */
function bigCard(k){ var x = O[k], dest = (paid(k) && !inCart(k)) || busy(k) ? 'data-go="mine"' : 'data-open="' + k + '"';
  return '<div class="ux-big"><button type="button" class="ux-bph" ' + dest + ' aria-label="' + esc(x.t) + '"><img src="' + isrc(x.img) + '" alt=""><span class="ux-tsh"></span>' + tagOf(k) + '</button>'
    + '<div class="ux-bmeta"><button type="button" class="ux-btx" ' + dest + '><b>' + esc(x.t) + '</b><small>' + esc(x.hl) + '</small></button><span class="ux-bpr"><b>' + (paid(k) && !inCart(k) ? 'Paid' : priceOf(k)) + '</b><small>' + unitOf(k) + '</small></span>' + addBtn(k) + '</div></div>'; }
function vListB(){ return { body: listHead() + sec('For your stay', STAY.range) + '<div class="ux-bigs">' + ORDER.map(bigCard).join('') + '</div>' + tail(), bar: listBar() }; }
/* List 4 · lo que se añade al momento y lo que confirma el anfitrión, por separado */
function vListL(){ var inst = ORDER.filter(function(k){ return !manual(O[k]); }), man = ORDER.filter(function(k){ return manual(O[k]); });
  return { body: listHead() + sec(ic('bolt') + 'Add in one tap', 'confirmed instantly') + '<div class="ux-grid">' + inst.map(card).join('') + '</div>'
    + (man.length ? sec(ic('user') + 'We confirm', 'only charged once confirmed') + '<div class="ux-rows">' + man.map(rowC).join('') + '</div>' : '') + tail(), bar: listBar() }; }   /* V6 usa la lista de V1 */
/* destacado que vende early + late juntos: 3 opciones (h1 A, h2 B, h3 C) */
function hq(k){ var x = O[k]; return { x: x, dest: (paid(k) && !inCart(k)) || busy(k) ? 'data-go="mine"' : 'data-open="' + k + '"', st: inCart(k) ? 'In your cart' : busy(k) ? 'Requested' : paid(k) ? 'Purchased' : '' }; }
function heroOk(){ return HV && O.early && O.late && slotted(O.early) && slotted(O.late); }
function elHero(){ var E = hq('early'), L = hq('late'), ef = sortedSlots(E.x)[0][0], lf = sortedSlots(L.x).slice(-1)[0][0], ge = hrs(STAY.checkin) - hrs(ef), gl = hrs(lf) - hrs(STAY.checkout), pe = E.st || priceOf('early'), pl = L.st || priceOf('late');
  var tl = function(cls){ var P = function(d, h){ return ((d * 24 + hrs(h)) / 72 * 100).toFixed(2) + '%'; }, W = function(d1, h1, d2, h2){ return (((d2 * 24 + hrs(h2)) - (d1 * 24 + hrs(h1))) / 72 * 100).toFixed(2) + '%'; };
    return '<div class="ux-tl ' + (cls || '') + '"><div class="tr"><i class="e" style="left:' + P(0, ef) + ';width:' + W(0, ef, 0, STAY.checkin) + '"></i><i class="s" style="left:' + P(0, STAY.checkin) + ';width:' + W(0, STAY.checkin, 2, STAY.checkout) + '"></i><i class="l" style="left:' + P(2, STAY.checkout) + ';width:' + W(2, STAY.checkout, 2, lf) + '"></i></div>'
      + '<div class="dy">' + STAY.days.map(function(d){ return '<span>' + d[0] + ' ' + d[1] + '</span>'; }).join('') + '</div></div>'; };
  var tot = fh(ge + gl);
  if (HV === 'b1' || HV === 'b3') { var t1 = function(q, d, lbl, t, g, pr){ return '<button type="button" class="ux-hBt" ' + q.dest + '><img src="' + isrc(q.x.img) + '" alt=""><span class="ux-psh"></span><span class="ux-hBd">' + d.join(' ') + '</span><span class="ux-hBx"><small>' + lbl + '</small><b>' + t + '</b><span class="pp"><i>+' + fh(g) + ' h</i>' + pr + ic('right') + '</span></span></button>'; };
    if (HV === 'b3') return '<div class="ux-hB3"><div class="ux-hBh"><b>Arrive early, leave late</b><span>' + STAY.range + '</span></div><div class="ux-hB3r">' + t1(E, STAY.days[0], STAY.days[0].join(' ') + ' · in from', ef, ge, pe) + t1(L, STAY.days[2], STAY.days[2].join(' ') + ' · out at', lf, gl, pl) + '<em class="ux-hB3c">+' + tot + ' h</em></div></div>';
    return '<div class="ux-hB1"><div class="ux-hBh"><b>More time in the house</b><em>Up to +' + tot + ' h</em></div><div class="ux-hBr">' + t1(E, STAY.days[0], 'Arrive from', ef, ge, pe) + t1(L, STAY.days[2], 'Leave at', lf, gl, pl) + '</div></div>'; }
  if (HV === 'b2') { var t2 = function(q, lbl, t, g, pr){ return '<button type="button" class="ux-hB2t" ' + q.dest + '><img src="' + isrc(q.x.img) + '" alt=""><span class="bd"><small>' + esc(q.x.t) + '</small><b>' + lbl + ' ' + t + '</b><span class="pp"><i>+' + fh(g) + ' h</i><strong>' + pr + '</strong></span></span></button>'; };
    return '<div class="ux-hB2"><div class="ux-hBh"><b>More time in the house</b><span>' + STAY.range + '</span></div><div class="ux-hBr">' + t2(E, 'In at', ef, ge, pe) + t2(L, 'Out at', lf, gl, pl) + '</div></div>'; }
  if (HV === 'c1') return '<div class="ux-hC ux-hC1"><div class="ux-hCh"><span><b>Make your stay longer</b><small>Get up to +' + tot + ' h in the house</small></span><em>+' + tot + ' h</em></div>' + tl()
    + '<div class="ux-hC1b"><button type="button" ' + E.dest + '><small>Early check-in</small><b>' + ef + '</b><span>' + pe + ic('right') + '</span></button><button type="button" ' + L.dest + '><small>Late check-out</small><b>' + lf + '</b><span>' + pl + ic('right') + '</span></button></div></div>';
  if (HV === 'c2') { var r2 = function(q, d, lbl, sub, pr){ return '<button type="button" class="ux-hCr" ' + q.dest + '><span class="d"><small>' + d[0] + '</small><b>' + d[1] + '</b></span><span class="t"><b>' + lbl + '</b><small>' + sub + '</small></span><span class="p">' + pr + '</span>' + ic('right') + '</button>'; };
    return '<div class="ux-hC ux-hC2"><div class="ux-hCh"><span><b>Make your stay longer</b><small>Get up to +' + tot + ' h in the house</small></span><em>+' + tot + ' h</em></div>' + tl('dk')
      + r2(E, STAY.days[0], 'Early check-in', 'Arrive from ' + ef, pe) + r2(L, STAY.days[2], 'Late check-out', 'Leave at ' + lf, pl) + '</div>'; }
  if (/^c3[123]/.test(HV)) { var A1 = 8, Z1 = 20, px = function(h){ return ((hrs(h) - A1) / (Z1 - A1) * 100).toFixed(1); };
    /* una sola barra por día: azul = tu estancia normal, verde = lo que ganas */
    /* si el «+X h» de uno de los dos no cabe dentro del verde, los dos van fuera (mismo criterio en ambas barras) */
    var OUT = Math.abs(hrs(STAY.checkin) - hrs(ef)) / (Z1 - A1) * 100 < 24 || Math.abs(hrs(lf) - hrs(STAY.checkout)) / (Z1 - A1) * 100 < 24;
    var bar = function(early, std, you, g, big){ var a = early ? px(you) : px(std), w = (Math.abs(hrs(std) - hrs(you)) / (Z1 - A1) * 100).toFixed(1), sl = early ? px(std) : 0, sw = early ? (100 - px(std)) : px(std);
      return '<span class="ux-b1' + (big ? ' big' : '') + (early ? ' er' : ' lt') + (Math.abs(px(you) - px(std)) < 16 ? ' cl' : '') + '"><span class="ux-b1k"><i class="s" style="left:' + sl + '%;width:' + sw + '%"></i><i class="g" style="left:' + a + '%;width:' + w + '%"></i>' + (function(){ var nar = OUT, st = !nar ? 'left:' + (+a + w / 2) + '%;transform:translateX(-50%)' : early ? 'right:' + (100 - a + 1.5) + '%' : 'left:' + (+a + +w + 1.5) + '%';
        return '<span class="ux-b1g' + (nar ? ' out' : '') + '" style="' + st + '">+' + fh(g) + ' h</span>'; })() + '</span><span class="ux-b1j" style="left:' + px(std) + '%"></span><span class="ux-b1y" style="left:' + px(you) + '%"></span>'
        + '<small style="left:' + px(you) + '%">' + you + '</small><small class="sd" style="left:' + px(std) + '%">' + std + '</small></span>'; };
    var head = '<div class="ux-hCh"><span><b>Make your stay longer</b><small>Get up to +' + tot + ' h in the house</small></span><em>+' + tot + ' h</em></div>';
    if (FV) head = lhHead(tot);   /* Vlad feedback: «Make your stay up to X h longer» */
    if (HV === 'c31') { var q1 = function(q, d, lbl, std, you, g, pr, early){ return '<button type="button" class="ux-hC3r ux-c31" ' + q.dest + '><span class="hd"><b>' + lbl + '</b><small>' + d.join(' ') + '</small><span class="p">' + pr + ic('right') + '</span></span>' + bar(early, std, you, g) + '</button>'; };
      return '<div class="ux-hC ux-hC3">' + head + q1(E, STAY.days[0], 'Early check-in', STAY.checkin, ef, ge, pe, true) + q1(L, STAY.days[2], 'Late check-out', STAY.checkout, lf, gl, pl, false) + '</div>'; }
    if (/^c32/.test(HV)) { var q2 = function(q, d, lbl, std, you, g, pr, early){ if (q.st === 'Purchased' && BV === '2') return '<button type="button" class="ux-c32r bought cmp" ' + q.dest + '><span class="hd"><small>' + d.join(' ') + '</small><b>' + lbl + '</b><span class="p">' + ic('check') + 'Purchased</span></span><span class="ux-c32x">' + (early ? 'You check in from ' : 'You leave at ') + you + ' · +' + fh(g) + ' h more in the house</span></button>';
      return '<button type="button" class="ux-c32r' + (q.st === 'Purchased' ? ' bought' : q.st === 'In your cart' ? ' incart' : '') + '" ' + q.dest + '><span class="hd"><small>' + d.join(' ') + '</small><b>' + lbl + '</b><span class="p">' + (q.st === 'Purchased' ? ic('check') + 'Purchased' : q.st === 'In your cart' ? ic('cart') + 'In your cart' : pr + ic('right')) + '</span></span>' + bar(early, std, you, g) + '</button>'; };
      var ticks = '<div class="ux-c32t">' + [8, 10, 12, 14, 16, 18, 20].map(function(h){ return '<span style="left:' + ((h - A1) / (Z1 - A1) * 100) + '%">' + h + 'h</span>'; }).join('') + '</div>';
      return '<div class="ux-hC ux-hC3 ux-c32 ' + (/^c32k/.test(HV) ? 'ux-vc32a ux-o1 ux-k' + HV.slice(4) : 'ux-v' + HV.slice(0, 4) + ' ux-o' + (HV.slice(4) || '1')) + '">' + head + '<div class="ux-c32b">' + ticks + q2(E, STAY.days[0], 'Early check-in', STAY.checkin, ef, ge, pe, true) + q2(L, STAY.days[2], 'Late check-out', STAY.checkout, lf, gl, pl, false) + '</div></div>'; }
    var q3 = function(q, d, lbl, std, you, g, pr, early){ return '<button type="button" class="ux-c33r" ' + q.dest + '><span class="top"><strong>+' + fh(g) + ' h</strong><span class="tt"><b>' + lbl + '</b><small>' + d.join(' ') + ' · ' + (early ? 'in from ' : 'out at ') + you + ' instead of ' + std + '</small></span></span>' + bar(early, std, you, g, true) + '<span class="cta">' + (q.st ? q.st : 'Choose your time · ' + pr) + ic('right') + '</span></button>'; };
    return '<div class="ux-c33"><div class="ux-hBh"><b>Make your stay longer</b><em>Up to +' + tot + ' h</em></div>' + q3(E, STAY.days[0], 'Early check-in', STAY.checkin, ef, ge, priceOf('early'), true) + q3(L, STAY.days[2], 'Late check-out', STAY.checkout, lf, gl, priceOf('late'), false) + '</div>'; }
  if (HV === 'c3') { var A0 = 8, Z0 = 20, pc = function(h){ return ((hrs(h) - A0) / (Z0 - A0) * 100).toFixed(1) + '%'; };
    var r3 = function(q, d, lbl, std, you, g, pr, early){ var a = early ? you : std, b = early ? std : you;
      return '<button type="button" class="ux-hC3r" ' + q.dest + '><span class="hd"><b>' + lbl + '</b><small>' + d.join(' ') + '</small><span class="p">' + pr + ic('right') + '</span></span>'
        + '<span class="br"><span class="ln st' + (early ? ' rt' : '') + '"><i style="' + (early ? 'left:' + pc(std) + ';right:0' : 'left:0;width:' + pc(std)) + '"></i><em>Standard ' + std + '</em></span>'
        + '<span class="ln yo' + (early ? ' rt' : '') + '"><i style="' + (early ? 'left:' + pc(you) + ';right:0' : 'left:0;width:' + pc(you)) + '"></i><em>' + (early ? 'In from ' : 'Out at ') + you + ' · +' + fh(g) + ' h</em></span></span></button>'; };
    return '<div class="ux-hC ux-hC3"><div class="ux-hCh"><span><b>Make your stay longer</b><small>Get up to +' + tot + ' h in the house</small></span><em>+' + tot + ' h</em></div>'
      + r3(E, STAY.days[0], 'Early check-in', STAY.checkin, ef, ge, pe, true) + r3(L, STAY.days[2], 'Late check-out', STAY.checkout, lf, gl, pl, false) + '</div>'; }
  if (HV === '1') return '<div class="ux-hA"><img src="' + isrc(E.x.img) + '" alt=""><span class="ux-psh"></span><span class="ux-hAt"><small>Up to +' + fh(ge + gl) + ' h in the house</small><b>Arrive early, leave late</b></span>'
    + '<span class="ux-hAb"><button type="button" ' + E.dest + '><small>Early check-in</small><b>' + pe + '</b>' + ic('right') + '</button><button type="button" ' + L.dest + '><small>Late check-out</small><b>' + pl + '</b>' + ic('right') + '</button></span></div>';
  if (HV === '2') { var tile = function(q, k, lbl, t, g, pr){ return '<button type="button" class="ux-hBt" ' + q.dest + '><img src="' + isrc(q.x.img) + '" alt=""><span class="ux-psh"></span><span class="ux-hBg">+' + fh(g) + ' h</span><span class="ux-hBx"><small>' + lbl + '</small><b>' + t + '</b><em>' + pr + ic('right') + '</em></span></button>'; };
    return '<div class="ux-hB"><div class="ux-hBh"><b>More time in the house</b><span>' + STAY.range + '</span></div><div class="ux-hBr">' + tile(E, 'early', 'Arrive from', ef, ge, pe) + tile(L, 'late', 'Leave at', lf, gl, pl) + '</div></div>'; }
  var row = function(q, d, lbl, sub, pr){ return '<button type="button" class="ux-hCr" ' + q.dest + '><span class="d"><small>' + d[0] + '</small><b>' + d[1] + '</b></span><span class="t"><b>' + lbl + '</b><small>' + sub + '</small></span><span class="p">' + pr + '</span>' + ic('right') + '</button>'; };
  return '<div class="ux-hC"><div class="ux-hCh"><span><b>Make your stay longer</b><small>Get up to +' + fh(ge + gl) + ' h in the house</small></span><em>+' + fh(ge + gl) + ' h</em></div>'
    + '<div class="ux-hCl"><i class="e"></i><i class="s"></i><i class="l"></i></div><div class="ux-hCk"><span>' + ef + '</span><span>' + STAY.checkin + ' → ' + STAY.checkout + ' · your stay</span><span>' + lf + '</span></div>'
    + row(E, STAY.days[0], 'Early check-in', 'Arrive from ' + ef, pe) + row(L, STAY.days[2], 'Late check-out', 'Leave at ' + lf, pl) + '</div>'; }
function vList1(){ var f = heroOk() ? '' : firstFree(), ks = ORDER.filter(function(k){ return (heroOk() ? k !== 'early' && k !== 'late' : k !== f) && !(TV && k === 'pet' && O.pet && !(paid('pet') || inCart('pet'))); }); ks = ks.filter(function(k){ return paid(k) || inCart(k) || (st.req[k] && st.req[k].st === 'waiting'); }).concat(ks.filter(function(k){ return !(paid(k) || inCart(k) || (st.req[k] && st.req[k].st === 'waiting')); })); if (TV && O.pet && (paid('pet') || inCart('pet'))) ks = ['pet'].concat(ks.filter(function(k){ return k !== 'pet'; }));   /* la mascota comprada va la primera de «For your stay» */ return { body: listHead() + (heroOk() ? elHero() : feat()) + petCard() + '<div class="ux-sec"><h3>For your stay</h3><span>' + STAY.range + '</span></div>' + (LV === 'v2' ? '<div class="ux-l2">' + (BV === '2' ? ks.filter(function(k){ return !(paid(k) && !inCart(k)); }) : ks).map(lrow).join('') + '</div>' + (BV === '2' ? ownRows(ks.filter(function(k){ return paid(k) && !inCart(k); })) : '') : '<div class="ux-grid">' + ks.map(card).join('') + '</div>') + '<div class="ux-sec"><h3>From our partners</h3>' + (LV === 'v2' ? '' : '<span>booked on their site</span>') + '</div>' + (PV ? ptnV() : partners() + esim()), bar: listBar() }; }
function vList2(){ var inst = ORDER.filter(function(k){ return !manual(O[k]); }), man = ORDER.filter(function(k){ return manual(O[k]); });
  return { body: listHead() + feat() + '<div class="ux-sec"><h3>Instant</h3><span>confirmed on the spot</span></div><div class="ux-car">' + inst.map(card).join('') + '</div>'
    + (man.length ? '<div class="ux-sec"><h3>On request</h3><span>charged only once confirmed</span></div><div class="ux-car">' + man.map(card).join('') + '</div>' : '')
    + '<div class="ux-sec"><h3>From our partners</h3>' + (LV === 'v2' ? '' : '<span>booked on their site</span>') + '</div>' + partners() + esim(), bar: listBar() }; }
function vList3(){ var f = firstFree();
  var h = listHead() + (f ? '<div class="ux-rbox hi"><p class="ux-rk">' + ic('spark') + 'Featured for your stay' + '</p>' + row(f) + '</div>' : '')
    + '<div class="ux-sec"><h3>For your stay</h3><span>' + STAY.range + '</span></div><div class="ux-rbox">' + ORDER.filter(function(k){ return k !== f; }).map(function(k){ return row(k); }).join('') + '</div>'
    + '<div class="ux-sec"><h3>From our partners</h3>' + (LV === 'v2' ? '' : '<span>booked on their site</span>') + '</div><div class="ux-rbox">'
    + [['Mozio', 'car', 'Private transfers', 'Your ride is ready when you land'], ['GuruWalk', 'walk', 'Free walking tours', 'Discover the city with local guides'], ['Airalo', 'wifi', 'Mobile data from 4€', 'eSIM · no roaming, no physical SIM']].map(function(x){ return '<div class="ux-rw"><button type="button" class="ux-rwm" data-partner="' + x[0] + '"><span class="ux-rwi">' + ic(x[1]) + '</span><span><b>' + x[2] + '</b><small>' + x[3] + '</small><em class="pt">' + ic('ext') + x[0] + '</em></span></button><button type="button" class="ux-add ux-txt" data-partner="' + x[0] + '">View</button></div>'; }).join('') + '</div>';
  return { body: h, bar: listBar() }; }
/* V4 · Tu estancia: cada día de la reserva con lo que ya está programado, y debajo todo lo que se puede añadir */
function vList4(){ var h = listHead() + '<div class="ux-stay"><span><small>Your stay</small><b>' + STAY.range + '</b></span><span class="ux-sn">2 nights · ' + STAY.guests + ' guests</span></div><ol class="ux-tl4">';
  var on = st.cart.map(function(x){ return [x.id, x.sel, 'ok']; }).concat(Object.keys(st.req).filter(function(k){ return busy(k); }).map(function(k){ return [k, st.req[k].slot ? { slot: st.req[k].slot } : null, 'rq']; }));
  STAY.days.forEach(function(d, i){ var its = on.filter(function(e){ var x = O[e[0]], s = e[1] || {}; if (slotted(x)) return x.type === 'early' ? i === 0 : i === 2; if (x.dd) return (s.d || 0) === i; return false; });
    h += '<li class="ux-td"><span class="ux-tdot">' + ic(i === 0 ? 'key' : i === 2 ? 'bag' : 'home') + '</span><div><b>' + d.join(' ') + ' Nov' + (i === 0 ? ' · arrival' : i === 2 ? ' · departure' : '') + '</b><small>' + (i === 0 ? 'Check-in from ' + STAY.checkin : i === 2 ? 'Check-out by ' + STAY.checkout : 'A full day in the house') + '</small></div></li>'
      + (its.length ? its.map(function(e){ var x = O[e[0]]; return '<li class="ux-ti on"><time>' + (slotted(x) ? (e[1] && e[1].slot) || '' : (e[1] && e[1].time) || '') + '</time><div class="ux-rw"><button type="button" class="ux-rwm" data-go="mine"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><em class="' + (e[2] === 'rq' ? 'rq' : '') + '">' + ic(e[2] === 'rq' ? 'clock' : 'check') + (e[2] === 'rq' ? 'Waiting for approval' : 'Added') + '</em></span></button></div></li>'; }).join('') : '<li class="ux-ti empty"><span>Nothing planned yet</span></li>'); });
  h += '</ol><div class="ux-sec"><h3>Add to your stay</h3></div><div class="ux-rbox">' + ORDER.map(function(k){ return row(k); }).join('') + '</div><div class="ux-sec"><h3>From our partners</h3>' + (LV === 'v2' ? '' : '<span>booked on their site</span>') + '</div>' + partners();
  return { body: h, bar: listBar() }; }
/* V5 · Pack: los tres primeros del anfitrión con interruptores y un solo botón */
function packKeys(){ return ORDER.filter(function(k){ return !inCart(k) && !busy(k) && !paid(k); }).slice(0, 3); }
function packOn(){ var v; try { v = JSON.parse(sessionStorage.getItem('ux-pack') || 'null'); } catch (e) {} return v || {}; }
function vList5(){ var h = listHead(), on = packOn(), ks = packKeys(), pay = 0, hold = 0;
  ks.forEach(function(k){ if (on[k] === 0) return; var a = amount(O[k], defSel(O[k])); if (manual(O[k])) hold += a; else pay += a; });
  if (ks.length) h += '<div class="ux-pack"><p class="ux-pkk">' + ic('spark') + 'Picked for you' + '</p><h3>Make your stay easier</h3>'
    + ks.map(function(k){ var x = O[k], v = on[k] !== 0, ds = defSel(x); return '<div class="ux-pr5"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><small>' + eur(amount(x, ds)) + ' · ' + esc(describe(x, ds)) + '</small></span><button type="button" class="ux-sw" role="switch" aria-checked="' + v + '" aria-label="' + esc(x.t) + '" data-pack="' + k + '"><i></i></button></div>'; }).join('')
    + '<div class="ux-ptot"><span><small>Pay with your booking</small><b>' + eur(pay) + '</b></span>' + (hold ? '<span class="h"><small>' + ic('lock') + 'Held · not charged</small><b>' + eur(hold) + '</b></span>' : '') + '</div>'
    + '<button type="button" class="ux-cta full" data-act="pack"' + (pay + hold ? '' : ' disabled') + '>' + (pay + hold ? 'Add to my stay' + (pay ? ' · ' + eur(pay) : '') : 'Pick at least one') + '</button>'
    + (hold ? '<p class="ux-pnote">' + ic('user') + 'We review requests and only charge them once confirmed. You can change times later.</p>' : '<p class="ux-pnote">' + ic('cal') + 'Defaults picked for you. Change any of them in My extras.</p>') + '</div>';
  var others = ORDER.filter(function(k){ return ks.indexOf(k) < 0; });
  h += '<div class="ux-sec"><h3>More for your stay</h3></div><div class="ux-grid">' + others.map(card).join('') + '</div>' + partners() + esim();
  return { body: h, bar: listBar() }; }

/* ---------- Detalle de un deal ---------- */
function hero(){ return '<div class="ux-hero"><img src="' + isrc(o.img) + '" alt=""><span class="ux-hsh"></span><span class="ux-hch">' + esc(o.t) + '</span>'
  + '<span class="ux-hln">' + ic(manual(o) ? 'user' : 'bolt') + laneTxt(o) + '</span>'
  + '<div class="ux-hbt"><h2>' + esc(o.hl) + '</h2><span class="ux-hpr">' + priceOf(K) + '<small> ' + unitOf(K) + '</small></span></div></div>'; }
/* la ganancia de early/late: la hora estándar sale de la reserva */
function gain(){ if (!slotted(o) || !sel.slot) return ''; var hh = function(t){ return hrs(t); }, std = o.type === 'early' ? STAY.checkin : STAY.checkout, s = hh(std), v = hh(sel.slot), d = Math.abs(s - v), A = 8, Z = 19;
  var pc = function(t){ return ((t - A) / (Z - A) * 100).toFixed(1) + '%'; }, lo = Math.min(s, v), hi = Math.max(s, v);
  return '<div class="ux-gain"><div class="ux-gn"><b>+' + fh(d) + ' h</b><span>' + (o.type === 'early' ? 'more on your arrival day' : 'more on your last day') + '</span></div>'
    + '<div class="ux-day"><i style="left:' + pc(lo) + ';width:' + ((hi - lo) / (Z - A) * 100).toFixed(1) + '%"></i><em class="std" style="left:' + pc(s) + '"><span>' + std + '<small>standard</small></span></em><em class="you" style="left:' + pc(v) + '"><span>' + sel.slot + '<small>you</small></span></em></div></div>'; }
/* V4: el momento elegido en grande (delivery date) */
function when(){ if (!o.dd) return ''; return '<div class="ux-when"><small>' + ic('cal') + 'Your ' + esc(o.t.toLowerCase()) + '</small><b>' + STAY.days[sel.d].join(' ') + ' Nov</b><span>' + sel.time + '</span></div>'; }
function stepper(k, v, min, max){ return '<span class="ux-stp"><button type="button" data-st="' + k + '" data-dl="-1" aria-label="Fewer"' + (v <= min ? ' disabled' : '') + '>' + ic('minus') + '</button><output aria-live="polite">' + v + '</output><button type="button" data-st="' + k + '" data-dl="1" aria-label="More"' + (v >= max ? ' disabled' : '') + '>' + ic('plus') + '</button></span>'; }
/* horas que ofrece el deal (ajuste «Time options»: 1, 3, 5, 7, 10 o todas): seguidas y centradas en las 12:00 */
function dTimes(){ var n = Math.max(1, Math.min(TIMES.length, +o.nt || TIMES.length)), c = TIMES.indexOf('12:00'), st = Math.max(0, Math.min(TIMES.length - n, c - Math.floor((n - 1) / 2))); return TIMES.slice(st, st + n); }
/* V6 móvil: todas las horas a la vista en rejilla (sin deslizar); las columnas se reparten según cuántas haya (hasta 7 por fila) */
function timesHTML(){ var L = desk ? TIMES : dTimes(); if (L.indexOf(sel.time) < 0) sel.time = L[0];
  var rows = Math.ceil(L.length / 7), cols = Math.ceil(L.length / rows);
  return '<div class="ux-times' + (!desk && isV6() ? ' ux-tgrid ux-tn' + Math.min(cols, 7) + '" style="grid-template-columns:repeat(' + cols + ',1fr)' : '') + '" role="radiogroup" aria-label="Time">' + L.map(function(t){ return '<button type="button" role="radio" aria-checked="' + (sel.time === t) + '" data-time="' + t + '">' + t + '</button>'; }).join('') + '</div>'; }
/* FV: deal manual sin email del huésped → campo de email en la misma hoja / panel de opciones (lo que pedía Vlad) */
var mailDraft = '', payDone = null, apprH = 0;
function mailBlk(){ if (EM || EP || EA || !(needMail() && manual(o))) return '';
  if (EU) return '<div class="ux-blk ux-mailf ux-mailu"><div class="ux-mu-h"><span class="ux-mu-i">' + ic('clock') + '</span><span><b>Needs approval</b><small class="ux-mu-lg">We first check availability, so we can make sure it’s ready for you. To send the request, pay your cart: we hold ' + eur(amount(o, sel)) + ' on your card, only charged if approved. Until you pay, it isn’t sent.</small><small class="ux-mu-sh">We check availability first. Pay your cart to send it: we hold ' + eur(amount(o, sel)) + ', only charged if approved.</small></span></div>'
    + '<label class="ux-mu-l" for="ux-mail-in">Your email</label><input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '">'
    + '<p class="ux-merr" hidden>Add your email so we can send you our answer.</p></div>';
  return '<div class="ux-blk ux-mailf"><p class="ux-k"><label for="ux-mail-in">Your email</label><span>We send our answer here</span></p>'
    + '<input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '">'
    + '<p class="ux-merr" hidden>Add your email so we can send you our answer.</p></div>'; }
function choice(){ return choice0() + mailBlk(); }
/* f2: el email se pide en la hoja de confirmación, bajo lo añadido; «Go to cart» no sigue sin él */
function confMail(k){ if (!EM || !needMail() || !st.req[k]) return '';
  if (EC) { var ha = eur(st.req[k].amt); return '<div class="ux-mailf ux-mailc ux-mailu"><div class="ux-mu-h"><span class="ux-mu-i">' + ic('clock') + '</span><span><b>Needs approval</b><small>We first check availability, so we can make sure it’s ready for you.</small></span></div>'
    + '<ol class="ux-mu-st"><li><i>1</i><span><b>Pay your cart to send the request.</b> We hold ' + ha + ' on your card, nothing is charged yet. Until you pay, the request isn’t sent.</span></li>'
    + '<li><i>2</i><span><b>We check availability</b> and email you the answer, usually within a few hours.</span></li>'
    + '<li><i>3</i><span><b>Only charged if approved.</b> If not, the hold is released.</span></li></ol>'
    + '<p class="ux-mu-1" hidden>To send the request, pay your cart: we hold ' + ha + ' on your card while we check availability. Until you pay, it isn’t sent. Only charged if approved.</p>'
    + '<label class="ux-mu-l" for="ux-mail-in">Where should we send our answer?</label><input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '">'
    + '<p class="ux-merr" hidden>Add your email so we can send you our answer.</p></div>'; }
  return '<div class="ux-mailf ux-mailc"><p class="ux-k"><label for="ux-mail-in">Where should we send our answer?</label></p>'
    + '<input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '">'
    + '<p class="ux-mhint">We need it to send your request. Only used for updates on it.</p><p class="ux-merr" hidden>Add your email so we can send you our answer.</p></div>'; }
function choice0(){ var h = '';
  if (slotted(o)) { var ss = sortedSlots(o), std = o.type === 'early' ? STAY.checkin : STAY.checkout;
    return '<div class="ux-blk"><p class="ux-k">' + (o.type === 'early' ? 'Check in at' : 'Check out at') + '<span>Standard ' + std + '</span></p><div class="ux-opts">'
      + ss.map(function(x){ var on = x[0] === sel.slot, d = Math.abs(hrs(x[0]) - hrs(std)); return '<button type="button" class="ux-opt" role="radio" aria-checked="' + on + '" data-slot="' + x[0] + '"><b>' + x[0] + '</b><small>+' + fh(d) + ' h</small><em>' + eur(x[1]) + '</em></button>'; }).join('') + '</div></div>'; }
  if (o.u === 'day') h += '<div class="ux-blk"><p class="ux-k">Which days?<span>' + eur(o.p) + ' per day</span></p><div class="ux-opts">' + STAY.days.map(function(d, i){ var on = sel.days.indexOf(i) > -1; return '<button type="button" class="ux-opt" role="checkbox" aria-checked="' + on + '" data-dayx="' + i + '"><b>' + d[0] + ' ' + d[1] + '</b><small>Nov</small></button>'; }).join('') + '</div></div>';
  /* por días + entrega: los días ya se eligen arriba; aquí solo la hora, la misma cada día */
  if (o.dd && o.u === 'day') h += '<div class="ux-blk"><p class="ux-k">At what time?<span>Same time each day</span></p>' + timesHTML() + '</div>';
  else if (o.dd) h += '<div class="ux-blk"><p class="ux-k">When?<span>You pick the day and time</span></p><div class="ux-opts">' + STAY.days.map(function(d, i){ return '<button type="button" class="ux-opt" role="radio" aria-checked="' + (sel.d === i) + '" data-dd="' + i + '"><b>' + d[0] + ' ' + d[1] + '</b><small>Nov</small></button>'; }).join('') + '</div>'
    + timesHTML() + '</div>';
  if (QN[o.u] && o.u !== 'day') h += '<div class="ux-blk ux-row"><span><b>' + QN[o.u] + '</b><small>' + eur(o.p) + ' ' + UNIT[o.u] + '</small></span>' + stepper('q', sel.q, 1, o.u === 'person' ? 12 : o.u === 'pet' ? 3 : 9) + '</div>';
  return h; }
/* lo que dicen los ajustes, en tres iconos */
function facts(){ var f = [[manual(o) ? 'user' : 'bolt', manual(o) ? 'We confirm it' : 'Confirmed instantly']];
  f.push(slotted(o) ? ['clock', 'Price by time'] : [({ unit: 'box', person: 'users', group: 'users', day: 'cal', pet: 'paw' })[o.u], 'Price ' + UNIT[o.u]]);
  f.push(o.dd || slotted(o) ? ['cal', 'You pick the time'] : ['lock', 'Paid with your booking']);
  return '<div class="ux-perks">' + f.map(function(x){ return '<div><span>' + ic(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>'; }
function desc(){ return o.ds ? '<details class="ux-desc"' + (o.ds.length < 140 ? ' open' : '') + '><summary><b>About this extra</b>' + ic('right') + '</summary><p>' + esc(o.ds) + '</p></details>' : ''; }
function how(t){ return '<div class="ux-how"><div><span>' + ic('lock') + '</span><b>We hold ' + eur(t) + '</b><small>nothing charged</small></div><i></i><div><span>' + ic('user') + '</span><b>We confirm</b><small>within a few hours</small></div><i></i><div><span>' + ic('check') + '</span><b>Charged if yes</b><small>released if not</small></div></div>'; }
function addons(){ var ks = ORDER.concat(['luggage']).filter(function(k){ return k !== K && !inCart(k) && quickable(O[k]); }).slice(0, 2); if (!ks.length) return '';
  return '<div class="ux-blk ux-adds"><p class="ux-k">Complete it</p>' + ks.map(function(k){ var x = O[k]; return '<div class="ux-ad"><img src="' + isrc(x.img) + '" alt=""><span><b>' + esc(x.t) + '</b><small>' + priceOf(k) + ' ' + unitOf(k) + '</small></span><button type="button" class="ux-add" data-quick="' + k + '" aria-label="Add ' + esc(x.t) + '">' + ic('plus') + '</button></div>'; }).join('') + '</div>'; }
/* ---------- V6 · foto en carrusel, título, highlight y descripción; las opciones de compra en una hoja al pulsar «Add to my stay» ---------- */
function needsOpts(){ return slotted(o) || o.dd || o.u !== 'group'; }
/* ---------- V6.2–V6.5 · cómo se elige la hora en Early / Late (móvil) ---------- */
function slotPicker(){ var early = o.type === 'early', std = early ? STAY.checkin : STAY.checkout, sh = hrs(std), word = early ? 'Check in' : 'Leave';
  var L = sortedSlots(o).map(function(x){ return { t: x[0], p: x[1], d: Math.abs(hrs(x[0]) - sh) }; }), mx = Math.max.apply(null, L.map(function(x){ return x.d; }));
  var cur = L.filter(function(x){ return x.t === sel.slot; })[0] || L[0];
  if (D === 'old-v62') return '<p class="ux-pk2">' + word + ' at</p><div class="ux-p2" role="radiogroup" aria-label="' + word + ' time">' + L.map(function(x){ var on = x.t === sel.slot; return '<button type="button" role="radio" aria-checked="' + on + '" data-slot="' + x.t + '"><span class="r"></span><b class="t">' + x.t + '</b><span class="bar"><i style="width:' + Math.max(22, x.d / mx * 100).toFixed(0) + '%">+' + fh(x.d) + ' h</i></span><em>' + eur(x.p) + '</em></button>'; }).join('')
      + '<div class="std"><span class="r"></span><b class="t">' + std + '<small>standard</small></b><span class="bar"></span><em>Included</em></div></div>';
  if (D === 'old-v63') { var ix = L.indexOf(cur);
    return '<div class="ux-p3"><p class="k">' + word + ' at</p><p class="big"><b>' + cur.t + '</b><span><em>+' + fh(cur.d) + ' h</em> more on your ' + (early ? 'arrival' : 'last') + ' day</span></p>'
      + '<input type="range" class="ux-rng" data-rng min="0" max="' + (L.length - 1) + '" step="1" value="' + ix + '" aria-label="' + word + ' time" aria-valuetext="' + cur.t + ', ' + eur(cur.p) + '">'
      + '<div class="ticks">' + L.map(function(x){ return '<span class="' + (x === cur ? 'on' : '') + '"><b>' + x.t + '</b>' + eur(x.p) + '</span>'; }).join('') + '</div><p class="std">Standard ' + std + ' · included</p></div>'; }
  if (D === 'old-v64') return '<p class="ux-pk2">' + word + ' at <span>Standard ' + std + '</span></p><div class="ux-p4" role="radiogroup" aria-label="' + word + ' time">' + L.slice().sort(function(a, b){ return b.d - a.d; }).map(function(x){ var on = x.t === sel.slot; return '<button type="button" role="radio" aria-checked="' + on + '" data-slot="' + x.t + '">' + (x.d === mx ? '<span class="chip">Most time</span>' : '') + '<b>' + x.t + '</b><span class="g">+' + fh(x.d) + ' h</span><em>' + eur(x.p) + '</em></button>'; }).join('') + '</div>';
  /* V6.5 */
  return '<div class="ux-p5"><div class="seg" role="radiogroup" aria-label="' + word + ' time">' + L.map(function(x){ return '<button type="button" role="radio" aria-checked="' + (x.t === sel.slot) + '" data-slot="' + x.t + '">' + x.t + '</button>'; }).join('') + '</div>'
    + '<p class="sum">You ' + (early ? 'check in' : 'leave') + ' at <b>' + cur.t + '</b> · <b class="g">' + cur.d + ' extra hour' + (cur.d > 1 ? 's' : '') + '</b> for <b>' + eur(cur.p) + '</b></p><p class="std">Standard ' + std + ' is included</p></div>'; }
/* ---------- V6 · hoja de compra repensada (móvil): primero la pregunta, luego las opciones, luego el resumen de lo que ganas ---------- */
/* títulos de la hoja de opciones: dicen qué hay que elegir (no una pregunta) */
function sheetQ(){ if (slotted(o)) return o.type === 'early' ? 'Choose your check-in time' : 'Choose your check-out time';
  var W = { unit: 'quantity', person: 'guests', pet: 'pets' };
  if (o.dd && o.u === 'day') return 'Pick days and time'; if (o.dd && W[o.u]) return 'Pick a day, time and ' + W[o.u]; if (o.dd) return 'Pick a day and time';
  return ({ unit: 'Choose the quantity', person: 'Choose the number of guests', day: 'Choose your days', pet: 'How many pets are coming?', group: 'Add it to your stay' })[o.u] || 'Choose your options'; }
function sheetSub(){ if (slotted(o)) return o.type === 'early' ? STAY.days[0].join(' ') + ' Nov · standard check-in at ' + STAY.checkin : STAY.days[2].join(' ') + ' Nov · standard check-out at ' + STAY.checkout + ' is free';
  return esc(o.t) + ' · ' + priceOf(K) + ' ' + unitOf(K); }
function pick6(){ var early = o.type === 'early', std = early ? STAY.checkin : STAY.checkout, sh = hrs(std);
  var L = sortedSlots(o).map(function(x){ return { t: x[0], p: x[1], d: Math.abs(hrs(x[0]) - sh) }; }), cur = L.filter(function(x){ return x.t === sel.slot; })[0] || L[0];
  var A = Math.min.apply(null, L.map(function(x){ return hrs(x.t); }).concat([sh])) - 1, Z = Math.max.apply(null, L.map(function(x){ return hrs(x.t); }).concat([sh])) + 1, pc = function(h){ return ((h - A) / (Z - A) * 100).toFixed(1) + '%'; };
  var v = hrs(cur.t), lo = Math.min(sh, v), hi = Math.max(sh, v);
  return '<div class="ux-o6" role="radiogroup" aria-label="' + (early ? 'Check-in time' : 'Check-out time') + '">' + L.map(function(x){ var on = x.t === sel.slot; return '<button type="button" role="radio" aria-checked="' + on + '" data-slot="' + x.t + '"><span class="ux-ck6" aria-hidden="true">' + ic('check') + '</span><b>' + x.t + '</b><span class="g">+' + fh(x.d) + ' h</span><em>' + eur(x.p) + '</em></button>'; }).join('') + '</div>'
    + '<div class="ux-s6s" aria-live="polite"><p class="l1">' + (early ? 'In from <b>' + cur.t + '</b> on ' + STAY.days[0].join(' ') + ' Nov' : 'Until <b>' + cur.t + '</b> on ' + STAY.days[2].join(' ') + ' Nov') + '</p>'
    + '<p class="l2"><b>' + cur.d + ' extra hour' + (cur.d > 1 ? 's' : '') + '</b> ' + (early ? 'to settle in before ' + std : 'in the house after ' + std) + '</p>'
    + '<div class="bar"><i style="left:' + pc(lo) + ';width:' + ((hi - lo) / (Z - A) * 100).toFixed(1) + '%"></i><em class="std" style="left:' + pc(sh) + '"></em><em class="you" style="left:' + pc(v) + '"></em></div>'
    + '<div class="axis"><span style="left:' + pc(sh) + '">' + std + '</span><span class="you" style="left:' + pc(v) + '">' + cur.t + '</span></div></div>'; }
/* datos comunes de las franjas para las hojas V6.x */
function slotData(){ var early = o.type === 'early', std = early ? STAY.checkin : STAY.checkout, sh = hrs(std);
  var L = sortedSlots(o).map(function(x){ return { t: x[0], p: x[1], d: Math.abs(hrs(x[0]) - sh) }; }), cur = L.filter(function(x){ return x.t === sel.slot; })[0] || L[0];
  return { early: early, std: std, sh: sh, L: L, cur: cur, day: STAY.days[early ? 0 : 2].join(' ') + ' Nov' }; }
/* V6.6 · una sola tarjeta: la línea del día con una parada por hora, que se toca */
function pick66(){ var S = slotData(), hs = S.L.map(function(x){ return hrs(x.t); }).concat([S.sh]), A = Math.min.apply(null, hs) - 1, Z = Math.max.apply(null, hs) + 1, pc = function(h){ return ((h - A) / (Z - A) * 100).toFixed(1) + '%'; };
  var v = hrs(S.cur.t), lo = Math.min(S.sh, v), hi = Math.max(S.sh, v);
  return '<div class="ux-q66"><p class="l1">' + (S.early ? 'In from <b>' + S.cur.t + '</b>' : 'Until <b>' + S.cur.t + '</b>') + ' · ' + S.day + '</p><p class="l2"><b>+' + fh(S.cur.d) + ' h</b> ' + (S.early ? 'before ' + S.std : 'after ' + S.std) + '</p>'
    + '<div class="track"><i style="left:' + pc(lo) + ';width:' + ((hi - lo) / (Z - A) * 100).toFixed(1) + '%"></i><span class="std" style="left:' + pc(S.sh) + '"><small>' + S.std + '<br>free</small></span>'
    + S.L.map(function(x){ var on = x === S.cur; return '<button type="button" role="radio" aria-checked="' + on + '" aria-label="' + x.t + ', ' + eur(x.p) + '" data-slot="' + x.t + '" style="left:' + pc(hrs(x.t)) + '"><i></i><b>' + x.t + '</b><em>' + eur(x.p) + '</em></button>'; }).join('') + '</div><p class="hint">Tap a time on the line</p></div>'; }
/* V6.7 · lista clara en blanco, con lo que sale por hora */
function pick67(){ var S = slotData();
  return '<div class="ux-q67" role="radiogroup" aria-label="' + (S.early ? 'Check-in' : 'Check-out') + ' time">' + S.L.map(function(x){ var on = x === S.cur; return '<button type="button" role="radio" aria-checked="' + on + '" data-slot="' + x.t + '"><span class="r"></span><span class="m"><b>' + x.t + '</b></span><em>' + eur(x.p) + '</em></button>'; }).join('')
    /* la hora estándar: misma fila y mismas columnas, sin selector, como referencia */
    + '<div class="std"><span class="ic0">' + ic('clock') + '</span><span class="m"><b>' + S.std + '</b><small>Standard ' + (S.early ? 'check-in' : 'check-out') + '</small></span><span class="inc">Included</span></div></div>'; }
/* V6.8 · la hora elegida en grande, con − / + para pasar de franja */
function pick68(){ var S = slotData(), i = S.L.indexOf(S.cur), n = S.L.length, lessWord = S.early ? 'Later' : 'Earlier', moreWord = S.early ? 'Earlier' : 'Later';
  var stepLess = S.early ? 1 : -1;   /* «menos horas»: en early es una hora más tarde; en late, una más temprano */
  var canLess = S.L[i + stepLess] && S.L[i + stepLess].d < S.cur.d, canMore = S.L[i - stepLess] && S.L[i - stepLess].d > S.cur.d;
  return '<div class="ux-q68"><button type="button" class="st" data-sstep="' + stepLess + '"' + (canLess ? '' : ' disabled') + ' aria-label="Fewer hours">' + ic('minus') + '<small>Fewer hours</small></button>'
    + '<div class="c" aria-live="polite"><small>' + (S.early ? 'Check in at' : 'Leave at') + '</small><b>' + S.cur.t + '</b><span class="g">+' + fh(S.cur.d) + ' h</span><em>' + eur(S.cur.p) + '</em></div>'
    + '<button type="button" class="st" data-sstep="' + (-stepLess) + '"' + (canMore ? '' : ' disabled') + ' aria-label="More hours">' + ic('plus') + '<small>More hours</small></button></div>'
    + '<div class="ux-q68d" aria-hidden="true">' + S.L.slice().sort(function(a, b){ return a.d - b.d; }).map(function(x){ return '<i class="' + (x === S.cur ? 'on' : '') + '"></i>'; }).join('') + '</div>'
    + '<p class="ux-q67s" aria-live="polite">' + (S.early ? 'You get in at <b>' + S.cur.t + '</b>, <b class="g">' + fh(S.cur.d) + ' h earlier</b>.' : 'You keep the house until <b>' + S.cur.t + '</b>, <b class="g">' + fh(S.cur.d) + ' h longer</b>.') + '</p>'; }
/* el resto de deals con la misma barra que Early / Late: arriba lo elegido en grande, debajo el detalle; el precio va en el botón verde */
function capSel(t){ var N = { unit: ['unit', 'units'], pet: ['pet', 'pets'], person: ['guest', 'guests'] }, day = function(i){ return STAY.days[i].join(' ') + ' Nov'; }, per = eur(o.p) + ' ' + (UNIT[o.u] || ''), head, sub;
  if (o.u === 'day') { var n = sel.days.length; head = n + ' day' + (n === 1 ? '' : 's'); sub = n ? sel.days.map(function(i){ return STAY.days[i].join(' '); }).join(', ') + ' Nov' : 'Pick at least one day'; }
  else if (N[o.u]) { head = sel.q + ' ' + N[o.u][sel.q === 1 ? 0 : 1]; sub = o.dd ? day(sel.d) + ' · ' + sel.time : per; }
  else if (o.dd) { head = day(sel.d); sub = sel.time + ' · ' + per; }
  else { head = eur(t); sub = per; }
  return '<div class="ux-b64 ux-b67"><span class="tt"><b class="' + (popNow ? 'ux-tot6' : 'ux-tot0') + '">' + esc(head) + '</b><small>' + esc(sub) + '</small></span>'; }
function capGain(t){ var S = slotData();
  /* a la izquierda lo que ganas («+3 h» y hasta cuándo); el precio va en el botón */
  return '<div class="ux-b64 ux-b67"><span class="gh">+' + fh(S.cur.d) + ' h</span><span class="tt"><b class="' + (popNow ? 'ux-tot6' : 'ux-tot0') + '">+' + fh(S.cur.d) + ' h</b><small>' + (S.early ? 'from ' : 'until ') + S.cur.t + ' · ' + S.day + '</small></span>'; }
/* ---------- V6.1–V6.7 · cómo se ven las opciones en la hoja (nunca en Early / Late) ---------- */
var OPTFB = false;   /* si la versión oscura no cabe en el alto fijo de la hoja, se usa la hoja normal */
function optKind(){ if (desk || !isV6() || slotted(o) || OPTFB) return ''; return ({ 'old-v61': 'list', 'old-v62': 'qbar', 'old-v63': 'picks' })[D] || ''; }   /* las versiones en la tarjeta negra se descartaron */
function optVar(t, ready, inC){ var k = optKind(); if (!k) return null; var hasQ = QN[o.u] && o.u !== 'day', act = 'data-act="' + (manual(o) ? 'request' : 'add') + '"' + (ready ? '' : ' disabled');
  var verb = manual(o) ? 'Request' : inC ? 'Update' : 'Add to my stay', short = manual(o) ? 'Request' : inC ? 'Update' : 'Add', pop = popNow ? 'ux-tot6' : 'ux-tot0';
  var tot = function(lbl){ return '<span class="tt"><small>' + (lbl || 'Total') + '</small><b class="' + pop + '">' + eur(t) + '</b></span>'; };
  if (k === 'list') return { ob: list62(true), bar: '<div class="ux-b64">' + tot() + '<button type="button" class="ux-cta" ' + act + '>' + verb + '</button></div>' };
  if (k === 'qbar') return { ob: list62(false) || '<div class="ux-l62"><div class="rw"><span class="lb"><b>' + esc(o.t) + '</b><small>' + eur(o.p) + ' ' + UNIT[o.u] + '</small></span><span class="hn">Set how many below</span></div></div>',
      bar: hasQ ? '<div class="ux-b64 ux-b66"><span class="q">' + stepper('q', sel.q, 1, qMax()) + '</span>' + tot() + '<button type="button" class="ux-cta" ' + act + '>' + short + '</button></div>' : '<div class="ux-b64">' + tot() + '<button type="button" class="ux-cta" ' + act + '>' + verb + '</button></div>' };
  if (k === 'picks') return { ob: picks64(), bar: '<div class="ux-b64 ux-b64f"><button type="button" class="ux-cta full" ' + act + '>' + verb + ' · <b class="' + pop + '">' + eur(t) + '</b></button></div>' };
  /* oscuras: las opciones dentro de la tarjeta negra de abajo */
  var inner = k === 'dblocks' ? choice() : k === 'dlist' ? list62(true) : k === 'dqty' ? list62(false) : picks64(), row;
  if (k === 'dpicks') row = '<button type="button" class="ux-cta full" ' + act + '>' + verb + ' · ' + eur(t) + '</button>';
  else if (k === 'dqty' && hasQ) row = '<span class="q">' + stepper('q', sel.q, 1, qMax()) + '</span>' + tot() + '<button type="button" class="ux-cta" ' + act + '>' + short + '</button>';
  else row = tot() + '<button type="button" class="ux-cta" ' + act + '>' + verb + '</button>';
  return { ob: '', bar: '<div class="ux-b64 ux-bset ux-k' + k + '">' + (inner ? '<div class="set">' + inner + '</div>' : '') + '<div class="row">' + row + '</div></div>' }; }
function opts6HTML(){ var t = amount(o, sel), ready = !(o.u === 'day' && !sel.days.length), inC = inCart(K);
  /* con aprobación: la nota es un botón que despliega cómo funciona (retención ≠ cobro); el cuadro flota encima y no cambia el alto de la hoja */
  var note = manual(o) ? '<button type="button" class="ux-tip" data-tip aria-expanded="false" aria-controls="ux-tipb">' + ic('lock') + 'Needs approval · only charged once approved' + ic('info', 'i') + '</button>'
      + '<span class="ux-tipb" id="ux-tipb" role="tooltip" hidden><button type="button" class="ux-tipc" data-tipc aria-label="Close">' + ic('x') + '</button><b>How the request works</b><span class="st"><i>1</i><span><b>We hold ' + eur(t) + ' on your card</b><small>Nothing is charged yet.</small></span></span><span class="st"><i>2</i><span><b>We confirm</b><small>Usually within a few hours. We email you the answer.</small></span></span><span class="st"><i>3</i><span><b>Charged only once we confirm</b><small>If not, the hold is released straight away.</small></span></span></span>'
    : ic('bolt') + 'Confirmed instantly · remove it free until you pay';
  var verb = manual(o) ? 'Request' : inC ? 'Update' : 'Add to my stay'; if (isV6() && !v68()) verb = eur(t) + ' · ' + (manual(o) ? 'Request' : inC ? 'Update' : 'Add');
  return '<div class="ux-grab6" data-drag aria-hidden="true"><span class="ux-grab"></span></div>' + '<button type="button" class="ux-x ux-shx" data-close aria-label="Close">' + ic('x') + '</button>'
    + '<div class="ux-h6"><h3>' + sheetQ() + '</h3><p>' + sheetSub() + '</p></div>'
    + (function(){ var ov = optVar(t, ready, inC); if (!ov) return ''; return '<div class="ux-ob ux-ob6 ux-obv">' + ov.ob + mailBlk() + '</div><div class="ux-ofm"><p class="ux-as">' + note + '</p>' + ov.bar + '</div>'; })()
    + (optVar(t, ready, inC) ? '' : '<div class="ux-ob ux-ob6">' + (slotted(o) ? pick67() + mailBlk() : choice()) + (v68() && rec68 && rec68.length ? cross2(K, rec68).replace('<p>Recommended for your stay</p>', '<p>Add to your order</p>') : '') + '</div>'
    + '<div class="ux-ofm"><p class="ux-as">' + note + '</p>' + (isV6() && slotted(o) ? capGain(t) : isV6() && !v68() ? capSel(t) : '<div class="ux-b64"><span><small>' + (v68() ? 'Cart total' : 'Total') + '</small><b class="' + (popNow ? 'ux-tot6' : 'ux-tot0') + '">' + eur(v68() ? tot68() : t) + '</b></span>') + (v68() ? '<button type="button" class="ux-cta" data-act="add68"' + (ready ? '' : ' disabled') + '>' + (inC ? 'Update' : 'Add') + ' · go to cart</button>' : '<button type="button" class="ux-cta" data-act="' + (manual(o) ? 'request' : 'add') + '"' + (ready ? '' : ' disabled') + '>' + verb + '</button>') + '</div></div>'); }
function optsHTML(){ if ((!desk && isV6()) || (desk && LV === 'v2')) return opts6HTML();   /* versión final: escritorio usa la misma hoja que el móvil */ var t = amount(o, sel), ready = !(o.u === 'day' && !sel.days.length);
  return (desk ? '<div class="ux-oh"><img src="' + isrc(o.img) + '" alt=""><span><b>' + esc(o.t) + '</b><small>' + priceOf(K) + ' ' + unitOf(K) + '</small></span><button type="button" class="ux-x" data-close aria-label="Close">' + ic('x') + '</button></div>' : '<span class="ux-grab" aria-hidden="true"></span>' + '<button type="button" class="ux-x ux-shx" data-close aria-label="Close">' + ic('x') + '</button>')   /* móvil: sin cabecera ni pasos de la retención */
    + '<div class="ux-ob">' + (!desk && slotted(o) && /^v6[2-5]$/.test(D) ? slotPicker() : gain() + choice()) + (manual(o) && desk ? how(t) : '') + '</div>'
    + (desk ? '' : '<div class="ux-ofm"><p class="ux-as">' + (manual(o) ? ic('lock') + 'Only charged once confirmed' : ic('bolt') + 'Confirmed instantly · paid with your booking') + '</p><div class="ux-b64"><span><small>Total</small><b>' + eur(t) + '</b></span>' + (manual(o) ? '<button type="button" class="ux-cta" data-act="request"' + (ready ? '' : ' disabled') + '>Request</button>' : '<button type="button" class="ux-cta" data-act="add"' + (ready ? '' : ' disabled') + '>' + (inCart(K) ? 'Update' : 'Add to my stay') + '</button>') + '</div></div>')
    + (!desk ? '' : '<div class="ux-of"><span><small>Total</small><b>' + eur(t) + '</b></span>' + (manual(o) ? '<button type="button" class="ux-cta" data-act="request"' + (ready ? '' : ' disabled') + '>Request</button>' : '<button type="button" class="ux-cta" data-act="add"' + (ready ? '' : ' disabled') + '>' + (inCart(K) ? 'Update' : 'Add to my stay') + '</button>') + '</div>'
    + '<p class="ux-as">' + (manual(o) ? ic('lock') + 'Only charged once confirmed' : ic('bolt') + 'Confirmed instantly · paid with your booking') + '</p>'); }
function valueBlock(){ var early = o.type === 'early', std = early ? STAY.checkin : STAY.checkout, sh = hrs(std);
  var L = sortedSlots(o).map(function(x){ var d = Math.abs(hrs(x[0]) - sh); return { t: x[0], p: x[1], d: d, ph: d ? x[1] / d : 0 }; }).sort(function(a, b){ return a.d - b.d; });
  var mx = Math.max.apply(null, L.map(function(x){ return x.d; })), day = early ? 'arrival day' : 'last day', verb = early ? 'Check in at ' : 'Leave at ';
  return '<div class="ux-v3b"><p class="ux-v3h"><b>+' + fh(mx) + ' h</b><span>Up to ' + fh(mx) + ' extra hours on your ' + day + '</span></p><ul class="ux-v3l">'
      + L.map(function(x){ return '<li><span class="t">' + x.t + '</span><span class="bar"><i data-r="' + (mx ? x.d / mx : 0) + '" style="width:' + Math.max(18, x.d / mx * 100).toFixed(0) + '%">+' + fh(x.d) + ' h</i></span><b>' + eur(x.p) + '</b></li>'; }).join('')
      + '<li class="std"><span class="t">Standard ' + std + '</span><span class="bar"></span><b>Included</b></li>'   /* la hora estándar, al final, con la barra vacía */
      + '</ul></div>';
}
/* lo que trae el kit sale de la descripción del anfitrión (cama, cuencos, premios, limpieza) */
/* «Bring your pet» con presentación propia en la lista · 3 versiones (t1 banner, t2 pregunta, t3 foto) */
function petCard(){ if (!TV || !O.pet || paid('pet') || inCart('pet')) return '';   /* comprado: va como una fila más en «For your stay» */ var q = hq('pet'), x = q.x, pr = q.st || eur(x.p), ad = q.st ? q.st : 'Add your pet · ' + eur(x.p);
  if (TV === '1') return '<button type="button" class="ux-pc1" ' + q.dest + '><img src="' + isrc(x.img) + '" alt=""><span class="tt"><small>' + ic('paw') + 'Pet-friendly house</small><b>Travelling with your pet?</b><span>' + esc(x.hl) + '</span><em>' + ad + ic('right') + '</em></span></button>';
  if (TV.charAt(0) === '2') return '<button type="button" class="ux-pc2' + (TV.length > 1 ? ' k' + TV.charAt(1) : '') + (q.st === 'Purchased' ? ' own' : '') + '" ' + q.dest + '><span class="pw">' + ic('paw') + '</span><span class="tt"><b>Bringing a pet?</b><small>' + (q.st === 'Purchased' ? '<span class="ux-bought">' + ic('check') + 'Purchased</span>' : q.st ? q.st : eur(x.p) + ' per pet · ' + esc(x.hl.toLowerCase())) + '</small></span><em' + (q.st ? ' class="ok"' : '') + '>' + (q.st ? ic('check') : 'Add' + ic('plus')) + '</em></button>';
  return '<button type="button" class="ux-pc3" ' + q.dest + '><img src="' + isrc(x.img) + '" alt=""><span class="ux-psh"></span><span class="kk">' + ic('paw') + 'Pets welcome</span><span class="tt"><b>' + esc(x.t) + '</b><small>' + esc(x.hl) + '</small></span><span class="cta">' + ad + ic('right') + '</span></button>'; }
function petHM(){ return isV6() && SC === 'instant' && K === 'pet' && LV === 'v2' && !busy(K) && (!IV || IV === '2'); }
function petHowMany(){ return '<div class="ux-pt2"><p class="ux-k">How many pets are coming?</p><div class="g" role="radiogroup" aria-label="Pets">' + [1, 2, 3].map(function(q){ return '<button type="button" role="radio" aria-checked="' + (sel.q === q) + '" data-qv="' + q + '"><span class="pw">' + new Array(q + 1).join(ic('paw')) + '</span><b>' + q + ' pet' + (q > 1 ? 's' : '') + '</b><small>' + eur(o.p * q) + '</small></button>'; }).join('') + '</div></div>'; }
function petBlock(v){ var TV = v; var kit = [['bed', 'Bed'], ['bowl', 'Bowls'], ['bone', 'Treats'], ['clean', 'Clean-up']];
  if (TV === '1') return '<div class="ux-pt1"><p class="ux-k">Waiting for your pet</p><div class="g">' + kit.map(function(k){ return '<span><i>' + ic(k[0]) + '</i>' + k[1] + '</span>'; }).join('') + '</div></div>';
  if (TV === '2') return '<div class="ux-pt2"><p class="ux-k">How many pets are coming?</p><div class="g" role="radiogroup" aria-label="Pets">' + [1, 2, 3].map(function(q){ return '<button type="button" role="radio" aria-checked="' + (sel.q === q) + '" data-qv="' + q + '"><span class="pw">' + new Array(q + 1).join(ic('paw')) + '</span><b>' + q + ' pet' + (q > 1 ? 's' : '') + '</b><small>' + eur(o.p * q) + '</small></button>'; }).join('') + '</div></div>';
  return '<div class="ux-pt3"><span class="bd">' + ic('paw') + '</span><div class="ux-pt3x"><b>Pet-friendly stay</b><span>' + ic('check') + eur(o.p) + ' per pet</span><span>' + ic('check') + (manual(o) ? 'We confirm it' : 'Confirmed instantly') + '</span><span>' + ic('check') + 'Bed, bowls, treats and clean-up</span></div></div>'; }
/* fotos del deal: las suyas y, si en Deal settings se piden más («Photos»), se completan con fotos de la casa */
var POOL = ['gb-hall.jpg', 'gb-living.jpg', 'gb-terrace.jpg', 'gb-pool.jpg', 'gb-living2.jpg', 'gb-terrace2.jpg', 'room.jpg', 'gb-plaza.jpg', 'gb-street.jpg', 'mesa.jpg'];
function photos(k){ var x = O[k] || o, own = [x.img].concat(GAL[k] || []).filter(function(f, n, a){ return a.indexOf(f) === n; }), np = parseInt(x.np, 10);
  if (!np) return own; var all = own.concat(POOL.filter(function(f){ return own.indexOf(f) < 0; })); return all.slice(0, Math.max(1, Math.min(np, all.length))); }
function vDetail6(){ var c = inCart(K), r = st.req[K], b = busy(K), imgs = photos(K);
  var h = '<div class="ux-car6" aria-roledescription="carousel" aria-label="Photos of ' + esc(o.t) + '"><div class="ux-c6t">' + imgs.map(function(f, n){ return '<img src="' + isrc(f) + '" alt="' + esc(o.t) + ', photo ' + (n + 1) + ' of ' + imgs.length + '">'; }).join('') + '</div>'   /* todas las fotos se cargan desde el principio: al pasar no se ve un hueco vacío */
    + (imgs.length > 1 ? '<span class="ux-c6n">1/' + imgs.length + '</span><span class="ux-c6d">' + imgs.map(function(f, n){ return '<i class="' + (n ? '' : 'on') + '"></i>'; }).join('') + '</span>'
      + '<span class="ux-c6b" aria-hidden="true">' + imgs.map(function(){ return '<i><b></b></i>'; }).join('') + '</span>' : '')
    + (imgs.length > 1 ? '<button type="button" class="ux-gal" data-gal>' + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>Gallery</button>' : '')
    + '<button type="button" class="ux-bk6" data-go="' + BACK + '" aria-label="' + (BACK === 'home' ? 'Back' : 'Back to extras') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>'
    + (!desk && BACK === 'home' ? '<a class="ux-seeall6" href="ux-list' + EXT + '">See all offers<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></a>' : '')   /* móvil: deal abierto desde la home → arriba a la derecha, enlace a la lista de extras */
    + '</div>'   /* sin la etiqueta «Instant» / «Marta confirms» sobre la foto */
    + '<div class="ux-m6"><div class="ux-t6"><h2>' + esc(o.t) + '</h2><p>' + esc(o.hl) + '</p></div>';
  /* en móvil el estado (añadido / solicitud enviada) va en la barra, no dentro del panel: así el panel, la foto y las hojas miden lo mismo en todos los pasos */
  if (b && desk && !(XV && LV === 'v2')) h += '<div class="ux-note rq">' + ic('clock') + '<span><b>' + (r.st === 'waiting' ? 'Request sent.' : 'Ready to send.') + '</b> ' + esc(r.sub) + ' · ' + eur(r.amt) + (r.st === 'waiting' ? ' held, not charged.' : ' held when you send it.') + '</span></div>';
  else if (c && desk && !(XV && LV === 'v2')) h += '<div class="ux-note ok">' + ic('check') + '<span><b>Already added:</b> ' + esc(c.sub) + ' · ' + eur(c.amt) + '.</span></div>';
  if (petHM() && !dbuyOn()) h += petHowMany();   /* escritorio B: el número de mascotas se elige en el panel de compra */
  else if (K === 'pet' && LV === 'v2' && !desk && (IV === '1' || IV === '3')) h += petBlock(IV);   /* mascotas: «How many pets are coming?» en el panel */
  if (o.ds) h += '<div class="ux-d6"><p class="ux-k">About this extra</p><p class="ux-dtx">' + esc(o.ds) + '</p><button type="button" class="ux-rm6" data-desc hidden>Read more</button></div>';
  /* Early / Late: lo que gana el huésped con cada franja, solo para informar (se elige en la hoja de compra) */
  if (slotted(o) && (!desk || LV === 'v2')) h += valueBlock();
  if (inlOn()) h += '<div class="ux-inl ux-i' + D + '">' + inlHTML() + '</div>';   /* pasos unificados: si sobra sitio, las opciones van en el panel y no hace falta la hoja */
  h += '</div>';
  var btn = b ? '<button type="button" class="ux-cta" data-go="mine">See my extras' + ic('right') + '</button>'
    : manual(o) ? '<button type="button" class="ux-cta" data-act="opts">Request</button>'
    : '<button type="button" class="ux-cta" data-act="' + (needsOpts() ? 'opts' : 'add') + '">' + (c ? 'Change' : 'Add to my stay') + '</button>';
  if (desk && XV && LV === 'v2') { h = h.replace('<p class="ux-k">About this extra</p>', '<p class="ux-k">Details</p>');
    if (GV) { var c0 = h.indexOf('<div class="ux-car6"'), c1 = h.indexOf('<div class="ux-m6">'); if (c0 > -1 && c1 > c0) h = h.slice(0, c0) + galDesk() + h.slice(c1); }
    if (DV) { var a0 = h.indexOf('<div class="ux-d6">'), a1 = a0 > -1 ? h.indexOf('</div>', a0) + 6 : -1, dd;
      if (DV === '1') dd = '<div class="ux-dd1"><p>' + esc(o.ds) + '</p></div>';   /* texto suelto bajo el subtítulo */
      else if (DV === '2') dd = '<div class="ux-dd2"><p class="k">Details</p><p>' + esc(o.ds) + '</p></div>';   /* sección con etiqueta pequeña y línea */
      else dd = '<dl class="ux-dd3"><div><dt>Details</dt><dd>' + esc(o.ds) + '</dd></div><div><dt>Price</dt><dd>' + priceOf(K) + ' ' + unitOf(K) + '</dd></div><div><dt>Confirmation</dt><dd>' + (manual(o) ? 'We confirm it, usually within a few hours' : 'Confirmed instantly') + '</dd></div>' + (o.dd || slotted(o) ? '<div><dt>When</dt><dd>' + (slotted(o) ? 'You pick the time' : o.u === 'day' ? 'You pick the days and time' : 'You pick the day and time') + '</dd></div>' : '') + '</dl>';   /* ficha con los datos del dashboard */
      if (a0 > -1 && a1 > a0) h = h.slice(0, a0) + dd + h.slice(a1); }   /* escritorio B: sin las píldoras de ventajas; «Details» en vez de «About this extra» */ if (XV === '3' || XV === '4') h = '<div class="ux-dx ux-dx' + XV + '"><div class="ux-dxl">' + h + '</div><div class="ux-dxr"><div class="ux-dbuy"></div></div></div>'; }
  return { body: h, bar: bar6(btn, b, c) }; }
/* ---------- pasos unificados (V6 móvil): si las opciones caben en el panel con hueco de sobra, se eligen ahí y «Add to my stay» añade directamente ---------- */
var INL = true, INLMIN = 220;   /* INLMIN: la foto no baja de aquí por meter las opciones; si haría falta, se vuelve a la hoja */
function uni(){ return !desk && isV6() && SC === 'instant' && !slotted(o) && needsOpts() && !busy(K); }   /* deals donde se pueden juntar pasos: nunca Early / Late */
function inlOn(){ return false; }
/* lo que va en la tarjeta según la versión */
/* V6.5–V6.8 · los ajustes dentro de la tarjeta negra (crece hacia arriba); abajo, el total y el botón */
function setOn(){ return false; }
/* ---------- V6.1–V6.4 · solo unidades (sin Delivery date): la cantidad se elige en la barra, sin abrir la hoja ---------- */
function qBar(){ return !desk && isV6() && SC === 'instant' && /^v6([1-4]|1[1-4]|4[1-4])$/.test(D) && !slotted(o) && !o.dd && !!QN[o.u] && o.u !== 'day' && !busy(K); }
function unitWord(q){ var N = { unit: ['unit', 'units'], pet: ['pet', 'pets'], person: ['guest', 'guests'] }[o.u] || ['unit', 'units']; return q + ' ' + N[q === 1 ? 0 : 1]; }
function qBarHTML(c){ var t = amount(o, sel), act = 'data-act="' + (manual(o) ? 'request' : 'add') + '"', per = eur(o.p) + ' ' + UNIT[o.u];
  var add = manual(o) ? 'Request' : c ? 'Update' : 'Add', stp = stepper('q', sel.q, 1, qMax()), pop = popNow ? 'ux-tot6' : 'ux-tot0';
  /* desde V6.1 */
  if (D === 'v611') return '<div class="ux-b64 ux-bq ux-bq611"><span class="tt"><b>' + eur(t) + '</b><small>' + unitWord(sel.q) + ' · ' + per + '</small></span><span class="pill">' + stp + '</span><button type="button" class="ux-cta" ' + act + '>' + add + '</button></div>';
  if (D === 'v612') return '<div class="ux-b64 ux-bq ux-bq612"><span class="tt"><b>' + eur(o.p) + '</b><small>' + UNIT[o.u] + '</small></span><span class="cap">' + stp + '<i></i><button type="button" class="ux-cta" ' + act + '>' + add + ' · ' + eur(t) + '</button></span></div>';
  if (D === 'v613') return '<div class="ux-b64 ux-b66 ux-b67 ux-bq ux-bq613"><span class="q">' + stp + '</span><span class="tt"><b>' + eur(t) + '</b><small>' + (c ? 'In your cart' : 'Total') + '</small></span><button type="button" class="ux-cta" ' + act + '>' + add + '</button></div>';
  if (D === 'v614') return '<div class="ux-b64 ux-bq ux-bq614"><div class="big">' + stp.replace('<output aria-live="polite">' + sel.q + '</output>', '<output aria-live="polite"><b>' + unitWord(sel.q) + '</b><small>' + eur(t) + '</small></output>') + '</div><button type="button" class="ux-cta full" ' + act + '>' + (manual(o) ? 'Request' : c ? 'Update my stay' : 'Add to my stay') + '</button></div>';
  /* desde V6.4 */
  if (D === 'v641') return '<div class="ux-b64 ux-b67 ux-bq ux-bq641"><span class="tt"><span class="hl">' + stp.replace('<output aria-live="polite">' + sel.q + '</output>', '<output aria-live="polite">' + unitWord(sel.q) + '</output>') + '</span><small>' + per + '</small></span><button type="button" class="ux-cta" ' + act + '>' + eur(t) + ' · ' + add + '</button></div>';
  if (D === 'v642') { var mx = Math.min(qMax(), 6), qs = []; for (var q = 1; q <= mx; q++) qs.push(q); if (sel.q > mx) qs.push(sel.q);
    return '<div class="ux-b64 ux-b67 ux-bq ux-bq642"><span class="tt"><b class="' + pop + '">' + unitWord(sel.q) + '</b><span class="nums" role="radiogroup" aria-label="' + QN[o.u] + '">' + qs.map(function(q){ return '<button type="button" role="radio" aria-checked="' + (sel.q === q) + '" data-qv="' + q + '">' + q + '</button>'; }).join('') + '</span></span><button type="button" class="ux-cta" ' + act + '>' + eur(t) + ' · ' + add + '</button></div>'; }
  if (D === 'v643') return '<div class="ux-b64 ux-b67 ux-bq ux-bq643"><span class="tt"><span class="hl"><b class="' + pop + '">' + eur(t) + '</b>' + stp + '</span><small>' + sel.q + ' × ' + per + '</small></span><button type="button" class="ux-cta" ' + act + '>' + add + '</button></div>';
  if (D === 'v644') return '<div class="ux-b64 ux-b67 ux-bq ux-bq644"><div class="top"><span class="tt"><b>' + unitWord(sel.q) + '</b><small>' + per + '</small></span>' + stp + '</div><button type="button" class="ux-cta full" ' + act + '>' + (manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay') + ' · ' + eur(t) + '</button></div>';
  if (D === 'v61') return '<div class="ux-b64 ux-b66"><span class="q">' + stepper('q', sel.q, 1, qMax()) + '</span><span class="tt"><b>' + eur(t) + '</b><small>' + (c ? 'In your cart' : 'Total') + '</small></span><button type="button" class="ux-cta" ' + act + '>' + (manual(o) ? 'Request' : c ? 'Update' : 'Add') + '</button></div>';
  if (D === 'v62') { if (c && !manual(o)) return '<div class="ux-b64 ux-bq62"><span class="tt"><b>' + eur(c.amt) + '</b><small>In your cart · ' + per + '</small></span><span class="pill">' + stepper('cq', sel.q, 0, qMax()) + '</span></div>';
    return '<div class="ux-b64"><span><b>' + eur(o.p) + '</b><small>' + UNIT[o.u] + '</small></span><button type="button" class="ux-cta" ' + act + '>' + (manual(o) ? 'Request' : 'Add to my stay') + '</button></div>'; }
  if (D === 'v63') { var mx = Math.min(qMax(), 6), qs = []; for (var q = 1; q <= mx; q++) qs.push(q); if (sel.q > mx) qs.push(sel.q);
    return '<div class="ux-b64 ux-bset ux-kq63"><div class="set"><div class="ux-p64"><div class="g"><p>' + QN[o.u] + ' · ' + per + '</p><div class="pl">' + qs.map(function(q){ return '<button type="button" role="radio" aria-checked="' + (sel.q === q) + '" data-qv="' + q + '" class="n">' + q + '</button>'; }).join('') + '</div></div></div></div>'
      + '<div class="row"><span class="tt"><b>' + eur(t) + '</b><small>' + (c ? 'In your cart' : 'Total') + '</small></span><button type="button" class="ux-cta" ' + act + '>' + (manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay') + '</button></div></div>'; }
  /* V6.4 */
  return '<div class="ux-b64 ux-b67 ux-bq64"><span class="tt"><span class="hl"><b>' + unitWord(sel.q) + '</b>' + stepper('q', sel.q, 1, qMax()) + '</span><small>' + per + '</small></span><button type="button" class="ux-cta" ' + act + '>' + eur(t) + ' · ' + (manual(o) ? 'Request' : c ? 'Update' : 'Add') + '</button></div>'; }   /* (las opciones ya no van en la tarjeta: se eligen en la hoja) */
function setHTML(){ if (D === 'v65') return choice(); if (D === 'v66') return list62(true); if (D === 'v67') return list62(false); if (D === 'v68') return picks64(); return ''; }
function setBar(c){ var t = amount(o, sel), ok = !(o.u === 'day' && !sel.days.length), act = 'data-act="' + (manual(o) ? 'request' : 'add') + '"' + (ok ? '' : ' disabled'), verb = manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay', row;
  if (D === 'v68') row = '<button type="button" class="ux-cta full" ' + act + '>' + verb + ' · ' + eur(t) + '</button>';
  else if (D === 'v67' && QN[o.u] && o.u !== 'day') row = '<span class="q">' + stepper('q', sel.q, 1, qMax()) + '</span><span class="tt"><b>' + eur(t) + '</b><small>' + (c ? 'In your cart' : 'Total') + '</small></span><button type="button" class="ux-cta" ' + act + '>' + (manual(o) ? 'Request' : c ? 'Update' : 'Add') + '</button>';
  else row = '<span class="tt"><b>' + eur(t) + '</b><small>' + (c ? 'In your cart' : manual(o) ? 'Only charged once confirmed' : 'Total') + '</small></span><button type="button" class="ux-cta" ' + act + '>' + verb + '</button>';
  return '<div class="ux-b64 ux-bset ux-s' + D + '"><div class="set">' + setHTML() + '</div><div class="row">' + row + '</div></div>'; }
function inlHTML(){ if (D === 'v61') return choice(); if (D === 'v62') return list62(true); if (D === 'v63') return list62(false); if (D === 'v64') return picks64(); return ''; }
/* V6.2 / V6.3 · una tarjeta de ajustes con filas: etiqueta a la izquierda, control a la derecha (la hora, debajo, en una tira) */
function list62(withQ){ var r = [], row = function(l, sub, ctl, cls){ return '<div class="rw' + (cls ? ' ' + cls : '') + '"><span class="lb"><b>' + l + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + ctl + '</div>'; };
  var days = function(attr, multi){ return '<div class="dy" role="' + (multi ? 'group' : 'radiogroup') + '">' + STAY.days.map(function(d, i){ var on = multi ? sel.days.indexOf(i) > -1 : sel.d === i; return '<button type="button" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" ' + attr + '="' + i + '"><small>' + d[0] + '</small><b>' + d[1] + '</b></button>'; }).join('') + '</div>'; };
  if (o.u === 'day') r.push(row('Days', eur(o.p) + ' per day', days('data-dayx', true)));
  if (o.dd) { r.push(row('Day', 'Nov', days('data-dd', false))); r.push(row('Time', '', '<div class="ux-times tm" role="radiogroup" aria-label="Time">' + TIMES.map(function(t){ return '<button type="button" role="radio" aria-checked="' + (sel.time === t) + '" data-time="' + t + '">' + t + '</button>'; }).join('') + '</div>', 'stk')); }
  if (withQ && QN[o.u] && o.u !== 'day') r.push(row(QN[o.u], eur(o.p) + ' ' + UNIT[o.u], stepper('q', sel.q, 1, qMax())));
  return r.length ? '<div class="ux-l62">' + r.join('') + '</div>' : ''; }
/* V6.4 · elección rápida: todo en píldoras de un toque (cantidad 1, 2, 3…), con etiquetas pequeñas encima */
function picks64(){ var h = '', grp = function(l, inner){ return '<div class="g"><p>' + l + '</p><div class="pl">' + inner + '</div></div>'; };
  if (o.u === 'day') h += grp('Which days · ' + eur(o.p) + ' per day', STAY.days.map(function(d, i){ return '<button type="button" role="checkbox" aria-checked="' + (sel.days.indexOf(i) > -1) + '" data-dayx="' + i + '">' + d[0] + ' ' + d[1] + '</button>'; }).join(''));
  if (o.dd && o.u === 'day') h += '<div class="g"><p>Time · same each day</p><div class="pl ux-times tm" role="radiogroup" aria-label="Time">' + TIMES.map(function(t){ return '<button type="button" role="radio" aria-checked="' + (sel.time === t) + '" data-time="' + t + '">' + t + '</button>'; }).join('') + '</div></div>';
  else if (o.dd) { h += grp('Day', STAY.days.map(function(d, i){ return '<button type="button" role="radio" aria-checked="' + (sel.d === i) + '" data-dd="' + i + '">' + d[0] + ' ' + d[1] + '</button>'; }).join(''));
    h += '<div class="g"><p>Time</p><div class="pl ux-times tm" role="radiogroup" aria-label="Time">' + TIMES.map(function(t){ return '<button type="button" role="radio" aria-checked="' + (sel.time === t) + '" data-time="' + t + '">' + t + '</button>'; }).join('') + '</div></div>'; }
  if (QN[o.u] && o.u !== 'day') { var mx = Math.min(qMax(), 6), qs = []; for (var q = 1; q <= mx; q++) qs.push(q); if (sel.q > mx) qs.push(sel.q);
    h += grp(QN[o.u] + ' · ' + eur(o.p) + ' ' + UNIT[o.u], qs.map(function(q){ return '<button type="button" role="radio" aria-checked="' + (sel.q === q) + '" data-qv="' + q + '" class="n">' + q + '</button>'; }).join('')); }
  return h ? '<div class="ux-p64">' + h + '</div>' : ''; }
/* V6.6: si la única opción es la cantidad, el contador va en la barra */
function qMax(){ return o.u === 'person' ? 12 : o.u === 'pet' ? 3 : 9; }
function barStep(){ return D === 'old-v66' && uni() && QN[o.u] && o.u !== 'day' && !o.dd; }
/* V6.7: «Add to my stay» añade al momento y se ajusta en la hoja de «Added» · V6.8: opciones y recomendados en una sola hoja que lleva al carrito */
function v67(){ return D === 'old-v67' && uni() && !manual(o); }
function v68(){ return D === 'old-v68' && uni() && !manual(o); }
function inlPatch(){ var b = document.querySelector('.ux-m6 .ux-inl'), fb = document.getElementById('ux-fbar'); if (!b && !barStep() && !setOn() && !qBar()) return false;
  var ft = fb && fb.querySelector('.ux-times'), fsx = ft ? ft.scrollLeft : 0;
  if (b) { var tx = b.querySelector('.ux-times'), sx = tx ? tx.scrollLeft : 0; b.innerHTML = inlHTML(); var nt = b.querySelector('.ux-times'); if (nt) nt.scrollLeft = sx; }
  if (fb) { fb.innerHTML = '<div class="ux-dock">' + vDetail6().bar + '</div>'; var nft = fb.querySelector('.ux-times'); if (nft) nft.scrollLeft = fsx; } return true; }
/* barra de compra de la V6 y sus versiones */
function bar6(btn, b, c){ var pr = priceOf(K), un = unitOf(K);
  var act = b ? 'data-go="mine"' : manual(o) ? 'data-act="opts"' : 'data-act="' + (needsOpts() ? 'opts' : 'add') + '"', verb = b ? 'See my extras' : manual(o) ? 'Request' : c ? 'Change' : 'Add to my stay';
  if (petHM() && !b) return '<div class="ux-b64 ux-b64f ux-bpet"><button type="button" class="ux-cta full" data-act="' + (manual(o) ? 'request' : 'add') + '">' + (manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay') + ' · ' + eur(amount(o, sel)) + '</button></div>';   /* mascotas: el número se elige en el panel, la barra solo lleva el botón */
  if (qBar()) return qBarHTML(c);
  if (setOn()) return setBar(c);
  if (barStep()) { var t6 = amount(o, sel), v6b = manual(o) ? 'Request' : c ? 'Update' : 'Add';
    return '<div class="ux-b64 ux-b66"><span class="q">' + stepper('q', sel.q, 1, qMax()) + '</span><span class="tt"><b>' + eur(t6) + '</b><small>' + (c ? 'In your cart' : 'Total') + '</small></span><button type="button" class="ux-cta" data-act="' + (manual(o) ? 'request' : 'add') + '">' + v6b + '</button></div>'; }
  if (v67() && !c) act = 'data-act="add"';
  if (inlOn() && D === 'v64') { var t4 = amount(o, sel), ok4 = !(o.u === 'day' && !sel.days.length);
    return '<div class="ux-b64 ux-b64f"><button type="button" class="ux-cta full" data-act="' + (manual(o) ? 'request' : 'add') + '"' + (ok4 ? '' : ' disabled') + '>' + (manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay') + ' · ' + eur(t4) + '</button></div>'; }
  if (inlOn()) { var tI = amount(o, sel), okI = !(o.u === 'day' && !sel.days.length), vI = manual(o) ? 'Request' : c ? 'Update' : 'Add to my stay';
    return '<div class="ux-b64"><span><b>' + eur(tI) + '</b><small>' + (c ? 'In your cart' : manual(o) ? 'Only charged once confirmed' : 'Total') + '</small></span><button type="button" class="ux-cta" data-act="' + (manual(o) ? 'request' : 'add') + '"' + (okI ? '' : ' disabled') + '>' + vI + '</button></div>'; }
  if (desk) return '<div class="ux-pb"><span><b>' + pr + '</b><small>' + un + '</small></span>' + btn + '</div>';
  /* móvil: cápsula flotante marino */
  var rq = st.req[K]; if (b && rq) { pr = eur(rq.amt); un = rq.st === 'waiting' ? 'Sent · held, not charged' : 'Ready to send · held'; } else if (c) { pr = eur(c.amt); un = 'In your cart · ' + (c.sub || '').replace(/^Check (in|out) at /, '').split(' · ')[0]; }
  return '<div class="ux-b64"><span><b>' + pr + '</b><small>' + un + '</small></span><button type="button" class="ux-cta" ' + act + '>' + verb + '</button></div>'; }
function vDetail(){ if (isV6()) return vDetail6(); var c = inCart(K), r = st.req[K], b = busy(K), t = amount(o, sel), h = '';
  if (b) h += '<div class="ux-note rq">' + ic('clock') + '<span><b>' + (r.st === 'waiting' ? 'Request sent.' : 'Ready to send.') + '</b> ' + esc(r.sub) + ' · ' + eur(r.amt) + (r.st === 'waiting' ? ' held, not charged.' : ' held when you send it.') + '</span></div>';
  else if (c) h += '<div class="ux-note ok">' + ic('check') + '<span><b>Already added:</b> ' + esc(c.sub) + ' · ' + eur(c.amt) + '. Change it below.</span></div>';
  h += (D === 'v4' ? '' : gain()) + choice() + (D === 'v5' ? addons() : '') + (manual(o) ? how(t) : '') + desc();
  h = (D === 'v4' ? (gain() || when()) + hero() : hero()) + '<div class="ux-dbody">' + h + '</div>';
  var cta, note = '', same = c && JSON.stringify(c.sel) === JSON.stringify(sel), ready = !(o.u === 'day' && !sel.days.length);
  if (b) cta = '<button type="button" class="ux-cta full" data-go="mine">See my extras' + ic('right') + '</button>';
  else if (manual(o)) { cta = '<button type="button" class="ux-cta full" data-act="request"' + (ready ? '' : ' disabled') + '>Request · ' + eur(t) + '</button>'; note = ic('lock') + 'Only charged once confirmed'; }
  else { cta = same ? '<button type="button" class="ux-cta full" data-go="mine">Review & pay' + ic('right') + '</button>' : '<button type="button" class="ux-cta full" data-act="add"' + (ready ? '' : ' disabled') + '>' + (c ? 'Update · ' : 'Add to my stay · ') + eur(t) + '</button>'; note = ic('bolt') + 'Confirmed instantly · paid with your booking'; }
  return { body: h, bar: '<div class="ux-buy">' + cta + (note ? '<p class="ux-as">' + note + '</p>' : '') + '</div>' }; }

/* ---------- Sin extras ---------- */
function vEmpty(){ return { body: '<div class="ux-empty"><span>' + ic('gift') + '</span><h2>No extras for your dates yet</h2><p>' + 'We haven’t added extras for this stay yet. Need an earlier arrival, a cot or a ride from the airport? Ask her, hosts can often arrange it.</p><button type="button" class="ux-cta" data-toast="Opens a chat with us">' + ic('msg') + 'Ask us</button></div>',
  bar: '<div class="ux-buy"><button type="button" class="ux-cta full ghost" data-go="home">Back to your stay</button></div>' }; }

/* ---------- Mis extras ---------- */
function thumb(k){ return '<img class="ux-th" src="' + isrc(O[k].img) + '" alt="">'; }
function vMine(){ var h = '', any = false;
  keys(['declined']).forEach(function(k){ var r = st.req[k], x = O[k], alt = slotted(x) ? sortedSlots(x).filter(function(z){ return z[0] !== r.slot; }).slice(-1)[0] : null; any = true;
    h += '<div class="ux-box"><div class="ux-bh">' + thumb(k) + '<span><b>' + esc(x.t) + '</b><small>' + esc(r.sub) + '</small></span><span class="ux-st no">' + ic('x') + 'Not confirmed</span></div>'
      + '<blockquote class="ux-q"><p>“We have guests leaving that morning, so we can’t have the house ready by ' + (r.slot || 'then') + '. Sorry! You can leave your bags with us from 9:00.”</p><cite><span>' + ic('user') + '</span>Our reply · today, 09:05</cite></blockquote>'
      + '<p class="ux-ms ok">' + ic('check') + 'The ' + eur(r.amt) + ' hold was released. You weren’t charged.</p>'
      + (inCart('luggage') || LV === 'v2' ? '' : '<div class="ux-plan"><img src="' + isrc(O.luggage.img) + '" alt=""><span><small>Our plan B</small><b>' + esc(O.luggage.t) + '</b><small>' + eur(O.luggage.p) + ' ' + UNIT[O.luggage.u] + ' · instant</small></span><button type="button" class="ux-cta sm" data-quick="luggage">' + ic('plus') + 'Add</button></div>')
      + (alt && LV !== 'v2' ? '<button type="button" class="ux-lk" data-again="' + k + '" data-slot2="' + alt[0] + '">Ask for ' + alt[0] + ' instead · ' + eur(alt[1]) + '</button>' : '')
      + (LV === 'v2' ? '' : '<button type="button" class="ux-lk mu" data-dismiss="' + k + '">Dismiss</button>') + '</div>'; });
  keys(['waiting']).forEach(function(k){ var r = st.req[k]; any = true;
    if (WV) { h += waitCard(k, r); return; }
    h += '<div class="ux-box"><div class="ux-bh">' + thumb(k) + '<span><b>' + esc(O[k].t) + '</b><small>' + esc(r.sub) + '</small></span><span class="ux-st rq">' + ic('clock') + 'Waiting</span></div>'
      + '<ol class="ux-prog"><li class="d"><i>' + ic('check') + '</i><b>Sent</b><small>' + r.at.replace('Sent ', '') + '</small></li><li class="n"><i></i><b>We’re reviewing</b><small>a few hours</small></li><li><i></i><b>Answer</b><small>by email</small></li></ol>'
      + '<p class="ux-ms">' + ic('lock') + eur(r.amt) + ' held on ' + STAY.card + ' · not charged</p><button type="button" class="ux-lk" data-cancel="' + k + '">Cancel request</button></div>'; });
  keys(['cancelled']).forEach(function(k){ var r = st.req[k]; any = true;
    h += '<div class="ux-box"><div class="ux-bh">' + thumb(k) + '<span><b>' + esc(O[k].t) + '</b><small>Cancelled · ' + eur(r.amt) + ' hold released</small></span><span class="ux-st mu">Cancelled</span></div><button type="button" class="ux-lk" data-open="' + k + '">Request again</button></div>'; });
  var q = keys(['queued']);
  if (paidList().length) { any = true; h += '<div class="ux-sec"><h3>Confirmed</h3>' + (LV === 'v2' ? '' : '<span>paid · receipt by email</span>') + '</div><div class="ux-box ls">' + paidList().map(function(x){ return '<div class="ux-li">' + thumb(x.id) + '<span><b>' + esc(x.n) + '</b><small>' + esc(x.sub) + '</small></span><span class="ux-st ok">' + ic('check') + eur(x.amt) + '</span></div>'; }).join('') + '</div>'; }
  /* v2: carrito y solicitudes juntos, con las filas de la lista (azul = en el carrito, gris = necesita aprobación; la retención nunca se suma al pago) */
  if (LV === 'v2' && (st.cart.length || q.length)) { any = true; var crow = function(id, n, sub, extra, cls, badge, rm){ return '<div class="ux-lr ux-cr ' + cls + '"><div class="ux-lrm"><img src="' + isrc(O[id].img) + '" alt=""><span class="ux-lrt"><b>' + esc(n) + '</b><small>' + esc(sub) + '</small><span class="pr">' + badge + extra + '</span></span></div>' + rm + '</div>'; };
    h += '<div class="ux-sec"><h3>In your cart</h3></div><div class="ux-l2">'
      + st.cart.map(function(x){ return crow(x.id, x.n, x.sub, '<strong>' + eur(x.amt) + '</strong>', 'incart', '<em class="ux-bought ux-incb">' + ic('cart') + 'In your cart</em>', '<button type="button" class="ux-add ux-rmx" data-rm="' + x.id + '" aria-label="Remove ' + esc(x.n) + '">' + ic('x') + '</button>'); }).join('')
      + q.map(function(k){ var r = st.req[k]; return crow(k, O[k].t, r.sub, '<span class="hl">' + eur(r.amt) + ' hold</span>', 'incart', '<em class="ux-bought ux-incb">' + ic('cart') + 'In your cart</em>', '<button type="button" class="ux-add ux-rmx" data-unq="' + k + '" aria-label="Remove ' + esc(O[k].t) + '">' + ic('x') + '</button>'); }).join('')
      + '</div>'; }
  else if (st.cart.length) { any = true; h += '<div class="ux-sec"><h3>Added to your stay</h3><span>paid with your booking</span></div><div class="ux-box ls">' + st.cart.map(function(x){ return '<div class="ux-li">' + thumb(x.id) + '<span><b>' + esc(x.n) + '</b><small>' + esc(x.sub) + '</small></span><b class="ux-am">' + eur(x.amt) + '</b><button type="button" class="ux-x" data-rm="' + x.id + '" aria-label="Remove ' + esc(x.n) + '">' + ic('x') + '</button></div>'; }).join('') + '</div>'; }
  if (q.length && LV !== 'v2') { any = true; h += '<div class="ux-sec"><h3>Requests to send</h3><span>charged only once confirmed</span></div><div class="ux-box ls">' + q.map(function(k){ var r = st.req[k]; return '<div class="ux-li">' + thumb(k) + '<span><b>' + esc(O[k].t) + '</b><small>' + esc(r.sub) + '</small></span><span class="ux-hd">' + eur(r.amt) + '</span><button type="button" class="ux-x" data-unq="' + k + '" aria-label="Remove ' + esc(O[k].t) + '">' + ic('x') + '</button></div>'; }).join('') + '</div>'; }
  if (!any) return { body: '<div class="ux-empty"><span>' + ic('gift') + '</span><h2>Nothing added yet</h2><p>Extras you add and requests you send appear here, with their next step.</p></div>', bar: '<div class="ux-buy"><button type="button" class="ux-cta full" data-go="list">Browse extras</button></div>' };
  /* lo que se paga y lo que solo se retiene, separados: una retención nunca entra en el total */
  var pay = toPay(), hold = q.reduce(function(a, k){ return a + st.req[k].amt; }, 0), wt = keys(['waiting']).reduce(function(a, k){ return a + st.req[k].amt; }, 0), cta;
  if ((pay || hold || wt) && LV !== 'v2') h = '<div class="ux-sum"><div><small>To pay now</small><b>' + eur(pay) + '</b><span>' + st.cart.length + ' extra' + (st.cart.length === 1 ? '' : 's') + '</span></div><div class="ux-sh2"><small>' + ic('lock') + 'Held · not charged</small><b>' + eur(hold + wt) + '</b><span>charged only once confirmed</span></div></div>' + h;
  if (pay || hold) { if (LV !== 'v2') h += '<button type="button" class="ux-more" data-go="list">' + ic('plus') + 'Add more extras</button>';
    cta = '<div class="ux-buy"><button type="button" class="ux-cta full" data-act="pay">' + (pay ? 'Pay ' + eur(pay) : 'Send ' + (q.length > 1 ? 'requests' : 'request')) + (hold && pay ? ' · send ' + (q.length > 1 ? 'requests' : 'request') : '') + '</button>' + (LV === 'v2' ? '' : '<p class="ux-as">' + ic('lock') + 'Secure payment · ' + STAY.card + '</p>') + '</div>'; }
  else cta = LV === 'v2' ? '' : '<div class="ux-buy"><button type="button" class="ux-cta full ghost" data-go="list">Browse more extras</button></div>';   /* v2: sin nada que pagar, sin barra abajo */
  return { body: h, bar: cta }; }


/* ---------- FV · pedir el email si no lo tenemos (feedback de Vlad, 12-nov) ----------
   Ajuste «Guest email unknown» en Deal settings (ux-cfg._nomail). Al pulsar Request, el email se pide dentro de la misma hoja
   (móvil, mismo alto, sin scroll) o del mismo panel (escritorio); nunca un modal encima. Si no hay hoja abierta, sale como hoja propia. */
function needMail(){ if (FV !== '1' || st.mail) return false; try { return !!(JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {})._nomail; } catch (e) { return false; } }
function mailHTML(){ var t = amount(o, sel);
  if (EC) { var mpv = '1', h = eur(t);   /* página de aprobación: V1 elegida (las demás se quitaron el 12-nov) */
    var X = '<button type="button" class="ux-x ux-mpx" data-close aria-label="Close">' + ic('x') + '</button>',
      one = '<p class="ux-mu-1" hidden>To send the request, pay your cart: we hold ' + h + ' on your card while we check availability. Until you pay, it isn’t sent. Only charged if approved.</p>',
      inp = '<input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '"><p class="ux-merr" hidden>Check the email, it looks incomplete.</p>',
      mail = '<div class="ux-mp-mail"><label class="ux-mlab" for="ux-mail-in">Where should we send our answer?</label>' + inp + '</div>',
      dis = okMail(mailDraft) ? '' : ' disabled', cta = function(lbl, cls){ return '<button type="button" class="ux-cta full ux-mgo' + (cls ? ' ' + cls : '') + '" data-mailgo' + dis + '>' + lbl + '</button>'; },
      intro = '<p class="ux-mp-in">We first check availability, so we can make sure it’s ready for you.</p>';
    var steps = [['cart', 'Pay your cart to send the request.', 'We hold ' + h + ' on your card, nothing is charged yet. Until you pay, the request isn’t sent.'],
      ['clock', 'We check availability', 'and email you the answer, usually within a few hours.'],
      ['check', 'Only charged if approved.', 'If not, the hold is released.']];
    var wrap = function(inner){ return '<div class="ux-mail ux-mailp ux-mpv' + mpv + '">' + X + inner + '</div>'; };
    return wrap('<div class="ux-p4-hero"><span class="ux-p4-ring">' + ic('clock') + '</span><b class="ux-mp-t">This one needs approval</b>' + intro + '</div>'
      + '<ol class="ux-mu-st">' + steps.map(function(x, n){ return '<li><i>' + (n + 1) + '</i><em>' + ic(x[0]) + '</em><span><b>' + x[1] + '</b> ' + x[2] + '</span></li>'; }).join('') + '</ol>'
      + one + mail + '<div class="ux-mp-ft">' + cta(h + ' · Add to cart') + '</div>'); }
  return '<div class="ux-mail"><button type="button" class="ux-mback" data-mailback aria-label="Back to your options">' + ic('left') + 'Back</button>'
    + '<span class="ux-mic">' + ic('mail') + '</span><h3>Where should we send our answer?</h3>'
    + '<p>We confirm requests by email, usually within a few hours. We’ll only use it for updates on this request.</p>'
    + '<label class="ux-mlab" for="ux-mail-in">Your email</label><input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com">'
    + '<p class="ux-merr" hidden>Check the email, it looks incomplete.</p>'
    + '<button type="button" class="ux-cta full ux-mgo" data-mailgo disabled>' + eur(t) + ' · Request</button></div>'; }
function askMail(){ var box = document.querySelector('.ux-opsh');
  if (box) { var old = box.querySelector('.ux-mail'); if (old) old.remove(); box.insertAdjacentHTML('beforeend', mailHTML()); box.classList.add('ux-mailon');
    var mp = box.querySelector('.ux-mailp'); if (mp) { var over = function(){ return mp.scrollHeight > mp.clientHeight + 1; };   /* sin scroll: NUNCA se cambia ni se quita texto (Dani, 12-nov); solo se compactan espacios y tamaños por pasos */
      for (var cp = 1; cp <= 4 && over(); cp++) mp.classList.add('ux-mpc' + cp); } }
  else { openSheet('email', K); }
  setTimeout(function(){ var i = document.getElementById('ux-mail-in'); if (i) i.focus(); }, 60); }
function okMail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
document.addEventListener('input', function(e){ if (e.target && e.target.id === 'ux-mail-in') { mailDraft = e.target.value; var mf = e.target.closest('.ux-mailf'); if (mf) { var e2 = mf.querySelector('.ux-merr'), h2 = mf.querySelector('.ux-mhint'); if (e2) e2.hidden = true; if (h2) h2.hidden = false; } var b = document.querySelector('[data-mailgo]'), er = document.querySelector('.ux-merr'); if (b) b.disabled = !okMail(e.target.value.trim()); if (er) er.hidden = true; } });
document.addEventListener('keydown', function(e){ if (e.key === 'Enter' && e.target && e.target.id === 'ux-mail-in') { if (e.target.closest('.ux-maila')) { var sb = document.querySelector('[data-mailsave]'); if (sb) sb.click(); return; } if (e.target.closest('.ux-mailc')) { var gcb = document.querySelector('.ux-sbt [data-go="cart"]'); if (gcb) gcb.click(); return; } if (e.target.closest('.ux-mailf')) { var rq = document.querySelector('.ux-opsh [data-act="request"]'); if (rq) rq.click(); return; } var b = document.querySelector('[data-mailgo]'); if (b && !b.disabled) b.click(); } });
document.addEventListener('click', function(e){
  var bk = e.target.closest && e.target.closest('[data-mailback]'); if (bk) { var box = bk.closest('.ux-opsh'); if (box) { box.classList.remove('ux-mailon'); bk.closest('.ux-mail').remove(); } else close(); return; }
  var ms = e.target.closest && e.target.closest('[data-mailsave]');
  if (ms) { e.stopPropagation(); var ai = document.getElementById('ux-mail-in'), av = ai ? ai.value.trim() : '', ma = document.querySelector('.ux-maila');
    if (!okMail(av)) { var ae = ma && ma.querySelector('.ux-merr'), ah = ma && ma.querySelector('.ux-mhint'); if (ae) { ae.textContent = av ? 'Check the email, it looks incomplete.' : 'Add your email so we can send you our answer.'; ae.hidden = false; } if (ah) ah.hidden = true; if (ai) ai.focus(); return; }
    st.mail = av; save(); close(); toast('We’ll email our answer to ' + esc(av)); return; }
  var gc = e.target.closest && e.target.closest('[data-go="cart"]'), mc = document.querySelector('.ux-mailc');
  if (gc && mc) { var ci = document.getElementById('ux-mail-in'), cv = ci ? ci.value.trim() : '';
    if (!okMail(cv)) { e.stopPropagation(); e.preventDefault(); var ce = mc.querySelector('.ux-merr'), ch = mc.querySelector('.ux-mhint'); if (ce) { ce.textContent = cv ? 'Check the email, it looks incomplete.' : 'Add your email so we can send you our answer.'; ce.hidden = false; } if (ch) ch.hidden = true; if (ci) ci.focus(); return; }
    st.mail = cv; save(); return; }
  var go = e.target.closest && e.target.closest('[data-mailgo]'); if (!go || go.disabled) return;
  var inp = document.getElementById('ux-mail-in'), v = inp ? inp.value.trim() : ''; if (!okMail(v)) { var er = document.querySelector('.ux-merr'); if (er) er.hidden = false; return; }
  st.mail = v; st.req[K] = { st: 'queued', amt: amount(o, sel), sub: describe(o, sel), slot: sel.slot }; save(); recDirty = true; openSheet('added', K); }, true);

/* ---------- hojas y avisos ---------- */
var sheet = null;
/* V6 · dos extras sugeridos bajo un solo título (los que se añaden en un toque) */
function cross2(k, fixed){ var all = ORDER.concat(['luggage']).filter(function(x){ return x !== k && O[x] && !inCart(x) && !busy(x); }),
    cs = fixed || all.filter(function(x){ return quickable(O[x]); }).concat(all.filter(function(x){ return !quickable(O[x]); }));   /* primero los de un toque; detrás el resto (con «View», abren su ficha). openSheet quita los que no caben */
  if (!cs.length) return '';
  return '<div class="ux-x2"><p>Recommended for your stay</p>' + cs.map(function(c){ return '<div class="r"><img src="' + isrc(O[c].img) + '" alt=""><span><b>' + esc(O[c].t) + '</b><small>' + priceOf(c) + ' ' + unitOf(c) + '</small></span>' + (quickable(O[c]) ? recBtn(c) : '<span role="button" tabindex="0" class="ux-rb ux-rv" data-open="' + c + '" aria-label="View ' + esc(O[c].t) + '">View</span>') + '</div>'; }).join('') + '</div>'; }
/* botón de una recomendación: «Add» al carrito o «Added»; se cambia ahí mismo, sin cerrar la hoja */
function recBtn(c){ var on = !!inCart(c); return '<span role="button" tabindex="0" class="ux-rb' + (on ? ' on' : '') + '" data-rec="' + c + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove ' : 'Add ') + esc(O[c].t) + (on ? ' from cart' : ' to cart') + '">' + ic(on ? 'check' : 'cart') + (on ? 'Added' : 'Add') + '</span>'; }
/* V6.7: al cambiar una opción en «Added» se actualizan la línea del carrito, el resumen y el total, sin cerrar la hoja */
function adjPatch(){ var c = inCart(K), a = sheet.querySelector('.ux-adj'), tx = a.querySelector('.ux-times'), sx = tx ? tx.scrollLeft : 0; a.innerHTML = choice(); var nt = a.querySelector('.ux-times'); if (nt) nt.scrollLeft = sx;
  var p = sheet.querySelector('.ux-a2l + p'); if (p && c) p.innerHTML = '<b>' + esc(o.t) + '</b> · ' + esc(c.sub) + ' · ' + eur(c.amt);
  var g = sheet.querySelector('.ux-sbt [data-go="cart"]'); if (g) g.textContent = 'Go to cart · ' + eur(toPay()); }
/* V6.8: total del carrito si se añade lo que hay en la hoja */
function tot68(){ var c = inCart(K); return toPay() - (c ? c.amt : 0) + amount(o, sel); }
var rec68 = null;
function recToggle(c){ if (inCart(c)) st.cart = st.cart.filter(function(x){ return x.id !== c; }); else addLine(c, defSel(O[c])); save();
  if (!sheet) return; var b = sheet.querySelector('[data-rec="' + c + '"]'); if (b) b.outerHTML = recBtn(c);
  var n = st.cart.length, badge = sheet.querySelector('.ux-a2 .cart i'); if (badge) { badge.textContent = n; badge.style.animation = 'none'; void badge.offsetWidth; badge.style.animation = ''; }
  var go = sheet.querySelector('.ux-sbt [data-go="cart"]'); if (go) go.textContent = 'Go to cart' + (toPay() ? ' · ' + eur(toPay()) : '');
  if (sheetKind === 'opts' && v68()) reOpts();
  recDirty = true; }   /* con la hoja abierta no se repinta la página de debajo (la foto saltaba y el modal parecía cambiar de tamaño): se repinta al cerrarla */
var recDirty = false;
function cross(k){ var c = ORDER.concat(['luggage']).filter(function(x){ return x !== k && !inCart(x) && quickable(O[x]); })[0]; if (!c) return '';
  return '<div class="ux-x1"><img src="' + isrc(O[c].img) + '" alt=""><span><small>Also for your stay</small><b>' + esc(O[c].t) + '</b><small>' + priceOf(c) + ' ' + unitOf(c) + '</small></span><button type="button" class="ux-add" data-quick="' + c + '" data-keep="1" aria-label="Add ' + esc(O[c].t) + '">' + ic('plus') + '</button></div>'; }
/* ---------- V6 móvil · sin scroll: la foto cede primero (325 → 180 px) y, si aún no cabe, el contenido se compacta por pasos ---------- */
var UNDER = 32;   /* la foto sigue 32 px por debajo del panel (más que el radio de sus esquinas, 26 px): así detrás de las esquinas siempre hay foto */
var FIT = ['fit1', 'fit2', 'fit3', 'fit4', 'fit5'];   /* 5 «+X h» y su frase en una sola línea */   /* 1 descripción a 3 líneas · 2 horas más compactas · 3 título y panel más compactos · 4 descripción a 2 líneas */
/* alto que necesita la hoja de opciones con un espaciado cómodo (16 px) y sin quitar textos; si el panel no llega, la foto cede (hasta 140 px) antes de compactar más */
function optNeed(){ if (desk || SC !== 'instant' || !isV6() || !needsOpts() || busy(K) || qBar()) return 0;
  var m = document.createElement('div'); m.className = 'ux-ov'; m.setAttribute('aria-hidden', 'true'); m.style.cssText = 'visibility:hidden;pointer-events:none';
  m.innerHTML = '<div class="ux-sheet ux-opsh ux-opc1 ux-opc2 ux-opc3" style="height:auto;min-height:0;max-height:none;animation:none;--sp:16px">' + optsHTML() + '</div>';
  document.body.appendChild(m); var sh = m.firstChild, ob = sh.querySelector('.ux-ob'); if (ob) { ob.style.flex = 'none'; ob.style.overflow = 'visible'; }
  var pc = document.querySelector('#ux-fbar .ux-b64'), gap = pc ? Math.max(0, window.innerHeight - pc.getBoundingClientRect().bottom) : 0;   /* en la hoja la barra se alinea con la de la página (alignCap) */
  var h = sh.offsetHeight + gap; m.remove(); return h; }
function fit(rmOn){ rmOn = rmOn === true; if (desk || SC !== 'instant' || !isV6()) return; var de = document.documentElement, t = document.querySelector('.ux-c6t'), m6 = document.querySelector('.ux-m6'); if (!t || !m6) return;
  var MAX = 325, MIN = 180, H = window.innerHeight;
  /* «Read more» oculto mientras se mide (si no, la primera medida sale 25 px más alta); solo se enseña si el texto queda cortado, y entonces se vuelve a encajar con él */
  var rb0 = document.querySelector('.ux-rm6'); if (rb0) rb0.hidden = !rmOn;
  FIT.forEach(function(c){ de.classList.remove(c); }); m6.style.minHeight = '0px'; t.style.height = (MAX + UNDER) + 'px';
  var dk = document.getElementById('ux-fbar') || document.querySelector('[data-slot="cta-dock"]');
  function over(){ var room = H - (dk ? dk.getBoundingClientRect().height : 0); return Math.ceil(m6.getBoundingClientRect().bottom + window.scrollY - room); }   /* el panel tiene que acabar donde empieza la barra de compra */
  var step = 0, ph = MAX, ov = over();
  for (var guard = 0; ov > 0 && guard < 12; guard++) {
    if (ph > MIN) { ph = Math.max(MIN, ph - ov); t.style.height = (ph + UNDER) + 'px'; }
    else if (step < FIT.length) de.classList.add(FIT[step++]);
    else if (ph > 140) { ph = Math.max(140, ph - ov); t.style.height = (ph + UNDER) + 'px'; }   /* último recurso: la foto hasta 140 px */
    else break;
    ov = over(); }
  /* la hoja de opciones mide lo que el panel y nunca hace scroll: si ni compactada cabe, el panel crece (la foto cede, hasta 140 px) */
  var need = optNeed(), have = H - Math.max(0, m6.getBoundingClientRect().top);
  if (need > have && ph > 140) { ph = Math.max(140, ph - (need - have)); t.style.height = (ph + UNDER) + 'px'; ov = over(); }
  /* si sobra sitio, el panel blanco llega hasta la barra de compra */
  if (ov < 0) m6.style.minHeight = (m6.getBoundingClientRect().height - ov) + 'px';
  /* V6.4: la barra flota, así que el panel blanco sigue por detrás hasta el borde de abajo (sin franja gris) */
  if (dk) { var r6 = m6.getBoundingClientRect(); m6.style.minHeight = (r6.height + (H - r6.bottom)) + 'px'; }
  var tx = document.querySelector('.ux-dtx'), rb = document.querySelector('.ux-rm6'); if ((document.querySelector('.ux-m6 .ux-inl') || document.querySelector('#ux-fbar .ux-bset')) && (step > 0 || ov > 0 || ph < INLMIN)) { INL = false; render(true); return; }
  sizeBars(); if (tx && rb && !rmOn && tx.scrollHeight > tx.clientHeight + 1) fit(true); }
var fitT = 0; window.addEventListener('resize', function(){ clearTimeout(fitT); fitT = setTimeout(function(){ if (!INL && !sheet) { INL = true; render(true); } else fit(); }, 120); });
/* las fuentes y las fotos cambian las medidas al terminar de cargar: se vuelve a encajar */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fit(); }); window.addEventListener('load', function(){ fit(); setTimeout(fit, 300); }); window.__uxFit = fit;
function openDesc(){ close(); sheetKind = 'desc'; sheet = document.createElement('div'); sheet.className = 'ux-ov';
  sheet.innerHTML = '<div class="ux-dim" data-close></div><div class="ux-sheet ux-dsh" role="dialog" aria-modal="true" aria-label="About this extra"><span class="ux-grab" aria-hidden="true"></span>' + '<button type="button" class="ux-x ux-shx" data-close aria-label="Close">' + ic('x') + '</button>' + '<h3>' + esc(o.t) + '</h3><p>' + esc(o.ds) + '</p><button type="button" class="ux-cta full ghost" data-close>Close</button></div>';
  document.body.appendChild(sheet); document.documentElement.classList.add('ux-lock'); sheet.querySelector('.ux-cta').focus({ preventScroll: true }); }
function openGallery(){ var imgs = photos(K); close(); sheetKind = 'gal'; clearTimeout(carT); sheet = document.createElement('div'); sheet.className = 'ux-ov ux-galv';
  sheet.innerHTML = '<div class="ux-galh"><button type="button" class="ux-x" data-close aria-label="Close gallery">' + ic('x') + '</button><b>' + esc(o.t) + '</b><span>' + imgs.length + ' photos</span></div><div class="ux-galg" role="list">' + imgs.map(function(f, n){ return '<img role="listitem" src="' + isrc(f) + '" alt="' + esc(o.t) + ', photo ' + (n + 1) + '"' + (n % 3 === 0 ? ' class="w"' : '') + '>'; }).join('') + '</div>';
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Photos of ' + o.t);
  document.body.appendChild(sheet); document.documentElement.classList.add('ux-lock'); sheet.querySelector('.ux-x').focus({ preventScroll: true }); }
var sheetKind = null, capRect = null, popNow = false, optsTop = 0;   /* optsTop: dónde empezó la hoja de compra, para que las siguientes empiecen en el mismo sitio */
/* ---------- «Añadido al carrito»: está en el carrito y se paga allí (V6 y V6.2–V6.5) ---------- */
/* «Go to cart» (y sus variantes) lleva al carrito de la guestapp (screens/cart.*), no a «My extras» */
function addedHTML(k){ var c = inCart(k), rq = !c && st.req[k], n = st.cart.length + keys(['queued']).length, tot = eur(toPay()), what = esc(O[k].t), sub = esc(c ? c.sub : rq ? rq.sub : '') + ' · ' + eur(c ? c.amt : rq ? rq.amt : 0), many = n + ' extra' + (n === 1 ? '' : 's');
  var goLbl = function(){ var p = toPay(); return 'Go to cart' + (p ? ' · ' + eur(p) : ''); };   /* una retención no suma al total a pagar */
  var go = function(label, cls){ return '<button type="button" class="ux-cta full ' + (cls || '') + '" data-go="cart">' + label + '</button>'; }, keep = '<button type="button" class="ux-cta full ghost" data-go="list">See more offers</button>';
  var thumb = function(x){ return '<img src="' + isrc(O[x.id].img) + '" alt="">'; };
  if (D === 'old-v62') return '<div class="ux-a2"><span class="cart">' + ic('cart') + '<i>' + n + '</i></span><h3>Added to your cart</h3><p><b>' + what + '</b><br>' + sub + '</p><p class="note">Your cart is paid in one go, together with the rest of your stay.</p></div>'
    + '<div class="ux-sbt">' + go('Pay in cart · ' + tot) + keep + '</div>';
  if (D === 'old-v63') return '<div class="ux-a3"><h3>' + ic('check') + 'Added to your cart</h3><ul>' + st.cart.map(function(x){ var nw = x.id === k; return '<li class="' + (nw ? 'nw' : '') + '">' + thumb(x) + '<span><b>' + esc(x.n) + '</b><small>' + esc(x.sub) + '</small></span>' + (nw ? '<em>New</em>' : '') + '<strong>' + eur(x.amt) + '</strong></li>'; }).join('') + '</ul>'
    + '<div class="tot"><span>Cart total · ' + many + '</span><b>' + tot + '</b></div></div><div class="ux-sbt">' + go('Go to cart and pay') + keep + '</div>';
  if (D === 'old-v64') return '<div class="ux-a4"><span class="ok">' + ic('check') + '</span><p><b>' + what + '</b> is in your cart</p></div>'
    + '<button type="button" class="ux-a4c" data-go="cart"><span class="l"><small>Cart · ' + many + '</small><b>' + tot + '</b></span><span class="r">Go to cart' + ic('right') + '</span></button><button type="button" class="ux-lk mu ux-a4k" data-go="list">See more offers</button>';
  if (D === 'old-v65') return '<ol class="ux-a5"><li class="d"><i>' + ic('check') + '</i>Choose</li><li class="d"><i>' + ic('check') + '</i>Added to cart</li><li class="n"><i>3</i>Pay</li></ol><h3>One step left: pay in your cart</h3><p>' + what + ' · ' + sub + '. It’s in your cart with ' + (n > 1 ? (n - 1) + ' more extra' + (n > 2 ? 's' : '') : 'nothing else yet') + '.</p>'
    + '<div class="ux-sbt">' + go('Go to cart and pay · ' + tot) + keep + '</div>';
  /* V6 */
  return '<div class="ux-a2 ux-a2l"><span class="cart">' + ic('cart') + '<i>' + n + '</i></span><h3>Added to your cart</h3></div><p><b>' + what + '</b> · ' + sub + '</p>' + confMail(k)   /* (sin aviso de aprobación en «Added»: ya se explica en la nota «Needs approval» de la hoja de opciones) */
    + (k === K && v67() ? '<div class="ux-adj">' + choice() + '</div>' : '')
    + cross2(k)
    + '<div class="ux-sbt">' + go(goLbl()) + keep + '</div>'; }   /* el «pop» del precio solo al cambiar una opción, nunca al abrir */
/* la cápsula de la hoja va exactamente donde estaba la de la página (misma posición, ancho y alto) */
function alignCap(){ if (!sheet || !capRect || desk) return; var cap = sheet.querySelector('.ux-ofm .ux-b64'), of = sheet.querySelector('.ux-ofm'); if (!cap || !of) return; if (cap.classList.contains('ux-bset') || cap.classList.contains('ux-b64f')) return;
  cap.style.height = capRect.height + 'px'; cap.style.minHeight = capRect.height + 'px'; cap.style.boxSizing = 'border-box';
  of.style.setProperty('padding-left', capRect.left + 'px', 'important'); of.style.setProperty('padding-right', (window.innerWidth - capRect.right) + 'px', 'important');
  cap.style.setProperty('margin-bottom', Math.max(0, window.innerHeight - capRect.bottom) + 'px', 'important'); }
function openSheet(kind, k){ var h = ''; sheetKind = kind;
  if (kind === 'opts') { rec68 = v68() ? ORDER.concat(['luggage']).filter(function(x){ return x !== K && O[x] && !inCart(x) && !busy(x) && quickable(O[x]); }) : null; var pcap = document.querySelector('#ux-fbar .ux-b64'); capRect = pcap ? pcap.getBoundingClientRect() : null; swapClose(); sheetKind = 'opts'; sheet = document.createElement('div'); sheet.className = 'ux-ov';
    sheet.innerHTML = '<div class="ux-dim" data-close></div><div class="ux-sheet ux-opsh" role="dialog" aria-modal="true" aria-label="Choose your options">' + optsHTML() + '</div>';
    document.body.appendChild(sheet); document.documentElement.classList.add('ux-lock'); dragClose(sheet.querySelector('.ux-sheet')); alignCap(); setTimeout(function(){ var q = sheet && sheet.querySelector('.ux-opsh'); if (q) optsTop = q.getBoundingClientRect().top; }, 0);
    var m6 = document.querySelector('.ux-m6'); if (m6 && !desk && !(D === 'old-v65' && slotted(o))) { var top = Math.max(0, m6.getBoundingClientRect().top); lockH(sheet.querySelector('.ux-sheet'), Math.min(window.innerHeight * 0.92, window.innerHeight - top)); fitOpts(); }
    var tsel = sheet.querySelector('.ux-times [aria-checked="true"]'); if (tsel) { var tb = tsel.parentNode; tb.scrollLeft = tsel.offsetLeft - tb.clientWidth / 2 + tsel.offsetWidth / 2; } return; }
  if (kind === 'added') h = addedHTML(k);
  else if (kind === 'email') h = mailHTML();
  else if (kind === 'mailafter') { var pdn = payDone || { pd: 0, n: 1 }; h = '<span class="ux-sb ok">' + ic('check') + '</span><h3>' + (pdn.pd ? 'Paid ' + eur(pdn.pd) + ' · ' : '') + (pdn.n > 1 ? 'requests sent' : 'request sent') + '</h3><p>We’re checking ' + (pdn.n > 1 ? 'your requests' : 'it') + ' now.' + (pdn.hold ? ' The ' + eur(pdn.hold) + ' is only held on your card, not charged, until we confirm.' : '') + '</p>'
      + '<div class="ux-mailf ux-maila"><p class="ux-k"><label for="ux-mail-in">Where should we send our answer?</label></p><input id="ux-mail-in" class="ux-min" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com" value="' + esc(mailDraft) + '"><p class="ux-mhint">We don’t have your email yet. Only used for updates on ' + (pdn.n > 1 ? 'these requests' : 'this request') + '.</p><p class="ux-merr" hidden>Add your email so we can send you our answer.</p></div>'
      + '<div class="ux-sbt"><button type="button" class="ux-cta full" data-mailsave>Save email</button></div>'; }
  else if (kind === 'request') { var r = st.req[k]; h = '<span class="ux-sb rq">' + ic('clock') + '</span><h3>Send your request now?</h3><p>We hold ' + eur(r.amt) + ' on your card and we get your request straight away. You’re only charged once we confirm.</p>'
      + '<div class="ux-sbt"><button type="button" class="ux-cta full" data-send="' + k + '">Send request · ' + eur(r.amt) + '</button><button type="button" class="ux-cta full ghost" data-go="list">Send later, with my other extras</button></div>'; }
  else if (kind === 'cancel') { var rc = st.req[k]; h = '<span class="ux-sb no">' + ic('x') + '</span><h3>Cancel this request?</h3><p>' + 'We won’t process it anymore and the ' + eur(rc.amt) + ' hold is released. You can request it again before you arrive.</p>'
      + '<div class="ux-sbt"><button type="button" class="ux-cta full ghost" data-close>Keep waiting</button><button type="button" class="ux-cta full warn" data-docancel="' + k + '">Cancel request</button></div>'; }
  else if (kind === 'partner') h = '<span class="ux-sb pt">' + ic('ext') + '</span><h3>Booked with ' + k + '</h3><p>This one is offered by a Chekin partner. You book and pay on their site, with their support. It doesn’t go into your booking payment.</p>'
      + '<div class="ux-sbt"><button type="button" class="ux-cta full" data-toast="Opens ' + k + ' in a new tab">Continue to ' + k + ic('ext') + '</button><button type="button" class="ux-cta full ghost" data-close>Stay here</button></div>';
  swapClose(); sheet = document.createElement('div'); sheet.className = 'ux-ov';
  sheet.innerHTML = '<div class="ux-dim" data-close></div><div class="ux-sheet" role="dialog" aria-modal="true">' + '<button type="button" class="ux-x ux-shx" data-close aria-label="Close">' + ic('x') + '</button>' + h + '</div>';
  document.body.appendChild(sheet); document.documentElement.classList.add('ux-lock');
  if (desk && EC && kind === 'email') { apprH = sheet.querySelector('.ux-sheet').offsetHeight; }   /* f6 escritorio: la página de aprobación marca el alto (el de su contenido) */
  if (desk && EC && kind === 'added') { var shd = sheet.querySelector('.ux-sheet'), rws = [].slice.call(shd.querySelectorAll('.ux-x2 .r'));   /* … y «Added to your cart» copia ese alto y mete tantas recomendaciones como quepan */
    if (apprH) { shd.style.setProperty('height', apprH + 'px', 'important'); shd.style.setProperty('min-height', apprH + 'px', 'important'); shd.style.setProperty('max-height', apprH + 'px', 'important'); }
    for (var rx = rws.length - 1; rx >= 0 && shd.scrollHeight > shd.clientHeight + 1; rx--) rws[rx].remove(); }
  else if (desk && LV === 'v2') [].slice.call(sheet.querySelectorAll('.ux-x2 .r'), 3).forEach(function(r){ r.remove(); });   /* escritorio: como en el móvil, solo unas pocas recomendaciones */
  if (!desk && isV6() && !(optsTop > 0) && document.querySelector('.ux-m6')) optsTop = Math.max(0, document.querySelector('.ux-m6').getBoundingClientRect().top);
  if (!desk && isV6() && optsTop > 0 && kind !== 'partner') { var sh0 = sheet.querySelector('.ux-sheet'); sh0.classList.add('ux-same'); sheet.classList.add('ux-ov-same'); var room = window.innerHeight - optsTop, rows = sh0.querySelectorAll('.ux-x2 .r');
    /* tantos deals recomendados como quepan en el alto fijo: se mide la hoja a su alto natural y se quitan filas desde abajo hasta que cabe */
    var nat = function(){ sh0.style.height = 'auto'; sh0.style.minHeight = '0px'; sh0.style.maxHeight = 'none'; var hh = sh0.offsetHeight; return hh; };
    var fits = function(){ return nat() <= room + 1; }, out = [], ri;
    for (ri = rows.length - 1; ri > 0 && !fits(); ri--) { out.unshift(rows[ri]); rows[ri].remove(); }
    /* la versión compacta solo si así cabe al menos un deal más (o si ni con uno cabe) */
    if (out.length || !fits()) { var box = sh0.querySelector('.ux-x2'), add = 0; sh0.classList.add('ux-tight');
      while (out.length && fits()) { box.appendChild(out[0]); if (fits()) { out.shift(); add++; } else { out[0].remove(); break; } }
      if (!add && fits()) { sh0.classList.remove('ux-tight'); if (!fits()) sh0.classList.add('ux-tight'); } }
    if (!fits() && sh0.querySelector('.ux-mailc')) { var bx2 = sh0.querySelector('.ux-x2'); if (bx2) bx2.remove(); if (!fits()) { var mh = sh0.querySelector('.ux-mhint'); if (mh) mh.remove(); } if (!fits()) { var stp = sh0.querySelector('.ux-mu-st'), one = sh0.querySelector('.ux-mu-1'); if (stp && one) { stp.remove(); one.hidden = false; } } ['.ux-mu-l', '.ux-mu-h small', '.ux-sbt [data-go="list"]'].forEach(function(q){ if (!fits()) { var e = sh0.querySelector(q); if (e) e.remove(); } }); }   /* sin sitio: los 3 pasos pasan a una frase */   /* f2: el email manda; si no cabe, fuera los recomendados (y la ayuda) */
    lockH(sh0, room);   /* el segundo deal solo si cabe sin crecer */ }   /* misma altura que la hoja de compra */
  var f = sheet.querySelector('.ux-cta'); if (f) f.focus({ preventScroll: true }); }
/* al pasar de una hoja a otra no se repinta la página de debajo; eso queda para cuando se cierra del todo */
function swapClose(){ var rd = recDirty; recDirty = false; close(); recDirty = rd; }
function close(){ var wasGal = sheetKind === 'gal'; sheetKind = null; if (wasGal) setTimeout(setupCar, 0); if (sheet) { sheet.remove(); sheet = null; } document.documentElement.classList.remove('ux-lock'); if (recDirty) { recDirty = false; render(true); } }
var tt = 0, tEl = null;
function toast(t, undo){ if (tEl) tEl.remove(); tEl = document.createElement('div'); tEl.className = 'ux-toast'; tEl.setAttribute('role', 'status'); tEl.innerHTML = '<span>' + t + '</span>' + (undo ? '<button type="button" data-undo="' + undo + '">Undo</button>' : '');
  document.body.appendChild(tEl); clearTimeout(tt); tt = setTimeout(function(){ if (tEl) { tEl.remove(); tEl = null; } }, 3200); }

/* ---------- Vela (escritorio) ---------- */
function velaTxt(){
  if (SC === 'list') return ['Every extra here is ours. Instant ones are confirmed on the spot; requests wait for our confirmation, and you’re only charged once we confirm.', [['How do I pay for extras?', 'Together with your booking payment, in one go. Nothing is charged when you add them.'], ['What does “We confirm” mean?', 'We check we can do it. We hold the amount, and charge it only once we confirm.'], ['Can I remove something?', 'Yes, any time before you pay, for free.']]];
  if (SC === 'mine') return ['Here’s everything you added or requested. Requests are held on your card and charged only once confirmed.', [['What does “held” mean?', 'The amount is reserved on your card but not charged. If the request isn’t confirmed, it’s released.'], ['When will you answer?', 'Usually within a few hours. We email you as soon as we do.'], ['Can I cancel a request?', 'Yes, until we answer. The hold is released at once.']]];
  if (SC === 'empty') return ['There are no extras for your dates yet. Ask us directly if you need something.', [['What can I ask for?', 'Early arrival, a late check-out, a cot, a ride from the airport… hosts often say yes.']]];
  var f = [];
  if (slotted(o)) f.push(['Why does the price change?', 'Each time has its own price: the earlier you get in (or the later you leave), the more hours you gain.']);
  if (o.dd) f.push(['Can I change the day or time?', 'Yes, until you pay. After that, message us.']);
  if (manual(o)) f.push(['What if you can’t confirm it?', 'The hold is released straight away and you’re not charged.']); else f.push(['Can I remove it?', 'Yes, any time before you pay, for free.']);
  return [o.hl + '. ' + (manual(o) ? 'We confirm this one personally.' : 'It’s confirmed instantly and paid with your booking.'), f]; }
function vela(){ var a = document.querySelector('aside[data-slot="assistant-panel"]'); if (!a || !a.firstElementChild) return; var v = velaTxt();
  [].slice.call(a.children, 1).forEach(function(n){ if (!n.classList.contains('ux-vela')) n.style.display = 'none'; });
  var box = a.querySelector('.ux-vela') || document.createElement('div'); box.className = 'ux-vela';
  box.innerHTML = '<p class="ux-vl">' + esc(v[0]) + '</p><p class="ux-vk">Ask Vela</p>' + v[1].map(function(f){ return '<details class="ux-vq"><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('');
  if (!box.parentNode) a.appendChild(box); }

/* ---------- montaje ---------- */
var mount = null, dockEl = null;
function title(){ return ({ list: 'Extras', empty: 'Extras', mine: 'My extras' })[SC] || o.t; }
function setTitle(s){ [].forEach.call(document.querySelectorAll('header span, header h1, header p, header b'), function(e){ if (e.children.length === 0 && (e.getAttribute('data-ux-t') || /^(Extras|Your Payments)$/.test(e.textContent.trim()))) { e.setAttribute('data-ux-t', '1'); e.textContent = s; } }); }
var carT = 0;
function setupCar(){ clearTimeout(carT); var t = document.querySelector('.ux-c6t'); if (!t) return; var n = t.querySelectorAll('img').length; if (n < 2) return;
  function paint(i){ [].forEach.call(t.parentNode.querySelectorAll('.ux-c6b i'), function(b){ b.className = ''; }); void t.offsetWidth; [].forEach.call(t.parentNode.querySelectorAll('.ux-c6b i'), function(b, j){ b.className = j < i ? 'done' : j === i ? 'run' : ''; }); }
  var SEC = 4000;
  /* cada foto dura 4 s contados desde que empieza a entrar; la barra se llena a la vez */
  /* el destino es el borde exacto de la foto (no ancho × índice, que con anchos fraccionarios dejaba asomar la foto de al lado) y al acabar se ajusta al píxel */
  function advance(){ var i = (t.__uxIdx + 1) % n, im = t.querySelectorAll('img')[i], to = im ? im.offsetLeft : i * t.clientWidth; t.__auto = true; t.__uxIdx = i; paint(i); t.scrollTo({ left: to, behavior: 'smooth' }); setTimeout(function(){ if (Math.abs(t.scrollLeft - to) > 0.5) t.scrollLeft = to; t.__auto = false; }, 900); carT = setTimeout(advance, SEC); }
  t.__uxIdx = Math.round(t.scrollLeft / (t.clientWidth || 1)); paint(t.__uxIdx);
  if (!desk && !RM) carT = setTimeout(advance, SEC);
  /* si se desliza a mano, la cuenta empieza otra vez desde esa foto */
  t.addEventListener('scroll', function(){ if (t.__auto) return; var i = Math.round(t.scrollLeft / t.clientWidth); if (i === t.__uxIdx) return; t.__uxIdx = i; paint(i); clearTimeout(carT); if (!desk && !RM) carT = setTimeout(advance, SEC); }, { passive: true }); }
var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function dragClose(el){ if (!el || desk) return; var y0 = null, dy = 0;
  el.addEventListener('pointerdown', function(e){ if (!e.target.closest('[data-drag],.ux-h6')) return; y0 = e.clientY; dy = 0; el.style.transition = 'none'; el.setPointerCapture && el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', function(e){ if (y0 === null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; });
  function end(){ if (y0 === null) return; y0 = null; el.style.transition = 'transform .2s ease'; if (dy > 90) { el.style.transform = 'translateY(100%)'; setTimeout(close, 180); } else el.style.transform = ''; }
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); }
/* todas las hojas del flujo de un deal miden exactamente lo que el panel del inicio: alto fijo, nunca crecen */
function lockH(el, h){ if (!el) return; h = Math.round(h) + 'px'; el.style.height = h; el.style.minHeight = h; el.style.maxHeight = h; el.style.overflow = 'hidden'; }
/* si las franjas no caben en ese alto, se compactan por pasos; como último recurso la lista hace scroll por dentro */
function fitOpts(){ var q = sheet && sheet.querySelector('.ux-opsh'); if (!q || desk) return; var b = q.querySelector('.ux-ob'); if (!b) return;
  if (!OPTFB && q.querySelector('.ux-bset') && q.scrollHeight > q.clientHeight + 1) { OPTFB = true; reOpts(); return; }
  /* V6.8: tantos recomendados como quepan sin scroll; la lista recortada se mantiene al repintar */
  if (v68() && rec68) { var rr = b.querySelectorAll('.ux-x2 .r'); for (var ix = rr.length - 1; ix >= 0 && b.scrollHeight > b.clientHeight + 1; ix--) { rr[ix].remove(); rec68.pop(); } if (!rec68.length) { var bx = b.querySelector('.ux-x2'); if (bx) bx.remove(); } }
  /* nunca scroll: primero se estrecha el espaciado (--sp, de 22 a 12 px), luego se compacta por pasos; al final el espacio que sobre se devuelve al espaciado, repartido por igual */
  var fits = function(){ return b.scrollHeight <= b.clientHeight + 1; }, sp = 22, setSp = function(v){ q.style.setProperty('--sp', v + 'px'); };
  q.classList.remove('ux-opc1', 'ux-opc2', 'ux-opc3', 'ux-opc4', 'ux-opc5', 'ux-opc6'); setSp(sp);
  while (!fits() && sp > 12) setSp(sp -= 2);
  ['ux-opc1', 'ux-opc2', 'ux-opc3', 'ux-opc4', 'ux-opc5', 'ux-opc6'].some(function(c){ if (fits()) return true; q.classList.add(c); return false; });
  while (sp < 26) { setSp(sp + 2); if (!fits()) { setSp(sp); break; } sp += 2; } }
/* barras de horas proporcionales: el mínimo es el ancho de la etiqueta más larga (con su margen) y a partir de ahí cada barra crece según sus horas; así 0 h nunca queda más larga que 1 h */
function sizeBars(){ [].forEach.call(document.querySelectorAll('.ux-v3l'), function(ul){ var is = ul.querySelectorAll('.bar i[data-r]'); if (!is.length) return;
  var full = is[0].parentNode.clientWidth, base = 0; [].forEach.call(is, function(i){ i.style.width = 'max-content'; base = Math.max(base, i.offsetWidth); });
  base = Math.min(base, full); [].forEach.call(is, function(i){ i.style.width = Math.round(base + (full - base) * (+i.getAttribute('data-r') || 0)) + 'px'; }); }); }
window.addEventListener('resize', function(){ sizeBars(); });
function reOpts(){ if (sheetKind !== 'opts' || !sheet) return; var b = sheet.querySelector('.ux-ob'), y = b ? b.scrollTop : 0, tx = sheet.querySelector('.ux-times'), sx = tx ? tx.scrollLeft : 0;
  /* la barra del resumen se desliza desde donde estaba */
  var Q6 = ['.ux-s6s .bar i', '.ux-s6s .bar em.you', '.ux-s6s .axis span.you'], prev = Q6.map(function(q){ var e = sheet.querySelector(q); return e ? [e.style.left, e.style.width] : null; });
  popNow = true; sheet.querySelector('.ux-sheet').innerHTML = optsHTML(); popNow = false; alignCap(); fitOpts(); var nb = sheet.querySelector('.ux-ob'); if (nb) nb.scrollTop = y; var nt = sheet.querySelector('.ux-times'); if (nt) nt.scrollLeft = sx;
  if (!RM) { var nows = Q6.map(function(q){ var e = sheet.querySelector(q); return e ? [e.style.left, e.style.width] : null; });
    Q6.forEach(function(q, k){ var e = sheet.querySelector(q); if (!e || !prev[k]) return; e.style.transition = 'none'; e.style.left = prev[k][0]; if (prev[k][1]) e.style.width = prev[k][1]; });
    void sheet.offsetWidth;
    Q6.forEach(function(q, k){ var e = sheet.querySelector(q); if (!e || !nows[k]) return; e.style.transition = ''; e.style.left = nows[k][0]; if (nows[k][1]) e.style.width = nows[k][1]; }); } }
/* escritorio B: la columna de Vela pasa a ser la compra del deal (la misma hoja de opciones del móvil, fija) */
/* lista en escritorio: qué va en la columna de Vela */
function paintSide(){ if (!(desk && XV && LV === 'v2' && RV && SC === 'list')) return; var as = [].filter.call(document.querySelectorAll('aside'), function(a){ return a.querySelector('.ux-side') || /Vela/.test(a.textContent); })[0]; if (!as) return;
  var pw = as.closest('.page-wrapper');
  if (RV === '1') { as.parentNode.style.display = 'none'; if (pw) { var g = getComputedStyle(pw).gridTemplateColumns.split(' '); pw.style.setProperty('transition', 'none', 'important'); pw.style.setProperty('grid-template-columns', g[0] + ' minmax(0,1fr)', 'important'); } document.documentElement.classList.add('ux-rv1'); return; }
  as.classList.add('ux-xva'); document.documentElement.classList.add('ux-xv', 'ux-rv' + RV);
  var d = as.querySelector(':scope > .ux-side'); if (!d) { d = document.createElement('div'); d.className = 'ux-dbuy ux-side'; as.appendChild(d); }
  var h = '';
  if (RV === '2') { var pdL = paidList(), wq = keys(['waiting']), tot = toPay();
    h = '<h3 class="ux-sdh">Your extras</h3>';
    if (!st.cart.length && !pdL.length && !wq.length && !keys(['queued']).length) h += '<div class="ux-sde"><span>' + ic('bag') + '</span><b>Nothing added yet</b><p>Add extras and pay them together with your booking. You can remove them any time before you pay.</p></div>';
    else { if (st.cart.length || keys(['queued']).length) h += '<p class="ux-sdk">In your cart</p>' + st.cart.map(function(x){ return '<div class="ux-sdr">' + thumb(x.id) + '<span><b>' + esc(x.n) + '</b><small>' + esc(x.sub) + '</small></span><strong>' + eur(x.amt) + '</strong></div>'; }).join('') + keys(['queued']).map(function(k){ return '<div class="ux-sdr">' + thumb(k) + '<span><b>' + esc(O[k].t) + '</b><small>' + esc(st.req[k].sub) + '</small></span><strong class="h">' + eur(st.req[k].amt) + ' hold</strong></div>'; }).join('');
      if (wq.length) h += '<p class="ux-sdk">Waiting for approval</p>' + wq.map(function(k){ return '<div class="ux-sdr">' + thumb(k) + '<span><b>' + esc(O[k].t) + '</b><small>' + esc(st.req[k].sub) + '</small></span><strong class="h">' + eur(st.req[k].amt) + ' held</strong></div>'; }).join('');
      if (pdL.length) h += '<p class="ux-sdk">Purchased</p>' + pdL.map(function(x){ return '<div class="ux-sdr">' + thumb(x.id) + '<span><b>' + esc(x.n) + '</b><small>' + esc(x.sub) + '</small></span><strong class="ok">' + ic('check') + eur(x.amt) + '</strong></div>'; }).join('');
      if (st.cart.length || keys(['queued']).length) h += '<div class="ux-sdt"><span>To pay now</span><b>' + eur(tot) + '</b></div><button type="button" class="ux-cta ux-sdb" data-go="mine">Go to cart' + ic('right') + '</button>'; } }
  else { var lm = document.querySelector('.ux-s-list .ux-mine2'); var lms = lm && lm.querySelector('small'), mx = (lm ? '<div class="ux-sdm"><p class="ux-sdl">My extras</p><div class="ux-sdx"><p>' + esc(lms ? lms.textContent : '') + '. Review them and pay together with your booking.</p><button type="button" class="ux-cta" data-go="mine">View my extras</button></div></div>' : ''); h = '<h3 class="ux-sdh">How extras work</h3><ol class="ux-sdo"><li><i>1</i><span><b>Pick what you need</b><small>Early check-in, groceries, parking… for your dates.</small></span></li><li><i>2</i><span><b>It goes to your cart</b><small>Nothing is charged when you add it. Remove it any time before you pay.</small></span></li><li><i>3</i><span><b>Pay with your booking</b><small>One payment, one receipt by email.</small></span></li></ol>'
    + '<div class="ux-sdn">' + ic('lock') + '<b>Some extras need our confirmation</b><small>We only hold the amount on your card and charge it once we confirm. If we can’t, it’s released straight away.</small></div>' + mx; }   /* «My extras» debajo de «How extras work» */
  d.innerHTML = h;
  /* el título de la columna centrado con la fila «Back / Extras» */
  var bk = document.querySelector('.dbk-row'), hd = d.querySelector('.ux-sdh'); if (bk && hd && hd.classList.contains('ux-sdl')) { d.style.setProperty('padding-top', '0px', 'important'); var o2 = bk.getBoundingClientRect().top - hd.getBoundingClientRect().top; d.style.setProperty('padding-top', Math.max(0, Math.round(o2)) + 'px', 'important'); } else if (bk && hd) { d.style.setProperty('padding-top', '0px', 'important'); var off = (bk.getBoundingClientRect().top + bk.offsetHeight / 2) - (hd.getBoundingClientRect().top + hd.offsetHeight / 2); d.style.setProperty('padding-top', Math.max(0, Math.round(off)) + 'px', 'important'); } }
function dbuyOn(){ return desk && XV && LV === 'v2' && SC === 'instant'; }
/* escritorio: la foto del deal como galería en mosaico (las fotos que sube el anfitrión) */
function galDesk(){ var all = photos(K), n = all.length;
  /* según cuántas fotos haya: 1 entera · 2 mitades · 3 grande + 2 · 4 grande + 1 + 2 · 5 o más grande + 2×2 (el resto en la galería) */
  var L = GV === '3' ? all.slice(0, 5) : (function(){ var need = GV === '1' ? 4 : 3, r = []; for (var q = 0; q < need; q++) r.push(all[q % n]); return r; })();
  var cls = GV === '3' ? 'ux-gd3 ux-gn' + Math.min(L.length, 5) : 'ux-gd' + GV;
  var im = function(f, q){ return '<img src="' + isrc(f) + '" alt="' + esc(o.t) + ', photo ' + (q + 1) + ' of ' + n + '">'; };
  var label = n > 5 ? 'Gallery · ' + n + ' photos' : GV === '2' ? 'See all ' + n + ' photos' : 'Gallery';
  var btn = n > 1 || GV !== '3' ? '<button type="button" class="ux-gbtn" data-gal><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>' + label + '</button>' : '';
  return '<div class="ux-gd ' + cls + '">' + L.map(function(f, q){ return '<button type="button" class="ux-gc" data-gal aria-label="Open photos">' + im(f, q) + '</button>'; }).join('') + btn + '</div>'; }
function paintDBuy(){ if (!dbuyOn()) return; document.documentElement.classList.add('ux-xv', 'ux-xv' + XV);
  var d = document.querySelector('.ux-dxr .ux-dbuy');
  if (!d) { var as = [].filter.call(document.querySelectorAll('aside'), function(a){ return a.querySelector('.ux-dbuy') || /Vela/.test(a.textContent); })[0]; if (!as) return;
    as.classList.add('ux-xva'); var pw = as.closest('.page-wrapper'); if (pw) { var gc = getComputedStyle(pw).gridTemplateColumns.split(' '); if (gc.length === 3) { pw.style.setProperty('transition', 'none', 'important'); pw.style.setProperty('grid-template-columns', gc[0] + ' minmax(0,1fr) clamp(400px,22vw,480px)', 'important'); }   /* el mismo ancho que la columna de Vela en el resto de pantallas */ }
    d = as.querySelector(':scope > .ux-dbuy'); if (!d) { d = document.createElement('div'); d.className = 'ux-dbuy'; as.appendChild(d); } }
  else { [].forEach.call(document.querySelectorAll('aside'), function(a){ if (/Vela/.test(a.textContent)) { var pw2 = a.closest('.page-wrapper'); a.parentNode.style.display = 'none'; if (pw2) { var g2 = getComputedStyle(pw2).gridTemplateColumns.split(' '); pw2.style.setProperty('transition', 'none', 'important'); pw2.style.setProperty('grid-template-columns', g2[0] + ' minmax(0,1fr)', 'important'); } } }); }
  var t = amount(o, sel), head = '', sum = '';
  /* 2 y 4: cabecera del panel con el deal y el precio; 5: pasos + resumen de lo elegido */
  if (XV === '2' || XV === '4') head = '<div class="ux-dph"><img src="' + isrc(o.img) + '" alt=""><span><b>' + esc(o.t) + '</b><small>' + priceOf(K) + ' ' + unitOf(K) + '</small></span></div>';
  if (XV === '5') { head = '<div class="ux-dst"><span class="on"><i>1</i>Choose</span><em></em><span><i>2</i>Cart</span><em></em><span><i>3</i>Pay</span></div>'; sum = '<div class="ux-dsum"><p>Your selection</p><div><b>' + esc(o.t) + '</b><small>' + esc(describe(o, sel)) + '</small></div><strong>' + eur(t) + '</strong></div>'; }
  var html = opts6HTML(); if (sum) html = html.replace('<div class="ux-ofm', sum + '<div class="ux-ofm');
  /* 2 y 4: la cabecera con foto lleva el título y subtítulo de la hoja («Pick days and time» / «Welcome groceries · 18€ per day»); la hoja ya no los repite */
  if (head && (XV === '2' || XV === '4')) { var tmp = document.createElement('div'); tmp.innerHTML = html; var h6 = tmp.querySelector('.ux-h6'); if (h6) { var tt = h6.querySelector('h2,h3,b'), sb = h6.querySelector('p,small'); head = '<div class="ux-dph"><img src="' + isrc(o.img) + '" alt=""><span><b>' + (tt ? tt.innerHTML : esc(o.t)) + '</b><small>' + (sb ? sb.innerHTML : '') + '</small></span></div>'; h6.remove(); html = tmp.innerHTML; } }
  /* el panel empieza a la altura de la foto */
  if (!d.closest('.ux-dxr')) { var car = document.querySelector('.ux-gd, .ux-car6'), dt = d.getBoundingClientRect().top; if (car) d.style.setProperty('padding-top', Math.max(16, Math.round(car.getBoundingClientRect().top - dt + window.scrollY * 0)) + 'px', 'important'); }
  var r0 = st.req[K], stt = inCart(K) ? 'cart' : r0 && r0.st === 'queued' ? 'queued' : r0 && r0.st === 'waiting' ? 'sent' : '';
  if (stt) { var lab = stt === 'sent' ? 'Request sent' : 'In your cart', go = stt === 'sent' ? 'View request' : 'Go to cart', sub = esc(stt === 'cart' ? inCart(K).sub : r0.sub) + ' · ' + eur(stt === 'cart' ? inCart(K).amt : r0.amt);
    /* ya en el carrito / pedido: la cápsula pasa a un estado claro con su siguiente paso */
    var tmp2 = document.createElement('div'); tmp2.innerHTML = html; var cap = tmp2.querySelector('.ux-ofm .ux-b64');
    /* con la selección + cápsula (SV ≥ 4) el panel no cambia de forma: misma caja «Your selection», misma cápsula oscura de 64 px con un botón del mismo ancho, y la nota debajo; solo cambia el texto */
    if (cap && +SV >= 4) { cap.outerHTML = '<div class="ux-sc4 ux-sc4c' + SV + ' ux-sc4st"><div class="sel"><span><small>Your selection</small><b>' + esc(o.t) + '</b><em>' + esc(stt === 'cart' ? inCart(K).sub : r0.sub || describe(o, sel)) + '</em></span><strong>' + eur(stt === 'cart' ? inCart(K).amt : r0.amt) + '</strong></div><div class="ux-b64 ux-b67 ux-dsbar ux-ds-' + stt + '"><span class="tt"><b>' + lab + '</b><small>' + esc((stt === 'cart' ? inCart(K).sub : r0.sub || '').replace(/^Check (in|out) at /, '')) + '</small></span><button type="button" class="ux-cta" data-go="mine">' + go + ic('right') + '</button></div></div>';
      var of2 = tmp2.querySelector('.ux-ofm'), nt2 = of2 && of2.querySelector('.ux-as'); if (nt2) { of2.appendChild(nt2); nt2.classList.add('ux-as-below'); } cap = null; }
    if (cap) cap.outerHTML = '<div class="ux-dstate ux-ds-' + stt + '"><span class="ic">' + ic(stt === 'sent' ? 'clock' : 'cart') + '</span><span class="ux-dstx"><b>' + lab + '</b><small>' + sub + '</small></span><button type="button" class="ux-cta" data-go="mine">' + go + ic('right') + '</button></div>'; html = tmp2.innerHTML; }
  if (SV && !stt) { var tmp3 = document.createElement('div'); tmp3.innerHTML = html; var cap3 = tmp3.querySelector('.ux-ofm .ux-b64'), b3 = cap3 && cap3.querySelector('.ux-cta');
    if (cap3 && b3) { var verb3 = manual(o) ? 'Request' : 'Add to my stay', dis = b3.disabled ? ' disabled' : '', act = b3.getAttribute('data-act'), what = esc(describe(o, sel));
      var btn3 = function(lbl, cls){ return '<button type="button" class="ux-cta ' + (cls || '') + '" data-act="' + act + '"' + dis + '>' + lbl + '</button>'; };
      if (SV === '1') cap3.outerHTML = '<div class="ux-sc1"><div class="top"><span><small>Your selection</small><b>' + esc(o.t) + '</b><em>' + what + '</em></span><strong>' + eur(t) + '</strong></div>' + btn3(verb3 + ' · ' + eur(t)) + '</div>';
      else if (SV === '2') cap3.outerHTML = '<div class="ux-sc2"><small>Your selection</small><b>' + esc(o.t) + '</b><em>' + what + '</em><div class="tot"><span>Total</span><strong>' + eur(t) + '</strong></div>' + btn3(verb3) + '</div>';
      else if (+SV >= 4) cap3.outerHTML = '<div class="ux-sc4 ux-sc4c' + SV + (!o.dd && !slotted(o) && o.u !== 'day' ? ' ux-sc4q' : '') + '"><div class="sel"><span><small>Your selection</small><b>' + esc(o.t) + '</b><em>' + what + '</em></span><strong>' + eur(t) + '</strong></div>' + cap3.outerHTML + '</div>';   /* la selección (gris, base recta) pegada encima de la cápsula oscura de siempre */
      else cap3.outerHTML = '<div class="ux-sc3"><div class="row"><span><b>' + what + '</b><small>' + esc(o.t) + '</small></span><strong>' + eur(t) + '</strong></div>' + btn3(verb3 + ' · ' + eur(t)) + '</div>';
      if (+SV >= 4) { var of4 = tmp3.querySelector('.ux-ofm'), nt4 = of4 && of4.querySelector('.ux-as'); if (nt4) { of4.appendChild(nt4); nt4.classList.add('ux-as-below'); } }   /* la nota va debajo del botón */
      html = tmp3.innerHTML; } }
  d.innerHTML = head + '<div class="ux-ov ux-ovp"><div class="ux-sheet ux-opsh ux-dbs">' + html + '</div></div>'; }
function syncPet(){ var q = sel && sel.q; [].forEach.call(document.querySelectorAll('.ux-pt2 [data-qv]'), function(b){ b.setAttribute('aria-checked', String(+b.getAttribute('data-qv') === q)); }); }
/* escritorio: la barra «X€ · Go to cart» siempre fija abajo, alineada con la columna de contenido (nunca se despega al llegar al final) */
function pinBar(){ if (!desk || LV !== 'v2') return; var bar = document.querySelector('.ux-bar'), dk = bar && bar.closest('.ux-dk'), col = document.querySelector('.ux-s-list, .ux-s-mine'); if (!dk || !col) return;
  var r = col.getBoundingClientRect(); dk.style.setProperty('position', 'fixed', 'important'); dk.style.setProperty('bottom', '20px', 'important'); dk.style.setProperty('top', 'auto', 'important'); dk.style.setProperty('left', Math.round(r.left) + 'px', 'important'); dk.style.setProperty('width', Math.round(r.width) + 'px', 'important'); dk.style.setProperty('z-index', '30', 'important'); dk.style.setProperty('margin', '0', 'important'); col.classList.add('ux-pinned'); }
window.addEventListener('resize', pinBar);
function render(keep){ setTimeout(syncPet, 0); setTimeout(pinBar, 0); setTimeout(pinBar, 300); setTimeout(paintDBuy, 0); setTimeout(paintSide, 0);
  if (keep && !sheetKind && (inlOn() || barStep() || setOn() || qBar()) && inlPatch()) return;
  if (keep && sheetKind === 'added' && v67() && sheet && sheet.querySelector('.ux-adj')) { if (o.u === 'day' && !sel.days.length && inCart(K)) sel = JSON.parse(JSON.stringify(inCart(K).sel));   /* siempre queda al menos un día */
    addLine(K, JSON.parse(JSON.stringify(sel))); adjPatch(); recDirty = true; return; }   /* con las opciones en el panel solo se repintan ellas y la barra (sin reiniciar la foto) */
  if (keep && sheetKind === 'opts') return;   /* con la hoja de opciones abierta solo se repinta la hoja (reOpts) */
  var y = window.scrollY, v = SC === 'list' ? vList() : SC === 'empty' ? vEmpty() : SC === 'mine' ? vMine() : vDetail();
  setTitle(title());
  var sx = [].map.call(document.querySelectorAll('.ux-car,.ux-times'), function(e){ return e.scrollLeft; });
  mount.innerHTML = '<div class="ux ux-s-' + SC + ' ux-d-' + D + '' + '">' + v.body + (desk && v.bar ? '<div class="ux-dk">' + v.bar + '</div>' : '') + '</div>';
  [].forEach.call(document.querySelectorAll('.ux-car,.ux-times'), function(e, i){ if (sx[i] != null) e.scrollLeft = sx[i]; });
  var own = !desk && isV6() && SC === 'instant', fb = document.getElementById('ux-fbar');
  if (own) { if (!fb) { fb = document.createElement('div'); fb.id = 'ux-fbar'; document.body.appendChild(fb); } fb.className = 'ux-fbar ux-fb-v64'; if (!fb.__ro && window.ResizeObserver) { fb.__ro = new ResizeObserver(function(){ clearTimeout(fitT); fitT = setTimeout(fit, 40); }); fb.__ro.observe(fb); }   /* si la barra cambia de alto (la réplica le ajusta el margen inferior), se vuelve a encajar */ fb.innerHTML = '<div class="ux-dock">' + v.bar + '</div>'; if (dockEl) dockEl.style.display = 'none'; v = { body: v.body, bar: '' }; }
  else if (fb) fb.remove();
  if (dockEl && !own) { var w = dockEl.querySelector('.contents') || dockEl; if (desk || !v.bar) dockEl.style.display = 'none'; else { dockEl.style.display = ''; w.innerHTML = '<div class="ux-dock">' + v.bar + '</div>'; } }
  if (keep) window.scrollTo(0, y);
  if (desk) vela();
  sizeBars(); if (isV6()) { setupCar(); fit(); } }
function addLine(k, s){ st.cart = st.cart.filter(function(x){ return x.id !== k; }); st.cart.push(line(k, s)); save(); }
/* sincronía móvil ⇄ escritorio en la vista dividida: cada gesto se manda por sus atributos data-* (el texto y el marcado cambian entre móvil y escritorio) y el otro marco pulsa el elemento equivalente */
var UXSEL = '[data-tipc],[data-tip],[data-rec],[data-qv],[data-tstep],[data-sstep],[data-desc],[data-gal],[data-pack],[data-go],[data-open],[data-quick],[data-rm],[data-unq],[data-st],[data-slot],[data-dayx],[data-dd],[data-time],[data-act],[data-send],[data-cancel],[data-docancel],[data-dismiss],[data-again],[data-partner],[data-toast],[data-close],[data-undo]'; window.__uxSync = UXSEL;
function uxSig(el){ var d = {}; [].forEach.call(el.attributes, function(x){ if (x.name.indexOf('data-') === 0) d[x.name] = x.value; }); return d; }
function uxSend(el){ if (window.parent === window) return; var key = UXSEL.split(',').map(function(x){ return x.slice(1, -1); }).filter(function(n){ return el.hasAttribute(n); })[0]; try { window.parent.postMessage({ rep: 'ux-act', key: key, sig: uxSig(el) }, '*'); } catch (x) {} }
function uxVis(el){ var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); }
window.addEventListener('message', function(ev){
  var m = ev.data; if (!m || m.rep !== 'ux-act' || !m.key) return;
  var all = [].filter.call(document.querySelectorAll('[' + m.key + ']'), uxVis);
  var full = all.filter(function(el){ var d = uxSig(el); return Object.keys(m.sig).every(function(k){ return d[k] === m.sig[k]; }); });
  var same = all.filter(function(el){ return el.getAttribute(m.key) === m.sig[m.key]; });
  var el = full[0] || same[0]; if (el) el.click();
});
document.addEventListener('click', function(e){
  if (!e.target.closest('.ux-tip,.ux-tipb')) [].forEach.call(document.querySelectorAll('.ux-tip[aria-expanded="true"]'), function(b){ b.setAttribute('aria-expanded', 'false'); var x = b.parentNode.querySelector('.ux-tipb'); if (x) x.hidden = true; });   /* tocar fuera cierra el cuadro */
  var el = e.target.closest('[data-tipc],[data-tip],[data-rec],[data-qv],[data-tstep],[data-sstep],[data-desc],[data-gal],[data-pack],[data-go],[data-open],[data-quick],[data-rm],[data-unq],[data-st],[data-slot],[data-dayx],[data-dd],[data-time],[data-act],[data-send],[data-cancel],[data-docancel],[data-dismiss],[data-again],[data-partner],[data-toast],[data-close],[data-undo]'); if (!el || el.tagName === 'SUMMARY') return;
  e.preventDefault(); e.stopPropagation();
  if (e.isTrusted) uxSend(el);   /* vista dividida: el otro marco repite el mismo gesto */
  var a = function(n){ return el.getAttribute(n); };
  if (el.hasAttribute('data-rec')) { recToggle(a('data-rec')); return; }
  if (el.hasAttribute('data-sstep')) { var ss = sortedSlots(o), ci = ss.map(function(x){ return x[0]; }).indexOf(sel.slot), ni = ci + +a('data-sstep'); if (ss[ni]) { sel.slot = ss[ni][0]; reOpts(); } return; }
  if (el.hasAttribute('data-desc')) { openDesc(); return; }
  if (el.hasAttribute('data-gal')) { openGallery(); return; }
  if (el.hasAttribute('data-go')) { go(a('data-go')); return; }
  if (el.hasAttribute('data-pack')) { var pk = packOn(), pn = a('data-pack'); pk[pn] = pk[pn] === 0 ? 1 : 0; try { sessionStorage.setItem('ux-pack', JSON.stringify(pk)); } catch (e2) {} render(true); return; }
  if (el.hasAttribute('data-open')) { go('instant', 'o=' + a('data-open')); return; }
  if (el.hasAttribute('data-quick')) { var kq = a('data-quick'); addLine(kq, defSel(O[kq])); if (el.hasAttribute('data-keep')) { openSheet('added', kq); return; } render(true); close(); toast(esc(O[kq].t) + ' added · ' + eur(inCart(kq).amt), kq); return; }
  if (el.hasAttribute('data-rm')) { var kr = a('data-rm'); st.cart = st.cart.filter(function(x){ return x.id !== kr; }); save(); render(true); toast(esc(O[kr].t) + ' removed'); return; }
  if (el.hasAttribute('data-undo')) { var ku = a('data-undo'); st.cart = st.cart.filter(function(x){ return x.id !== ku; }); save(); render(true); if (tEl) { tEl.remove(); tEl = null; } return; }
  if (el.hasAttribute('data-unq')) { delete st.req[a('data-unq')]; save(); render(true); toast('Request removed · nothing was held'); return; }
  if (el.hasAttribute('data-tstep')) { var ti = Math.max(0, Math.min(TIMES.length - 1, TIMES.indexOf(sel.time) + +a('data-tstep'))); sel.time = TIMES[ti]; render(true); reOpts(); return; }
  if (el.hasAttribute('data-qv')) { sel.q = +a('data-qv'); render(true); reOpts(); return; }
  if (el.hasAttribute('data-tipc')) { var tw = el.closest('.ux-as'), tt = tw && tw.querySelector('.ux-tip'); if (tt) tt.setAttribute('aria-expanded', 'false'); el.parentNode.hidden = true; return; }
  if (el.hasAttribute('data-tip')) { var tb = el.parentNode.querySelector('.ux-tipb'), op = el.getAttribute('aria-expanded') !== 'true'; el.setAttribute('aria-expanded', String(op)); if (tb) tb.hidden = !op; return; }
  if (el.getAttribute('data-st') === 'cq') { var nq = sel.q + +a('data-dl'); if (nq < 1) { st.cart = st.cart.filter(function(x){ return x.id !== K; }); sel.q = 1; toast(esc(o.t) + ' removed from your cart'); } else { sel.q = Math.min(qMax(), nq); addLine(K, JSON.parse(JSON.stringify(sel))); } save(); render(true); return; }
  if (el.hasAttribute('data-st')) { sel.q = Math.max(1, sel.q + +a('data-dl')); render(true); reOpts(); return; }
  if (el.hasAttribute('data-slot')) { var sv = a('data-slot'); if (!o || !slotted(o) || sortedSlots(o).map(function(x){ return x[0]; }).indexOf(sv) < 0) return; sel.slot = sv; render(true); reOpts(); return; }   /* solo horas del deal: la app también usa data-slot (p. ej. el panel «assistant-panel») y un clic en cualquier sitio lo cogía como hora */
  if (el.hasAttribute('data-dayx')) { var di = +a('data-dayx'), ix = sel.days.indexOf(di); if (ix > -1) sel.days.splice(ix, 1); else sel.days.push(di); sel.days.sort(); render(true); reOpts(); return; }
  if (el.hasAttribute('data-dd')) { sel.d = +a('data-dd'); render(true); reOpts(); return; }
  if (el.hasAttribute('data-time')) { sel.time = a('data-time'); render(true); reOpts(); return; }
  if (el.hasAttribute('data-act')) { var act = a('data-act');
    if (act === 'opts') { openSheet('opts', K); return; }
    if (act === 'add68') { addLine(K, JSON.parse(JSON.stringify(sel))); save(); go('cart'); return; }
    if (act === 'add') { addLine(K, JSON.parse(JSON.stringify(sel))); recDirty = true; openSheet('added', K); return; }   /* la página se repinta al cerrar la hoja (con la de opciones abierta render() no hace nada) */
    if (act === 'request' && needMail() && EC && desk) { openSheet('email', K); setTimeout(function(){ var i = document.getElementById('ux-mail-in'); if (i) i.focus(); }, 80); return; }   /* f6 escritorio: la misma página que en móvil, como modal antes de «Added to your cart» */
    if (act === 'request' && needMail() && (EP || (EC && !desk))) { askMail(); return; }   /* f6 en móvil: no cabe en «Added to your cart», va en una página antes */
    if (act === 'request' && needMail() && !EM && !EA) { var mi = document.getElementById('ux-mail-in');
      if (!mi) { askMail(); return; }
      var mv = mi.value.trim(); if (!okMail(mv)) { var me = document.querySelector('.ux-mailf .ux-merr'); if (me) { me.textContent = mv ? 'Check the email, it looks incomplete.' : 'Add your email so we can send you our answer.'; me.hidden = false; } mi.focus(); return; }
      st.mail = mv; save(); }   /* FV: sin email del huésped, lo pedimos antes de mandar la solicitud */
    if (act === 'request') { st.req[K] = { st: 'queued', amt: amount(o, sel), sub: describe(o, sel), slot: sel.slot }; save(); recDirty = true; openSheet('added', K); return; }   /* sin el paso «Send it to Marta now?»: la misma hoja que en automático */
    if (act === 'pack') { var on = packOn(); packKeys().forEach(function(k){ if (on[k] === 0) return; var ds = defSel(O[k]); if (manual(O[k])) st.req[k] = { st: 'queued', amt: amount(O[k], ds), sub: describe(O[k], ds), slot: ds.slot }; else addLine(k, ds); }); save(); go('mine'); return; }
    if (act === 'pay') { var q = keys(['queued']); q.forEach(function(k){ st.req[k].st = 'waiting'; st.req[k].at = 'Sent today, 10:24'; }); var pd = toPay(); st.paid = (st.paid || []).concat(st.cart); markBought(); st.cart = []; save(); render(); toast((pd ? 'Paid ' + eur(pd) : 'Done') + (q.length ? ' · request sent' : '')); return; } }
  if (el.hasAttribute('data-send')) { var ks = a('data-send'); st.req[ks].st = 'waiting'; st.req[ks].at = 'Sent today, 10:24'; save(); go('mine'); return; }
  if (el.hasAttribute('data-again')) { var kg = a('data-again'), xg = O[kg], sg = defSel(xg); sg.slot = a('data-slot2'); st.req[kg] = { st: 'queued', amt: amount(xg, sg), sub: describe(xg, sg), slot: sg.slot }; save(); render(true); openSheet('request', kg); return; }
  if (el.hasAttribute('data-cancel')) { openSheet('cancel', a('data-cancel')); return; }
  if (el.hasAttribute('data-docancel')) { st.req[a('data-docancel')].st = 'cancelled'; save(); close(); render(true); toast('Request cancelled · hold released'); return; }
  if (el.hasAttribute('data-dismiss')) { delete st.req[a('data-dismiss')]; save(); render(true); return; }
  if (el.hasAttribute('data-partner')) { openSheet('partner', a('data-partner')); return; }
  if (el.hasAttribute('data-toast')) { close(); toast(a('data-toast')); return; }
  if (el.hasAttribute('data-close')) { close(); return; }
}, true);
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); var r = e.target.closest && e.target.closest('[data-rec]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); recToggle(r.getAttribute('data-rec')); } var rv = e.target.closest && e.target.closest('.ux-rv[data-open]'); if (rv && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); rv.click(); } });
document.addEventListener('input', function(e){ var r = e.target.closest && e.target.closest('[data-rng]'); if (!r) return; var ss = sortedSlots(o); sel.slot = ss[+r.value][0]; reOpts(); var nr = document.querySelector('[data-rng]'); if (nr) nr.focus({ preventScroll: true }); });
function init(){
  document.documentElement.classList.toggle('ux-desk', desk);
  document.documentElement.classList.toggle('ux-v6m', !desk && isV6() && SC === 'instant'); if (!desk && isV6() && SC === 'instant') document.documentElement.classList.add('ux-bar-v64');   /* V6 en móvil: foto a sangre, sin la cabecera de la app */
  var root = document.querySelector('.ux-view'), old = root && root.querySelector('.ux-old');
  if (old) { mount = document.createElement('div'); mount.className = 'ux-mount'; old.parentNode.insertBefore(mount, old); }
  dockEl = document.querySelector('[data-slot="cta-dock"]'); if (dockEl) dockEl.classList.add('ivq-dock');
  if (!mount) return;
  render(); if (desk) setTimeout(vela, 400);
  document.addEventListener('scroll', function(e){ var t = e.target; if (!t.classList || !t.classList.contains('ux-c6t')) return; var n = Math.round(t.scrollLeft / t.clientWidth), car = t.parentNode, ds = car.querySelectorAll('.ux-c6d i');
    [].forEach.call(ds, function(d, i){ d.classList.toggle('on', i === n); }); var c = car.querySelector('.ux-c6n'); if (c) c.textContent = (n + 1) + '/' + ds.length; }, true);
  var tsel = document.querySelector('.ux-times [aria-checked="true"]'); if (tsel) { var tb = tsel.parentNode; tb.scrollLeft = tsel.offsetLeft - tb.clientWidth / 2 + tsel.offsetWidth / 2; }   /* la hora elegida, a la vista */
}
/* «See all extras»: la réplica se queda los clics de la fila «Back»; este se atiende antes (en window) y abre la lista */
window.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('.ux-seeall, .ux-seeall6'); if (!a) return; e.preventDefault(); e.stopImmediatePropagation(); location.href = a.getAttribute('href'); }, true);
/* escritorio: la fila superior es un «Back», no «Home»; fuera de la lista vuelve a la lista de extras */
function backRow(){ var b = document.querySelector('.dbk-row button'); if (!b || b.getAttribute('data-uxback')) return; b.setAttribute('data-uxback', '1');
  /* deal abierto desde fuera de Recommendations (p. ej. la home): a la derecha de la fila, un enlace a la lista con todos los extras */
  if (SC !== 'list' && BACK === 'home') { var row = b.closest('.dbk-row'), al = document.createElement('a'); al.href = 'ux-list' + EXT; al.className = 'ux-seeall'; al.innerHTML = 'See all offers<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'; row.classList.add('ux-has-seeall'); row.appendChild(al); }
  [].forEach.call(document.querySelectorAll('.dbk-row button span'), function(sp){ sp.textContent = SC === 'list' || BACK === 'home' ? 'Back' : 'Back to extras'; });   /* la etiqueta visible la pinta el CSS (::after) */
  b.setAttribute('aria-label', 'Back');
  [].forEach.call(document.querySelectorAll('.dbk-row .dbk-pill, .dbk-row button'), function(bb){ bb.setAttribute('data-dbk', 'Back'); });
  /* fuera de la lista: la réplica manda «atrás» a Home; con una copia del botón su manejador ya no lo reconoce y el nuestro vuelve a la lista */
  if (SC !== 'list') [].forEach.call(document.querySelectorAll('.dbk-row button'), function(bb){ var nb = bb.cloneNode(true); bb.replaceWith(nb); nb.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); go(BACK); }); }); }
/* escritorio: la explicación de la nota se abre hacia abajo si cabe en pantalla; si no, hacia arriba (nunca scroll) */
document.addEventListener('mouseover', function(e){ var t = e.target.closest && e.target.closest('.ux-dbuy .ux-as-below'); if (!t) return; var tb = t.querySelector('.ux-tipb'); if (!tb) return;
  requestAnimationFrame(function(){ var h = tb.offsetHeight, r = t.getBoundingClientRect(); t.classList.toggle('ux-tip-up', r.bottom + 8 + h > window.innerHeight - 12); }); });
if (document.readyState !== 'loading') { init(); backRow(); } else document.addEventListener('DOMContentLoaded', function(){ init(); backRow(); });
setTimeout(backRow, 400);
/* ?go= (lo usa la lista «What changed» de flows.html): abre la hoja de opciones (opts) o pulsa Request para enseñar el paso del email (mail) */
(function(){ var g = Q.get('go'); if (!g) return;
  setTimeout(function(){ var b = document.querySelector('#ux-fbar [data-act="opts"], [data-act="opts"]'); if (b && !desk) b.click();
    if (g === 'cart') { go('cart'); return; }
    if (g === 'pay') { var pb = document.querySelector('[data-act="pay"]'); if (pb) pb.click(); return; }
    if (g === 'mail') setTimeout(function(){ var r = document.querySelector('.ux-opsh [data-act="request"]'); if (r) r.click(); }, 600); }, 1100); })();
})();
