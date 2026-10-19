(function(){
'use strict';
var root = document.querySelector('[data-gc-mode]'); if (!root) return;
var mode = root.getAttribute('data-gc-mode');
var MAX = 20;
var editable = root.getAttribute('data-gc-editable') !== 'false';
/* número de huéspedes de la reserva (Ajustes de la reserva): total, o adultos + menores en el modo por edad */
var GCN = (function(){ try { var v = localStorage.getItem('replica-gc-n'); if (['2', '4', '6', '9', '14'].indexOf(v) > -1) return Number(v); } catch (e) {} return 4; })();
var GCA = { 2: [2, 0], 4: [3, 1], 6: [4, 2], 9: [6, 3], 14: [10, 4] }[GCN];
var MINORS = true; try { MINORS = localStorage.getItem('replica-minors') !== '0'; } catch (e) {}   /* Controles → Menores: sin menores todos son adultos y no hay fila de menores */
var st = mode === 'ages' ? { adult: GCA[0] + (MINORS ? 0 : GCA[1]), minor: MINORS ? GCA[1] : 0 } : { guest: GCN };
/* initial counts from the URL (replica only), e.g. ?adult=8&minor=4 or ?guest=12 */
(function(){ var q = new URLSearchParams(location.search); for (var k in st) { var v = parseInt(q.get(k), 10); if (!isNaN(v)) st[k] = Math.max(0, Math.min(20, v)); } })();
var MIN = mode === 'ages' ? { adult: 1, minor: 0 } : { guest: 1 };
var hideMinors = function(){ if (mode !== 'ages' || MINORS) return; var el = root.querySelector('[data-gc="minor-dec"]'), row = null; while (el && el !== root) { if (el.querySelector('[data-gc="adult-dec"]')) break; row = el; el = el.parentElement; } if (row) row.style.display = 'none'; };   /* oculta la fila de menores (el contenedor más alto que tiene los botones de menores pero no los de adultos) */
var $ = function(k){ return root.querySelector('[data-gc="' + k + '"]'); };
var plural = function(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); };
function total(){ var t = 0; for (var k in st) t += st[k]; return t; }
function paint(){
  hideMinors();
  var t = total();
  for (var k in st) {
    if ($(k + '-val')) $(k + '-val').textContent = st[k];
    if ($(k + '-dec')) $(k + '-dec').disabled = st[k] <= MIN[k];
    if ($(k + '-inc')) $(k + '-inc').disabled = t >= MAX;
  }
  $('confirm').textContent = editable ? 'Confirm ' + plural(t, 'guest') : 'Continue';
}
root.addEventListener('click', function(e){
  var b = e.target.closest('[data-gc]'); if (!b) return;
  var m = /^(\w+)-(dec|inc)$/.exec(b.getAttribute('data-gc')); if (!m) return;
  e.preventDefault(); e.stopPropagation();
  var k = m[1];
  if (m[2] === 'dec' && st[k] > MIN[k]) st[k]--;
  if (m[2] === 'inc' && total() < MAX) st[k]++;
  paint();
}, true);
/* proposal: tap the number to type it, and tell people what to do at the maximum */
function clampTo(k, v){ var others = total() - st[k]; v = Math.max(MIN[k], Math.min(MAX - others, v)); return isNaN(v) ? st[k] : v; }
root.addEventListener('click', function(e){
  var n = e.target.closest('button.gc-num'); if (!n) return;
  var k = n.getAttribute('data-gc').replace('-val', '');
  var i = document.createElement('input'); i.type = 'text'; i.inputMode = 'numeric'; i.className = n.className; i.value = st[k]; i.setAttribute('data-gc', k + '-val'); i.setAttribute('aria-label', 'Number of ' + k + 's');
  n.replaceWith(i); i.focus(); i.select();
  var done = function(){ st[k] = clampTo(k, parseInt(i.value, 10)); var b = document.createElement('button'); b.type = 'button'; b.className = n.className; b.setAttribute('data-gc', k + '-val'); i.replaceWith(b); paint(); };
  i.addEventListener('blur', done); i.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') i.blur(); });
});
var PERSON = function(k){ return '<svg class="uiB-p uiB-p--' + k + '" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4.6"/><path d="M20 21a8 8 0 0 0-16 0z"/></svg>'; };
var PLAIN = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4.6"/><path d="M20 21a8 8 0 0 0-16 0z"/></svg>';
var LABEL = { adult: ['adult', 'adults'], minor: ['minor', 'minors'], guest: ['guest', 'guests'] };
var lastCount = {};
/* up to 8 guests: pictograms. From 9: numbers. */
function renderPeople(){
  var box = root.querySelector('[data-gc="people"]'); if (!box) return;
  var n = total(), html = '', grew = null, k;
  if (n > 8) {
    for (k in st) { if (st[k] > 0) html += '<div class="uiB-stat uiB-stat--' + k + '"><span class="uiB-stat__row"><span class="uiB-stat__ic">' + PLAIN + '</span><b>' + st[k] + '</b></span><span class="uiB-stat__lab">' + LABEL[k][st[k] === 1 ? 0 : 1] + '</span></div>'; lastCount[k] = st[k]; }
    box.className = 'uiB-people uiB-people--num'; box.innerHTML = html; return;
  }
  for (k in st) { for (var i = 0; i < st[k]; i++) html += PERSON(k); if (lastCount[k] != null && st[k] > lastCount[k]) grew = k; lastCount[k] = st[k]; }
  box.className = 'uiB-people'; box.innerHTML = html;
  var small = n > 5; box.style.setProperty('--pa', small ? '30px' : '38px'); box.style.setProperty('--pm', small ? '22px' : '27px'); box.style.setProperty('--pg', small ? '6px' : '8px');
  if (grew) { var all = box.querySelectorAll('.uiB-p--' + grew); if (all.length) all[all.length - 1].classList.add('pop'); }
}
var _paint = paint;
paint = function(){ _paint(); var m = root.querySelector('[data-gc="max"]'); if (m) m.hidden = total() < MAX;
  var h = root.querySelector('[data-gc="hero-n"]'); if (h) { h.textContent = total(); root.querySelector('[data-gc="hero-label"]').textContent = total() === 1 ? 'guest' : 'guests'; }
  renderPeople(); paintReq(); };
/* what the guest has to do before arriving: register everyone, plus the payments selected in the replica panel (Controles > Pagos) */
var PAY = { deposit: ['Security deposit', 'Held on your card, released after your stay.'], taxes: ['Tourist tax', 'Per guest and night.'], reservation: ['Reservation payment', 'Pending amount for your booking.'] };
function payments(){ try { return JSON.parse(localStorage.getItem('replica-gc-payments') || '["reservation"]').filter(function(k){ return PAY[k]; }); } catch (e) { return []; } }
function paintReq(){
  var box = $('req'); if (!box) return;
  var n = 0, row = function(t, sub){ n++; return '<li><span class="gcw-req__n">' + n + '</span><div><b>' + t + '</b><span>' + sub + '</span></div></li>'; };
  var tok = false; try { tok = localStorage.getItem('replica-deposit-type') === 'token'; } catch (e) {}
  var h = row('Register all ' + total() + ' guests', 'Required for everyone staying.');
  payments().forEach(function(k){ h += row(PAY[k][0], k === 'deposit' && tok ? 'Save your card for your stay.' : PAY[k][1]); });
  var single = !payments().length;   /* un solo paso (registrar huéspedes): va dentro de la frase, no como lista */
  box.hidden = single; box.innerHTML = single ? '' : '<ol>' + h + '</ol>';
  var p = document.querySelector('.gcw__p'), ed = !!document.querySelector('[data-gc-editable="true"]');
  var ra = true; try { ra = localStorage.getItem('replica-remote-access') !== '0'; } catch (e) {}
  var tail = ra ? ' before you arrive to unlock your keys.' : ' before you arrive.';   /* sin remote access no hay llaves que desbloquear */
  if (p) p.textContent = single ? (ed ? "Confirm who's coming, then you should register all the guests" : 'You should register all the guests') + tail
    : (ed ? "Confirm who's coming, then finish these steps" : 'Finish these steps') + tail;
}
/* modo «Change guest count» (desde el resumen de huéspedes): solo el contador, sin la bienvenida ni la lista de pasos */
var CHG = new URLSearchParams(location.search).get('chg') === '1';
if (CHG) {
  var tt = document.querySelector('.gcw__t'); if (tt) tt.textContent = 'Change guest count';
  var _pr = paintReq; paintReq = function(){ _pr(); var b = $('req'); if (b) b.hidden = true; var p = document.querySelector('.gcw__p'); if (p) p.textContent = 'Update how many people are staying. Everyone will need to be registered.'; };
}
window.addEventListener('storage', function(e){ if (e.key === 'replica-gc-payments' || e.key === 'replica-deposit-type' || e.key === 'replica-remote-access') paintReq(); });
window.addEventListener('replica-ra-change', paintReq);
paintReq();
paint();
})();
