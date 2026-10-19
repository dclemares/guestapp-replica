/* Vista Pagos (cart): cuatro propuestas de presentación, seleccionables desde el cuadro de controles ("Vista pagos"). Solo actúa en la pantalla «cart». */
(function(){
'use strict';
var S = window.__SCREEN || {};
if (!S.id) return;
/* ===== En todo el prototipo el símbolo del euro va DETRÁS de las cifras: «€12.00» → «12.00€» (también en lo que se pinta con JS) ===== */
(function(){
  var RE = /€\s?(\d[\d.,]*\d|\d)/g;
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|CODE)$/;
  var fix = function(n){ var v = n.nodeValue; if (!v || v.indexOf('€') < 0) return; var w = v.replace(RE, '$1€'); if (w !== v) n.nodeValue = w; };
  var walk = function(root){
    if (root.nodeType === 3) { if (!root.parentNode || !SKIP.test(root.parentNode.nodeName)) fix(root); return; }
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function(n){ return n.parentNode && SKIP.test(n.parentNode.nodeName) ? 2 : 1; } }), n;
    while ((n = tw.nextNode())) fix(n);
  };
  var start = function(){
    walk(document.body);
    new MutationObserver(function(ms){ ms.forEach(function(m){
      if (m.type === 'characterData') { if (!m.target.parentNode || !SKIP.test(m.target.parentNode.nodeName)) fix(m.target); }
      else [].forEach.call(m.addedNodes, walk);
    }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
var isCart = S.id === 'cart';
var Q = new URLSearchParams(location.search);
var EMBED = Q.get('embed') === '1';
var W = (location.pathname.match(/\.([md])\.html/) || [])[1] || 'm';
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };

var hasMinors = (function(){ try { return localStorage.getItem('replica-minors') !== '0'; } catch (e) { return true; } })();   /* Controles del resumen → Menores */
var pick = function(v, list, d){ return list.some(function(x){ return x[0] === v; }) ? v : d; };
var pv = '7';   /* la vista de pagos definitiva es la V7 */
var postponed = function(){ try { var a = JSON.parse(localStorage.getItem('replica-postponed') || '[]'); return a && a.length ? a : []; } catch (e) { return []; } };   /* Controles → Pagos pospuestos (tasas y/o reserva); también desde el menú «Posponer pago» de cada tarjeta */
var setPostponed = function(a){ try { localStorage.setItem('replica-postponed', JSON.stringify(a)); } catch (e) {} window.dispatchEvent(new Event('replica-past-change')); };
var plVer = function(){ return '1'; };   /* Pay later: se queda la V1 · lista (V2/V3 siguen en el código pero sin control) */   /* Componentes → Pay later: V1 lista · V2 resumen desplegable · V3 cronología */
var hasPast = function(){ return LSget('replica-past-pay', '1') !== '0'; };   /* Ajustes de la reserva → Pagos existentes: ¿hay pagos ya hechos? (da acceso a «Order history») */
var CARDS = [['1', 'T1 · Fila'], ['2', 'T2 · Fila pulida'], ['3', 'T3 · Pase'], ['4', 'T4 · Mosaico'], ['5', 'T5 · Pulida B'], ['6', 'T6 · Pulida C'], ['7', 'T7 · Wallet'], ['8', 'T8 · Papel']];   /* V7: diseño de la tarjeta de item */
var tc = '6';   /* tarjeta de ítems definida: T6 · Pulida C (#853); el resto de variantes quedan en el código pero ya no se eligen */
/* Vela de pagos: la fija el componente elegido en Ajustes de la reserva → Componentes (uno solo): «Ask Vela chat» = '1b' (conversación con preguntas sugeridas) y «Ask Vela tradicional» = '0' (consejos, compartir y order history) */
var isV3 = false;   /* el chat es el final (antes V5): respuestas completas */
var isV2 = false;
var vv = (function(){ try { return localStorage.getItem('replica-comp-trad') === '1' && localStorage.getItem('replica-comp-chat') === '0' ? '0' : '1b'; } catch (e) { return '1b'; } })();


/* ===== Animación de carga de la respuesta de Vela: «Pensando» (esqueleto de líneas que brilla, el avatar late y las líneas se funden en el texto) ===== */
window.__velaLoad = function(ty, cb){
  if (!ty) { if (cb) cb(); return; }
  var RMo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var av = ty.parentNode && ty.parentNode.querySelector('.vc-av');
  var clear = function(){ ty.classList.remove('on', 'rev', 'ty-a'); if (av) av.classList.remove('think-a'); [].forEach.call(ty.querySelectorAll('.ty-sk'), function(x){ x.parentNode.removeChild(x); }); if (cb) cb(); };
  ty.__run = (ty.__run || 0) + 1; var run = ty.__run, alive = function(){ return ty.__run === run; };
  ty.classList.remove('rev'); ty.classList.add('on', 'ty-a');
  [].forEach.call(ty.querySelectorAll('.ty-sk'), function(x){ x.parentNode.removeChild(x); });
  if (RMo) { clear(); return; }
  if (av) av.classList.add('think-a');
  ty.insertAdjacentHTML('afterbegin', '<span class="ty-sk"><i></i><i></i><i></i><i></i></span>');
  setTimeout(function(){ if (!alive()) return; ty.classList.add('rev'); setTimeout(function(){ if (alive()) clear(); }, 380); }, 1050);
};
/* ---------- iconos (lucide, los mismos del producto) ---------- */
var P = {
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  pen: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  spark: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>'
};
var ic = function(n){ return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };

/* ---------- datos de la reserva de pruebas (los del carrito capturado) ---------- */
var D = { auth: 230, fee: 3.75, prem: 34.2 };
var es2 = function(n){ var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1]; };   /* formato es-ES: coma decimal y punto de millares */
var money = function(n){ return es2(n) + '\u20ac'; };
var money2 = function(n){ return es2(n) + '\u20ac'; };   /* formato es-ES: 24,00€ (la producción usaba 24.00€) */
var secure = 'Secured by Stripe with 3D Secure. Your card details never touch our servers.';
/* ---------- V7 · Resumen: tarjeta «Order summary» (como «Who are we registering?») + una tarjeta por item (como «What's next») ---------- */
var pays = function(){ var raw = null; try { raw = localStorage.getItem('replica-gc-payments'); } catch (e) {} if (raw === null) return ['taxes', 'deposit']; try { var a = JSON.parse(raw); return a && a.length ? a : []; } catch (e) { return ['taxes', 'deposit']; } };   /* sin tocar Controles → tasas + depósito; todo desmarcado → nada que pagar */
/* ---------- V7 · cuatro versiones de la tarjeta de item (control «Tarjetas items») ---------- */
var kebab7 = function(o){ return '<span class="pv7-kw"><button type="button" class="pv7-kb" data-m aria-label="Options for ' + o.t + '" aria-expanded="false">' + ic('dots') + '</button><div class="pv-menu" hidden>'
  + '<span class="pv-mh" aria-hidden="true"><i></i><b>' + o.t + '</b><em>' + (o.amt || '') + '</em></span>' + o.menu.map(function(x){ return x[2] ? '<button type="button" data-pp="' + x[2] + '">' + x[1] + '</button>' : '<button type="button" data-go="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></span>'; };
var feeTxt = function(o){ return o.fee ? '+ ' + money2(o.fee) + ' fee' : ''; };
var amtParts = function(s){ var m = /^(.*),(\d\d)(\u20ac?)$/.exec(s); return m ? m[1] + '<small>,' + m[2] + '</small>' + (m[3] ? '<span class="eu">' + m[3] + '</span>' : '') : s; };   /* 12.00€ → 12 + .00 más pequeño + € */   /* €12.00 → €12 + .00 más pequeño */
var itemCard = function(o, v){
  var d = o.dash ? ' dash' : '', tile = '<span class="pv7-ri' + d + '">' + ic(o.icon) + '</span>', amt = '<span class="pv7-ca7' + d + '">' + o.amt + '</span>', st = ' style="--i:' + (o.n || 0) + '"';
  /* T2 · Fila pulida: la misma fila con más oficio (sombra suave, icono en degradado, céntimos pequeños, comisión en etiqueta, entrada escalonada) */
  if (v === '2') return '<div class="pv7-c p2 ' + o.k + '"' + st + '><span class="p2i">' + ic(o.icon) + '</span><span class="pv7-cx"><b>' + o.t + '</b><span>' + o.s + '</span></span>'
    + '<span class="p2r"><span class="p2a' + d + '">' + amtParts(o.amt) + '</span>' + (o.fee ? '<em class="p2f">' + feeTxt(o) + '</em>' : '') + '</span>' + kebab7(o) + '</div>';
  /* T3 · Pase: billete con talón de color, perforación y muescas */
  if (v === '3') return '<div class="pv7-c p3 ' + o.k + d + '"' + st + '><div class="p3s"><span class="p3i">' + ic(o.icon) + '</span>' + (o.fee ? '<span class="p3f">' + feeTxt(o) + '</span>' : '') + '</div>'
    + '<div class="p3m"><div class="p3t"><b>' + o.t + '</b>' + kebab7(o) + '</div><span class="p3d">' + o.s + '</span><span class="p3a' + d + '">' + amtParts(o.amt) + '</span></div></div>';
  /* T4 · Mosaico: baldosa pastel con el importe gigante, icono grande de fondo y cifra que sube al entrar */
  if (v === '4') return '<div class="pv7-c p4 ' + o.k + d + '"' + st + '><span class="p4bg">' + ic(o.icon) + '</span><div class="p4h"><span class="p4i">' + ic(o.icon) + '</span><b>' + o.t + '</b>' + kebab7(o) + '</div>'
    + '<div class="p4a" data-cu="' + o.val + '">' + amtParts(o.amt) + '</div><span class="p4d">' + o.s + '</span>' + (o.fee ? '<em class="p4f">' + feeTxt(o) + '</em>' : '') + '</div>';
  /* T5 · Pulida B: tinte suave, icono en anillo, símbolo de moneda elevado */
  if (v === '5') return '<div class="pv7-c p5 ' + o.k + '"' + st + '><span class="p5i">' + ic(o.icon) + '</span><span class="pv7-cx"><b>' + o.t + '</b><span>' + o.s + '</span></span>'
    + '<span class="p5r"><span class="p5a' + d + '">' + amtParts(o.amt).replace('€', '<sup>€</sup>') + '</span>' + (o.fee ? '<span class="p5f">' + feeTxt(o) + '</span>' : '') + '</span>' + kebab7(o) + '</div>';
  /* T6 · Pulida C: filo de color arriba y, si hay comisión, franja inferior que la explica */
  if (v === '6') return '<div class="pv7-c p6 ' + o.k + '"' + st + '><div class="p6t"><span class="p6i">' + ic(o.icon) + '</span><span class="pv7-cx"><b>' + o.t + '</b><span>' + o.s + '</span></span><span class="p6r"><span class="p6a">' + amtParts(o.amt) + '</span>' + (o.fee ? '<em class="p6fee">' + feeTxt(o) + '</em>' : '') + '</span>' + kebab7(o) + '</div></div>';   /* la comisión va bajo el importe, como en T2; el depósito se ve igual que las demás tarjetas (sin gris ni guiones) */
  /* T7 · Wallet: tarjeta de pago con degradado, brillo holográfico e inclinación 3D que sigue al puntero */
  if (v === '7') return '<div class="pv7-c p7 ' + o.k + d + '"' + st + '><span class="p7sh"></span><div class="p7t"><span class="p7i">' + ic(o.icon) + '</span><b>' + o.t + '</b>' + kebab7(o) + '</div>'
    + '<div class="p7a">' + amtParts(o.amt) + '</div><div class="p7b"><span>' + o.s + '</span>' + (o.fee ? '<em>' + feeTxt(o) + '</em>' : '') + '</div></div>';
  /* T8 · Papel: recibos sueltos de papel, algo torcidos, con borde dentado y línea de puntos */
  if (v === '8') return '<div class="pv7-c p8 ' + o.k + d + '" style="--i:' + (o.n || 0) + ';--r:' + ['-.7deg', '.6deg', '-.4deg'][(o.n || 0) % 3] + '"><div class="p8h"><span class="p8i">' + ic(o.icon) + '</span><b>' + o.t + '</b><i class="p8ld"></i><span class="p8a">' + o.amt + '</span>' + kebab7(o) + '</div>'
    + '<span class="p8d">' + o.s + '</span>' + (o.fee ? '<div class="p8h p8fl"><span>+ service fee</span><i class="p8ld"></i><span>' + money2(o.fee) + '</span></div>' : '') + '</div>';
  return '<div class="pv7-c t1">' + tile + '<span class="pv7-cx"><b>' + o.t + '</b><span>' + o.s + '</span></span><span class="pv7-cr7">' + amt + (o.fee ? '<small>' + feeTxt(o) + '</small>' : '') + '</span>' + kebab7(o) + '</div>';
};
/* ---------- V7 · espacio vacío (nada que pagar y sin pagos existentes): 4 versiones ---------- */
var emptyView = function(){
  var h = '<div class="ev ev2"><div class="ev2-slip"><div class="ev2-h"><b>Order —</b><span>Nothing pending</span></div>'
    + '<div class="ev2-l"><span>Tourist taxes</span><i></i><span>0,00€</span></div><div class="ev2-l"><span>Reservation payment</span><i></i><span>0,00€</span></div><div class="ev2-l"><span>Security deposit</span><i></i><span>not required</span></div>'
    + '<div class="ev2-sep"></div><div class="ev2-l ev2-t"><b>To pay</b><i></i><b>0,00€</b></div><span class="ev2-st">ALL CLEAR</span></div>'
    + '<h2>Nothing to pay right now</h2><p>A fresh receipt will show up here if something comes up.</p></div>';
  return { cls: 'pv7', html: '<div class="pv7-wrap">' + h + '</div>', label: '', sub: 'There’s nothing to pay for this stay. Go enjoy the rest of the trip planning.', pageTitle: 'One less thing to <span class="text-[var(--chekin-color-brand-blue)]">think about</span>' };
};
/* ---------- Pay later: tres versiones (Componentes → Pay later) ---------- */
var payLater = function(late){
  var v = plVer(), tot = late.reduce(function(s, o){ return s + o.val + (o.fee || 0); }, 0), n = late.length;
  var head = '<div class="pv7-lblrow pl-hd"><h3 class="pv7-lbl">Pay later</h3></div><p class="pl-sub">You took these out of the cart. They’re still required — send them back whenever you decide, before or after paying the rest.</p>';
  if (v === '2') {   /* V2 · resumen desplegable */
    return '<div class="pl pl2" data-pl="2"><button type="button" class="pl2-b" data-pl2 aria-expanded="false"><span class="pl2-i">' + ic('clock') + '</span><span class="pl2-t"><b>Pay later</b><span>' + n + (n === 1 ? ' payment' : ' payments') + ' · ' + money2(tot) + ' postponed</span></span><span class="pl2-c">' + ic('right') + '</span></button>'
      + '<div class="pl2-p" hidden>' + late.map(function(o){ return '<div class="pl2-r"><span class="pl2-ri">' + ic(o.icon) + '</span><span class="pl2-rt"><b>' + o.t + '</b><span>' + o.due + '</span></span><span class="pl2-ra">' + money2(o.val) + '</span><button type="button" class="pl2-pn" data-pp="pn:' + (o.k === 'tax' ? 'taxes' : 'reservation') + '">Pay now</button></div>'; }).join('') + '</div></div>';
  }
  if (v === '3') {   /* V3 · cronología */
    return '<div class="pl pl3" data-pl="3">' + head + '<div class="pl3-l">' + late.map(function(o){ return '<div class="pl3-r"><div class="pl3-d"><span>' + (o.k === 'tax' ? '27 Nov' : '25 Nov') + '</span><b>' + (o.k === 'tax' ? 'Check-out' : 'Check-in') + '</b></div>' + itemCard(o, tc) + '</div>'; }).join('') + '</div></div>';
  }
  return '<div class="pl pl1" data-pl="1">' + head + '<div class="pv7-list">' + late.map(function(o){ return itemCard(o, tc); }).join('') + '</div></div>';   /* V1 · lista */
};
var v7 = function(){
  var P = pays(), hold = LSget('replica-deposit-type', 'hold') !== 'token';
  var tax = P.indexOf('taxes') > -1, dep = P.indexOf('deposit') > -1, res = P.indexOf('reservation') > -1;
  if (!tax && !dep && !res) {
    if (!hasPast()) return emptyView();
    return { cls: 'pv7', html: '<div class="pv7-wrap"><div class="pv7-rcs">' + receiptsHtml(pastOrders()) + '</div></div>', label: '', sub: 'Below you\u2019ll find the payments you\u2019ve already made. There\u2019s nothing to pay for this stay. Go enjoy the rest of the trip planning.', pageTitle: 'One less thing to <span class="text-[var(--chekin-color-brand-blue)]">think about</span>' };
  }
  var TX = (function(){ var b = null; try { b = JSON.parse(localStorage.getItem('replica-tax3') || 'null'); } catch (e0) {} if (!b || b.v !== 2 || !(b.n >= 1)) b = { n: 4, r: ['', 'Under 16'] }; var pp = (b.p || []).slice(0, b.n).filter(Boolean).length, ee = (b.r || []).slice(0, Math.min(b.n, 2)).filter(function(x, i){ return x && !(b.p && b.p[i]); }).length, due = b.n - pp; return { t: (due - ee) * 6, s: pp ? due + ' of ' + b.n + ' guests \u00b7 ' + pp + ' already paid' : b.n + (b.n === 1 ? ' guest' : ' guests') + ' \u00b7 ' + ee + (ee === 1 ? ' exemption' : ' exemptions') }; })();   /* Edición de tasas (taxes.js) → estado guardado: 3 € por huésped y noche, 2 noches; solo los registrados pueden estar exentos */
  var T = TX.t, R = 12, PPL = postponed(), taxP = tax && PPL.indexOf('taxes') > -1, resP = res && PPL.indexOf('reservation') > -1;
  tax = tax && !taxP; res = res && !resP;   /* lo pospuesto sale del total y va a «Pay later» */
  var fees = LSget('replica-ext-fees', '1') !== '0';   /* Controles → Ajustes de la reserva → Comisiones externas (valores de demo) */
  var FT = fees && tax ? 0.5 : 0, FR = fees && res ? 0.5 : 0, FD = fees && dep ? D.fee : 0;
  var FTp = fees && taxP ? 0.5 : 0, FRp = fees && resP ? 0.5 : 0;
  var now = (tax ? T : 0) + (res ? R : 0) + FT + FR + FD;
  var payLbl = (now === 0 && !dep) ? 'Nothing to pay now' : (now === 0 ? (hold ? 'Hold ' : 'Authorise ') + money2(D.auth) : 'Pay ' + money2(now) + (dep ? (hold ? ' and hold' : ' and authorise') : ''));   /* el botón dice qué pasa con el depósito según Controles → Tipo de depósito */
  var noteTxt = hold
    ? '<b>In this transaction, ' + money2(D.auth) + ' will be held on your card.</b> It will be released after your stay, and may be charged if the property\u2019s rules or conditions are not respected.'
    : '<b>In this transaction, ' + money2(D.auth) + ' will be authorised, not charged.</b> It may be charged if the property\u2019s rules or conditions are not respected.';
  var noteBox = noteTxt.replace('<b>In this transaction, ', 'In this transaction, <b>');   /* «In this transaction,» normal; el resto de la frase, en negrita */
  var lead = hold ? 'Hold ' + money2(D.auth) + '.' : money2(D.auth) + ' authorised, not charged.';
  var hero = '<section class="pv7-hero"><div class="pv7-hr"><h2 class="pv7-h">Order summary</h2><span class="pv7-due">' + ic('clock') + 'Due before 25 Nov</span></div>'
    + '<div class="pv7-now"><span>To pay now</span><b>' + money2(now) + '</b></div>'
    + '<button type="button" class="pv7-pay" data-act="main">' + payLbl + '</button>'
    + '<p class="pv7-sec">' + ic('lock') + '<span>' + secure + '</span></p>'
    + (dep ? '<div class="pv7-share"><p>' + noteBox + '</p></div>' : '') + '</section>';
  var items = [];
  if (tax) items.push({ k: 'tax', val: T, n: 0, icon: 'coins', t: 'Tourist taxes', s: TX.s, amt: money2(T), fee: FT, menu: [['cart-exemptions', 'See how it works and edit exemptions'], ['', 'Postpone payment', 'pp:taxes']] });
  if (res) items.push({ k: 'res', val: R, n: 1, icon: 'card', t: 'Reservation payment', s: 'Due before check-in', amt: money2(R), fee: FR, menu: [['', 'Postpone payment', 'pp:reservation']] });
  if (dep) items.push({ k: 'dep', val: D.auth, n: 2, icon: 'shield', dash: true, t: 'Security deposit', s: hold ? 'Held on your card' : 'Authorised only', amt: money2(D.auth), fee: FD, menu: [['pay-1-protection', 'See how it works and edit protection']] });
  var cards = items.map(function(o){ return itemCard(o, tc); }).join('');
  var late = [];
  if (taxP) late.push({ k: 'tax', val: T, n: 0, icon: 'coins', t: 'Tourist taxes', s: TX.s, amt: money2(T), fee: FTp, due: 'Due before check-out', menu: [['', 'Pay now', 'pn:taxes'], ['cart-exemptions', 'See how it works and edit exemptions']] });
  if (resP) late.push({ k: 'res', val: R, n: 1, icon: 'card', t: 'Reservation payment', s: 'Due before check-in', amt: money2(R), fee: FRp, due: 'Due before check-in', menu: [['', 'Pay now', 'pn:reservation']] });
  var lateHtml = late.length ? payLater(late) : '';
  /* el pedido que verá el flujo de pago (checkout.js), solo para leer importes: pagar no cambia nada fuera de esa pantalla */
  LSset('replica-order', JSON.stringify({ now: now, hold: hold, dep: dep, auth: D.auth, depFee: FD, rel: parseInt(LSget('replica-dep-release', '7'), 10) || 7,
    items: items.filter(function(o){ return o.k !== 'dep'; }).map(function(o){ return { k: o.k, t: o.t, s: String(o.s).replace(/<[^>]+>/g, ''), val: o.val, fee: o.fee }; }),
    late: late.map(function(o){ return { k: o.k, t: o.t, val: o.val, fee: o.fee, due: o.due }; }) }));
  return { cls: 'pv7', html: '<div class="pv7-wrap">' + hero + (!cards ? (hasPast() ? '<div class="pv7-lblrow pv7-lblrow-e"><span></span><button type="button" class="pv7-lnk" data-go="order-history">Order history ' + ic('right') + '</button></div>' : '') : (hasPast() ? '<div class="pv7-lblrow"><h3 class="pv7-lbl">In your order</h3><button type="button" class="pv7-lnk" data-go="order-history">Order history ' + ic('right') + '</button></div>' : '<h3 class="pv7-lbl">In your order</h3>') + '<div class="pv7-list">' + cards + '</div>') + lateHtml
      + '</div>', label: payLbl, sub: 'Review your order and pay securely.', vela: true };
};
/* ---------- Vela (escritorio) de pagos: «Quick actions» (compartir), «Order history» y «Good to know», todo según Controles ---------- */
var VELA_LINK = 'https://guestapp-v2.stg.chekin.com/pay?code=DEMO', RCPT_LINK = 'https://guestapp-v2.stg.chekin.com/receipts?code=DEMO';
var cfg = function(){   /* lo configurado en Controles que cambia lo que dice Vela */
  var P = pays(), c = { hold: LSget('replica-deposit-type', 'hold') !== 'token', fees: LSget('replica-ext-fees', '1') !== '0', past: hasPast() };
  c.tax = P.indexOf('taxes') > -1; c.dep = P.indexOf('deposit') > -1; c.res = P.indexOf('reservation') > -1; c.pend = c.tax || c.dep || c.res;
  c.now = (c.tax ? 12 : 0) + (c.res ? 12 : 0) + (c.fees && c.tax ? 0.5 : 0) + (c.fees && c.res ? 0.5 : 0) + (c.fees && c.dep ? D.fee : 0);   /* lo que se cobra ahora; el depósito no suma */
  return c;
};
/* consejos «Good to know» por prioridad (mayor = más importante; si no caben, se quitan desde abajo). go = pantalla a la que lleva */
var gtkRows = function(c){
  var r = [], A = money2(D.auth), N = money2(c.now);
  if (c.dep) {
    r.push({ p: 90, i: 'coins', t: 'What do I pay today?', d: (c.now > 0 ? 'Only ' + N + ' is charged now. ' : 'Nothing is charged now. ') + 'The ' + A + ' deposit is ' + (c.hold ? 'held on your card' : 'authorised') + ' separately and never counts as a payment.' });
    r.push(c.hold
      ? { p: 80, i: 'shield', t: 'What’s a hold?', d: 'Your bank blocks the amount from the moment you pay and releases it after your stay. The property sets when.', go: 'cart-how-auth' }
      : { p: 80, i: 'shield', t: 'What’s an authorisation?', d: 'Your card is saved and nothing is blocked, so your card limit stays available. It’s only charged if the property’s rules or conditions aren’t respected.', go: 'cart-how-auth' });
    r.push(c.hold
      ? { p: 55, i: 'clock', t: 'Your bank may notify you', d: 'The hold is renewed automatically while it lasts (up to 30 days), so you may get a notice from your bank.' }
      : { p: 55, i: 'card', t: 'Keep some funds available', d: 'If a charge is ever needed, it can fail when the card doesn’t have enough funds.' });
  }
  if (c.fees && c.pend) r.push({ p: 60, i: 'receipt', t: 'What’s the service fee?', d: 'A small fee for processing each payment securely, shown next to each item and already in “To pay now”.' + (c.dep ? ' The deposit’s fee (' + money2(D.fee) + ') is a payment of its own, not part of the ' + A + '.' : '') });
  if (!c.fees && c.pend) r.push({ p: 35, i: 'receipt', t: 'No extra fees', d: 'No service fee is added to this order: what you see is what you pay.' });
  if (c.tax) r.push({ p: 50, i: 'coins', t: 'Taxes depend on who’s staying', d: 'Some guests may be exempt depending on the destination' + (hasMinors ? ' (for example, minors)' : '') + '. Review it in ⋯ › Edit taxes.', go: 'cart-exemptions' });
  if (!c.pend && c.past) r.push({ p: 80, i: 'receipt', t: 'Holds and payments are separate', d: 'A hold or authorisation is never part of a payment, so each one has its own receipt below.' });
  if (c.res) r.push({ p: 40, i: 'card', t: 'Due before check-in', d: 'Paying the reservation now means one less thing to sort out on arrival day.' });
  return r;
};
var gRow = function(o){
  var ico = '<span class="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] [&_svg]:h-4 [&_svg]:w-4 bg-[var(--assistant-tip-icon-bg)] text-[var(--assistant-tip-icon)]">' + ic(o.i) + '</span>';
  var txt = '<div class="min-w-0 flex-1"><strong class="block text-[13px] font-bold text-[var(--assistant-tip-title)]">' + o.t + '</strong><span class="mt-0.5 block text-[12px] leading-[17px] text-[var(--assistant-tip-description)]">' + o.d + '</span></div>';
  if (!o.go) return '<div class="flex gap-[11px] py-2" data-pri="' + o.p + '">' + ico + txt + '</div>';
  return '<button type="button" data-pri="' + o.p + '" data-go="' + o.go + '" class="group -mx-2 flex w-full items-center gap-1 rounded-[10px] px-2 text-left transition-colors hover:bg-[var(--assistant-tip-icon-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--assistant-section-accent)]"><div class="flex gap-[11px] py-[11px] flex-1">' + ico + txt + '</div>'
    + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 flex-none text-[var(--assistant-tip-description)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">' + P.right + '</svg></button>';
};
/* tarjeta de «Quick actions»: compartir el enlace de pago (si hay algo pendiente) o los recibos (si ya está todo pagado) */
var shareCard = function(c){
  if (c.pend) return { t: 'Someone else paying?', d: 'Send a secure link so they can pay this order from their own phone.' + (c.dep ? ' The ' + money2(D.auth) + (c.hold ? ' hold' : ' authorisation') + ' goes on their card.' : ''),
    o: { title: 'Payment link', text: 'Here is the link to pay for our stay at Villa Calipso.', url: VELA_LINK, heading: 'Share the payment link', blurb: 'Send this link so someone else can pay this order from their own phone.' } };
  if (c.past) return { t: 'Share your receipts', d: 'Send the receipts of this stay, payments and holds, to whoever needs them.',
    o: { title: 'Receipts', text: 'Here are the receipts for our stay at Villa Calipso.', url: RCPT_LINK, heading: 'Share your receipts', blurb: 'Send this link to give access to the receipts for this stay.' } };
  return null;
};
var shareEl = function(sc, cls){   /* tarjeta de compartir (Copy link + Share) */
  var card = document.createElement('div'); card.className = cls || 'pv7-vc';
  card.innerHTML = '<strong>' + sc.t + '</strong><span>' + sc.d + '</span><div><button type="button" class="pv7-vp" data-q="copy">Copy link</button><button type="button" class="pv7-vs" data-q="share">Share</button></div>';
  wireShare(card, sc); return card;
};
var wireShare = function(el, sc){
  el.addEventListener('click', function(e){
    var b = e.target.closest('[data-q]'); if (!b || !sc) return; e.preventDefault(); e.stopPropagation();
    if (b.getAttribute('data-q') === 'share') { if (window.__shareLink) window.__shareLink(b, sc.o); return; }
    try { navigator.clipboard.writeText(sc.o.url); } catch (_) {}
    var t0 = b.textContent; b.textContent = 'Link copied'; setTimeout(function(){ b.textContent = t0; }, 1800);
  });
};
var paidSum = function(){ return pastOrders().filter(function(o){ return !o.dep; }).reduce(function(s, o){ return s + o.fee + o.lines.reduce(function(a, l){ return a + l[2]; }, 0); }, 0); };
var lnk = function(go_, t){ return '<button type="button" class="vx-l" data-go="' + go_ + '">' + t + ' ' + ic('right') + '</button>'; };
var shareBtns = '<div class="vx-act"><button type="button" class="pv7-vp" data-q="copy">Copy link</button><button type="button" class="pv7-vs" data-q="share">Share</button></div>';
var VX_INTRO = { '1b': 'Ask me anything about this payment. I\u2019ve picked the questions that fit your order.' };
var esc = function(t){ return String(t).replace(/<[^>]*>/g, ''); };
/* ---------- contenido de la familia V1: las dudas del huésped según la config (k = tema) ---------- */
var qList = function(c){
  var A = money2(D.auth), N = money2(c.now), q = [];
  if (c.dep) {
    q.push({ p: 95, k: 'dep', t: 'Why is there a deposit?', a: 'The property asks for a ' + A + (isV3 ? ' deposit' : ' security deposit') + ' in case its rules or conditions aren’t respected. It’s ' + (c.hold ? 'held' : 'authorised') + ' on your card, not charged.' });
    q.push(c.hold
      ? { p: 90, k: 'dep', t: 'When do I get the ' + A + ' back?', a: 'It’s never taken, only blocked. The hold is released after your stay, on the day the property ' + (isV3 ? 'sets' : 'has set after check-out') + '. You don’t need to do anything.' }
      : { p: 90, k: 'dep', t: 'Will I be charged the ' + A + '?', a: (isV3 ? 'Only if the property reports a breach of its rules or conditions. Otherwise nothing is taken and your card limit stays available.' : 'Only if the property reports that its rules or conditions weren’t respected. Otherwise nothing is ever taken, and your card limit stays available.') });
  }
  if (c.pend) q.push({ p: 85, k: 'pay', t: 'Can someone else pay?', a: 'Yes. Send them a secure link and they can pay this order from their own phone.' + (c.dep ? ' The ' + A + (c.hold ? ' hold' : ' authorisation') + ' goes on their card.' : '') + shareBtns });
  if (c.dep && c.now > 0) q.push({ p: 80, k: 'pay', t: 'Why does my total say ' + N + '?', a: '“To pay now” only counts what is charged. The ' + A + ' deposit is a separate operation and is never added to it.' });
  if (c.tax) q.push({ p: 70, k: 'pay', t: 'Why do I pay tourist taxes?', a: 'They’re set by the destination and depend on who’s staying. Some guests may be exempt' + (hasMinors ? ' (for example, minors)' : '') + '.' + lnk('cart-exemptions', 'Edit taxes') });
  if (c.fees && c.pend) q.push({ p: 60, k: 'pay', t: 'What’s the service fee for?', a: 'It covers processing each payment securely. It’s shown next to each item and already included in “To pay now”.' });
  if (c.pend) q.push({ p: 55, k: 'card', t: 'Is my card safe?', a: 'Payments go through Stripe with 3D Secure. Your card details never touch our servers.' });
  if (c.pend) q.push({ p: 50, k: 'card', t: 'My bank asks me to confirm', a: 'That’s 3D Secure. Approve it in your bank app or with the code it sends you, then come back here.' });
  if (c.pend) q.push({ p: 44, k: 'card', t: 'What if my card is declined?', a: 'Check the details and that the card allows online payments, or try another card.' + (c.dep && c.hold ? ' It also needs room for the ' + A + ' hold.' : '') });
  if (c.res) q.push({ p: 45, k: 'pay', t: 'Do I have to pay the reservation now?', a: 'It’s due before check-in. Paying it now with the rest means one less thing on arrival day.' });
  if (c.dep && c.hold) q.push({ p: 75, k: 'dep', t: 'Will my bank notify me?', a: 'The hold is renewed automatically while it lasts (up to 30 days), so you may get a notice from your bank.' });   /* de «Good to know» */
  if (c.dep && !c.hold) q.push({ p: 75, k: 'dep', t: 'Does my card need funds?', a: 'If a charge is ever needed, it can fail when the card doesn’t have enough funds.' });   /* de «Good to know» */
  if (!c.fees && c.pend) q.push({ p: 58, k: 'pay', t: 'Are there extra fees?', a: 'No service fee is added to this order: what you see is what you pay.' });   /* de «Good to know» */
  if (c.pend && c.past) q.push({ p: 40, k: 'rcpt', t: 'Where are my past payments?', a: 'Every payment and hold you’ve made for this stay has its own receipt.' + lnk('order-history', 'Order history') });
  if (!c.pend && c.past) {
    q.push({ p: 95, k: 'pay', t: 'Is there anything left to pay?', a: 'No. Everything for this stay is settled. If something new comes up, it will show up on this page.' });
    q.push({ p: 90, k: 'rcpt', t: 'Why is the deposit on its own receipt?', a: 'A hold or authorisation is never a payment, so it always gets a receipt of its own, even if it happened at the same time.' });
    q.push({ p: 85, k: 'dep', t: c.hold ? 'When is the hold released?' : 'Can the card still be charged?', a: c.hold ? 'After your stay, on the day the property has set after check-out. Your bank may take a few more days to show it.' : 'Only if the property reports that its rules or conditions weren’t respected.' });
    q.push({ p: 80, k: 'rcpt', t: 'Can I send the receipts to someone?', a: 'Yes, share a link to the receipts of this stay, for example with whoever is paying you back.' + shareBtns });
  }
  if (!c.pend && !c.past) q.push({ p: 90, k: 'pay', t: 'Will I have to pay anything later?', a: 'Nothing is pending for this stay. If something comes up, it will show up here before anything is charged.' });
  return q.sort(function(a, b){ return b.p - a.p; }).slice(0, 5);   /* como mucho cinco preguntas */
};
var vx1b = function(c){
  var q = qList(c), f = q[0];
  var chat = function(o){ return '<div class="vc-q">' + o.t + '</div><div class="vc-a"><span class="vc-av">' + ic('spark') + '</span><div>' + o.a + '</div></div>'; };
  var s = '<div class="vc"><div class="vc-chat" aria-live="polite">' + chat(f) + '</div>'
    + '<span class="vc-lb">Suggested</span><div class="vc-chips">' + q.map(function(o, i){ return '<button type="button" class="vc-chip' + (i === 0 ? ' on' : '') + '" data-ask="' + i + '" data-pri="' + o.p + '">' + o.t + '</button>'; }).join('') + '</div></div>';   /* solo preguntas sugeridas: no hay caja para escribir */
  return [{ t: 'Ask Vela', html: s, init: function(n){
    var box = n.querySelector('.vc-chat');
    n.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var i = +b.getAttribute('data-ask'); box.innerHTML = chat(q[i]); [].forEach.call(n.querySelectorAll('.vc-chip'), function(x){ x.classList.toggle('on', +x.getAttribute('data-ask') === i); }); });
  } }];
};
/* V1b V2 · «Suggested questions» arriba y «Vela answer» (la conversación) debajo; solo preguntas sugeridas */
var vx1bV2 = function(c){
  var q = qList(c), f = q[0], n1 = null, box = null;
  var chat = function(o, typing){ return '<div class="vc-q">' + o.t + '</div><div class="vc-a"><span class="vc-av">' + ic('spark') + '</span><div class="ty' + (typing ? ' on' : '') + '"><span class="pc-dots"><i></i><i></i><i></i></span><span class="ty-t">' + o.a + '</span></div></div>'; };
  var chips = '<div class="vc"><div class="vc-chips">' + q.map(function(o, i){ return '<button type="button" class="vc-chip' + (i === 0 ? ' on' : '') + '" data-ask="' + i + '" data-pri="' + o.p + '">' + o.t + '</button>'; }).join('') + '</div></div>';
  var show = function(i){ if (!box) return; box.innerHTML = chat(q[i], true); window.__velaLoad(box.querySelector('.ty')); [].forEach.call(n1.querySelectorAll('.vc-chip'), function(x){ x.classList.toggle('on', +x.getAttribute('data-ask') === i); }); };
  return [
    { t: 'Suggested questions', html: chips, init: function(n){ n1 = n; n.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; e.preventDefault(); e.stopPropagation(); show(+b.getAttribute('data-ask')); }); } },
    { t: 'Vela answer', noacc: true, html: '<div class="vc"><div class="vc-chat" aria-live="polite">' + chat(f) + '</div></div>', init: function(n){ box = n.querySelector('.vc-chat'); } }
  ];
};
var VX = { '1b': vx1b };
if (isV2) VX['1b'] = vx1bV2;
var VX_SLACK = { '1b': 70 };   /* margen para lo que crece al interactuar (respuesta más larga) */
/* tarjeta azul «Your past payments» con el botón «View order history» */
var ohCard = function(){
  var oc = document.createElement('div'); oc.className = 'pv7-vc';
  oc.innerHTML = '<strong>Your past payments</strong><span>See everything you\u2019ve already paid for this stay, with receipts.</span><div><button type="button" class="pv7-vp" data-go="order-history">View order history</button></div>';
  oc.querySelector('button').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); go('order-history'); });
  return oc;
};
var velaSection = function(){
  var as = document.querySelector('aside[data-slot="assistant-panel"]'); if (!as || pv !== '7' || !isCart) return;
  var c = cfg(), sc = shareCard(c), rows = gtkRows(c);
  var sig = [vv, c.hold, c.fees, c.past, c.tax, c.dep, c.res, as.clientHeight].join('|');
  if (as.getAttribute('data-pv7-sig') === sig) return;
  var secs = [].slice.call(as.querySelectorAll(':scope > section')), mine = function(k){ return as.querySelector(':scope > section[data-pv7-' + k + ']'); };
  var gtk = mine('gtk') || secs.filter(function(x){ return !x.hasAttribute('data-pv7-vela') && !x.hasAttribute('data-pv7-qa'); })[0]; if (!gtk) return;
  gtk.setAttribute('data-pv7-gtk', '1');
  var lab = gtk.children[0];
  var section = function(k, title){ var e = mine(k); if (e) e.parentNode.removeChild(e); var n = gtk.cloneNode(false); n.removeAttribute('data-pv7-gtk'); n.style.display = ''; n.setAttribute('data-pv7-' + k, '1'); var l = lab.cloneNode(true); l.textContent = title; n.appendChild(l); return n; };
  /* versiones V1 y V2 (y sus variantes): secciones propias (data-pv7-x) en lugar de Quick actions / Order history / Good to know */
  [].forEach.call(as.querySelectorAll(':scope > section[data-pv7-x]'), function(x){ x.parentNode.removeChild(x); });
  var intro = as.querySelector(':scope > p');
  if (intro && !intro.hasAttribute('data-orig')) intro.setAttribute('data-orig', intro.textContent);
  if (intro) intro.textContent = vv === '0' ? intro.getAttribute('data-orig') : VX_INTRO[vv];
  if (vv !== '0') {
    ['qa', 'vela'].forEach(function(k){ var e = mine(k); if (e) e.parentNode.removeChild(e); });
    gtk.style.display = 'none';
    var parts = VX[vv](c);
    if (c.past && c.pend) parts.unshift({ t: 'Order history', el: ohCard() });   /* el chat lleva el compartir dentro de su pregunta; «Order history» va arriba, encima de las preguntas, como tarjeta */
    parts.forEach(function(pt){
      var n = gtk.cloneNode(false); n.removeAttribute('data-pv7-gtk'); n.style.display = ''; n.setAttribute('data-pv7-x', vv); var l = lab.cloneNode(true); l.textContent = pt.t; if (pt.noacc) l.classList.add('vx-noacc'); n.appendChild(l);
      if (pt.el) n.appendChild(pt.el); else { var w = document.createElement('div'); w.className = 'vx-body'; w.innerHTML = pt.html; n.appendChild(w); }
      n.addEventListener('click', function(e){
        var gb = e.target.closest('[data-go]'); if (gb) { e.preventDefault(); e.stopPropagation(); go(gb.getAttribute('data-go')); return; }
        var qb = e.target.closest('.vq-b'); if (!qb) return; e.preventDefault(); e.stopPropagation();
        var it = qb.parentNode, open = !it.classList.contains('open');
        [].forEach.call(n.querySelectorAll('.vq'), function(x){ x.classList.remove('open'); x.querySelector('.vq-a').hidden = true; x.querySelector('.vq-b').setAttribute('aria-expanded', 'false'); });
        if (open) { it.classList.add('open'); it.querySelector('.vq-a').hidden = false; qb.setAttribute('aria-expanded', 'true'); }
      });
      if (!pt.el) wireShare(n, sc);
      if (pt.init) pt.init(n);
      gtk.parentNode.insertBefore(n, gtk);
    });
    /* sin scroll: se quitan los de menor prioridad (en V1 con margen para la respuesta abierta) */
    var xi = function(){ return [].slice.call(as.querySelectorAll(':scope > section[data-pv7-x] [data-pri]')); };
    var slack = VX_SLACK[vv] || 0;
    var bottom = function(){ var t = as.getBoundingClientRect().top, m = 0; [].forEach.call(as.children, function(k){ if (k.offsetHeight) m = Math.max(m, k.getBoundingClientRect().bottom - t); }); return m + as.scrollTop + 56; };   /* 56 = pb-14 del panel */
    while ((as.scrollHeight > as.clientHeight + 1 || bottom() + slack > as.clientHeight) && xi().length > 1) { var lo = xi().sort(function(a, b){ return +a.getAttribute('data-pri') - +b.getAttribute('data-pri'); })[0]; lo.parentNode.removeChild(lo); }
    as.setAttribute('data-pv7-sig', sig);
    return;
  }
  /* sin «Quick actions» (se quitó «Someone else paying?»); con algo pendiente y pagos existentes, sección «Order history» con su tarjeta azul */
  var q = mine('qa'); if (q) q.parentNode.removeChild(q);
  var oldOh = mine('vela'); if (oldOh) oldOh.parentNode.removeChild(oldOh);
  if (c.past && c.pend) {
    var oh = section('vela', 'Order history'); oh.appendChild(ohCard());
    gtk.parentNode.insertBefore(oh, gtk);
  }
  /* Good to know: se rehace entero según lo configurado, y si no cabe sin scroll se quitan los de menor prioridad */
  rows.sort(function(a, b){ return b.p - a.p; });
  while (gtk.children.length > 1) gtk.removeChild(gtk.lastChild);
  var wrap = document.createElement('div'); wrap.innerHTML = rows.map(gRow).join('');
  while (wrap.firstChild) gtk.appendChild(wrap.firstChild);
  gtk.style.display = rows.length ? '' : 'none';
  [].forEach.call(gtk.querySelectorAll('[data-go]'), function(b){ b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); go(b.getAttribute('data-go')); }); });
  var items = function(){ return [].slice.call(gtk.querySelectorAll('[data-pri]')); };
  var over = function(){ return as.scrollHeight > as.clientHeight + 1; };
  while (over() && items().length > 1) { var low = items().sort(function(a, b){ return +a.getAttribute('data-pri') - +b.getAttribute('data-pri'); })[0]; low.parentNode.removeChild(low); }
  if (!items().length) gtk.style.display = 'none';
  as.setAttribute('data-pv7-sig', sig);
};

/* ---------- montaje ---------- */
var view, cart, root, head, sub0, dock, dockBtn, orig = {};
var $ = function(s, r){ return (r || document).querySelector(s); };
var setLabel = function(btn, text){
  if (!btn) return;
  var n = [].filter.call(btn.childNodes, function(x){ return x.nodeType === 3 && x.nodeValue.trim(); })[0];
  if (n) n.nodeValue = text; else btn.insertBefore(document.createTextNode(text), btn.firstChild);
};
var go = function(id){ location.href = id + '.' + W + '.html' + (EMBED ? '?embed=1' : ''); };

/* V7: el título de la barra (móvil) y la miga (escritorio) pasan de «Your Payments» a «Review & pay» */
var retitle = function(){
  if (!isCart) return;
  var want = 'Review & pay';
  var els = [].slice.call(document.querySelectorAll('header span.truncate'));
  els.forEach(function(e){ if (/^(Your Payments|Review & pay)$/.test(e.textContent.trim()) && e.textContent.trim() !== want) e.textContent = want; });
  var crumbWant = 'Your Payments';   /* miga de escritorio (con título) */
  [].forEach.call(document.querySelectorAll('.payments-view span.uppercase'), function(e){ if (/^(Your Payments|Review & pay)$/.test(e.textContent.trim()) && e.textContent.trim() !== crumbWant) e.textContent = crumbWant; });
};
var paint = function(){
  if (!isCart) return;
  view = $('.payments-view'); if (!view) return;
  cart = $('.my-cart', view); dock = $('[data-slot="cta-dock"]'); dockBtn = dock && dock.querySelector('button');
  head = $('header h1', view); sub0 = head && head.closest('header').querySelector('p');
  var badge = $('[data-tabs-count]', view);
  if (head && !orig.h1) orig.h1 = head.innerHTML;
  if (!orig.sub) { orig.sub = sub0 ? sub0.textContent : ''; orig.dock = dockBtn ? dockBtn.textContent.trim() : ''; orig.badge = badge ? badge.textContent : ''; }
  if (root && root.parentNode) root.parentNode.removeChild(root);
  document.documentElement.toggleAttribute('data-pv7', pv === '7'); velaSection(); retitle();
  [].forEach.call(document.querySelectorAll('.pv-dtot'), function(x){ x.parentNode.removeChild(x); });
  var r = v7();
  root = document.createElement('div'); root.id = 'pv-root'; root.innerHTML = '<div class="pv-wrap ' + r.cls + '">' + r.html + '</div>';
  cart.parentNode.insertBefore(root, cart.nextSibling);
  view.classList.add('pv-on'); view.setAttribute('data-pv', pv);
  if (head && orig.h1) head.innerHTML = r.pageTitle || orig.h1;   /* E2: el título de la página cambia, también en móvil */
  if (r.pageTitle) view.setAttribute('data-ev', '2'); else view.removeAttribute('data-ev');
  if (sub0 && r.sub) sub0.textContent = r.sub; setLabel(dockBtn, r.label);
  if (r.dockTotal && dockBtn) { var dt = document.createElement('div'); dt.className = 'pv-dtot'; dt.innerHTML = '<span>To pay now</span><b>' + r.dockTotal + '</b>'; dockBtn.parentNode.insertBefore(dt, dockBtn); }
  if (r.vela) velaSection();
  var cu = root.querySelectorAll('[data-cu]');
  if (cu.length && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) [].forEach.call(cu, function(el, idx){
    var to = +el.getAttribute('data-cu'), t0 = null, final = el.innerHTML;
    var step = function(ts){ if (t0 === null) t0 = ts + idx * 90; var p = Math.min(1, Math.max(0, (ts - t0) / 700)), e = 1 - Math.pow(1 - p, 3); el.innerHTML = p < 1 ? amtParts(money2(to * e)) : final; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  root.addEventListener('click', onClick);
  if (window.__ckAfterPaint) window.__ckAfterPaint(root);
  if (tc === '7') {
    root.addEventListener('pointermove', function(e){ var c = e.target.closest('.p7'); if (!c) return; var b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      c.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(2) + 'deg'); c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); });
    root.addEventListener('pointerout', function(e){ var c = e.target.closest('.p7'); if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--mx', '50%'); } });
  }
};

var main = function(){ if (window.__ckMain && window.__ckMain()) return; go('pay-card-sheet'); };   /* checkout.js decide según «Flujo de pago»: página aparte, dentro del resumen, en la misma pantalla o en un modal */
var onClick = function(e){
  var pp = e.target.closest('[data-pp]');
  if (pp) { e.preventDefault(); var a = pp.getAttribute('data-pp').split(':'), k = a[1], cur = postponed(); if (a[0] === 'pp' && cur.indexOf(k) < 0) cur.push(k); if (a[0] === 'pn') cur = cur.filter(function(x){ return x !== k; }); setPostponed(cur); return; }
  var p2 = e.target.closest('[data-pl2]');
  if (p2) { var pn = p2.parentNode.querySelector('.pl2-p'); pn.hidden = !pn.hidden; p2.setAttribute('aria-expanded', String(!pn.hidden)); return; }
  var km = e.target.closest('[data-m]');
  [].forEach.call(root.querySelectorAll('.pv-menu'), function(x){ if (!km || x !== km.parentNode.querySelector('.pv-menu')) x.hidden = true; });
  if (km) { var mm = km.parentNode.querySelector('.pv-menu'); mm.hidden = !mm.hidden; km.setAttribute('aria-expanded', String(!mm.hidden)); return; }
  var hb = e.target.closest('[data-help]');
  if (hb) { var p = hb.closest('.pv-cl').querySelector('.pv-hp'); p.hidden = !p.hidden; hb.setAttribute('aria-expanded', String(!p.hidden)); return; }
  var kb = e.target.closest('[data-menu]');
  [].forEach.call(root.querySelectorAll('.pv-menu'), function(x){ if (!kb || x !== kb.closest('.pv-cr').querySelector('.pv-menu')) x.hidden = true; });
  if (kb) { var mn = kb.closest('.pv-cr').querySelector('.pv-menu'); mn.hidden = !mn.hidden; kb.setAttribute('aria-expanded', String(!mn.hidden)); return; }
  var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
  if (e.target.closest('[data-act="main"]')) { e.preventDefault(); main(); }
};
/* el botón fijo de abajo (móvil) hace lo mismo que el del resumen; en V3 avanza de paso */
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-slot="cta-dock"] button'); if (!b || pv === 'orig') return;
  e.preventDefault(); e.stopPropagation(); main();
}, true);

/* ---------- controles ---------- */
var chips = function(list, cur_, attr){ return list.map(function(x){ return '<button type="button" class="rs-chip' + (x[0] === cur_ ? ' on' : '') + '" data-' + attr + '="' + x[0] + '">' + x[1] + '</button>'; }).join(''); };
var seg = function(html){ var d = document.createElement('div'); d.className = 'rail-switch'; d.innerHTML = html; return d; };
var tcc = seg(chips(CARDS, tc, 'pvc'));
var wire = function(el, attr, set){
  el.addEventListener('click', function(e){
    var b = e.target.closest('[data-' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation();
    set(b.getAttribute('data-' + attr));
    [].forEach.call(el.querySelectorAll('[data-' + attr + ']'), function(c){ c.classList.toggle('on', c === b); });
    if (!isCart) return;   /* en el historial solo cambia el papel (no hay vista que repintar) */
    paint();
  }, true);
};
wire(tcc, 'pvc', function(v){ tc = v; LSset('replica-pay-card', v); });
/* controles de la página «cart» (capa «Controles»; los de order < 10 irían a «Ajustes de la reserva») */
/* Ajuste de la reserva (todas las pantallas): ¿hay comisiones externas? */
var ef = seg('<button type="button" class="rs-chip' + (LSget('replica-ext-fees', '1') !== '0' ? ' on' : '') + '" data-fee="1">Sí</button><button type="button" class="rs-chip' + (LSget('replica-ext-fees', '1') === '0' ? ' on' : '') + '" data-fee="0">No</button>');
ef.addEventListener('click', function(e){
  var b = e.target.closest('[data-fee]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  LSset('replica-ext-fees', b.getAttribute('data-fee'));
  [].forEach.call(ef.querySelectorAll('[data-fee]'), function(c){ c.classList.toggle('on', c === b); });
  window.dispatchEvent(new Event('replica-fee-change'));
}, true);
var pe = seg('<button type="button" class="rs-chip' + (hasPast() ? ' on' : '') + '" data-pe="1">Sí</button><button type="button" class="rs-chip' + (!hasPast() ? ' on' : '') + '" data-pe="0">No</button>');
pe.addEventListener('click', function(e){
  var b = e.target.closest('[data-pe]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  LSset('replica-past-pay', b.getAttribute('data-pe'));
  [].forEach.call(pe.querySelectorAll('[data-pe]'), function(c){ c.classList.toggle('on', c === b); });
  window.dispatchEvent(new Event('replica-past-change'));
}, true);
/* Controles → Pagos pospuestos (qué pagos están aplazados) y Componentes → Pay later (cómo se ve esa sección) */
var PPO = [['', 'Ninguno'], ['taxes', 'Tasas'], ['reservation', 'Reserva'], ['both', 'Tasas + reserva']];
var ppSel = function(){ var a = postponed(); return a.length === 0 ? '' : (a.length > 1 ? 'both' : a[0]); };
var ppc = seg(PPO.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === ppSel() ? ' on' : '') + '" data-ppc="' + o[0] + '">' + o[1] + '</button>'; }).join(''));
ppc.addEventListener('click', function(e){
  var b = e.target.closest('[data-ppc]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  var v = b.getAttribute('data-ppc'); setPostponed(v === '' ? [] : v === 'both' ? ['taxes', 'reservation'] : [v]);
  [].forEach.call(ppc.querySelectorAll('[data-ppc]'), function(c){ c.classList.toggle('on', c === b); });
}, true);
var plc = seg([['1', 'V1 · lista'], ['2', 'V2 · resumen'], ['3', 'V3 · cronología']].map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === plVer() ? ' on' : '') + '" data-plc="' + o[0] + '">' + o[1] + '</button>'; }).join(''));
plc.addEventListener('click', function(e){
  var b = e.target.closest('[data-plc]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  LSset('replica-paylater', b.getAttribute('data-plc'));
  [].forEach.call(plc.querySelectorAll('[data-plc]'), function(c){ c.classList.toggle('on', c === b); });
  window.dispatchEvent(new Event('replica-past-change'));
}, true);
var addFee = function(){ if (window.__repPanel) window.__repPanel.add('Comisiones externas', ef, 2.6); };
/* «Pagos existentes» es un control de la página (order ≥ 10), no un ajuste de la reserva */
var addPast = function(){ if (window.__repPanel) window.__repPanel.add('Pagos existentes', pe, 25); };
var addCtl = function(){ if (isCart && window.__repPanel) { window.__repPanel.add('Pagos pospuestos', ppc, 24);  } };

/* ---------- Página «Order history»: recibos de papel (T8). La pantalla `order-history` de la réplica era una captura de «Edit tourist taxes»; aquí se sustituye su contenido ---------- */
var isHist = S.id === 'order-history';
var pastOrders = function(){
  var hold = LSget('replica-deposit-type', 'hold') !== 'token', fees = LSget('replica-ext-fees', '1') !== '0', o = [];
  o.push({ no: '#1044', date: '14 Oct 2026 · 10:43', dep: true, lines: [['Security deposit', hold ? 'held on your card' : 'authorised, not charged', D.auth, true]], fee: 0, total: hold ? 'Total held' : 'Total authorised', st: hold ? 'ON HOLD' : 'AUTHORISED', note: hold ? 'Released after your stay.' : 'Charged only if the property reports a breach of its rules.' });
  if (fees) o.push({ no: '#1043', date: '14 Oct 2026 · 10:43', lines: [['Deposit service fee', 'for the ' + money2(D.auth) + (hold ? ' hold' : ' authorisation'), D.fee]], fee: 0, total: 'Total paid', st: 'PAID' });
  o.push({ no: '#1042', date: '14 Oct 2026 · 10:42', lines: [['Tourist taxes', '2 guests · 0 exemptions', 12]], fee: fees ? 0.5 : 0, feeLbl: 'Service fee', total: 'Total paid', st: 'PAID' });
  o.push({ no: '#1041', date: '14 Oct 2026 · 10:40', lines: [['Reservation payment', 'Due before check-in', 12]], fee: fees ? 0.5 : 0, feeLbl: 'Service fee', total: 'Total paid', st: 'PAID' });
  return o;
};
var releaseDate = function(){ var r = parseInt(LSget('replica-dep-release', '7'), 10) || 7, d = new Date(2026, 10, 27 + r); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; };
/* recibos en estilo «ticket» (los mismos de «Después de pagar → P2 · Tickets», definidos en checkout.css): el cobro con borde dentado y sello PAID; la retención / autorización, aparte, con marco discontinuo y su propio sello */
var receiptsHtml = function(orders){
  var hold = LSget('replica-deposit-type', 'hold') !== 'token';
  return '<div class="tk-wrap">' + orders.map(function(o){
    var sum = o.lines.reduce(function(s, l){ return s + l[2]; }, 0) + o.fee, st = o.st === 'ON HOLD' ? 'HELD' : o.st;
    var note = o.dep ? (hold ? 'Your bank shows it as pending. Released on ' + releaseDate() + '.' : o.note) : '';
    return '<article class="tk ' + (o.fresh && !window.__freshDone ? '' : 'tk-still ') + (o.dep ? 'tk-hold' : 'tk-paid') + '" aria-label="Order ' + o.no + '"><header><b>Villa Calipso</b><span class="tk-no">Order ' + o.no + '</span><small>' + (o.dep ? (hold ? 'Hold receipt' : 'Authorisation receipt') : 'Payment receipt') + ' · ' + o.date + '</small></header>'
      + '<ul class="tk-l">' + o.lines.map(function(l){ return '<li><span>' + l[0] + '<small>' + l[1] + '</small></span><i aria-hidden="true"></i><em>' + es2(l[2]) + '</em></li>'; }).join('') + (o.fee ? '<li><span>' + o.feeLbl + '</span><i aria-hidden="true"></i><em>' + es2(o.fee) + '</em></li>' : '') + '</ul>'
      + '<div class="tk-t"><span>' + o.total + '</span><b>' + money2(sum) + '</b></div>'
      + '<p class="tk-m">Visa \u2022\u2022\u2022\u2022 4242' + (o.dep ? ' \u00b7 Not a charge' : ' \u00b7 final') + (note ? '<br>' + note : '') + '</p><div class="tk-st' + (st.length > 8 ? ' tk-st-s' : '') + '">' + st + '</div></article>';
  }).join('') + '</div>';
};
/* al llegar desde el pago (?from=pay[&dep=1][&pend=12.00]) se enseñan arriba los recibos recién generados (#1045 el cobro, #1046 la retención), reconstruidos del pedido
   que dejó el carrito (replica-order, solo lectura): pagar no guarda nada, así que no están en el historial de verdad */
var FROMPAY = Q.get('from') === 'pay';
var freshOrders = function(){
  if (!FROMPAY) return [];
  var O; try { O = JSON.parse(localStorage.getItem('replica-order') || 'null'); } catch (e) { O = null; } if (!O || typeof O.now !== 'number') return [];
  var dep = Q.get('dep') === '1', items = dep ? [] : (O.items || []), hold = O.hold !== false, d = new Date(), p2 = function(n){ return (n < 10 ? '0' : '') + n; };
  var date = d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear() + ' \u00b7 ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  var lines = items.map(function(i){ return [i.t, i.s, i.val]; }), fee = items.reduce(function(a, i){ return a + (i.fee || 0); }, 0);
  if (O.dep && O.depFee) lines.push(['Deposit service fee', 'for the ' + money2(O.auth) + (hold ? ' hold' : ' authorisation'), O.depFee]);
  var out = [];
  if (O.dep) out.push({ no: lines.length ? '#1046' : '#1045', date: date, dep: true, lines: [['Security deposit', hold ? 'held on your card' : 'authorised, not charged', O.auth, true]], fee: 0, total: hold ? 'Total held' : 'Total authorised', st: hold ? 'ON HOLD' : 'AUTHORISED', note: hold ? 'Released after your stay.' : 'Charged only if the property reports a breach of its rules.', fresh: true });
  if (lines.length) out.push({ no: '#1045', date: date, lines: lines, fee: fee, feeLbl: 'Service fee', total: 'Total paid', st: 'PAID', fresh: true });
  return out;
};
var histDock = function(){   /* desde Payments: «Go to home» y, debajo, qué falta por pagar, cuánto y cuándo vence */
  var pend = parseFloat(Q.get('pend') || '0') || 0, msg = '';
  if (pend > 0) {
    var O; try { O = JSON.parse(localStorage.getItem('replica-order') || 'null'); } catch (e) { O = null; }
    var late = (O && O.late || []).map(function(x){ return { t: x.t, v: (x.val || 0) + (x.fee || 0), due: String(x.due || '').replace(/^Due/, 'due') }; });
    if (late.length === 1) msg = 'You still have to pay <b>' + money2(pend) + '</b> for ' + late[0].t + (late[0].due ? ' (' + late[0].due + ')' : '') + '. You\u2019ll find it in Payments.';
    else if (late.length > 1) msg = 'You still have to pay <b>' + money2(pend) + '</b>: ' + late.map(function(x){ return x.t + ' ' + money2(x.v); }).join(' and ') + '. You\u2019ll find them in Payments.';
    else msg = 'You still have <b>' + money2(pend) + '</b> to pay. You\u2019ll find it in Payments.';
  }
  return '<div class="pv-hdk ck-form"><button type="button" class="ck-go" data-hgo="home">Go to home</button>' + (msg ? '<p>' + msg + '</p>' : '') + '</div>';
};
document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-hgo]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); go(b.getAttribute('data-hgo')); }, true);
var histRender = function(){
  var cont = document.querySelector('h1') && document.querySelector('h1').closest('[class*="max-w-[640px]"]'); if (!cont) return;
  var orders = freshOrders().concat(hasPast() ? pastOrders() : []);
  var html = receiptsHtml(orders) + (FROMPAY ? histDock() : '');
  if (!orders.length) html = '<div class="rc-empty"><b>No payments yet</b><span>Your receipts will appear here as soon as you pay or authorise something.</span></div>';
  var wrap = document.getElementById('pv-hist');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'pv-hist'; var kids = cont.children; kids[kids.length - 1].parentNode.replaceChild(wrap, kids[kids.length - 1]); }
  wrap.innerHTML = html; wrap.classList.toggle('has-hdk', FROMPAY); if (FROMPAY && !window.__freshDone) setTimeout(function(){ window.__freshDone = true; }, 2600);
  document.documentElement.setAttribute('data-pvh', '1');
};
var histTitles = function(){
  var as = document.querySelector('aside'); if (as) { var ip = as.querySelector(':scope > p'); if (ip) ip.textContent = 'Here is everything you\u2019ve paid for this stay, one receipt per payment.'; [].forEach.call(as.querySelectorAll(':scope > section'), function(s){ s.parentNode.removeChild(s); }); }   /* Vela: fuera los consejos de «Edit tourist taxes» */
  var h1 = document.querySelector('h1'); if (h1 && !/receipts/.test(h1.textContent)) h1.innerHTML = 'Your <span class="text-[var(--chekin-color-brand-blue)]">receipts</span>';
  var p = h1 && h1.closest('header') && h1.closest('header').querySelector('p'); if (p) p.textContent = 'Every payment and hold on this stay.';
  [].forEach.call(document.querySelectorAll('span.uppercase, header span.truncate'), function(e){ if (/^(Tourist Taxes|Edit Tourist taxes)$/i.test(e.textContent.trim())) e.textContent = e.classList.contains('truncate') ? 'Order history' : 'Order history'; });
};
var histStart = function(){ histRender(); histTitles(); var n = 0, t = setInterval(function(){ histTitles(); if (!document.getElementById('pv-hist')) histRender(); if (++n > 12) clearInterval(t); }, 700);
  ['replica-pay-change', 'replica-dep-change', 'replica-fee-change', 'replica-past-change'].forEach(function(ev){ window.addEventListener(ev, histRender); }); };
/* ---------- Aviso flotante «↓ N more payments» (igual que «↓ 1 more guest» del resumen): aparece cuando queda algún item por debajo del borde visible ---------- */
var scEl = null, scBoxEl = null, scRaf = 0;
var scBox = function(){ var p = document.querySelector('.pv7-wrap'); p = p && p.parentElement; while (p && p !== document.body && p !== document.documentElement) { var o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 4) return p; p = p.parentElement; } return null; };
var scUpdate = function(){
  scRaf = 0; if (!scEl) return;
  var box = scBox();
  if (box !== scBoxEl) { if (scBoxEl) scBoxEl.removeEventListener('scroll', scQueue); scBoxEl = box; if (box) box.addEventListener('scroll', scQueue, { passive: true }); }
  var rect = box ? box.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
  var left = box ? box.scrollHeight - (box.scrollTop + box.clientHeight) : document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
  var n = [].filter.call(document.querySelectorAll('.pv7-c'), function(r){ return r.offsetParent !== null && r.getBoundingClientRect().top > rect.bottom - 8; }).length;
  var open = !!document.querySelector('.pv-menu:not([hidden])'), show = n > 0 && left > 24 && !open;
  var wr = document.querySelector('.pv7-wrap'), col = wr && wr.getBoundingClientRect();
  if (window.innerWidth >= 1024 && col) { scEl.style.left = Math.round(col.left) + 'px'; scEl.style.right = Math.round(window.innerWidth - col.right) + 'px'; } else { scEl.style.left = scEl.style.right = ''; }
  scEl.style.bottom = box ? Math.round(window.innerHeight - rect.bottom + 18) + 'px' : '';
  var t = scEl.querySelector('span'); if (t) t.textContent = n + (n === 1 ? ' more payment' : ' more payments');
  scEl.classList.toggle('on', show); scEl.setAttribute('aria-hidden', show ? 'false' : 'true'); scEl.querySelector('button').tabIndex = show ? 0 : -1;
};
var scQueue = function(){ if (!scRaf) scRaf = requestAnimationFrame(scUpdate); };
var scInit = function(){
  if (scEl) return;
  scEl = document.createElement('div'); scEl.className = 'pv-sc'; scEl.setAttribute('aria-hidden', 'true');
  scEl.innerHTML = '<button type="button" aria-label="Scroll down to see more payments">' + ic('down') + '<span></span></button>';
  document.body.appendChild(scEl);
  scEl.addEventListener('click', function(e){ if (!e.target.closest('button')) return; e.preventDefault(); e.stopPropagation(); var b = scBox(), rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (b) b.scrollBy({ top: Math.round(b.clientHeight * 0.8), behavior: rm ? 'auto' : 'smooth' }); else window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: rm ? 'auto' : 'smooth' }); }, true);
  window.addEventListener('scroll', scQueue, { passive: true }); window.addEventListener('resize', scQueue);
  document.addEventListener('click', function(){ setTimeout(scQueue, 60); }, true);
  setInterval(scQueue, 400); scQueue();
};
var start = function(){ if (isHist) { histStart(); addFee(); addPast(); return; } paint(); addCtl(); addFee(); if (isCart) { addPast(); scInit(); } setInterval(function(){ if (pv === '7') velaSection(); retitle(); }, 700); ['replica-pay-change', 'replica-dep-change', 'replica-fee-change', 'replica-past-change'].forEach(function(ev){ window.addEventListener(ev, function(){ if (pv === '7') paint(); }); }); };
if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
