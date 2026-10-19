/* Edición de tasas («Edit tourist taxes», pantalla cart-exemptions). Una sola propuesta: V3 «Noches».
   Reglas: la tasa es por huésped y por noche de la estancia; todos los huéspedes pagan todas las noches. Solo se pueden declarar
   exenciones a huéspedes registrados, y se comprueban a la llegada. La caja oscura «Why …?» va arriba (a todo el ancho en escritorio) y, con huéspedes ya pagados, lleva el desglose Total / Already paid / Left to pay.
   Estado: replica-tax3 = { v: 2, n: huéspedes, r: [motivo de exención por huésped, '' = paga] }; el carrito de pagos lo lee. */
(function(){
var S = window.__SCREEN || {};
if (S.id !== 'cart-exemptions') return;
var RATE = 3, NITES = 2, PER = RATE * NITES, STAY = '25–27 Nov', REG = 2;
var GUESTS = [{ n: 'Test Guest Demo', i: 'TG' }, { n: 'Demo Second', i: 'DS' }];
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var money = function(n){ var p = n.toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1] + '€'; };
var plural = function(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); };
var I = {
  chk: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', dash: '<path d="M5 12h14"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.4 18.1"/><path d="M7 6h1v4"/><path d="m16.7 13.9.7.7-2.8 2.8"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  landmark: '<path d="M10 18v-7"/><path d="M11.1 2.2a2 2 0 0 1 1.8 0l7.9 3.8c.5.2.3.9-.2.9H3.5c-.5 0-.7-.7-.2-.9z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5.1"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  spark: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>'; };

/* ---------- estado ---------- */
var REASONS = [
  { k: 'Under 16', t: 'Child under 16', d: 'Children under 16 don’t pay the tax.', p: 'an ID or passport that shows the date of birth' },
  { k: 'Resident', t: 'Local resident', d: 'Guests registered in this municipality.', p: 'proof of residence in this municipality' },
  { k: 'Disability', t: 'Person with a disability', d: 'Guests with an official certificate.', p: 'the official disability certificate' },
  { k: 'Other', t: 'Other reason', d: 'Anything else the destination accepts.', p: 'the proof the destination asks for' }
];
var reason = function(k){ return REASONS.filter(function(r){ return r.k === k; })[0] || REASONS[3]; };
var blank = function(){ return ['', '', '', '', '', '', '', '', '', '', '', '', '', '']; };
var CASES = {
  all: function(){ return { n: 2, r: blank() }; },
  ex: function(){ var r = blank(); r[1] = 'Under 16'; return { n: 2, r: r }; },
  unreg: function(){ return { n: 4, r: blank() }; },
  mix: function(){ var r = blank(); r[1] = 'Under 16'; return { n: 4, r: r }; },
  exmix: function(){ var r = blank(); r[0] = 'Resident'; r[1] = 'Under 16'; return { n: 2, r: r }; },   /* dos huéspedes exentos con motivos distintos (para el aviso de check-in) */
  paid: function(){ return { n: 4, r: blank(), p: [1, 1, 1] }; }   /* 3 huéspedes con la tasa ya pagada (pago anterior) y Guest 4 sin pagar */
};
var load = function(){ try { var a = JSON.parse(LSget('replica-tax3', 'null')); if (a && a.v === 2 && a.n >= 1 && a.r && a.r.length >= a.n) { for (var i = REG; i < a.r.length; i++) a.r[i] = ''; return a; } } catch (e) {} return CASES.mix(); };
var s3 = load();
var save = function(){ s3.v = 2; LSset('replica-tax3', JSON.stringify(s3)); window.dispatchEvent(new Event('replica-tax-change')); };
if ((function(){ try { var a = JSON.parse(LSget('replica-tax3', 'null')); return !a || a.v !== 2; } catch (e) { return true; } })()) save();
(function(){ var m = location.search.match(/[?&]ex=(mix|u16)/); if (!m) return; var k = m[1] === 'mix' ? 'exmix' : 'ex', c = CASES[k](); s3.n = c.n; s3.r = c.r; s3.p = c.p || []; LSset('replica-tax-case', k); save(); })();   /* ?ex=u16 (solo menor de 16) | ?ex=mix (menor de 16 + residente) */   /* el caso por defecto también lo lee el carrito */
var N = function(){ return Math.max(1, Math.min(14, s3.n)); };
var slots = function(){ return s3.r.slice(0, N()); };
var paid = function(i){ return !!(s3.p && s3.p[i]); };
var paidN = function(){ return slots().filter(function(r, i){ return paid(i); }).length; };
var exN = function(){ return slots().filter(function(r, i){ return r && !paid(i); }).length; };
var payN = function(){ return N() - exN() - paidN(); };   /* los que pagan ahora */
var total = function(){ return payN() * PER; };
var gname = function(i){ return GUESTS[i] ? GUESTS[i].n : 'Guest ' + (i + 1); };
var ginit = function(i){ return GUESTS[i] ? GUESTS[i].i : 'G' + (i + 1); };
var exList = function(){ return slots().map(function(r, i){ return r && !paid(i) ? { i: i, r: r } : null; }).filter(Boolean); };
var proofText = function(){ var ks = {}; slots().forEach(function(r){ if (r) ks[r] = 1; }); return Object.keys(ks).map(function(k){ return reason(k).p; }).join('; '); };
var vela = function(){ return LSget('replica-comp-trad', '0') === '1' && LSget('replica-comp-chat', '1') === '0' ? '0' : '1b'; };   /* mismo criterio que la pantalla de pagos */

/* ---------- caja oscura «Why …?» (la C elegida) ---------- */
var WHY = 'Required by regional law — the property collects it and passes it to the local tourism board.';
var cta = function(){ return '<button type="button" class="tx-go tx-go-w" data-tx="go">Confirm and go back to Payment</button>'; };
var cartNote = function(){ return '<p class="tb-cart"><span>Nothing is charged here — this adds the tax to your payments cart.</span></p>'; };
/* C · Por qué: el total arriba y tres razones en lenguaje llano */
var paidBlock = function(){ return '<div class="tb-paid"><div><span>Total</span><b>' + money((N() - exN()) * PER) + '</b></div><div class="ok"><span>' + 'Already paid</span><b>' + money(paidN() * PER) + '</b></div><div class="due"><span>Left to pay</span><b>' + money(total()) + '</b></div></div>'; };
var whyHead = function(){ return '<div class="tb-cl"><span class="tb-eye">Why ' + money(total()) + '?</span><div class="tb-big"><b>' + money(total()) + '</b><span>' + (paidN() ? 'tourist tax left to pay' : 'tourist tax for your stay') + '</span></div></div>'; };
var reasons = function(){
  var e = exList();
  var row = function(icon, t, d){ return '<div class="tb-r"><span class="tb-ri">' + ic(icon, 16) + '</span><span><b>' + t + '</b><small>' + d + '</small></span></div>'; };
  var first = paidN() > 0;   /* con huéspedes ya pagados, el desglose va el primero */
  return '<div class="tb-rs">' + (first ? paidBlock() : '') + row('landmark', 'It\u2019s a city tax', 'Required by law. The property collects it for the local tourism board.')
    + row('moon', money(RATE) + ' per guest, per night', 'Your stay: ' + plural(NITES, 'night') + ' \u2192 ' + money(PER) + ' per guest.')
    + (first ? '' : row('users', payN() + ' of ' + plural(N(), 'guest') + ' pay', e.length ? plural(e.length, 'exempt guest') + ' pays 0,00\u20ac \u00b7 checked at check-in.' : 'No exemptions declared.')) + '</div>';
};
var boxTop = function(){ return whyHead() + reasons(); };
var boxC = function(){ return '<div class="tx-hero tb tb-c">' + boxTop() + '<div class="tb-ft">' + cta() + cartNote() + '</div></div>'; };


/* ---------- filas de huéspedes (como en el resumen) ---------- */
var ui = { sheet: null, slot: -1, why: '', menu: null, fresh: false };
var wide = function(){ return window.innerWidth >= 1024; };
var menuOpts = function(g){ if (paid(g)) return g >= REG ? [['receipt', 'View receipt'], ['reg', 'Register this guest']] : [['receipt', 'View receipt']]; if (g >= REG) return [['reg', 'Register this guest']]; return s3.r[g] ? [['edit', 'Edit exemption'], ['rm', 'Remove exemption']] : [['add', 'Add exemption']]; };
var gRow = function(i){
  var r = s3.r[i], reg = i < REG, open = ui.menu === i && wide();
  var pd = paid(i); if (pd) r = '';
  var amtH = pd ? '<span class="tx-a t3-pd"><b>' + money(PER) + '</b></span>' : r ? '<span class="tx-a"><s>' + money(PER) + '</s><b>' + money(0) + '</b></span>' : '<span class="tx-a"><b>' + money(PER) + '</b></span>';
  var dd = open ? '<div class="t3-dd" role="menu">' + menuOpts(i).map(function(o){ return '<button type="button" role="menuitem" class="t3-di" data-tx="t3-opt" data-v="' + o[0] + '" data-g="' + i + '">' + o[1] + '</button>'; }).join('') + '</div>' : '';
  return '<div class="t3-row' + (pd ? ' pd' : '') + (r ? ' ex' : '') + (reg ? '' : ' un') + (open ? ' open' : '') + '"><span class="t3-av ' + (reg ? 'ok' : 'un') + '">' + (reg ? ginit(i) : ic('dash', 18)) + '</span>'
    + '<span class="t3-tx"><b>' + esc(gname(i)) + '</b>' + (reg ? '' : '<span class="t3-s">Not registered yet</span>') + (pd ? '<span class="t3-cs"><em class="t3-chip pd">Paid</em></span>' : r ? '<span class="t3-cs"><em class="t3-chip ex">' + esc(reason(r).k) + ' · to verify</em></span>' : '') + '</span>'
    + amtH + '<span class="t3-kw"><button type="button" class="t3-kb" aria-label="Options for ' + esc(gname(i)) + '" aria-haspopup="menu" aria-expanded="' + open + '" data-tx="t3-menu" data-g="' + i + '">' + ic('dots', 18) + '</button>' + dd + '</span></div>';
};

/* ---------- hojas (móvil: hoja inferior · escritorio: modal) ---------- */
var shell = function(title, head, body, foot, cls){
  var fresh = ui.fresh; ui.fresh = false;
  return '<div class="t2-bd' + (fresh ? ' t2-in' : '') + '" data-tx="t2-close"></div><div class="t2-sheet' + (cls ? ' ' + cls : '') + (fresh ? ' t2-in' : '') + '" role="dialog" aria-modal="true" aria-label="' + title + '"><i class="t2-grab"></i><div class="t2-sht"><b>' + title + '</b>' + head + '</div><div class="t2-shb">' + body + '</div>' + (foot ? '<div class="t2-shf">' + foot + '</div>' : '') + '</div>';
};
var closeX = '<button type="button" class="t2-x" aria-label="Close" data-tx="t2-close">' + ic('x', 18) + '</button>';
/* ---------- Aviso «Bring proof to check-in» (recordatorio al confirmar con exenciones declaradas) ---------- */
var cfGuest = function(x){ return '<span class="cf-gb">' + esc(ginit(x.i)) + '</span>'; };
var cfOk = '<button type="button" class="tx-go" data-tx="t3-confirm">Confirm and go back to Payment</button>';
var cfBack = '<button type="button" class="t2-ghost" data-tx="t2-close">Review exemptions</button>';
var confirmSheet = function(){
  var e = exList(), one = e.length === 1;
  var note = 'If it doesn’t apply, ' + (one ? 'the tax (' + money(PER) + ')' : 'the tax (' + money(PER) + ' each)') + ' is paid at the property.';
  /* recordatorio: el subtítulo dice qué pasa si no vale; una tarjeta por huésped exento con el documento arriba */
  return shell('Bring proof to check-in', closeX,
    '<p class="cf-lead">' + note + '</p>'
    + e.map(function(x){ return '<div class="cf-card cf-c1"><p class="cf-bring2">' + ic('card', 15) + '<span>Bring ' + reason(x.r).p + '.</span></p><div class="cf-r1">' + cfGuest(x) + '<span class="cf-tx"><b>' + esc(gname(x.i)) + '</b><em class="t3-chip ex">' + esc(reason(x.r).t) + '</em></span><span class="tx-a"><s>' + money(PER) + '</s><b>' + money(0) + '</b></span></div></div>'; }).join(''),
    cfOk + cfBack, 'cf cf1');
};
var sheetHtml = function(){
  if (!ui.sheet) return '';
  var g = ui.slot;
  if (ui.sheet === 'menu') {
    return shell(esc(gname(g)), '<span class="t3-mamt">' + (s3.r[g] ? '<s>' + money(PER) + '</s> ' + money(0) : money(PER)) + '</span>',
      '<div class="t3-ml">' + menuOpts(g).map(function(o){ return '<button type="button" class="t3-opt" data-tx="t3-opt" data-v="' + o[0] + '" data-g="' + g + '">' + o[1] + '</button>'; }).join('') + '</div>', '', 't3-msheet');
  }
  if (ui.sheet === 'confirm') return confirmSheet();
  /* 'slot': motivo de la exención de un huésped registrado */
  var cur = s3.r[g], sel = ui.why || cur;
  var body = '<h4 class="t2-sh">Why?</h4><div class="t2-rs" role="radiogroup">' + REASONS.map(function(r){ return '<button type="button" class="t2-rd' + (sel === r.k ? ' on' : '') + '" role="radio" aria-checked="' + (sel === r.k) + '" data-tx="t2-why" data-v="' + r.k + '"><span class="t2-rt"><b>' + r.t + '</b><span>' + r.d + '</span></span><span class="t2-dot"></span></button>'; }).join('') + '</div>';
  if (sel) body += '<p class="t2-proof">' + ic('info', 15) + '<span>Bring <b>' + reason(sel).p + '</b>. The property checks it when you arrive; if it isn’t valid, the tax (' + money(PER) + ' per guest) is paid there.</span></p>';
  var foot = (cur ? '<button type="button" class="t2-ghost" data-tx="t2-rm">Remove exemption</button>' : '') + '<button type="button" class="tx-go" data-tx="t2-apply"' + (sel ? '' : ' disabled') + '>' + (cur ? 'Update exemption' : 'Declare exemption') + '</button>';
  return shell('Exemption · ' + esc(gname(g)), closeX, body, foot);
};
var openSheet = function(k, g){ ui.fresh = true; ui.sheet = k; ui.slot = g === undefined ? -1 : g; ui.why = ''; };
var goRegister = function(){ var m = location.pathname.match(/\.([md])\.html/); location.href = 'g2-form-empty.' + (m ? m[1] : 'm') + '.html' + (/[?&]embed=1/.test(location.search) ? '?embed=1' : ''); };
var A = {
  't2-close': function(){ ui.sheet = null; },
  't3-confirm': function(){ ui.sheet = null; go(); },
  't2-why': function(b, g, v){ ui.why = v; },
  't2-apply': function(){ if (ui.slot < REG) { s3.r[ui.slot] = ui.why || s3.r[ui.slot]; save(); } ui.sheet = null; },
  't2-rm': function(){ s3.r[ui.slot] = ''; save(); ui.sheet = null; },
  't3-menu': function(b, g){ if (wide()) ui.menu = ui.menu === g ? null : g; else openSheet('menu', g); },
  't3-opt': function(b, g, v){ ui.menu = null; if (v === 'add' || v === 'edit') openSheet('slot', g); else if (v === 'rm') { s3.r[g] = ''; save(); ui.sheet = null; } else if (v === 'reg') goRegister(); else if (v === 'receipt') { var m = location.pathname.match(/\.([md])\.html/); location.href = 'order-history.' + (m ? m[1] : 'm') + '.html'; } },
  't2-ask': function(b, g){ askI = g; }
};

/* ---------- Vela (solo carril de escritorio; en móvil no hay Vela) ---------- */
var askI = 0;
var qaList = function(){
  var e = exN(), l = [];
  if (e) l.push({ t: 'I declared an exemption — what now?', a: 'Bring <b>' + proofText() + '</b> when you arrive. The tax for ' + plural(e, 'exempt guest') + ' (' + money(e * PER) + ') isn’t in your cart; if the proof isn’t valid, it’s paid at the property.' });
  l.push({ t: 'Why do I pay a tourist tax?', a: 'It’s required by regional law. It’s charged per guest and per night: ' + money(RATE) + ' × ' + plural(NITES, 'night') + ' = ' + money(PER) + ' each. The property collects it for the local tourism board.' });
  l.push({ t: 'Do all guests pay all nights?', a: 'Yes. Every guest pays every night of the stay. It can’t be split by night or by guest — only valid exemptions change the total.' });
  l.push({ t: 'Who can be exempt?', a: 'It depends on the destination: usually children under 16, local residents and people with a disability. Only registered guests can declare it; it’s checked when you arrive.' });
  if (N() > REG) l.push({ t: 'Why do unregistered guests pay?', a: 'The tax counts everyone staying. Register them to complete their details — and to declare an exemption if they have one.' });
  if (!e) l.push({ t: 'What if my exemption isn’t valid?', a: 'The property checks the proof at check-in. If a guest doesn’t qualify, their tax (' + money(PER) + ') is paid there. Nothing extra is charged now.' });
  if (paidN()) l.unshift({ t: 'Why do only some guests pay?', a: plural(paidN(), 'guest') + ' already paid ' + money(paidN() * PER) + ' in an earlier payment \u2014 it\u2019s on your receipt. Only ' + (payN() === 1 ? 'the guest' : 'the guests') + ' added since then ' + (payN() === 1 ? 'pays' : 'pay') + ' now: ' + money(total()) + '.' });
  l.push({ t: 'Is anything charged now?', a: 'No. Confirming only adds the tax to your payments cart. You pay it there, together with the rest — or later, if you move it to “Pay later”.' });
  return l.slice(0, 5);
};
var gtkRows = function(){ return [
  { i: 'landmark', t: 'Why you pay it', d: 'A city tax required by law, collected by the property.' },
  { i: 'moon', t: money(RATE) + ' per guest, per night', d: 'Every guest pays all ' + NITES + ' nights of the stay.' },
  { i: 'shield', t: 'Exemptions are checked on arrival', d: 'Only registered guests can declare one — bring the proof.' },
  { i: 'cart', t: 'Nothing is charged here', d: 'Confirming adds the tax to your payments cart.' }
]; };
var tradHtml = function(){ return '<div class="t2-gk">' + gtkRows().map(function(r){ return '<div class="t2-gr"><span class="t2-gi">' + ic(r.i, 16) + '</span><span><b>' + r.t + '</b><span>' + r.d + '</span></span></div>'; }).join('') + '</div>'; };
var qaHtml = function(){ var q = qaList(); if (askI >= q.length) askI = 0; var f = q[askI];
  return '<div class="vc"><div class="vc-chat" aria-live="polite"><div class="vc-q">' + f.t + '</div><div class="vc-a"><span class="vc-av">' + ic('spark', 12) + '</span><div>' + f.a + '</div></div></div><span class="vc-lb">Suggested</span><div class="vc-chips">' + q.map(function(o, i){ return '<button type="button" class="vc-chip' + (i === askI ? ' on' : '') + '" data-tx="t2-ask" data-g="' + i + '">' + o.t + '</button>'; }).join('') + '</div></div>'; };
var railLab = null;
var velaRail = function(){
  var as = document.querySelector('aside[data-slot="assistant-panel"]'); if (!as) return;
  if (railLab === null) railLab = (as.querySelector(':scope > section > span') || {}).className || '';
  [].forEach.call(as.querySelectorAll(':scope > section[data-t2]'), function(s){ s.remove(); });
  [].forEach.call(as.querySelectorAll(':scope > section:not([data-t2])'), function(s){ s.style.display = 'none'; });
  as.style.overflowY = 'auto';
  var intro = as.querySelector(':scope > p'), mode = vela();
  if (intro) intro.textContent = mode === '0' ? 'City taxes look arbitrary until you see the math — so the math is right on the page.' : 'Ask me anything about the tourist tax. I’ve picked the questions that fit your booking.';
  var s = document.createElement('section'); s.className = 'flex flex-col'; s.setAttribute('data-t2', '1');
  s.innerHTML = '<span class="' + railLab + '">' + (mode === '0' ? 'Good to know' : 'Ask Vela') + '</span><div class="t2-rb">' + (mode === '0' ? tradHtml() : qaHtml()) + '</div>';
  as.appendChild(s);
};

/* ---------- montaje ---------- */
var origGo = null, root = null;
var go = function(){ if (origGo) origGo.click(); };
var render = function(){
  var tv = document.querySelector('.taxes-view'); if (!tv) return false;
  var kids = tv.children, orig = kids[kids.length - 1];
  if (!root || !root.parentNode) { root = document.createElement('div'); root.id = 'tx-root'; tv.appendChild(root); }
  if (orig && orig !== root) orig.classList.add('tx-orig');
  var dk = document.querySelector('div.sticky.bottom-0.z-10.mt-auto'); if (dk) { dk.classList.add('tx-orig'); if (!origGo) origGo = dk.querySelector('button'); }
  if (!origGo) origGo = [].filter.call(document.querySelectorAll('button'), function(b){ return /Confirm and go back/.test(b.textContent) && !b.closest('#tx-root'); })[0] || null;
  var ae = document.activeElement, f = ae && ae.getAttribute && ae.getAttribute('data-tx'), fg = ae && ae.getAttribute && ae.getAttribute('data-g'), sy = window.scrollY;
  var hd = '<div class="t2-hd"><h2 class="tx-lbl">Summary</h2></div>';
  var rows = slots().map(function(r, i){ return gRow(i); }).join(''), tail = '<div class="tx-dock"><button type="button" class="tx-go" data-tx="go">Confirm</button><p class="tx-dn"><span>Nothing is charged here \u2014 this adds the tax to your payments cart.</span></p></div>' + sheetHtml();
  root.className = 'tx tx-v3 tx-hasHero tb-c tp-2';
  root.innerHTML = '<div class="tx-main">' + hd + '<div class="t3-list">' + rows + '</div></div><aside class="tx-aside">' + boxC() + '</aside>' + tail;
  if (f && f !== 'go') { var el = root.querySelector('[data-tx="' + f + '"]' + (fg !== null ? '[data-g="' + fg + '"]' : '')); if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) {} } }
  velaRail();
  window.scrollTo(0, sy);
  return true;
};
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#tx-root [data-tx], aside[data-slot="assistant-panel"] [data-tx]');
  if (!b) { if (ui.menu !== null && !(e.target.closest && e.target.closest('.t3-kw'))) { ui.menu = null; render(); } return; }
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();   /* que la navegación automática de la réplica no reciba el clic */
  var a = b.getAttribute('data-tx'), gi = parseInt(b.getAttribute('data-g'), 10), val = b.getAttribute('data-v');
  if (a !== 't3-menu' && a !== 't3-opt') ui.menu = null;
  if (a === 'go') { if (exN() > 0) { openSheet('confirm'); render(); } else go(); return; }   /* con exenciones, primero el aviso de lo que hay que llevar */
  if (A[a]) A[a](b, gi, val);
  render();
}, true);
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && (ui.sheet || ui.menu !== null)) { ui.sheet = null; ui.menu = null; render(); } });

/* ---------- controles del panel ---------- */
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); onPick(b.getAttribute(attr)); [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(c){ c.classList.toggle('on', c === b); }); render(); }, true);
  return d; };
var addCtl = function(){ var n = 0, t = setInterval(function(){ if (!window.__repPanel) { if (++n > 40) clearInterval(t); return; } clearInterval(t);
  window.__repPanel.add('Ejemplo de tasas', seg([['all', 'Todos pagan'], ['ex', 'Con exención'], ['unreg', 'Sin registrar'], ['mix', 'Mixto'], ['exmix', 'Exención mixta'], ['paid', 'Ya pagados + 1']], LSget('replica-tax-case', 'mix'), 'data-case', function(k){ LSset('replica-tax-case', k); var c = CASES[k](); s3.n = c.n; s3.r = c.r; s3.p = c.p || []; save(); ui.sheet = null; ui.menu = null; }), 26.5);
}, 150); };
window.addEventListener('storage', function(e){ if (!e.key || /^replica-(tax3|comp-)/.test(e.key)) { s3 = load(); render(); } });   /* otro marco de la vista dividida cambió algo */
var cfOpen = function(){ if (/[?&]sheet=1/.test(location.search)) { if (exN() > 0) { openSheet('confirm'); ui.fresh = false; } } };
var boot = function(){ cfOpen(); var n = 0, t = setInterval(function(){ if (render() || ++n > 40) clearInterval(t); }, 120); addCtl(); setInterval(function(){ if (!document.getElementById('tx-root')) render(); }, 800); };
if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
