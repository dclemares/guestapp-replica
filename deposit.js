/* Sección de depósito («Choose how to cover the stay»: Premium protection vs Security deposit). Pantallas pay-1-protection y pay-1e-deposit-selected.
   Control de página «Sección de depósito»: V10 · Una caja, V15 · Cobrado vs retenido y V16 · Mix V15 + V4 (por defecto). El resto de versiones y «Actual» se borraron (copia en backups/).
   Reglas de producto (memoria chekin-deposit-types / hold-auth-independent-from-charge):
   – Retención (hold): 230 € bloqueados desde que se añade la tarjeta; el banco puede renovarla cada 7 días (hasta 30); se libera N días tras el check-out (configurable). No es un cobro.
   – Preautorización (token): se guarda la tarjeta; no se bloquea ni se cobra nada; se puede cobrar después si se reportan daños.
   – Comisión del depósito 1,5 % + 0,30 € (3,75 €), cobro aparte (si la propiedad la repercute: «Comisiones externas»).
   – Premium protection = programa de protección de daños, NO un seguro: daños accidentales hasta 1.500 €, no reembolsable.
   – Obligatoria u opcional: si es obligatoria no hay «Continue without protection».
   La elección se guarda en replica-dep-choice (premium | deposit | none). */
(function(){
var S = window.__SCREEN || {};
if (S.id !== 'pay-1-protection' && S.id !== 'pay-1e-deposit-selected') return;
var VARS = [['10', 'V10 · Una caja'], ['15', 'V15 · Cobrado vs retenido'], ['16', 'V16 · Mix V15 + V4']];
var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
var ver = function(){ var v = LSget('replica-depsec', '16'); return /^(10|15|16)$/.test(v) ? v : '16'; };
var W = (location.pathname.match(/\.([md])\.html/) || [])[1] || 'm', EMBED = /[?&]embed=1/.test(location.search);
var money = function(n){ var p = n.toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1] + '€'; };   /* 1500 → 1.500,00€ (es-ES) */
var AUTH = 230, FEE = 3.75, PREM = 34.20, LIMIT = 1500;
/* ajustes que mandan en el texto */
var cfg = function(){ return { hold: LSget('replica-deposit-type', 'hold') !== 'token', fee: LSget('replica-ext-fees', '1') !== '0', rel: parseInt(LSget('replica-dep-release', '7'), 10) || 7, req: LSget('replica-prot-required', '0') === '1' }; };
var vela = function(){ return LSget('replica-comp-trad', '0') === '1' && LSget('replica-comp-chat', '1') === '0' ? '0' : '1b'; };
/* textos por opción, según los ajustes */
var TX = function(){
  var c = cfg(), relTxt = c.rel + (c.rel === 1 ? ' day' : ' days') + ' after check-out';
  return {
    c: c, relTxt: relTxt,
    premium: { name: 'Premium protection', badge: 'Recommended', sub: 'one-time · covers accidental damage up to ' + money(LIMIT),
      charged: PREM, held: 0, todayLine: money(PREM) + ' charged once, non-refundable',
      facts: ['No deposit and no hold on your card', 'Accidental damage up to ' + money(LIMIT) + ' is handled by the damage protection program', 'Non-refundable, even if nothing breaks'] },
    deposit: { name: 'Security deposit', badge: c.hold ? 'Released after your stay' : 'Nothing blocked',
      sub: c.hold ? money(AUTH) + ' held on your card, not charged' : money(AUTH) + ' authorised, nothing blocked',
      charged: c.fee ? FEE : 0, held: c.hold ? AUTH : 0,
      todayLine: c.hold ? money(AUTH) + ' held' + (c.fee ? ' · ' + money(FEE) + ' fee charged' : ' · nothing charged') : (c.fee ? money(FEE) + ' fee charged · nothing held' : 'Nothing charged or held'),
      facts: c.hold
        ? [money(AUTH) + ' is held on your card from today — it isn’t charged', 'Released ' + relTxt + '; your bank may show it as pending and renew it every 7 days', 'Charged only if the property reports damage before it’s released'].concat(c.fee ? ['A ' + money(FEE) + ' deposit service fee is charged separately'] : [])
        : ['Your card is saved — nothing is blocked or charged', 'Your card limit stays fully available', 'Up to ' + money(AUTH) + ' can be charged only if the property reports damage'].concat(c.fee ? ['A ' + money(FEE) + ' deposit service fee is charged separately'] : []) }
  };
};
var I = {
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', chk: '<path d="M20 6 9 17l-5-5"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  hour: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4A2 2 0 0 0 7 17.8V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2"/>',
  bank: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>', down: '<path d="m6 9 6 6 6-6"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  spark: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
};
var ic = function(n, s){ s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>'; };
var st = { choice: S.id === 'pay-1e-deposit-selected' ? 'deposit' : (LSget('replica-dep-choice', '') === 'none' ? '' : LSget('replica-dep-choice', '')), open: {}, ask: 0, faq: 0 };
var set = function(c){ st.choice = c; if (c) LSset('replica-dep-choice', c); };

/* ---------- piezas comunes ---------- */
var cta = function(T){ var off = !st.choice; return '<button type="button" class="dp-go" data-dp="go"' + (off ? ' disabled' : '') + '>Confirm and continue</button><p class="dp-cn">This property requires one of the two. You can change this later from the cart, until you pay.</p>' + (T.c.req ? '' : '<button type="button" class="dp-skip" data-dp="skip">Continue without protection</button>'); };
var tog = function(k, label){ return '<button type="button" class="dp-ex' + (st.open[k] ? ' open' : '') + '" data-dp="tg" data-v="' + k + '" aria-expanded="' + !!st.open[k] + '">' + label + ic('down', 16) + '</button>'; };
var coverPanel = function(){ return '<div class="dp-pn"><p>A one-time, non-refundable fee that replaces the deposit. It’s a damage protection program, not insurance.</p><b>Covered</b><span>Accidental damage to the property and its contents, up to ' + money(LIMIT) + '</span><b>Not covered</b><span>Deliberate damage, theft, or anything above ' + money(LIMIT) + '</span><b>If something breaks</b><span>Tell your host. They report it to the program within 14 days of check-out.</span></div>'; };
var depPanel = function(T){ return '<div class="dp-pn">' + (T.c.hold
  ? '<p>' + money(AUTH) + ' is held on your card — blocked, not charged. A hold is never part of a payment.</p><b>When it’s released</b><span>' + T.relTxt.charAt(0).toUpperCase() + T.relTxt.slice(1) + '. Banks may show it as pending and renew it every 7 days (up to 30), so you may get a notice.</span><b>When it can be charged</b><span>Only if the property reports damage before it’s released.</span>'
  : '<p>Your card is saved for this stay — nothing is held or charged.</p><b>When it can be charged</b><span>Only if the property reports damage, up to ' + money(AUTH) + '.</span><b>Your card limit</b><span>Not affected.</span>')
  + (T.c.fee ? '<b>Service fee</b><span>' + money(FEE) + ' (1,5% + 0,30€), charged separately when you complete the deposit.</span>' : '') + '</div>'; };
/* en móvil no hay Vela: el detalle de la opción elegida va debajo del cuadro, como un desplegable blanco */
var mobDet = function(T){ if (!st.choice) return ''; var prem = st.choice === 'premium', k = prem ? 'cov' : 'how';
  return '<div class="dp-xs dp-mx">' + tog(k, prem ? 'What’s covered' : 'How the deposit works') + (st.open[k] ? (prem ? coverPanel() : depPanel(T)) : '') + '</div>'; };
var head = function(){ return '<header class="dp-hd"><h1>Choose how to <em>cover</em> the stay</h1><p>This property asks for cover against accidental damage. Pick one — each says exactly what happens to your money.</p></header>'; };

/* ---------- preguntas de Vela (solo carril de escritorio): las 5 dudas más habituales del huésped, sacadas de V1–V16 ----------
   1 cuál elijo (V1/V6) · 2 ¿me lo quitan de la cuenta? (V7, el banco) · 3 cuándo vuelve / cuándo me pueden cobrar (V4/V16)
   4 ¿y si rompo algo? (V2/V13, escenarios) · 5 la comisión, o ¿y si no se rompe nada? si la propiedad no la repercute */
var qaList = function(T){
  var c = T.c, l = [];
  l.push({ t: 'Which one should I pick?', a: 'Premium protection is ' + money(PREM) + ' once, with no hold on your card — and it isn’t refunded. The deposit ' + (c.hold ? 'holds ' + money(AUTH) + ' until ' + T.relTxt : 'just saves your card') + (c.fee ? ', plus a ' + money(FEE) + ' fee' : '') + '; you pay up to ' + money(AUTH) + ' only if something breaks. Rather not have money blocked? Premium. Rather not pay for cover? The deposit.' });
  l.push(c.hold
    ? { t: 'Is the ' + money(AUTH) + ' taken from my account?', a: 'No. It’s a hold: your bank blocks it from today, but it isn’t charged. It may show as pending and be renewed every 7 days (up to 30), sometimes with a notice. On a debit card, that amount isn’t available to spend until it’s released.' }
    : { t: 'Is anything taken from my card?', a: 'No. Your card is only saved for this stay — nothing is blocked or charged, and your card limit stays fully available.' });
  l.push(c.hold
    ? { t: 'When do I get the ' + money(AUTH) + ' back?', a: 'The hold is released ' + T.relTxt + ' if no damage is reported. After that it can’t be charged. Your bank may take a few more days to show it as available.' }
    : { t: 'When can my card be charged?', a: 'Only if the property reports damage after your stay, and never more than ' + money(AUTH) + '. If nothing is reported, nothing is ever charged.' });
  l.push({ t: 'What if I break something?', a: 'Tell your host. With Premium protection, the damage protection program handles accidental damage up to ' + money(LIMIT) + '. With the deposit, up to ' + money(AUTH) + ' can be charged to your card. Anything beyond that — or damage the program doesn’t cover, like deliberate damage — you settle with the property.' });
  l.push(c.fee
    ? { t: 'Why is there a ' + money(FEE) + ' fee?', a: 'It’s the service fee for processing the deposit (1,5% + 0,30€). It’s charged separately when you complete the deposit — it isn’t part of the ' + money(AUTH) + (c.hold ? ' held on your card' : '') + '.' }
    : { t: 'What if nothing breaks?', a: 'With the deposit, you pay nothing' + (c.hold ? ' and the ' + money(AUTH) + ' hold is released ' + T.relTxt : '') + '. With Premium protection, the ' + money(PREM) + ' isn’t refunded.' });
  return l.slice(0, 5);
};

/* ---------- versiones sobre el cuadro azul: V10 · Una caja, V15 · Cobrado vs retenido, V16 · Mix V15 + V4 ---------- */
var heldTxt = function(T, id){ return T[id].held ? '+ ' + money(T[id].held) + ' held, not charged' : (id === 'premium' ? 'No hold, no deposit' : 'Nothing held — your card is saved'); };
var bseg = function(T){ return '<div class="dp-bseg" role="radiogroup" aria-label="Cover">' + ['deposit', 'premium'].map(function(o){ var on = st.choice === o; return '<button type="button" role="radio" aria-checked="' + on + '" class="dp-bsb' + (on ? ' on' : '') + '" data-dp="pick" data-v="' + o + '">' + T[o].name + (o === 'premium' ? '<em>Recommended</em>' : '') + '</button>'; }).join('') + '</div>'; };
var boxFoot = function(T){ return '<div class="dp-bft"><div class="dp-bact"><button type="button" class="tx-go tx-go-w" data-dp="go">Confirm and continue</button>' + (!T.c.req ? '<button type="button" class="dp-tl" data-dp="skip">Continue without protection</button>' : '') + '</div><p>This property requires one of the two. You can change this later from the cart, until you pay.</p></div>'; };
/* V10 · Una caja: el selector, el número y lo esencial, todo dentro del cuadro azul */
var v10 = function(T){
  if (!st.choice) set('deposit');
  var id = st.choice;
  return '<div class="dp-bx dp-bx10">' + bseg(T)
    + '<div class="dp-bbig"><small>Charged today</small><b>' + money(T[id].charged) + '</b><span>' + heldTxt(T, id) + '</span></div>'
    + '<ul class="dp-bfl">' + T[id].facts.map(function(f){ return '<li>' + ic(/Non-refundable|fee is charged/.test(f) ? 'info' : 'chk', 14) + f + '</li>'; }).join('') + '</ul>' + boxFoot(T) + '</div>';
};
/* V15 · Cobrado vs retenido: dos contadores y una barra de tiempo que muestra cuánto dura cada cosa */
var v15 = function(T){
  if (!st.choice) set('deposit');
  var id = st.choice, c = T.c, o = T[id];
  var counters = '<div class="dp-cnt"><div><small>Charged today</small><b>' + money(o.charged) + '</b><span>' + (id === 'premium' ? 'Non-refundable' : (c.fee ? 'Deposit service fee' : 'Nothing')) + '</span></div><div class="' + (o.held ? 'held' : 'none') + '"><small>Held on your card</small><b>' + (o.held ? money(o.held) : '—') + '</b><span>' + (o.held ? 'Not charged' : (id === 'premium' ? 'No hold' : 'Card saved')) + '</span></div></div>';
  var nodes = id === 'premium' || !c.hold ? ['Today', 'Check-in', 'Check-out'] : ['Today', 'Check-in', 'Check-out', '+' + c.rel + (c.rel === 1 ? ' day' : ' days')];
  var seg = id === 'premium' ? { from: 1, to: 2, cls: 'cov', t: 'Covered up to ' + money(LIMIT) } : (c.hold ? { from: 0, to: 3, cls: 'hold', t: money(AUTH) + ' held — released ' + T.relTxt } : { from: 0, to: 2, cls: 'saved', t: 'Card saved — charged only if damage is reported' });
  var n = nodes.length;
  var bar = '<div class="dp-tb" style="--n:' + n + '"><div class="dp-tbl"><i class="dp-tbs ' + seg.cls + '" style="left:' + (seg.from / (n - 1) * 100) + '%;width:' + ((seg.to - seg.from) / (n - 1) * 100) + '%"></i>' + nodes.map(function(x, i){ return '<i class="dp-tbn" style="left:' + (i / (n - 1) * 100) + '%"></i>'; }).join('') + '</div><div class="dp-tbx">' + nodes.map(function(x, i){ return '<span style="left:' + (i / (n - 1) * 100) + '%">' + x + '</span>'; }).join('') + '</div><p class="dp-tbt ' + seg.cls + '">' + seg.t + '</p></div>';
  return '<div class="dp-bx dp-bx15">' + bseg(T) + counters + '<span class="dp-bey">How long it lasts</span>' + bar + boxFoot(T) + '</div>';
};

/* V16 · Mix V15 + V4: la caja de V15 (selector + cobrado / retenido) con la línea de tiempo vertical de V4; la línea se colorea mientras dura cada cosa */
var v16 = function(T){
  if (!st.choice) set('deposit');
  var id = st.choice, c = T.c, o = T[id];
  var counters = '<div class="dp-cnt"><div><small>Charged today</small><b>' + money(o.charged) + '</b><span>' + (id === 'premium' ? 'Non-refundable' : (c.fee ? 'Deposit service fee' : 'Nothing')) + '</span></div><div class="' + (o.held ? 'held' : 'none') + '"><small>Held on your card</small><b>' + (o.held ? money(o.held) : '—') + '</b><span>' + (o.held ? 'Not charged' : (id === 'premium' ? 'No hold' : 'Card saved')) + '</span></div></div>';
  var steps = id === 'premium'
    ? [['bank', 'Today', 'You pay ' + money(PREM) + ' once', 'Charged now. Non-refundable.'], ['key', 'Check-in', 'You’re covered', 'Accidental damage up to ' + money(LIMIT) + ' is handled by the damage protection program.'], ['out', 'Check-out', 'If something broke', 'Your host reports it to the program within 14 days.'], ['hour', 'After your stay', 'Nothing else to pay', 'No deposit, no card on file for this.']]
    : (c.hold
      ? [['card', 'Today', money(AUTH) + ' held on your card', 'Blocked, not charged.' + (c.fee ? ' The ' + money(FEE) + ' service fee is charged separately.' : '')], ['key', 'During your stay', 'Your bank may renew the hold', 'Holds last 7 days and renew automatically (up to 30), sometimes with a notice.'], ['out', 'Check-out', 'The property checks the stay', 'Only if it reports damage can the deposit be charged (up to ' + money(AUTH) + ').'], ['hour', T.relTxt.charAt(0).toUpperCase() + T.relTxt.slice(1), 'The hold is released', 'It can’t be charged after this.']]
      : [['card', 'Today', 'Your card is saved', 'Nothing is held or charged.' + (c.fee ? ' The ' + money(FEE) + ' service fee is charged separately.' : '')], ['key', 'During your stay', 'Stay as usual', 'Your card limit stays fully available.'], ['out', 'Check-out', 'The property checks the stay', 'Only if it reports damage can up to ' + money(AUTH) + ' be charged.'], ['hour', 'After your stay', 'Nothing else', 'If no damage is reported, nothing is ever charged.']]);
  var seg = id === 'premium' ? { from: 1, to: 2, cls: 'cov', t: 'Covered up to ' + money(LIMIT) + ' while you stay' } : (c.hold ? { from: 0, to: 3, cls: 'hold', t: money(AUTH) + ' held — released ' + T.relTxt } : { from: 0, to: 2, cls: 'saved', t: 'Card saved — charged only if damage is reported' });
  var tl = '<ol class="dp-mtl">' + steps.map(function(s, i){ var inSeg = i >= seg.from && i <= seg.to, line = i >= seg.from && i < seg.to;
    return '<li class="' + (inSeg ? 'in ' + seg.cls : '') + (line ? ' ln' : '') + '"><span class="dp-mti">' + ic(s[0], 16) + '</span><span class="dp-mtt"><small>' + s[1] + '</small><b>' + s[2] + '</b><span>' + s[3] + '</span></span></li>'; }).join('') + '</ol>';
  return '<div class="dp-bx dp-bx16">' + bseg(T) + counters + '<span class="dp-bey">What happens to your money</span>' + tl + '<p class="dp-tbt ' + seg.cls + '">' + seg.t + '</p>' + boxFoot(T) + '</div>';
};
var VIEWS = { '10': v10, '15': v15, '16': v16 };

/* ---------- Vela (solo carril de escritorio) ---------- */
var railLab = null;
var velaRail = function(v, T){
  var as = document.querySelector('aside[data-slot="assistant-panel"]'); if (!as) return;
  var intro = as.querySelector(':scope > p');
  if (railLab === null) railLab = (as.querySelector(':scope > section > span') || {}).className || '';
  [].forEach.call(as.querySelectorAll(':scope > section[data-dp]'), function(s){ s.remove(); });
  [].forEach.call(as.querySelectorAll(':scope > section:not([data-dp])'), function(s){ s.style.display = 'none'; }); as.style.overflowY = 'auto';
  var trad = vela() === '0', q = qaList(T), lab = '<span class="' + railLab + '">' + (trad ? 'Questions' : 'Ask Vela') + '</span>';
  if (intro) intro.textContent = trad ? 'The questions guests ask most before choosing.' : 'Ask me anything about the deposit. These are the questions guests ask most.';
  var s = document.createElement('section'); s.className = 'flex flex-col'; s.setAttribute('data-dp', '1');
  if (trad) s.innerHTML = lab + '<div class="dp-vfq">' + q.map(function(o, i){ var on = st.faq === i; return '<div class="dp-vfi' + (on ? ' open' : '') + '"><button type="button" data-dp="faq" data-v="' + i + '" aria-expanded="' + on + '">' + o.t + ic('down', 16) + '</button>' + (on ? '<p>' + o.a + '</p>' : '') + '</div>'; }).join('') + '</div>';
  else { if (st.ask >= q.length) st.ask = 0; var f = q[st.ask];
    s.innerHTML = lab + '<div class="dp-rb t2-rb"><div class="vc"><div class="vc-chat" aria-live="polite"><div class="vc-q">' + f.t + '</div><div class="vc-a"><span class="vc-av">' + ic('spark', 12) + '</span><div>' + f.a + '</div></div></div><span class="vc-lb">Suggested</span><div class="vc-chips">' + q.map(function(o, i){ return '<button type="button" class="vc-chip' + (i === st.ask ? ' on' : '') + '" data-dp="ask" data-v="' + i + '">' + o.t + '</button>'; }).join('') + '</div></div></div>'; }
  as.appendChild(s);
};

/* ---------- montaje ---------- */
var root = null;
var render = function(){
  var v = ver(), h1 = document.querySelector('h1'), T = TX(); if (!h1) return false;
  var c = h1.closest('[class*="max-w-[640px]"]') || h1.parentElement.parentElement; if (!c) return false;
  var dock = document.querySelector('[data-slot="cta-dock"]');
  if (!root || !root.parentNode) { root = document.createElement('div'); root.id = 'dp-root'; c.appendChild(root); }
  [].forEach.call(c.children, function(k){ if (k !== root) k.classList.add('dp-orig'); }); if (dock) dock.classList.add('dp-orig');
  var ae = document.activeElement, f = ae && ae.getAttribute && ae.getAttribute('data-dp'), fv = ae && ae.getAttribute && ae.getAttribute('data-v'), sy = window.scrollY;
  root.className = 'dp dp-v' + v;
  root.innerHTML = head() + '<div class="dp-body">' + VIEWS[v](T) + mobDet(T) + '</div><div class="dp-cta">' + cta(T) + '</div><div class="dp-dock">' + cta(T) + '</div>';
  document.documentElement.setAttribute('data-dpv', v);
  if (f && f !== 'go' && f !== 'skip') { var el = root.querySelector('[data-dp="' + f + '"]' + (fv !== null ? '[data-v="' + fv + '"]' : '')); if (el && !el.disabled) { try { el.focus({ preventScroll: true }); } catch (e) {} } }
  velaRail(v, T);
  window.scrollTo(0, sy); return true;
};
var go = function(c){ set(c); location.href = 'cart.' + W + '.html' + (EMBED ? '?embed=1' : ''); };
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#dp-root [data-dp], aside[data-slot="assistant-panel"] [data-dp]'); if (!b) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  var a = b.getAttribute('data-dp'), v = b.getAttribute('data-v');
  if (a === 'go') { if (st.choice) go(st.choice); return; }
  if (a === 'withprot') { go('premium'); return; }
  if (a === 'skip') { LSset('replica-dep-choice', 'none'); go(''); return; }
  if (a === 'pick') set(v); else if (a === 'tg') st.open[v] = !st.open[v];
  else if (a === 'ask') st.ask = parseInt(v, 10);
  else if (a === 'faq') st.faq = st.faq === parseInt(v, 10) ? -1 : parseInt(v, 10);
  render();
}, true);
/* ---------- controles de página ---------- */
var seg = function(list, cur, attr, onPick){ var d = document.createElement('div'); d.className = 'rail-switch';
  d.innerHTML = list.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === cur ? ' on' : '') + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[' + attr + ']'); if (!b) return; e.preventDefault(); e.stopPropagation(); onPick(b.getAttribute(attr)); [].forEach.call(d.querySelectorAll('[' + attr + ']'), function(x){ x.classList.toggle('on', x === b); }); render(); }, true); return d; };
var addCtl = function(){ var n = 0, t = setInterval(function(){ if (!window.__repPanel) { if (++n > 40) clearInterval(t); return; } clearInterval(t);
  window.__repPanel.add('Sección de depósito', seg(VARS, ver(), 'data-dpc', function(v){ LSset('replica-depsec', v); }), 26);
  window.__repPanel.add('Protección obligatoria', seg([['0', 'No (opcional)'], ['1', 'Sí']], LSget('replica-prot-required', '0'), 'data-dpq', function(v){ LSset('replica-prot-required', v); }), 26.1);
  window.__repPanel.add('Liberación de la retención', seg([['1', '1 día'], ['3', '3 días'], ['7', '7 días'], ['14', '14 días']], LSget('replica-dep-release', '7'), 'data-dpr', function(v){ LSset('replica-dep-release', v); }), 26.2);
}, 150); };
window.addEventListener('storage', function(e){ if (!e.key || /^replica-(depsec|deposit-type|ext-fees|dep-release|prot-required|comp-)/.test(e.key)) render(); });
['replica-dep-change', 'replica-fee-change', 'replica-pay-change'].forEach(function(ev){ window.addEventListener(ev, render); });   /* «Tipo de depósito» y «Comisiones externas» de Ajustes de la reserva */
var boot = function(){ var n = 0, t = setInterval(function(){ if (render() || ++n > 40) clearInterval(t); }, 120); addCtl(); setInterval(function(){ if (!document.getElementById('dp-root')) render(); }, 800); };
if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
