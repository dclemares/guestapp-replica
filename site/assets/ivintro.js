(function(){
'use strict';
/* Intro de la IV: "Takes about 2 minutes" en una píldora (como "Due before 25 Nov") y el aviso de privacidad como la nota del pasillo de registro. */

/* escritorio: «It only takes a minute» del panel derecho se sustituye por «Privacy protected» (con el aviso de la nota que había junto al CTA) */
var RAILDONE = false;
function swapRail(box){
  if (RAILDONE) return; var shield = box && box.querySelector('svg'); if (!shield) return;
  var t = [].slice.call(document.querySelectorAll('aside *')).filter(function(e){ return !e.children.length && /^\s*It only takes a minute\s*$/.test(e.textContent); })[0];
  if (!t) { setTimeout(function(){ swapRail(box); }, 250); return; }
  var d = t.nextElementSibling; t.textContent = 'Privacy protected'; if (d) d.textContent = 'Photos are encrypted, used only for this verification, and deleted afterwards per GDPR.';
  var ic = t.parentElement && t.parentElement.previousElementSibling; var old = ic && ic.querySelector('svg');
  if (!old) { var row = t.closest('div,li'); while (row && !row.querySelector('svg')) row = row.parentElement; old = row && row.querySelector('svg'); }
  if (old) { var n = shield.cloneNode(true); n.setAttribute('width', old.getAttribute('width') || 16); n.setAttribute('height', old.getAttribute('height') || 16); n.removeAttribute('class'); n.style.color = '#385bf8'; old.replaceWith(n); }
  /* «Privacy protected» pasa a ser el primer campo */
  try { var item = leaf_item(t), sec = item && item.parentNode, first = sec && sec.querySelector(':scope > div');
    if (item && first && first !== item) { sec.insertBefore(item, first);
    } } catch (e) {}
  RAILDONE = true; if (window.__railFit) { window.__railFit(); setTimeout(window.__railFit, 300); }
}
function leaf_item(t){ var e = t; while (e && !(e.tagName === 'DIV' && e.parentNode && e.parentNode.tagName === 'SECTION')) e = e.parentNode; return e; }
function run(){
  var pill = [].slice.call(document.querySelectorAll('span')).filter(function(e){ return /Takes about 2 minutes/.test(e.textContent) && !e.querySelector('span') && e.offsetParent; })[0];
  if (pill) pill.classList.add('ivi-pill');
  var st = [].slice.call(document.querySelectorAll('strong')).filter(function(e){ return /Privacy protected/.test(e.textContent); })[0];
  var box = st; while (box && !(box.tagName === 'DIV' && box.querySelector('svg'))) box = box.parentElement;
  var dock = document.querySelector('[data-slot="cta-dock"]');
  if (dock) dock.classList.add('ivi-dock');
  if (box) { box.classList.add('ivi-priv'); if (dock && box.parentNode !== dock) dock.appendChild(box); }
  /* escritorio: el CTA va justo debajo de la lista de pasos (no pegado al borde de la pantalla) y sin barra blanca */
  if (dock && window.matchMedia('(min-width:1025px)').matches) {
    var li0 = [].slice.call(document.querySelectorAll('li')).filter(function(l){ return /Scan your document/.test(l.textContent); })[0];
    var lst = li0 && li0.closest('ul,ol'), card = lst && lst.parentElement;
    if (card && card.parentNode && dock.previousElementSibling !== card) { card.parentNode.insertBefore(dock, card.nextSibling); dock.classList.add('ivi-dock-d'); }
    if (box) box.classList.add('ivi-priv-x');   /* la nota de privacidad pasa al «Good to know» del panel derecho */
    swapRail(box);
  }   /* la nota de privacidad queda como footer, bajo el CTA */
  /* "Skip for now" pasa de la barra superior a la derecha del título */
  var skip = [].slice.call(document.querySelectorAll('button')).filter(function(b){ return /^\s*Skip for now\s*$/.test(b.textContent) && b.offsetParent; })[0];
  var h1 = [].slice.call(document.querySelectorAll('h1')).filter(function(h){ return /Verify your/.test(h.textContent); })[0];
  if (skip && h1 && !h1.parentNode.contains(skip)) { var w = skip.parentElement && /ml-auto/.test(skip.parentElement.className) ? skip.parentElement : skip; w.classList.add('ivi-skip'); h1.parentNode.appendChild(w); }
  var t = [].slice.call(document.querySelectorAll('header span')).filter(function(e){ return /^\s*Registration\s*$/.test(e.textContent); })[0];
  if (t) t.textContent = 'Guest registration';
  /* solo documento: no hay paso de selfie */
  var DOCONLY = false; try { DOCONLY = localStorage.getItem('rep-ivm') === 'doc'; } catch (e) {}
  if (DOCONLY) {
    var li = [].slice.call(document.querySelectorAll('li')).filter(function(l){ return /Confirm it's you/.test(l.textContent); })[0];
    if (li) { var sib = li.nextElementSibling; li.parentNode.removeChild(li); if (sib) { var nm = [].slice.call(sib.querySelectorAll('span,div')).filter(function(x){ return !x.children.length && /^3$/.test(x.textContent.trim()); })[0]; if (nm) nm.textContent = '2'; } }
  }
  /* viene de «Register next guest»: la verificación es de otra persona (ng=1) */
  if (new URLSearchParams(location.search).get('ng') === '1') {
    var RP = [[/Verify your/, 'Verify the'], [/^identity$/, 'next guest'], [/Choose your document/, 'Choose their document'], [/Scan your document/, 'Scan their document'], [/Confirm it's you/, 'Confirm it\'s them'], [/your document photo/, 'their document photo'], [/Confirm your details/, 'Confirm their details'], [/your entry form's/, 'their entry form\'s'], [/Use your phone/, 'Use their phone']];
    var main = document.querySelector('main') || document.body, tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null), tn, ch = [];
    while ((tn = tw.nextNode())) { if (tn.parentElement && tn.parentElement.closest('aside, [data-slot="cta-dock"], .rep-sh, #rep-panel')) continue; ch.push(tn); }
    ch.forEach(function(t){ var s = t.nodeValue; RP.forEach(function(r){ s = s.replace(r[0], r[1]); }); if (s !== t.nodeValue) t.nodeValue = s; });
  }
  applySkip(); return !!(pill && box && dock);
}
/* el aviso de «Skip for now» y su ajuste viven en ivskip.js */
var SID = (window.__SCREEN && window.__SCREEN.id) || '', HUB = SID === 'iv-intro-h', DK = window.matchMedia('(min-width:1025px)').matches, X = DK ? 'd' : 'm', GO = HUB ? 'g2-ivh.' + X + '.html' : 'g2-ivf.' + X + '.html', SKIPTO = HUB ? 'hub-after-1.' + X + '.html' : (DK ? 'form-empty.d.html' : 'g2-form-empty.m.html');
function applySkip(){ var w = document.querySelector('.ivi-skip'); if (w) w.style.display = window.__ivSkip && window.__ivSkip.mode() === 'none' ? 'none' : ''; }
document.addEventListener('click', function(e){ var w = e.target.closest && e.target.closest('.ivi-skip'); if (!w) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); window.__ivSkip.open({ go: GO, to: SKIPTO }); }, true);
if (window.__ivSkip) window.__ivSkip.onChange(applySkip);
var n = 0; (function t(){ if (!run() && n++ < 20) setTimeout(t, 100); })();
})();
