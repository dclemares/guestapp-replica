(function(){
'use strict';
var hero = document.querySelector('[data-testid="checkin-hero-strip"]'); if (!hero) return;
var q = new URLSearchParams(location.search);
var state = q.get('keys') === 'unlocked' ? 'open' : (q.get('keys') === 'wait' ? 'wait' : 'locked');   /* locked = check-in pending; wait = checked in, before arrival; open = codes usable */
var variant = 'b';   /* vista elegida: B (barra de progreso y chip) */
function isOpen(){ return state !== 'locked'; }
var KEY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.500" cy="15.500" r="4.500"/><path d="m10.700 12.300 9.800-9.800M16 7l3 3M14 9l2.500 2.500"/></svg>';
var LOCK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
var UNLOCK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 7.500-2"/></svg>';
var CLOCK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
var CHEV = '<svg class="acc-tile__go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
var EYE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var COPY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>';
var tile = document.querySelector('.acc-tile');
function paintTile(){
  if (!tile) return;
  tile.setAttribute('data-v', variant); tile.setAttribute('data-s', state);
  tile.setAttribute('data-open', state === 'open' ? '1' : '0');
  var ttl = 'How to get in', sub, ic = state === 'locked' ? LOCK : (state === 'wait' ? CLOCK : UNLOCK);
  if (variant === 'a') {
    sub = state === 'locked' ? 'Unlocks when you finish check-in' : (state === 'wait' ? 'Works from Wed 25 Nov, 15:00' : 'Your codes are ready');
    tile.innerHTML = ic + '<span class="acc-tile__t"><b>' + ttl + '</b><span>' + sub + '</span></span>' + CHEV;
  } else if (variant === 'b') {
    var cta = state === 'locked' ? '<span class="cl">2 steps left</span><span class="cs">2 left</span>' : (state === 'wait' ? 'Active Wed 25 Nov' : '<span class="cl">Show code</span><span class="cs">Show</span>');
    sub = state === 'locked' ? 'Finish check-in to unlock your keys before your arrival' : (state === 'wait' ? 'Your code works from 15:00' : 'Tap to see your codes');
    var bar = state === 'locked' ? '<i class="acc-bar"><b style="width:0%"></b></i>' : '<i class="acc-bar"><b style="width:100%"></b></i>';
    if (state === 'wait') {
      tile.innerHTML = '<span class="acc-tile__row">' + ic + '<span class="acc-tile__t"><b>Your keys are set</b><span>Opens Wed 25 Nov \u00b7 15:00</span></span></span><i class="acc-bar"><b style="width:100%"></b></i>';
    } else {
    tile.innerHTML = '<span class="acc-tile__row">' + ic + '<span class="acc-tile__t"><b>' + (state === 'open' ? 'Your keys are ready' : 'Unlock your keys') + '</b><span>' + sub + '</span></span><em class="acc-chip">' + cta + '</em></span>' + bar;
    }
  } else {
    var s1 = state === 'locked' ? 'now' : 'done', s2 = state === 'locked' ? 'next' : (state === 'wait' ? 'done' : 'done'), s3 = state === 'open' ? 'now' : (state === 'wait' ? 'now' : 'next');
    var l2 = state === 'locked' ? 'Keys unlock' : 'Keys ready';
    var l3 = state === 'open' ? 'Arrive \u00b7 enter' : 'Arrive 25 Nov';
    tile.innerHTML = '<span class="acc-tile__row"><b class="acc-c-t">How to get in</b>' + CHEV + '</span><span class="acc-track"><span class="acc-st" data-p="' + s1 + '"><i></i>Check-in</span><span class="acc-st" data-p="' + s2 + '"><i></i>' + l2 + '</span><span class="acc-st" data-p="' + s3 + '"><i></i>' + l3 + '</span></span>';
  }
}
var m = document.createElement('div'); m.className = 'acc-modal'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'acc-t');
function code(d){ return '<div class="acc-code">' + d.split('').map(function(c){ return '<i>' + c + '</i>'; }).join('') + '</div>'; }
function keyCard(name, sub, digits){
  var early = state === 'wait';   /* antes de la hora de entrada: se puede ver, pero no copiar */
  return '<div class="acc-key" data-show="0" data-code="' + digits + '"><div class="acc-key__top"><span class="acc-badge">' + KEY + '</span><div><b>' + name + '</b><span>' + sub + '</span></div></div>' + code(digits) +
    '<div class="acc-key__act"><button type="button" data-a="show">' + EYE + '<span>Show code</span></button><button type="button" class="pri" data-a="copy"' + (early ? ' disabled aria-disabled="true"' : '') + '>' + COPY + '<span>' + (early ? 'Copy from 15:00' : 'Copy') + '</span></button></div></div>';
}
function build(){
  m.innerHTML = '<div class="acc-back" data-a="close"></div><div class="acc-sheet" data-state="' + (state === 'locked' ? 'locked' : 'open') + '">' +
   '<div class="acc-head"><div><h2 id="acc-t">How to get in</h2><p>Villa Calipso, Albacete, ES</p></div><button type="button" class="acc-x" data-a="close" aria-label="Close">×</button></div>' +
   '<div class="acc-body acc-locked"><div class="acc-hero"><span class="acc-badge">' + LOCK + '</span><div><h3>Your code unlocks after check-in</h3><p>Finish the steps below and your keys will appear here, ready for arrival.</p></div></div>' +
   '<ul class="acc-steps"><li class="on"><i>1</i>Guest details</li><li class="on"><i>2</i>Payments</li><li><i>3</i>Your keys appear here</li></ul>' +
   '<div class="acc-preview"><span class="acc-badge" style="background:#e9ecfa;color:#6b6b95;box-shadow:none">' + KEY + '</span><div><b>Front door</b><span>• • • •</span></div></div>' +
   '<button type="button" class="acc-cta" data-a="close">Continue check-in</button></div>' +
   '<div class="acc-body acc-open">' + (state === 'wait' ? '<p class="acc-valid acc-soon">' + CLOCK.replace('width="22" height="22"', 'width="15" height="15"') + 'Your code works from Wed 25 Nov, 15:00</p>' : '<p class="acc-valid">' + UNLOCK.replace('width="22" height="22"', 'width="15" height="15"') + 'Valid Wed 25 Nov 15:00 → Fri 27 Nov 11:00</p>') +
   keyCard('Building door', 'Street entrance', '4829') + keyCard('Apartment door', 'Smart lock, 3rd floor', '731605') +
   '<div class="acc-how"><b>How to enter:</b> type the code on the keypad and press <b>✓</b>. The door opens after the beep.</div>' +
   '<p class="acc-note">Codes are personal. Please don’t share them.</p></div>' +
   '</div>';
}

function setQ(){ var p = new URLSearchParams(location.search); p.set('keys', state === 'open' ? 'unlocked' : state); history.replaceState(null, '', location.pathname + '?' + p.toString()); }
var sw = document.createElement('div'); sw.className = 'acc-switch';
function paintSwitch(){
  var b = function(g, k, l, on){ return '<button type="button" data-g="' + g + '" data-k="' + k + '" class="' + (on ? 'on' : '') + '">' + l + '</button>'; };
  sw.innerHTML = '<span>Estado</span>' + b('s', 'locked', 'Bloqueado', state === 'locked') + b('s', 'wait', 'Antes de llegar', state === 'wait') + b('s', 'open', 'Listo', state === 'open');
}
sw.addEventListener('click', function(e){
  var t = e.target.closest('button'); if (!t) return; e.preventDefault(); e.stopPropagation();
  if (t.getAttribute('data-g') === 'v') variant = t.getAttribute('data-k'); else state = t.getAttribute('data-k');
  paintTile(); paintSwitch(); setQ(); if (!m.hidden) build();
}, true);
function open(){ build(); m.hidden = false; document.documentElement.style.overflow = 'hidden'; var x = m.querySelector('.acc-x'); if (x) x.focus(); }
function close(){ m.hidden = true; document.documentElement.style.overflow = ''; if (tile) tile.focus(); }
function raOn(){ try { return localStorage.getItem('replica-remote-access') !== '0'; } catch (e) { return true; } }
function paintRA(){ var on = raOn(); if (tile) tile.style.display = on ? '' : 'none'; var sec = sw.closest('.rp-s'); if (sec) sec.style.display = on ? '' : 'none'; sw.hidden = !on; }
window.addEventListener('replica-ra-change', paintRA);
function init(){
  document.body.appendChild(m); if (window.__repPanel) window.__repPanel.add('Llaves', sw, 20); else document.body.appendChild(sw); paintTile(); paintSwitch(); paintRA(); setTimeout(paintRA, 0);
  document.addEventListener('click', function(e){
    var t = e.target.closest('.acc-tile'); if (t) { e.preventDefault(); e.stopPropagation(); open(); return; }
    var a = e.target.closest('.acc-modal [data-a]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    var k = a.getAttribute('data-a');
    if (k === 'close') close();
    
    else if (k === 'show') { var c = a.closest('.acc-key'), on = c.getAttribute('data-show') === '1'; c.setAttribute('data-show', on ? '0' : '1'); a.querySelector('span').textContent = on ? 'Show code' : 'Hide code'; }
    else if (k === 'copy') { var d = a.closest('.acc-key').getAttribute('data-code'); try { navigator.clipboard.writeText(d); } catch (_) {} var s = a.querySelector('span'); s.textContent = 'Copied'; setTimeout(function(){ s.textContent = 'Copy'; }, 1400); }
  }, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !m.hidden) close(); });
  if (q.get('keys') === 'open') open();
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
