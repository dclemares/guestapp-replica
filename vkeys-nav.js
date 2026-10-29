/* «Virtual keys» en «Your stay» (barra lateral de escritorio y menú móvil): lleva a la pantalla de llaves (keys.*.html, ver access.js). */
(function(){
'use strict';
var LS = { get: function(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } } };
var KEY_SVG = '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.500 6.500 0 1 0-4-4z"></path><circle cx="16.500" cy="7.500" r=".500" fill="currentColor"></circle>';
var desk = /\.d\.html/.test(location.pathname);
var isKeys = window.__SCREEN && window.__SCREEN.id === 'keys';
function raOn(){ return LS.get('replica-remote-access', '1') !== '0'; }
function add(){
  [].forEach.call(document.querySelectorAll('[data-sidebar="group"]'), function(g){
    var lab = g.querySelector('[data-sidebar="group-label"]'); if (!lab || lab.textContent.trim() !== 'Your stay' || g.querySelector('[data-vkeys]')) return;
    var ref = [].filter.call(g.querySelectorAll('[data-sidebar="menu-button"]'), function(b){ return /Recommendations/.test(b.textContent); })[0]; if (!ref) return;
    var li = ref.closest('li').cloneNode(true), b = li.querySelector('[data-sidebar="menu-button"]');
    li.setAttribute('data-vkeys', ''); b.setAttribute('data-active', isKeys ? 'true' : 'false'); b.removeAttribute('aria-current'); b.removeAttribute('href');
    var sv = b.querySelector('svg'); if (sv) { sv.setAttribute('class', String(sv.getAttribute('class') || '').replace(/lucide-[\w-]+/g, '') + ' lucide-key-round'); sv.innerHTML = KEY_SVG; }
    var walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, null), n;
    while ((n = walker.nextNode())) if (/Recommendations/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace('Recommendations', 'Virtual keys');
    b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (!isKeys) location.href = 'keys' + (desk ? '.d.html' : '.m.html') + location.search; }, true);
    ref.closest('li').parentNode.insertBefore(li, ref.closest('li'));
  });
  paint();
}
function paint(){ [].forEach.call(document.querySelectorAll('[data-vkeys]'), function(li){ li.style.display = raOn() ? '' : 'none'; }); }
window.addEventListener('replica-ra-change', paint);
function init(){ add(); try { new MutationObserver(function(){ if (document.querySelector('[data-sidebar="group"]') && !document.querySelector('[data-vkeys]')) add(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
