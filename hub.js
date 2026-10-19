(function(){
'use strict';
/* Registration (guest summary): tres estados como en la home. URL ?hs=new|way|done (way por defecto: la captura real) */
var wrap = document.querySelector('.hub-wrap'); if (!wrap) return;
var V = (window.__SCREEN && window.__SCREEN.v) || 'm';
var IVQ = new URLSearchParams(location.search).get('iv'); try { if (IVQ === '0' || IVQ === '1') localStorage.setItem('rep-iv', IVQ); } catch (e) {}
var MINORS = true; try { MINORS = localStorage.getItem('replica-minors') !== '0'; } catch (e) {}   /* Controles → Menores (Sí / No): ¿hay menores en la reserva? Sin menores todos los huéspedes son adultos */
var MINSIMPLE = true; try { MINSIMPLE = localStorage.getItem('replica-minor-simple') !== '0'; } catch (e) {}
var IVON = (function(){ if (IVQ === '0' || IVQ === '1') return IVQ === '1'; try { return localStorage.getItem('rep-iv') !== '0'; } catch (e) { return true; } })();   /* identity verification sí / no (se recuerda entre pantallas) */
var HC = new URLSearchParams(location.search).get('hc'); try { if (['1', '2'].indexOf(HC) >= 0) localStorage.setItem('rep-hc', HC); else HC = localStorage.getItem('rep-hc'); } catch (e) {} if (['1', '2'].indexOf(HC) < 0) HC = '1';   /* tarjeta del resumen: 1 con texto y compartir · 2 como ahora */
var HS = new URLSearchParams(location.search).get('hs'); if (['new','way','done'].indexOf(HS) < 0) HS = 'way';
var REG = new URLSearchParams(location.search).get('reg'); if (REG === null) REG = 'v5d2'; if (REG === 'home') REG = 'v3'; if (['v1','v1b','v1c','v2','v3','v4','v4b','v4c','v5','v4n1','v4n2','v4n3','v4n4','v4m1','v4m2','v4m3','v5a','v5b','v5c','v5c1','v5c2','v5c3','v5ca','v5cb','v5cc','v5d1','v5d2','v5d3','v5d4'].indexOf(REG) < 0) REG = 'orig';
function mkSeg(html){ var d = document.createElement('div'); d.className = 'hub-cs'; d.innerHTML = html; return d; }
var swE = mkSeg('<button type="button" data-rs="new">Sin nada registrado</button><button type="button" data-rs="prog">En progreso</button><button type="button" data-rs="done">Todo completado</button>');
var swG = mkSeg('<button type="button" data-gc="2">2</button><button type="button" data-gc="4">4</button><button type="button" data-gc="6">6</button><button type="button" data-gc="9">9</button><button type="button" data-gc="14">14</button>');
var swB = mkSeg('<button type="button" data-bk="orig">Original</button><button type="button" data-bk="a">A Migas · Home</button><button type="button" data-bk="a2">A2 Migas · Back to Home</button><button type="button" data-bk="a3">A3 Migas · Home en chip</button><button type="button" data-bk="c">C Pestañas / enlace</button><button type="button" data-bk="c2">C2 Pestañas · Back to Home en chip</button>');
var swM = mkSeg('<button type="button" data-mb="a">A Atrás de texto en la barra</button><button type="button" data-mb="b">B Migas con chip</button><button type="button" data-mb="c">C Pestañas inferiores</button><button type="button" data-mb="d">D Atrás flotante</button>');
var swH = mkSeg('<button type="button" data-hs="new">Sin empezar</button><button type="button" data-hs="way">En camino</button><button type="button" data-hs="done">Completado</button>');
var swAll = [swE, swG, swH, swB, swM];
var sw = {   /* los tres grupos se reparten en filas del cuadro, pero el resto del código los trata como uno */
  querySelectorAll: function(sel){ var out = []; swAll.forEach(function(g){ [].forEach.call(g.querySelectorAll(sel), function(x){ out.push(x); }); }); return out; },
  addEventListener: function(t, f, c){ swAll.forEach(function(g){ g.addEventListener(t, f, c); }); }
};

/* ===== V5c: progreso + huéspedes se calculan a partir del nº de huéspedes configurado (?gc=2|4|6|9|14) ===== */
var CTA = new URLSearchParams(location.search).get('cta'); if (['pill','white','text'].indexOf(CTA) < 0) CTA = 'white';
var BK = new URLSearchParams(location.search).get('bk'); if (BK === null) BK = 'a3'; if (['orig','a','a2','a3','b','c','c2','d'].indexOf(BK) < 0) BK = 'a3';   /* definitiva: migas con Home en chip (A3); la original solo con ?bk=orig */
var MB = new URLSearchParams(location.search).get('mb'); if (['a','b','c','d','e'].indexOf(MB) < 0) MB = 'e';   /* definitiva móvil: barra superior tipo app (e); las otras solo por URL */
var FIT = new URLSearchParams(location.search).get('fit') === 'on';
var RS = new URLSearchParams(location.search).get('rs'); if (['new','prog','done'].indexOf(RS) < 0) RS = 'new';   /* por defecto: sin nada registrado */
var SC = new URLSearchParams(location.search).get('sc'); if (['none','fade','arrow','pill'].indexOf(SC) < 0) SC = 'pill';
var V5 = { v5c: 'seg', v5c1: 'ring', v5c2: 'bar', v5c3: 'ppl', v5ca: 'seg', v5cb: 'seg', v5cc: 'seg', v5d1: 'seg', v5d2: 'seg', v5d3: 'seg', v5d4: 'seg' };
var SLOT = { v5d1: 'box', v5d2: 'rows', v5d3: 'chips', v5d4: 'slot' };   /* cómo se muestran los huéspedes sin añadir; '' = una fila con botón por huésped (V5c) */
var HV = { v5ca: 'a', v5cb: 'b', v5cc: 'c' };   /* cabecera: etiqueta, fecha y CTAs; '' = la de V5c */
var GC = { 2: [2, 0], 4: [3, 1], 6: [4, 2], 9: [6, 3], 14: [10, 4] };   /* adultos (con el titular), menores */
var GCK = new URLSearchParams(location.search).get('gc'); if (!GC[GCK]) { try { GCK = localStorage.getItem('replica-gc-n'); } catch (e) {} } if (!GC[GCK]) GCK = '4';   /* el número de huéspedes es un ajuste de la reserva (replica.js), se recuerda entre pantallas */
var NAMES_A = ['Ana García', 'Marta Ruiz', 'Pablo Soler', 'Elena Vidal', 'Sergio Mora', 'Nora Pons', 'Iván Ortega', 'Clara Gil', 'Raúl Vera'], NAMES_M = ['Leo García', 'Mia Ruiz', 'Hugo Soler', 'Lola Vidal'];
function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
var I_USERS = ic('<circle cx="9" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M19 8v6M22 11h-6"/>', 15), I_CLK = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14), I_SHR = ic('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>', 15), I_PLUS = ic('<path d="M12 5v14M5 12h14"/>', 18);
var PERS = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4.6"/><path d="M20 21a8 8 0 0 0-16 0z"/></svg>';
var KEB = '<button type="button" class="v1-kebab" aria-label="Guest actions" aria-haspopup="menu">' + ic('<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>', 22) + '</button>';
function model(){
  var A = GC[GCK][0] + (MINORS ? 0 : GC[GCK][1]), M = MINORS ? GC[GCK][1] : 0, a = A - 1, r = Math.ceil(a / 2), rest = a - r, pend = rest >= 2 ? 1 : 0, n = 1, i, adults = [], minors = [], holder;
  if (RS === 'new') {          /* sin nada registrado: el titular aún sin datos y todos los demás huecos vacíos */
    holder = { s: 'new', n: 'Guest 1', k: 'h' };
    for (i = 0; i < a; i++) { n++; adults.push({ s: 'new', n: 'Guest ' + n, k: 'a' }); }
    for (i = 0; i < M; i++) { n++; minors.push({ s: 'new', n: 'Guest ' + n, k: 'm' }); }
  } else if (RS === 'done') {  /* todo completado */
    holder = { s: 'done', n: 'Test Guest Demo', k: 'h' };
    for (i = 0; i < a; i++) adults.push({ s: 'done', n: NAMES_A[i % NAMES_A.length], k: 'a' });
    for (i = 0; i < M; i++) minors.push({ s: 'done', n: NAMES_M[i % NAMES_M.length], k: 'm' });
  } else {                     /* en progreso */
    holder = { s: 'holder', n: 'Test Guest Demo', k: 'h' };
    for (i = 0; i < a; i++) { n++; adults.push(i < r ? { s: 'done', n: NAMES_A[i % NAMES_A.length], k: 'a' } : (i < r + pend ? { s: 'pa', n: NAMES_A[i % NAMES_A.length], k: 'a' } : { s: 'new', n: 'Guest ' + n, k: 'a' })); }
    for (i = 0; i < M; i++) { n++; minors.push(i === 0 ? { s: 'pm', n: NAMES_M[0], k: 'm' } : { s: 'new', n: 'Guest ' + n, k: 'm' }); }
  }
  var RANK = { holder: 0, hn: 0, pa: 0, pm: 0, 'new': 1, done: 2 }; function byState(x, y){ return RANK[x.s] - RANK[y.s]; }
  adults = adults.map(function(x, ix){ x.i = ix; return x; }).sort(function(x, y){ return byState(x, y) || x.i - y.i; });
  minors = minors.map(function(x, ix){ x.i = ix; return x; }).sort(function(x, y){ return byState(x, y) || x.i - y.i; });
  var all = [holder].concat(adults, minors), R = 0, P = 0, X = 0;
  all.forEach(function(x){ if (x.s === 'done') R++; else if (x.s === 'new') X++; else P++; });
  return { N: all.length, R: R, P: P, X: X, all: all, adults: adults, minors: minors, holder: holder };
}
function ini(nm){ return nm.split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2).toUpperCase(); }
function btn(l, to, sec){ return '<button type="button" class="v1-btn' + (sec ? ' v1-sec' : '') + '" data-to="' + to + '">' + l + '</button>'; }
function rowH(x){
  var av, mid, act;
  if (x.s === 'new') { av = '<span class="v1-av v1-tint">' + I_PLUS + '</span>'; mid = '<span>Not added yet</span>'; act = btn('Add guest', 'g2-form-empty'); }
  else if (x.s === 'done') { av = '<span class="v1-av v1-ok">' + ini(x.n) + '</span>'; mid = '<em class="v1-chip v1-chip-ok">Registered</em>'; act = KEB; }
  else if (x.s === 'hn') { av = '<span class="v1-av">' + ini(x.n) + '</span>'; mid = '<em class="v1-chip">Details pending</em>'; act = btn('Start', 'form-empty'); }
  else if (x.s === 'pm') { av = '<span class="v1-av">' + ini(x.n) + '</span>'; mid = '<em class="v1-chip">Details pending</em>'; act = btn('<span class="lg">Complete details</span><span class="sm">Complete</span>', 'g2-form-empty'); }
  else if (!IVON) { av = '<span class="v1-av">' + ini(x.n) + '</span>'; mid = '<em class="v1-chip">Details pending</em>'; act = btn('Start', 'form-empty'); }   /* sin IV: directo al formulario */
  else { av = '<span class="v1-av">' + ini(x.n) + '</span>'; mid = '<em class="v1-chip"><span class="lg">ID verification pending</span><span class="sm">IV pending</span></em>'; act = btn('Verify ID', 'iv-intro-h'); }
  return '<div class="v1-row">' + av + '<span class="v1-tx"><b>' + x.n + '</b>' + mid + '</span>' + act + '</div>';
}
var REGOPEN = false;
function slotsBlock(nn, style, minor){
  var lab = minor ? 'Add minor guest' : 'Add guest', add = '<button type="button" class="v5s-add" data-to="g2-form-empty">' + I_PLUS_S + '<span>' + lab + '</span></button>';
  if (style === 'rows') return nn.map(function(x){ return '<button type="button" class="v5s-row" data-to="g2-form-empty">' + I_PLUS_S + '<span>' + (x.k === 'h' ? 'Add booking holder' : 'Add guest ' + x.n.replace('Guest ', '')) + '</span></button>'; }).join('');
  if (style === 'chips') return '<div class="v5s-box"><div class="v5s-chips">' + nn.map(function(x){ return '<span class="v5s-chip"><i>+</i>' + x.n + '</span>'; }).join('') + '</div>' + add + '</div>';
  if (style === 'slot') return nn.map(function(){ return '<button type="button" class="v5s-tint" data-to="g2-form-empty"><span class="v5s-inner">' + I_PLUS_S + '<span>Add guest</span></span></button>'; }).join('');
  return '<button type="button" class="v5s-one" data-to="g2-form-empty">' + I_PLUS_S + '<span>Add guest</span></button>';
}
var I_PLUS_S = ic('<path d="M12 5v14M5 12h14"/>', 16);
function section(title, list, mode, slot, minor, fit){
  if (!list.length) return '';
  var rows = [], nn = list.filter(function(x){ return x.s === 'new'; }), dn = list.filter(function(x){ return x.s === 'done'; }), grouped = mode === 'group' && nn.length >= 3, fold = (mode === 'all' || (fit && fit.fold)) && dn.length >= (fit && fit.fold ? 2 : 3), collapse = fit && (minor ? fit.collapseMinor : fit.collapse) && nn.length >= 2, multiDone = false, doneShown = false, groupShown = false;
  var slotDone = false;
  list.forEach(function(x){
    if (collapse && x.s === 'new') { if (!multiDone) { multiDone = true; rows.push('<button type="button" class="v5s-row v5s-multi" data-multi="' + (minor ? 'minor' : 'adult') + '" data-n="' + nn.length + '">' + I_PLUS_S + '<span>Add ' + nn.length + (minor ? ' minor guests' : ' guests') + '</span></button>'); } return; }
    if (slot && x.s === 'new') { if (!slotDone) { slotDone = true; rows.push(slotsBlock(nn, slot, minor)); } return; }
    if (grouped && x.s === 'new') { if (!groupShown) { groupShown = true; rows.push('<div class="v1-row"><span class="v1-av v1-tint">+' + nn.length + '</span><span class="v1-tx"><b>' + nn.length + ' guests not added yet</b><span>Fill them in now or send each a link</span></span>' + btn('Add guests', 'g2-form-empty') + '</div>'); } return; }
    if (fold && x.s === 'done') {
      if (!doneShown) { doneShown = true; rows.push('<div class="v1-row v5-fold"><span class="v1-av v1-ok">' + dn.length + '</span><span class="v1-tx"><b>' + dn.length + ' guests registered</b><span>' + (REGOPEN ? 'Hide the list' : 'Show the list') + '</span></span><button type="button" class="v1-btn v1-sec v5-regtoggle" aria-expanded="' + REGOPEN + '">' + (REGOPEN ? 'Hide' : 'Show') + '</button></div>'); }
      if (REGOPEN) rows.push(rowH(x));
      return;
    }
    rows.push(rowH(x));
  });
  var minorSub = minor && MINSIMPLE ? '<p class="v1-hs">' + (IVON ? 'Simpler form, with no identity verification needed' : 'Simpler form') + '</p>' : '';   /* los menores pueden tener un formulario más sencillo; sin verificación de identidad si el ajuste Identity está activo */
  return '<h3 class="v1-h">' + title + (list.length > 1 ? ' · ' + list.length : '') + '</h3>' + minorSub + '<div class="v1-stack">' + rows.join('') + '</div>';
}
function progress(m, kind){
  var N = m.N, R = m.R, P = m.P, i, h = '';
  var big = '<h2 class="v5h-big"><b>' + R + '</b> of ' + N + ' guests registered</h2>';
  if (kind === 'seg') {
    for (i = 0; i < N; i++) h += '<i class="' + (i < R ? 'full' : (i < R + P ? 'half' : '')) + '"></i>';
    return big + '<div class="v4n4-seg' + (N > 8 ? ' v5-denseseg' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="' + R + '" aria-label="Guests registered">' + h + '</div>';
  }
  if (kind === 'ring') {
    var C = 169.6, gl = C * R / N, pl = C * P / m.N;
    return '<div class="v5b-main"><span class="v5b-ring" role="progressbar" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="' + R + '" aria-label="Guests registered"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/>'
      + '<circle cx="32" cy="32" r="27" fill="none" stroke="#ffc233" stroke-width="7" stroke-dasharray="' + pl + ' ' + (C - pl) + '" stroke-dashoffset="' + (-gl) + '" transform="rotate(-90 32 32)"/>'
      + '<circle cx="32" cy="32" r="27" fill="none" stroke="#37e08f" stroke-width="7" stroke-dasharray="' + gl + ' ' + (C - gl) + '" transform="rotate(-90 32 32)"/></svg><b>' + R + '<small>/' + N + '</small></b></span>'
      + '<span class="v5b-tx"><b>' + R + ' of ' + N + ' guests registered</b></span></div>';
  }
  if (kind === 'bar') {
    return big + '<div class="v5bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="' + R + '" aria-label="Guests registered"><i class="g" style="width:' + (100 * R / N) + '%"></i><i class="y" style="width:' + (100 * P / N) + '%"></i></div>';
  }
  m.all.forEach(function(x){ h += '<span class="v5f-p v5f-' + (x.s === 'done' ? 'done' : (x.s === 'new' ? 'new' : 'pending')) + ' v5f-' + (x.k === 'm' ? 'minor' : 'adult') + '">' + PERS + '</span>'; });
  return big + '<div class="v5f' + (N > 8 ? ' v5f-dense' : '') + '" role="img" aria-label="' + R + ' registered, ' + P + ' pending, ' + m.X + ' not added">' + h + '</div>';
}
function renderV5(){
  var box = document.querySelector('.hv5c'); if (!box || !V5[REG]) return;
  var m = model(), N = m.N, st = [], mode = N >= 10 ? 'all' : '';
  if (m.P) st.push(m.P + ' pending'); if (m.X) st.push(m.X + ' not added yet'); if (!st.length) st.push('Everyone is registered');
  box.className = 'hv hv5c' + (N >= 6 ? ' v5-compact' : '') + (N >= 10 ? ' v5-dense' : '');
  var SENT = 'Finish this registration to move closer to unlocking your keys.', SENT1 = SENT, hv = HV[REG] || '', hero, prog = progress(m, V5[REG]);
  var bChange = function(cls, label){ return '<button type="button" class="' + cls + '" data-to="home-sheet">' + I_USERS + '<span>' + (label || 'Change guest count') + '</span></button>'; };
  var bShare = function(cls){ return '<button type="button" class="' + cls + '">' + I_SHR + '<span>Share a link</span></button>'; };
  if (hv === 'a') {
    hero = '<div class="v4-hero v5-hero">' + prog + '<p class="v5h-st">' + SENT + '</p><p class="v5h-due2">' + I_CLK + 'Due before 25 Nov</p><div class="v5c1-acts">' + bChange('v5c1-b') + bShare('v5c1-b') + '</div></div>';
  } else if (hv === 'b') {
    hero = '<div class="v4-hero v5-hero"><div class="v5x-strip">' + I_CLK + 'Due before 25 Nov</div>' + prog + '<p class="v5h-st">' + SENT + '</p><div class="v5c2-bar">' + bChange('') + bShare('') + '</div></div>';
  } else if (hv === 'c') {
    hero = '<div class="v4-hero v5-hero">' + prog + '<p class="v5h-st">' + SENT + ' <b class="v5x-due">Due before 25 Nov.</b></p><div class="v5c3-acts">' + bChange('v4-go v5c3-main') + '<button type="button" class="v5c3-sq" aria-label="Share a link">' + I_SHR + '</button></div></div>';
  } else {
    if (V === 'd') {   /* escritorio: "Change guest count" a la derecha de la fecha y el texto de compartir en una sección semitransparente */
      /* tarjeta del resumen (escritorio), dos versiones (?hc=1|2, control «Tarjeta del resumen»): 1 · invitar en la tarjeta (texto y bloque de compartir; Vela sin «Quick actions») · 2 · invitar en Vela (la tarjeta sin ellos) */
      hero = '<div class="v4-hero v5-hero v5-hero--d"><div class="v5h-top">' + (RS === 'done' ? '<span class="v5h-ok">Registration completed</span>' : '<span class="v5h-due">' + I_CLK + 'Due before 25 Nov</span>') + bChange('v5h-pill v5h-white v5h-chg') + '</div>' + prog
        + (HC === '1' ? '<p class="v5h-st">' + (RS === 'done' ? "You're all set for your arrival." : SENT1) + '</p>' + (RS === 'done' ? '' : '<div class="v5h-share"><p><b>You can register everyone yourself.</b> If you prefer, share a link so each guest completes their own registration from their phone.</p>' + bShare('v5h-pill v5h-white v5h-shr') + '</div>') : (RS === 'done' ? '<p class="v5h-st">You\'re all set for your arrival.</p>' : '')) + '</div>';
    } else
    hero = '<div class="v4-hero v5-hero"><div class="v5h-top">' + (RS === 'done' ? '<span class="v5h-ok">Registration completed</span>' : '<span class="v5h-due">' + I_CLK + 'Due before 25 Nov</span>') + '</div>' + prog + '<p class="v5h-st">' + (RS === 'done' ? "You're all set for your arrival." : SENT) + '</p>' + (CTA === 'text'
      ? '<div class="v5c-acts v5c-acts--text"><button type="button" class="v5h-link" data-to="home-sheet">Change guest count</button><button type="button" class="v5h-link">Share a link</button></div>'
      : '<div class="v5c-acts">' + bChange('v5h-pill' + (CTA === 'white' ? ' v5h-white' : '')) + bShare('v5h-pill' + (CTA === 'white' ? ' v5h-white' : '')) + '</div>') + '</div>';
  }
  var CHIP = '<div class="v5fit-wrap"><button type="button" class="v5fit-chip" data-jump="minor">Minors ' + ic('<path d="m6 9 6 6 6-6"/>', 14) + '</button></div>';
  var build = function(fit, chip){ return hero + (chip ? CHIP : '') + section('Booking holder', [m.holder], '', SLOT[REG] || '', false) + section('Other guests', m.adults, mode, SLOT[REG] || '', false, fit) + (m.minors.length ? section('Other minor guests', m.minors, mode, SLOT[REG] || '', true, fit) : ''); };
  if (FIT && V === 'm' && m.minors.length) {
    /* se compacta por pasos (registrados, huecos de adultos, huecos de menores) hasta que la sección de menores quede a la vista; si no cabe, chip "Minors" */
    var stages = [null, { fold: true }, { fold: true, collapse: true }, { fold: true, collapse: true, collapseMinor: true }], fits = false, s;
    for (s = 0; s < stages.length && !fits; s++) { box.innerHTML = build(stages[s], false); fits = minorFits(); }
    if (!fits) box.innerHTML = build(stages[stages.length - 1], true);
  } else box.innerHTML = build(null, false);
  fitChipUpdate();
  if (V === 'm' && MB === 'e' && window.__mobBar) { window.__mobBar.title('Guest summary'); }
}
function minorHead(){ return [].filter.call(document.querySelectorAll('.hv5c .v1-h'), function(h){ return /minor/i.test(h.textContent); })[0]; }
function minorFits(){ var h = minorHead(); if (!h) return true; return h.getBoundingClientRect().top + window.scrollY < window.innerHeight - 120; }
function fitChipUpdate(){ var c = document.querySelector('.v5fit-wrap'), h = minorHead(); if (c && h) c.classList.toggle('off', h.getBoundingClientRect().top < window.innerHeight - 80); }
window.addEventListener('scroll', function(){ fitChipUpdate(); }, { passive: true });
/* hoja "añadir varios": una por sección (adultos o menores), nunca juntos */
var multiEl = null, multiFrom = null;
function closeMulti(){ if (multiEl) { multiEl.remove(); multiEl = null; if (multiFrom) multiFrom.focus(); } }
function openMulti(kind, n, from){
  var minor = kind === 'minor', cnt = n; multiFrom = from; closeMulti(); multiFrom = from;
  multiEl = document.createElement('div'); multiEl.className = 'v5m-back';
  multiEl.innerHTML = '<div class="v5m" role="dialog" aria-modal="true" aria-labelledby="v5m-t"><h3 id="v5m-t">' + (minor ? 'Add minor guests' : 'Add guests') + '</h3><p class="v5m-sub">' + (minor ? 'Under 18 on arrival day' : '18 or older on arrival day') + '</p>'
    + '<div class="v5m-step"><button type="button" data-d="-1" aria-label="Remove one">\u2212</button><b aria-live="polite">' + cnt + '</b><button type="button" data-d="1" aria-label="Add one">+</button></div><p class="v5m-note">' + n + ' free ' + (n === 1 ? 'spot' : 'spots') + '</p>'
    + '<button type="button" class="v5m-go" data-to="g2-form-empty">Add ' + cnt + (minor ? ' minor guests' : ' guests') + '</button><button type="button" class="v5m-link">Send each a link instead</button><button type="button" class="v5m-link v5m-x">Cancel</button></div>';
  document.body.appendChild(multiEl);
  var b = multiEl.querySelector('b'), go = multiEl.querySelector('.v5m-go'), up = function(){ b.textContent = cnt; go.textContent = 'Add ' + cnt + (minor ? (cnt === 1 ? ' minor guest' : ' minor guests') : (cnt === 1 ? ' guest' : ' guests')); multiEl.querySelector('[data-d="-1"]').disabled = cnt <= 1; multiEl.querySelector('[data-d="1"]').disabled = cnt >= n; }; up();
  multiEl.addEventListener('click', function(e){
    var d = e.target.closest('[data-d]'); if (d) { e.preventDefault(); e.stopPropagation(); cnt = Math.max(1, Math.min(n, cnt + parseInt(d.getAttribute('data-d'), 10))); up(); return; }
    if (e.target === multiEl || e.target.closest('.v5m-x') || e.target.closest('.v5m-link')) { e.preventDefault(); e.stopPropagation(); closeMulti(); }
  }, true);
  multiEl.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMulti(); });
  go.focus();
}
document.addEventListener('click', function(e){
  var m = e.target.closest('[data-multi]'); if (m) { e.preventDefault(); e.stopPropagation(); openMulti(m.getAttribute('data-multi'), parseInt(m.getAttribute('data-n'), 10), m); return; }
  var jmp = e.target.closest('[data-jump]'); if (jmp) { e.preventDefault(); var h = minorHead(); if (h) h.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }); }
}, true);

/* ===== indicador de "hay más contenido abajo" (solo móvil): A degradado + chevron, B flecha flotante, C píldora con contador ===== */
var scEl = null, scRaf = 0, REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var I_DOWN = ic('<path d="m6 9 6 6 6-6"/>', 20);
var scBoxEl = null;
/* en escritorio el contenido suele desplazarse dentro de una columna y no en la página: se busca el contenedor que hace scroll */
function scBox(){
  var p = document.querySelector('.hv5c, .hv'); p = p && p.parentElement;
  while (p && p !== document.body && p !== document.documentElement) {
    var o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 4) return p;
    p = p.parentElement;
  }
  return null;
}
function scMore(box){
  var rect = box ? box.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  var left = box ? box.scrollHeight - (box.scrollTop + box.clientHeight) : document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
  var rows = [].filter.call(document.querySelectorAll('.hv5c .v1-row, .hv5c .v5s-row, .hv5c .v5s-tint, .hv5c .v5s-one, .hv:not(.hv5c) .v1-row'), function(r){ return r.offsetParent !== null && r.getBoundingClientRect().top > rect.bottom - 8; });
  return { left: left, rows: rows.length, rect: rect };
}
function scUpdate(){
  scRaf = 0; if (!scEl) return;
  var box = scBox();
  if (box !== scBoxEl) { if (scBoxEl) scBoxEl.removeEventListener('scroll', scQueue); scBoxEl = box; if (box) box.addEventListener('scroll', scQueue, { passive: true }); }
  var m = scMore(box), show = SC !== 'none' && m.left > 24;
  /* en escritorio el indicador se centra en la columna que se desplaza */
  if (box) { scEl.style.left = Math.round(m.rect.left) + 'px'; scEl.style.right = Math.round(window.innerWidth - m.rect.right) + 'px'; scEl.style.bottom = Math.round(window.innerHeight - m.rect.bottom) + 'px'; }
  else if (V === 'd') { var col = document.querySelector('.guest-register-view'); if (col) { var cr = col.getBoundingClientRect(); scEl.style.left = Math.round(cr.left) + 'px'; scEl.style.right = Math.round(window.innerWidth - cr.right) + 'px'; scEl.style.bottom = ''; } }
  else { scEl.style.left = scEl.style.right = scEl.style.bottom = ''; }
  if (SC === 'pill') { show = show && m.rows > 0; var t = scEl.querySelector('span'); if (t) t.textContent = m.rows + (m.rows === 1 ? ' more guest' : ' more guests'); }
  scEl.classList.toggle('on', show); scEl.setAttribute('aria-hidden', show ? 'false' : 'true'); scEl.tabIndex = show ? 0 : -1;
  var fadeBtn = scEl.querySelector('button'); if (fadeBtn) fadeBtn.tabIndex = show ? 0 : -1;
}
function scQueue(){ if (!scRaf) scRaf = requestAnimationFrame(scUpdate); }
function scGo(){ var box = scBox(); if (box) box.scrollBy({ top: Math.round(box.clientHeight * 0.8), behavior: REDUCE ? 'auto' : 'smooth' }); else window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: REDUCE ? 'auto' : 'smooth' }); }
function setScroll(){
  if (!scEl) {
    scEl = document.createElement('div'); document.body.appendChild(scEl);
    scEl.addEventListener('click', function(e){ if (e.target.closest('button')) { e.preventDefault(); e.stopPropagation(); scGo(); } }, true);
    window.addEventListener('scroll', scQueue, { passive: true }); window.addEventListener('resize', scQueue);
  }
  scEl.className = 'hub-sc hub-sc--' + SC;
  scEl.innerHTML = SC === 'fade' ? '<button type="button" aria-label="Scroll down to see more">' + I_DOWN + '</button>'
    : (SC === 'arrow' ? '<button type="button" aria-label="Scroll down to see more">' + I_DOWN + '</button>'
    : (SC === 'pill' ? '<button type="button" aria-label="Scroll down to see more guests">' + I_DOWN + '<span></span></button>' : ''));
  scQueue(); setTimeout(scQueue, 120);
}

/* ===== botón "atrás": cuatro formas de integrarlo en la pantalla (?bk=a|b|c|d; por defecto el original) ===== */
var I_CHL = ic('<path d="m15 18-6-6 6-6"/>', 14), I_ARL = ic('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>', 20), I_ARR = ic('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>', 18);
var bkEyebrow = null, bkEyebrowOrig = null, bkTagged = false;
function bkTag(){
  if (bkTagged) return; bkTagged = true;
  var m = document.querySelector('.sticky header button[aria-label="Back"]'); if (m) m.classList.add('hub-bk-orig');
  [].forEach.call(document.querySelectorAll('button'), function(b){ if (/Back to Home/.test(b.textContent) && !b.closest('.hv')) { var w = b.parentElement; (w && w.children.length === 1 ? w : b).classList.add('hub-bk-orig'); } });
  var hdr = document.querySelector('.guest-register-view')  && null;
  var hs = document.querySelector('h1'); if (hs) { var wrapH = hs.parentElement; bkEyebrow = wrapH && wrapH.previousElementSibling && wrapH.previousElementSibling.querySelector('span'); if (bkEyebrow) { bkEyebrowOrig = bkEyebrow.innerHTML; bkEyebrow.classList.add('hub-eyebrow'); } }
}
function renderBack(){
  bkTag();
  [].forEach.call(document.querySelectorAll('.bk-x'), function(x){ x.remove(); });
  if (bkEyebrow) bkEyebrow.innerHTML = bkEyebrowOrig;
  var h1 = document.querySelector('h1'); if (!h1 || BK === 'orig' || (V === 'm' && MB !== 'b')) return;
  var titleRow = h1.parentElement, eyeRow = titleRow.previousElementSibling, header = titleRow.parentElement;
  var link = function(cls, inner, label){ var a = document.createElement('a'); a.className = 'bk-x ' + cls; a.setAttribute('data-to', 'home'); a.setAttribute('role', 'link'); a.tabIndex = 0; if (label) a.setAttribute('aria-label', label); a.innerHTML = inner; a.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); } }); return a; };
  if ((BK === 'a' || BK === 'a2' || BK === 'a3') && bkEyebrow) {
    bkEyebrow.innerHTML = '';
    var l = link('bk-a', I_CHL + '<span>' + (BK === 'a2' ? 'Back to Home' : 'Home') + '</span>', 'Back to Home'); l.classList.remove('bk-x'); l.classList.add('bk-xa'); if (BK === 'a3') l.classList.add('bk-chip'); bkEyebrow.appendChild(l);
    var sep = document.createElement('i'); sep.className = 'bk-sep'; sep.textContent = '/'; bkEyebrow.appendChild(sep);
    var cur = document.createElement('span'); cur.textContent = 'Guest summary'; cur.setAttribute('aria-current', 'page'); bkEyebrow.appendChild(cur);
  }
  [].forEach.call(document.querySelectorAll('.bk-bar'), function(n){ n.parentNode.removeChild(n); });
  if ((BK === 'a' || BK === 'a2' || BK === 'a3') && V !== 'm' && bkEyebrow) {   /* migas «Home / Guest summary» + botón atrás: las originales no se mueven; al hacer scroll aparece una copia fija arriba con cristal y sombra, a todo el ancho entre el menú y Vela */
    var er = bkEyebrow.parentElement, colEl = er && er.closest('[class*="max-w-[640px]"]'), ctn = colEl && colEl.parentElement;
    if (er && ctn) {
      var bar = document.createElement('div'); bar.className = 'bk-bar'; bar.setAttribute('aria-hidden', 'true'); bar.appendChild(bkEyebrow.cloneNode(true)); document.body.appendChild(bar);
      var fitBar = function(){ if (!bar.isConnected) return; var cr = ctn.getBoundingClientRect(), r = bkEyebrow.getBoundingClientRect(); var sbEl = document.querySelector('[class*="sidebar-wrapper"]'), sbR = sbEl ? Math.round(sbEl.getBoundingClientRect().right) : 0, L = Math.max(cr.left, sbR); bar.style.left = L + 'px'; bar.style.width = (cr.right - L) + 'px'; bar.style.paddingLeft = Math.max(0, r.left - L) + 'px'; var on = er.getBoundingClientRect().bottom < 6; bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true'); };
      fitBar(); window.addEventListener('scroll', fitBar, { passive: true }); window.addEventListener('resize', fitBar); setTimeout(fitBar, 400); setTimeout(fitBar, 1200);
    }
  }
  if (BK === 'b') { var b = link('bk-b', I_ARL, 'Back to Home'); b.setAttribute('role', 'button'); titleRow.insertBefore(b, h1); }
  if (BK === 'c' || BK === 'c2') {
    var nav = document.createElement('nav'); nav.className = 'bk-x bk-c'; nav.setAttribute('aria-label', 'Sections');
    nav.innerHTML = '<a data-to="home" role="link" tabindex="0">Home</a><a aria-current="page">Registration</a><a data-to="cart" role="link" tabindex="0">Payments</a>';
    header.insertBefore(nav, header.firstChild);
    if (eyeRow) { var cl = link('bk-c-link' + (BK === 'c2' ? ' bk-chip' : ''), I_CHL + '<span>Back to Home</span>'); eyeRow.appendChild(cl); }
  }
  if (BK === 'd') {
    var dock = document.querySelector('[data-slot="cta-dock"]');
    if (dock) { var bd = link('bk-d', I_ARR + '<span>Back to Home</span>'); bd.setAttribute('role', 'button'); dock.appendChild(bd); }
  }
}

/* ===== navegación móvil: A atrás de texto en la barra, B migas con chip, C pestañas inferiores, D atrás flotante ===== */
function renderMobileNav(){
  [].forEach.call(document.querySelectorAll('.mb-x'), function(x){ x.remove(); });
  if (V !== 'm') return;
  if (MB === 'a') {
    var hd = document.querySelector('.sticky header'); if (!hd) return;
    var a = document.createElement('a'); a.className = 'mb-x mb-a'; a.setAttribute('data-to', 'home'); a.setAttribute('role', 'link'); a.tabIndex = 0; a.setAttribute('aria-label', 'Back to Home'); a.innerHTML = I_CHL + '<span>Home</span>';
    a.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); } });
    hd.insertBefore(a, hd.firstChild);
  }
  if (MB === 'd') {
    var f = document.createElement('a'); f.className = 'mb-x mb-d'; f.setAttribute('data-to', 'home'); f.setAttribute('role', 'button'); f.tabIndex = 0; f.setAttribute('aria-label', 'Back to Home'); f.innerHTML = I_ARL;
    f.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } });
    document.body.appendChild(f);
  }
}
function apply(){
  wrap.setAttribute('data-hs', HS); var mobNo = (V === 'm' && MB !== 'b'); document.documentElement.setAttribute('data-bk', (V === 'm' && MB === 'e') ? 'orig' : (mobNo ? 'x' : BK)); document.documentElement.setAttribute('data-mb', MB); renderBack(); renderMobileNav(); [].forEach.call(sw.querySelectorAll('[data-mb]'), function(b){ b.classList.toggle('on', b.getAttribute('data-mb') === MB); }); [].forEach.call(sw.querySelectorAll('[data-bk]'), function(b){ b.classList.toggle('on', b.getAttribute('data-bk') === BK); }); document.documentElement.setAttribute('data-reg', V5[REG] ? 'v5c' : REG); renderV5(); setScroll();
  [].forEach.call(sw.querySelectorAll('[data-fit],[data-fitl]'), function(b){ b.style.display = V5[REG] ? '' : 'none'; if (b.hasAttribute('data-fit')) b.classList.toggle('on', (b.getAttribute('data-fit') === 'on') === FIT); });
  [].forEach.call(sw.querySelectorAll('[data-rs],[data-rsl]'), function(b){ b.style.display = V5[REG] ? '' : 'none'; if (b.hasAttribute('data-rs')) b.classList.toggle('on', b.getAttribute('data-rs') === RS); });
  [].forEach.call(sw.querySelectorAll('[data-cta],[data-ctal]'), function(b){ b.style.display = V5[REG] ? '' : 'none'; if (b.hasAttribute('data-cta')) b.classList.toggle('on', b.getAttribute('data-cta') === CTA); });
  [].forEach.call(sw.querySelectorAll('[data-gc],[data-gcl]'), function(b){ b.style.display = V5[REG] ? '' : 'none'; if (b.hasAttribute('data-gc')) b.classList.toggle('on', b.getAttribute('data-gc') === GCK); });
  [].forEach.call(sw.querySelectorAll('button[data-reg]'), function(b){ b.classList.toggle('on', b.getAttribute('data-reg') === REG); });
  [].forEach.call(sw.querySelectorAll('button[data-hs]'), function(b){ b.style.display = REG === 'v3' ? '' : 'none'; });
  [].forEach.call(sw.querySelectorAll('button[data-sc]'), function(b){ b.classList.toggle('on', b.getAttribute('data-sc') === SC); });
  [].forEach.call(sw.querySelectorAll('button[data-hs]'), function(b){ b.classList.toggle('on', b.getAttribute('data-hs') === HS); });
  var p = new URLSearchParams(location.search); if (HS === 'way' || REG !== 'v3') p.delete('hs'); else p.set('hs', HS); if (REG !== 'v5d2') p.set('reg', REG); else p.delete('reg'); if (V5[REG] && GCK !== '4') p.set('gc', GCK); else p.delete('gc'); p.delete('big'); if (SC !== 'pill') p.set('sc', SC); else p.delete('sc'); if (V5[REG] && CTA !== 'white') p.set('cta', CTA); else p.delete('cta'); if (V5[REG] && RS !== 'new') p.set('rs', RS); else p.delete('rs'); if (V5[REG] && FIT) p.set('fit', 'on'); else p.delete('fit'); if (BK !== 'a3') p.set('bk', BK); else p.delete('bk'); if (V === 'm' && MB !== 'e') p.set('mb', MB); else p.delete('mb');
  history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
}
sw.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (b.hasAttribute('data-reg')) REG = b.getAttribute('data-reg'); else if (b.hasAttribute('data-mb')) MB = b.getAttribute('data-mb'); else if (b.hasAttribute('data-bk')) BK = b.getAttribute('data-bk'); else if (b.hasAttribute('data-fit')) FIT = b.getAttribute('data-fit') === 'on'; else if (b.hasAttribute('data-rs')) RS = b.getAttribute('data-rs'); else if (b.hasAttribute('data-cta')) CTA = b.getAttribute('data-cta'); else if (b.hasAttribute('data-sc')) SC = b.getAttribute('data-sc'); else if (b.hasAttribute('data-gc')) GCK = b.getAttribute('data-gc'); else HS = b.getAttribute('data-hs'); apply(); }, true);
document.addEventListener('click', function(e){ if (!e.target.closest('.v5-regtoggle')) return; e.preventDefault(); REGOPEN = !REGOPEN; renderV5(); });
/* cada fila navega a su pantalla (antes que replica.js, que navega por texto) */
document.addEventListener('click', function(e){
  if (e.target.closest('.hub-kebab')) return;
  var r = e.target.closest('[data-to]'); if (!r) return;
  e.preventDefault(); e.stopImmediatePropagation();
  var to = r.getAttribute('data-to'); if (IVON && (to === 'g2-form-empty' || to === 'form-empty')) to = 'iv-intro-f';   /* con IV, registrar un huésped empieza por la intro y la verificación de identidad (Step 1) */
  if (V === 'd' && to === 'g2-form-empty') to = 'form-empty'; var u = to + '.' + V + '.html';   /* en escritorio el alta de huésped es form-empty */
  if (to === 'home-sheet' && window.__openGuestCount) { window.__openGuestCount(undefined, true); return; }
  if (V === 'd') { fetch(u, { method: 'HEAD' }).then(function(res){ location.href = res.ok ? u : to + '.m.html'; }, function(){ location.href = u; }); } else location.href = u;   /* en escritorio, si la pantalla solo existe en móvil, se abre la móvil */
}, true);
/* accesibilidad: nombre = nombre del huésped; descripción = estado */
[].forEach.call(wrap.querySelectorAll('.hub-card'), function(c, ci){
  var ht = c.querySelector('.hub-ht'), list = c.querySelector('.hub-list');
  if (ht && list) { ht.id = 'hub-ht' + ci; list.setAttribute('aria-labelledby', ht.id); }
  [].forEach.call(c.querySelectorAll('.hub-row'), function(r, i){
    var t = r.querySelector('.hub-t'), d = r.querySelector('.hub-d'), id = 'hub' + ci + 'r' + i;
    if (t) { t.id = id + 't'; r.setAttribute('aria-labelledby', id + 't'); }
    if (d) { d.id = id + 'd'; r.setAttribute('aria-describedby', id + 'd'); }
  });
});
var dock = document.querySelector('[data-slot="cta-dock"]');
if (dock) { var dd = document.createElement('div'); dd.className = 'hv-dock'; dd.innerHTML = '<button type="button" data-to="iv-1-intro">Verify Test Guest Demo\'s ID \u2192</button>'; dock.appendChild(dd); }
function init(){
  var swMn = mkSeg('<button type="button" data-mn="1"' + (MINORS ? ' class="on"' : '') + '>Sí</button><button type="button" data-mn="0"' + (!MINORS ? ' class="on"' : '') + '>No</button>');
  swMn.addEventListener('click', function(e){ var b = e.target.closest('button[data-mn]'); if (!b) return; e.preventDefault(); e.stopPropagation(); try { localStorage.setItem('replica-minors', b.getAttribute('data-mn')); sessionStorage.setItem('rep-keep-reload', '1'); } catch (x) {} location.reload(); });
  if (window.__repPanel) window.__repPanel.add('Menores', swMn, 37.4); else document.body.appendChild(swMn);
  if (MINORS) {   /* el formulario sencillo solo tiene sentido si hay menores */
  var swM = mkSeg('<button type="button" data-ms="1"' + (MINSIMPLE ? ' class="on"' : '') + '>Sí</button><button type="button" data-ms="0"' + (!MINSIMPLE ? ' class="on"' : '') + '>No</button>');
  swM.addEventListener('click', function(e){ var b = e.target.closest('button[data-ms]'); if (!b) return; e.preventDefault(); e.stopPropagation(); try { localStorage.setItem('replica-minor-simple', b.getAttribute('data-ms')); sessionStorage.setItem('rep-keep-reload', '1'); } catch (x) {} location.reload(); });
  if (window.__repPanel) window.__repPanel.add('Formulario sencillo para menores', swM, 37.5); else document.body.appendChild(swM);
  }
  var swI = mkSeg('<button type="button" data-iv="1"' + (IVON ? ' class="on"' : '') + '>Sí</button><button type="button" data-iv="0"' + (!IVON ? ' class="on"' : '') + '>No</button>');
  swI.addEventListener('click', function(e){ var b = e.target.closest('button[data-iv]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var q = new URLSearchParams(location.search); q.set('iv', b.getAttribute('data-iv')); location.search = '?' + q.toString(); });
  var swC = mkSeg('<button type="button" data-hc="2"' + (HC === '2' ? ' class="on"' : '') + '>Invitar en Vela</button><button type="button" data-hc="1"' + (HC === '1' ? ' class="on"' : '') + '>Invitar en tarjeta</button>');
  swC.addEventListener('click', function(e){ var b = e.target.closest('button[data-hc]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var q = new URLSearchParams(location.search); q.set('hc', b.getAttribute('data-hc')); location.search = '?' + q.toString(); });
  var rows = [['Estado', swE, 36]];
  if (V === 'd') rows.push(['Tarjeta del resumen', swC, 36.5]); if (REG === 'v3') rows.push(['Check-in', swH, 38]);
  rows.forEach(function(r){ if (window.__repPanel) window.__repPanel.add(r[0], r[1], r[2]); else document.body.appendChild(r[1]); });
  apply();
}
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

/* ===== Vela del resumen de huéspedes (escritorio): tres versiones (?vv=1|2|3, control «Vela · versión») ===== */
(function(){
  if (V !== 'd') return;
  var VV = '1';   /* versión elegida: «Acción» (V2 y V3 descartadas) */
  /* estilo del panel: «Actual» (filas que abren ventana) o «Pregunta a Vela» (conversación con sugerencias y caja para escribir, como V1b de pagos). ?hv=tiles|chat, se recuerda */
  var HVS = [['q1', 'Q1 · Hilo fijo'], ['q2', 'Q2 · Una a una'], ['q4', 'Q4 · Seguimiento']];   /* estilo del chat de «Ask Vela» (solo si el componente «Ask Vela chat» está activo en Ajustes de la reserva); siempre preguntas sugeridas, sin caja para escribir. ?hv=, se recuerda */
  var HV = new URLSearchParams(location.search).get('hv'), okHV = function(v){ return HVS.some(function(x){ return x[0] === v; }); }; try { if (okHV(HV)) localStorage.setItem('replica-hub-vela', HV); else HV = localStorage.getItem('replica-hub-vela'); } catch (e) {} if (!okHV(HV)) HV = 'q2';
  var CT = false, CC = true; try { CT = localStorage.getItem('replica-comp-trad') === '1' && localStorage.getItem('replica-comp-chat') === '0'; CC = !CT; } catch (e) {}   /* Ajustes de la reserva → Componentes: Ask Vela tradicional y/o chat */
  var V2 = false, V3 = false, V4 = CC;   /* el chat es siempre el final (antes V5): respuestas completas, «Suggested» pegado a la respuesta, sin icono, máximo cinco preguntas */
  var QR = CT && CC ? 175 : 0;   /* con los dos componentes activos, altura que se reserva para «Quick answers» (cabecera y dos filas): el chat se encoge para que quepan los dos */
  var swV = document.createElement('div'); swV.className = 'rail-switch'; swV.innerHTML = HVS.map(function(x){ return '<button type="button" class="rs-chip' + (HV === x[0] ? ' on' : '') + '" data-hv="' + x[0] + '">' + x[1] + '</button>'; }).join('');
  swV.addEventListener('click', function(e){ var b = e.target.closest('[data-hv]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var q = new URLSearchParams(location.search); q.set('hv', b.getAttribute('data-hv')); location.search = '?' + q.toString(); }, true);
  (function addHv(n){ if (!CC || V2 || V3 || V4) return; if (window.__repPanel) window.__repPanel.add('Vela · estilo', swV, 36.7); else if (n < 30) setTimeout(function(){ addHv(n + 1); }, 100); })(0);
  var m = model(), N = m.N, R = m.R, LEFT = N - R, MIN = m.minors.length, FIRST = '';
  var ECI = true, LCO = true, RA = true; try { ECI = localStorage.getItem('rep-eci') !== '0'; LCO = localStorage.getItem('rep-lco') !== '0'; RA = localStorage.getItem('replica-remote-access') !== '0'; } catch (e) {}
  var CHV = ic('<path d="m9 18 6-6-6-6"/>', 16);
  function build(){
    var asd = document.querySelector('aside[data-slot="assistant-panel"]'); if (!asd || !asd.querySelector('section')) return false;
    if (asd.getAttribute('data-rgv')) return true; asd.setAttribute('data-rgv', '1');
    var secs = [].slice.call(asd.querySelectorAll(':scope > section')), src = secs[0], intro = asd.querySelector(':scope > p');
    function head(title, see){ var h2 = src.querySelector(':scope > span').cloneNode(true); h2.textContent = title; if (see) { var a = document.createElement('span'); a.className = 'rv-see'; a.textContent = 'See all'; a.setAttribute('role', 'link'); a.tabIndex = 0; a.setAttribute('data-vto', see); h2.appendChild(a); } return h2; }
    function pri(el, n){ el.setAttribute('data-pri', n); return el; }
    function tile(ico, ttl, txt, to, modal){ var b = document.createElement('button'); b.type = 'button'; b.className = 'rv-tile'; if (to) b.setAttribute('data-vto', to); if (modal) b.setAttribute('data-vmodal', modal); b.innerHTML = (ico ? '<span class="rv-ti">' + ic(ico, 16) + '</span>' : '') + '<span class="rv-tx"><strong>' + ttl + '</strong><span>' + txt + '</span></span>' + CHV; return b; }
    function block(title, rows, o){ o = o || {}; var s = src.cloneNode(false); s.appendChild(head(title, o.see)); if (o.sub) { var p = document.createElement('p'); p.className = 'rv-sub'; p.textContent = o.sub; s.appendChild(p); } var w = document.createElement('div'); w.className = 'rv-list'; rows.forEach(function(r){ w.appendChild(r); }); s.appendChild(w); return s; }
    function info(ttl, txt, n){ var d = document.createElement('div'); d.className = 'rv-info'; d.setAttribute('data-pri', n); d.innerHTML = '<strong>' + ttl + '</strong><span>' + txt + '</span>'; return d; }
    function share(){ var s = src.cloneNode(false); s.appendChild(head('Quick actions')); var c = document.createElement('div'); c.className = 'rv-card3'; c.setAttribute('data-pri', '100'); c.innerHTML = '<strong>Invite the guests</strong><span>Each guest registers from their own phone, so you don\'t have to pass yours around.</span><div><button type="button" class="rv-pill pri" data-vact="share">Copy link</button><button type="button" class="rv-pill" data-vact="share">Share</button></div>'; s.appendChild(c); return s; }
    var WIFI = '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>', DOC = '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', MAP = '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', CAR = '<path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>';
    var out = [], text = '';
    var eclT = ECI && LCO ? 'Can I arrive early or leave late?' : ECI ? 'Can I arrive early?' : 'Can I leave late?';
    function guides(){ var GB = [[WIFI, 'Wi-Fi & access', 'Network, password, door code'], [DOC, 'House rules', 'Quiet hours, smoking, pets'], [MAP, 'Getting there', 'Directions and arrival tips'], [CAR, 'Parking', 'Where to park and how to get in']]; var rows = GB.map(function(g, n){ return pri(tile(g[0], g[1], g[2]), 70 - n); }); var sm = tile(ic ? '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' : '', GB.length + ' guidebooks for this property', 'See them all', 'offers-all'); sm.setAttribute('data-gbsum', '1'); sm.style.display = 'none'; rows.push(sm); return block('Guidebooks from your host', rows, { see: 'offers-all', sub: 'Directions, house rules and local tips, all in one place' }); }
    if (VV === '1' && CC) {
      if (LEFT && HC !== '1') out.push(share());   /* con «Invitar en Vela»: tarjeta «Quick actions» (Invite the guests) encima del chat; con «Invitar en tarjeta», el enlace está en la tarjeta principal */
      text = LEFT ? (LEFT === 1 ? '1 guest still needs to register. ' : LEFT + ' guests still need to register. ') + 'Here are the questions guests ask most.' : 'Everyone is registered. Here are the questions guests ask most.';
      var links = function(k){ var M = vmodal(k, true); return M ? (M.ctas || []).filter(function(c){ return c[1]; }).map(function(c){ return '<button type="button" class="vx-l" data-vto="' + c[1] + '">' + c[0] + ' ' + CHV + '</button>'; }).join('') : ''; };
      /* respuestas del chat: cortas y de largo parecido (unas 3 líneas, ~100 caracteres, sin contar los enlaces) para que el hueco bajo la respuesta no varíe más de una línea */
      /* V1 y V2: las respuestas completas de siempre (los textos de las ventanas); V3: cortas y parejas (~100 caracteres, unas 3–4 líneas) para que el hueco bajo la respuesta no varíe más de una línea */
      var ANS = {
        who: 'Everyone staying' + (MIN ? ', minors included,' : '') + ' as local law requires. This booking has ' + N + ' guests; the booking holder goes first.',
        what: 'A passport, ID card or driving licence, whichever you have on hand' + (IVON ? ', plus a quick selfie' : '') + '. It takes about 2 minutes per guest.',
        times: 'Check-in is from 15:00 and check-out until 11:00. Your host offers flexible times:',
        access: 'Codes arrive by email and in the app from 15:00 on check-in day.',
        why: 'Local law requires accommodations to keep a record of their guests, and we handle your data under GDPR.'
      };
      var plain = function(k){ if (V3) return ANS[k] + links(k); var M = vmodal(k, true); return M ? M.it.map(function(x){ return x[1]; }).join(' ') + links(k) : ''; };
      var Q = [];
      if (!LEFT) Q.push({ p: 99, t: 'Is everyone registered?', a: 'Yes, all ' + N + ' guests are registered. You’re all set for your stay.' });
      /* «Invitar en Vela»: el enlace va en «Quick actions» (arriba), no como pregunta del chat */
      if (LEFT) Q.push({ p: 90, t: 'Who has to register?', a: plain('who') });
      if (LEFT) Q.push({ p: 80, t: 'What do I need to register?', a: plain('what') });
      if (ECI || LCO) Q.push({ p: 70, t: eclT, a: plain('times') });
      if (RA) Q.push({ p: 60, t: 'When do I get access to the property?', a: plain('access') });
      Q.push({ p: 50, t: 'Why do I need to register?', a: plain('why') });
      Q.sort(function(a, b){ return b.p - a.p; }); Q = Q.slice(0, 5);   /* como mucho cinco preguntas */
      var SPK = '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>';
      var DWN = '<path d="m6 9 6 6 6-6"/>', BCK = '<path d="m15 18-6-6 6-6"/>';
      var av = '<span class="vc-av">' + ic(SPK, 12) + '</span>';
      var cs = src.cloneNode(false); cs.appendChild(head('Ask Vela')); var cw = document.createElement('div'); cs.appendChild(cw); out.push(cs);
      var stop = function(e){ e.preventDefault(); e.stopPropagation(); };
      var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var DOTS = '<span class="pc-dots"><i></i><i></i><i></i></span>';
      /* burbuja de Vela: el texto reserva su sitio desde el principio (invisible mientras «escribe»), así la altura no salta al responder */
      var bubA = function(html, typing){ return '<div class="vc-a">' + av + '<div class="ty' + (typing ? ' on' : '') + '">' + DOTS + '<span class="ty-t">' + html + '</span></div></div>'; };
      var reveal = function(root, cb){ var t = root.querySelector('.ty.on'); if (!t) { if (cb) cb(); return; } if (window.__velaLoad) window.__velaLoad(t, cb); else setTimeout(function(){ t.classList.remove('on'); if (cb) cb(); }, 600); };
      var qBub = function(t){ return '<div class="vc-q">' + t + '</div>'; };
      var xchg = function(i, typing){ var x = document.createElement('div'); x.className = 'pc-x'; x.setAttribute('data-i', i); x.innerHTML = qBub(Q[i].t) + bubA(Q[i].a, typing); return x; };
      var fitH = function(el, reserve, fixed){ var t = el.getBoundingClientRect().top - asd.getBoundingClientRect().top, h = Math.max(QR ? 100 : 140, asd.clientHeight - t - 56 - QR - (reserve ? reserve() : 0)) + 'px'; el.style[fixed ? 'height' : 'maxHeight'] = h; };
      var down = function(el){ el.scrollTo({ top: el.scrollHeight, behavior: RM ? 'auto' : 'smooth' }); };
      var toTop = function(el, x){ el.scrollTo({ top: Math.max(0, x.offsetTop - el.offsetTop), behavior: RM ? 'auto' : 'smooth' }); };   /* la pregunta recién hecha queda arriba del hilo y su respuesta debajo */
      var wrapRefit = function(fn){ addEventListener('resize', function(){ setTimeout(fn, 60); }); setTimeout(fn, 0); setTimeout(fn, 400); };
      var HVX = V2 ? 'v2' : (V3 || V4) ? 'q2' : HV;
      if (HVX === 'v2') {
        /* Chat V2: arriba «Ask Vela» con las preguntas sugeridas (una por fila) y debajo «Vela answer» con la pregunta elegida y la respuesta de Vela */
        out.pop();
        var s1 = src.cloneNode(false); s1.appendChild(head('Suggested questions'));
        var w1 = document.createElement('div'); w1.className = 'pq2'; w1.innerHTML = '<div class="pq-ch">' + Q.map(function(o, i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div>'; s1.appendChild(w1);
        var s2 = src.cloneNode(false); var ha = head('Vela answer'); ha.classList.add('vx-noacc'); s2.appendChild(ha);
        var exv = document.createElement('div'); exv.className = 'pq2-ex'; exv.setAttribute('aria-live', 'polite'); s2.appendChild(exv);
        out.push(s1, s2);
        var curv = -1;
        var sizev = function(){ var m = document.createElement('div'); m.className = 'pq2-ex'; m.style.cssText = 'position:absolute;visibility:hidden;width:' + exv.offsetWidth + 'px;height:auto;min-height:0'; s2.appendChild(m); var h = 0; Q.forEach(function(o, i){ m.innerHTML = ''; m.appendChild(xchg(i, false)); h = Math.max(h, m.offsetHeight); }); s2.removeChild(m);
          var cap = Math.max(100, asd.clientHeight - 56 - (exv.getBoundingClientRect().top - asd.getBoundingClientRect().top)); exv.style.maxHeight = cap + 'px'; exv.style.overflowY = 'auto'; exv.style.minHeight = Math.min(h, cap) + 'px'; };
        var showv = function(i, first){ curv = i; exv.innerHTML = ''; var x = xchg(i, !first); exv.appendChild(x); reveal(x);
          [].forEach.call(w1.querySelectorAll('.vc-chip'), function(r){ r.classList.toggle('on', +r.getAttribute('data-ask') === i); }); };
        w1.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; stop(e); var i = +b.getAttribute('data-ask'); if (i !== curv) showv(i); });
        wrapRefit(sizev); showv(0, true);
      }
      if (HVX === 'q1') {
        /* Q1 · Hilo fijo: el hilo hace scroll por dentro (sin plegar nada) y las sugeridas quedan fijas abajo: no se mueven nunca; las ya hechas se marcan con ✓ y al tocarlas te llevan a su respuesta */
        cw.className = 'pq';
        cw.innerHTML = '<div class="pq-th" aria-live="polite"></div><div class="pq-sg"><span class="vc-lb">Suggested</span><div class="pq-ch">' + Q.map(function(o, i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div></div>';
        var th1 = cw.querySelector('.pq-th'), sg1 = cw.querySelector('.pq-sg'), done1 = {};
        var fit1 = function(){ fitH(th1, function(){ return sg1.offsetHeight + 10; }, true); };
        var add1 = function(i, first){ var x = xchg(i, !first); done1[i] = x; th1.appendChild(x); cw.querySelector('[data-ask="' + i + '"]').classList.add('done'); th1.style.paddingBottom = ''; fit1(); if (!first) { th1.style.paddingBottom = Math.max(0, th1.clientHeight - 90) + 'px'; toTop(th1, x); } reveal(x); };
        cw.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; stop(e); var i = +b.getAttribute('data-ask');
          if (done1[i]) { done1[i].scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); done1[i].classList.remove('flash'); void done1[i].offsetWidth; done1[i].classList.add('flash'); return; } add1(i); });
        add1(0, true); wrapRefit(fit1);
      }
      if (HVX === 'q2') {
        /* Q2 · Una a una: un solo intercambio (pregunta + Vela respondiendo) en un hueco de altura fija y, debajo, la lista de preguntas siempre igual; la actual queda marcada */
        cw.className = 'pq2';
        cw.innerHTML = '<div class="pq2-ex" aria-live="polite"></div><span class="vc-lb">Suggested</span><div class="pq-ch">' + Q.map(function(o, i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div>';
        var ex2 = cw.querySelector('.pq2-ex'), cur2 = -1, seen2 = [];
        var size2 = function(){ if (V4) { ex2.style.minHeight = ''; ex2.style.maxHeight = ''; ex2.style.overflowY = ''; return; }   /* V4 y V5: sin hueco reservado, «Suggested» sigue a la respuesta */
          var m = document.createElement('div'); m.className = 'pq2-ex'; m.style.cssText = 'position:absolute;visibility:hidden;left:0;right:0;height:auto;min-height:0'; cw.appendChild(m); var h = 0; Q.forEach(function(o, i){ m.innerHTML = ''; m.appendChild(xchg(i, false)); h = Math.max(h, m.offsetHeight); }); cw.removeChild(m); var avail = asd.clientHeight - 56 - QR - (ex2.getBoundingClientRect().top - asd.getBoundingClientRect().top) - cw.querySelector('.vc-lb').offsetHeight - 8 - cw.querySelector('.pq-ch').offsetHeight - 16, cap = QR ? Math.max(100, avail) : 99999; ex2.style.maxHeight = QR ? cap + 'px' : ''; ex2.style.overflowY = QR ? 'auto' : ''; ex2.style.minHeight = Math.min(h, cap) + 'px'; };
        var show2 = function(i, first){ if (seen2.indexOf(i) < 0) seen2.push(i); cur2 = i; ex2.innerHTML = ''; var x = xchg(i, !first); ex2.appendChild(x); reveal(x);
          [].forEach.call(cw.querySelectorAll('.vc-chip'), function(r){ r.classList.toggle('on', +r.getAttribute('data-ask') === i); }); };
        cw.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (!b) return; stop(e); var i = +b.getAttribute('data-ask'); if (i !== cur2) show2(i); });
        wrapRefit(size2); show2(0, true);
      }
      if (HVX === 'q4') {
        /* Q4 · Seguimiento: conversación con scroll interno; bajo cada respuesta salen solo las 3 preguntas que tocan a continuación (no la lista entera) y al elegir una, esas sugerencias desaparecen; al final, «Start over» */
        cw.className = 'pq';
        cw.innerHTML = '<div class="pq-th" aria-live="polite"></div>';
        var th4 = cw.querySelector('.pq-th'), asked4 = [], fit4 = function(){ fitH(th4); };
        var nextChips = function(){ var left = Q.map(function(o, i){ return i; }).filter(function(i){ return asked4.indexOf(i) < 0; }).slice(0, 3); var d = document.createElement('div'); d.className = 'pq4-n';
          d.innerHTML = left.length ? '<span class="vc-lb">Suggested</span><div class="pq-ch">' + left.map(function(i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + Q[i].t + '</button>'; }).join('') + '</div>' : '<div class="pc-done"><span>That’s everything for now.</span><button type="button" class="vx-l" data-reset>Start over</button></div>'; return d; };
        var add4 = function(i, first){ asked4.push(i); var old = th4.querySelector('.pq4-n'); if (old) old.parentNode.removeChild(old); var x = xchg(i, !first); th4.appendChild(x); var nc = nextChips(); nc.hidden = !first; th4.appendChild(nc); fit4(); if (!first) down(th4);
          reveal(x, function(){ nc.hidden = false; down(th4); }); };
        cw.addEventListener('click', function(e){ var b = e.target.closest('[data-ask]'); if (b) { stop(e); add4(+b.getAttribute('data-ask')); return; } if (e.target.closest('[data-reset]')) { stop(e); asked4 = []; th4.innerHTML = ''; add4(0, true); } });
        add4(0, true); wrapRefit(fit4);
      }
    }
    if (VV === '1' && (CT || !CC)) {
      if (!CC) text = LEFT ? (LEFT === 1 ? '1 guest still needs to register. ' : LEFT + ' guests still need to register. ') + (CT ? 'I can help you get everyone checked in.' : '') : 'Everyone is registered. You\'re all set for your stay.';
      if (!CC && LEFT && HC !== '1') out.push(share());   /* con «Invitar en tarjeta» el enlace está en la tarjeta principal y no se repite en Vela; con el chat, el enlace va dentro de su pregunta */
      if (CT) out.push(block(CC ? 'Quick answers' : 'Ask Vela', [pri(tile(null, 'Who has to register?', (MIN ? 'Everyone staying, including minors' : 'Everyone staying'), null, 'who'), CC ? 100 : 90), pri(tile(null, 'What do I need to register?', 'Documents and time it takes', null, 'what'), CC ? 100 : 80), pri(tile(null, 'Why do I need to register?', 'What we use your details for', null, 'why'), 10)]));
    }
    if (VV === '2') {
      text = 'Here is where your registration stands.';
      var pct = Math.round(100 * R / N), nx = m.all.filter(function(x){ return x.s !== 'done'; })[0];
      var pg = document.createElement('div'); pg.className = 'rv-prog'; pg.setAttribute('data-pri', '100'); pg.innerHTML = '<strong>' + R + ' of ' + N + ' guests registered</strong><i class="rv-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="' + R + '"><b style="width:' + pct + '%"></b></i><span>Due before 25 Nov</span>';
      var s2 = src.cloneNode(false); s2.appendChild(head('Your registration')); s2.appendChild(pg); out.push(s2);
      if (nx) out.push(block('Next up', [pri(tile(null, nx.s === 'new' ? 'Add ' + nx.n : 'Complete ' + nx.n, nx.s === 'new' ? 'Not added yet' : 'Details pending', IVON ? 'iv-intro-f' : 'form-empty'), 95)]));
      if (LEFT) out.push(share());
      var gtk = [info('Everyone staying needs to register', 'By local law, each guest must be recorded' + (MIN ? ', minors included.' : '.'), 70)]; if (MIN && MINSIMPLE) gtk.push(info('Minors have a simpler form', 'No identity verification needed for them.', 60)); gtk.push(info('Your data is safe', 'We handle your details securely and in line with GDPR.', 50));
      var s4 = src.cloneNode(false); s4.appendChild(head('Good to know')); var w4 = document.createElement('div'); w4.className = 'rv-list'; gtk.forEach(function(x){ w4.appendChild(x); }); s4.appendChild(w4); out.push(s4);
    }
    if (VV === '3') {
      text = 'Registering takes a few minutes. Meanwhile, here is what your host has prepared for you.';
      if (LEFT) out.push(share());
      var asks = []; if (ECI || LCO) asks.push(pri(tile(null, eclT, 'Check-in and check-out times for this stay', null, 'times'), 90)); if (RA) asks.push(pri(tile(null, 'When do I get access to the property?', 'How and when you receive your keys or codes', null, 'access'), 80)); asks.push(pri(tile(null, 'Why do I need to register?', 'What we use your details for', null, 'why'), 10));
      out.push(block('Ask Vela', asks)); out.push(guides());
    }
    if (intro) intro.textContent = text;
    secs.forEach(function(s){ s.parentNode.removeChild(s); }); out.forEach(function(s){ asd.appendChild(s); });
    function fit(){
      asd.style.overflowY = '';
      var all = [].slice.call(asd.querySelectorAll('[data-pri]')); all.forEach(function(e){ e.style.display = ''; }); [].forEach.call(asd.querySelectorAll('section'), function(s){ s.style.display = ''; });
      var sm = asd.querySelector('[data-gbsum]'); if (sm) sm.style.display = 'none';
      var order = all.filter(function(e){ return e.matches('.rv-tile,.rv-card3,.rv-info,.rv-prog'); }).sort(function(x, y){ return +x.getAttribute('data-pri') - +y.getAttribute('data-pri'); });
      function over(){ return asd.scrollHeight > asd.clientHeight + 1; }
      for (var q = 0; q < order.length && over(); q++) { if (+order[q].getAttribute('data-pri') >= 100) break; order[q].style.display = 'none'; var sc = order[q].closest('section'); if (sc && ![].some.call(sc.querySelectorAll('.rv-tile,.rv-card3,.rv-info,.rv-prog'), function(t){ return t.style.display !== 'none'; })) sc.style.display = 'none'; }
      if (over()) asd.style.overflowY = 'auto';   /* si aun así no cabe (p. ej. los dos Ask Vela en una ventana baja), el panel hace scroll por dentro en vez de esconder contenido */
      if (sm) { var gv = [].filter.call(sm.parentNode.children, function(t){ return t !== sm && t.hasAttribute('data-pri') && t.style.display !== 'none'; }); if (gv.length === 1) { gv[0].style.display = 'none'; sm.style.display = ''; sm.closest('section').style.display = ''; } }
    }
    setTimeout(fit, 0); setTimeout(fit, 350); var ft = 0; addEventListener('resize', function(){ clearTimeout(ft); ft = setTimeout(fit, 80); });
    asd.addEventListener('click', function(e){ var t = e.target.closest('[data-vto],[data-vact],[data-vmodal]'); if (!t) return; e.preventDefault(); e.stopPropagation(); if (t.getAttribute('data-vmodal')) { vmodal(t.getAttribute('data-vmodal')); return; } if (t.getAttribute('data-vact') === 'share') { if (window.__shareLink) window.__shareLink(t); } else location.href = t.getAttribute('data-vto') + '.d.html'; }, true);
    return true;
  }
  function vmodal(kind, dataOnly){
    if (!dataOnly && document.querySelector('.fx-why')) return;
    var CLOCK = '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', KEY = '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M16 7l3 3"/>', OK = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', INFO = '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', LAW = '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>', USERS = '<circle cx="9" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M19 8v6M22 11h-6"/>', DOCI = '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>';
    var offer = ECI && LCO ? 'early check-in and late check-out' : ECI ? 'early check-in' : 'late check-out';
    var M = {
      who: { t: 'Who has to register?', it: [[USERS, 'Everyone staying' + (MIN ? ', including minors' : '') + ': by local law each guest has to be recorded.'], [INFO, N + ' guests in this booking' + (MIN ? ', ' + MIN + ' of them minors.' : '.')], [OK, 'The booking holder goes first. The others can register from their own phone with a link, or you can add them yourself.']] },
      what: { t: 'What do I need to register?', it: [[DOCI, 'A passport, ID card or driving licence: whichever you have on hand.'], [OK, IVON ? 'A quick selfie to confirm it is you.' : 'A few personal details, entered in the form.'], [CLOCK, 'It takes about 2 minutes per guest.']] },
      why: { t: 'Why do I need to register?', it: [[LAW, 'As required by local law, all tourist accommodations must keep a record of their guests. This means we need a small amount of personal information from you.'], [CLOCK, 'Completing the online check-in before you arrive will save you time.'], [OK, 'We handle all personal data in line with the General Data Protection Regulation (GDPR). To learn more, please read our privacy policy.']] },
      times: { t: 'Check-in and check-out times', it: [[CLOCK, 'Your standard times are check-in from 15:00 and check-out until 11:00.'], [INFO, 'Your host offers ' + offer + ' for this booking, so you could ' + (ECI && LCO ? 'arrive earlier or leave later' : ECI ? 'arrive earlier' : 'leave later') + ' than the standard times, subject to availability.'], [OK, 'Anything you add is confirmed before your stay.']], ctas: [].concat(ECI ? [['See early check-in', 'offers-all']] : [], LCO ? [['See late check-out', 'offers-all']] : []) },
      access: { t: 'When do I get access to the property?', it: [[KEY, 'Your host uses remote access, so there is no key handover: you receive your access codes or digital keys by email and in the app.'], [CLOCK, 'They are released from 15:00 on your check-in day' + (ECI ? ', or earlier if you add an early check-in.' : '.')], [OK, 'To receive them, every guest needs to be registered.']].concat(ECI ? [[INFO, 'Your host offers early check-in for this booking from €25, so you could get access earlier.']] : []), ctas: ECI ? [['Got it', null], ['Add early check-in', 'offers-all']] : null }
    }[kind]; if (dataOnly) return M; if (!M) return;
    var ov = document.createElement('div'); ov.className = 'fx-why'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'fx-why-t');
    ov.innerHTML = '<div class="fx-why-c"><button type="button" class="fx-why-x" aria-label="Close">' + ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20) + '</button><h2 id="fx-why-t">' + M.t + '</h2>' + M.it.map(function(x){ return '<div class="fx-why-i"><i>' + ic(x[0], 18) + '</i><p>' + x[1] + '</p></div>'; }).join('') + '<div class="fx-why-btns">' + (M.ctas || [['Got it', null]]).map(function(c){ return '<button type="button" class="fx-why-b"' + (c[1] ? ' data-go="' + c[1] + '"' : '') + '>' + c[0] + '</button>'; }).join('') + '</div></div>';
    document.body.appendChild(ov); requestAnimationFrame(function(){ ov.classList.add('in'); });
    function close(){ ov.classList.remove('in'); document.removeEventListener('keydown', k, true); setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200); }
    function k(e){ if (e.key === 'Escape') close(); } document.addEventListener('keydown', k, true);
    ov.addEventListener('click', function(e){ e.stopPropagation(); var gb = e.target.closest('.fx-why-b'); if (gb && gb.getAttribute('data-go')) { location.href = gb.getAttribute('data-go') + '.d.html'; return; } if (e.target === ov || e.target.closest('.fx-why-x, .fx-why-b')) close(); });
  }
  var n = 0; (function t(){ if (!build() && n++ < 40) setTimeout(t, 100); })();

})();
})();
