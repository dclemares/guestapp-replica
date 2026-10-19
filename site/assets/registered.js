(function(){
'use strict';
/* Página "Guest registered": se muestra al pulsar "Complete registration" con el formulario completo.
   Tres variantes por URL (?rv=1 hero · 2 resumen · 3 anillo) y dos estados (?rm=1 queda 1 huésped · ?rm=0 todos registrados). ?gn= nombre del huésped. */
var Q = new URLSearchParams(location.search), html = document.documentElement;
var DK = window.matchMedia('(min-width:1025px)').matches, XS = DK ? '.d.html' : '.m.html';   /* escritorio: mismas pantallas con sufijo .d */
var RV = Q.get('rv'); if (['1', '2', '3'].indexOf(RV) < 0) RV = '1';
/* qué queda por hacer: both (huéspedes y pagos) · guests · payments · none (reserva completa); se recuerda */
var WN = Q.get('wn'); try { if (!WN) WN = localStorage.getItem('rep-wn'); } catch (e) {}
if (['both', 'guests', 'payments', 'none'].indexOf(WN) < 0) WN = 'both';
var ECI = Q.get('eci'), LCO = Q.get('lco'); try { if (ECI) localStorage.setItem('rep-eci', ECI); else ECI = localStorage.getItem('rep-eci'); if (LCO) localStorage.setItem('rep-lco', LCO); else LCO = localStorage.getItem('rep-lco'); } catch (e) {}
ECI = ECI !== '0'; LCO = LCO !== '0';   /* el anfitrión ofrece early check-in / late check-out en esta reserva */
var MN = Q.get('mn'); try { if (!MN) MN = localStorage.getItem('rep-mn'); } catch (e) {}
var MINORS_ON = true; try { MINORS_ON = localStorage.getItem('replica-minors') !== '0'; } catch (e) {}   /* Controles del resumen → Menores */
MN = MN === '1' && MINORS_ON;   /* hay un menor pendiente de registrar (solo si la reserva tiene menores) */
var TIGHT_NEEDED = false;
var RM = (WN === 'both' || WN === 'guests') ? 1 : 0, PAY = (WN === 'both' || WN === 'payments');
var SID = (window.__SCREEN && window.__SCREEN.id) || '', SR = Q.get('sr') === 'fail' ? 'fail' : 'ok';   /* sr: resultado simulado del envío */
var NAME = (Q.get('gn') || '').trim() || 'Test Guest Demo';
var TOTAL = 2, DONE = RM ? 1 : 2;
function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var I = {
  ok: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 26), okS: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16),
  chev: ic('<path d="m9 18 6-6-6-6"/>', 20), user: ic('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>', 20),
  userp: ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>', 20),
  card: ic('<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>', 20), clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 16)
};
var LEFT = TOTAL - DONE;
var title = WN === 'none' ? esc(NAME) + ' is fully registered' : (LEFT ? esc(NAME) + ' is now registered' : 'All guests are registered');
var sub = DONE + ' of ' + TOTAL + ' guests completed' + (LEFT ? ' · ' + LEFT + ' guest left' : '');
var IVON = (function(){ var q = Q.get('iv'); if (q === '0' || q === '1') return q === '1'; try { return localStorage.getItem('rep-iv') !== '0'; } catch (e) { return true; } })(), FORMTO = IVON ? 'iv-intro-f' : 'g2-form-empty';
var NEXT = LEFT ? { to: FORMTO, t: 'Register Guest 2', d: 'Fill in now or send them a link', cta: 'Register next guest' } : { to: 'cart', t: 'Review your payments', d: 'Pay what\'s pending to finish your check-in', cta: 'Continue to payments' };
function btn(cls, to, label){ return '<button type="button" class="rg-b ' + cls + '" data-to="' + to + '">' + label + '</button>'; }
var DEAL = { kicker: 'Early check-in', t: 'Arrive before 15:00?', d: 'Drop your bags and settle in as soon as you land.', cta: 'Add · from €25', img: '../assets/vela/deals/room.jpg' };
function dealBtn(cls){ return '<button type="button" class="rg-b ' + cls + '" data-to="offers-all">' + DEAL.cta + '</button>'; }
function progress(){ var s = ''; for (var i = 0; i < TOTAL; i++) s += '<i class="' + (i < DONE ? 'on' : '') + '"></i>'; return '<div class="rg-seg" role="img" aria-label="' + DONE + ' of ' + TOTAL + ' guests completed">' + s + '</div>'; }
function dock(){ return '<div class="rg-dock">' + btn('pri', 'home', 'Back to home') + '</div>'; }


/* ---- deals ("For your arrival"): uno (como el de la referencia) o varios; control "Deal" ---- */
html.setAttribute('data-cc', 'blue');   /* tarjeta azul definitiva (la del resumen) */
var DS = Q.get('ds'); try { if (!DS) DS = localStorage.getItem('rep-ds'); } catch (e) {}
DS = DS === '2' ? '2' : '1';
if (DS === '2' || (MN && RM)) html.classList.add('rg-tight');   /* compacta para que siga sin haber scroll */   /* 1: deal como la referencia · 2: tarjetas de deals de la home */
var DL = Q.get('dl'); try { if (!DL) DL = localStorage.getItem('rep-dl'); } catch (e) {}
if (['early', 'esim', 'transfer', 'tour', 'multi'].indexOf(DL) < 0) DL = 'early';
var SIM = '<svg viewBox="0 0 96 96" width="76" height="76" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="26" y="10" width="34" height="62" rx="8" fill="rgba(255,255,255,.18)"/><path d="M38 16h10"/><rect x="34" y="30" width="18" height="14" rx="3"/><path d="M34 37h18M43 30v14"/><text x="43" y="62" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-size="10" font-weight="800" fill="#fff" stroke="none">eSIM</text><path d="M66 24c5 4 5 12 0 16"/><path d="M72 18c9 7 9 23 0 30"/><path d="M78 12c13 10 13 34 0 44"/></svg>';
var DEALS = {
  early: { k: 'Early check-in', t: 'Arrive before 15:00?', cta: 'Add · from €25', img: '../assets/vela/deals/early-checkin.jpg' },
  esim: { k: 'eSIM', t: 'Activate your eSIM, no roaming', cta: 'Get · from €4.00', air: true },
  transfer: { k: 'Airport transfer', t: 'Skip the taxi queue', cta: 'Book · from €18', img: '../assets/vela/deals/private-transfer.jpg' },
  tour: { k: 'Free tour', t: 'Explore the city on foot', cta: 'Join · free', img: '../assets/vela/deals/tour-16x9.jpg' }
};
function dealItem(d, card){
  var media = d.img ? '<div class="rg-dm" style="background-image:url(' + d.img + ')"></div>'
    : '<div class="rg-dm air">' + SIM + '</div>';
  return '<div class="rg-dl' + (card ? ' vc' : '') + '">' + media + '<div class="rg-dx"><span class="rg-k">' + d.k + '</span><b>' + d.t + '</b><button type="button" class="rg-b pri sm" data-to="offers-all">' + d.cta + '</button></div></div>';
}
/* V2: los deals tal y como se ven en la home (componente <chekin-vela>: deals del host, banner de transfers, tours gratis y eSIM) */
var VITEM = {
  early: [{ type: 'deals-carousel', deals: [{ img: '../assets/vela/deals/room.jpg', title: 'Early check-in', sub: 'Access from 11:00', price: '€25' }] }],
  transfer: [{ type: 'ride', img: '../assets/vela/deals/transfer-van.jpg', kik: 'Private transfers', headline: 'Your ride is ready\nwhen you land', sub: 'Prebook shuttles, taxis and limousines.', from: 'Airport', to: 'Your stay', cta: 'Book your ride', sticker: 'PRE-\nBOOK' }],
  tour: [{ type: 'tour', img: '../assets/vela/deals/madrid4.jpg', kik: 'Walking tours', headline: 'Discover the city with local guides', sub: 'See the tours near your stay.', cta: 'Explore tours' }]
};
var ESIMBAR = '<div class="rp-esim" data-k="e"><span class="rp-esim__mark"><i></i><i></i></span><div class="rp-esim__t"><b>Activate your eSIM, no roaming</b><small>airalo · From €4.00</small></div><span class="rp-esim__tag">Sponsored</span><button type="button" class="rp-btn rp-btn--light">View plans</button></div>';
function velaBlock(k){
  var inner = k === 'esim' ? ESIMBAR : '<chekin-vela flat-text hide-header reco-title=""><script type="application/json">' + JSON.stringify(VITEM[k]).replace(/<\//g, '<\\/') + '</script></chekin-vela>';
  return '<section class="mob-offers rg-vl"><div class="rail-vela rail-multi" data-rail="actual" data-set="htfe"><div class="rv rv-actual">' + inner + '</div></div></section>';
}
function arrival(){
  var body;
  if (DS === '2') body = DL === 'multi' ? '<div class="rg-car rg-carv">' + ['transfer', 'tour', 'esim', 'early'].map(function(k){ return '<div class="rg-vs">' + velaBlock(k) + '</div>'; }).join('') + '</div>' : velaBlock(DL);
  else body = DL === 'multi' ? '<div class="rg-car">' + ['early', 'esim', 'transfer', 'tour'].map(function(k){ return dealItem(DEALS[k], true); }).join('') + '</div>' : dealItem(DEALS[DL], false);
  return '<h3 class="rg-t">For your arrival</h3>' + body;
}
function whatsNext(){
  if (WN === 'none') return '';   /* reserva completa: el mensaje va dentro de la tarjeta principal */
  var rows = '';
  if (RM) rows += '<div class="rg-row"><span class="rg-ri">' + I.userp + '</span><span class="rg-rt"><b>Register next guest</b><span>Fill in now or send them a link</span></span><button type="button" class="rg-cta" data-act="reg2">Add guest</button></div>';
  if (RM && MN) rows += '<div class="rg-row"><span class="rg-ri">' + I.user + '</span><span class="rg-rt"><b>Register minor guest</b><span>Fill in now or send them a link</span></span><button type="button" class="rg-cta" data-act="reg2m">Add minor</button></div>';
  if (PAY) rows += '<div class="rg-row"><span class="rg-ri">' + I.card + '</span><span class="rg-rt"><b>Go to pending payments</b><span>€15.75 due</span></span><button type="button" class="rg-cta" data-to="cart">Pay now</button></div>';
  return '<h3 class="rg-t">What\'s next</h3>' + rows;
}
function heroPanel(){ return WN === 'none' ? '<div class="rg-gl"><b>Your booking is complete</b><span>Registration and payments are done.</span></div>' : ''; }
function rest(){ return whatsNext() + arrival() + dock(); }

/* ---- hoja "Register Guest 2": rellenar ahora o compartir enlace ---- */
function sheet(who){
  who = who || 'Register next guest';
  if (document.querySelector('.rg-sheet')) return;
  var el = document.createElement('div'); el.className = 'rg-sheet';
  el.innerHTML = '<div class="rg-sbd" data-act="close"></div><div class="rg-sp" role="dialog" aria-modal="true" aria-label="' + who + '"><i class="rg-sg"></i><h2>' + who + '</h2><p>How do you want to add their details?</p>'
    + '<button type="button" class="rg-so" data-act="fill"><span class="rg-ri">' + ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 20) + '</span><span class="rg-rt"><b>Fill in now</b><span>Enter their details on this device</span></span>' + I.chev + '</button>'
    + '<button type="button" class="rg-so" data-act="share"><span class="rg-ri">' + ic('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>', 20) + '</span><span class="rg-rt"><b>Share a link</b><span>They complete it on their own phone</span></span>' + I.chev + '</button></div>';
  document.body.appendChild(el); requestAnimationFrame(function(){ el.classList.add('in'); });
}
document.addEventListener('click', function(e){
  var nv = e.target.closest && e.target.closest('.rg [data-to], header button[aria-label="Back"][data-to]');   /* navegación de esta página (botones, filas, deals y flecha atrás) */
  if (nv && !e.target.closest('[data-act]')) { e.preventDefault(); e.stopImmediatePropagation(); location.href = nv.getAttribute('data-to') + XS + (IVON && nv.getAttribute('data-to') === FORMTO ? '?ng=1' : ''); return; }   /* ng=1: la verificación es del siguiente huésped */
  var t = e.target.closest && e.target.closest('[data-act]'); if (!t) return;
  e.preventDefault(); e.stopImmediatePropagation();
  var a = t.getAttribute('data-act');
  if (a === 'reg2' || a === 'reg2m') { if (DK) location.href = (FORMTO === 'g2-form-empty' ? 'form-empty' : FORMTO) + XS + (IVON ? '?ng=1' : ''); else sheet(a === 'reg2' ? 'Register next guest' : 'Register minor guest'); }   /* escritorio: «Add guest» rellena directamente; el enlace va en Vela */
  else if (a === 'close') { var sh = document.querySelector('.rg-sheet'); if (sh) sh.parentNode.removeChild(sh); }
  else if (a === 'fill') location.href = (DK && FORMTO === 'g2-form-empty' ? 'form-empty' : FORMTO) + XS + (IVON ? '?ng=1' : '');
  else if (a === 'share') { if (window.__shareLink) window.__shareLink(t); }
}, true);

var V = {
  /* 1 · hero verde con progreso y siguiente paso */
  '1': function(){
    return '<section class="rg-hero"><span class="rg-ck">' + I.ok + '</span><h1>' + title + '</h1>' + (DK && WN !== 'none' ? '<p class="rg-hs">' + sub + '</p>' : '') + heroPanel() + '</section>' + rest();
  },
  /* 2 · resumen de huéspedes + banner azul del deal */
  '2': function(){
    var g1 = '<div class="rg-g done"><span class="rg-gi">' + I.user + '</span><span class="rg-rt"><b>' + esc(NAME) + '</b><span>Registered · details saved</span></span><span class="rg-chip">Done</span></div>';
    var g2 = LEFT ? '<button type="button" class="rg-g add" data-to="' + FORMTO + '"><span class="rg-gi">' + I.userp + '</span><span class="rg-rt"><b>Guest 2</b><span>Not added yet</span></span><span class="rg-link">Add guest</span></button>'
      : '<div class="rg-g done"><span class="rg-gi">' + I.user + '</span><span class="rg-rt"><b>Guest 2</b><span>Registered · details saved</span></span><span class="rg-chip">Done</span></div>';
    return '<header class="rg-h2"><span class="rg-ck sm">' + I.okS + '</span><span class="rg-k2">Registration submitted</span><h1>' + title + '</h1><p>Your host has what they need for ' + (LEFT ? 'this guest' : 'everyone') + '.</p></header>'
      + '<div class="rg-tt"><h3 class="rg-t">Guests</h3><span class="rg-frac">' + DONE + ' of ' + TOTAL + '</span></div><div class="rg-card">' + g1 + g2 + '</div>'
      + '<div class="rg-deal rg-d2"><span class="rg-k">' + DEAL.kicker + '</span><b>' + DEAL.t + '</b><span class="rg-dd">' + DEAL.d + '</span>' + dealBtn('wh') + '</div>'
      + dock();
  },
  /* 3 · anillo de progreso, siguiente paso y deal con foto */
  '3': function(){
    var R = 52, C = 2 * Math.PI * R, off = C * (1 - DONE / TOTAL);
    var ring = '<div class="rg-ring" role="img" aria-label="' + DONE + ' of ' + TOTAL + ' guests completed"><svg viewBox="0 0 120 120" width="132" height="132"><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#e5e6ee" stroke-width="9"/><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#37e08f" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg><span class="rg-rc">' + (LEFT ? '<b>' + DONE + '/' + TOTAL + '</b>' : I.ok) + '</span></div>';
    return '<section class="rg-c3">' + ring + '<h1>' + (LEFT ? 'Guest registered' : 'All guests registered') + '</h1><p>' + (LEFT ? esc(NAME) + ' is done · ' + LEFT + ' guest left' : 'Everyone\'s details are in. You\'re all set') + '</p></section>'
      + '<button type="button" class="rg-next" data-to="' + NEXT.to + '"><span class="rg-ri">' + (LEFT ? I.userp : I.card) + '</span><span class="rg-rt"><span class="rg-k">Next up</span><b>' + NEXT.t + '</b><span>' + NEXT.d + '</span></span>' + I.chev + '</button>'
      + '<div class="rg-deal rg-d3" style="background-image:linear-gradient(180deg,rgba(22,22,67,.3) 0%,rgba(22,22,67,.9) 100%),url(' + DEAL.img + ')"><span class="rg-k">' + DEAL.kicker + '</span><b>' + DEAL.t + '</b>' + dealBtn('wh sm') + '</div>'
      + '<div class="rg-dock two">' + btn('sec', 'home', 'Back to home') + btn('pri', NEXT.to, LEFT ? 'Register next guest' : 'Continue to payments') + '</div>';
  }
};


/* ---- pasillo "registrando": estado entre el formulario y el resultado ---- */
var FIRST = NAME.split(' ')[0];
var I2 = { shield: ic('<path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>', 16), x: ic('<path d="M18 6 6 18M6 6l12 12"/>', 16), warn: ic('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>', 30), retry: ic('<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>', 18) };
function processing(){
  var steps = [['Details sent'], ['Registering'], ['Confirmed']];
  return '<div class="rg-pw"><div class="rg-pring" data-st="run"><svg viewBox="0 0 140 140" width="148" height="148" aria-hidden="true"><circle class="trk" cx="70" cy="70" r="60"/><circle class="arc" cx="70" cy="70" r="60"/></svg>'
    + '<span class="rg-pi u">' + ic('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>', 40) + '</span><span class="rg-pi k">' + I.ok + '</span><span class="rg-pi e">' + I2.warn + '</span></div>'
    + '<h1 class="rg-ph" role="status" aria-live="polite">Registering ' + esc(FIRST) + '…</h1><p class="rg-ps">Just a moment, this only takes a few seconds.</p>'
    + '<ol class="rg-steps">' + steps.map(function(t, i){ return '<li data-i="' + i + '" class="pend"><span class="rg-sd"><i class="sp"></i><b class="ck">' + I.okS + '</b><b class="xx">' + I2.x + '</b></span><span class="rg-sl">' + t[0] + '</span></li>'; }).join('') + '</ol></div>'
    + '<p class="rg-pnote">' + I2.shield + 'Your details are saved on this device until we confirm</p>';
}
function failed(){
  return '<section class="rg-fail"><span class="rg-fk">' + I2.warn + '</span><h1>We couldn\'t register ' + esc(FIRST) + '</h1><p>Something went wrong on our side. Your details are saved on this device, nothing was lost.</p></section>'
    + '<h3 class="rg-t">What you can do</h3><button type="button" class="rg-row" data-to="g2-registering"><span class="rg-ri">' + I2.retry + '</span><span class="rg-rt"><b>Try again</b><span>It usually works the second time</span></span>' + I.chev + '</button>'
    + '<button type="button" class="rg-row" data-to="g2-form-filled"><span class="rg-ri">' + I.user + '</span><span class="rg-rt"><b>Review your details</b><span>Go back to the form and check them</span></span>' + I.chev + '</button>'
    + '<div class="rg-dock">' + btn('pri', 'g2-registering', 'Try again') + btn('sec', 'home', 'Back to home') + '</div>';
}

/* éxito: el anillo y el título suben y se convierten en la cabecera verde (FLIP con transform: sin saltos de layout);
   después aparecen "What's next" y "For your arrival" */
function settle(el){
  var d = el.ownerDocument, ring = el.querySelector('.rg-pring'), h = el.querySelector('.rg-ph'), pw = el.querySelector('.rg-pw');
  var br = el.querySelector('.dbk-row'); if (br) { br.style.visibility = ''; br.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 350, easing: 'ease-out', fill: 'backwards' }); }   /* escritorio: aparece el «Home /» de arriba */
  velaPanel();
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, T = calm ? 1 : 780, E = 'cubic-bezier(.22,.8,.2,1)';
  var r0 = { ring: ring.getBoundingClientRect(), h: h.getBoundingClientRect() };
  var ghosts = ['.rg-steps', '.rg-pnote', '.rg-ps', '.rg-ph'].map(function(q){ var n = el.querySelector(q), r = n.getBoundingClientRect(), g = n.cloneNode(true); g.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;margin:0;pointer-events:none;z-index:5;'; g.removeAttribute('id'); el.appendChild(g); return g; });
  var after = document.createElement('div'); after.className = 'rg-after'; after.innerHTML = rest(); el.appendChild(after);
  var bg = d.createElement('i'); bg.className = 'rg-bg'; pw.insertBefore(bg, pw.firstChild);
  h.innerHTML = title; if (heroPanel()) pw.insertAdjacentHTML('beforeend', heroPanel()); el.classList.add('rg-done'); html.setAttribute('data-rg', 'pd');
  if (window.__mobBar) window.__mobBar.sub('Completed');
  var r1 = { ring: ring.getBoundingClientRect(), h: h.getBoundingClientRect() };
  ring.animate([{ transformOrigin: '0 0', transform: 'translate(' + (r0.ring.left - r1.ring.left) + 'px,' + (r0.ring.top - r1.ring.top) + 'px) scale(' + (r0.ring.width / r1.ring.width) + ')' }, { transformOrigin: '0 0', transform: 'none' }], { duration: T, easing: E });
  h.animate([{ opacity: 0, transform: 'translateY(' + (r0.h.top - r1.h.top) + 'px)' }, { opacity: 0, transform: 'translateY(' + ((r0.h.top - r1.h.top) * .45) + 'px)', offset: .3 }, { opacity: 1, transform: 'none' }], { duration: T, easing: E });
  bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T * .8, easing: 'ease-out', delay: T * .15, fill: 'backwards' });
  ghosts.forEach(function(g){ var a = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: calm ? 1 : 260, easing: 'ease-out', fill: 'forwards' }); a.onfinish = function(){ if (g.parentNode) g.parentNode.removeChild(g); }; });
  [].forEach.call(after.children, function(c, i){ c.style.animationDelay = (calm ? 0 : .38 + i * .08) + 's'; });
}
function runProcessing(el){
  var ring = el.querySelector('.rg-pring'), li = [].slice.call(el.querySelectorAll('.rg-steps li')), h = el.querySelector('.rg-ph'), sp = el.querySelector('.rg-ps');
  function st(i, c){ li[i].className = c; }
  function go(to){ var p = new URLSearchParams(location.search); var keep = new URLSearchParams(); ['gn', 'rv', 'rm', 'sr'].forEach(function(k){ if (p.get(k)) keep.set(k, p.get(k)); }); location.replace(to + XS + (keep.toString() ? '?' + keep.toString() : '')); }
  st(0, 'act');
  setTimeout(function(){ st(0, 'done'); st(1, 'act'); }, 450);
  setTimeout(function(){
    if (SR === 'fail') { st(1, 'err'); ring.setAttribute('data-st', 'err'); h.textContent = 'Something went wrong'; sp.textContent = 'We couldn\'t finish registering ' + FIRST + '.'; setTimeout(function(){ go('g2-register-failed'); }, 900); }
    else { st(1, 'done'); st(2, 'act'); }
  }, 1700);
  if (SR !== 'fail') { setTimeout(function(){ st(2, 'done'); ring.setAttribute('data-st', 'ok'); h.textContent = FIRST + ' is registered'; sp.textContent = 'All set'; }, 2050); setTimeout(function(){ settle(el); }, 2750); }
}

/* escritorio: el «Home / …» va arriba, como en el resto de pantallas */
function backRow(hid){
  if (!DK) return '';
  return '<div class="dbk-row"' + (hid ? ' style="visibility:hidden"' : '') + '><button type="button" class="dbk-pill" data-dbk="Home" data-to="home" aria-label="Back to home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span>Back to home</span></button><i class="dbk-sep" aria-hidden="true">/</i><span class="dbk-eye">' + (SID === 'g2-register-failed' ? 'Registration' : 'Registration complete') + '</span></div>';
}
/* panel de Vela de la página de registrado (escritorio): qué queda por hacer, en lugar de los consejos del hub */
/* mientras se registra: el panel de Vela queda vacío, solo con un mensaje de espera */
function velaWait(){
  if (!DK) return; var n = 0;
  (function t(){ var asd = document.querySelector('aside[data-slot="assistant-panel"]'); if (!asd || !asd.querySelector('section')) { if (n++ < 30) setTimeout(t, 100); return; }
    if (asd.getAttribute('data-rgv')) return; asd.classList.add('rgv-wait'); var p = asd.querySelector(':scope > p'); if (p) p.textContent = 'We\'re registering you on the booking. Hold on a second and stay on this page.'; })();
}
/* ventanas de Vela: horas de entrada y salida, acceso a la propiedad y por qué hay que registrarse */
function vmodal(kind){
  if (document.querySelector('.fx-why')) return;
  var CLOCK = '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', KEY = '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M16 7l3 3"/>', OK = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', INFO = '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', TAG = '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>', LAW = '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>';
  var M = {
    times: { t: 'Check-in and check-out times', it: [[CLOCK, 'Your standard times are check-in from 15:00 and check-out until 11:00.'], [INFO, 'Your host offers ' + (ECI && LCO ? 'early check-in and late check-out' : ECI ? 'early check-in' : 'late check-out') + ' for this booking, so you could ' + (ECI && LCO ? 'arrive earlier or leave later' : ECI ? 'arrive earlier' : 'leave later') + ' than the standard times, subject to availability.'], [OK, 'Anything you add is confirmed before your stay.']], ctas: [].concat(ECI ? [['See early check-in', 'offers-all', 1]] : [], LCO ? [['See late check-out', 'offers-all', 1]] : []) },
    access: { t: 'When do I get access to the property?', it: [[KEY, 'Your host uses remote access, so there is no key handover: you receive your access codes or digital keys by email and in the app.'], [CLOCK, 'They are released from 15:00 on your check-in day' + (ECI ? ', or earlier if you add an early check-in.' : '.')], [OK, 'To receive them, ' + (PAY ? 'every guest needs to be registered and pending payments need to be settled.' : 'every guest needs to be registered.')]].concat(ECI ? [[TAG, 'Your host offers early check-in for this booking from €25, so you could get access earlier.']] : []), ctas: ECI ? [['Got it', null, 1], ['Add early check-in', 'offers-all', 1]] : null },
    why: { t: 'Why do I need to register?', it: [[LAW, 'As required by local law, all tourist accommodations must keep a record of their guests. This means we need a small amount of personal information from you.'], [CLOCK, 'Completing the online check-in before you arrive will save you time.'], [OK, 'We handle all personal data in line with the General Data Protection Regulation (GDPR). To learn more, please read our privacy policy.']], link: ['Read our Privacy Policy', '#'] }
  }[kind]; if (!M) return;
  var ov = document.createElement('div'); ov.className = 'fx-why'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'fx-why-t');
  ov.innerHTML = '<div class="fx-why-c"><button type="button" class="fx-why-x" aria-label="Close">' + ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20) + '</button><h2 id="fx-why-t">' + M.t + '</h2>'
    + M.it.map(function(x){ return '<div class="fx-why-i"><i>' + ic(x[0], 18) + '</i><p>' + x[1] + '</p></div>'; }).join('')
    + (M.link ? '<a class="fx-why-l" href="' + (M.link[1] === '#' ? '#' : M.link[1] + XS) + '">' + M.link[0] + ' ' + ic('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', 17) + '</a>' : '') + '<div class="fx-why-btns">' + (M.ctas || [['Got it', null, 1]]).map(function(c){ return '<button type="button" class="fx-why-b' + (c[2] ? '' : ' sec') + '"' + (c[1] ? ' data-go="' + c[1] + '"' : '') + '>' + c[0] + '</button>'; }).join('') + '</div></div>';
  document.body.appendChild(ov); requestAnimationFrame(function(){ ov.classList.add('in'); });
  var prev = document.activeElement;
  function close(){ ov.classList.remove('in'); document.removeEventListener('keydown', k, true); setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200); if (prev && prev.focus) prev.focus(); }
  function k(e){ if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', k, true);
  ov.addEventListener('click', function(e){ e.stopPropagation(); var gb = e.target.closest('.fx-why-b'); if (gb && gb.getAttribute('data-go')) { location.href = gb.getAttribute('data-go') + XS; return; } if (e.target === ov || e.target.closest('.fx-why-x, .fx-why-b')) close(); if (e.target.closest('.fx-why-l') && e.target.closest('.fx-why-l').getAttribute('href') === '#') e.preventDefault(); });
  ov.querySelector('.fx-why-b:not(.sec)') && ov.querySelector('.fx-why-b:not(.sec)').focus();
}
function velaPanel(){
  if (!DK) return;
  var n = 0; (function t(){
    var asd = document.querySelector('aside[data-slot="assistant-panel"]');
    if (!asd || !asd.querySelector('section')) { if (n++ < 30) setTimeout(t, 100); return; }
    if (asd.getAttribute('data-rgv')) return; asd.setAttribute('data-rgv', '1'); asd.classList.remove('rgv-wait');
    var secs = [].slice.call(asd.querySelectorAll(':scope > section')), gk = secs[0], qa = secs[1], pv = secs[2];
    var tile = gk.querySelector(':scope > div'), act = qa && qa.querySelector('[data-slot="assistant-panel-action"]');
    var intro = asd.querySelector(':scope > p');
    var failed = SID === 'g2-register-failed';
    if (intro) intro.textContent = failed ? 'Nothing was lost: your details are saved on this device. Try again, or go back and review them.' : (esc(FIRST) + ', you\'re registered. I can help you get ready for your arrival.');
    function row(ico, ttl, txt, tone){ var d = tile.cloneNode(true); var sp = d.querySelector('span'); if (sp && sp.querySelector('svg')) sp.querySelector('svg').outerHTML = ic(ico, 16); if (tone === 'ok' && sp) { sp.style.background = '#e3f7ec'; sp.style.color = '#17794b'; } d.querySelector('strong').textContent = ttl; d.querySelector('strong + span').textContent = txt; return d; }
    function section(src, title, rows){ var s = src.cloneNode(false); var h = src.querySelector(':scope > span').cloneNode(true); h.textContent = title; s.appendChild(h); rows.forEach(function(r){ s.appendChild(r); }); return s; }
    var P = { check: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>', plus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>', card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', redo: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>' };
    var out = [];
    if (!failed) {
      /* qué puede hacer Vela justo después de registrarse: preparar la llegada y aprovechar la reserva (upselling) */
      /* UI de Vela (la del producto): secciones con título (y «See all»), subtítulo y filas con icono, título, descripción y flecha */
      var CHV = ic('<path d="m9 18 6-6-6-6"/>', 16);
      function head(src, title, see){ var h = src.querySelector(':scope > span').cloneNode(true); h.textContent = title; if (see) { var a = document.createElement('span'); a.className = 'rv-see'; a.textContent = 'See all'; a.setAttribute('role', 'link'); a.tabIndex = 0; a.setAttribute('data-vto', see); h.appendChild(a); } return h; }
      function tile(ico, ttl, txt, to, act2, modal){ var b = document.createElement('button'); b.type = 'button'; b.className = 'rv-tile'; if (to) b.setAttribute('data-vto', to); if (act2) b.setAttribute('data-vact', act2); if (modal) b.setAttribute('data-vmodal', modal); b.innerHTML = (ico ? '<span class="rv-ti">' + ic(ico, 16) + '</span>' : '') + '<span class="rv-tx"><strong>' + ttl + '</strong><span>' + txt + '</span></span>' + CHV; return b; }
      function block(title, rows, o){ o = o || {}; var s = qa.cloneNode(false); s.appendChild(head(qa, title, o.see)); if (o.sub) { var p = document.createElement('p'); p.className = 'rv-sub'; p.textContent = o.sub; s.appendChild(p); } var w = document.createElement('div'); w.className = 'rv-list'; rows.forEach(function(r){ w.appendChild(r); }); s.appendChild(w); return s; }
      var CLK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', WIFI = '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>', DOC = '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', CAR = '<path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>', MAP = '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', LINK = '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>';
      var BOOK2 = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>';
      var RA = true; try { RA = localStorage.getItem('replica-remote-access') !== '0'; } catch (e) {}
      function pri(el, n){ el.setAttribute('data-pri', n); return el; }
      var eclTtl = ECI && LCO ? 'Can I arrive early or leave late?' : ECI ? 'Can I arrive early?' : 'Can I leave late?';
      var asks = [];
      if (ECI || LCO) asks.push(pri(tile(null, eclTtl, 'Check-in and check-out times for this stay', null, null, 'times'), 90));
      if (RA) asks.push(pri(tile(null, 'When do I get access to the property?', 'How and when you receive your keys or codes', null, null, 'access'), 80));
      asks.push(pri(tile(null, 'Why do I need to register?', 'What we use your details for', null, null, 'why'), 10));
      var GB = [[WIFI, 'Wi-Fi & access', 'Network, password, door code'], [DOC, 'House rules', 'Quiet hours, smoking, pets'], [MAP, 'Getting there', 'Directions and arrival tips'], [CAR, 'Parking', 'Where to park and how to get in']];
      var gbRows = GB.map(function(g, n){ return pri(tile(g[0], g[1], g[2]), 70 - n); });
      var gbSum = tile(BOOK2, GB.length + ' guidebooks for this property', 'See them all', 'offers-all'); gbSum.setAttribute('data-gbsum', '1'); gbSum.style.display = 'none'; gbRows.push(gbSum);   /* si solo cabe una guía, en su lugar se resume cuántas hay */
      /* compartir enlace: tarjeta (V3 elegida) */
      if (RM) { var s3 = qa.cloneNode(false); s3.setAttribute('data-pri', '100'); s3.appendChild(head(qa, 'Quick actions')); var c3 = document.createElement('div'); c3.className = 'rv-card3'; c3.setAttribute('data-pri', '100'); c3.innerHTML = '<strong>Invite the next guest</strong><span>They register from their own phone, so you don\'t have to pass yours around.</span><div><button type="button" class="rv-pill pri" data-vact="share">Copy link</button><button type="button" class="rv-pill" data-vact="share">Share</button></div>'; s3.appendChild(c3); out.push(s3); }
      var TRAD = false; try { TRAD = localStorage.getItem('replica-comp-trad') === '1' && localStorage.getItem('replica-comp-chat') === '0'; } catch (e) {}
      if (asks.length && TRAD) out.push(block('Ask Vela', asks));
      else if (asks.length) {
        /* Ask Vela chat (la del resto del producto): zona de respuesta arriba y «Suggested» con las preguntas; al elegir una aparece la pregunta y la respuesta de Vela con su animación de carga */
        var SPK2 = '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>';
        var CQ = [];
        if (ECI || LCO) CQ.push({ t: eclTtl, a: 'Your standard times are check-in from 15:00 and check-out until 11:00. Your host offers ' + (ECI && LCO ? 'early check-in and late check-out' : ECI ? 'early check-in' : 'late check-out') + ' for this booking, so you could ' + (ECI && LCO ? 'arrive earlier or leave later' : ECI ? 'arrive earlier' : 'leave later') + ' than the standard times, subject to availability.' });
        if (RA) CQ.push({ t: 'When do I get access to the property?', a: 'Your host uses remote access, so there is no key handover: you receive your access codes or digital keys by email and in the app, from 15:00 on your check-in day' + (ECI ? ' (or earlier if you add an early check-in).' : '.') });
        CQ.push({ t: 'Why do I need to register?', a: 'As required by local law, all tourist accommodations must keep a record of their guests. Completing the online check-in before you arrive will save you time, and we handle your personal data in line with the GDPR.' });
        var cs = qa.cloneNode(false); cs.appendChild(head(qa, 'Ask Vela'));
        var cw = document.createElement('div'); cw.className = 'pq2';
        cw.innerHTML = '<div class="pq2-ex" aria-live="polite"></div><span class="vc-lb">Suggested</span><div class="pq-ch">' + CQ.map(function(o, i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div>';
        cs.appendChild(cw); out.push(cs);
        var exv = cw.querySelector('.pq2-ex');
        var showAsk = function(i, animate){
          var o = CQ[i]; if (!o) return;
          [].forEach.call(cw.querySelectorAll('.vc-chip'), function(c){ c.classList.toggle('on', +c.getAttribute('data-ask') === i); });
          exv.innerHTML = '<div class="pc-x"><div class="vc-q">' + o.t + '</div><div class="vc-a"><span class="vc-av"><svg viewBox="0 0 24 24" aria-hidden="true">' + SPK2 + '</svg></span><div class="ty' + (animate ? ' on' : '') + '"><span class="pc-dots"><i></i><i></i><i></i></span><span class="ty-t">' + o.a + '</span></div></div></div>';
          var ty = exv.querySelector('.ty.on'); if (ty) { if (window.__velaLoad) window.__velaLoad(ty); else setTimeout(function(){ ty.classList.remove('on'); }, 600); }
        };
        cw.addEventListener('click', function(e){ var b = e.target.closest('.vc-chip'); if (!b) return; e.preventDefault(); e.stopPropagation(); showAsk(+b.getAttribute('data-ask'), true); });
        showAsk(0, false);   /* siempre hay una pregunta abierta: la primera, ya respondida al cargar la página */
      }
      /* sin «Guidebooks from your host» en esta página */
    } else {
      out.push(section(gk, 'Good to know', [row(P.redo, 'It usually works the second time', 'A short connection problem is the most common cause.'), row(P.lock, 'Your data is safe', 'Nothing was lost: your details are saved on this device.')]));
    }
    secs.forEach(function(s){ s.parentNode.removeChild(s); });
    asd.addEventListener('click', function(e){ var t = e.target.closest('[data-vto],[data-vact],[data-vmodal]'); if (!t) return; e.preventDefault(); e.stopPropagation(); if (t.getAttribute('data-vmodal')) { vmodal(t.getAttribute('data-vmodal')); return; } if (t.getAttribute('data-vact') === 'share') { if (window.__shareLink) window.__shareLink(t); } else location.href = t.getAttribute('data-vto') + XS; }, true);
    out.forEach(function(s){ asd.appendChild(s); });
    /* Vela nunca hace scroll: si no cabe, se quitan las piezas menos prioritarias (primero «Why do I need to register?», luego las guías una a una…) */
    function fit(){
      var all = [].slice.call(asd.querySelectorAll('[data-pri]')); all.forEach(function(e){ e.style.display = ''; });
      [].forEach.call(asd.querySelectorAll('section'), function(s){ s.style.display = ''; });
      var sm = asd.querySelector('[data-gbsum]'); if (sm) sm.style.display = 'none';
      var order = all.filter(function(e){ return e.matches('.rv-tile,.rv-row2,.rv-card3'); }).sort(function(x, y){ return +x.getAttribute('data-pri') - +y.getAttribute('data-pri'); });
      function over(){ return asd.scrollHeight > asd.clientHeight + 1; }
      for (var q = 0; q < order.length && over(); q++) {
        if (+order[q].getAttribute('data-pri') >= 100) break;   /* «Share a link» no se quita nunca */
        order[q].style.display = 'none'; var sc = order[q].closest('section'); if (sc && ![].some.call(sc.querySelectorAll('.rv-tile,.rv-row2,.rv-card3'), function(t){ return t.style.display !== 'none'; })) sc.style.display = 'none';
      }
      /* si solo cabe una guía, se sustituye por «N guidebooks for this property · See them all» */
      if (sm) { var gv = [].filter.call(sm.parentNode.children, function(t){ return t !== sm && t.hasAttribute('data-pri') && t.style.display !== 'none'; }); if (gv.length === 1) { gv[0].style.display = 'none'; sm.style.display = ''; sm.closest('section').style.display = ''; } }
    }
    setTimeout(fit, 0); setTimeout(fit, 350); var ft = 0; addEventListener('resize', function(){ clearTimeout(ft); ft = setTimeout(fit, 80); });
  })();
}
function mount(){
  var bar = document.querySelector('header.relative.flex.shrink-0'); if (!bar) return false;
  var bk = bar.querySelector('button[aria-label="Back"]'); if (bk) bk.setAttribute('data-to', 'hub-after-1');   /* la flecha lleva al resumen de huéspedes */
  var wrap = bar.parentElement && bar.parentElement.parentElement; if (!wrap) return false;
  var main = bar.parentElement.nextElementSibling; while (main && main.classList.contains('rg')) main = main.nextElementSibling;
  if (main) main.style.display = 'none';
  var el = document.createElement('main');
  if (SID === 'g2-registering') { el.className = 'rg rg-p'; el.innerHTML = backRow(true) + processing(); html.setAttribute('data-rg', 'p'); wrap.appendChild(el); runProcessing(el); velaWait(); return true; }
  if (SID === 'g2-register-failed') { el.className = 'rg rg-f'; el.innerHTML = backRow() + failed(); html.setAttribute('data-rg', 'f'); wrap.appendChild(el); velaPanel(); return true; }
  el.className = 'rg rg-v' + RV + (LEFT ? '' : ' rg-all'); el.innerHTML = backRow() + V[RV]();
  wrap.appendChild(el); html.setAttribute('data-rg', RV); velaPanel();
  return true;
}
var n = 0; (function tryMount(){ if (!mount() && n++ < 20) setTimeout(tryMount, 100); })();

/* controles */
function group(title, order, opts, cur, param, off){
  var d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = opts.map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var p = new URLSearchParams(location.search), v = b.getAttribute('data-v'); if (v === off) p.delete(param); else p.set(param, v); var s = p.toString(); location.search = s ? '?' + s : '?'; });
  return [title, d, order];
}
var rows = [group('Resultado del envío', 10.1, [['ok', 'Éxito'], ['fail', 'Fallo']], SR, 'sr', 'ok'),
  MINORS_ON ? group('Menor', 8.1, [['0', 'Sin menor'], ['1', 'Con menor']], MN ? '1' : '0', 'mn', null) : null,
  group('Qué queda', 8, [['both', 'Huéspedes y pagos'], ['guests', 'Huéspedes'], ['payments', 'Pagos'], ['none', 'Reserva completa']], WN, 'wn', null),
  group('Deal · estilo', 11.5, [['1', 'V1'], ['2', 'V2 · como la home']], DS, 'ds', null),
  group('Deal', 12, [['early', 'Early check-in'], ['esim', 'eSIM'], ['transfer', 'Transfer'], ['tour', 'Free tour'], ['multi', 'Varios']], DL, 'dl', null)];
try { if (Q.get('dl')) localStorage.setItem('rep-dl', Q.get('dl')); if (Q.get('wn')) localStorage.setItem('rep-wn', Q.get('wn')); if (Q.get('mn')) localStorage.setItem('rep-mn', Q.get('mn')); if (Q.get('ds')) localStorage.setItem('rep-ds', Q.get('ds')); } catch (e) {}
rows.push(group('Early check-in', 14, [['1', 'Sí'], ['0', 'No']], ECI ? '1' : '0', 'eci', null));
rows.push(group('Late check-out', 14.1, [['1', 'Sí'], ['0', 'No']], LCO ? '1' : '0', 'lco', null));
if (SID === 'g2-registered') rows.push(group('Página de registrado', 10, [['1', 'Hero'], ['2', 'Resumen'], ['3', 'Anillo']], RV, 'rv', '1'));
function init(){ rows.filter(Boolean).forEach(function(r){ if (window.__repPanel) window.__repPanel.add(r[0], r[1], r[2]); else document.body.appendChild(r[1]); }); }
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
