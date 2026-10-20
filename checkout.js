/* Flujo de pago. Desde el CTA del carrito «Pay X€ and hold» se abre la V8 «Tarjeta viva» (la única entrada de pago, #838):
   una pantalla completa en móvil / un diálogo en escritorio con la tarjeta dibujada y el formulario. Lo que pasa DESPUÉS de pagar ocurre en la misma V8 (#841, #842):
   el formulario se pliega y la tarjeta es el escenario de «P1 · V2 Libro mejorado»: barra de progreso, línea de tiempo con el estado vivo de cada operación y su número de orden,
   3D Secure como primer paso con cuenta atrás, y un resultado que dice qué viene después. (V1 y V3 se quitaron en #842: backup en backups/20261019-112050.)
   – La lógica es una sola: mismos importes (replica-order, solo lectura), mismos resultados (replica-ck-result), mismo 3D Secure (replica-ck-3ds).
   – Pagar NO guarda nada: al recargar o volver a Payments todo está como antes. El reintento solo del depósito viaja en la URL (?dep=1), no en el almacenamiento.
   – La retención/autorización es SIEMPRE una operación aparte del cobro (memoria hold-auth-independent-from-charge): se procesa, se muestra y puede fallar por separado.
   – pay-card-sheet ya no pinta nada: reenvía al carrito (?run=card|apple|google empieza en «procesando», ?view=… enseña un paso). */
(function(){
var S = window.__SCREEN || {};
if (S.id !== 'pay-card-sheet' && S.id !== 'cart') return;
var ON_PAY = S.id === 'pay-card-sheet', Q = new URLSearchParams(location.search);
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
var after = function(){ return '3'; };   /* única versión: «Cajitas con rayas» (#861); el modal lleva data-v="3" para los estilos */
var J = function(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v === null ? d : v; } catch (e) { return d; } };
var W = (location.pathname.match(/\.([md])\.html/) || [])[1] || 'm', EMBED = /[?&]embed=1/.test(location.search);
var url = function(id, extra){ var q = (extra || '') + (EMBED ? (extra ? '&' : '') + 'embed=1' : ''); return id + '.' + W + '.html' + (q ? '?' + q : ''); };
var go = function(id){ location.href = url(id); };
if (ON_PAY) { var qs = location.search; if (!/[?&](run|view)=/.test(qs)) qs += (qs ? '&' : '?') + 'view=ok'; location.replace('cart.' + W + '.html' + qs); return; }   /* el pago vive en el carrito */
var es2 = function(n){ var p = (Math.round(n * 100) / 100).toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1]; };   /* formato es-ES: coma decimal y punto de millares */
var money = function(n){ return es2(n) + '€'; };
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); var keep = onPick(b.getAttribute(attr)); if (keep !== false) [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(x){ x.classList.toggle('on', x === b); }); }, true); return d; };
var whenPanel = function(fn){ var n = 0, t = setInterval(function(){ if (window.__repPanel) { clearInterval(t); fn(); } else if (++n > 40) clearInterval(t); }, 150); };
var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- pedido ---------- */
var DEF = { now: 10.25, hold: true, dep: true, auth: 230, depFee: 3.75, rel: 7, items: [{ k: 'tax', t: 'Tourist taxes', s: '1 of 4 guests · 3 already paid', val: 6, fee: 0.5 }], late: [] };
var O = J('replica-order', DEF); if (!O || typeof O.now !== 'number') O = DEF;
var order = function(){ var o = J('replica-order', DEF); return o && typeof o.now === 'number' ? o : DEF; };
var payable = function(o){ return o.now > 0 || o.dep; };
var relTxt = function(o){ return o.rel + (o.rel === 1 ? ' day' : ' days') + ' after check-out'; };
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var relDate = function(o){ var d = new Date(2026, 10, 27 + (o.rel || 7)); return d.getDate() + ' ' + MON[d.getMonth()]; };   /* el check-out de la réplica es el 27 Nov (pay-views.js); la retención se libera «rel» días después */
var charges = function(o){ return o.items.map(function(i){ return { t: i.t, s: i.s, v: i.val + (i.fee || 0), fee: i.fee || 0 }; }).concat(o.dep && o.depFee ? [{ t: 'Deposit service fee', s: 'For the ' + money(o.auth) + (o.hold ? ' hold' : ' authorisation'), v: o.depFee, fee: 0, df: true }] : []); };
var payLbl = function(o){ return o.now > 0 ? 'Pay ' + money(o.now) + (o.dep ? (o.hold ? ' and hold' : ' and authorise') : '') : (o.dep ? (o.hold ? 'Hold ' : 'Authorise ') + money(o.auth) : 'Confirm'); };
var depOnly = function(o){ return { now: o.depFee || 0, hold: o.hold, dep: true, auth: o.auth, depFee: o.depFee, rel: o.rel, items: [], late: o.late }; };
var DEP = Q.get('dep') === '1';   /* reintento solo del depósito (tras «cobro OK, depósito rechazado»): viaja en la URL, no se guarda */

var I = {
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  chk: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', right: '<path d="m9 18 6-6-6-6"/>', alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>', rcpt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2z"/><path d="M8 9h8M8 13h6"/>',
  spark: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
  down: '<path d="m6 9 6 6 6-6"/>', mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>', hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v3M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/><path d="M17 14h4"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>'; };

/* ---------- estado ---------- */
var st = { step: 'proc', o: DEP ? depOnly(O) : O, retry: DEP, method: '', last4: '', cardNum: '', reason: '', pi: 0, ask: 0, faq: 0, secs: 300, expired: false, code: false, pay: false, shown: {}, seen: {}, rcpt: 0 };
var cfgRes = function(){ var v = LSget('replica-ck-result', 'ok'); return /^(ok|declined|funds|hold)$/.test(v) ? v : 'ok'; };
var cfg3ds = function(){ return LSget('replica-ck-3ds', '1') === '1'; };
var stamp = function(){ var d = new Date(), p = function(n){ return (n < 10 ? '0' : '') + n; }; return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
var methodTxt = function(){ return st.method === 'apple' ? 'Apple Pay' : st.method === 'google' ? 'Google Pay' : (brand(st.cardNum || '4242') || 'Card') + ' •••• ' + (st.last4 || '4242'); };

/* ---------- tarjeta: formato y validación ---------- */
var digits = function(v){ return String(v || '').replace(/\D/g, ''); };
var brand = function(n){ n = digits(n); return /^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : ''; };
var luhn = function(n){ var s = 0, alt = false; for (var i = n.length - 1; i >= 0; i--) { var d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; };
var fmtNum = function(v){ var n = digits(v).slice(0, brand(v) === 'Amex' ? 15 : 16); return brand(n) === 'Amex' ? n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, function(m, a, b, c){ return [a, b, c].filter(Boolean).join(' '); }) : n.replace(/(\d{4})(?=\d)/g, '$1 '); };
var fmtExp = function(v){ var n = digits(v).slice(0, 4); if (n.length === 1 && +n > 1) n = '0' + n; return n.length > 2 ? n.slice(0, 2) + ' / ' + n.slice(2) : n; };
var check = function(){
  var f = function(id){ var el = document.getElementById(id); return el ? el.value : ''; }, n = digits(f('ck-num')), e = digits(f('ck-exp')), c = digits(f('ck-cvc')), err = {};
  if (!n) err.num = 'Enter your card number'; else if (n.length < (brand(n) === 'Amex' ? 15 : 16) || !luhn(n)) err.num = 'Check the card number';
  var mm = +e.slice(0, 2), yy = +e.slice(2, 4);
  if (e.length < 4) err.exp = 'Enter the expiry date'; else if (mm < 1 || mm > 12 || (2000 + yy) * 12 + mm < 2026 * 12 + 10) err.exp = mm < 1 || mm > 12 ? 'Check the month' : 'This card has expired';
  if (!c) err.cvc = 'Enter the CVC'; else if (c.length < (brand(n) === 'Amex' ? 4 : 3)) err.cvc = 'Check the CVC';
  return { err: err, n: n };
};
var paintErr = function(err){ ['num', 'exp', 'cvc'].forEach(function(k){ var w = document.querySelector('[data-f="' + k + '"]'); if (!w) return; w.classList.toggle('bad', !!err[k]); var m = w.querySelector('.ck-er'); if (m) m.textContent = err[k] || ''; var inp = w.querySelector('input'); if (inp) inp.setAttribute('aria-invalid', !!err[k]); }); };
var brandPaint = function(){ var el = document.getElementById('ck-num'), b = document.querySelector('.ck-brand'); if (!el || !b) return; var br = brand(el.value); b.textContent = br === 'Mastercard' ? 'MC' : br.toUpperCase(); b.className = 'ck-brand' + (br ? ' on' : ''); };

/* ---------- formulario (V8) ---------- */
var field = function(k, label, id, ph, mode, ac){ return '<div class="ck-f" data-f="' + k + '"><label for="' + id + '">' + label + '</label><div class="ck-in"><input id="' + id + '" type="text" inputmode="' + mode + '" autocomplete="' + ac + '" placeholder="' + ph + '" spellcheck="false" aria-describedby="' + id + '-e">' + (k === 'num' ? '<i class="ck-brand" aria-hidden="true"></i>' : '') + '</div><span class="ck-er" id="' + id + '-e" role="alert"></span></div>'; };
var payForm = function(o){ return ''
    + '<div class="ck-wal"><button type="button" class="ck-w" data-ck="wallet" data-v="apple" aria-label="Pay with Apple Pay">Apple Pay</button><button type="button" class="ck-w" data-ck="wallet" data-v="google" aria-label="Pay with Google Pay">Google Pay</button></div><div class="ck-or"><span>or pay with card</span></div>'
    + '<div class="ck-fs">' + field('num', 'Card number', 'ck-num', '1234 1234 1234 1234', 'numeric', 'cc-number') + '<div class="ck-r2">' + field('exp', 'Expiry date', 'ck-exp', 'MM / YY', 'numeric', 'cc-exp') + field('cvc', 'CVC', 'ck-cvc', '123', 'numeric', 'cc-csc') + '</div></div>'
    + (o.dep ? '<p class="ck-pn' + (o.hold ? ' ck-pn--hold' : '') + '">' + ic('card', 15) + '<span>' + (o.hold ? 'The same card is used for the ' + money(o.auth) + ' hold, in a separate operation.' : 'Your card is saved for the deposit. Nothing is blocked.') + '</span></p>' : '');
};
var SECURE = 'Secured by Stripe with 3D Secure. Your card details never touch our servers.';

/* ---------- operaciones: cobro y retención, siempre por separado ---------- */
var ops = function(o){ var a = []; if (o.now > 0) a.push('pay'); if (o.dep) a.push('dep'); return a; };
var opSt = function(k){   /* wait | on | done | fail | void */
  var idx = ops(st.o).indexOf(k);
  if (st.step === 'ok') return 'done';
  if (st.step === 'part') return k === 'dep' ? 'fail' : 'done';
  if (st.step === 'fail') return st.reason === 'hold' && k === 'dep' ? 'fail' : 'void';
  return idx < st.pi ? 'done' : idx === st.pi ? 'on' : 'wait';
};
var payAmt = function(){ return st.step === 'part' ? paidTot(true) : st.o.now; };   /* en «cobro OK, depósito rechazado» la comisión del depósito no se cobra */
var opTxt = function(k, s){ var o = st.o;
  if (k === 'pay') return { wait: 'Charge ' + money(payAmt()), on: 'Charging ' + money(payAmt()), done: 'Charged ' + money(payAmt()), void: 'Not charged', fail: 'Charge failed' }[s];
  var h = o.hold ? 'Held' : 'Authorised';
  return { wait: (o.hold ? 'Hold ' : 'Authorise ') + money(o.auth), on: (o.hold ? 'Holding ' : 'Authorising ') + money(o.auth), done: h + ' ' + money(o.auth), void: 'Not ' + h.toLowerCase(), fail: (o.hold ? 'Hold' : 'Authorisation') + ' declined' }[s]; };
var opSub = function(k, s){ var o = st.o;
  if (k === 'pay') return { wait: 'Taken now, final', on: 'Taken now, final', done: methodTxt() + ' · final', void: 'Nothing was charged', fail: 'Nothing was charged' }[s];
  return { wait: 'Not a charge', on: 'Not a charge', done: o.hold ? 'Not a charge · released ' + relDate(o) : 'Not a charge · nothing is blocked', void: 'Nothing was ' + (o.hold ? 'held' : 'authorised'), fail: 'Your bank declined it' }[s]; };
var opIcon = function(s){ return s === 'wait' ? ic('clock', 13) : s === 'done' ? ic('chk', 14) : s === 'fail' ? ic('alert', 14) : s === 'void' ? ic('x', 14) : ''; };
var REASONS = {
  declined: ['Your bank declined the card', 'It didn’t say why. Try another card or a wallet, or contact your bank.'],
  funds: ['Not enough funds on this card', function(o){ return 'This payment needs ' + money(o.now + (o.dep && o.hold ? o.auth : 0)) + ' available' + (o.dep && o.hold ? ': ' + money(o.now) + ' to pay and ' + money(o.auth) + ' to hold' : '') + '. Try another card or a wallet.'; }],
  hold: ['Your bank declined the deposit', function(o){ return 'It couldn’t ' + (o.hold ? 'hold ' : 'authorise ') + money(o.auth) + ' on this card. Debit and prepaid cards often can’t. A credit card usually works.'; }],
  sca: ['You didn’t confirm the payment', 'Your bank needs you to approve it in your banking app. Try again and approve the request.']
};
var why = function(){ var r = REASONS[st.reason] || REASONS.declined; return { t: r[0], d: typeof r[1] === 'function' ? r[1](st.o) : r[1] }; };
var tkLines = function(paidOnly){ return charges(st.o).filter(function(c){ return !(paidOnly && c.df); }); };
var paidTot = function(paidOnly){ return tkLines(paidOnly).reduce(function(a, c){ return a + c.v; }, 0); };
var pendList = function(){ var l = (st.o.late || []).map(function(x){ return { t: x.t, v: x.val + (x.fee || 0), due: x.due || 'Due before check-in' }; }); if (st.step === 'part') l.unshift({ t: 'Security deposit', v: st.o.auth, due: 'Due before check-in', dep: true }); return l; };
var titles = function(){   /* título y subtítulo de cada paso, comunes a todas las versiones */
  var o = st.o, pend = pendList().length, w = why();
  if (st.step === 'proc') return st.pi === -1 ? ['Confirm it’s you', 'Your bank sent a request to your banking app. Approve the payment of ' + money(o.now > 0 ? o.now : o.auth) + ' to Villa Calipso.'] : ['Processing your payment', 'Each operation is done on its own. This takes a few seconds.'];
  if (st.step === 'ok') return [pend ? 'Payment complete' : 'You’re all set', (o.dep && o.now > 0 ? 'Two separate operations, both done.' : 'Everything is done.') + (pend ? ' You still have something to pay before your stay.' : '')];
  if (st.step === 'fail') return ['Payment didn’t go through', w.t + '. ' + w.d];
  return ['Paid, but the deposit is still pending', 'Your payment went through. Your bank declined the ' + money(o.auth) + ' ' + (o.hold ? 'hold' : 'authorisation') + ', so the deposit isn’t done yet. ' + (o.depFee ? 'Its ' + money(o.depFee) + ' fee wasn’t charged.' : '')];
};
var btn = function(a, v, label, cls){ return '<button type="button" class="' + cls + '" data-ck="' + a + '" data-v="' + (v || '') + '">' + label + '</button>'; };

/* ---------- pago (una sola lógica para las cuatro versiones) ---------- */
var timer = null, wait = function(ms, fn){ clearTimeout(timer); timer = setTimeout(fn, ms); };
var startPay = function(){
  st.step = 'proc'; st.pi = 0; render();
  var o = st.o, res = st.retry && cfgRes() === 'hold' ? 'ok' : cfgRes(), nCh = o.now > 0 ? 1 : 0, T = RM ? 500 : 1100;
  var after3ds = function(){
    if (res === 'declined' || res === 'funds') { wait(T, function(){ fail(res); }); return; }
    wait(T, function(){ st.pi = nCh; render();          /* cobro hecho (si lo hay); ahora la retención, aparte */
      if (!o.dep) { wait(T * .5, done); return; }
      wait(T, function(){ if (res === 'hold' && o.items.length) { part(); return; } if (res === 'hold') { fail('hold'); return; } st.pi = nCh + 1; render(); wait(T * .5, done); }); });
  };
  if (cfg3ds() && st.method === 'card') wait(T * .8, function(){ bankStart(); st.after = after3ds; });
  else after3ds();
};
var bankStart = function(){ st.pi = -1; st.secs = 300; st.expired = false; st.resent = false; render('[data-ck="sca-ok"]'); };
var goReceipts = function(){   /* directo a Order history, con los recibos recién generados arriba */
  var pend = pendList().reduce(function(a, x){ return a + x.v; }, 0);
  location.href = url('order-history', 'from=pay' + (st.retry ? '&dep=1' : '') + (pend > 0 ? '&pend=' + pend.toFixed(2) : ''));
};
var done = function(){   /* todo hecho: «Generating your receipts» como un paso más y, al momento, Order history */
  st.step = 'ok'; st.rcpt = 1; render();
  wait(RM ? 900 : 2100, function(){ if (!document.querySelector('.ck-live') || st.step !== 'ok') return; goReceipts(); });
};
var fail = function(r){ st.reason = r; st.step = 'fail'; render(); };
var part = function(){ st.step = 'part'; render(); };
var approve = function(){ st.pi = 0; render(); var f = st.after; st.after = null; if (f) f(); };
var cancel3ds = function(){ clearTimeout(timer); fail('sca'); };

/* ---------- eventos comunes ---------- */
document.addEventListener('input', function(e){ var t = e.target; if (!t || !t.id || !/^ck-(num|exp|cvc)$/.test(t.id)) return;
  var v = t.value; t.value = t.id === 'ck-num' ? fmtNum(v) : t.id === 'ck-exp' ? fmtExp(v) : digits(v).slice(0, 4);
  if (t.id === 'ck-num') brandPaint();
  var w = t.closest('.ck-f'); if (w && w.classList.contains('bad')) { var r = check().err, k = w.getAttribute('data-f'); if (!r[k]) { w.classList.remove('bad'); w.querySelector('.ck-er').textContent = ''; t.removeAttribute('aria-invalid'); } }
  if (t.id === 'ck-num' && digits(t.value).length === (brand(t.value) === 'Amex' ? 15 : 16)) { var x = document.getElementById('ck-exp'); if (x && !x.value) x.focus(); }
  if (t.id === 'ck-exp' && digits(t.value).length === 4) { var y = document.getElementById('ck-cvc'); if (y && !y.value) y.focus(); }
}, true);

/* ===================== controles de página y «Ver paso» ===================== */
var preview = function(step){   /* enseña un paso sin pagar; no guarda nada */
  clearTimeout(timer); var o = curOrder();
  st.preview = true; st.o = o; st.retry = depState; st.rcpt = 0; st.seen = {}; st.prog = null; st.viaBank = false; st.method = st.method || 'card'; st.last4 = st.last4 || '4242'; st.cardNum = st.cardNum || '4242';
  if (step === 'bank') { st.step = 'proc'; st.pi = -1; st.secs = 300; st.expired = false; st.resent = false; st.after = function(){ fail('sca'); }; }
  else if (step === 'proc') { st.step = 'proc'; st.pi = o.now > 0 ? 1 : 0; } else if (step === 'ok') { st.step = 'ok'; st.rcpt = 1; wait(RM ? 900 : 2100, function(){ if (!document.querySelector('.ck-live') || st.step !== 'ok') return; goReceipts(); }); }
  else if (step === 'fail') { st.step = 'fail'; st.reason = cfgRes() === 'funds' ? 'funds' : 'declined'; } else if (step === 'part') { st.step = o.dep && o.items.length ? 'part' : 'fail'; st.reason = 'hold'; }
  sampleCard(); render(); };
var fillCard = function(){ var F = { 'ck-num': '4242 4242 4242 4242', 'ck-exp': '12 / 28', 'ck-cvc': '123' }; Object.keys(F).forEach(function(id){ var el = document.getElementById(id); if (el) el.value = F[id]; }); paintErr({}); brandPaint(); if (typeof paint8 === 'function') paint8(); };
var sampleCard = function(){ if (!document.querySelector('.ck-live')) openLive(); var n = document.getElementById('ck-num'); if (n && !n.value) fillCard(); };
whenPanel(function(){
  window.__repPanel.add('Resultado del pago', seg([['ok', 'Se paga bien'], ['declined', 'Tarjeta rechazada'], ['funds', 'Sin fondos'], ['hold', 'Cobro OK, depósito rechazado']], cfgRes(), 'data-ckr', function(v){ LSset('replica-ck-result', v); }), 26);
  window.__repPanel.add('El banco pide confirmar (3D Secure)', seg([['1', 'Sí'], ['0', 'No']], cfg3ds() ? '1' : '0', 'data-ck3', function(v){ LSset('replica-ck-3ds', v); }), 26.1);
  window.__repPanel.add('Ver paso (sin pagar)', seg([['bank', 'Confirmar en el banco'], ['proc', 'Procesando'], ['ok', 'Pagado'], ['fail', 'Fallido'], ['part', 'Depósito pendiente']], '', 'data-ckp', function(v){ preview(v); return false; }), 26.2);
  window.__repPanel.add('Tarjeta de prueba', seg([['fill', 'Rellenar 4242 4242 4242 4242']], '', 'data-ckf', function(){
    if (!document.querySelector('.ck-live') || st.pay) openLive();
    fillCard(); return false; }), 26.3);
});

/* ===================== Carrito: V8 · tarjeta viva, y lo que pasa después en la misma V8 ===================== */
var depState = DEP;
var curOrder = function(){ var o = order(); return depState ? depOnly(o) : o; };
var ORD = function(k){ return k === 'dep' && st.o.now <= 0 ? '#1045' : k === 'dep' ? '#1046' : '#1045'; };   /* números de orden de lo que se acaba de pagar: el cobro y la retención, cada uno con el suyo (siguen a #1044 del historial) */
var keepVals = {};
var keepNow = function(){ ['ck-num', 'ck-exp', 'ck-cvc'].forEach(function(id){ var el = document.getElementById(id); if (el) keepVals[id] = el.value; }); };
document.addEventListener('input', function(e){ var t = e.target; if (t && /^ck-(num|exp|cvc)$/.test(t.id || '')) keepVals[t.id] = t.value; }, false);
var restoreVals = function(){ Object.keys(keepVals).forEach(function(id){ var el = document.getElementById(id); if (el) el.value = keepVals[id]; }); brandPaint(); };
var noteHtml = function(kind){ return '<div class="ck-fn" role="status">' + ic('alert', 16) + '<span>' + (kind === 'retry' ? 'Your last try didn’t go through. Nothing was charged. Check your card and try again.' : 'Add another card or use a wallet.') + '</span></div>'; };
var depInfo = function(){ return depState ? '<div class="ck-fi" role="status">' + ic('shield', 16) + '<span>Your other payments are done. Only the ' + money(order().auth) + ' deposit is left.</span></div>' : ''; };
var begin = function(m, n){   /* el pago sigue dentro de la misma V8 */
  keepNow(); st.method = m; st.last4 = n ? n.slice(-4) : ''; st.cardNum = n || ''; st.o = curOrder(); st.retry = depState; st.preview = false; st.reason = ''; st.seen = {}; st.viaBank = false; st.prog = null; st.rcpt = 0;
  startPay();
};
var submit = function(){   /* valida la tarjeta de la V8 y sigue al pago */
  var r = check(); paintErr(r.err);
  var k = ['num', 'exp', 'cvc'].filter(function(x){ return r.err[x]; })[0];
  if (k) { var el = document.getElementById('ck-' + k); if (el) { el.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); try { el.focus({ preventScroll: true }); } catch (e) {} } return; }
  begin('card', r.n);
};

/* V8 · tarjeta viva: pantalla completa (móvil) / diálogo de ~860 px (escritorio). A un lado, la tarjeta dibujada que se rellena mientras se escribe, con lo que se cobra y lo que se retiene por separado;
   al otro, el formulario y un pie fijo con el botón. Al pagar, el formulario se pliega y entra la zona .ck-pz (V1 · V2 · V3 según «Después de pagar») */
var lastFocus = null;
var cardFace = function(){ return '<div class="ck-cd8" id="ck-cd8" aria-hidden="true"><div class="ck-cdi">'
  + '<div class="ck-cf ck-cff"><div class="ck-cr"><i class="ck-chip8"></i><span class="ck-cb8" id="ck-cb8">CARD</span></div><div class="ck-cn8" id="ck-cn8">•••• •••• •••• ••••</div><div class="ck-cm8"><small>Valid thru</small><b id="ck-ce8">MM/YY</b></div></div>'
  + '<div class="ck-cf ck-cfb"><i class="ck-mag"></i><div class="ck-sg"><small>CVC</small><b id="ck-cv8">–––</b></div></div></div><div class="ck-cst" id="ck-cst"></div></div>'; };
var paint8 = function(){
  var cd = document.getElementById('ck-cd8'); if (!cd) return;
  var g = function(id){ var el = document.getElementById(id); return el ? el.value : ''; }, d = digits(g('ck-num')), br = brand(d), am = br === 'Amex', i = 0;
  document.getElementById('ck-cn8').textContent = (am ? '#### ###### #####' : '#### #### #### ####').replace(/#/g, function(){ return i < d.length ? d[i++] : '•'; });
  var e = digits(g('ck-exp')), mm = e.slice(0, 2), yy = e.slice(2, 4);
  document.getElementById('ck-ce8').textContent = mm + 'MM'.slice(mm.length) + '/' + yy + 'YY'.slice(yy.length);
  var c = digits(g('ck-cvc')), cv = ''; for (var k = 0; k < (am ? 4 : 3); k++) cv += k < c.length ? '•' : '–';
  document.getElementById('ck-cv8').textContent = cv;
  var b = document.getElementById('ck-cb8'); b.textContent = br === 'Mastercard' ? 'MC' : br ? br.toUpperCase() : 'CARD'; b.className = 'ck-cb8' + (br ? ' on' : '');
  cd.setAttribute('data-br', br.toLowerCase());
};
['input', 'change', 'focusin', 'focusout'].forEach(function(t){ document.addEventListener(t, function(e){
  var cd = document.getElementById('ck-cd8'); if (!cd) return; paint8();
  if (t === 'focusin' || t === 'focusout') { var id = t === 'focusin' && e.target ? e.target.id : ''; var on = /^ck-(num|exp|cvc)$/.test(id);
    if (on) cd.setAttribute('data-fo', id.slice(3)); else cd.removeAttribute('data-fo'); cd.classList.toggle('flip', id === 'ck-cvc'); }
}, false); });
var openLive = function(opts){
  opts = opts || {}; var o = curOrder(); closeModal(true); st.pay = false; lastFocus = document.activeElement;
  var m = document.createElement('div'); m.className = 'ck-ov ck-modal ck-live ck-form'; m.setAttribute('data-v', after()); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'ck-mt');
  m.innerHTML = '<div class="ck-sheet ck-msheet ck-lsheet" data-ph="form"><button type="button" class="ck-x" data-ckc="close" aria-label="Close">' + ic('x', 18) + '</button>'
    + '' + '<div class="ck-hd"><h2 id="ck-mt">Add your card</h2></div><div class="ck-lz">' + cardFace()
    + '<div class="ck-chips8">' + (o.now > 0 ? '<span class="ck-ch8"><small>Charged now</small><b>' + money(o.now) + '</b></span>' : '')
    + (o.dep ? '<span class="ck-ch8 ck-hd8"><small>' + (o.hold ? 'Held · not charged' : 'Authorised · not charged') + '</small><b>' + money(o.auth) + '</b></span>' : '') + '</div></div>'
    + '<div class="ck-rz"><div class="ck-rzb">' + depInfo() + (opts.note ? noteHtml(opts.note) : '') + payForm(o) + '</div>'
    + '<div class="ck-ft"><button type="button" class="ck-go" data-ckc="pay">' + ic('lock', 16) + payLbl(o) + '</button><p class="ck-sec">' + SECURE + '</p></div></div>'
    + '<div class="ck-pz" id="ck-pz" hidden></div></div>';
  document.body.appendChild(m); document.documentElement.classList.add('ck-lock'); restoreVals(); paint8();
  setTimeout(function(){ var el = document.getElementById('ck-num'); if (el && !st.pay) try { el.focus({ preventScroll: true }); } catch (e) {} }, 60);
};
var closeModal = function(silent){ clearInterval(tick); tick = null; var m = document.querySelector('.ck-modal'); if (!m) return; m.parentNode.removeChild(m); document.documentElement.classList.remove('ck-lock'); st.pay = false; if (!silent && lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} };

/* ---------- lo que pasa después de pagar: la tarjeta es el escenario y el formulario se pliega ---------- */
var cardState = function(){ return st.step === 'proc' ? (st.pi === -1 ? 'verify' : 'proc') : st.step; };
var CST = { verify: '<i class="ck-cs-sp"></i>Verifying…', proc: '<i class="ck-cs-sp"></i>Processing…', ok: ic('chk', 16), fail: ic('x', 16), part: ic('alert', 16) };
var tick = null;   /* cuenta atrás del 3D Secure (V2 y V3): 5:00, caduca y se puede reenviar */
var mmss = function(n){ n = Math.max(0, n); return Math.floor(n / 60) + ':' + (n % 60 < 10 ? '0' : '') + (n % 60); };
var CIRC = 2 * Math.PI * 34;
var syncTick = function(){
  var bank = st.pay && st.step === 'proc' && st.pi === -1;
  if (bank && !tick) tick = setInterval(function(){
    if (!(st.step === 'proc' && st.pi === -1) || st.expired) return;
    st.secs--; if (st.secs <= 0) { st.expired = true; render(); return; }
    var t = document.getElementById('s3-t'), r = document.getElementById('s3-r1'), e = document.getElementById('v2-exp');
    if (t) t.textContent = mmss(st.secs); if (e) e.textContent = mmss(st.secs); if (r) r.setAttribute('stroke-dashoffset', (CIRC * (1 - st.secs / 300)).toFixed(1)); }, 1000);
  if (!bank) { clearInterval(tick); tick = null; }
};
var hintFor = function(){ return { sca: 'Open your banking app and approve the request when it asks.', funds: 'Another card or a wallet with enough balance usually works.', hold: 'Debit and prepaid cards often can’t hold this amount. A credit card usually works.', declined: 'Your bank didn’t say why. Another card or a wallet usually works.' }[st.reason] || ''; };

/* V2 · libro mejorado: barra de progreso, línea de tiempo con el estado vivo de cada operación (y su número de orden), el 3D Secure como primer paso con su cuenta atrás,
   y un resultado que dice qué viene después con el botón principal adaptado (pagos pendientes o inicio) */
var v2Sub = function(k, s){ var o = st.o;
  if (k === 'pay') return { wait: 'Starts when your bank confirms', on: 'Contacting your bank…', done: methodTxt() + ' · final', void: 'Nothing was charged', fail: 'Nothing was charged' }[s];
  return { wait: o.now > 0 ? 'Starts right after the charge' : 'Starts when your bank confirms', on: o.hold ? 'Asking your bank to hold it…' : 'Asking your bank to authorise it…', done: o.hold ? 'Not a charge · released ' + relDate(o) : 'Not a charge · nothing is blocked', void: 'Nothing was ' + (o.hold ? 'held' : 'authorised'), fail: 'Your bank declined it' }[s]; };
var swap = function(el, html){   /* cambia el contenido solo si es distinto y lo hace entrar con un fundido corto */
  if (!el || el.innerHTML === html) return; el.innerHTML = html; if (RM) return; el.classList.remove('v2-sw'); void el.offsetWidth; el.classList.add('v2-sw'); };
var tlTitle = function(k, s){ return opTxt(k, s).replace(/ \d[\d.]*,\d\d€$/, ''); };
var tlSpecs = function(bank){   /* los pasos de la línea de tiempo: 3D Secure (si lo hay), cobro y retención */
  var o = st.o, a = [];
  if (bank) a.push({ k: 'bank', s: st.expired ? 'fail' : 'on', icon: st.expired ? ic('clock', 14) : '', title: st.expired ? 'Request expired' : 'Confirm with your bank', no: '', sub: st.expired ? 'Send a new request to continue.' : (st.resent ? 'New request sent · expires in ' : 'Expires in ') + '<b id="v2-exp">' + mmss(st.secs) + '</b>' + (st.expired ? '' : '<span class="v2-zn"><b>Seeing 0,00€ in your banking app?</b> That’s normal. At this step your bank only checks that it’s you (3D Secure), so it may show a request of 0,00€.</span>'), amt: '' });
  else if (st.viaBank) a.push({ k: 'bank', s: 'done', icon: ic('chk', 14), title: 'Bank confirmed', no: '', sub: '3D Secure', amt: '' });
  ops(o).forEach(function(k){ var s = opSt(k); a.push({ k: k, s: s, icon: opIcon(s), title: tlTitle(k, s), no: s === 'done' ? 'Order ' + ORD(k) : '', sub: v2Sub(k, s), amt: money(k === 'pay' ? payAmt() : o.auth) }); });
  if (st.step === 'ok' && st.rcpt === 1) a.push({ k: 'rcpt', s: 'on', icon: '', title: 'Generating your receipts', no: '', sub: 'One receipt for each operation', amt: '' });
  return a;
};
var patchTimeline = function(ol, specs){   /* se actualiza en sitio: cada paso entra, cambia de estado y de texto con su transición, en vez de repintarse entero */
  var keep = {};
  specs.forEach(function(sp, idx){
    keep[sp.k] = 1; var li = ol.querySelector('[data-k="' + sp.k + '"]'), cls = 'v2-n op-' + sp.k + ' is-' + sp.s;
    if (!li) { li = document.createElement('li'); li.setAttribute('data-k', sp.k); li.className = cls + ' v2-in'; li.innerHTML = '<i class="ck-oi" aria-hidden="true">' + sp.icon + '</i><div><div class="v2-tl"><b>' + sp.title + '</b></div><small>' + sp.sub + '</small></div><em>' + sp.amt + '</em>'; }
    else if (li.getAttribute('data-s') !== sp.s) { li.className = cls; li.querySelector('.ck-oi').innerHTML = sp.icon; }
    li.setAttribute('data-s', sp.s);
    if (ol.children[idx] !== li) ol.insertBefore(li, ol.children[idx] || null);
    swap(li.querySelector('.v2-tl b'), sp.title); swap(li.querySelector('small'), sp.sub);
    var em = li.querySelector('em'); if (em.textContent !== sp.amt) em.textContent = sp.amt;
    var tl = li.querySelector('.v2-tl'), no = tl.querySelector('.v2-no');
    if (sp.no && !no) { no = document.createElement('span'); no.className = 'v2-no v2-sw'; no.textContent = sp.no; tl.appendChild(no); } else if (!sp.no && no) tl.removeChild(no);
  });
  [].slice.call(ol.children).forEach(function(li){ if (!keep[li.getAttribute('data-k')]) ol.removeChild(li); });
};
var patchBar = function(bar, specs){   /* progreso continuo: avanza despacio hacia el siguiente hito mientras un paso está en curso y se completa al terminarlo */
  var i = bar.firstChild, fin = st.step !== 'proc', n = specs.length || 1, done = specs.filter(function(x){ return x.s === 'done'; }).length, act = specs.filter(function(x){ return x.s === 'on'; })[0];
  var target = fin ? 100 : Math.round((done + (act ? (act.k === 'bank' ? .3 : .82) : 0)) / n * 100);
  var dur = fin ? '.55s' : act ? (act.k === 'bank' ? '14s' : '1.8s') : '.4s';
  var go = function(){ i.style.transitionDuration = dur; i.style.width = target + '%'; };
  if (bar.getAttribute('data-init')) go(); else { bar.setAttribute('data-init', '1'); requestAnimationFrame(function(){ requestAnimationFrame(go); }); }
};
var paintV2 = function(pz, focus){
  var t = titles(), o = st.o, pend = pendList().length, ft = pz.querySelector('.ck-pzf'), x = '', f = '', bank = st.step === 'proc' && st.pi === -1;
  var bar = pz.querySelector('.v2-bar'), specs = tlSpecs(bank); bar.className = 'v2-bar' + (st.step === 'ok' ? ' is-ok' : st.step === 'fail' ? ' is-fail' : st.step === 'part' ? ' is-part' : ''); patchBar(bar, specs);
  swap(pz.querySelector('.ck-pzh'), '<h2 class="ck-pt" tabindex="-1">' + t[0] + '</h2><p class="ck-ps">' + (bank ? 'Approve the payment of ' + money(o.now > 0 ? o.now : o.auth) + ' to Villa Calipso in your banking app.' : st.step === 'ok' ? (o.dep && o.now > 0 ? 'Two separate operations, both done.' : 'Everything is done.') : t[1]) + '</p>');
  var gen = st.step === 'ok' && st.rcpt === 1;
  patchTimeline(pz.querySelector('.v2-t'), specs);
  if (bank) { x = '';
    f = (st.expired ? btn('sca-resend', '', 'Send a new request', 'ck-go') : btn('sca-ok', '', 'I’ve approved it', 'ck-go')) + btn('sca-no', '', 'Cancel payment', 'ck-ghost'); }
  else if (st.step === 'ok') {
    x = '';
    f = ''; }   /* tras «Generating your receipts» se va directo a Order history (#859) */
  else if (st.step === 'fail') { x = '<p class="ck-hint is-safe">' + ic('shield', 14) + '<span><b>Nothing was charged' + (o.dep ? ' and nothing is ' + (o.hold ? 'held' : 'authorised') : '') + '.</b> ' + hintFor() + '</span></p><button type="button" class="ck-lnk" data-ck="other">' + ic('wallet', 15) + 'Pay with a wallet instead</button>'; f = btn('again', '', 'Try again', 'ck-go') + btn('other', '', 'Use another card', 'ck-ghost'); }
  else if (st.step === 'part') { x = '<p class="ck-hint">' + ic('card', 14) + '<span>' + hintFor() + ' Only the deposit is left to do.</span></p>'; f = btn('depcard', '', 'Try another card', 'ck-go') + btn('go', 'home', 'Do it later', 'ck-ghost'); }
  swap(pz.querySelector('.ck-pzx'), x); swap(ft, f); ft.hidden = !f;
  var fe = focus ? pz.querySelector(focus) : pz.querySelector('.ck-pt'); if (fe) try { fe.focus({ preventScroll: true }); } catch (e) {}
};

var paintLive = function(focus){
  var m = document.querySelector('.ck-live'); if (!m) { if (!st.preview && !st.pay) openLive(); m = document.querySelector('.ck-live'); if (!m) return false; }
  var sh = m.querySelector('.ck-lsheet'), pz = m.querySelector('#ck-pz'), cd = document.getElementById('ck-cd8');
  if (!st.pay) { st.pay = true; sh.setAttribute('data-ph', 'pay'); pz.hidden = false; pz.removeAttribute('data-built'); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); cd.classList.remove('flip'); cd.removeAttribute('data-fo'); paint8(); }
  if (pz.getAttribute('data-built') !== '2') { pz.innerHTML = '<div class="ck-pzb"><div class="v2-bar" aria-hidden="true"><i></i></div><div class="ck-pzh"></div><ol class="v2-t"></ol><div class="ck-pzx"></div></div><div class="ck-ft ck-pzf"></div>'; pz.setAttribute('data-built', '2'); }
  var s = cardState(); cd.setAttribute('data-st', s); document.getElementById('ck-cst').innerHTML = CST[s] || '';
  var mt = document.getElementById('ck-mt'); if (mt) mt.textContent = 'Your payment';
  paintV2(pz, focus);
  m.querySelector('.ck-x').hidden = true;   /* durante todo el pago no hay X: no se abandona el proceso (tampoco con Escape ni clicando fuera) */
  syncTick();
  return true;
};
var render = paintLive;

/* ---------- acciones ---------- */
var retryForm = function(kind){   /* «Try again» / «Use another card»: la tarjeta viva se despliega de nuevo con lo que había escrito y el aviso, sin recargar */
  if (kind === 'other') keepVals = {};
  var live = document.querySelector('.ck-live');
  if (!live) { openLive({ note: kind }); return; }
  clearInterval(tick); tick = null; st.pay = false; var mt = document.getElementById('ck-mt'); if (mt) mt.textContent = 'Add your card';
  live.querySelector('.ck-lsheet').setAttribute('data-ph', 'form'); live.querySelector('#ck-pz').hidden = true; live.querySelector('.ck-x').hidden = false;
  document.getElementById('ck-cd8').removeAttribute('data-st'); document.getElementById('ck-cst').innerHTML = '';
  var b = live.querySelector('.ck-rzb'), old = b.querySelector('.ck-fn'); if (old) old.parentNode.removeChild(old); b.insertAdjacentHTML('afterbegin', noteHtml(kind));
  if (kind === 'other') ['ck-num', 'ck-exp', 'ck-cvc'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
  paintErr({}); brandPaint(); paint8(); var n = document.getElementById('ck-num'); if (n) n.focus();
};
var act = function(a, v){
  if (a === 'pay') submit();
  else if (a === 'wallet') begin(v, '');
  else if (a === 'close') closeModal();
  else if (a === 'sca-ok') { st.viaBank = true; approve(); } else if (a === 'sca-no') cancel3ds();
  else if (a === 'sca-resend') { st.secs = 300; st.expired = false; st.resent = true; render('[data-ck="sca-ok"]'); }
  else if (a === 'again') retryForm('retry');
  else if (a === 'other') retryForm('other');
  else if (a === 'depcard') { depState = true; keepVals = {}; openLive({ note: 'other' }); }
  else if (a === 'go') go(v);
};
document.addEventListener('keydown', function(e){
  var m = document.querySelector('.ck-modal'); if (!m) return;
  if (e.key === 'Escape') { e.preventDefault(); if (!st.pay) closeModal(); return; }
  if (e.key === 'Tab') { var f = [].filter.call(m.querySelectorAll('button, input'), function(x){ return !x.disabled && !x.hidden && x.offsetParent; }); if (!f.length) return; var a0 = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a0) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a0.focus(); } }
}, true);
document.addEventListener('click', function(e){
  var t = e.target; if (!t.closest) return;
  var inForm = t.closest('.ck-form'); if (!inForm) return;
  e.stopImmediatePropagation();   /* ni pay-views ni la navegación de la réplica actúan sobre estos campos */
  if (t.classList && t.classList.contains('ck-modal')) { e.preventDefault(); if (!st.pay) closeModal(); return; }   /* clic en el fondo (no mientras se paga) */
  var b = t.closest('[data-ck], [data-ckc]'); if (!b) return; e.preventDefault();
  act(b.getAttribute('data-ckc') || b.getAttribute('data-ck'), b.getAttribute('data-v'));
}, true);
window.__ckMain = function(){ var o = order(); if (!payable(o)) return false; depState = DEP; openLive(); return true; };

/* reintentos (?ck=retry|other[&dep=1]), «Ver paso» (?view=…) y pago directo (?run=…); pay-card-sheet reenvía aquí */
var RETRY = Q.get('ck'), VIEW = Q.get('view'), RUN = Q.get('run');
if (RETRY || VIEW || RUN) { var nn = 0, tt = setInterval(function(){ if (document.querySelector('.pv7-hero') || ++nn > 30) { clearInterval(tt);
  if (RUN) { openLive(); fillCard(); var l4 = Q.get('l4') || '4242'; begin(RUN, RUN === 'card' ? (Q.get('br') === 'Mastercard' ? '5555' : '4242') + '00000000' + l4 : ''); }
  else if (VIEW && /^(bank|proc|ok|fail|part)$/.test(VIEW)) preview(VIEW);
  else if (RETRY) openLive({ note: RETRY }); } }, 150); }
})();
