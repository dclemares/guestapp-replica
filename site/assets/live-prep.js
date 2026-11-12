/* Preparación del liveness check: 4 versiones de la pantalla (?pv=1..4; 0 = la actual). La usa iv.js en la pantalla suelta. */
(function(){
'use strict';
function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + (w || 20) + '" height="' + (w || 20) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
var P = {
  hat: '<path d="M3 15h18"/><path d="M6 15c0-5 2.7-8 6-8s6 3 6 8"/><path d="M4 4l16 16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  cam: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'
};
/* cara esquemática para los 4 movimientos: d = c (de frente) · l · r (girada) · z (más cerca) */
function face(d){
  var dx = d === 'l' ? -5 : d === 'r' ? 5 : 0, s = d === 'z' ? 1.16 : 1;
  var arrow = d === 'l' ? '<path d="M14 33H3m4-4-4 4 4 4" stroke="#385bf8"/>' : d === 'r' ? '<path d="M50 33h11m-4-4 4 4-4 4" stroke="#385bf8"/>' : d === 'z' ? '<path d="M8 8l6 6M56 8l-6 6M8 56l6-6M56 56l-6-6" stroke="#385bf8"/>' : '<circle cx="32" cy="7" r="2.2" fill="#385bf8" stroke="none"/>';
  return '<svg class="lp-face" viewBox="0 0 64 64" fill="none" stroke="#232044" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<g transform="translate(32 34) scale(' + s + ') translate(-32 -34)"><ellipse cx="32" cy="33" rx="14" ry="17"/>'
    + '<circle cx="' + (26.5 + dx) + '" cy="31" r="1.6" fill="#232044" stroke="none"/><circle cx="' + (37.5 + dx) + '" cy="31" r="1.6" fill="#232044" stroke="none"/>'
    + '<path d="M' + (32 + dx) + ' 33v4h' + (d === 'l' ? '-2' : '2') + '"/><path d="M' + (27.5 + dx) + ' 42.5c3 2 6 2 9 0"/></g>' + arrow + '</svg>';
}
var MOVES = [['c', 'Look straight'], ['l', 'Turn left'], ['r', 'Turn right'], ['z', 'Move closer']];
function cta(label, icon){ return '<button type="button" class="iv-b pri" data-a="cam">' + (icon ? ic(P[icon], 18) : '') + label + '</button>'; }
function ghost(){ return '<img class="lp-ghost" src="../selfie/mannequin-he.png" alt="" draggable="false">'; }

var V = {
  /* V1 · Demo en bucle: el mismo óvalo de la cámara, con la demo de los movimientos animada */
  '1': function(){ return {
    ttl: 'Quick liveness check', sub: 'Follow 4 simple moves with your face. It takes about 10 seconds.',
    body: '<div class="lp1"><div class="lp1-st" role="img" aria-label="Demo: look straight, turn left, turn right, move closer"><div class="lp1-ov">' + ghost() + '<svg class="lp1-ring" viewBox="0 0 100 128" preserveAspectRatio="none" aria-hidden="true"><path d="M50 2A48 62 0 1 0 50 126A48 62 0 1 0 50 2" pathLength="100"/></svg></div>'
      + '<i class="lp1-ar l"></i><i class="lp1-ar r"></i>'
      + '<span class="lp1-cap">' + MOVES.map(function(m, i){ return '<b style="animation-delay:' + (i * 2) + 's">' + m[1] + '</b>'; }).join('') + '</span></div>'
      + '<div class="lp1-tips"><span>' + ic(P.hat, 16) + 'Hat and glasses off</span><span>' + ic(P.sun, 16) + 'Face the light</span></div></div>',
    act: cta('Start liveness check') }; },

  /* V2 · Los 4 movimientos por adelantado: rejilla 2×2 y, aparte, lo que hay que preparar */
  '2': function(){ return {
    ttl: '4 moves, 10 seconds', sub: 'Instead of a photo, we\'ll ask you to move your face. This is what you\'ll do:',
    body: '<div class="lp2"><ol class="lp2-g">' + MOVES.map(function(m, i){ return '<li><span class="lp2-n">' + (i + 1) + '</span>' + face(m[0]) + '<b>' + m[1] + '</b></li>'; }).join('') + '</ol>'
      + '<div class="lp2-pre"><b>Before you start</b><ul><li>' + ic(P.hat, 16) + 'Take off hats, caps and sunglasses</li><li>' + ic(P.sun, 16) + 'Find even light on your face</li></ul></div></div>',
    act: cta('Start liveness check') }; },

  /* V3 · Mínima: un óvalo grande como la cámara y tres chips; casi sin texto */
  '3': function(){ return {
    ttl: 'Show us it\'s really you', sub: 'Then follow the moves on screen.',
    body: '<div class="lp3"><div class="lp3-st"><div class="lp3-ov">' + ghost() + '</div><span class="lp3-t">' + ic(P.clock, 14) + 'About 10 seconds</span></div>'
      + '<div class="lp3-chips"><span>' + ic(P.hat, 18) + 'No hat or glasses</span><span>' + ic(P.sun, 18) + 'Good light</span><span>' + ic(P.phone, 18) + 'Phone at eye level</span></div></div>',
    act: cta('I\'m ready', 'cam') }; },

  /* V4 · Lista para marcar: tres cosas que el huésped confirma tocándolas; el botón dice cuántas faltan */
  '4': function(){ var it = [['hat', 'Hat and glasses off', 'Nothing covering your face.'], ['sun', 'Good, even light', 'Face a window or a lamp, not your back to it.'], ['phone', 'Phone at eye level', 'Hold it in front of you, an arm\'s length away.']];
    return {
    ttl: 'Before you start', sub: 'Tap each one when it\'s ready. Then you\'ll follow 4 quick moves with your face.',
    body: '<div class="lp4"><ul class="lp4-l">' + it.map(function(x){ return '<li><button type="button" class="lp4-i" data-a="lpchk" aria-pressed="false"><span class="lp4-ic">' + ic(P[x[0]], 20) + '</span><span class="lp4-tx"><b>' + x[1] + '</b><span>' + x[2] + '</span></span><span class="lp4-ck">' + ic(P.ok, 14) + '</span></button></li>'; }).join('') + '</ul>'
      + '<p class="lp4-pv">' + ic(P.lock, 14) + 'We record a few seconds of video only to verify it\'s you.</p></div>',
    act: '<button type="button" class="iv-b pri" data-a="cam" data-lp4>Start liveness check</button>' }; }
};
window.__lpView = function(pv){ return V[pv] ? V[pv]() : null; };
/* V4: marcar / desmarcar cada punto sin repintar */
window.__lpToggle = function(b){
  var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
  var root = b.closest('main') || document, all = root.querySelectorAll('.lp4-i'), n = [].filter.call(all, function(x){ return x.getAttribute('aria-pressed') === 'true'; }).length, c = root.querySelector('[data-lp4]');
  if (c) c.textContent = n === all.length ? 'All set · Start liveness check' : 'Start liveness check';
};
})();
/* ===== Durante el liveness check: 4 versiones de las instrucciones en la cámara (?lv=1..4; 0 = la que había) =====
   iv.js pinta el visor (cámara, óvalo, flechas) y llama a __lvCam para el resto; en cada movimiento llama a __lvTick, que actualiza en el sitio todo lo que lleve data-lv* */
(function(){
var SHORT = ['Look straight', 'Turn left', 'Turn right', 'Move closer'];
var ICON = {   /* mini cara que hace el gesto (para A y D) */
  c: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="6.5" ry="8"/><circle cx="9.6" cy="11" r=".9" fill="currentColor"/><circle cx="14.4" cy="11" r=".9" fill="currentColor"/></svg>',
  l: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="13" cy="12" rx="6" ry="8"/><circle cx="10" cy="11" r=".9" fill="currentColor"/><circle cx="13.6" cy="11" r=".9" fill="currentColor"/><path d="M5 12H1m2-2-2 2 2 2"/></svg>',
  r: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="11" cy="12" rx="6" ry="8"/><circle cx="10.4" cy="11" r=".9" fill="currentColor"/><circle cx="14" cy="11" r=".9" fill="currentColor"/><path d="M19 12h4m-2-2 2 2-2 2"/></svg>',
  z: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="5.5" ry="7"/><path d="M3 3l3 3M21 3l-3 3M3 21l3-3M21 21l-3-3"/></svg>',
  ok: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
};
function dots(n){ var h = ''; for (var i = 0; i < n; i++) h += '<i data-lvdot="' + i + '"></i>'; return h; }
window.__lvCam = function(ver, ctx){
  var M = ctx.moves, n = M.length, k = ctx.st, run = k >= 0, done = k >= n, cur = run ? M[Math.min(k, n - 1)] : null;
  var txt = done ? 'Done, thank you' : run ? cur[0] : 'Fit your face in the oval';
  /* A · Banda de instrucción encima del vídeo: icono que hace el gesto + texto grande + puntos de avance; el titular de fuera no cambia */
  if (ver === '1') return { cls: 'lvv-a lv-fixttl', ttl: 'Liveness check',
    vf: '<div class="lva-band"><span class="lva-ic" data-lvic>' + ICON[run && !done ? cur[2] : 'c'] + '</span><b data-lvtext>' + txt + '</b><span class="lva-dots">' + dots(n) + '</span></div>',
    hint: '' };
  /* B · Anillo partido en 4 tramos (uno por movimiento) + flecha grande fuera del óvalo + texto abajo, sobre el vídeo */
  if (ver === '2') return { cls: 'lvv-b lv-fixttl', ttl: 'Liveness check', seg: true,
    vf: '<span class="lvb-cap"><small data-lvcount>' + (run ? (done ? 'All done' : 'Move ' + (k + 1) + ' of ' + n) : 'Ready when you are') + '</small><b data-lvtext>' + txt + '</b></span>',
    hint: '' };
  /* C · Demo «Like this» en una ventanita sobre el vídeo + barra de progreso en 4 tramos debajo de la cámara; el titular dice el movimiento */
  if (ver === '3') return { cls: 'lvv-c', ttl: txt,
    vf: '<div class="lvc-pip" aria-hidden="true"><div class="lvc-pf"><img src="../selfie/mannequin-he.png" alt="" draggable="false"></div><span>Like this</span></div>',
    after: '<div class="lvc-bar" aria-hidden="true">' + dots(n) + '</div>', hint: '' };
  /* D · Lista de los 4 movimientos debajo de la cámara: hecho (verde) · ahora (azul, con su gesto) · después (gris) */
  if (ver === '4') return { cls: 'lvv-d lv-fixttl', ttl: 'Liveness check',
    after: '<ol class="lvd-l">' + M.map(function(m, i){ return '<li data-lvrow="' + i + '"><span class="lvd-ic">' + ICON[m[2]] + '</span><b>' + SHORT[i] + '</b><span class="lvd-st"></span></li>'; }).join('') + '</ol>', hint: '' };
  return null;
};
window.__lvTick = function(root, k, n, M){
  var done = k >= n, cur = M[Math.min(Math.max(k, 0), n - 1)];
  [].forEach.call(root.querySelectorAll('[data-lvtext]'), function(e){ e.classList.add('sw'); setTimeout(function(){ e.textContent = done ? 'Done, thank you' : cur[0]; e.classList.remove('sw'); }, 160); });
  [].forEach.call(root.querySelectorAll('[data-lvcount]'), function(e){ e.textContent = done ? 'All done' : 'Move ' + (k + 1) + ' of ' + n; });
  [].forEach.call(root.querySelectorAll('[data-lvic]'), function(e){ e.innerHTML = done ? ICON.ok : ICON[cur[2]]; e.classList.toggle('ok', done); });
  [].forEach.call(root.querySelectorAll('[data-lvdot],[data-lvrow],[data-lvseg]'), function(e){ var i = +(e.getAttribute('data-lvdot') || e.getAttribute('data-lvrow') || e.getAttribute('data-lvseg')); var stc = i < k || done ? 'done' : i === k ? 'now' : ''; e.setAttribute('class', (e.hasAttribute('data-lvseg') ? 'sg ' : '') + stc); var st = e.querySelector('.lvd-st'); if (st) st.innerHTML = i < k || done ? ICON.ok : ''; });
  var pip = root.querySelector('.lvc-pip'); if (pip) pip.setAttribute('data-p', done ? 'ok' : cur[2]);
};
})();
/* ===== Durante el check · versiones E–H (?lv=5..8) =====
   Lo que dicen los buenos liveness (Face ID, Onfido Motion, iProov): una sola orden corta cada vez y pegada al óvalo,
   una pista visual en el lado hacia el que hay que moverse, el avance dibujado en el propio óvalo, confirmación inmediata
   de cada movimiento y sin botones ni texto que leer mientras dura. */
(function(){
var T = [['Look straight', 'Hold still for a moment'], ['Turn left', 'Slowly, then back to the centre'], ['Turn right', 'Slowly, then back to the centre'], ['Move closer', 'Bring the phone a little nearer']];
var SAY = ['Look straight at the camera', 'Turn your head to the left', 'Now to the right', 'Move a little closer'];
var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
var SND = { on: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  off: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6M22 9l-6 6"/></svg>' };
var sound = true; try { sound = localStorage.getItem('lvh-snd') !== '0'; } catch (e) {}
function seg(n){ var h = ''; for (var i = 0; i < n; i++) h += '<i data-lvdot="' + i + '"></i>'; return h; }
function txt(k, n){ return k < 0 ? ['Fit your face in the oval', 'Then tap Start'] : k >= n ? ['Done, thank you', 'Checking your moves…'] : T[k]; }
function head(k, n, cls){ var t = txt(k, n); return '<div class="' + cls + '" role="status" aria-live="polite"><b data-lvt>' + t[0] + '</b><small data-lvsub>' + t[1] + '</small></div>'; }
var prev = window.__lvCam, prevTick = window.__lvTick;
window.__lvCam = function(ver, ctx){
  var n = ctx.moves.length, k = ctx.st;
  /* E · Marcas alrededor del óvalo (como Face ID): se ilumina el lado hacia el que te mueves y se pone verde al hacerlo */
  if (ver === '5') return { cls: 'lvv-e lv-fixttl lv-sm', ttl: 'Liveness check', vf: head(k, n, 'lve-top') + '<svg class="lve-tk" data-lvticks aria-hidden="true"></svg>', hint: '' };
  /* F · Pantalla completa: solo cámara, orden grande arriba, barra de 4 tramos y botón encima del vídeo */
  if (ver === '6') return { cls: 'lvv-f lv-fixttl lv-md lv-full', ttl: 'Liveness check',
    vf: '<span class="lvf-scrim" aria-hidden="true"></span><div class="lvf-top"><div class="lvf-row"><button type="button" class="lvf-x" data-a="prev" aria-label="Close camera"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="lvf-bar" aria-hidden="true">' + seg(n) + '</div></div>' + head(k, n, 'lvf-tx') + '</div><span class="lvg-ok" data-lvok aria-hidden="true">' + OK + '</span>', hint: '' };
  /* G · Pista en el lado: el óvalo se ilumina por el lado al que girar, con flechas que se mueven hacia fuera; ✓ grande al completar */
  if (ver === '7') return { cls: 'lvv-g lv-fixttl lv-sm', ttl: 'Liveness check',
    vf: '<span class="lvg-glow" aria-hidden="true"></span><span class="lvg-ch l" aria-hidden="true"><i></i><i></i><i></i></span><span class="lvg-ch r" aria-hidden="true"><i></i><i></i><i></i></span><span class="lvg-ok" data-lvok aria-hidden="true">' + OK + '</span>' + head(k, n, 'lvg-pill'), hint: '' };
  /* H · Voz y vibración: dice cada orden en voz alta, vibra al completar y la pone como subtítulo */
  if (ver === '8') return { cls: 'lvv-h lv-fixttl lv-md', ttl: 'Liveness check',
    vf: '<div class="lvf-bar lvh-bar" aria-hidden="true">' + seg(n) + '</div><button type="button" class="lvh-snd" aria-pressed="' + sound + '" aria-label="Voice guidance">' + (sound ? SND.on : SND.off) + '</button>'
      + '<div class="lvh-cap" role="status" aria-live="polite"><span class="lvh-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b data-lvt>' + txt(k, n)[0] + '</b></div><span class="lvg-ok" data-lvok aria-hidden="true">' + OK + '</span>', hint: '' };
  return prev ? prev(ver, ctx) : null;
};
window.__lvTick = function(root, k, n, M){
  if (prevTick) prevTick(root, k, n, M);
  var t = txt(k, n);
  [].forEach.call(root.querySelectorAll('[data-lvt]'), function(e){ e.classList.add('sw'); setTimeout(function(){ e.textContent = t[0]; e.classList.remove('sw'); }, 160); });
  [].forEach.call(root.querySelectorAll('[data-lvsub]'), function(e){ e.classList.add('sw'); setTimeout(function(){ e.textContent = t[1]; e.classList.remove('sw'); }, 160); });
  if (k > 0) [].forEach.call(root.querySelectorAll('[data-lvok]'), function(e){ e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); });
  ticks(root, k, n);
  if (root.classList.contains('lvv-h')) {
    if (k > 0 && navigator.vibrate) try { navigator.vibrate(k >= n ? [40, 60, 40] : 35); } catch (x) {}
    var w = root.querySelector('.lvh-wave'); if (w) { w.classList.add('on'); clearTimeout(w._t); w._t = setTimeout(function(){ w.classList.remove('on'); }, 1500); }
    if (sound && window.speechSynthesis) try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(k >= n ? 'Done, thank you' : SAY[k]); u.lang = 'en-GB'; u.rate = 1.05; speechSynthesis.speak(u); } catch (x) {}
  }
};
/* E: las marcas se dibujan con el tamaño real del óvalo; cada una pertenece a un lado (arriba = de frente, izquierda, derecha, abajo = acércate) */
var SIDE = ['c', 'l', 'r', 'z'];
function sideOf(a){ var d = ((a * 180 / Math.PI) % 360 + 360) % 360; return d >= 225 && d < 315 ? 'c' : d >= 135 && d < 225 ? 'l' : d >= 45 && d < 135 ? 'z' : 'r'; }   /* y hacia abajo: 270° = arriba */
window.__lvAfterSize = function(o){
  var sv = document.querySelector('[data-lvticks]'); if (!sv) return; var vf = sv.parentNode, W = vf.clientWidth, H = vf.clientHeight; if (!W || !H) return;
  var rx = o.clientWidth / 2, ry = o.clientHeight / 2, cx = W / 2, cy = H / 2, N = 72, h = '';
  for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    h += '<line data-s="' + sideOf(a) + '" x1="' + (cx + c * (rx + 9)).toFixed(1) + '" y1="' + (cy + s * (ry + 9)).toFixed(1) + '" x2="' + (cx + c * (rx + 21)).toFixed(1) + '" y2="' + (cy + s * (ry + 21)).toFixed(1) + '"/>'; }
  sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.innerHTML = h;
  var r = sv.closest('.iv-m'); if (r) ticks(r, r._lvk == null ? -1 : r._lvk, 4);
};
function ticks(root, k, n){
  root._lvk = k; var cur = k >= 0 && k < n ? SIDE[k] : null;
  [].forEach.call(root.querySelectorAll('[data-lvticks] line'), function(l){ var i = SIDE.indexOf(l.getAttribute('data-s')); l.setAttribute('class', k >= n || (k >= 0 && i < k) ? 'done' : l.getAttribute('data-s') === cur ? 'now' : ''); });
}
/* H: botón de sonido (no repinta la pantalla) */
document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.lvh-snd'); if (!b) return; e.preventDefault(); e.stopPropagation(); sound = !sound; try { localStorage.setItem('lvh-snd', sound ? '1' : '0'); } catch (x) {} b.setAttribute('aria-pressed', String(sound)); b.innerHTML = sound ? SND.on : SND.off; if (!sound && window.speechSynthesis) speechSynthesis.cancel(); }, true);
})();
