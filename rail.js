(function(){
'use strict';
var root = document.querySelector('.rail-multi'); if (!root) return;
/* el panel de ofertas de Vela nunca hace scroll, tampoco el que provocan un foco o un scrollIntoView: se devuelve siempre a 0 */
(function(){ var as = root.closest('aside'); if (!as) return; var back = function(){ if (as.scrollTop) as.scrollTop = 0; if (root.scrollTop) root.scrollTop = 0; }; as.addEventListener('scroll', back, true); setInterval(back, 400); })();
var v = new URLSearchParams(location.search).get('rail') || 'actual';
root.setAttribute('data-rail', v);
var _sp = new URLSearchParams(location.search).get('set'), SET = _sp === null ? 'htfe' : _sp.toLowerCase().replace(/[^htfe]/g, '');   /* set vacío = ninguna oferta */
var MOBILE = !!root.closest('.mob-offers');
var SETN = ['h','t','f','e'].filter(function(k){return SET.indexOf(k) > -1;}).join('');
if (MOBILE) root.setAttribute('data-mset', SETN); else root.setAttribute('data-set', SETN);
/* móvil: las secciones que quedan se ven EXACTAMENTE igual que en "Todo"; solo se oculta la que se quita */
/* variante en paralelo: cada tarjeta pasa a "cartel" con un panel de cristal abajo (titular + datos + botón) */
function parLayout(){
  if (!MOBILE) return;
  var on = root.hasAttribute('data-par');
  var cards = [].slice.call(root.querySelectorAll('.rv-actual .vela-ride, .rv-actual .vela-tour'));
  var TXT = { ride: ['Skip the taxi queue', 'Book before you land'], tour: ['Free to join', 'Reserve your spot'] };   /* textos propuestos (a confirmar con producto) */
  cards.forEach(function(c){
    var isRide = c.classList.contains('vela-ride'), panel = c.querySelector(':scope > .pc-panel');
    if (on && !panel) {
      panel = document.createElement('div'); panel.className = 'pc-panel';
      var h4 = c.querySelector(':scope > h4'), cta = c.querySelector(':scope > .rd-cta, :scope > .tr-cta');
      var chips = document.createElement('ul'); chips.className = 'pc-chips';
      chips.innerHTML = TXT[isRide ? 'ride' : 'tour'].map(function(t){ return '<li>' + t + '</li>'; }).join('');
      if (isRide && cta) { var s = cta.querySelector('svg'); if (s) { s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'; } }   /* misma flecha que "Explore tours" */
      if (h4) panel.appendChild(h4); panel.appendChild(chips); if (cta) panel.appendChild(cta);
      c.appendChild(panel);
    } else if (!on && panel) {
      [].slice.call(panel.children).forEach(function(k){ if (!k.classList.contains('pc-chips')) c.appendChild(k); });
      panel.remove();
    }
  });
}
new MutationObserver(parLayout).observe(root, { attributes: true, attributeFilter: ['data-par'] });
setTimeout(parLayout, 150); setTimeout(parLayout, 700);
function applyMobile(){
  if (!MOBILE) return;
  var m = root.getAttribute('data-mset'); if (m === null) m = 'htfe'; var has = function(k){ return m.indexOf(k) > -1; };
  var offSec = root.closest('.mob-offers'); if (offSec) offSec.style.display = m ? '' : 'none';   /* sin ninguna oferta se oculta todo el bloque */
  var vela = root.querySelector('.rv-actual chekin-vela'); if (!vela) return;
  var secs = vela.querySelectorAll('.vela-sec'), carwrap = vela.querySelector('.vela-carwrap'), dots = vela.querySelector('.vela-dots');
  var ride = vela.querySelector('.vela-ride'), tour = vela.querySelector('.vela-tour');
  var esimEl = root.querySelector('.rv-actual > .rp-esim'), esimB = vela.querySelector('.vela-banner');
  var show = function(el, on){ if (el) el.hidden = !on; if (el) el.style.display = on ? '' : 'none'; };
  show(secs[0], has('h')); show(carwrap, has('h')); show(dots, has('h'));
  show(vela.querySelector('.vela-heading'), has('h'));   /* PRUEBA: sin deals propios no se muestra "Offers for your stay" ni su subtítulo */
  show(secs[1], has('t') || has('f')); show(ride, has('t')); show(tour, has('f'));
  show(esimEl, has('e')); show(esimB, has('e'));
  root.toggleAttribute('data-par', has('t') && has('f'));   /* estándar: con Transfer y Free tours juntos, siempre en paralelo */
}
var PLUS = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
root.addEventListener('click', function(e){
  var add = e.target.closest('.rp-add');
  if (add) { e.preventDefault(); e.stopPropagation(); var on = add.getAttribute('aria-pressed') !== 'true'; add.setAttribute('aria-pressed', on); add.innerHTML = on ? CHECK : PLUS; return; }
  var chip = e.target.closest('.rpC-chips button');
  if (chip) { e.preventDefault(); e.stopPropagation(); var c = chip.getAttribute('data-cat'); var box = root.querySelector('.rv-c');
    box.setAttribute('data-filter', c); [].forEach.call(box.querySelectorAll('.rpC-chips button'), function(b){ b.classList.toggle('on', b === chip); }); }
}, true);

/* the panel never scrolls: if it does not fit the window height, compact it level by level */
function fit(){
  if (MOBILE) return;   /* en móvil no hay ajuste por altura: las tarjetas conservan siempre el tamaño de "Todo" */
  if (root.getAttribute('data-rail') !== 'actual') return;
  var combo = root.getAttribute('data-set') !== 'htfe';
  var inner = combo ? root.querySelector('.rv-combo') : root.querySelector('.rv-actual .vela-inner'); if (!inner) return;
  root.classList.remove('fit-1', 'fit-2', 'fit-3', 'fit-4', 'fit-5', 'fit-6', 'tour-full', 'tour-nokik');
  root.style.setProperty('--dc-h', '104px');
  for (var n = 0; n <= 6; n++) {
    if (n > 0) root.classList.add('fit-' + n);
    if (inner.scrollHeight <= inner.clientHeight + 1) break;
  }
  if (combo) return;
  /* tours in compact strip: if there is room between them and the eSIM, bring back the big card */
  if (/fit-[456]/.test(root.className) && !/fit-6/.test(root.className)) {
    var t2 = inner.querySelector('.vela-tour'), b2 = root.querySelector('.rv-actual .rp-esim');
    if (t2 && b2) {
      var room = Math.floor(b2.getBoundingClientRect().top - t2.getBoundingClientRect().bottom - 8);
      var h = Math.min(156, t2.offsetHeight + room + 2);
      var base = h, done = false;
      /* if the card does not fit, borrow up to 16px from the host deals (never more) */
      for (var borrow = 0; borrow <= 16 && !done; borrow += 8) {
        root.style.setProperty('--dc-h', (104 - borrow) + 'px');
        for (h = Math.min(156, base + borrow); h >= 94; h -= 4) {
          root.style.setProperty('--tour-h', h + 'px'); root.classList.add('tour-full'); root.classList.toggle('tour-nokik', h < 134);
          if (inner.scrollHeight <= inner.clientHeight + 1) { done = true; break; }
          root.classList.remove('tour-full'); root.classList.remove('tour-nokik');
        }
      }
      if (!done) root.style.setProperty('--dc-h', '104px');
    }
  }
  /* spare room at level 0: lengthen the host deals with it (up to 170px) */
  if (n === 0 || !/fit-/.test(root.className)) {
    var tour = inner.querySelector('.vela-tour'), ban = root.querySelector('.rv-actual .rp-esim');
    var spare = (tour && ban) ? Math.floor(ban.getBoundingClientRect().top - tour.getBoundingClientRect().bottom - 22) : 0;
    root.style.setProperty('--dc-h', Math.max(104, Math.min(170, 104 + spare)) + 'px');
  }
}

/* ---------- combinations of offers ---------- */
var DEALS = [['Early check-in','Access from 11:00','€25','room'],['Parking spot','On-site, per night','€15','parking'],['Late check-out','Until 14:00','€20','habitacion'],['Welcome groceries','Stocked on arrival','€18','mesa'],['Beach gear','Towels & parasol','€12','beach']].map(function(d){ return { img: '../assets/vela/deals/' + d[3] + '.jpg', title: d[0], sub: d[1], price: d[2] }; });
var RIDE = { type: 'ride', img: '../assets/vela/deals/transfer-van.jpg', kik: 'Private transfers', headline: 'Your ride is ready\nwhen you land', sub: 'Prebook shuttles, taxis and limousines.', from: 'Airport', to: 'Your stay', cta: 'Book your ride', sticker: 'PRE-\nBOOK', points: ['Shuttles', 'Taxis', 'Limousines'] };
var TOUR = { type: 'tour', img: '../assets/vela/deals/madrid4.jpg', kik: 'Walking tours', headline: 'Discover the city with local guides', sub: 'See the tours near your stay.', cta: 'Explore tours', points: ['Local guides', 'Near your stay'] };
var ESIM_MARK = '<span class="rp-esim__mark"><i></i><i></i></span>';

var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 6 9 17l-5-5"/></svg>';
function heroEl(k, compact){
  var d = document.createElement('div'); d.className = 'rc-hero rc-hero--' + k + (compact ? ' rc-hero--compact' : ''); d.setAttribute('role', 'link'); d.setAttribute('tabindex', '0');
  var pts = function(a){ return '<ul>' + a.map(function(x){ return '<li>' + TICK + x + '</li>'; }).join('') + '</ul>'; };
  if (k === 't') d.innerHTML = '<div class="rh-photo" style="background-image:url(../assets/vela/deals/' + (!compact || root.getAttribute('data-set') === 'te' ? 'private-transfer' : 'transfer-van2') + '.jpg)"><span class="rh-kik">Private transfers</span><span class="rh-star">PRE-<br>BOOK</span><div class="rh-route"><span>Airport</span><i class="rh-line"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></b></i><span>Your stay</span></div></div>'
    + '<div class="rh-body"><h4>Your ride is ready<br>when you land</h4><p>Prebook shuttles, taxis and limousines.</p>' + pts(['Shuttles', 'Taxis', 'Limousines']) + '<button type="button" class="rh-cta">Book your ride ' + ARROW + '</button></div>';
  if (k === 'f') d.innerHTML = '<div class="rh-photo rh-photo--tour"><span class="rh-kik"><b class="kk-free">FREE</b><span class="kk-txt">Walking tours</span></span></div>'
    + '<div class="rh-body"><h4>Discover the city<br>with local guides</h4><p>See the tours near your stay.</p>' + (window.CHEKIN_TOUR_ROUTE && window.ChekinTourRoute ? window.ChekinTourRoute() : '') + pts(['Local guides', 'Near your stay']) + '<button type="button" class="rh-cta">Explore tours ' + ARROW + '</button></div>';
  if (k === 'e') d.innerHTML = '<div class="rh-photo"><span class="rp-esim__mark"><i></i><i></i></span><span class="rh-kik">airalo · eSIM</span><span class="rh-spons">Sponsored</span><div class="rh-price"><small>From</small><b>€4.00</b></div></div>'
    + '<div class="rh-body"><h4>Activate your eSIM,<br>no roaming</h4><p>Get connected before you land.</p>' + pts(['No roaming', 'Ready before you travel']) + '<button type="button" class="rh-cta">View plans ' + ARROW + '</button></div>';
  return d;
}
function velaEl(cls, items, attrs){
  var e = document.createElement('chekin-vela'); e.className = cls;
  e.setAttribute('flat-text', ''); e.setAttribute('hide-header', ''); e.setAttribute('reco-title', '');
  for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
  var s = document.createElement('script'); s.type = 'application/json'; s.textContent = JSON.stringify(items); e.appendChild(s); return e;
}
function renderCombo(){
  var box = root.querySelector('.rv-combo'); if (!box) return;
  var set = root.getAttribute('data-set'); if (set === 'htfe') return;
  var has = function(k){ return set.indexOf(k) > -1; }, n = set.length;
  box.innerHTML = '';
  root.className = root.className.replace(/\bn-\d\b/g, '').trim() + ' n-' + n;
  box.appendChild(velaEl('rc-hd', [], { heading: 'Offers for your stay', 'heading-sub': 'Picked for your arrival and trip — small extras to make check-in smoother.' }));
  var extrasLabel = has('h') && (has('t') || has('f'));
  if (has('h')) {
    var grid = n <= 2 || (n === 3 && !has('e') && false);
    var hero = n === 1;
    var el = velaEl('rc-h' + (grid ? ' grid' : '') + (hero ? ' hero' : '') + (n <= 2 ? ' rc-grow' : ''), [{ type: 'section', label: 'Offered by your host', tone: 'blue', see: 'See all' }, { type: 'deals-carousel', deals: DEALS }]);
    box.appendChild(el);
  }
  var firstExtra = true;
  ['t', 'f'].forEach(function(k){
    if (!has(k)) return;
    if (!has('h')) { box.appendChild(heroEl(k, n > 1 && !((set === 'te' && k === 't') || (set === 'fe' && k === 'f')))); return; }
    var items = [];
    if (extrasLabel && firstExtra) items.push({ type: 'section', label: 'Extras for your stay', tone: 'blue' });
    firstExtra = false;
    items.push(k === 't' ? RIDE : TOUR);
    box.appendChild(velaEl('rc-' + k + ' rc-ad', items));
  });
  if (has('e')) {
    if (n === 1) {
      box.appendChild(heroEl('e'));
    } else if (false) {
      var h = document.createElement('div'); h.className = 'rc-esim-hero'; h.setAttribute('role', 'link'); h.setAttribute('tabindex', '0');
      h.innerHTML = ESIM_MARK + '<span class="rp-esim__tag">Sponsored</span><h4>Activate your eSIM,<br>no roaming</h4><small>airalo · From €4.00</small><ul><li>No roaming</li><li>Ready before you travel</li><li>From €4.00</li></ul><button type="button">View plans →</button>';
      box.appendChild(h);
    } else {
      var s = document.createElement('div'); s.className = 'rp-esim rc-esim-bar';
      s.innerHTML = ESIM_MARK + '<div class="rp-esim__t"><b>Activate your eSIM, no roaming</b><small>airalo · From €4.00</small></div><span class="rp-esim__tag">Sponsored</span><button type="button" class="rp-btn rp-btn--light">View plans</button>';
      box.appendChild(s);
    }
  }
  if (has('h')) {
    var bar = document.createElement('div'); bar.className = 'rc-addbar';
    bar.innerHTML = '<span><b data-n>0</b> added · <b data-t>€0</b></span><button type="button">Continue</button>';
    var esimEl = box.querySelector('.rc-esim-bar');
    box.insertBefore(bar, esimEl || null);
  }
  box.classList.toggle('no-bar', !box.querySelector('.rc-esim-bar'));
  fit();
  growDeals();
  framePhotos();
  requestAnimationFrame(framePhotos);
}

/* tour photos: pick the picture whose shape fits the box (tall / 16:9 / ultra-wide) */
function framePhotos(){
  [].forEach.call(root.querySelectorAll('.rh-photo--tour'), function(p){
    var w = p.offsetWidth, h = p.offsetHeight; if (!w || !h) return;
    var imgH0 = Math.max(h, w / 0.5627);        /* altura de la foto con "cover" */
    var cut = 0.235;                            /* fracción de la foto que sube: corta la punta de la sombrilla */
    var s = Math.max(1.14, h / ((1 - cut) * imgH0) + 0.01);
    p.style.setProperty('--ih', imgH0.toFixed(1) + 'px');
    p.style.setProperty('--ts', s.toFixed(3));
    p.style.setProperty('--tz', (-cut * imgH0 * s).toFixed(1) + 'px');
  });
}
function growDeals(){
  if (MOBILE) return;
  var box = root.querySelector('.rv-combo'); if (!box || root.getAttribute('data-set') === 'htfe') return;
  var hh = box.querySelector('.rc-h:not(.grid)'); if (!hh) return;
  root.style.setProperty('--dc-h', '104px');
  var kids = [].filter.call(box.children, function(c){ return !c.classList.contains('rc-addbar') && !c.classList.contains('rc-esim-bar') && c.offsetHeight; });
  var last = kids[kids.length - 1], bar = box.querySelector('.rc-esim-bar');
  var floor = bar ? bar.getBoundingClientRect().top - 12 : box.getBoundingClientRect().bottom - 22;
  var spare = Math.floor(floor - last.getBoundingClientRect().bottom);
  root.style.setProperty('--ad-extra', '0px');
  if (spare > 0) {
    var add = Math.min(56, spare);
    root.style.setProperty('--dc-h', (104 + add) + 'px');
    var left = spare - add, ads = box.querySelectorAll('.rc-ad').length;
    if (left > 0 && ads) root.style.setProperty('--ad-extra', Math.floor(Math.min(70, left / ads) - 2) + 'px');
  }
}
root.addEventListener('click', function(e){
  var dc = e.target.closest('.rv-combo .vela-dc'); if (!dc) return;
  e.preventDefault(); e.stopPropagation();
  dc.classList.toggle('added');
  var a = dc.querySelector('.dc-coin .a'); if (a) a.textContent = dc.classList.contains('added') ? '\u2713' : 'Add';
  var all = root.querySelectorAll('.rv-combo .vela-dc.added'), tot = 0;
  [].forEach.call(all, function(d){ var m = /(\d+(?:[.,]\d+)?)/.exec((d.querySelector('.dc-coin .p') || {}).textContent || ''); if (m) tot += parseFloat(m[1].replace(',', '.')); });
  var bar = root.querySelector('.rc-addbar');
  if (bar) { bar.querySelector('[data-n]').textContent = all.length; bar.querySelector('[data-t]').textContent = '€' + tot; bar.classList.toggle('show', all.length > 0); }
  fit();
}, true);
function applyB(){
  var set = root.getAttribute(MOBILE ? 'data-mset' : 'data-set'); if (set === null) set = 'htfe';
  [].forEach.call(root.querySelectorAll('.rv-b [data-k]'), function(e){ e.hidden = set.indexOf(e.getAttribute('data-k')) < 0; });
}
applyB();
if (!MOBILE && !SETN) root.style.display = 'none';
applyMobile(); setTimeout(applyMobile, 120); setTimeout(applyMobile, 600);
window.addEventListener('railset', function(ev){
  var s = (ev.detail == null ? 'htfe' : ev.detail + '').toLowerCase().replace(/[^htfe]/g, '');
  if (!MOBILE) root.style.display = s ? '' : 'none';
  if (MOBILE) { root.setAttribute('data-mset', ['h','t','f','e'].filter(function(k){ return s.indexOf(k) > -1; }).join('')); applyMobile(); applyB(); return; }
  root.setAttribute('data-set', ['h','t','f','e'].filter(function(k){ return s.indexOf(k) > -1; }).join(''));
  renderCombo();
  applyB();
  fit();
  framePhotos();
  requestAnimationFrame(function(){ fit(); framePhotos(); });
});

window.addEventListener('resize', function(){ fit(); growDeals(); framePhotos(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fit(); growDeals(); framePhotos(); });
if (root.getAttribute('data-set') !== 'htfe') renderCombo();
requestAnimationFrame(fit); setTimeout(function(){ fit(); growDeals(); framePhotos(); }, 250); setTimeout(function(){ fit(); growDeals(); framePhotos(); }, 900);
})();
