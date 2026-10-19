(function(){
'use strict';
/* Skip de la verificación (compartido por las pantallas de intro y el flujo): 'req' obligatoria (aviso «Skip verification?») · 'opt' opcional (aviso «Verify later?») · 'none' sin skip. Se recuerda (?sk=). */
var Q = new URLSearchParams(location.search), SK = Q.get('sk');
try { if (['req', 'opt', 'none'].indexOf(SK) >= 0) localStorage.setItem('rep-ivs', SK); else SK = localStorage.getItem('rep-ivs'); } catch (e) {}
if (['req', 'opt', 'none'].indexOf(SK) < 0) SK = 'req';
var listeners = [];
function open(o){
  var req = SK === 'req', ov = document.createElement('div'); ov.className = 'ivs-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  var cont = '<button type="button" class="ivs-b pri" data-r="go">Continue verification</button>', skp = '<button type="button" class="ivs-b sec" data-r="skip">Skip for now</button>';
  ov.innerHTML = '<div class="ivs-sh"><i class="ivs-gr"></i><h2>' + (req ? 'Skip verification?' : 'Verify later?') + '</h2><p>' + (req ? 'You\'ll need to verify your identity later to complete your registration.' : 'Identity verification is optional for your stay. You can skip it and carry on with your registration.') + (o.progress ? ' The photos you\'ve taken so far and all the progress you\'ve made will be lost.' : '') + '</p><div class="ivs-act">' + (req ? skp + cont : cont + skp) + '</div></div>';
  document.body.appendChild(ov); requestAnimationFrame(function(){ ov.classList.add('in'); });
  function close(){ ov.classList.remove('in'); setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200); }
  ov.addEventListener('click', function(e){ e.stopPropagation(); var b = e.target.closest('[data-r]'); if (b) { if (b.getAttribute('data-r') === 'go') { if (o.go) location.href = o.go; else close(); } else location.href = o.to; return; } if (e.target === ov) close(); });
  document.addEventListener('keydown', function k(e){ if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
}
window.__ivSkip = { open: open, mode: function(){ return SK; }, onChange: function(f){ listeners.push(f); } };

(function(){ var o = [['req', 'Obligatoria'], ['opt', 'Opcional'], ['none', 'Sin skip']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === SK ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); SK = b.getAttribute('data-v'); try { localStorage.setItem('rep-ivs', SK); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); listeners.forEach(function(f){ f(SK); }); });
  /* control de la pantalla (Vista), solo en las pantallas de verificación de identidad: no es un ajuste de la reserva */
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Skip de la verificación', d, 45); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
})();
