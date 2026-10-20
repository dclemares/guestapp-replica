(function(){
'use strict';
var S = window.__SCREEN || {};
var isDesk = function(){ return window.matchMedia('(min-width:1025px)').matches; };
var want = isDesk() ? 'd' : 'm';
var pgx = function(id){ return want === 'd' && id === 'g2-form-empty' ? 'form-empty' : id; };   /* en escritorio el formulario de huésped es form-empty */
function url(id, v){ var has = (id === S.id ? S.has : null); return id + '.' + v + '.html'; }
var NAV = null;
/* cadena de «atrás» del registro: formulario / verificación → resumen de huéspedes → Home */
var BACK = { 'iv-intro-f': 'hub-after-1', 'iv-intro-h': 'hub-after-1', 'g2-form-empty': 'hub-after-1', 'g2-form-filled': 'hub-after-1', 'g2-register-failed': 'g2-form-filled', 'g2-registered': 'hub-after-1', 'hub-after-1': 'home', 'pay-0-sheet': 'cart', 'pay-1-protection': 'cart', 'pay-1b-protection-scrolled': 'cart', 'pay-1b-scrolled': 'cart', 'pay-1c-covered-sheet': 'cart', 'pay-1d-deposit-sheet': 'cart', 'pay-1e-deposit-selected': 'cart', 'pay-1f-bottom': 'cart' };   /* el paso del depósito vuelve a Pagos */
/* Menú lateral: tocar fuera lo cierra y vuelve a la pantalla desde la que se abrió (no siempre la Home) */
if (S.id === 'menu') document.addEventListener('click', function(e){
  var ov = e.target.closest && e.target.closest('[class*="bg-black/50"]'); if (!ov || e.target.closest('[role="dialog"]')) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  var r = ''; try { var u = new URL(document.referrer); if (u.origin === location.origin && /\/screens\/[^/]+\.[md]\.html$/.test(u.pathname) && !/\/menu\./.test(u.pathname)) r = u.pathname + u.search; } catch (x) {}
  location.href = r || ('home.' + want + '.html');
}, true);
var norm = function(s){ return (s||'').replace(/\s+/g,' ').replace(/\u20ac\s?(\d[\d.,]*\d|\d)/g,'$1\u20ac').trim().toLowerCase(); };   /* «€12.00» y «12.00€» se comparan como lo mismo (el euro va detrás de las cifras, pay-views.js) */

/* Recargar (Cmd+R) en una pantalla de proceso (verificación, formulario, escaneo, envío) vuelve a la Home: el estado se pierde igualmente. */
try {
  var __nv = performance.getEntriesByType('navigation')[0], __keep = sessionStorage.getItem('rep-keep-reload');
  if (__keep) sessionStorage.removeItem('rep-keep-reload');
  else if (__nv && __nv.type === 'reload' && /^(g2-|iv-intro-|form-|scan-|submit-|hub-)/.test(S.id || '')) { location.replace('home.' + want + '.html'); return; }
} catch (e) {}
/* use the layout that matches the screen size when both were captured */
if (S.has && S.has.indexOf(want) > -1 && S.v !== want) { location.replace(S.id + '.' + want + '.html' + location.search + location.hash); return; }

/* things every screen shares: sidebar / bottom bar */
var GLOBAL = { 'home':'home', 'registration':'hub-after-1', 'stay':'nav-stay', 'discover':'offers-all', 'recommendations':'offers-all',
  'payments':'cart', 'faqs':'faqs', 'guest details':'hub-after-1' };

/* Menú hamburguesa: el cajón se desliza sobre la propia pantalla (sin cargar otra página). Se toma de menu.*.html y se inyecta. */
var MENU = { tpl: null, el: null };
function menuLoad(){ if (MENU.tpl || MENU.busy) return; MENU.busy = true; fetch('menu.' + want + '.html').then(function(r){ return r.text(); }).then(function(t){ var d = new DOMParser().parseFromString(t, 'text/html'); var ov = d.querySelector('[data-slot="sheet-overlay"]'), dl = d.querySelector('[data-slot="sheet-content"]'); if (ov && dl) MENU.tpl = [ov, dl]; }).catch(function(){}); }
function menuClose(){
  var w = MENU.el; if (!w) return; MENU.el = null; w.style.pointerEvents = 'none';
  var ov = w.children[0], dl = w.children[1];
  ov.style.opacity = '0'; dl.style.transform = 'translateX(-102%)';
  setTimeout(function(){ if (w.parentNode) w.parentNode.removeChild(w); }, 420);
}
function menuOpen(){
  if (!MENU.tpl || MENU.el) return false;
  var w = document.createElement('div'); w.className = 'rep-menu'; w.style.cssText = 'position:fixed;inset:0;z-index:2147483000';
  var ov = document.importNode(MENU.tpl[0], true), dl = document.importNode(MENU.tpl[1], true);
  /* animación propia (sin los data-state de la plantilla): fondo y cajón entran y salen con transiciones continuas, sin saltos */
  ov.removeAttribute('data-state'); dl.removeAttribute('data-state');
  ov.style.cssText = 'opacity:0;transition:opacity .34s ease;will-change:opacity';
  dl.style.transform = 'translateX(-102%)'; dl.style.transition = 'transform .4s cubic-bezier(.22,.8,.24,1)'; dl.style.willChange = 'transform';
  w.appendChild(ov); w.appendChild(dl); document.body.appendChild(w); MENU.el = w;
  void w.offsetWidth;
  setTimeout(function(){ ov.style.opacity = '1'; dl.style.transform = 'translateX(0)'; }, 30);
  ov.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); menuClose(); });
  dl.addEventListener('click', function(e){
    var it = e.target.closest('a,button,[role="link"],[role="button"],li'); if (!it) return;
    var t = norm(it.innerText || it.getAttribute('aria-label') || ''); e.preventDefault(); e.stopPropagation();
    var list = (NAV && NAV.menu) || [], to = null;
    for (var i = 0; i < list.length; i++) { var x = norm(list[i].text); if (t === x || t.indexOf(x) === 0) { to = list[i].to; break; } }
    if (!to && GLOBAL[t]) to = GLOBAL[t];
    if (to) { if (to === S.id) menuClose(); else location.href = pgx(to) + '.' + want + '.html'; }
  });
  return true;
}
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && MENU.el) menuClose(); }, true);
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('header button[aria-label="Menu"]'); if (!b || /^menu$/.test(S.id || '')) return;
  if (menuOpen()) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
}, true);
if (document.readyState !== 'loading') menuLoad(); else document.addEventListener('DOMContentLoaded', menuLoad);


function exists(id){ return true; }
function go(id){
  fetch('../nav.json').then(function(r){return r.json()}).then(function(){}).catch(function(){});
  var v = want;
  location.href = id + '.' + v + '.html';
}
function target(el){
  var c = el.closest('button,a,[role=button],[role=tab],[role=menuitem],label,li');
  return c || el;
}
function label(el){ return norm(el.innerText || el.getAttribute('aria-label') || ''); }

fetch('../nav.json').then(function(r){return r.json()}).then(function(j){ NAV = j; }).catch(function(){ NAV = {}; });


/* ===== modal "Change guest count" sobre la pantalla actual y "Share a link" con el menú nativo ===== */
var EMBED = new URLSearchParams(location.search).get('embed') === '1';
/* ===== móvil: docks de CTA y cabecera fija sin raya, con un mini sombreado (dock: hacia arriba siempre · cabecera: hacia abajo solo al hacer scroll) ===== */
(function(){
  var SH_UP = '0 -4px 14px rgba(22,22,67,.06)', SH_DOWN = '0 4px 14px rgba(22,22,67,.06)';
  var st = document.createElement('style'); st.id = 'rep-mini-shadow';
  st.textContent = '@media (max-width:1023.98px){'
    + 'html:not([data-fdock]) [data-slot="cta-dock"]:not(.ivi-dock-d),.rg-dock,.tx-dock,.dp-dock{background:#fff!important;background-image:none!important;border-top-color:transparent!important;box-shadow:' + SH_UP + '!important}'
    + 'div.sticky.z-20 > header{border-bottom-color:transparent!important;box-shadow:none;transition:box-shadow .2s ease}'
    + 'html[data-hscroll] div.sticky.z-20 > header{box-shadow:' + SH_DOWN + '!important}'
    + '}';
  (document.head || document.documentElement).appendChild(st);
  var raf = 0, check = function(e){ raf = 0; var y = window.scrollY || document.documentElement.scrollTop || 0; var t = e && e.target; if (t && t !== document && t.scrollTop) y = Math.max(y, t.scrollTop); document.documentElement.toggleAttribute('data-hscroll', y > 2); };
  document.addEventListener('scroll', function(e){ if (!raf) raf = requestAnimationFrame(function(){ check(e); }); }, { capture: true, passive: true });
  check();
})();
/* ===== botón de confirmación fijo abajo (todas las pantallas): barra blanca con degradado y botón grande con sombra azul ===== */
(function(){
  var cs = document.createElement('style'); cs.id = 'rep-dock';
  cs.textContent = '[data-slot="cta-dock"]{background:linear-gradient(to top,#fff 74%,rgba(255,255,255,0))!important;padding:22px 16px calc(16px + env(safe-area-inset-bottom,0px))!important;border:0!important;box-shadow:none!important}'
    + '[data-slot="cta-dock"] button:first-of-type{min-height:48px;border-radius:9999px!important;font-size:14.5px!important;font-weight:600!important;box-shadow:none}'
    + '[data-slot="cta-dock"] button:not(:first-of-type){border-radius:9999px!important;min-height:48px;font-size:14.5px!important}';
  document.head.appendChild(cs);
})();
(function(){   /* escritorio: el panel derecho (Vela y «Offers for your stay») proyecta una sombra suave hacia el contenido central, y «Offers» tiene el mismo ancho que Vela (320 px) */
  var rs = document.createElement('style'); rs.id = 'rep-rail-edge';
  try { var vs0 = localStorage.getItem('replica-vela-shadow'); if (vs0 === '0') document.documentElement.setAttribute('data-vshadow', '0'); else if (vs0 === '2') document.documentElement.setAttribute('data-vshadow', 'old'); } catch (e) {}
  rs.textContent = '@media (min-width:1024px){html[data-vshadow="old"] aside[data-slot="assistant-panel"],html[data-vshadow="old"] aside[data-slot="collapsible-rail"]{box-shadow:-14px 0 28px -18px rgba(22,22,67,.22),-1px 0 0 rgba(22,22,67,.04)!important}html:not([data-vshadow="0"]):not([data-vshadow="old"]) aside[data-slot="assistant-panel"],html:not([data-vshadow="0"]):not([data-vshadow="old"]) aside[data-slot="collapsible-rail"]{box-shadow:-1px 0 2px rgba(22,22,67,.05),-8px 0 22px rgba(22,22,67,.07)!important;position:relative;z-index:2}aside[data-slot="collapsible-rail"]{position:sticky}[class*="lg:grid-cols-[minmax(0,1fr)_324px]"]{grid-template-columns:minmax(0,1fr) clamp(320px,22vw,480px)!important}aside[data-slot="collapsible-rail"]{padding-left:24px!important;padding-right:24px!important}}';
  (document.head || document.documentElement).appendChild(rs);
})();
(function(){   /* Componentes → Bordes: «Sin borde total» = todo borde invisible (tarjetas, cajas, barras, chips, rayas…) salvo los campos de formulario y el panel de controles. Los Suggested de Vela, sin borde, llevan un relleno tenue para seguir pareciendo pulsables. Las sombras añadidas dependen de Componentes → Sombreados (por defecto No). */
  var NB = null; try { NB = localStorage.getItem('replica-nobd'); } catch (e) {}
  if (NB === null || NB === undefined) NB = '3';   /* por defecto: «Sin borde total» */
  var root = document.documentElement;
  if (NB === '1' || NB === '2' || NB === '3') root.setAttribute('data-nobd', '3');   /* las antiguas «Sin borde» y «cristal» se pasaron a «total» */
  var N3 = 'html[data-nobd] ', B = 'html[data-nobd][data-bsh="1"] ', sh = '0 1px 2px rgba(22,22,67,.05),0 8px 22px rgba(22,22,67,.07)';
  var KEEP3 = ':not(.counter__decrease-button):not(.t3-add):not(.pv-mh):not(.pv7-now):not(.chk-pclock):not([class*="spin"]):not([class*="-inset-"]):not(.rg-sd .sp):not(.iv-chip i):not(.v5s-row):not(.vc-chip):not(.iv-rd):not(aside span.absolute.bottom-0.right-0):not(div.mt-5[class*="border-t"]):not(input):not(select):not(textarea):not(fieldset):not(legend):not([data-slot="form-section-body"] *):not(#rep-panel):not(#rep-panel *):not(#rep-panel-set):not(#rep-panel-set *):not([data-rep-bar] *)';
  var nb = document.createElement('style'); nb.id = 'rep-nobd';
  nb.textContent = N3.replace(/ $/, '') + '{--card-border:transparent;--top-bar-border:transparent;--bottom-nav-border:transparent;--dialog-content-border:transparent;--assistant-divider:transparent;--rail-border:transparent}'
    + N3 + KEEP3 + '{border-color:transparent!important}'
    + 'html .counter__increase-button.counter__button,html .counter__decrease-button.counter__button{box-shadow:none!important}'   /* sin sombra en el «+» ni en el «−» */
    + 'html .counter__decrease-button.counter__button{border:1px solid #d3d7ea!important;background:#fff!important}'   /* el «−» del modal de huéspedes lleva un delineado fino, también con «Sin borde total» */
    + B + '[data-slot="card"],' + B + '[data-slot="form-section"],' + B + '.chk-card,' + B + 'a.group.overflow-hidden.no-underline{box-shadow:' + sh + '!important}'
    /* selectores (radio): el indicador circular se conserva y la opción elegida lleva un anillo azul separado 3 px de la caja (no la toca) */
    + N3 + '[role="radio"][aria-checked="true"]:not(input),' + N3 + '.iv-type.on{outline:2px solid #385bf8!important;outline-offset:3px!important}'
    + '@media (min-width:1024px){' + N3 + '.iv-main{padding-left:6px!important;padding-right:6px!important;margin-left:-6px!important;margin-right:-6px!important}}'   /* el contenedor recorta lo que se sale (overflow:hidden): se le da margen para que quepa el anillo de la opción elegida */
    /* CTA cuadrados por CSS (aplicados desde el primer pintado, sin el salto píldora → cuadrado que daba el escaneo por JS): los botones habituales de la app. El resto lo sigue cubriendo el escaneo */
    + N3 + 'header.sticky,' + N3 + '.sticky>header,' + N3 + '[data-slot="bottom-nav"],' + N3 + 'nav[data-slot="bottom-nav"]{box-shadow:none!important}'
    /* blanco puro: las cajas (y las filas de tareas, sin el tinte de «pending») son #fff, y sin el hueco de 1 px de borde que dejaba un filo blanco alrededor del tinte */
    + N3 + '[data-slot="card"],' + N3 + '.chk-card{border-width:0!important}'
    + N3 + '[data-slot="task-row"]{background:#fff!important;background-image:none!important;--task-row-pending-tint:#fff}'
    + N3 + '[data-slot="card"],' + N3 + '.chk-card,' + N3 + '[data-slot="form-section"],' + N3 + 'aside[data-slot="assistant-panel"],' + N3 + 'aside[data-slot="collapsible-rail"]{background-color:#fff!important;background-image:none!important}'
    + N3 + '[class*="sidebar-wrapper"],' + N3 + '[class*="sidebar-wrapper"] *{box-shadow:none!important;--tw-ring-shadow:0 0 #0000!important;--tw-ring-offset-shadow:0 0 #0000!important}'   /* menú lateral: sin el anillo del elemento activo ni el del logo */
  /* CTA secundarios con fondo blanco → solo texto (con «Sin borde total»). Secundario = botón blanco con texto que va junto a un CTA principal (p. ej. «Share» junto a «Copy link», «Continue without protection»), los pares de pastillas blancas del resumen («Change guest count», «Share a link») y la navegación de vuelta («Home», «Back to…»). Se conservan los CTA principales blancos sobre tarjetas oscuras (Pay, Start verification, Book your ride, View plans), los chips de filtro y los campos de formulario. */
  nb.textContent += N3 + '[data-sec][data-sec]{background:#fff!important;background-color:#fff!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important}'
    + N3 + '[data-sec][data-sec]{color:#161643!important}'

    + N3 + '[data-sec]:hover{background:#f1f2f8!important}';
  (document.head || document.documentElement).appendChild(nb);
  var al = function(c){ var m = /rgba?\(([^)]*)\)/.exec(c); if (!m) return 0; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
  var lu = function(c){ var m = /rgba?\(([^)]*)\)/.exec(c); if (!m) return 0; var p = m[1].split(',').map(parseFloat); return (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000; };
  var isWhite = function(e){ var c = getComputedStyle(e); return al(c.backgroundColor) > 0.35 && lu(c.backgroundColor) > 243; };   /* también en mitad de su transición de entrada */
  var CTA = 'button,a,[role="button"]';
  var scanSec = function(){
    if (!document.body) return;
    var PROPS = ['background-color', 'background-image', 'box-shadow', 'border-color', 'color'];
    var unmark = function(e){ e.removeAttribute('data-sec'); PROPS.forEach(function(p){ e.style.removeProperty(p); }); [].forEach.call(e.querySelectorAll('svg[data-secic]'), function(s){ s.style.removeProperty('color'); s.removeAttribute('data-secic'); }); };   /* se recalcula entero: el fondo blanco se mide sin el estilo aplicado */
    var list = [].filter.call(document.body.querySelectorAll(CTA), function(e){
      if (e.closest('#rep-panel,#rep-panel-set,[data-rep-bar],[data-slot="form-section-body"],[data-slot="chip"],[role="tablist"]') || e.matches('[role="tab"],[role="radio"],[role="combobox"],[aria-haspopup="listbox"],[data-slot="chip"]')) return false;
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim(); if (!t) return false;
      var r = e.getBoundingClientRect(); if (r.width < 24 || r.height < 18) return false;
      return e.hasAttribute('data-sec') || isWhite(e);   /* los ya marcados se mantienen (su fondo ya no es blanco porque se lo hemos quitado) */
    });
    var marks = [];
    list.forEach(function(e){
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim(), lbl = e.getAttribute('aria-label') || '';
      var sec = e.matches('.v5h-pill.v5h-white,.rv-pill:not(.pri),.bk-chip,.bk-xa') || /^Back to\b/i.test(t) || /^Back to\b/i.test(lbl) || /^Continue without\b/i.test(t);
      if (!sec) {   /* va junto a un CTA principal azul de tamaño parecido en el mismo grupo (padre o abuelo) */
        var eh = e.getBoundingClientRect().height;
        [e.parentElement, e.parentElement && e.parentElement.parentElement].forEach(function(g){ if (!g || sec) return; var gc = g.querySelectorAll(CTA); if (gc.length > 5 || g.getBoundingClientRect().height > 260) return;   /* solo grupos pequeños de botones, no la página entera */
          [].forEach.call(gc, function(o){
          if (o === e || sec || o.contains(e) || e.contains(o) || !(o.textContent || '').trim()) return;
          var m = /rgba?\(([^)]*)\)/.exec(getComputedStyle(o).backgroundColor); if (!m) return; var p = m[1].split(',').map(parseFloat);
          if ((p.length < 4 || p[3] > 0.85) && p[2] > 200 && p[0] < 120 && p[1] < 150 && Math.abs(o.getBoundingClientRect().height - eh) <= 16) sec = true;
        }); });
      }
      if (!sec) return;
      var p = e.parentElement, dark = false;
      while (p) {
        var pc = getComputedStyle(p), bi = pc.backgroundImage;
        if (bi !== 'none') {   /* imagen → oscuro; degradado → según sus colores (el degradado claro del dock de CTA no cuenta como oscuro) */
          if (/url\(/.test(bi)) { dark = true; break; }
          var cols = bi.match(/rgba?\([^)]*\)/g) || [], dk = cols.some(function(x){ return al(x) > 0.3 && lu(x) < 150; });
          if (dk) { dark = true; break; }
        }
        if (al(pc.backgroundColor) > 0.3) { dark = lu(pc.backgroundColor) < 150; break; }
        p = p.parentElement;
      }
      marks.push([e, dark ? 'd' : 'l']);
    });
    /* CTA cuadrados (esquinas de 12 px) en lugar de píldoras: botones rellenos totalmente redondeados, salvo chips, etiquetas y filtros */
    var onq = true;   /* siempre */
    [].forEach.call(document.querySelectorAll('[data-sq]'), function(e){ if (!onq) { e.removeAttribute('data-sq'); e.style.removeProperty('border-radius'); } });
    if (onq) [].forEach.call(document.body.querySelectorAll(CTA), function(e){
      if (e.closest('#rep-panel,#rep-panel-set,[data-rep-bar],.bk-bar,[role="tablist"]') || e.matches('.vc-chip,.rs-chip,[data-slot="chip"],[data-slot="tag"],[data-slot="badge"],[role="tab"],[data-slot="bottom-nav-item"]')) return;
      var c = getComputedStyle(e), rc = e.getBoundingClientRect(), rad = parseFloat(c.borderTopLeftRadius) || 0;
      if (e.hasAttribute('data-sq')) return;
      if (rc.height < 26 || rc.width < 50 || rad < rc.height / 2 - 1 || (al(c.backgroundColor) < 0.2 && c.backgroundImage === 'none' && !e.hasAttribute('data-sec'))) return;
      e.setAttribute('data-sq', '1'); e.style.setProperty('border-radius', '12px', 'important');
    });
    var on = root.hasAttribute('data-nobd'), keep = marks.map(function(m){ return m[0]; });
    [].forEach.call(document.querySelectorAll('[data-sec]'), function(e){ if (keep.indexOf(e) < 0 || !on) unmark(e); });
    if (!on) return;
    marks.forEach(function(m){
      var e = m[0], col = '#161643';   /* secundario = blanco puro con texto oscuro (antes, solo texto) */
      if (e.getAttribute('data-sec') === m[1] && e.style.getPropertyValue('background-color')) return;   /* ya aplicado: no se toca (evita parpadeos de transición) */
      e.setAttribute('data-sec', m[1]);   /* estilo en línea con !important: el CSS de la app usa capas (@layer) con !important, que ganan a cualquier hoja normal */
      e.style.setProperty('background-color', '#fff', 'important'); e.style.setProperty('background-image', 'none', 'important'); e.style.setProperty('box-shadow', 'none', 'important'); e.style.setProperty('border-color', 'transparent', 'important'); e.style.setProperty('color', col, 'important');
      [].forEach.call(e.querySelectorAll('svg'), function(s){ if (!s.getAttribute('style') || !/color\s*:/.test(s.getAttribute('style'))) s.style.setProperty('color', '#385bf8', 'important'); s.setAttribute('data-secic', '1'); });   /* los iconos sin color propio van en azul de marca (el texto, marino) */
    });
  };
  var t2 = 0, sch = function(){ clearTimeout(t2); t2 = setTimeout(scanSec, 150); };
  window.__secScan = scanSec;
  var go = function(){ scanSec(); setTimeout(scanSec, 700); setTimeout(scanSec, 1600); setTimeout(scanSec, 3000); try { new MutationObserver(function(ms){ if (ms.some(function(m){ return m.type === 'childList' || (m.attributeName !== 'data-sec'); })) sch(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-state'] }); } catch (e) {} };
  if (document.readyState !== 'loading') go(); else document.addEventListener('DOMContentLoaded', go);
})();
(function(){   /* Fondo definitivo: gris neutro #f5f5f7 (sin tinte azul) con las cajas y Vela en blanco. */
  try { ['replica-sep', 'replica-bg2', 'replica-bsh'].forEach(function(k){ localStorage.removeItem(k); }); } catch (e) {}
  var G = '#f5f5f7', ss = document.createElement('style'); ss.id = 'rep-sep';
  ss.textContent = 'html{--background-main:' + G + '}'
    + 'html body,html body>div:first-of-type:not([id^="rep-"]):not([class*="rp-"]):not(.bk-bar),html [class*="bg-[var(--background-main)]"]{background-color:' + G + '!important}'
    + 'html aside[data-slot="assistant-panel"]{background-color:#fff!important}'
    + 'html .bk-bar{background:rgba(245,245,247,.72)!important}';
  (document.head || document.documentElement).appendChild(ss);
})();
(function(){   /* Pregunta del huésped en el chat de Vela (selección final): burbuja de mensaje en grafito azulado tipo cristal, con texto blanco, para que no se lea como un CTA azul. */
  var qc = document.createElement('style'); qc.id = 'rep-qstyle';
  qc.textContent = '.vc-q:not(.pq3-q .vc-q){background:rgba(40,52,94,.84)!important;color:#fff!important;font-weight:500!important;-webkit-backdrop-filter:blur(12px) saturate(1.5);backdrop-filter:blur(12px) saturate(1.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(140,165,255,.16)}';
  (document.head || document.documentElement).appendChild(qc);
  try { localStorage.removeItem('replica-qstyle'); } catch (e) {}
})();
(function(){   /* Selección final · pasos de la home: V3 pegadas (la cabecera oscura y los pasos forman un solo bloque, sin huecos, esquinas de 18 px solo en el contorno y una fina raya entre pasos). Resumen de huéspedes: V2 como T6 (filas con esquinas 6/6/18/18, avatar de 40 px y 8 px entre filas). */
  try { localStorage.removeItem('replica-home-steps'); } catch (e) {}
  var hs = document.createElement('style'); hs.id = 'rep-home-steps';
  var H3 = '.chk-card.chk-k4';
  hs.textContent = H3 + '{background:transparent!important;overflow:hidden!important;border-radius:18px!important}'
    + H3 + ' .chk-k4h{border-radius:0!important}'
    + H3 + ' .chk-list{display:flex!important;flex-direction:column!important;gap:0!important;margin-top:0!important}'
    + H3 + ' .chk-list>div{display:block}'
    + H3 + ' [data-slot="task-row"]{background:#fff!important;border-width:0!important;border-radius:0!important;padding:14px!important;gap:12px!important}'
    + H3 + ' .chk-list>div+div [data-slot="task-row"]{box-shadow:inset 0 1px 0 #eceef6!important}'
    + H3 + ' [data-slot="task-row"]::before{display:none!important}'
    + H3 + ' [data-slot="task-row"]>span:first-child{width:40px!important;height:40px!important;border-radius:12px!important;background:#eef2ff!important;color:#385bf8!important;box-shadow:none!important}'
    + H3 + ' [data-slot="task-row"]>span:first-child svg{width:20px;height:20px}'
    + '.v1-stack{gap:8px!important}'
    + '.v1-stack .v1-row{border-radius:6px 6px 18px 18px!important;padding:12px 12px 12px 14px!important;gap:12px!important}'
    + '.v1-stack .v1-av{width:40px!important;height:40px!important;border-radius:12px!important}';
  (document.head || document.documentElement).appendChild(hs);
})();
(function(){   /* Móvil: se quita la barra de navegación inferior (Home · Registration · Stay · Discover) y el espacio que reservaba debajo del contenido. */
  var nv = document.createElement('style'); nv.id = 'rep-no-bottom-nav';
  nv.textContent = '@media (max-width:1023.98px){nav[data-slot="bottom-nav"]{display:none!important}:root{--mobile-bottom-nav-height:0px!important}[class*="pb-[var(--mobile-bottom-nav-height"]{padding-bottom:20px!important}}';
  (document.head || document.documentElement).appendChild(nv);
})();
(function(){   /* CTA cuadrados SIEMPRE (en todos los modos de Bordes): esquinas de 12 px en los botones habituales desde el primer pintado, sin salto píldora → cuadrado. Los chips (Suggested, filtros) y los botones de icono redondos no cuentan como CTA. */
  var sq = document.createElement('style'); sq.id = 'rep-cta-sq';
  sq.textContent = ['.button[class*="button_size_default"]', '.button[class*="button_size_lg"]', '.button[class*="button_size_sm"]', '.dbk-pill', '.v5h-pill', '.pv7-pay', '.pv7-vp', '.as-btn', '.fx-go', '.iv-b', '.rv-pill', '.bk-chip', '.bk-xa', '.rep-cta', '.rep-cta2', '.submit-btn', '.chk-cta', '.tr-cta', '.p-more', '.hub-more', '.v1-btn', '.v1-ico'].join(',') + '{border-radius:12px!important}';
  (document.head || document.documentElement).appendChild(sq);
})();
(function(){   /* Escritorio · todas las pantallas (verificación, pagos, formularios, registrado…): más aire alrededor de la fila superior («Back / IDENTITY VERIFICATION · STEP n OF 4»): 32 px por encima (antes 24) y 18 px hasta el título (antes 8). */
  var ns = document.createElement('style'); ns.id = 'rep-iv-nav';
  ns.textContent = '@media (min-width:1024px){.iv-main{padding-top:32px!important}.iv-main .dbk-row.iv-dtop,.iv-main .iv-dtop{margin-bottom:18px!important}.dbk-row:not(.iv-dtop){margin-top:8px!important;margin-bottom:18px!important}main.rg .dbk-row{margin-top:0!important}main.rg{padding-top:32px!important}header>div:has(>.hub-eyebrow){margin-top:8px!important;margin-bottom:12px!important}.home-view main{padding-top:32px!important}}';   /* y lo mismo en el resto de pantallas de escritorio: fila de navegación a 32 px del borde y 18 px hasta el título */
  (document.head || document.documentElement).appendChild(ns);
})();
(function(){   /* Escritorio · vista previa del documento (elegir tipo): la imagen se quedaba a su tamaño natural (≈391 px) en un área de ≈440 px de alto y dejaba ≈200 px de vacío. Ahora una sola imagen (pasaporte) ocupa el alto disponible menos 16 px de aire arriba y abajo; las dos caras (DNI) se reparten el ancho (50 % − 8 px). */
  var pf = document.createElement('style'); pf.id = 'rep-iv-fill';
  pf.textContent = '@media (min-width:1024px){.iv-pvi{padding:16px 0!important}.iv-pvi:not(.two) img{height:100%!important;width:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain}.iv-pvi.two.side{gap:16px!important}.iv-pvi.two.side img{width:calc(50% - 8px)!important;max-width:none!important;height:auto!important;max-height:100%!important}}';
  (document.head || document.documentElement).appendChild(pf);
})();
(function(){   /* Comprobaciones del documento (scan-3-ready): al marcarse una fila verde, su destello (aro de 4 px + resplandor de 22 px) sobresalía más de lo que dejan los márgenes del contenedor (20 px en móvil) y se veía cortado. Se redefine la animación con el aro y el resplandor hacia DENTRO de la fila (box-shadow inset), así ningún contenedor puede recortarlos; mismas fases y mismos colores. */
  var ck = document.createElement('style'); ck.id = 'rep-check-glow';
  ck.textContent = '@keyframes _checkOn_ikaqi_1{0%{color:#7a4b4b;background:#fdeeee;box-shadow:0 0 #34c38f00}40%{box-shadow:inset 0 0 0 2px #34c38fb3,inset 0 0 14px 0 #34c38f55}to{background:var(--chekin-green-50,#eaf4ee);color:var(--form-title-color,#222);box-shadow:0 0 #34c38f00}}';
  (document.head || document.documentElement).appendChild(ck);
})();
(function(){   /* Vela: el hueco entre «Suggested» y las sugerencias (14 px en resumen/formulario, 8 px en pagos) pasa a 12 px, igual que entre la raya azul de una sección y su caja (p. ej. «Quick actions» → «Invite the guests») */
  var vg = document.createElement('style'); vg.id = 'rep-vela-gap';
  vg.textContent = 'aside .pq-ch{margin-top:4px!important}aside .vc-chips{margin-top:4px!important}';
  (document.head || document.documentElement).appendChild(vg);
})();
(function(){   /* cristal de la barra superior del móvil: capa propia (translateZ + isolation) para que el desenfoque no se pierda al hacer scroll hasta el final, y más cuerpo para que no se transparente el contenido de detrás */
  var gl = document.createElement('style'); gl.id = 'rep-glass';
  gl.textContent = '@media (max-width:1023.98px){.sticky.z-20:has(>header){z-index:45!important}header.sticky.top-0.z-20,.sticky.z-20>header{z-index:45!important;background-color:rgba(255,255,255,.7)!important;-webkit-backdrop-filter:blur(22px) saturate(1.8)!important;backdrop-filter:blur(22px) saturate(1.8)!important;transform:translateZ(0);-webkit-transform:translateZ(0);will-change:transform;isolation:isolate}html[data-bsh="1"] header.sticky.top-0.z-20,html[data-bsh="1"] .sticky.z-20>header{box-shadow:0 1px 0 rgba(22,22,67,.06)}}';
  (document.head || document.documentElement).appendChild(gl);
})();
(function(){
  var st = document.createElement('style'); st.id = 'rep-overlays';
  st.textContent = '.rep-gc-frame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:transparent;color-scheme:light}'
    + '.rep-sh-back{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(22,22,67,.45);font-family:Poppins,system-ui,sans-serif}'
    + '.rep-sh{width:100%;max-width:480px;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));border-radius:24px 24px 0 0;background:#fff;color:#161643}'
    + '@media (min-width:1024px){.rep-sh-back{align-items:center}.rep-sh{border-radius:24px;padding-bottom:20px}}'
    + '.rep-sh h3{margin:0;font-size:18px;line-height:24px;font-weight:600}.rep-sh p{margin:4px 0 14px;font-size:13px;line-height:19px;color:#6b6b95}'
    + '.rep-sh-link{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border:1px solid #e5e6ee;border-radius:12px;background:#f6f7fc;font-size:12.5px;color:#4a5072}.rep-sh-link span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.rep-sh-btn{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 12px;border:0;border-radius:12px;background:none;color:#161643;font:600 14px Poppins,system-ui,sans-serif;text-align:left;text-decoration:none;cursor:pointer}.rep-sh-btn:hover{background:#f3f4fa}'
    + '.rep-sh-btn i{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#eff6ff;color:#385bf8;font-style:normal;font-size:15px}'
    + '.rep-sh-copy{flex:none;min-height:32px;padding:0 12px;border:0;border-radius:9px;background:#385bf8;color:#fff;font:600 12.5px Poppins,system-ui,sans-serif;cursor:pointer}'
    + '.rep-sh-x{margin-top:6px;justify-content:center;color:#385bf8}'
    + '.rep-sh button:focus-visible,.rep-sh a:focus-visible{outline:2px solid #385bf8;outline-offset:2px}';
  document.head.appendChild(st);
  /* modal de huéspedes (hoja inferior): el fondo aparece con fundido y la hoja sube con curva suave; al cerrar salen igual, sin saltos */
  var ga = document.createElement('style'); ga.id = 'rep-sheet-anim';
  ga.textContent = '@keyframes repOvIn{from{opacity:0}to{opacity:1}}@keyframes repOvOut{from{opacity:1}to{opacity:0}}'
    + '@keyframes repUpIn{from{transform:translate3d(0,100%,0)}to{transform:translate3d(0,0,0)}}@keyframes repUpOut{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,100%,0)}}'
    + '[data-slot="drawer-overlay"],[data-slot="dialog-overlay"]{animation:repOvIn .5s cubic-bezier(.4,0,.2,1) both!important}'
    + '[role="dialog"][class*="slide-in-from-bottom"]{animation:repUpIn .6s cubic-bezier(.32,.72,0,1) both!important;will-change:transform}'
    + 'html.rep-closing [data-slot="drawer-overlay"],html.rep-closing [data-slot="dialog-overlay"]{animation:repOvOut .4s cubic-bezier(.4,0,.2,1) forwards!important}'
    + 'html.rep-closing [role="dialog"][class*="slide-in-from-bottom"]{animation:repUpOut .45s cubic-bezier(.32,.72,0,1) forwards!important}'
    + 'html.rep-wait *{animation-play-state:paused!important}';
  document.head.appendChild(ga);
  var gcFrame = null, gcPre = null;
  var gcSig = function(){ try { return ['replica-gc-payments', 'replica-remote-access', 'replica-deposit-type', 'replica-gc-n'].map(function(k){ return localStorage.getItem(k); }).join('|'); } catch (e) { return ''; } };
  var gcMake = function(name, change){
    var f = document.createElement('iframe'); f.className = 'rep-gc-frame'; f.setAttribute('title', 'Change guest count'); f.setAttribute('allowtransparency', 'true'); f.setAttribute('aria-hidden', 'true');
    f.style.opacity = '0'; f.style.pointerEvents = 'none';   /* invisible hasta estar cargado: así no hay parpadeo al abrir */
    var p = new URLSearchParams(location.search); ['reg', 'rs', 'gc', 'bk', 'mb', 'sc', 'ff', 'hs', 'cta', 'fit', 'big'].forEach(function(k){ p.delete(k); }); p.set('embed', '1'); if (change) p.set('chg', '1');
    f.src = name + '.' + S.v + '.html?' + p.toString(); f.__name = name; f.__sig = gcSig(); document.body.appendChild(f); return f;
  };
  var gcReveal = function(f){ f.style.opacity = '1'; f.style.pointerEvents = 'auto'; f.removeAttribute('aria-hidden'); try { f.contentWindow.postMessage({ rep: 'gc-go' }, '*'); } catch (e) {} };
  var gcPreload = function(){ if (EMBED || gcFrame || gcPre || !/^(home|home-scrolled|home-after-1|hub-after-1)$/.test(S.id || '')) return; gcPre = gcMake('home-sheet'); };
  window.addEventListener('message', function(ev){
    if (!ev.data || ev.data.rep !== 'gc-ready') return;
    [gcFrame, gcPre].forEach(function(f){ if (f && f.contentWindow === ev.source) { f.__ready = true; if (f.__want) gcReveal(f); } });
  });
  setTimeout(gcPreload, 1500);
  window.__openGuestCount = function(id, change){   /* change = true: modal «Change guest count» desde el resumen de huéspedes (solo el contador, sin la bienvenida) */
    var name = typeof id === 'string' ? id : 'home-sheet';
    if (gcFrame) { if (typeof id === 'string') gcFrame.src = name + '.' + S.v + '.html?' + gcFrame.src.split('?')[1]; return; }   /* ya abierto: cambia de variante */
    var f;
    if (!change && gcPre && gcPre.__name === name && gcPre.__sig === gcSig()) { f = gcPre; gcPre = null; }
    else { if (gcPre) { gcPre.remove(); gcPre = null; } f = gcMake(name, change); }
    gcFrame = f; f.__want = true; if (f.__ready) gcReveal(f);
    var from = document.activeElement;
    var onMsg = function(ev){ if (ev.data && ev.data.rep === 'gc-close' && ev.source === f.contentWindow) { f.remove(); gcFrame = null; window.removeEventListener('message', onMsg); if (from && from.focus) from.focus(); setTimeout(gcPreload, 700); } };
    window.addEventListener('message', onMsg);
  };
  var LINK = 'https://guestapp-v2.stg.chekin.com/register?code=DEMO', MSG = 'Please complete your guest registration for your stay at Villa Calipso.';
  window.__shareLink = function(from, o){
    o = o || {};   /* o: título, texto, enlace, encabezado y frase del diálogo (por defecto, el del registro) */
    var link = o.url || LINK, msg = o.text || MSG, ttl = o.title || 'Guest registration';
    var data = { title: ttl, text: msg, url: link };
    if (navigator.share) { navigator.share(data).catch(function(){}); return; }   /* menú nativo del dispositivo */
    var back = document.createElement('div'); back.className = 'rep-sh-back';
    var enc = encodeURIComponent(msg + ' ' + link);
    back.innerHTML = '<div class="rep-sh" role="dialog" aria-modal="true" aria-labelledby="rep-sh-t"><h3 id="rep-sh-t">' + (o.heading || 'Share the registration link') + '</h3><p>' + (o.blurb || 'Send this link so each guest can complete their own registration from their phone.') + '</p>'
      + '<div class="rep-sh-link"><span>' + link + '</span><button type="button" class="rep-sh-copy">Copy link</button></div>'
      + '<div style="margin-top:8px"><a class="rep-sh-btn" href="https://wa.me/?text=' + enc + '" target="_blank" rel="noopener"><i>☎</i>Open WhatsApp with the link ready to send</a>'
      + '<a class="rep-sh-btn" href="mailto:?subject=' + encodeURIComponent(ttl) + '&body=' + enc + '"><i>✉</i>Send by email</a>'
      + '<a class="rep-sh-btn" href="sms:?&body=' + enc + '"><i>✉</i>Send by text message</a></div><button type="button" class="rep-sh-btn rep-sh-x">Cancel</button></div>';
    var close = function(){ back.remove(); document.removeEventListener('keydown', esc, true); if (from && from.focus) from.focus(); };
    var esc = function(e){ if (e.key === 'Escape') close(); };
    back.addEventListener('click', function(e){
      if (e.target === back || e.target.closest('.rep-sh-x')) { close(); return; }
      var c = e.target.closest('.rep-sh-copy'); if (c) { try { navigator.clipboard.writeText(link); } catch (_) {} c.textContent = 'Link copied'; }
    });
    document.addEventListener('keydown', esc, true); document.body.appendChild(back); back.querySelector('.rep-sh-copy').focus();
  };
  /* dentro del iframe del modal: solo se ve la hoja; al confirmar o tocar fuera se cierra */
  if (EMBED) {
    document.documentElement.classList.add('rep-wait');   /* las animaciones esperan a que el marco esté visible */
    window.addEventListener('message', function(ev){ if (ev.data && ev.data.rep === 'gc-go') document.documentElement.classList.remove('rep-wait'); });
    var gcTell = function(){ try { parent.postMessage({ rep: 'gc-ready' }, '*'); } catch (_) {} };
    if (document.readyState === 'complete') setTimeout(gcTell, 120); else window.addEventListener('load', function(){ setTimeout(gcTell, 120); });
    var es = document.createElement('style'); es.textContent = 'html:root,html:root body{background:transparent!important}#root{visibility:hidden!important}.nv2>span>b{display:none!important}[data-rep-bar],.rep-switch,.rail-switch,#rep-panel,.hub-sc,.own-sc{display:none!important}';   /* sin la nota "Taken from your booking" ni controles de la réplica */
    document.head.appendChild(es);
    var closing = false;
    var closeMe = function(){ if (closing) return; closing = true; document.documentElement.classList.add('rep-closing'); setTimeout(function(){ try { parent.postMessage({ rep: 'gc-close' }, '*'); } catch (_) {} }, 440); };   /* sale con animación y luego se quita el marco */
    document.addEventListener('click', function(e){
      var ok = e.target.closest('[data-gc="confirm"]'), ov = e.target.closest('[data-slot="drawer-overlay"],[data-slot="dialog-overlay"]'); if (ov && e.target.closest('[data-slot="dialog-content"],[data-slot="responsive-sheet-content"],[data-slot="drawer-content"]')) ov = null;   /* en escritorio el cuadro está dentro del fondo oscuro: un clic dentro del cuadro (+, −…) no cierra el modal; solo el clic fuera */
      if (ok || ov) { e.preventDefault(); e.stopImmediatePropagation(); closeMe(); }
    }, true);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMe(); }, true);
  }
})();
document.addEventListener('click', function(e){
  if (e.target.closest('.iv-m,.rep-switch,.rail-switch,[data-rep-bar],.acc-tile,.acc-modal,.chk-switch,#rep-panel,.fx-sec,.fx-tip,.fx-tipb,.rep-sh-back,.afl,.afl-ok,.afl-okb,.rg-sheet,.ivi-skip,.ivs-ov,.lv-ov,[data-as-go]')) return; /* replica controls navigate normally */
  var el = target(e.target); if (!el) return;
  var t = label(el); if (!t) return;
  if (!EMBED && /^share (a|booking) link/.test(t)) { e.preventDefault(); e.stopPropagation(); window.__shareLink(el); return; }
  var list = (NAV && NAV[S.id]) || [];
  var hit = null;
  for (var i = 0; i < list.length; i++) { if (norm(list[i].text) === t) { hit = list[i].to; break; } }
  if (!hit) for (var k = 0; k < list.length; k++) { if (t.indexOf(norm(list[k].text)) === 0 || norm(list[k].text).indexOf(t) === 0 && t.length > 3) { hit = list[k].to; break; } }
  if (!hit && GLOBAL[t]) hit = GLOBAL[t];
  if (!hit && /^back/.test(t) && BACK[S.id]) hit = BACK[S.id];   /* la flecha atrás sigue la cadena fija del registro, no el historial del navegador */
  if (!hit && /^back/.test(t)) { history.length > 1 ? history.back() : (hit = 'home'); if (!hit) { e.preventDefault(); return; } }
  if (hit === 'home-sheet' && S.id !== 'home' && !EMBED) { e.preventDefault(); e.stopPropagation(); window.__openGuestCount(undefined, /^hub/.test(S.id || '')); return; }
  if (hit) { e.preventDefault(); e.stopPropagation(); location.href = pgx(hit) + '.' + want + '.html'; }
  else if (el.tagName === 'A' && el.getAttribute('href') && /^https?:/.test(el.getAttribute('href'))) { /* external links open normally */ }
  else { e.preventDefault(); }
}, true);

/* escritorio: todas las páginas usan la misma columna de contenido que Home (820 px como máximo, centrada, con 32 px a cada lado) */
var lay = document.createElement('style'); lay.id = 'rep-layout'; lay.textContent = '@media (min-width:1024px){[class*="max-w-[640px]"][class*="flex-1"][class*="flex-col"],main[class*="lg:max-w-[940px]"]{max-width:820px!important;margin-left:auto!important;margin-right:auto!important;padding-left:32px!important;padding-right:32px!important}}'; document.head.appendChild(lay);

/* ===== barra superior móvil (todas las pantallas): botón cuadrado a la izquierda (menú o atrás), título con subtítulo y el check de Chekin a la derecha ===== */
if (S.v === 'm') {
  var mbs = document.createElement('style'); mbs.id = 'rep-mbar';
  mbs.textContent = '@media (max-width:1023px){'
    + 'html[data-mbar] header button[aria-label="Back"],html[data-mbar] header button[aria-label="Menu"]{width:44px!important;height:44px!important;min-width:44px;border-radius:14px!important;background:#f3f4f8!important;color:#161643!important;display:inline-flex!important;align-items:center;justify-content:center}'
    + 'html[data-mbar] header button[aria-label="Back"] svg,html[data-mbar] header button[aria-label="Menu"] svg{width:20px;height:20px}'
    + 'html[data-mbar] header button[aria-label="Open assistant"]{display:none!important}'
    + 'html[data-mbar] header .mb-hide{display:none!important}'
    + 'html[data-mbar] header [class*="flex-col"]>span:first-child{font-size:16px!important;line-height:1.25!important;font-weight:700!important}'
    + 'html[data-mbar] header .min-w-0>.text-center.font-bold{font-size:16px!important;line-height:1.25!important;font-weight:700!important}'   /* título de la Home («Villa Calipso»): mismo tamaño que el resto de pantallas */
    + 'html[data-mbar] header .mb-sub{display:block;margin-top:1px;font-size:12.5px;line-height:1.25;font-weight:500;color:#6b6b95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + 'html[data-mbar] header .mb-logo{flex:none;display:inline-flex;align-items:center;justify-content:center;width:44px;height:36px;color:#385bf8}'
    + 'html[data-mbar] header .mb-logo img{display:block;width:40px;height:40px;margin:-2px 0;pointer-events:none}'
    + '}';
  document.head.appendChild(mbs);
  var MB_SUB = [[/^(g2-form|form-|scan-)/, 'Guest registration', (function(){ var n = 4; try { n = Number(localStorage.getItem('rep-ivn')) || 4; } catch (e) {} return 'Step ' + n + ' of ' + n; })()], [/^g2-registered/, 'Guest registration', 'Completed'], [/^g2-registering/, 'Guest registration', 'Submitting…'], [/^g2-iv/, 'Guest registration', ''], [/^g2-register-failed/, 'Guest registration', 'Not completed']];
  var mbHeader = function(){ var hs = document.querySelectorAll('header'); for (var i = 0; i < hs.length; i++) { var rc = hs[i].getBoundingClientRect(); if (rc.top < 5 && rc.height > 30 && rc.height < 100 && hs[i].querySelector('button[aria-label="Back"],button[aria-label="Menu"]')) return hs[i]; } return null; };
  var mbSetSub = function(h, t){
    var wrap = h.querySelector('div[class*="flex-col"]'); if (!wrap) return;
    var sub = wrap.querySelector('.mb-sub') || [].filter.call(wrap.children, function(c, i){ return i > 0; })[0];
    if (!sub) { sub = document.createElement('span'); wrap.appendChild(sub); }
    sub.classList.add('mb-sub'); sub.textContent = t;
  };
  var mbBar = function(){
    var h = mbHeader(); if (!h) return false;
    document.documentElement.setAttribute('data-mbar', '1');
    if (!h.querySelector('.mb-logo')) {
      var right = h.querySelector('div[class*="shrink-0"][class*="gap-2"]') || h.lastElementChild;
      var lg = document.createElement('span'); lg.className = 'mb-logo'; lg.setAttribute('aria-hidden', 'true');
      lg.innerHTML = '<img alt="" width="40" height="40" draggable="false">';
      /* el logo real (JPG sobre blanco): el blanco se vuelve transparente en el navegador para que se vea sobre cualquier fondo, sin tocar el dibujo ni la sombra */
      (function(im){ var src = new Image(); src.onload = function(){ try { var c = document.createElement('canvas'); c.width = src.naturalWidth; c.height = src.naturalHeight; var x = c.getContext('2d'); x.drawImage(src, 0, 0); var d = x.getImageData(0, 0, c.width, c.height), p = d.data; for (var i = 0; i < p.length; i += 4) { var a = 255 - Math.min(p[i], p[i + 1], p[i + 2]); if (a < 6) { p[i + 3] = 0; continue; } var al = a / 255; p[i] = Math.max(0, Math.min(255, Math.round((p[i] - 255 * (1 - al)) / al))); p[i + 1] = Math.max(0, Math.min(255, Math.round((p[i + 1] - 255 * (1 - al)) / al))); p[i + 2] = Math.max(0, Math.min(255, Math.round((p[i + 2] - 255 * (1 - al)) / al))); p[i + 3] = a; } x.putImageData(d, 0, 0); im.src = c.toDataURL('image/png'); } catch (e) { im.src = src.src; } }; src.src = '../assets/logo-check.jpg'; })(lg.firstChild);
      right.appendChild(lg);
    }
    var menu = h.querySelector('button[aria-label="Menu"]');
    if (menu) { var loc = h.querySelector('span[class*="text-[11px]"]'); if (loc) loc.classList.add('mb-hide'); }   /* Home: solo el nombre del alojamiento */
    var back = h.querySelector('button[aria-label="Back"]'); if (back && !back.getAttribute('data-to')) back.setAttribute('data-to', (S.id === 'iv-intro-f' || S.id === 'iv-intro-h') ? 'hub-after-1' : (/^pay-(0|1)/.test(S.id || '') ? 'cart' : 'home'));   /* la intro de verificación vuelve al resumen de huéspedes, no a la home */
    var t = h.querySelector('div[class*="flex-col"] > span:first-child');
    var IVOFF = false; try { IVOFF = localStorage.getItem('rep-iv') === '0' && new URLSearchParams(location.search).get('iv') !== '1'; } catch (e) {} if (new URLSearchParams(location.search).get('iv') === '0') IVOFF = true;
    for (var i = 0; i < MB_SUB.length; i++) if (MB_SUB[i][0].test(S.id || '')) { if (t) t.textContent = MB_SUB[i][1]; mbSetSub(h, (IVOFF && /^(g2-form|form-|scan-)/.test(S.id || '')) ? '' : MB_SUB[i][2]); var sb = h.querySelector('.mb-sub'); if (sb) sb.style.display = sb.textContent ? '' : 'none'; }   /* sin IV no hay "Step 1 of 4" */
    return true;
  };
  window.__mobBar = { title: function(x){ var h = mbHeader(); var t = h && h.querySelector('div[class*="flex-col"] > span:first-child'); if (t) t.textContent = x; }, sub: function(x){ var h = mbHeader(); if (h) mbSetSub(h, x); } };
  var mbTry = function(n){ if (!mbBar() && n > 0) setTimeout(function(){ mbTry(n - 1); }, 150); };
  if (document.readyState !== 'loading') mbTry(10); else document.addEventListener('DOMContentLoaded', function(){ mbTry(10); });
}
/* móvil: el título de la barra superior va centrado (entre el botón de atrás/menú y el de la derecha), no pegado a la izquierda */
var stc = document.createElement('style'); stc.id = 'rep-title-center';
stc.textContent = '@media (max-width:1024px){header.lg\\:hidden>div.min-w-0.flex-1.flex-col{position:absolute;left:76px;right:76px;top:0;bottom:0;justify-content:center;align-items:center;text-align:center;pointer-events:none}header.lg\\:hidden>div.min-w-0.flex-1.flex-col>*{max-width:100%}header.lg\\:hidden>div.min-w-0.flex-1.flex-col~*{margin-left:auto}header.lg\\:hidden.rep-hskip>div.min-w-0.flex-1.flex-col{position:static;pointer-events:auto}}';   /* con «Skip for now» en la barra, el título se centra en el hueco libre para no pisarlo */
document.head.appendChild(stc);
var markSkip = function(){ [].forEach.call(document.querySelectorAll('header.lg\\:hidden'), function(h){ h.classList.toggle('rep-hskip', /Skip for now/.test(h.textContent)); }); };
if (document.readyState !== 'loading') markSkip(); else document.addEventListener('DOMContentLoaded', markSkip);
document.addEventListener('DOMContentLoaded', function(){ new MutationObserver(markSkip).observe(document.body, { childList: true, subtree: true, characterData: true }); });
var st = document.createElement('style'); st.id = 'rep-pe'; st.textContent = '[data-rep-bar],[data-rep-bar] *,.rep-switch,.rep-switch *{pointer-events:auto!important}'; document.head.appendChild(st);
/* variant switch for the guest-count sheet (replica only): by total / by age, and flag on / off */
if (/^home-sheet/.test(S.id || '')) {
  var sw = document.createElement('div'); sw.className = 'rep-switch'; sw.style.pointerEvents = 'auto';
  var ages = /-ages/.test(S.id), fixed = /-fixed$/.test(S.id);
  var search = location.search;
  var idOf = function(a, f){ return 'home-sheet' + (a ? '-ages' : '') + (f ? '-fixed' : ''); };
  var link = function(a, f, label, on){ return '<a href="' + idOf(a, f) + '.' + S.v + '.html' + search + '" class="' + (on ? 'on' : '') + '">' + label + '</a>'; };
  var qs = function(o){ var p = new URLSearchParams(location.search); ['adult','minor','guest'].forEach(function(k){ p.delete(k); }); for (var k in o) p.set(k, o[k]); var s = p.toString(); return S.id + '.' + S.v + '.html' + (s ? '?' + s : ''); };
  var size = function(label, a, m, g){ var cur = new URLSearchParams(location.search); var on = ages ? (cur.get('adult') == a && cur.get('minor') == m) : (cur.get('guest') == g); var o = ages ? { adult: a, minor: m } : { guest: g }; return '<a href="' + qs(o) + '" class="' + (on ? 'on' : '') + '">' + label + '</a>'; };
  sw.innerHTML = link(false, fixed, 'Total', !ages) + link(true, fixed, 'Por edad', ages) + '<span class="rep-sep"></span>' + link(ages, false, 'Editable', !fixed) + link(ages, true, 'Solo lectura', fixed)
    + '<span class="rep-break"></span><span class="rep-lbl">Huéspedes</span>' + size('5', 3, 2, 5) + size('8', 5, 3, 8) + size('9', 6, 3, 9) + size('20', 14, 6, 20);
  var addSw = function(){ if (window.__repPanel) window.__repPanel.add('Huéspedes', sw, 10); else document.body.appendChild(sw); };
  if (document.readyState !== 'loading') addSw(); else document.addEventListener('DOMContentLoaded', addSw);
}
/* el título de bienvenida ya no está en la home: vive en el modal de huéspedes */
if (/^home(-after-1|-scrolled)?$/.test(S.id || '') || S.id === 'home') {
  var hideWelcome = function(){ var h = [].filter.call(document.querySelectorAll('h1'), function(x){ return /^Welcome\s+\u2014/.test(x.textContent); })[0]; if (h && h.parentNode && h.nextElementSibling && h.nextElementSibling.tagName === 'P') h.parentNode.style.display = 'none'; };
  if (document.readyState !== 'loading') hideWelcome(); else document.addEventListener('DOMContentLoaded', hideWelcome);
}
/* Controles de la home: abrir el modal obligatorio de huéspedes en cada configuración (replica only) */
if (S.id === 'home' && !EMBED) {
  var gm = document.createElement('div'); gm.className = 'rail-switch';
  var GM = [['home-sheet', 'Total'], ['home-sheet-ages', 'Por edad'], ['home-sheet-fixed', 'Total · solo lectura'], ['home-sheet-ages-fixed', 'Por edad · solo lectura']];
  gm.innerHTML = GM.map(function(g){ return '<button type="button" class="rs-chip" data-gm="' + g[0] + '">' + g[1] + '</button>'; }).join('');
  gm.addEventListener('click', function(e){ var b = e.target.closest('[data-gm]'); if (!b) return; e.preventDefault(); e.stopPropagation(); window.__openGuestCount(b.getAttribute('data-gm')); }, true);
  var addGm = function(){ if (window.__repPanel) window.__repPanel.add('Modal huéspedes', gm, 15); else document.body.appendChild(gm); };
  if (document.readyState !== 'loading') addGm(); else document.addEventListener('DOMContentLoaded', addGm);
}
/* Ajustes de la reserva (capa 1 del cuadro de Controles): pagos, remote access e identity verification. Valen para todas las pantallas */
if (!EMBED) {
  var LSget = function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  var LSset = function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} };
  var seg = function(html){ var d = document.createElement('div'); d.className = 'rail-switch'; d.innerHTML = html; return d; };
  var onOff = function(attr, on){ return '<button type="button" class="rs-chip' + (on ? ' on' : '') + '" data-' + attr + '="1">Sí</button><button type="button" class="rs-chip' + (!on ? ' on' : '') + '" data-' + attr + '="0">No</button>'; };
  /* pagos (varios a la vez) */
  var pw = seg('');
  var PW = [['deposit', 'Depósito'], ['taxes', 'Tasas'], ['reservation', 'Pago reserva']];
  var pwGet = function(){ try { return JSON.parse(localStorage.getItem('replica-gc-payments') || '["reservation"]'); } catch (e) { return []; } };
  var pwPaint = function(){ var on = pwGet(); [].forEach.call(pw.querySelectorAll('[data-pw]'), function(c){ c.classList.toggle('on', on.indexOf(c.getAttribute('data-pw')) > -1); }); };
  pw.innerHTML = PW.map(function(g){ return '<button type="button" class="rs-chip" data-pw="' + g[0] + '">' + g[1] + '</button>'; }).join('');
  pw.addEventListener('click', function(e){
    var b = e.target.closest('[data-pw]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var k = b.getAttribute('data-pw'), on = pwGet(), i = on.indexOf(k); if (i > -1) on.splice(i, 1); else on.push(k);
    on = PW.map(function(g){ return g[0]; }).filter(function(x){ return on.indexOf(x) > -1; });
    LSset('replica-gc-payments', JSON.stringify(on));
    pwPaint(); window.dispatchEvent(new Event('replica-pay-change'));
  }, true);
  /* tipo de depósito (solo si hay depósito): retención en la tarjeta o solo tokenización (no se retiene nada) */
  var dtp = seg('<button type="button" class="rs-chip" data-dt="hold">Retención</button><button type="button" class="rs-chip" data-dt="token">Solo tokenizar</button>');
  var dtPaint = function(){ var v = LSget('replica-deposit-type', 'hold'); [].forEach.call(dtp.querySelectorAll('[data-dt]'), function(c){ c.classList.toggle('on', c.getAttribute('data-dt') === v); }); var sec = dtp.closest('.rp-s'); if (sec) sec.style.display = pwGet().indexOf('deposit') > -1 ? '' : 'none'; };
  dtp.addEventListener('click', function(e){
    var b = e.target.closest('[data-dt]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    LSset('replica-deposit-type', b.getAttribute('data-dt')); dtPaint(); window.dispatchEvent(new Event('replica-dep-change'));
  }, true);
  window.addEventListener('replica-pay-change', dtPaint);
  /* remote access (sí / no) */
  var vshV = LSget('replica-vela-shadow', '1'); if (['0', '1', '2'].indexOf(vshV) < 0) vshV = '1';
  var vsh = seg([['2', 'Antes'], ['1', 'Ahora'], ['0', 'No']].map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === vshV ? ' on' : '') + '" data-vsh="' + o[0] + '">' + o[1] + '</button>'; }).join(''));   /* Componentes → Vela sombreado: Antes (sombra marcada) · Ahora (ligera, como la tarjeta T2) · No */
  vsh.addEventListener('click', function(e){
    var b = e.target.closest('[data-vsh]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var v = b.getAttribute('data-vsh'); LSset('replica-vela-shadow', v);
    [].forEach.call(vsh.querySelectorAll('[data-vsh]'), function(c){ c.classList.toggle('on', c === b); });
    var setA = function(d){ try { if (v === '1') d.documentElement.removeAttribute('data-vshadow'); else d.documentElement.setAttribute('data-vshadow', v === '0' ? '0' : 'old'); } catch (x) {} };
    setA(document); try { [].forEach.call(window.parent.document.querySelectorAll('iframe'), function(f){ try { setA(f.contentDocument); } catch (x) {} }); } catch (x) {}
  }, true);
  var nbdV = LSget('replica-nobd', '3'); if (nbdV === '1' || nbdV === '2') nbdV = '3'; if (['0', '3'].indexOf(nbdV) < 0) nbdV = '0';
  var nbd = seg([['0', 'Con borde'], ['3', 'Sin borde total']].map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === nbdV ? ' on' : '') + '" data-nbd="' + o[0] + '">' + o[1] + '</button>'; }).join(''));   /* Componentes → Bordes */
  nbd.addEventListener('click', function(e){
    var b = e.target.closest('[data-nbd]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var v = b.getAttribute('data-nbd'); LSset('replica-nobd', v);
    [].forEach.call(nbd.querySelectorAll('[data-nbd]'), function(c){ c.classList.toggle('on', c === b); });
    var setA = function(d){ try { if (v === '0') d.documentElement.removeAttribute('data-nobd'); else d.documentElement.setAttribute('data-nobd', v); if (d.defaultView && d.defaultView.__secScan) d.defaultView.__secScan(); } catch (x) {} };
    setA(document); try { [].forEach.call(window.parent.document.querySelectorAll('iframe'), function(f){ try { setA(f.contentDocument); [].forEach.call(f.contentDocument.querySelectorAll('iframe'), function(g){ try { setA(g.contentDocument); } catch (x) {} }); } catch (x) {} }); } catch (x) {}
  }, true);
  var ra = seg(onOff('ra', LSget('replica-remote-access', '1') !== '0'));
  ra.addEventListener('click', function(e){
    var b = e.target.closest('[data-ra]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    LSset('replica-remote-access', b.getAttribute('data-ra'));
    [].forEach.call(ra.querySelectorAll('[data-ra]'), function(c){ c.classList.toggle('on', c === b); });
    window.dispatchEvent(new Event('replica-ra-change'));
  }, true);
  /* identity verification (sí / no): decide si «registrar huésped» empieza por la verificación; las pantallas lo leen al cargar */
  var ivNow = LSget('rep-iv', '1') === '0' ? 'no' : (LSget('rep-ivm', 'bio') === 'doc' ? 'doc' : 'bio');
  var ivs = seg([['no', 'No'], ['doc', 'Solo documento'], ['bio', 'Biometría']].map(function(x){ return '<button type="button" class="rs-chip' + (x[0] === ivNow ? ' on' : '') + '" data-ivs="' + x[0] + '">' + x[1] + '</button>'; }).join(''));   /* No · Solo documento (reverso + MRZ) · Biometría (anverso, reverso y selfie: cara, biometría y MRZ) */
  ivs.addEventListener('click', function(e){
    var b = e.target.closest('[data-ivs]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var m = b.getAttribute('data-ivs'); LSset('rep-iv', m === 'no' ? '0' : '1'); if (m !== 'no') LSset('rep-ivm', m);
    var q = new URLSearchParams(location.search); q.delete('iv'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '')); try { sessionStorage.setItem('rep-keep-reload', '1'); } catch (x) {} location.reload();
  }, true);
  /* número de huéspedes (se lee en el resumen de huéspedes): ajuste de la reserva, siempre visible */
  var gcn = seg(['2', '4', '6', '9', '14'].map(function(n){ return '<button type="button" class="rs-chip' + (n === LSget('replica-gc-n', '4') ? ' on' : '') + '" data-gcn="' + n + '">' + n + '</button>'; }).join(''));
  gcn.addEventListener('click', function(e){
    var b = e.target.closest('[data-gcn]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    LSset('replica-gc-n', b.getAttribute('data-gcn')); [].forEach.call(gcn.querySelectorAll('[data-gcn]'), function(c){ c.classList.toggle('on', c === b); });
    var q = new URLSearchParams(location.search); ['gc', 'guest', 'adult', 'minor'].forEach(function(k){ q.delete(k); }); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '')); try { sessionStorage.setItem('rep-keep-reload', '1'); } catch (x) {} location.reload();   /* las pantallas leen el número al cargar */
  }, true);
  /* componentes (uno solo, siempre uno): «Ask Vela tradicional» (filas que abren una ventana) o «Ask Vela chat» (conversación con preguntas sugeridas). Las pantallas con Vela lo leen al cargar. Por defecto, chat */
  var cmp = seg('');
  var CMP = [['trad', 'Ask Vela tradicional'], ['chat', 'Ask Vela chat']];   /* el chat final es el antiguo V5: respuestas completas, «Suggested» pegado a la respuesta y sin icono de Vela; como mucho cinco preguntas */
  var cmpCur = function(){ return LSget('replica-comp-trad', '0') === '1' && LSget('replica-comp-chat', '1') === '0' ? 'trad' : 'chat'; };   /* cualquier versión antigua del chat guardada = chat */
  document.documentElement.toggleAttribute('data-vv4', cmpCur() === 'chat'); document.documentElement.toggleAttribute('data-vv5', cmpCur() === 'chat');   /* chat: «Suggested» pegado a la respuesta y sin icono de Vela */
  cmp.innerHTML = CMP.map(function(c){ return '<button type="button" class="rs-chip' + (cmpCur() === c[0] ? ' on' : '') + '" data-cmp="' + c[0] + '" aria-pressed="' + (cmpCur() === c[0]) + '">' + c[1] + '</button>'; }).join('');
  cmp.addEventListener('click', function(e){
    var b = e.target.closest('[data-cmp]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var k = b.getAttribute('data-cmp'); if (k === cmpCur()) return;   /* siempre hay uno elegido: pulsar el que ya está elegido no hace nada */
    LSset('replica-comp-trad', k === 'trad' ? '1' : '0'); LSset('replica-comp-chat', k === 'trad' ? '0' : '1'); LSset('replica-comp-v2', '0'); LSset('replica-comp-v3', '0'); LSset('replica-comp-v4', '1'); LSset('replica-comp-v5', '1');
    try { sessionStorage.setItem('rep-keep-reload', '1'); } catch (x) {} location.reload();   /* el panel de Vela se monta al cargar */
  }, true);
  var addSet = function(){ pwPaint(); if (window.__repPanel) { window.__repPanel.add('Pagos', pw, 2); window.__repPanel.add('Tipo de depósito', dtp, 2.5); dtPaint(); window.__repPanel.add('Remote access', ra, 3); window.__repPanel.add('Número de huéspedes', gcn, 3.5); window.__repPanel.add('Componentes', cmp, 3.8); window.__repPanel.add('Vela sombreado', vsh, 3.85); window.__repPanel.add('Bordes', nbd, 3.86); window.__repPanel.add('Identity verification', ivs, 4); } else { document.body.appendChild(pw); document.body.appendChild(ra); document.body.appendChild(ivs); document.body.appendChild(cmp); } };
  if (document.readyState !== 'loading') addSet(); else document.addEventListener('DOMContentLoaded', addSet);
}
/* switch for the Home right panel (desktop only) */
if (/^home/.test(S.id || '') && (S.v === 'd' || document.querySelector('.mob-offers'))) {
  var rs = document.createElement('div'); rs.className = 'rail-switch';   /* ofertas (chips) */
  var rv = document.createElement('div'); rv.className = 'rail-switch';   /* variante (Actual / B) */
  var cur = new URLSearchParams(location.search).get('rail') || 'actual';
  var rl = function(k, label){ var p = new URLSearchParams(location.search); p.set('rail', k); return '<a href="' + S.id + '.' + S.v + '.html?' + p.toString() + '" class="' + (cur === k ? 'on' : '') + '">' + label + '</a>'; };
  var _cs = new URLSearchParams(location.search).get('set'), curSet = _cs === null ? 'htfe' : _cs.toLowerCase().replace(/[^htfe]/g, '');   /* vacío = ninguna oferta */
  var chips = [['h', 'Deals host'], ['t', 'Transfer'], ['f', 'Tours'], ['e', 'eSIM']];
  var chipHtml = function(){ return chips.map(function(c){ return '<button type="button" class="rs-chip' + (curSet.indexOf(c[0]) > -1 ? ' on' : '') + '" data-k="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '<button type="button" class="rs-chip" data-k="all">Todo</button>'; };
  rv.innerHTML = rl('actual', 'Actual') + rl('b', 'B');
  rs.innerHTML = chipHtml();
  rs.addEventListener('click', function(e){
    var b = e.target.closest('.rs-chip'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var k = b.getAttribute('data-k'), next = k === 'all' ? 'htfe' : (curSet.indexOf(k) > -1 ? curSet.replace(k, '') : curSet + k);
    curSet = ['h', 't', 'f', 'e'].filter(function(x){ return next.indexOf(x) > -1; }).join('');
    var p = new URLSearchParams(location.search); p.set('set', curSet); history.replaceState(null, '', location.pathname + '?' + p.toString());
    [].forEach.call(rs.querySelectorAll('.rs-chip'), function(c){ var kk = c.getAttribute('data-k'); if (kk !== 'all') c.classList.toggle('on', curSet.indexOf(kk) > -1); });
    [].forEach.call(rv.querySelectorAll('a'), function(a){ var u = new URL(a.href); u.searchParams.set('set', curSet); a.href = u.pathname.split('/').pop() + u.search; });
    window.dispatchEvent(new CustomEvent('railset', { detail: curSet }));
  }, true);
  var addRs = function(){ if (window.__repPanel) { window.__repPanel.add('Variante', rv, 40); window.__repPanel.add('Ofertas', rs, 41); } else { document.body.appendChild(rv); document.body.appendChild(rs); } };
  if (document.readyState !== 'loading') addRs(); else document.addEventListener('DOMContentLoaded', addRs);
}
/* a tiny toolbar to jump between screens and back to the index */
var bar = document.createElement('div'); bar.setAttribute('data-rep-bar',''); bar.style.pointerEvents = 'auto';
bar.style.cssText = 'position:fixed;left:8px;top:62px;z-index:99999;font:600 11px system-ui,sans-serif;display:flex;gap:6px;opacity:.9';
if (isDesk()) bar.style.cssText = 'position:fixed;right:340px;bottom:12px;z-index:99999;font:600 12px system-ui,sans-serif;display:flex;gap:6px;opacity:.92';
if (isDesk()) { var pm = document.createElement('a'); pm.href = '../phone.html?s=' + (S.id || 'home') + (location.search ? '&q=' + encodeURIComponent(location.search.slice(1)) : ''); pm.textContent = 'Ver en móvil'; pm.style.cssText = 'background:#385bf8;color:#fff;padding:7px 10px;border-radius:99px;text-decoration:none'; pm.setAttribute('data-rep-bar-link', ''); window.__pm = pm; }
bar.innerHTML = '<a href="../screens.html" style="background:#161643;color:#fff;padding:7px 10px;border-radius:99px;text-decoration:none">Índice</a><span style="background:#fff;color:#161643;padding:7px 10px;border-radius:99px;border:1px solid #e5e6ee">' + (S.id || '') + '</span>';
var addBar = function(){ if (window.__pm) bar.appendChild(window.__pm); if (window.__repPanel) window.__repPanel.add('Navegación', bar, 90); else document.body.appendChild(bar); }; var barDone = false; document.addEventListener('DOMContentLoaded', function(){ if (!barDone) { barDone = true; addBar(); } });
if (document.readyState !== 'loading' && !barDone) { barDone = true; addBar(); }

/* El icono de check-in (logo) lleva a la Home. Si hay un proceso en curso (verificación, formulario, escaneo, pago…) pregunta antes de salir. */
(function(){
  var BUSY = /^(g2-iv|g2-ivf|g2-ivh|g2-form-|g2-registering|form-|scan-|submit-|g2-submit-|pay-)/;
  var HOME = function(){ location.href = 'home.' + want + '.html'; };
  var ST = document.createElement('style');
  ST.textContent = '.lv-ov{position:fixed;inset:0;z-index:2147483200;display:flex;align-items:flex-end;justify-content:center;background:rgba(22,22,67,.46);animation:lvf .2s ease both}'
    + '.lv-sh{width:100%;max-width:480px;box-sizing:border-box;background:#fff;border-radius:24px 24px 0 0;padding:22px 20px max(0px,env(safe-area-inset-bottom,0px));text-align:center;font-family:Poppins,system-ui,sans-serif;color:#161643;animation:lvu .26s cubic-bezier(.2,.8,.2,1) both}'
    + '@media(min-width:600px){.lv-ov{align-items:center}.lv-sh{border-radius:24px;max-width:420px}}'
    + '.lv-ic{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 12px;border-radius:50%;background:#eef1ff;color:#385bf8}'
    + '.lv-sh h2{margin:0;font-size:19px;line-height:26px;font-weight:700}.lv-sh p{margin:8px 4px 18px;font-size:14.5px;line-height:21px;color:#6b6b95}'
    + '.lv-sh button{display:block;width:100%;height:48px;border-radius:99px;font:600 14.5px/20px Poppins,system-ui,sans-serif;letter-spacing:0;cursor:pointer;border:0}'
    + '.lv-stay{background:#385bf8;color:#fff}.lv-go{height:44px!important;margin-top:8px;background:#fff;color:#161643;border:1.5px solid #dfe2f1!important}.lv-go:hover{background:#f6f7fb}'
    + '@keyframes lvf{from{opacity:0}}@keyframes lvu{from{transform:translateY(40px);opacity:0}}';
  function ask(onLeave, o){
    o = o || {};
    if (document.querySelector('.lv-ov')) return;
    document.head.appendChild(ST);
    var ov = document.createElement('div'); ov.className = 'lv-ov';
    ov.innerHTML = '<div class="lv-sh" role="alertdialog" aria-modal="true" aria-labelledby="lv-t" aria-describedby="lv-d">'
      + '<h2 id="lv-t">' + (o.title || 'Leave this process?') + '</h2><p id="lv-d">' + (o.text || 'You\'re in the middle of registering a guest. If you go to Home now, the information you\'ve entered so far will be lost.') + '</p>'
      + '<button type="button" class="lv-stay">' + (o.stay || 'Stay and continue') + '</button><button type="button" class="lv-go">' + (o.go || 'Go to Home') + '</button></div>';
    var close = function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener('keydown', key, true); };
    var key = function(e){ if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', key, true);
    ov.addEventListener('click', function(e){ if (e.target === ov || e.target.closest('.lv-stay')) close(); else if (e.target.closest('.lv-go')) { close(); onLeave(); } });
    document.body.appendChild(ov); ov.querySelector('.lv-stay').focus();
  }
  window.__leave = { busy: function(){ return BUSY.test(S.id || ''); }, ask: ask, home: HOME,
    askBack: function(fn, o){ o = o || {}; ask(fn, { title: o.title || 'Go back?', text: o.text || 'If you go back now, the progress you\'ve made so far will be lost.', stay: o.stay || 'Stay here', go: o.go || 'Go back', icon: 'back' }); } };
  document.addEventListener('click', function(e){
    var lg = e.target.closest && e.target.closest('.mb-logo'); if (!lg) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (window.__leave.busy()) ask(HOME); else HOME();
  }, true);
  var arm = function(){ var l = document.querySelector('.mb-logo'); if (l && !l.getAttribute('role')) { l.removeAttribute('aria-hidden'); l.setAttribute('role', 'link'); l.setAttribute('aria-label', 'Go to Home'); l.setAttribute('tabindex', '0'); l.style.cursor = 'pointer'; l.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); l.click(); } }); } };
  setInterval(arm, 600); arm();
})();


/* El número de huéspedes de la reserva (Ajustes) también manda en los textos fijos «0 of 2 guests registered» de la home. */
(function(){
  var N = '4'; try { var v = localStorage.getItem('replica-gc-n'); if (['2', '4', '6', '9', '14'].indexOf(v) > -1) N = v; } catch (e) {}
  var fix = function(){ var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n; while ((n = w.nextNode())) { var t = n.nodeValue; if (/\b(\d+) of 2 guests registered/.test(t)) n.nodeValue = t.replace(/\b(\d+) of 2 guests registered/g, '$1 of ' + N + ' guests registered'); } };
  if (document.readyState !== 'loading') { fix(); setTimeout(fix, 600); } else document.addEventListener('DOMContentLoaded', function(){ fix(); setTimeout(fix, 600); });
})();
})();

/* ===== escritorio: «Back» como en el resumen de huéspedes: píldora «‹ Home» + «/» + nombre de la pantalla ===== */
(function(){
  if (!window.matchMedia('(min-width:1025px)').matches || new URLSearchParams(location.search).get('embed') === '1') return;
  var st = document.createElement('style'); st.id = 'rep-dbk';
  st.textContent = '.dbk-row{display:flex!important;align-items:center;gap:0;margin:0 0 8px!important;min-height:30px;padding:0!important}'
    + '.dbk-row .dbk-pill{display:inline-flex!important;align-items:center;gap:6px;box-sizing:border-box;height:30px!important;min-height:30px!important;margin:0!important;padding:0 12px 0 8px!important;border:1px solid #dfe2f1!important;border-radius:9999px!important;background:#fff!important;color:#161643!important;font:600 12px/16px Poppins,system-ui,sans-serif!important;cursor:pointer;transition:background .15s,border-color .15s}'
    + '.dbk-row .dbk-pill:hover{background:#eff6ff!important;border-color:#385bf8!important}'
    + '.dbk-pill>*:not(svg){display:none!important}.dbk-pill::after{content:attr(data-dbk);letter-spacing:0}'
    + '.dbk-pill svg{width:16px!important;height:16px!important;flex:none;color:#385bf8;stroke-width:2.4}'
    + '.dbk-sep{margin:0 6px;font-style:normal;font-weight:500;font-size:12px;color:#b7bcd6}'
    + '.dbk-row .dbk-eye{font:600 11px/16px Poppins,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#161643!important;white-space:nowrap}'
    + '.dbk-hide,.dbk-row .dbk-hide,.dbk-row .dbk-pill.dbk-hide{display:none!important}'
    /* CTA estándar: píldora azul de 48 px, Poppins 14.5/600 (en escritorio, 280 px y centrada) */
    + 'html body button.rep-cta.rep-cta{box-sizing:border-box;height:48px!important;min-height:48px!important;padding:0 20px!important;border-radius:9999px!important;font:600 14.5px/20px Poppins,system-ui,sans-serif!important;letter-spacing:0!important;box-shadow:none!important;transition:none!important}'
    + 'html body button.rep-cta2.rep-cta2{box-sizing:border-box;height:48px!important;min-height:48px!important;padding:0 20px!important;border-radius:9999px!important;border:1.5px solid #dfe2f1!important;background:#fff!important;color:#161643!important;font:600 14.5px/20px Poppins,system-ui,sans-serif!important;letter-spacing:0!important;box-shadow:none!important;transition:none!important}'
    + '@media (min-width:1025px){html body button.rep-cta.rep-cta,html body button.rep-cta2.rep-cta2{width:280px!important;max-width:100%;margin-left:auto!important;margin-right:auto!important}}'
    + 'html body button.rep-cta-m.rep-cta-m{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important}';
  document.head.appendChild(st);
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  function run(){
    if (/^hub-/.test((window.__SCREEN && window.__SCREEN.id) || '') || document.querySelector('.dbk-row') || document.querySelector('.bk-xa')) return true;   /* ya aplicado, o el resumen de huéspedes (tiene sus propias migas) */
    var back = [].filter.call(document.querySelectorAll('button'), function(b){ return /^\s*Back to [A-Za-z]/.test(b.textContent) && !b.closest('.hv, [role="dialog"], .rg-dock') && b.getBoundingClientRect().width > 0; })[0];
    var h1 = document.querySelector('h1');
    if (!back || !h1) return false;
    var row = back.parentElement; if (!row || row.querySelector('h1')) return false;
    var label = back.textContent.replace(/^\s*Back to\s+/, '').trim(); label = label.charAt(0).toUpperCase() + label.slice(1);
    /* destino fijo (no el historial del navegador): formulario y escaneo vuelven al resumen; «summary» al resumen; «payment/cart» al carrito; el resto a la Home */
    var raw = back.textContent.replace(/^\s*Back to\s+/, '').trim().toLowerCase(), sid = (window.__SCREEN && window.__SCREEN.id) || '', tgt = /^(form-|scan-|submit-)/.test(sid) || raw === 'summary' ? 'hub-after-1' : (raw === 'payment' || raw === 'cart' || /^pay-(0|1)/.test(sid) ? 'cart' : 'home');   /* el paso del depósito (pay-0/pay-1…) vuelve a Pagos */
    if (/^(form-|scan-|submit-)/.test(sid)) label = 'Summary'; else if (tgt === 'cart') label = 'Payments';
    if (/^iv-intro/.test(sid) && new URLSearchParams(location.search).get('bk') === 'form') { tgt = 'form-empty'; label = 'Details'; }   /* llegó desde «Start verification» del formulario: atrás vuelve al formulario */
    window.addEventListener('click', function(e){ if (!e.target.closest || e.target.closest('.dbk-pill') !== back) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); location.href = tgt + '.d.html'; }, true);   /* en la ventana: se adelanta a cualquier otro manejador del botón */
    row.classList.add('dbk-row'); back.classList.add('dbk-pill'); back.setAttribute('data-dbk', label); back.setAttribute('aria-label', back.textContent.trim());
    [].slice.call(back.childNodes).forEach(function(nd){ if (nd.nodeType === 3 && nd.nodeValue.trim()) { var sp = document.createElement('span'); sp.textContent = nd.nodeValue; nd.parentNode.replaceChild(sp, nd); } });   /* el texto original se oculta pero se conserva (la navegación lo lee) */
    var sv = back.querySelector('svg'); if (sv) sv.outerHTML = CHEV; else back.insertAdjacentHTML('afterbegin', CHEV);
    var wrap = h1.parentElement, eyeRow = wrap && wrap.previousElementSibling, eye = eyeRow && eyeRow.querySelector('span');
    if (eye) {
      var sep = document.createElement('i'); sep.className = 'dbk-sep'; sep.textContent = '/'; sep.setAttribute('aria-hidden', 'true');
      eye.classList.add('dbk-eye'); row.appendChild(sep); row.appendChild(eye);
      if (/^form-/.test(sid)) { back.classList.add('dbk-hide'); sep.classList.add('dbk-hide'); }   /* en el formulario no hay «Back»: solo queda el nombre de la pantalla */ if (eyeRow && !eyeRow.children.length) eyeRow.classList.add('dbk-hide');
    }
    return true;
  }
  /* migas fijas: al hacer scroll, una copia de «‹ Home / Pantalla» queda siempre visible arriba entre el menú y Vela (igual que en el resumen de huéspedes, que tiene la suya) */
  var bar = null, bst = document.createElement('style');
  bst.textContent = '.bk-bar{position:fixed;top:0;z-index:15;box-sizing:border-box;display:flex;align-items:center;padding:12px 0 10px;background:rgba(246,247,252,.68);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;clip-path:inset(0 0 -30px 0)}.bk-bar.on{opacity:1;visibility:visible;transform:none;transition-delay:0s}'
    + '.bk-bar .dbk-row{margin:0!important}'
    + '.bk-bar::before,.bk-bar::after{content:"";position:absolute;left:0;right:0;pointer-events:none;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 110px,#000 calc(100% - 40px),transparent 100%);mask-image:linear-gradient(to right,transparent 0,#000 110px,#000 calc(100% - 40px),transparent 100%)}'
    + '.bk-bar::before{bottom:0;height:1px;background:rgba(22,22,67,.1)}.bk-bar::after{top:100%;height:22px;background:linear-gradient(to bottom,rgba(22,22,67,.16),rgba(22,22,67,.05) 45%,rgba(22,22,67,0))}'
    + 'html:not([data-bsh="1"]) .bk-bar::after{display:none}html[data-nobd] .bk-bar::before{display:none}[class*="sidebar-wrapper"]{position:relative;z-index:16}';
  document.head.appendChild(bst);
  var syncBar = function(){
    if (/^hub-/.test((window.__SCREEN && window.__SCREEN.id) || '')) return;
    var row = [].filter.call(document.querySelectorAll('.dbk-row'), function(r){ return !r.closest('.bk-bar'); })[0];
    if (!row) { if (bar) bar.classList.remove('on'); return; }
    var rc = row.getBoundingClientRect();
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'bk-bar'; bar.setAttribute('aria-hidden', 'true');
      bar.addEventListener('click', function(e){ var p = e.target.closest && e.target.closest('.dbk-pill'); if (!p) return; var r0 = [].filter.call(document.querySelectorAll('.dbk-row'), function(r){ return !r.closest('.bk-bar'); })[0], o = r0 && r0.querySelector('.dbk-pill'); if (o) { e.preventDefault(); o.click(); } });
      document.body.appendChild(bar);
    }
    var hh = row.outerHTML; if (bar.__h !== hh) { bar.__h = hh; bar.innerHTML = hh; var c = bar.firstElementChild; if (c) c.style.visibility = ''; }
    var sb = document.querySelector('[class*="sidebar-wrapper"]'), pn = document.querySelector('aside[data-slot="assistant-panel"]');
    var L = sb ? Math.round(sb.getBoundingClientRect().right) : 0, Rt = pn ? Math.round(pn.getBoundingClientRect().left) : window.innerWidth;
    bar.style.left = L + 'px'; bar.style.width = Math.max(0, Rt - L) + 'px'; bar.style.paddingLeft = Math.max(0, rc.left - L) + 'px';
    var on = rc.height > 0 && rc.bottom < 6; bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true');
  };
  window.addEventListener('scroll', syncBar, { passive: true, capture: true }); window.addEventListener('resize', syncBar);
  var tb = 0; (function tk(){ syncBar(); if (tb++ < 20) setTimeout(tk, 300); })();
  var n = 0; (function t(){ if (!run() && n++ < 25) setTimeout(t, 120); })();
})();

/* ===== sin flechas en los botones de acción (CTA): se quitan los iconos de flecha a la derecha de «Submit», «Continue», «Pay», «Begin verification»… (la flecha «atrás» se mantiene) ===== */
(function(){
  var sel = 'button svg.lucide-arrow-right, button svg.lucide-arrow-up-right';
  var strip = function(){ [].forEach.call(document.querySelectorAll(sel), function(s){ s.remove(); }); };
  var pend = 0, obs = function(){ if (pend) return; pend = setTimeout(function(){ pend = 0; strip(); }, 80); };
  var go = function(){ strip(); new MutationObserver(obs).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState !== 'loading') go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* ===== CTA estándar: marca los botones de acción azules (no los pequeños de tarjeta) para que midan y se vean igual en todas las pantallas ===== */
(function(){
  var isBlue = function(c){ return c === 'rgb(56, 91, 248)'; };
  var mark = function(){
    [].forEach.call(document.querySelectorAll('button'), function(b){
      if (b.classList.contains('rep-cta') || b.closest('aside, #rep-panel, .hub-sc, .rail-switch, .ivs-ov, .lv-ov, .rep-sh') || b.classList.contains('dbk-pill')) return;
      var r = b.getBoundingClientRect(); if (r.width < 150 || r.height < 36) return;
      var c = getComputedStyle(b); if (!isBlue(c.backgroundColor) || parseFloat(c.fontSize) < 14) return;
      b.classList.add('rep-cta'); if (b.closest('[role="dialog"]')) b.classList.add('rep-cta-m');   /* en modales ocupa el ancho de la hoja */
    });
    /* el botón secundario que acompaña al CTA (mismo contenedor) toma el mismo tamaño, con borde */
    [].forEach.call(document.querySelectorAll('button.rep-cta'), function(p){ [].forEach.call(p.parentElement.children, function(s){ if (s === p || s.tagName !== 'BUTTON' || s.classList.contains('rep-cta') || s.classList.contains('rep-cta2')) return; var r = s.getBoundingClientRect(); if (r.width > 120 && r.height >= 36) { s.classList.add('rep-cta2'); if (p.classList.contains('rep-cta-m')) s.classList.add('rep-cta-m'); } }); });
  };
  var pend = 0, obs = function(){ if (pend) return; pend = setTimeout(function(){ pend = 0; mark(); }, 120); };
  var go = function(){ mark(); setTimeout(mark, 500); new MutationObserver(obs).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState !== 'loading') go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* ===== dentro del marco del móvil/escritorio: las navegaciones las gestiona el marco con doble búfer (sin parpadeo) ===== */
(function(){
  try {
    if (window.parent === window || !window.parent.__phoneHost || !window.navigation) return;
    if (new URLSearchParams(location.search).get('embed') === '1') return;
    window.navigation.addEventListener('navigate', function(e){
      if (window.__allowNav) return;   /* la vista «Móvil + escritorio» navega sus marcos desde fuera: esa navegación se deja pasar */
      if (!e.cancelable || e.hashChange || e.downloadRequest !== null || e.formData || e.navigationType === 'reload' || e.navigationType === 'traverse') return;
      var u; try { u = new URL(e.destination.url); } catch (x) { return; }
      if (u.origin !== location.origin || !/\/screens\/[^/]+\.[md]\.html$/.test(u.pathname) || u.href === location.href) return;
      e.preventDefault(); window.parent.postMessage({ rep: 'phone-nav', url: u.href }, '*');
    });
    history.back = function(){ window.parent.postMessage({ rep: 'phone-back' }, '*'); };   /* «atrás» lo resuelve el marco con su propio recorrido */
  } catch (x) {}
})();

/* ===== panel de Vela de la verificación (escritorio): nunca con scroll; si hace falta, el QR se encoge (y, en el límite, se oculta) ===== */
(function(){
  if (!window.matchMedia('(min-width:1025px)').matches) return;
  window.__railFit = function(){
    var a = document.querySelector('aside'); if (!a) return;
    var over = function(){ return a.scrollHeight > a.clientHeight + 1; }, intro = a.querySelector(':scope > p');
    a.style.overflowY = 'hidden';
    var svg = a.querySelector('svg[data-qr]') || [].filter.call(a.querySelectorAll('svg'), function(s){ return s.getBoundingClientRect().width > 80; })[0]; if (svg) svg.setAttribute('data-qr', '1');
    if (svg && svg.parentElement.style.display === 'none') return;   /* QR retirado (desde el paso 1): nada que ajustar */
    if (intro) intro.style.display = '';
    if (!svg) return; svg.__w = svg.__w || Math.round(svg.getBoundingClientRect().width) || 120;
    var size = svg.__w, set = function(v){ svg.style.width = v + 'px'; svg.style.height = v + 'px'; }; set(size);
    /* el QR SIEMPRE se queda: solo se hace más pequeño, tanto como haga falta */
    while (over() && size > 24) { size -= 4; set(size); }
    if (over() && intro) intro.style.display = 'none';   /* si ni así cabe, se quita el texto introductorio, nunca el QR */
  };
  var t = 0, rf = function(){ clearTimeout(t); t = setTimeout(function(){ if (window.__railFit) window.__railFit(); }, 80); };
  window.addEventListener('resize', rf); window.addEventListener('load', rf);
})();

/* cabecera de Vela: un solo punto verde (el del avatar); «Here to help» a su derecha, centrado con ese punto, y «Vela» centrado en el espacio de arriba */
(function(){
  var st = document.createElement('style'); st.id = 'rep-vela-head';
  st.textContent = 'aside[data-slot="assistant-panel"] [data-slot="status-dot"]{display:none!important}'
    + 'aside[data-slot="assistant-panel"] [class*="h-[30px]"][class*="w-[30px]"],aside[data-slot="assistant-panel"] [class*="bg-[var(--assistant-action-icon-bg)]"],aside[data-slot="assistant-panel"] .size-7[class*="chekin-blue-tint-info"]{display:none!important}'
    + 'aside[data-slot="assistant-panel"] section>span:first-child+*[class*="py-"],aside[data-slot="assistant-panel"] section>span:first-child+*>[class*="py-"],aside[data-slot="assistant-panel"] section>span:first-child+.fx-gtk>div{padding-top:1px!important}'   /* el primer texto de cada sección queda a la misma distancia (≈13 px) de la raya del título */   /* Vela: las filas no llevan icono (se mantienen en las guías, .rv-ti, y en los consejos de la foto, .iv-rtip) */
    + 'aside[data-slot="assistant-panel"] > div:first-child > div{display:flex!important;flex-direction:column!important;justify-content:space-between!important;height:38px!important}'
    + 'aside[data-slot="assistant-panel"] > div:first-child > div > div:first-child{height:24px!important;line-height:24px!important;display:flex;align-items:center}'
    + 'aside[data-slot="assistant-panel"] > div:first-child > div > div:last-child{height:14px!important;line-height:14px!important;display:flex;align-items:center;gap:0!important}';
  (document.head || document.documentElement).appendChild(st);
})();
/* Vela: la columna crece con la pantalla (320 px en portátil, hasta 480 px en monitor grande) y se puede comprimir con el botón «Collapse panel» (también en la home). Comprimida queda una pestaña de 56 px con el botón arriba (no se mueve), debajo el icono de Vela (que viaja hasta ahí con animación) y, en la home, «Offers for your stay» en vertical */
(function(){
  if (!window.matchMedia('(min-width:1025px)').matches) return;
  var html = document.documentElement, KEY = 'rep-vela-min', min = false; try { min = localStorage.getItem(KEY) === '1'; } catch (e) {}
  var W = '.page-wrapper:has(> div > aside[data-slot="assistant-panel"])', A = 'aside[data-slot="assistant-panel"]', H = 'div:has(> aside[data-slot="collapsible-rail"])', R = 'aside[data-slot="collapsible-rail"]';
  if (min) { html.setAttribute('data-vela', 'min'); html.classList.add('rep-vela-boot'); }   /* al cargar ya comprimida no se anima la columna */
  var st = document.createElement('style'); st.id = 'rep-vela-col';
  st.textContent = '@media (min-width:1025px){html.rep-vela-boot .page-wrapper,html.rep-vela-boot ' + H + ',html.rep-vela-boot ' + A + ' > *,html.rep-vela-boot ' + R + ' > div{transition:none!important}' + W + '{grid-template-columns:266px minmax(0,1fr) clamp(320px,22vw,480px)!important}'
    + 'html[data-vela="min"] ' + W + '{grid-template-columns:266px minmax(0,1fr) 56px!important}'
    + 'html[data-vela="min"] ' + H + '{grid-template-columns:minmax(0,1fr) 56px!important}'
    + A + ',' + R + '{overflow:hidden!important}'
    + A + ' > *:not(.rep-vtab){min-width:calc(clamp(320px,22vw,480px) - 48px);transition:opacity .22s ease .16s}'
    + R + ' > div:not(.rep-vtab){min-width:calc(clamp(320px,22vw,480px) - 48px);transition:opacity .22s ease .16s}'
    + 'html[data-vela="min"] ' + A + ' > *:not(.rep-vtab),html[data-vela="min"] ' + R + ' > div:not(.rep-vtab){opacity:0;pointer-events:none;transition-duration:.12s;transition-delay:0s}'
    + 'html[data-vela="min"] ' + A + '{padding-left:0!important;padding-right:0!important}'
    + 'button[aria-label="Collapse panel"],button[aria-label="Expand panel"]{width:36px!important;height:36px!important;margin:-2px;z-index:50!important}'
    + 'html[data-vela="min"] button[aria-label="Expand panel"] svg{transform:scaleX(-1)}'
    + '.rep-vtab{position:absolute;right:10px;width:36px;top:68px;z-index:40;display:none;flex-direction:column;align-items:center;gap:14px;pointer-events:none}.rep-vtab.has-av{top:96px}'
    + 'html[data-vela="min"] .rep-vtab{display:flex}'
    + '.rep-vtab-av{position:relative;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--assistant-avatar-from,#385bf8),var(--assistant-avatar-to,#6b8bff));color:#fff}'
    + '.rep-vtab-av svg{width:18px;height:18px}.rep-vtab-av i{position:absolute;right:0;bottom:0;width:14px;height:14px;border-radius:50%;border:2px solid var(--assistant-status-dot-ring,#fff);background:var(--assistant-status-dot,#37e08f)}'
    + '.rep-vtab-ln{position:absolute;left:0;right:0;top:79px;height:1px;background:var(--assistant-divider,#e5e6ee);opacity:0;pointer-events:none;transition:opacity .2s ease}'
    + 'html[data-vela="min"] .rep-vtab-ln{opacity:1;transition-delay:.18s}'
    + '.rep-vtab-lb{writing-mode:vertical-rl;transform:rotate(180deg);font:600 12.5px/1 Poppins,system-ui,sans-serif;letter-spacing:.04em;color:#6b6b95;white-space:nowrap}}';
  (document.head || document.documentElement).appendChild(st);
  var lastAv = null;
  function avRect(){ var s = document.querySelector(A + ' > div:first-child > span'); if (!s) return null; var q = s.getBoundingClientRect(); return q.width ? { left: q.left, top: q.top } : null; }
  function tab(){
    var b = document.querySelector('button[aria-label="Collapse panel"],button[aria-label="Expand panel"]'); if (!b) return null;
    var t = b.parentElement.querySelector(':scope > .rep-vtab'); if (t) return t;
    var hd = document.querySelector(R + ' .vela-heading'), hh = hd && hd.querySelector('h1,h2,h3,strong'), lb = hd ? (hh ? hh.textContent : hd.innerText.split('\n').filter(function(x){ return x.trim(); })[0] || '').trim() : '';
    var isHome = !!document.querySelector(R) && !document.querySelector(A);
    t = document.createElement('div'); t.className = 'rep-vtab' + (isHome ? '' : ' has-av'); t.setAttribute('aria-hidden', 'true');
    t.innerHTML = (isHome ? '' : '<span class="rep-vtab-av"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4M22 4h-4"/></svg><i></i></span>') + (lb ? '<span class="rep-vtab-lb">' + lb.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>' : '');
    if (!isHome) { var ln = document.createElement('i'); ln.className = 'rep-vtab-ln'; ln.setAttribute('aria-hidden', 'true'); b.parentElement.appendChild(ln); }
    b.parentElement.appendChild(t); return t;
  }
  var tmrH = 0, tmrM = 0;
  function settleMeasure(){ if (!min) { var a = avRect(); if (a) lastAv = a; } }   /* la posición del icono se mide solo con el panel abierto y quieto */
  function apply(m, fire){
    var t = tab(); clearTimeout(tmrH); clearTimeout(tmrM);
    if (t) { [].forEach.call(t.querySelectorAll('.rep-vtab-av,.rep-vtab-lb'), function(e){ (e.getAnimations ? e.getAnimations() : []).forEach(function(an){ an.cancel(); }); }); }   /* un clic rápido no deja animaciones a medias */
    var from = lastAv; min = m; html.setAttribute('data-vela', m ? 'min' : 'open');
    var b = document.querySelector('button[aria-label="Collapse panel"],button[aria-label="Expand panel"]'); if (b) b.setAttribute('aria-label', m ? 'Expand panel' : 'Collapse panel');
    try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) {}
    if (fire && t && t.animate && !(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) {
      var av = t.querySelector('.rep-vtab-av'), lb = t.querySelector('.rep-vtab-lb'), EZ = 'cubic-bezier(.32,.72,0,1)', OUT = 130;
      /* el icono no viaja: se desvanece donde está y el otro aparece en su sitio solo cuando el primero ya se ha desvanecido del todo */
      if (m) {
        t.style.display = 'flex';
        if (av) av.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: OUT + 20, easing: 'ease-out', fill: 'backwards' });
        if (lb) lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: OUT + 80, easing: 'ease-out', fill: 'backwards' });
        t.style.display = '';
      } else {
        t.style.display = 'flex';
        [av, lb].forEach(function(e){ if (e) e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT, easing: 'ease-in', fill: 'forwards' }); });
        tmrH = setTimeout(function(){ t.style.display = ''; }, OUT + 10);   /* la cabecera real de Vela reaparece justo después (retardo en el CSS) */
      }
    }
    if (!m) tmrM = setTimeout(settleMeasure, 480);
    if (fire) { setTimeout(function(){ window.dispatchEvent(new Event('resize')); }, 340); }
  }
  function init(){ var a = avRect(); if (a && !min) lastAv = a; tab(); apply(min, false); requestAnimationFrame(function(){ requestAnimationFrame(function(){ html.classList.remove('rep-vela-boot'); }); }); }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('button[aria-label="Collapse panel"],button[aria-label="Expand panel"]');
    if (!t) return; e.preventDefault(); e.stopImmediatePropagation(); apply(!min, true);
  }, true);
})();

/* Vela nunca recorta ni esconde: si el contenido del panel no cabe en la altura de la ventana, se compacta por niveles (vt1–vt3) */
(function(){
  var run = function(){
    var a = document.querySelector('aside[data-slot="assistant-panel"]'); if (!a || a.querySelector('.vl') || document.querySelector('.rail-vela')) return;
    ['vt1', 'vt2', 'vt3'].forEach(function(c){ a.classList.remove(c); });
    for (var n = 0; n <= 3; n++) { if (n) a.classList.add('vt' + n); if (a.scrollHeight <= a.clientHeight + 1) break; }
  };
  var t = null, sched = function(){ clearTimeout(t); t = setTimeout(run, 120); };
  window.addEventListener('resize', sched); window.addEventListener('scroll', sched, { passive: true, capture: true });
  [300, 900, 2000].forEach(function(ms){ setTimeout(run, ms); });
  try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();

/* móvil: si un pie blanco (dock de CTA en flujo, p. ej. «Continue» de verificación) acaba a unos px del final de la página porque el contenedor deja relleno inferior, ese relleno se quita para que el dock llegue al borde */
(function(){
  if (!window.matchMedia || !matchMedia('(max-width:1023.98px)').matches) return;
  var done = false, run = function(){
    var H = Math.max(document.documentElement.scrollHeight, innerHeight), best = null;
    [].forEach.call(document.querySelectorAll('footer,div,section,main,form'), function(e){
      var s = getComputedStyle(e); if ((s.position !== 'static' && s.position !== 'sticky') || s.backgroundColor !== 'rgb(255, 255, 255)') return;
      var b = e.getBoundingClientRect(); if (b.width < innerWidth - 2 || b.height < 40 || b.height > 400) return;
      var gap = H - (b.bottom + window.scrollY); if (gap < 8 || gap > 26) return; if (!best || gap < best.gap) best = { e: e, gap: gap };
    });
    /* docks sticky pegados abajo (p. ej. «Back to home»): en páginas con scroll, al llegar al final el contenedor deja su relleno debajo; se quita igual */
    [].forEach.call(document.querySelectorAll('div,footer,section'), function(d){
      var s = getComputedStyle(d); if (s.position !== 'sticky' || s.bottom !== '0px' || s.backgroundColor !== 'rgb(255, 255, 255)') return;
      for (var a = d.parentElement; a && a !== document.body; a = a.parentElement) { var pb = parseFloat(getComputedStyle(a).paddingBottom) || 0; if (pb >= 8 && pb <= 26) { a.style.setProperty('padding-bottom', '0', 'important'); break; } }
    });
    if (!best) return;
    for (var a = best.e.parentElement; a && a !== document.body; a = a.parentElement) {
      var pb = parseFloat(getComputedStyle(a).paddingBottom) || 0;
      if (Math.abs(pb - best.gap) < 1.5) { a.style.setProperty('padding-bottom', '0', 'important'); break; }
    }
  };
  [400, 1200, 2500].forEach(function(ms){ setTimeout(run, ms); });
  window.addEventListener('resize', function(){ setTimeout(run, 150); });
})();

/* móvil: todos los docks de CTA comparten el mismo espaciado inferior que «Continue» (12 px bajo el botón; bajo un enlace de texto, 12 px bajo el texto) */
(function(){
  if (!window.matchMedia || !matchMedia('(max-width:1023.98px)').matches) return;
  var T = 12, alpha = function(c){ var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
  var run = function(){
    var H = innerHeight, DH = Math.max(document.documentElement.scrollHeight, innerHeight);
    [].forEach.call(document.querySelectorAll('div,footer,section'), function(d){
      var s = getComputedStyle(d); if (s.backgroundColor !== 'rgb(255, 255, 255)' || s.position === 'absolute') return;
      var r = d.getBoundingClientRect(); if (r.width < innerWidth - 2 || r.height < 40) return;
      if (r.height > 420) { var fx = false; for (var z = d; z && z !== document.body; z = z.parentElement) if (getComputedStyle(z).position === 'fixed') { fx = true; break; } if (!fx || r.height > H * .95) return; }   /* hojas / modales altos: solo si están fijos */
      if (Math.abs(r.bottom - H) > 1.5 && Math.abs(r.bottom + window.scrollY - DH) > 1.5) return;
      var ctr = [].slice.call(d.querySelectorAll('button,a,p,span,small,li,label,h1,h2,h3,h4')).filter(function(b){ var q = b.getBoundingClientRect(); if (q.width <= 20 || q.height <= 8 || getComputedStyle(b).visibility === 'hidden') return false; return /^(BUTTON|A)$/.test(b.tagName) ? q.height > 20 : [].some.call(b.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); }); });   /* último control o texto del pie (p. ej. la nota bajo «Begin verification») */
      if (!ctr.length) return;
      var last = ctr.reduce(function(a, b){ return b.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? b : a; });
      var ls = getComputedStyle(last), q = last.getBoundingClientRect(), boxed = (alpha(ls.backgroundColor) > .05 && ls.backgroundColor !== s.backgroundColor) || /\d/.test(ls.boxShadow.replace(/rgba?\([^)]*\)/g, '')) || (parseFloat(ls.borderBottomWidth) > 0 && alpha(ls.borderBottomColor) > .05);
      var bottom = q.bottom;
      if (!boxed) { var rg = document.createRange(); rg.selectNodeContents(last); var tb = rg.getBoundingClientRect(); if (tb.height) bottom = tb.bottom; }
      var gap = r.bottom - bottom, delta = T - gap; if (Math.abs(delta) < 0.5) return;
      var pb = Math.max(0, (parseFloat(s.paddingBottom) || 0) + delta);
      d.style.setProperty('padding-bottom', 'max(' + pb + 'px, env(safe-area-inset-bottom,0px))', 'important');
    });
  };
  [500, 1400, 2800].forEach(function(ms){ setTimeout(run, ms); });
  window.addEventListener('resize', function(){ setTimeout(run, 200); });
  var tm = null, ta = null, tb = null;
  var later = function(){ clearTimeout(tm); tm = setTimeout(run, 160); clearTimeout(ta); ta = setTimeout(run, 480); clearTimeout(tb); tb = setTimeout(run, 900); };   /* los modales entran con animación: se vuelve a medir cuando terminan */
  try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  document.addEventListener('animationend', later, true); document.addEventListener('transitionend', later, true);
})();

/* móvil: al final de una página con scroll, el último contenido queda a 12 px del borde inferior (se recorta el relleno sobrante del contenedor) */
(function(){
  if (!window.matchMedia || !matchMedia('(max-width:1023.98px)').matches) return;
  if (new URLSearchParams(location.search).get('embed') === '1') return;
  var T = 12, alpha = function(c){ var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
  var run = function(){
    var DH = document.documentElement.scrollHeight; if (DH <= innerHeight + 1) return;
    var bodyBg = getComputedStyle(document.body).backgroundColor, last = null, lb = 0, sy = window.scrollY;
    [].forEach.call(document.querySelectorAll('body *'), function(e){
      if (e.closest('#rep-panel,#rep-panel-set,.rep-gc-frame,.hub-sc,.bk-bar,.rep-switch,.lv-ov,.ivs-ov,.rep-sh-back')) return;
      var s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed' || s.position === 'sticky' || s.position === 'absolute' || parseFloat(s.opacity) < .05) return;
      for (var z = e.parentElement; z && z !== document.body; z = z.parentElement) { var zp = getComputedStyle(z).position; if (zp === 'fixed' || zp === 'sticky') return; }
      var r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 6) return;
      var own = [].some.call(e.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); });
      var paint = own || /^(IMG|SVG|BUTTON|INPUT|VIDEO|CANVAS)$/i.test(e.tagName) || (alpha(s.backgroundColor) > .05 && s.backgroundColor !== bodyBg) || (s.backgroundImage && s.backgroundImage !== 'none');
      if (!paint) return;
      var b = r.bottom + sy; if (b > lb) { lb = b; last = e; }
    });
    if (!last) return;
    var fixedH = 0;   /* un dock fijo abajo tapa el final: el hueco debe ser su altura + 12 px */
    [].forEach.call(document.querySelectorAll('div,footer,section,nav,aside'), function(e){
      if (e.closest('#rep-panel,#rep-panel-set,.rep-gc-frame,.hub-sc,.bk-bar,.rep-switch,.lv-ov,.ivs-ov,.rep-sh-back')) return;
      var s = getComputedStyle(e); if (s.position !== 'fixed' || s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < .05) return;
      var q = e.getBoundingClientRect(); if (q.width >= innerWidth - 2 && q.height > 20 && q.height < innerHeight * .6 && Math.abs(q.bottom - innerHeight) < 3) fixedH = Math.max(fixedH, q.height);
    });
    var extra = DH - lb - T - fixedH; if (extra < 1) return;
    for (var a = last; a && a !== document.documentElement && extra > .5; a = a.parentElement) {
      var ab = a.getBoundingClientRect().bottom + sy; if (Math.abs(ab - DH) > 24 && a !== last) { if (ab < DH - 40) continue; }
      var cs = getComputedStyle(a), pb = parseFloat(cs.paddingBottom) || 0, mb = parseFloat(cs.marginBottom) || 0;
      if (a === last) continue;
      var cut = Math.min(extra, pb); if (cut > .5) { a.style.setProperty('padding-bottom', (pb - cut) + 'px', 'important'); extra -= cut; }
      cut = Math.min(extra, Math.max(0, mb)); if (cut > .5 && extra > .5) { a.style.setProperty('margin-bottom', (mb - cut) + 'px', 'important'); extra -= cut; }
    }
  };
  var tm = null, sched = function(){ clearTimeout(tm); tm = setTimeout(run, 220); };
  [700, 1600, 3000].forEach(function(ms){ setTimeout(run, ms); });
  window.addEventListener('resize', sched);
  try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();

/* móvil: el primer contenido de la pantalla (título, caja, tarjeta…) queda a unos 14 px de la barra de navegación superior. Se recorta el margen del bloque que empieza donde ese contenido */
(function(){
  if (!window.matchMedia || !matchMedia('(max-width:1023.98px)').matches) return;
  var TARGET = 14, alpha = function(c){ var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
  var find = function(){
    var bar = 0, barEl = null; [].forEach.call(document.querySelectorAll('*'), function(e){ var s = getComputedStyle(e); if (s.position !== 'fixed' && s.position !== 'sticky') return; var r = e.getBoundingClientRect(); if (r.top <= 1 && r.top > -2 && r.height >= 40 && r.height <= 120 && r.width >= innerWidth - 2 && r.bottom > bar) { bar = r.bottom; barEl = e; } });
    if (!bar) return null;
    var best = null;
    [].forEach.call(document.querySelectorAll('div,section,header,main,article,h1,h2,h3,p,ul,img,svg,button,a,form,nav,span'), function(e){
      if ((barEl && barEl.contains(e)) || e.closest('#rep-panel,#rep-panel-set,[data-rep-bar],.rep-switch,.bk-bar,[data-slot="cta-dock"]')) return;
      var r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || r.top < bar - 2 || r.top > bar + 110) return;
      var s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky' || s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < .05) return;
      var own = [].some.call(e.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); });
      var vis = own || alpha(s.backgroundColor) > .05 || (s.backgroundImage && s.backgroundImage !== 'none') || (s.boxShadow && s.boxShadow !== 'none') || /^(IMG|SVG)$/i.test(e.tagName) || (e.tagName === 'BUTTON');
      if (!vis) return; if (!best || r.top < best.top - .5) best = { e: e, top: r.top };
    });
    if (!best) return null;
    /* en un texto, el borde de la caja de línea queda por encima de las mayúsculas: se mide la distancia visual (borde de la tinta) para que cajas y títulos queden igual */
    var bs = getComputedStyle(best.e), own2 = [].some.call(best.e.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); }), boxed = alpha(bs.backgroundColor) > .05 || (bs.backgroundImage && bs.backgroundImage !== 'none') || /^(IMG|SVG)$/i.test(best.e.tagName), off = 0;
    if (own2 && !boxed) { var fs = parseFloat(bs.fontSize) || 16, lh = parseFloat(bs.lineHeight); if (!lh) lh = 1.2 * fs; off = Math.max(0, (lh - 1.4 * fs) / 2 + 0.35 * fs); }
    return { bar: bar, e: best.e, top: best.top, gap: best.top - bar, off: off };
  };
  window.__firstGap = find;
  var run = function(){
    if (window.scrollY > 4) return; var f = find(); if (!f) return;
    var delta = f.gap + f.off - TARGET; if (delta < 1) return;
    var el = f.e;
    for (var a = f.e.parentElement; a && a !== document.body; a = a.parentElement) { var t = a.getBoundingClientRect().top; if (t < f.bar - 1 || f.top - t > 10) break; el = a; }
    var mt = parseFloat(getComputedStyle(el).marginTop) || 0;
    el.style.setProperty('margin-top', (mt - delta) + 'px', 'important');
  };
  [400, 1100, 2200].forEach(function(ms){ setTimeout(run, ms); });
  var tm = null; try { new MutationObserver(function(){ clearTimeout(tm); tm = setTimeout(run, 200); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();

/* móvil: con un modal / hoja inferior abierto, el fondo de la página (la franja del borde inferior, zona de gestos) pasa a blanco como el modal; al cerrarlo vuelve al gris. Solo se pinta html/body: el contenido sigue sobre su fondo gris */
(function(){
  if (!window.matchMedia || !matchMedia('(max-width:1023.98px)').matches) return;
  if (new URLSearchParams(location.search).get('embed') === '1') return;   /* dentro del iframe del modal el fondo debe seguir transparente para ver la pantalla de detrás */
  var st = document.createElement('style'); st.id = 'rep-modal-bg'; st.textContent = 'html.rep-modal{background-color:#fff!important}html.rep-modal::before{content:"";position:fixed;left:0;right:0;top:0;bottom:0;background:var(--rep-bg,#f5f5f7);z-index:-1;pointer-events:none}html.rep-modal body{background-color:var(--rep-bg,#f5f5f7)!important}';   /* el blanco queda solo fuera del viewport (zona de gestos); dentro, una capa fija con el gris de la página aunque el documento haga scroll */ document.head.appendChild(st);
  var isOpen = function(){
    var found = false;
    [].forEach.call(document.querySelectorAll('div,section,aside,dialog'), function(e){
      if (found) return; var s = getComputedStyle(e);
      if (s.position !== 'fixed' || s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < .05) return;
      var r = e.getBoundingClientRect(); if (r.width < innerWidth - 2 || r.height < 120) return;
      if (e.closest('#rep-panel,#rep-panel-set,.bk-bar,[data-rep-bar]')) return;
      var dim = /bg-black|rgba\(0, 0, 0/.test((e.className || '') + ' ' + s.backgroundColor) && r.height >= innerHeight - 2;   /* velo oscuro a pantalla completa */
      var sheet = s.backgroundColor === 'rgb(255, 255, 255)' && Math.abs(r.bottom - innerHeight) < 2 && r.height > 160 && r.height < innerHeight - 4 && e.getAttribute('data-slot') !== 'cta-dock' && !/dock/.test(e.className + '');
      if (dim || sheet || e.classList.contains('rep-gc-frame') || e.getAttribute('role') === 'dialog' || e.getAttribute('aria-modal') === 'true') found = true;
    });
    return found;
  };
  /* qué hay realmente en el borde inferior de la pantalla: si es blanco (dock, pie de página, hoja…) la franja de gestos también lo es; si es el gris de la página, se queda gris */
  var bottomWhite = function(){
    var els = document.elementsFromPoint ? document.elementsFromPoint(3, innerHeight - 2) : [];
    for (var k = 0; k < els.length; k++) {
      var e = els[k]; if (e === document.documentElement || e === document.body || e.closest('#rep-panel,#rep-panel-set,.rep-gc-frame')) continue;
      var m = getComputedStyle(e).backgroundColor.match(/rgba?\(([^)]+)\)/); if (!m) continue;
      var p = m[1].split(',').map(parseFloat); var al = p.length > 3 ? p[3] : 1; if (al < .5) continue;
      return p[0] > 250 && p[1] > 250 && p[2] > 250;
    }
    return false;
  };
  var run = function(){
    var on = isOpen() || bottomWhite(), h = document.documentElement;
    if (on) { var bg = getComputedStyle(document.body).backgroundColor, m = bg.match(/rgba?\(([^)]+)\)/), al = m ? (m[1].split(',').length > 3 ? parseFloat(m[1].split(',')[3]) : 1) : 0; if (m && al > .5) h.style.setProperty('--rep-bg', bg); }
    h.classList.toggle('rep-modal', on);
  };
  var tm = null; var sched = function(){ clearTimeout(tm); tm = setTimeout(run, 80); };
  try { new MutationObserver(sched).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-state', 'hidden'] }); } catch (e) {}
  window.addEventListener('resize', sched); [300, 1000, 2500].forEach(function(ms){ setTimeout(run, ms); });
})();


/* ningún campo de formulario se selecciona solo al cargar la pantalla: si recibe el foco sin que haya habido un gesto del usuario, se quita */
(function(){
  var gesture = false, mark = function(){ gesture = true; };
  ['pointerdown', 'keydown', 'touchstart'].forEach(function(t){ window.addEventListener(t, mark, { capture: true, passive: true, once: true }); });
  document.addEventListener('focusin', function(e){
    var t = e.target; if (gesture || !t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    setTimeout(function(){ if (!gesture && document.activeElement === t) try { t.blur(); } catch (_) {} }, 0);
  }, true);
})();
