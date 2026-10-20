/* Cuadro de control único de la réplica: reúne los selectores de vista, se arrastra por la cabecera y se pliega (cerrado por defecto).
   Cada grupo ocupa UNA línea. Dentro del marco de móvil (phone.html) el cuadro vive FUERA del teléfono. */
/* ===== Vista «Móvil + escritorio» (split.html): lo que haces en un marco se replica en el otro =====
   Las pulsaciones y la escritura reales (isTrusted) se envían al marco padre, que las reenvía al otro marco; allí se busca el mismo elemento (misma etiqueta, atributos data-*, texto…) y se pulsa. Así cada vista ejecuta su propia lógica (cámara simulada, spinners, modales, temporizadores) sin copiar el estado. */
(function(){
  var role = null, nested = false, TOP = null;
  try {
    TOP = window.top; if (TOP === window || !TOP.__phoneSplit) return;
    if (window.parent === TOP) role = window.frameElement && window.frameElement.getAttribute('data-role');
    else { nested = true; role = window.parent.frameElement && window.parent.frameElement.getAttribute('data-role'); }   /* modal en un iframe dentro del marco (p. ej. «Change guest count») */
  } catch (e) { return; }
  if (!role) return;
  if (!nested && new URLSearchParams(location.search).get('embed') === '1') return;
  var TARGET = 'button,a[href],[role="button"],[role="option"],[role="tab"],[role="radio"],[role="checkbox"],[role="switch"],[role="menuitem"],[data-a],[data-go],[data-vto],[data-ask],[data-act],[data-gc],[data-m],[data-q],[data-tab],label,summary,input[type="checkbox"],input[type="radio"]';
  var vis = function(e){ return !!(e.offsetParent || (e.getClientRects && e.getClientRects().length)); };
  var attrs = function(el){ var o = {}; [].forEach.call(el.attributes, function(a){ if (/^(data-|aria-label$|role$|type$|name$)/.test(a.name) && !/^data-(state|rep-)/.test(a.name) && a.name !== 'data-i') o[a.name] = a.value; }); return o; };
  var txt = function(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60); };
  var score = function(el, sg){ var a = attrs(el), n = 0, k; for (k in sg.attrs) if (a[k] === sg.attrs[k]) n++; for (k in a) if (!(k in sg.attrs)) n -= .5; return n; };
  /* mismo elemento en el otro marco: misma etiqueta y texto y, de entre esos, los que más atributos comparten (en escritorio y en móvil algún atributo cambia) */
  var cands = function(sg){
    var l = [].filter.call(document.querySelectorAll(sg.tag.toLowerCase()), function(el){ return vis(el) && txt(el) === sg.text; });
    if (!sg.text) { var al = sg.attrs['aria-label']; if (!al) return []; l = l.filter(function(el){ return el.getAttribute('aria-label') === al; }); }   /* botón solo de icono: se replica únicamente si el otro marco tiene el mismo aria-label (no confundir la hamburguesa del móvil con «ocultar Vela» del escritorio) */
    if (!l.length) return l; var best = -1e9; l.forEach(function(el){ el.__sc = score(el, sg); if (el.__sc > best) best = el.__sc; });
    return l.filter(function(el){ return el.__sc === best; });
  };
  var field = function(el){ return { tag: el.tagName, id: el.id || '', name: el.getAttribute('name') || '', ph: el.getAttribute('placeholder') || '', al: el.getAttribute('aria-label') || '', type: el.type || '' }; };
  var findField = function(f){ return [].filter.call(document.querySelectorAll(f.tag.toLowerCase()), function(el){ return vis(el) && el.id === f.id && (el.getAttribute('name') || '') === f.name && (el.getAttribute('placeholder') || '') === f.ph && (el.getAttribute('aria-label') || '') === f.al && (el.type || '') === f.type; })[0]; };
  var send = function(m){ if (nested) m.nested = true; try { TOP.postMessage(m, '*'); } catch (e) {} };   /* siempre al marco padre de la vista dividida, que lo reenvía al otro marco */
  document.addEventListener('click', function(e){
    if (!e.isTrusted) return;   /* solo lo que hace la persona, no lo que se replica */
    var el = e.target && e.target.closest ? e.target.closest(TARGET) : null; if (!el || el.closest('#rep-panel,#rep-panel-set,[data-rep-bar],.rep-switch,.rail-switch')) return;
    if (el.tagName === 'A' && el.target === '_blank') return;
    if (el.getAttribute('data-a') === 'gallery' || (el.tagName === 'INPUT' && el.type === 'file')) return;   /* abre el selector de archivos: la imagen elegida se comparte aparte */
    var sg = { tag: el.tagName, text: txt(el), attrs: attrs(el) }, list = cands(sg);
    send({ rep: 'ui-click', sig: sg, idx: Math.max(0, list.indexOf(el)) });
  }, true);
  document.addEventListener('input', function(e){
    if (!e.isTrusted) return; var el = e.target; if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.type === 'file' || el.type === 'password') return;
    send({ rep: 'ui-input', f: field(el), v: el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value });
  }, true);
  window.addEventListener('message', function(ev){
    var m = ev.data; if (!m) return;
    if ((m.rep === 'ui-click' || m.rep === 'ui-input') && m.nested && !nested) { [].forEach.call(document.querySelectorAll('iframe'), function(f){ try { f.contentWindow.postMessage(m, '*'); } catch (e) {} }); return; }   /* lo que pasó dentro de un modal en un iframe se pasa al modal del marco */
    if (nested && !m.nested) return;
    if (m.rep === 'ui-click' && m.sig) { var l = cands(m.sig), el = l[Math.min(m.idx || 0, l.length - 1)]; if (el) { try { el.click(); } catch (x) {} } return; }
    if (m.rep === 'ui-input' && m.f) {
      var el2 = findField(m.f); if (!el2) return;
      if (el2.type === 'checkbox' || el2.type === 'radio') { if (el2.checked !== m.v) el2.click(); return; }
      var proto = el2.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : (el2.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype), set = Object.getOwnPropertyDescriptor(proto, 'value');
      if (set && set.set) set.set.call(el2, m.v); else el2.value = m.v;
      el2.dispatchEvent(new Event('input', { bubbles: true })); el2.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
})();
(function(){
'use strict';
if (window.__repPanel) return;
/* dentro del modal embebido (?embed=1) no hay cuadro de controles ni barra de réplica */
if (new URLSearchParams(location.search).get('embed') === '1') { window.__repPanel = { add: function(){} }; return; }
try { if (window.frameElement && window.frameElement.getAttribute('data-role') === 'desk') { var TW = window.top, DR = (TW.__deskRows && TW.__deskRows.doc === document) ? TW.__deskRows : (TW.__deskRows = { doc: document, list: [] }); window.__repPanel = { add: function(t, e, o){ if ((o || 50) < 10 || t === 'Navegación' || t === 'Componentes') return; DR.list.push([t, e, o]); try { if (TW.__deskSync) TW.__deskSync(); } catch (_) {} } }; var st0 = document.createElement('style'); st0.textContent = '[data-rep-bar]{display:none!important}'; (document.head || document.documentElement).appendChild(st0); return; } } catch (e) {}   /* sin panel ni barra de navegación de la réplica en el marco de escritorio */   /* en la vista «Móvil + escritorio», el marco de escritorio no tiene panel: los ajustes viven en el último cuarto y los gobierna el marco del móvil */
var KEY = 'replica-panel-v2';
function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
function save(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
var st = load();
var hosted = false, hostWin = null;
try { if (window.parent && window.parent !== window && window.parent.__phoneHost) { hosted = true; hostWin = window.parent; } } catch (e) {}
var doc = hosted ? hostWin.document : document, win = hosted ? hostWin : window;
var split = false; try { split = hosted && !!hostWin.__phoneSplit; } catch (e) {}   /* vista «Móvil + escritorio»: un único panel en el último cuarto con tres pestañas (Controles · Ajustes de la reserva · Componentes) */

var css = '#rep-panel{position:fixed;z-index:100002;width:max-content;max-width:calc(100vw - 8px);font:600 11px system-ui,sans-serif;color:#161643;background:rgba(255,255,255,.97);border:1px solid #e5e6ee;border-radius:12px;box-shadow:0 8px 24px rgba(22,22,67,.22);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}'
 + '#rep-panel,#rep-panel *{pointer-events:auto!important;box-sizing:border-box}'
 + '#rep-panel .rp-h{display:flex;align-items:center;gap:8px;padding:4px 5px 4px 10px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}'
 + '#rep-panel.drag .rp-h{cursor:grabbing}'
 + '#rep-panel .rp-t{flex:1;font-weight:700;letter-spacing:.05em;text-transform:uppercase;font-size:10px;color:#6b6b95;display:flex;align-items:center;gap:6px;white-space:nowrap}'
 + '#rep-panel .rp-grip{width:12px;height:9px;background:radial-gradient(circle,#b7bcd6 1.1px,transparent 1.3px) 0 0/4px 4px}'
 + '#rep-panel .rp-b{width:22px;height:22px;border:0;border-radius:99px;background:#f1f2f9;color:#161643;font:700 14px/1 system-ui,sans-serif;cursor:pointer;padding:0}'
 + '#rep-panel .rp-b:hover{background:#e5e7f4}'
 + '#rep-panel .rp-body{display:block;padding:0 8px 6px;max-height:calc(100vh - 60px);overflow:auto}'
 + '#rep-panel.min .rp-body{display:none}'
 + '#rep-panel.min{border-radius:99px}#rep-panel.min .rp-h{padding-right:4px}'
 /* una línea por grupo: etiqueta a la izquierda, opciones a la derecha sin saltar de línea */
 + '#rep-panel .rp-s{display:grid;grid-template-columns:78px auto;align-items:center;column-gap:6px;padding:3px 0;border-top:1px solid #eef0f8}#rep-panel .rp-s:first-child{border-top:0}'
 + '#rep-panel .rp-sl{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8b95bd;line-height:1.15}'
 + '#rep-panel .rp-sc{min-width:0}'
 /* los selectores originales dejan de ser flotantes y pasan a ser contenido del cuadro */
 + '#rep-panel .rep-switch,#rep-panel .rail-switch,#rep-panel .acc-switch,#rep-panel .chk-switch,#rep-panel [data-rep-bar]{position:static!important;transform:none!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;opacity:1!important;overflow:visible!important;display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;align-items:center!important;gap:3px!important;white-space:nowrap!important}'
 + '#rep-panel .rep-break,#rep-panel .rep-sep,#rep-panel .rs-sep,#rep-panel .acc-switch i{display:none!important}'
 + '#rep-panel .acc-switch>span:first-child,#rep-panel .chk-switch>span:first-child,#rep-panel .rail-switch>.lbl:first-child{display:none!important}'
 + '#rep-panel .rep-switch a,#rep-panel .rail-switch a,#rep-panel .acc-switch button,#rep-panel .chk-switch button,#rep-panel .rs-chip,#rep-panel [data-rep-bar] a,#rep-panel [data-rep-bar] span{padding:3px 8px!important;font-size:11px!important;line-height:1.3!important}'
 + '#rep-panel .rep-switch span,#rep-panel .rail-switch .lbl,#rep-panel .acc-switch span,#rep-panel .chk-switch span{padding:0 2px!important;font-size:10px!important;font-weight:500!important;color:#8b95bd}'
 + '#rep-panel .rail-switch .lbl{padding:0 2px 0 6px!important}'
 + '#rep-panel.rp-dock{width:372px;max-width:none;display:flex;flex-direction:column}'
 + '#rep-panel.rp-dock .rp-h{cursor:default;touch-action:auto}'
 + '#rep-panel.rp-dock .rp-b,#rep-panel.rp-dock .rp-grip{display:none}'
 + '#rep-panel.rp-dock .rp-body{display:block;flex:1;min-height:0;max-height:none;overflow:auto}'
 + '#rep-panel.rp-dock .rp-s{grid-template-columns:78px minmax(0,1fr)}'
 + '#rep-panel.rp-dock .hub-sep{flex:0 0 100%;width:100%;height:0}'
 + '#rep-panel.rp-dock .hub-cs{row-gap:5px}'
 + '#rep-panel.rp-dock .rep-switch,#rep-panel.rp-dock .rail-switch,#rep-panel.rp-dock .acc-switch,#rep-panel.rp-dock .chk-switch,#rep-panel.rp-dock [data-rep-bar]{flex-wrap:wrap!important;white-space:normal!important}';

css += ' #rep-panel{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#fff;border:1px solid #e3e5f1;border-radius:16px;box-shadow:0 14px 36px rgba(22,22,67,.2)}'
 + '#rep-panel .rp-h{padding:10px 8px 10px 14px;border-bottom:1px solid #eef0f8}'
 + '#rep-panel.min .rp-h{border-bottom:0;padding:6px 6px 6px 12px}'
 + '#rep-panel .rp-t{gap:8px;text-transform:none;letter-spacing:0}'
 + '#rep-panel .rp-ti{display:flex;flex-direction:column;gap:1px;min-width:0}'
 + '#rep-panel .rp-ti b{font-size:13px;font-weight:700;color:#161643;line-height:1.2}'
 + '#rep-panel .rp-ti em{font-style:normal;font-size:10.5px;font-weight:500;color:#8b95bd;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 + '#rep-panel.min .rp-ti em{display:none}'
 + '#rep-panel .rp-body{padding:2px 14px 12px}'
 + '#rep-panel .rp-s{grid-template-columns:92px minmax(0,1fr);align-items:start;column-gap:10px;padding:10px 0;border-top:1px solid #eef0f8}'
 + '#rep-panel .rp-s:first-child{border-top:0}'
 + '#rep-panel .rp-sl{padding-top:8px;font-size:10.5px;font-weight:700;letter-spacing:.07em;color:#8b95bd}'
 /* bandeja segmentada: fondo suave, opciones planas, la elegida en azul marino */
 + '#rep-panel .rp-sc>*{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:2px!important;padding:3px!important;border-radius:12px!important;background:#f3f4fa!important;white-space:normal!important}'
 + '#rep-panel .rp-sc a,#rep-panel .rp-sc button,#rep-panel .rp-sc .rs-chip{min-height:28px;padding:4px 10px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:#4a5072!important;font:600 11.5px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif!important;text-decoration:none!important;cursor:pointer;display:inline-flex;align-items:center;white-space:nowrap;transition:background .12s,color .12s}'
 + '#rep-panel .rp-sc a:hover,#rep-panel .rp-sc button:hover,#rep-panel .rp-sc .rs-chip:hover{background:rgba(22,22,67,.07)!important;color:#161643!important}'
 + '#rep-panel .rp-sc a.on,#rep-panel .rp-sc button.on,#rep-panel .rp-sc .rs-chip.on,#rep-panel .rp-sc [aria-pressed="true"]{background:#161643!important;color:#fff!important;box-shadow:0 1px 3px rgba(22,22,67,.3)}'
 + '#rep-panel .rp-sc a:focus-visible,#rep-panel .rp-sc button:focus-visible{outline:2px solid #385bf8;outline-offset:1px}'
 + '#rep-panel .rp-sc span:not(.rs-chip){padding:0 4px 0 6px!important;font-size:10px!important;font-weight:600!important;color:#8b95bd!important;text-transform:uppercase;letter-spacing:.05em}'
 + '#rep-panel .rp-g{padding:12px 0 2px;display:flex;flex-direction:column;gap:1px}#rep-panel .rp-g:not(:first-child){margin-top:6px;border-top:2px solid #e3e5f1}#rep-panel .rp-g b{font-size:12px;font-weight:800;color:#161643;letter-spacing:.02em}#rep-panel .rp-g span{font-size:10.5px;font-weight:500;color:#8b95bd}#rep-panel .rp-g+.rp-s{border-top:0}'
 + '#rep-panel .rp-b{width:26px;height:26px;background:#f3f4fa}#rep-panel .rp-b:hover{background:#e6e8f5}'
 + '#rep-panel.rp-dock .rp-s{grid-template-columns:92px minmax(0,1fr)}';
css = css.split('#rep-panel').join(':is(#rep-panel,#rep-panel-set)');
css += ':is(#rep-panel,#rep-panel-set).rp-dock .rp-s{grid-template-columns:minmax(0,1fr);row-gap:4px;padding:9px 0}:is(#rep-panel,#rep-panel-set).rp-dock .rp-sl{padding-top:0}#rep-panel-set .rp-ti em{white-space:normal}';
var s = doc.createElement('style'); s.id = 'rep-panel-css'; s.textContent = css; doc.head.appendChild(s);

/* dentro del marco de móvil, el cuadro necesita los estilos de los selectores (el teléfono tiene los suyos aparte) */
if (hosted) {
  ['changes.css', 'rail-variants.css', 'access.css', 'checkin.css', 'hub.css'].forEach(function(f){
    if (doc.querySelector('link[data-rp="' + f + '"]')) return;
    var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/' + f; l.setAttribute('data-rp', f); doc.head.appendChild(l);
  });
}

var root, body;
function pos(){ return hosted ? { x: st.px, y: st.py } : { x: st.x, y: st.y }; }
function setPos(x, y){ if (hosted) { st.px = x; st.py = y; } else { st.x = x; st.y = y; } save(st); }
function clamp(){
  if (!root) return;
  if (hosted) { dock(); return; }
  var w = root.offsetWidth, h = root.offsetHeight, x = root.offsetLeft, y = root.offsetTop;
  x = Math.max(4, Math.min(win.innerWidth - w - 4, x)); y = Math.max(4, Math.min(win.innerHeight - h - 4, y));
  root.style.left = x + 'px'; root.style.top = y + 'px';
}
var rootS = null, bodyS = null;
function dock(){
  if (!root || !hosted) return;
  var stage = doc.querySelector('.stage'), top = stage ? Math.round(stage.getBoundingClientRect().top) : 70;
  if (split) { var W0 = win.innerWidth, w0 = Math.max(200, Math.round(W0 / 4) - 16), h0 = Math.max(160, win.innerHeight - top - 16) + 'px'; root.style.width = w0 + 'px'; root.style.right = 'auto'; root.style.maxHeight = ''; root.style.left = (Math.round(W0 * 3 / 4) + 8) + 'px'; root.style.top = top + 'px'; root.style.height = h0; return; }
  /* el tercio derecho de la ventana (el mockup ocupa los otros dos): «Controles» y «Ajustes de la reserva» lado a lado, como antes */
  var W = win.innerWidth, x0 = Math.round(W * 2 / 3), gap = 8, w = Math.max(180, Math.round((W / 3 - gap * 3) / 2));
  var h = Math.max(160, win.innerHeight - top - 16) + 'px';
  [root, rootS].forEach(function(r, i){ if (!r) return; r.style.width = w + 'px'; r.style.right = 'auto'; r.style.maxHeight = ''; r.style.left = (x0 + gap + i * (w + gap)) + 'px'; r.style.top = top + 'px'; r.style.height = h; });
}
/* selector del bloque de ajustes: «Ajustes de la reserva» (todo menos Componentes) o «Componentes» (solo Ask Vela tradicional / Ask Vela chat). Se recuerda */
var tabKey = split ? 'replica-split-tab' : 'replica-set-tab', TABS = split ? [['ctl', 'Controles'], ['set', 'Ajustes de la reserva'], ['comp', 'Componentes']] : [['set', 'Ajustes de la reserva'], ['comp', 'Componentes']];
var devKey = 'replica-split-dev', curDev = (function(){ try { return localStorage.getItem(devKey) === 'd' ? 'd' : 'm'; } catch (_) { return 'm'; } })(), devEls = [];
var curTab = (function(){ try { var v = localStorage.getItem(tabKey); return TABS.some(function(t){ return t[0] === v; }) ? v : TABS[0][0]; } catch (_) { return TABS[0][0]; } })(), tabsEls = [];
function twin(x){ var t = x.getAttribute('data-t'), r = false; [body, bodyS].forEach(function(B){ if (B) [].forEach.call(B.querySelectorAll('.rp-s:not([data-dev])'), function(y){ if (y.getAttribute('data-t') === t) r = true; }); }); return r; }
function twinOf(x){ var t = x.getAttribute('data-t'), r = false; if (body) [].forEach.call(body.querySelectorAll('.rp-s[data-dev="d"]'), function(y){ if (y.getAttribute('data-t') === t) r = true; }); return r; }
function applyTab(){
    tabsEls.forEach(function(d){ [].forEach.call(d.querySelectorAll('[data-tab]'), function(b){ var on = b.getAttribute('data-tab') === curTab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); });
  [body, bodyS].forEach(function(B){ if (!B) return; [].forEach.call(B.querySelectorAll('.rp-s'), function(x){
    var l = x.getAttribute('data-l'), t = x.getAttribute('data-t'); if (!l) return;
    var which = split ? ((t === 'Componentes' || t === 'Vela sombreado' || t === 'Bordes' || t === 'Pay later' || t === 'Order summary') ? 'comp' : (l === 'set' ? 'set' : 'ctl')) : (l === 'set' ? ((t === 'Componentes' || t === 'Vela sombreado' || t === 'Bordes' || t === 'Order summary' || t === 'Sombreados' || t === 'Separación' || t === 'Fondo' || t === 'Pregunta del huésped') ? 'comp' : 'set') : null);
    if (which) x.classList.toggle('rp-off', which !== curTab || (split && (which === 'ctl' || t === 'Order summary') && x.getAttribute('data-dev') === 'd' && twin(x)));   /* un control que existe en las dos vistas se muestra una sola vez (actúa en ambas) */
    if (split && which === 'ctl') { [].forEach.call(x.querySelectorAll('.rp-only'), function(n){ n.parentNode.removeChild(n); }); var hasTwin = twin(x), isD = x.getAttribute('data-dev') === 'd'; if (isD && !hasTwin || !isD && !twinOf(x)) { var lb = x.querySelector('.rp-sl'), tg = doc.createElement('em'); tg.className = 'rp-only'; tg.textContent = isD ? 'Solo escritorio' : 'Solo móvil'; tg.style.cssText = 'margin-left:6px;font:600 9px/1 system-ui,sans-serif;color:#385bf8;background:#eef1ff;border-radius:6px;padding:2px 5px;text-transform:none;letter-spacing:0;vertical-align:middle'; if (lb) lb.appendChild(tg); } }   /* con clase (no con style) para no pisar a «Tipo de depósito», que se oculta solo cuando no hay depósito */
  }); });
}
function mkDev(){
  var d = doc.createElement('div'); d.className = 'rp-dev'; d.innerHTML = '<button type="button" data-dev="m">Control móvil</button><button type="button" data-dev="d">Control escritorio</button>';
  if (!doc.getElementById('rp-dev-css')) { var s_ = doc.createElement('style'); s_.id = 'rp-dev-css'; s_.textContent = '.rp-dev{display:flex;gap:2px;margin:8px 12px 2px;padding:2px;border-radius:9px;background:#eef0f8}.rp-dev button{flex:1;border:0;border-radius:7px;background:none;padding:6px 4px;font:700 11px/1.2 system-ui,-apple-system,sans-serif;color:#8a8aab;cursor:pointer}.rp-dev button.on{background:#fff;color:#161643;box-shadow:0 1px 2px rgba(22,22,67,.15)}'; doc.head.appendChild(s_); }
  d.addEventListener('click', function(e){ var b = e.target.closest('[data-dev]'); if (!b) return; e.preventDefault(); e.stopPropagation(); curDev = b.getAttribute('data-dev'); try { localStorage.setItem(devKey, curDev); } catch (_) {} applyTab(); }, true);
  devEls.push(d); return d;
}
function mkTabs(){
  if (!doc.getElementById('rp-tabs-css')) { var st_ = doc.createElement('style'); st_.id = 'rp-tabs-css'; st_.textContent = '#rep-panel .rp-off,#rep-panel-set .rp-off{display:none!important}.rp-tabs{display:flex;gap:0;padding:0;margin:10px 0 4px;border:0;border-bottom:1.5px solid #e3e5f1;border-radius:0;background:none}.rp-tab{flex:1;display:flex;align-items:center;justify-content:center;min-height:34px;padding:6px 4px 8px;margin:0 0 -1.5px;border:0;border-bottom:3px solid transparent;border-radius:0;background:none;color:#8a8aab;font:700 11px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;cursor:pointer;transition:color .15s,border-color .15s}.rp-tab:hover{color:#161643}.rp-tab.on{color:#161643;border-bottom-color:#385bf8;background:none}.rp-tab:focus-visible{outline:2px solid #385bf8;outline-offset:-2px;border-radius:6px}'; doc.head.appendChild(st_); }
  var d = doc.createElement('div'); d.className = 'rp-tabs'; d.setAttribute('role', 'tablist');
  d.innerHTML = TABS.map(function(t){ return '<button type="button" role="tab" class="rp-tab" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('[data-tab]'); if (!b) return; e.preventDefault(); e.stopPropagation(); curTab = b.getAttribute('data-tab'); try { localStorage.setItem(tabKey, curTab); } catch (_) {} applyTab(); }, true);
  tabsEls.push(d); return d;
}
function buildSet(){
  rootS = doc.createElement('div'); rootS.id = 'rep-panel-set'; rootS.className = 'rp-dock';
  rootS.innerHTML = '<div class="rp-h"><span class="rp-t"><span class="rp-ti"><b>Ajustes de la reserva</b><em>Cómo está configurada la reserva</em></span></span></div><div class="rp-body"></div>';
  bodyS = rootS.querySelector('.rp-body'); rootS.insertBefore(mkTabs(), bodyS); doc.body.appendChild(rootS); dock();
}
function place(){
  if (hosted) { dock(); return; }
  var p = pos();
  if (typeof p.x === 'number' && typeof p.y === 'number') { root.style.left = p.x + 'px'; root.style.top = p.y + 'px'; }
  else if (hosted) {
    var ph = doc.getElementById('ph'), r = ph ? ph.getBoundingClientRect() : { left: 0, right: 0 }, w = root.offsetWidth;
    var x = (r.right + 16 + w <= win.innerWidth) ? r.right + 16 : ((r.left - 16 - w >= 4) ? r.left - 16 - w : 4);
    root.style.left = x + 'px'; root.style.top = '70px';
  } else { root.style.left = '8px'; root.style.top = Math.max(4, win.innerHeight - root.offsetHeight - 8) + 'px'; }
  clamp();
}
function build(){
  root = doc.createElement('div'); root.id = 'rep-panel';
  root.innerHTML = '<div class="rp-h"><span class="rp-t"><i class="rp-grip"></i><span class="rp-ti"><b>Controles</b><em></em></span></span><button type="button" class="rp-b" aria-label="Plegar o desplegar">+</button></div><div class="rp-body"></div>';
  body = root.querySelector('.rp-body');
  if (split) { root.insertBefore(mkTabs(), body); }
  try { var sc = window.__SCREEN || {}; root.querySelector('.rp-ti em').textContent = (sc.id || '') + (sc.v ? ' · ' + (sc.v === 'm' ? 'móvil' : 'escritorio') : ''); } catch (_) {}
  var min = hosted ? false : ((typeof st.min === 'boolean') ? st.min : true);     /* en escritorio cerrado por defecto; en el marco del móvil siempre abierto */
  if (hosted) root.classList.add('rp-dock');
  root.classList.toggle('min', min); root.querySelector('.rp-b').textContent = min ? '+' : '−';
  doc.body.appendChild(root);
  var drag = null, h = root.querySelector('.rp-h');
  h.addEventListener('pointerdown', function(e){
    if (hosted || e.target.closest('.rp-b')) return;
    drag = { dx: e.clientX - root.offsetLeft, dy: e.clientY - root.offsetTop, moved: false };
    root.classList.add('drag'); try { h.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault();
  });
  h.addEventListener('pointermove', function(e){ if (!drag) return; drag.moved = true; root.style.left = (e.clientX - drag.dx) + 'px'; root.style.top = (e.clientY - drag.dy) + 'px'; clamp(); });
  function end(){ if (!drag) return; root.classList.remove('drag'); if (drag.moved) setPos(root.offsetLeft, root.offsetTop); drag = null; }
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  function toggle(){ if (hosted) return; var m = !root.classList.contains('min'); root.classList.toggle('min', m); root.querySelector('.rp-b').textContent = m ? '+' : '−'; st.min = m; save(st); clamp(); }
  h.addEventListener('dblclick', toggle);
  root.querySelector('.rp-b').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggle(); });
  win.addEventListener('resize', clamp);
  /* enlaces del cuadro cuando vive fuera del teléfono: navegan DENTRO del teléfono */
  if (hosted) root.addEventListener('click', function(e){
    var a = e.target.closest('a[href]'); if (!a) return;
    e.preventDefault();
    try { window.location.href = new URL(a.getAttribute('href'), window.location.href).href; } catch (_) {}
  }, true);
  /* al cambiar de pantalla dentro del teléfono, el cuadro de la pantalla anterior se retira */
  window.addEventListener('pagehide', function(){ if (root && root.parentNode) root.parentNode.removeChild(root); if (rootS && rootS.parentNode) rootS.parentNode.removeChild(rootS); rootS = null; });
  place();
}
function api(title, el, order, dev){
  if (hosted && title === 'Navegación') return;          /* el marco del teléfono ya tiene su propia barra */
  var go = function(){
    if (!root) build();
    if (hosted && !dev) { try { [].forEach.call(el.querySelectorAll('a[href]'), function(a){ a.setAttribute('href', new URL(a.getAttribute('href'), window.location.href).href); }); doc.adoptNode(el); } catch (e) {} }
    /* dos capas: ajustes de la reserva (orden < 10) y vista (lo que estás viendo, orden >= 10) */
    var layer = (order || 50) < 10 ? 'set' : 'view', B = body;
    if (hosted && layer === 'set' && !split) { if (!rootS) buildSet(); B = bodyS; }
    if (!hosted && !body.querySelector('.rp-g[data-l="' + layer + '"]')) {
      var gh = doc.createElement('div'); gh.className = 'rp-g'; gh.setAttribute('data-l', layer); gh.setAttribute('data-o', layer === 'set' ? 0 : 9.5);
      gh.innerHTML = layer === 'set' ? '<b>Ajustes de la reserva</b><span>Cómo está configurada la propiedad y la reserva</span>' : '<b>Vista</b><span>Qué pantalla y qué estado estás viendo</span>';
      if (layer === 'set') gh.appendChild(mkTabs());
      var gat = null; [].forEach.call(B.children, function(k){ if (!gat && (+k.getAttribute('data-o')) > (+gh.getAttribute('data-o'))) gat = k; });
      B.insertBefore(gh, gat);
    }
    if (dev) { try { [].forEach.call(el.querySelectorAll('a[href]'), function(a){ a.setAttribute('href', new URL(a.getAttribute('href'), el.ownerDocument.location.href).href); }); doc.adoptNode(el); } catch (e) {} }
    var sec = doc.createElement('div'); sec.className = 'rp-s'; if (dev) sec.setAttribute('data-dev', 'd'); sec.setAttribute('data-o', order || 50); sec.setAttribute('data-l', layer); sec.setAttribute('data-t', title);
    var l = doc.createElement('span'); l.className = 'rp-sl'; l.textContent = title;
    var c = doc.createElement('div'); c.className = 'rp-sc'; c.appendChild(el);
    sec.appendChild(l); sec.appendChild(c);
    var at = null;
    [].forEach.call(B.children, function(k){ if (!at && (+k.getAttribute('data-o')) > (order || 50)) at = k; });
    B.insertBefore(sec, at); applyTab();
    if (hosted) { dock(); return; }
    var p = pos(); if (typeof p.x !== 'number') place(); else clamp();
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
}
window.__repPanel = { add: api };
if (split) {
  var lastDR = null, done = [];
  var sync = function(){
    var DR = hostWin.__deskRows; if (!DR) return;
    if (!body) { if (document.body) { /* el cuadro aún no existe: se construye al primer api() */ } }
    if (DR !== lastDR) { lastDR = DR; done = []; if (body) [].forEach.call(body.querySelectorAll('[data-dev="d"]'), function(n){ n.parentNode.removeChild(n); }); }
    DR.list.forEach(function(r){ if (done.indexOf(r) < 0) { done.push(r); api(r[0], r[1], r[2], true); } });
  };
  hostWin.__deskSync = sync; sync();
  /* un control que existe en las dos vistas actúa también en el marco de escritorio (p. ej. «Modal huéspedes»); los enlaces ya los sincroniza la navegación */
  var mirrorClick = function(e){
    if (!e.isTrusted) return; var b = e.target.closest && e.target.closest('button,[role=button]'), sec = b && b.closest('#rep-panel .rp-s:not([data-dev])'); if (!sec) return;
    var tw = null; [].forEach.call(body.querySelectorAll('.rp-s[data-dev="d"]'), function(y){ if (y.getAttribute('data-t') === sec.getAttribute('data-t')) tw = y; }); if (!tw) return;
    var sel = 'button,[role=button]', i = [].indexOf.call(sec.querySelectorAll(sel), b), t = tw.querySelectorAll(sel)[i]; if (t) setTimeout(function(){ try { t.click(); } catch (_) {} }, 0);
  };
  doc.addEventListener('click', mirrorClick, true);
  window.addEventListener('pagehide', function(){ doc.removeEventListener('click', mirrorClick, true); });
  window.addEventListener('pagehide', function(){ if (hostWin.__deskSync === sync) hostWin.__deskSync = null; });
}
})();
