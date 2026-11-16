/* =====================================================================================
   Deal propio del anfitrión (upselling) · pantallas alrededor del deal: upsell-list · upsell-empty · upsell-mine
   - upsell-list · «Extras»: todos los extras que publica el anfitrión para la reserva, con filtros por momento del viaje,
     cómo se confirma cada uno (al momento o lo confirma el anfitrión) y su estado si ya se pidió o se compró.
     Al tocar uno se abre su deal (upsell-detail) con ese extra y su forma de confirmación.
   - upsell-empty · el anfitrión no ha publicado extras para esta reserva.
   - upsell-mine · «My extras»: lo que el huésped ya pidió o compró. Casos (?mc= o localStorage replica-ups-mc):
       wait      · solicitud esperando al anfitrión (importe retenido, sin cobrar) con «Cancel request»
       cancel    · la hoja «Cancel this request?» abierta
       cancelled · solicitud cancelada por el huésped (retención liberada)
       declined  · el anfitrión no la confirmó: su mensaje, retención liberada y plan B (otra hora libre)
     Siempre hay además una compra confirmada (cesta de bienvenida) para ver las dos cosas juntas.
     Una retención nunca se suma a lo pagado: cada extra muestra su propio importe y su estado, sin total común.
   Usa los datos y ayudas de upsell.js (window.__UPS), que se carga antes y no pinta nada en estas pantallas.
   ===================================================================================== */
(function(){
'use strict';
var U = window.__UPS; if (!U) return;
var SC = U.SC; if (['list', 'empty', 'mine'].indexOf(SC) < 0) return;
var TYPES = U.TYPES, STAY = U.STAY, ic = U.ic, esc = U.esc, eur = U.eur, LS = U.LS, desk = U.desk, EXT = U.EXT;
var Q = new URLSearchParams(location.search);
function opt(k, list, d, qk){ var u = qk && Q.get(qk); if (u && list.indexOf(u) > -1) LS.set(k, u); var v = LS.get(k, d); return list.indexOf(v) > -1 ? v : d; }
var MC = opt('mc', ['wait', 'cancel', 'cancelled', 'declined'], 'wait', 'mc');
var HOLD = LS.get('charge', 'hold') !== 'charge';
var IMG = U.IMG;
/* cómo se confirma cada extra en la lista (el deal abre con esa confirmación) y en qué momento del viaje va */
var LANE = { early: 'approval', late: 'approval', parking: 'auto', transfer: 'auto', basket: 'auto' };
var WHEN = { early: 'arrive', transfer: 'arrive', basket: 'arrive', parking: 'stay', late: 'leave' };
var FIL = [['all', 'All'], ['arrive', 'Arrival'], ['stay', 'During your stay'], ['leave', 'Departure']];
var UNIT_S = { fixed: '', guest: ' per guest', night: ' per night', gn: ' per guest · night', free: '' };
var P2 = { left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-3-6-3-6 0s4 0 6 0c2 0 6 3 6 0s-4-3-6 0"/>' };
function ic2(n){ return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P2[n] + '</svg>'; }
var REQ = { type: 'early', slot: '12:00', alt: '13:00', amount: 25 };          /* la solicitud de «My extras» */
var BUY = { type: 'basket', guests: 2, amount: 36 };                            /* la compra confirmada */

/* ---------- estado de cada extra según «My extras» ---------- */
function stateOf(k){
  if (k === BUY.type) return ['ok', 'Added to your stay'];
  if (k === REQ.type) return MC === 'declined' ? ['no', 'Not confirmed'] : MC === 'cancelled' ? null : ['wait', 'Waiting for ' + STAY.host];
  return null; }
function chip(s){ return s ? '<span class="uh-st ' + s[0] + '">' + ic(s[0] === 'ok' ? 'chk' : s[0] === 'wait' ? 'clock' : 'x') + s[1] + '</span>' : ''; }
function lane(k){ return LANE[k] === 'approval' ? '<span class="uh-ln">' + ic2('user') + STAY.host + ' confirms it</span>' : '<span class="uh-ln">' + ic2('bolt') + 'Confirmed instantly</span>'; }
function price(k){ var t = TYPES[k]; return '<b>' + eur(t.base) + '</b><small>' + UNIT_S[t.unit] + '</small>'; }

/* ---------- upsell-list · Extras ---------- */
var fil = opt('fil', FIL.map(function(f){ return f[0]; }), 'all');
function mineCount(){ return MC === 'cancelled' ? 1 : 2; }
function list(){
  var ks = Object.keys(TYPES).filter(function(k){ return fil === 'all' || WHEN[k] === fil; });
  var pend = MC === 'wait' || MC === 'cancel', upd = MC === 'declined';
  return '<div class="uh-host"><span class="uh-av">M</span><div><b>Extras from ' + STAY.host + '</b><small>Your host at ' + STAY.prop + ' offers these for your stay, ' + STAY.arrive + ' – ' + STAY.leave + '. Some are confirmed instantly, others ' + STAY.host + ' confirms first.</small></div></div>'
    + '<button type="button" class="uh-mine" data-uh-go="mine"><span class="uh-mi">' + ic('card') + '</span><span><b>My extras</b><small>' + (pend ? '1 request waiting · 1 added' : upd ? STAY.host + ' answered your request' : '1 added to your stay') + '</small></span>' + (pend || upd ? '<em class="' + (upd ? 'no' : '') + '">' + (upd ? 'New' : mineCount()) + '</em>' : '') + ic2('right') + '</button>'
    + '<div class="uh-fil" role="group" aria-label="Filter extras">' + FIL.map(function(f){ return '<button type="button" data-uh-fil="' + f[0] + '" aria-pressed="' + (fil === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>'
    + '<div class="uh-grid">' + ks.map(function(k){ var t = TYPES[k], s = stateOf(k);
      return '<button type="button" class="uh-card" data-uh-open="' + k + '"><span class="uh-ph"><img src="' + IMG + t.img + '" alt=""><i>' + esc(t.chip) + '</i></span>'
        + '<span class="uh-bd"><b class="uh-n">' + esc(t.n) + '</b><small class="uh-p">' + esc(t.pitch) + '</small>'
        + (s ? chip(s) : lane(k)) + '<span class="uh-pr">' + price(k) + '<span class="uh-go">' + (s && s[0] === 'ok' ? 'See' : 'View') + ic2('right') + '</span></span></span></button>'; }).join('') + '</div>'
    + '<p class="uh-foot">Extras are offered and provided by ' + STAY.host + '. Each one is paid on its own, apart from your booking.</p>'; }

/* ---------- upsell-empty ---------- */
function empty(){
  return '<div class="uh-empty"><span class="uh-eic">' + ic2('gift') + '</span><h2>No extras for this stay yet</h2>'
    + '<p>' + STAY.host + ' hasn’t added any extras for your dates. Need something specific, like an earlier arrival, a cot or a ride from the airport? Ask ' + STAY.host + ', hosts can often arrange it.</p></div>'; }

/* ---------- upsell-mine · My extras ---------- */
function row(k, sub){ var t = TYPES[k]; return '<div class="uh-it"><img src="' + IMG + t.img + '" alt=""><span><b>' + esc(t.n) + '</b><small>' + esc(sub) + '</small></span></div>'; }
function reqCard(){ var t = TYPES[REQ.type], e = eur(REQ.amount), sub = 'Check in at ' + REQ.slot + ' · ' + STAY.arrive;
  if (MC === 'cancelled') return '<div class="uh-box"><div class="uh-bh">' + row(REQ.type, sub) + chip(['mute', 'Cancelled']) + '</div>'
    + '<p class="uh-msg">You cancelled this request, so ' + STAY.host + ' won’t see it. ' + (HOLD ? 'The ' + e + ' hold on your card was released. You weren’t charged.' : 'We’ve refunded ' + e + ' to your card. Banks take 5–10 days to show it.') + '</p>'
    + '<button type="button" class="ups-cta ghost full" data-uh-again="' + REQ.slot + '">Request it again</button></div>';
  if (MC === 'declined') return '<div class="uh-box"><div class="uh-bh">' + row(REQ.type, sub) + chip(['no', 'Not confirmed']) + '</div>'
    + '<blockquote class="uh-q"><p>“I have guests leaving that morning, so the earliest I can have the house ready is ' + REQ.alt + '. Sorry!”</p><cite><span class="uh-av s">M</span>' + STAY.host + ' · today, 09:05</cite></blockquote>'
    + '<div class="ups-info ok">' + ic('chk') + '<div>' + (HOLD ? '<b>The ' + e + ' hold was released.</b> You weren’t charged.' : '<b>We’ve refunded ' + e + '.</b> Banks take 5–10 days to show it.') + '</div></div>'
    + '<div class="uh-alt"><span><small>Still free on your arrival day</small><b>' + esc(t.n) + ' at ' + REQ.alt + '</b><small>' + e + ' · ' + STAY.host + ' confirms it</small></span><button type="button" class="ups-cta" data-uh-again="' + REQ.alt + '">Request ' + REQ.alt + '</button></div></div>';
  return '<div class="uh-box"><div class="uh-bh">' + row(REQ.type, sub) + chip(['wait', 'Waiting']) + '</div>'
    + '<ol class="ups-tline">'
    + '<li class="done"><span class="dot">' + ic('chk') + '</span><div><b>Request sent</b><small>Today, 10:24 · ' + (HOLD ? e + ' on hold on Visa ···· 4242, not charged' : e + ' paid with Visa ···· 4242') + '</small></div></li>'
    + '<li class="now"><span class="dot">' + ic('clock') + '</span><div><b>' + STAY.host + ' is reviewing it</b><small>Hosts usually answer within a few hours</small></div></li>'
    + '<li><span class="dot">' + ic('msg') + '</span><div><b>You get the answer</b><small>' + (HOLD ? 'Charged only if ' + STAY.host + ' confirms. If not, the hold is released.' : 'Refunded in full if ' + STAY.host + ' can’t confirm.') + '</small></div></li></ol>'
    + '<p class="uh-msg">We’ll email you and let you know here when ' + STAY.host + ' answers.</p>'
    + '<button type="button" class="ups-cta ghost full" data-uh-mc="cancel">Cancel request</button></div>'; }
function buyCard(){ return '<div class="uh-box"><div class="uh-bh">' + row(BUY.type, BUY.guests + ' guests · ready when you arrive, ' + STAY.arrive) + chip(['ok', 'Confirmed']) + '</div>'
    + '<p class="uh-msg">Paid ' + eur(BUY.amount) + ' with Visa ···· 4242 on Mon 16 Nov. Receipt sent to your email.</p></div>'; }
function mine(){
  var r = MC === 'declined' ? 'Answered by ' + STAY.host : MC === 'cancelled' ? 'Cancelled' : 'Waiting for ' + STAY.host;
  return '<p class="uh-lede">Everything you’ve requested or added for your stay at ' + STAY.prop + '.</p>'
    + '<h3 class="uh-h">' + r + '</h3>' + reqCard()
    + '<h3 class="uh-h">Added to your stay</h3>' + buyCard(); }
function sheetCancel(){ var e = eur(REQ.amount);
  return '<div class="ups-sh-h"><h3>Cancel this request?</h3></div><div class="ups-sh-b"><p class="uh-sp">' + STAY.host + ' won’t see your early check-in request anymore. '
    + (HOLD ? 'The ' + e + ' hold is released and you’re not charged.' : 'We refund the ' + e + ' to your card. Banks take 5–10 days to show it.')
    + ' You can request it again until Tue 24 Nov, 15:00.</p></div>'
    + '<div class="ups-sh-f uh-sf"><button type="button" class="ups-cta full" data-uh-mc="cancelled">Cancel request</button><button type="button" class="ups-cta ghost full" data-uh-mc="wait">Keep waiting</button></div>'; }

/* ---------- montaje ---------- */
var mount = null, dockEl = null, ov = null;
function title(s){ [].forEach.call(document.querySelectorAll('header span, header h1, header p, header b'), function(e){ if (e.children.length === 0 && (e.getAttribute('data-ups-t') || /^(Extras|Your Payments)$/.test(e.textContent.trim()))) { e.setAttribute('data-ups-t', '1'); e.textContent = s; } }); }
function buy(){ if (SC === 'list') return ''; return SC === 'empty' ? '<div class="uh-two"><button type="button" class="ups-cta full" data-uh-go="home">Back to your stay</button></div>' : '<div class="uh-two"><button type="button" class="ups-cta full" data-uh-go="list">See more extras</button></div>'; }
function render(){
  document.documentElement.setAttribute('data-ups', 'hub ' + SC);
  title(SC === 'mine' ? 'My extras' : 'Extras');
  var body = SC === 'list' ? list() : SC === 'empty' ? empty() : mine(), b = buy();
  mount.innerHTML = '<div class="ups uh uh-sc-' + SC + '">' + body + (desk && b ? '<div class="ups-dk">' + b + '</div>' : '') + '</div>';
  if (dockEl) { var w = dockEl.querySelector('.contents') || dockEl; if (desk || !b) dockEl.style.display = 'none'; else { dockEl.style.display = ''; w.innerHTML = '<div class="ups-dock ups-ov">' + b + '</div>'; } }
  if (ov) { ov.remove(); ov = null; } document.documentElement.classList.remove('ups-lock');
  if (SC === 'mine' && MC === 'cancel') { ov = document.createElement('div'); ov.className = 'ups-ov'; ov.innerHTML = '<div class="ups-dim" data-uh-mc="wait"></div><div class="ups-sheet" role="dialog" aria-modal="true" aria-label="Cancel this request?">' + sheetCancel() + '</div>'; document.body.appendChild(ov); document.documentElement.classList.add('ups-lock'); var f = ov.querySelector('.ups-cta'); if (f) f.focus({ preventScroll: true }); }
}
function go(s, q){ location.href = (s === 'home' ? 'home' : 'upsell-' + s) + EXT + (q ? '?' + q : ''); }
function onClick(e){
  var el = e.target.closest && e.target.closest('[data-uh-go],[data-uh-open],[data-uh-fil],[data-uh-mc],[data-uh-again]'); if (!el) return;
  e.preventDefault(); e.stopPropagation();
  if (el.hasAttribute('data-uh-go')) { go(el.getAttribute('data-uh-go')); return; }
  if (el.hasAttribute('data-uh-fil')) { fil = el.getAttribute('data-uh-fil'); LS.set('fil', fil); render(); return; }
  if (el.hasAttribute('data-uh-mc')) { var v = el.getAttribute('data-uh-mc'); LS.set('mc', v); MC = v; render(); history.replaceState(null, '', location.pathname + '?mc=' + v); return; }
  var k = el.getAttribute('data-uh-open') || REQ.type, t = TYPES[k];
  /* abre el deal de ese extra con su forma de confirmación; «Request it again» y el plan B llevan la hora ya elegida */
  LS.set('type', k); LS.set('unit', t.unit); LS.set('avail', t.avail); LS.set('confirm', LANE[k]);
  LS.set('state', k === BUY.type ? 'bought' : 'ok');
  var slot = el.getAttribute('data-uh-again'); LS.set('sel', slot ? JSON.stringify({ slot: slot, day: 0, nights: [0, 1], guests: STAY.guests, qty: 1, key: k + t.avail + t.unit }) : '');
  go('detail', 'cf=' + LANE[k] + '&st=' + (k === BUY.type ? 'bought' : 'ok'));
}
function init(){
  document.documentElement.classList.toggle('ups-desk', desk);
  var root = document.querySelector('.ups-view'), old = root && root.querySelector('.ups-old');
  if (old) { mount = document.createElement('div'); mount.className = 'ups-mount'; old.parentNode.insertBefore(mount, old); }
  dockEl = document.querySelector('[data-slot="cta-dock"]');
  if (dockEl) dockEl.classList.add('ivq-dock');
  if (!mount) return;
  render();
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov) { LS.set('mc', 'wait'); MC = 'wait'; render(); } });
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
