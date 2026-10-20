(function(){
'use strict';
var sec = document.querySelector('[data-testid="checkin-checklist"]'); if (!sec) return;
/* VERSIÓN FINAL: P5 en escritorio y P1 en móvil. El resto, por URL (?chk=x, n4, p3, p9, o…) */
var IS_MOBILE = (window.__SCREEN && window.__SCREEN.v) ? window.__SCREEN.v === 'm' : window.matchMedia('(max-width:1024px)').matches;
var DEFAULT = IS_MOBILE ? 'p1' : 'p5';
var v = (new URLSearchParams(location.search).get('chk') || DEFAULT).toLowerCase(); if (!/^(x|c1|n4|n4y|p1|p3|p4|p5|p8|p9|o)$/.test(v)) v = DEFAULT;
function set(k){
  v = k; sec.parentNode.setAttribute('data-chk', k);
  [].forEach.call(sw.querySelectorAll('button'), function(b){ b.classList.toggle('on', b.getAttribute('data-k') === k); });
  var p = new URLSearchParams(location.search); if (k === DEFAULT) p.delete('chk'); else p.set('chk', k);
  history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
}
var sw = document.createElement('div'); sw.className = 'chk-switch';
/* Finalistas visibles en el selector. Archivadas (no se muestran, pero siguen funcionando por URL): c1, n4y, p4, p8 */
sw.innerHTML = '<span>Check-in</span><button type="button" data-k="x">Actual</button><button type="button" data-k="n4">N4</button><span>Pendiente</span><button type="button" data-k="p1">P1</button><button type="button" data-k="p3">P3</button><button type="button" data-k="p5">P5</button><button type="button" data-k="p9">P9</button>';
sw.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); set(b.getAttribute('data-k')); }, true);

/* accesibilidad de N4: nombre = título del paso, descripción aparte, decoración oculta, lista con nombre */
function enhance(){
  var n4 = document.querySelector('.chk-vn4'); if (!n4) return;
  var ht = n4.querySelector('.chk-ht'); if (ht) ht.id = 'chk-ht4';
  var list = n4.querySelector('.chk-list');
  if (list) { list.setAttribute('role', 'list'); if (ht) list.setAttribute('aria-labelledby', 'chk-ht4'); [].forEach.call(list.children, function(c){ c.setAttribute('role', 'listitem'); }); }
  [].forEach.call(n4.querySelectorAll('[data-slot="task-row"]'), function(r, i){
    var col = r.querySelector('.flex-col'), kids = col ? col.children : [], id = 'chk4r' + i;
    if (kids[0]) { kids[0].id = id + 't'; r.setAttribute('aria-labelledby', id + 't'); }
    if (kids[1]) { kids[1].id = id + 'd'; r.setAttribute('aria-describedby', id + 'd'); }
    [].forEach.call(r.querySelectorAll('svg'), function(s){ s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); });
    var cta = r.querySelector('.chk-cta'); if (cta) cta.setAttribute('aria-hidden', 'true');
  });
}


/* ===== Estados por paso: cada paso (Guest details, Payments) puede estar pendiente o completado; se combinan libremente ===== */
var qs0 = new URLSearchParams(location.search);
/* Estados de la tarjeta: sin empezar · en camino · completado (cada uno fija el estado de los dos pasos) */
var STATUS = qs0.get('st'); if (['new','way','done'].indexOf(STATUS) < 0) STATUS = (qs0.get('cs') === '3') ? 'done' : 'new';
var ST = { g: 1, p: 1 };   /* g/p: 'new' (sin empezar) | 1 pendiente | 2 completado */
var VW = qs0.get('vw'); if (['sec','txt','ico','chev','doc','lupa'].indexOf(VW) < 0) VW = 'chev';       /* VERSIÓN FINAL: chevron (las demás, solo por ?vw=) */
var TICK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
var EYE = '<svg class="chk-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var CHV = '<svg class="chk-chv" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>';
var DOC = '<svg class="chk-doc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M14 3l5 5v2"/><path d="M14 3v5h5"/><path d="M8.5 12h4M8.5 15.5h2.5"/><circle cx="17" cy="17" r="4.3" fill="currentColor" stroke="none"/><path d="M13.6 17s1.3-2.3 3.4-2.3 3.4 2.3 3.4 2.3-1.3 2.3-3.4 2.3S13.6 17 13.6 17z" fill="#fff" stroke="none"/><circle cx="17" cy="17" r="1" fill="currentColor" stroke="none"/></svg>';
var LUPA = '<svg class="chk-lupa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 2h8l5 5v4.2a6.5 6.5 0 0 0-8.9 8.6L10 20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path fill="#fff" d="M14 2.5V7a1 1 0 0 0 1 1h4.5"/><path stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M7.5 9.5h4.5M7.5 13h3"/><circle cx="16.5" cy="16" r="4.6" fill="#fff" stroke="currentColor" stroke-width="1.8"/><path d="M13.6 16s1.1-2 2.9-2 2.9 2 2.9 2-1.1 2-2.9 2-2.9-2-2.9-2z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="16.5" cy="16" r=".9" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M19.8 19.3 22 21.5"/></svg>';
var csw = document.createElement('div'); csw.className = 'chk-cs';
csw.innerHTML = '<button type="button" data-st="new">Sin empezar</button><button type="button" data-st="way">En camino</button><button type="button" data-st="done">Completado</button>';
function ensureIcons(){ [].forEach.call(document.querySelectorAll('.chk-vn4 .chk-cta'), function(c){ if (!c.querySelector('.chk-eye')) c.insertAdjacentHTML('beforeend', EYE + CHV + DOC + LUPA); }); }
/* Pagos activos (Controles > Pagos): sin ninguno se oculta la fila; con alguno, título/descripción/CTA se adaptan */
function paySel(){ try { return JSON.parse(localStorage.getItem('replica-gc-payments') || '["reservation"]').filter(function(k){ return ['deposit', 'taxes', 'reservation'].indexOf(k) > -1; }); } catch (e) { return []; } }
/* importes de demo: reservation = el de siempre (€12.00); tasa = 2 huéspedes × 2 noches × €1; depósito = €100 */
var PAYAMT = { deposit: 100, taxes: 4, reservation: 12 };
var eur = function(n){ return '€' + n.toFixed(2); };
var PAYT = { deposit: 'Deposit', taxes: 'Tourist tax', reservation: 'Payment' };
function depType(){ try { return localStorage.getItem('replica-deposit-type') === 'token' ? 'token' : 'hold'; } catch (e) { return 'hold'; } }   /* hold = retención · token = solo se guarda la tarjeta */
function payCfg(sel, resAmt){
  /* una sola fila de pagos (un solo paso). Con depósito + tasas/reserva: «€16.00 to pay · €100 hold» y el botón cobra lo que se paga */
  var amt = { taxes: PAYAMT.taxes, reservation: resAmt }, ps = sel.filter(function(k){ return k !== 'deposit'; }), hasDep = sel.indexOf('deposit') > -1, dep = eur(PAYAMT.deposit), dep0 = '€' + PAYAMT.deposit, tok = depType() === 'token', out = { pay: null };
  if (!ps.length) {
    if (hasDep) out.pay = tok ? { title: 'Deposit', desc: 'Save a card on file', cta: 'Add card', done: 'Card saved', doneCta: 'View card' }
                              : { title: 'Deposit', desc: dep + ' card hold', cta: 'Hold ' + dep, done: dep + ' held', doneCta: 'View deposit' };
    return out;
  }
  var tot = 0; ps.forEach(function(k){ tot += amt[k]; });
  var t = eur(tot), title = ps.length === 1 && !hasDep ? PAYT[ps[0]] : 'Payments';
  out.pay = hasDep
    ? { title: title, desc: t + ' to pay · ' + (tok ? 'save card' : dep0 + ' hold'), cta: 'Pay ' + t, done: t + ' paid · ' + (tok ? 'card saved' : dep0 + ' held'), doneCta: 'View payments' }
    : (ps.length === 1 ? { title: title, desc: t + ' left to pay', cta: 'Pay ' + t, done: 'Paid ' + t, doneCta: 'View payment' }
                       : { title: title, desc: t + ' · ' + ps.length + ' payments', cta: 'Pay ' + t, done: 'Paid ' + t, doneCta: 'View payments' });
  return out;
}
/* «2 steps left» de la tarjeta de llaves: el número real de pasos pendientes */
function fixSteps(n, bothText){
  [].forEach.call(document.querySelectorAll('span,p,div'), function(e){
    if (e.children.length || e.childNodes.length !== 1) { if (!e._orig) return; }
    if (!e._orig) { if (!/^2 steps left/.test(e.textContent)) return; e._orig = e.textContent; }
    e.textContent = e._orig.replace('2 steps left', n === 1 ? '1 step left' : n + ' steps left').replace('finish both to unlock', bothText ? 'finish both to unlock' : (n === 1 ? 'finish check-in to unlock' : 'finish all to unlock'));
  });
}
function apply(){
  ensureIcons();
  var n4 = document.querySelector('.chk-vn4'); if (!n4) return;
  var rows = [].slice.call(n4.querySelectorAll('[data-slot="task-row"]'));
  var ht = n4.querySelector('.chk-ht'), due = n4.querySelector('.chk-k4d'), head = n4.querySelector('.chk-k4h');
  if (!n4._o) {
    var lk = n4.querySelector('.chk-k4l svg');
    n4._o = { head: ht ? ht.textContent : '', lock: lk ? lk.outerHTML : '', cta: rows.map(function(r){ var c = r.querySelector('.chk-cta'); return c && c.firstChild ? c.firstChild.textContent.trim() : ''; }), desc: rows.map(function(r){ var d = r.querySelector('.flex-col').children[1]; return d ? d.textContent : ''; }), chip: rows.map(function(r){ var c = r.querySelector('.chk-pt'); return c ? c.textContent : 'Pending'; }), pc: rows.map(function(r){ var c = r.querySelector('.chk-pclock'); return c ? c.innerHTML : ''; }) };
  }
  ST = STATUS === 'done' ? { g: true, p: true } : (STATUS === 'way' ? { g: false, p: true } : { g: false, p: false });
  var o = n4._o, nG = (function(){ try { var v = localStorage.getItem('replica-gc-n'); if (['2', '4', '6', '9', '14'].indexOf(v) > -1) return v; } catch (e) {} return '4'; })()   /* el número de huéspedes lo marca el ajuste de la reserva */, amt = (/(€\s?[\d.,]+)/.exec(o.desc[1]) || [0, ''])[1];
  var sel = paySel(), pcfg = payCfg(sel, parseFloat(String(amt).replace('€', '').replace(',', '.')) || PAYAMT.reservation), hasPay = !!pcfg.pay;
  var vis = [true, hasPay], ns = [STATUS === 'new', false], done = [ST.g, ST.p], nSteps = hasPay ? 2 : 1;
  var all = ST.g && (ST.p || nSteps === 1), left = (ST.g ? 0 : 1) + (!ST.p ? nSteps - 1 : 0);
  n4.setAttribute('data-cs', all ? '3' : (left === 1 ? '2' : '1')); n4.setAttribute('data-vw', VW);
  var ra = true; try { ra = localStorage.getItem('replica-remote-access') !== '0'; } catch (e) {}
  var stepsTxt = left === 1 ? '1 step' : left + ' steps';
  if (ht) ht.textContent = all ? 'Check-in completed' : stepsTxt + (ra ? ' to unlock your keys' : ' to complete your check-in');
  var cur = n4.querySelector('.chk-k4l svg'); if (cur) cur.outerHTML = all ? TICK.replace('<svg ', '<svg width="16" height="16" ') : o.lock;
  if (due) due.style.display = all ? 'none' : '';
  var sub = head && head.querySelector('.chk-sub');
  if (all && head && !sub) { sub = document.createElement('p'); sub.className = 'chk-sub'; sub.textContent = "You're all set for your arrival"; head.appendChild(sub); }
  if (sub) sub.style.display = all ? '' : 'none';
  rows.forEach(function(r, i){
    var dn = done[i], nsr = ns[i], d = r.querySelector('.flex-col').children[1], c = r.querySelector('.chk-cta'), pt = r.querySelector('.chk-pt'), pc = r.querySelector('.chk-pclock');
    r.classList.toggle('chk-rdone', dn); 
    r.setAttribute('data-state', dn ? 'done' : 'pending');
    var cfg = i === 1 ? pcfg.pay : null, oi = i;
    if (i >= 1) {
      r.parentElement.style.display = vis[i] ? '' : 'none';
      var tt = r.querySelector('.flex-col').children[0], tn = tt && tt.firstChild;
      if (tn && tn.nodeType === 3) tn.nodeValue = cfg ? cfg.title : 'Payments';
    }
    if (d) d.textContent = dn ? (i === 0 ? nG + ' of ' + nG + ' guests registered' : ((cfg && cfg.done) || 'Paid ' + amt)) : (i === 0 ? ((nsr ? '0' : '1') + ' of ' + nG) + ' guests registered' : ((cfg && cfg.desc) || o.desc[oi]));
    if (c) { var sp = c.querySelector('span') || c.firstChild; var lab = dn ? (i === 0 ? 'View guests' : ((cfg && cfg.doneCta) || 'View payment')) : (i === 0 ? (nsr ? 'Start' : 'Continue') : ((cfg && cfg.cta) || o.cta[oi])); if (sp) { if (sp.nodeType === 3) sp.textContent = lab + ' '; else sp.textContent = lab; } }
    if (pt) pt.textContent = dn ? 'Done' : 'Pending';
    if (pc) pc.innerHTML = dn ? TICK : o.pc[oi];
  });
  fixSteps(all ? nSteps : left, nSteps === 2);
  [].forEach.call(csw.querySelectorAll('button[data-st]'), function(b){ b.classList.toggle('on', b.getAttribute('data-st') === STATUS); });
  [].forEach.call(csw.querySelectorAll('button[data-v]'), function(b){ b.classList.toggle('on', b.getAttribute('data-v') === VW); });
  var p = new URLSearchParams(location.search); p.delete('cs'); p.delete('done'); p.delete('new'); if (STATUS === 'new') p.delete('st'); else p.set('st', STATUS);
  if (VW !== 'chev') p.set('vw', VW); else p.delete('vw');
  history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
}
csw.addEventListener('click', function(e){
  var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation();
  if (b.hasAttribute('data-v')) VW = b.getAttribute('data-v'); else STATUS = b.getAttribute('data-st');
  apply();
}, true);
window.addEventListener('replica-pay-change', apply); window.addEventListener('replica-dep-change', apply); window.addEventListener('replica-ra-change', apply); window.addEventListener('storage', function(e){ if (e.key === 'replica-gc-payments' || e.key === 'replica-deposit-type') apply(); });
function init(){ if (window.__repPanel) window.__repPanel.add('Check-in', csw, 35); else document.body.appendChild(csw);   enhance(); [].forEach.call(sw.querySelectorAll('button'), function(b){ if (b.getAttribute('data-k') === DEFAULT) { b.classList.add('rec'); b.textContent += ' \u2605 Final'; } }); set(v); apply();   /* el selector de Check-in ya no se muestra: siempre sale la versión final (P5 escritorio, P1 móvil); el resto, por URL */ }
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();


/* ===== Componentes → Pendientes (V1 actual · V2 pasos numerados · V3 punto + estado · V4 siguiente paso destacado) ===== */
(function(){
  if (!document.querySelector('[data-testid="checkin-checklist"]')) return;
  var KEY = 'replica-pend', h = document.documentElement;
  var ver = function(){ var v = ''; try { v = localStorage.getItem(KEY) || ''; } catch (e) {} return /^[234]$/.test(v) ? v : '1'; };
  var apply = function(){ if (ver() !== '1') h.setAttribute('data-pend', ver()); else h.removeAttribute('data-pend'); prog(); };
  /* V2: barra de progreso por pasos (un tramo por paso visible; los completados en azul) */
  var prog = function(){
    var hd = document.querySelector('.chk-vn4 .chk-k4h'); if (!hd) return;
    var rows = [].filter.call(document.querySelectorAll('.chk-vn4 .chk-list>div'), function(d){ return d.style.display !== 'none'; });
    var done = rows.filter(function(d){ var r = d.querySelector('[data-slot="task-row"]'); return r && r.getAttribute('data-state') === 'done'; }).length;
    var p = hd.querySelector('.pd-prog'); if (!p) { p = document.createElement('div'); p.className = 'pd-prog'; p.setAttribute('aria-hidden', 'true'); hd.appendChild(p); }
    var html = ''; for (var i = 0; i < rows.length; i++) html += '<i' + (i < done ? ' class="on"' : '') + '></i>'; if (p.innerHTML !== html) p.innerHTML = html;
  };
  var t = null, sched = function(){ clearTimeout(t); t = setTimeout(prog, 60); };
  var start = function(){
    apply(); window.addEventListener('storage', function(e){ if (e.key === KEY) apply(); });
    var list = document.querySelector('.chk-vn4'); if (list) try { new MutationObserver(sched).observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state', 'style'] }); } catch (e) {}
    var tries = 0, iv = setInterval(function(){
      if (window.__repPanel && window.__repPanel.add) {
        clearInterval(iv);
        var el = document.createElement('div'); el.className = 'rail-switch';
        el.innerHTML = [['1', 'V1 · actual'], ['2', 'V2 · pasos numerados'], ['3', 'V3 · punto + estado'], ['4', 'V4 · siguiente paso']].map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === ver() ? ' on' : '') + '" data-pdv="' + o[0] + '">' + o[1] + '</button>'; }).join('');
        el.addEventListener('click', function(e){
          var b = e.target.closest('[data-pdv]'); if (!b) return; e.preventDefault(); e.stopPropagation();
          try { localStorage.setItem(KEY, b.getAttribute('data-pdv')); } catch (_) {}
          apply(); [].forEach.call(el.querySelectorAll('[data-pdv]'), function(c){ c.classList.toggle('on', c === b); });
        }, true);
        window.__repPanel.add('Pendientes', el, 27);
      } else if (++tries > 40) clearInterval(iv);
    }, 250);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
