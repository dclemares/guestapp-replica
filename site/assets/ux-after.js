/* Upselling v3 · versión «Vlad fb · email after paying» (d=…f4).
   Tras pagar en el carrito (Review & pay → tarjeta → 3D Secure → Order history ?from=pay), si no tenemos el email del huésped
   (Deal settings «Guest email unknown»), salta un mensaje para pedirlo. Hoja abajo en móvil, modal centrado en escritorio.
   Se inyecta solo en order-history.{m,d}.html (build.py). */
(function(){
'use strict';
var Q = new URLSearchParams(location.search);
if (Q.get('from') !== 'pay') return;
var d = Q.get('d'); if (!d) { try { d = sessionStorage.getItem('ux-d') || ''; } catch (e) { d = ''; } }
var cfg = {}, st = null; try { cfg = JSON.parse(sessionStorage.getItem('ux-cfg') || '{}') || {}; st = JSON.parse(sessionStorage.getItem('ux-state') || localStorage.getItem('ux-state') || 'null'); } catch (e) {}
/* todas las versiones f1–f4: el pago del carrito incluía los extras → los cobrados pasan a pagados y las solicitudes en cola, a enviadas */
var sentReq = st && st.req ? Object.keys(st.req).filter(function(k){ return st.req[k].st === 'queued'; }) : [];
var sentSnap = sentReq.map(function(k){ return { k: k, r: JSON.parse(JSON.stringify(st.req[k])) }; });
if (st && (sentReq.length || (st.cart || []).length)) { try { sentReq.forEach(function(k){ st.req[k].st = 'waiting'; st.req[k].at = 'Sent today'; }); st.paid = (st.paid || []).concat(st.cart || []); st.cart = []; sessionStorage.setItem('ux-state', JSON.stringify(st)); localStorage.setItem('ux-state', JSON.stringify(st)); } catch (e) {} }
if (!/\.f4$/.test(d || '') || !cfg._nomail || (st && st.mail)) return;
var desk = ((window.__SCREEN || {}).v === 'd');
/* las solicitudes que iban en el carrito (en cola) son las que acaban de salir con el pago */
var cat = {}; try { cat = JSON.parse(sessionStorage.getItem('ux-deals') || '{}') || {}; } catch (e) {}
var list = sentSnap.map(function(x){ return { t: (cat[x.k] || {}).t || x.k, img: (cat[x.k] || {}).img || '', sub: x.r.sub || '', amt: x.r.amt || 0 }; });
if (!list.length) list = [{ t: 'Wine tasting at sunset', img: (cat.wine || {}).img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=70&auto=format&fit=crop', sub: '2 people · Thu 26 Nov · 19:00', amt: 60 }];   /* vista directa desde flows.html */
var held = list.reduce(function(a, x){ return a + x.amt; }, 0);
var eur = function(n){ return (Math.round(n * 100) / 100).toString().replace('.', ',') + '€'; };
var esc = function(v){ return String(v).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var css = '.uxa-ov{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;font-family:Poppins,system-ui,sans-serif}'
  + '.uxa-dim{position:absolute;inset:0;background:rgba(22,22,67,.45);animation:uxaF .2s ease}'
  + '.uxa-sh{position:relative;width:100%;max-width:520px;padding:24px 20px calc(20px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#fff;color:#161643;text-align:left;animation:uxaU .28s cubic-bezier(.2,.9,.3,1)}'
  + '.uxa-ov.dk{align-items:center}.uxa-ov.dk .uxa-sh{width:420px;border-radius:24px;padding:28px}'
  + '.uxa-x{position:absolute;right:14px;top:14px;display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:50%;background:#f1f3fb;color:#161643;cursor:pointer}'
  + '.uxa-hd{display:flex;align-items:flex-start;gap:12px;padding-right:40px}'
  + '.uxa-ok{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#2ac273;color:#fff}'
  + '.uxa-hd{align-items:center!important}.uxa-sh h3{padding-top:0!important}'
  + '.uxa-sh .uxa-lt{margin:18px 0 4px;font-size:15px;font-weight:700;color:#161643}'
  + '.uxa-deals{display:flex;flex-direction:column;gap:8px;margin:16px 0 0}'
  + '.uxa-d{display:flex;align-items:center;gap:12px;padding:10px 12px 10px 10px;border-radius:16px;background:#f1f3fb}'
  + '.uxa-d img{flex:none;width:48px;height:48px;border-radius:12px;object-fit:cover}'
  + '.uxa-d span{flex:1;min-width:0}.uxa-d b{display:block;font-size:14.5px;font-weight:700;color:#161643;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '.uxa-d small{display:block;font-size:12.5px;color:#6b6b95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '.uxa-d em{flex:none;display:inline-flex;align-items:center;gap:4px;font-style:normal;font-size:12.5px;font-weight:600;color:#5b6383}'
  + '.uxa-sh h3{margin:0;padding-top:6px;font-size:19px;line-height:1.3;font-weight:700}.uxa-sh .uxa-hd+p{margin-top:12px}'
  + '.uxa-sh p{margin:0;font-size:14px;line-height:1.45;color:#6b6b95}'
  + '.uxa-lab{display:block;margin:18px 0 8px;font-size:15px;font-weight:700;color:#161643}'
  + '.uxa-in{width:100%;height:52px;padding:0 16px;border:0;border-radius:14px;background:#f1f3fb;color:#161643;font:500 16px Poppins,system-ui,sans-serif;box-sizing:border-box;outline:none}'
  + '.uxa-in:focus{background:#e8edff}'
  + '.uxa-sh .uxa-hint{margin-top:6px;font-size:12.5px}.uxa-sh .uxa-err{margin-top:6px;font-size:12.5px;color:#d6455d}'
  + '.uxa-go{width:100%;height:52px;margin-top:18px;border:0;border-radius:12px;background:#385bf8;color:#fff;font:700 15px Poppins,system-ui,sans-serif;cursor:pointer}'
  + '.uxa-toast{position:fixed;left:50%;bottom:28px;z-index:9999;transform:translateX(-50%);padding:12px 18px;border-radius:14px;background:#161643;color:#fff;font:600 13.5px Poppins,system-ui,sans-serif;white-space:nowrap}'
  + '@keyframes uxaF{from{opacity:0}}@keyframes uxaU{from{transform:translateY(40px);opacity:0}}';
var ic = function(p, s){ return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
function okMail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function show(){
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  var ov = document.createElement('div'); ov.className = 'uxa-ov' + (desk ? ' dk' : '');
  ov.innerHTML = '<div class="uxa-dim"></div><div class="uxa-sh" role="dialog" aria-modal="true" aria-labelledby="uxa-t">'
    + '<button type="button" class="uxa-x" aria-label="Close">' + ic('<path d="M18 6 6 18M6 6l12 12"/>', 16) + '</button>'
    + '<div class="uxa-hd"><span class="uxa-ok">' + ic('<path d="M20 6 9 17l-5-5"/>', 20) + '</span>'
    + '<h3 id="uxa-t">Payment completed successfully</h3></div>'
    + '<p class="uxa-lt">One last thing…</p>'
    + '<p>' + (list.length > 1 ? 'Your requests have been sent' : 'Your request has been sent') + '. We’re checking ' + (list.length > 1 ? 'them' : 'it') + ' now, and the ' + eur(held) + ' is only held on your card, not charged, until we confirm.</p>'
    + '<div class="uxa-deals">' + list.map(function(x){ return '<div class="uxa-d">' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '') + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.sub) + '</small></span><em>' + ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 13) + eur(x.amt) + ' held</em></div>'; }).join('') + '</div>'
    + '<label class="uxa-lab" for="uxa-in">Where should we send our answer?</label>'
    + '<input id="uxa-in" class="uxa-in" type="email" inputmode="email" autocomplete="email" placeholder="name@email.com">'
    + '<p class="uxa-hint">We don’t have your email yet. Only used for updates on ' + (list.length > 1 ? 'these requests' : 'this request') + '.</p><p class="uxa-err" hidden></p>'
    + '<button type="button" class="uxa-go">Save email</button></div>';
  document.body.appendChild(ov);
  var inp = ov.querySelector('#uxa-in'), err = ov.querySelector('.uxa-err'), hint = ov.querySelector('.uxa-hint');
  var close = function(){ ov.remove(); };
  ov.querySelector('.uxa-x').onclick = close;
  inp.addEventListener('input', function(){ err.hidden = true; hint.hidden = false; });
  var save = function(){ var v = inp.value.trim();
    if (!okMail(v)) { err.textContent = v ? 'Check the email, it looks incomplete.' : 'Add your email so we can send you our answer.'; err.hidden = false; hint.hidden = true; inp.focus(); return; }
    try { var s2 = JSON.parse(sessionStorage.getItem('ux-state') || 'null'); if (s2) { s2.mail = v; sessionStorage.setItem('ux-state', JSON.stringify(s2)); } } catch (e) {}
    close(); var t = document.createElement('div'); t.className = 'uxa-toast'; t.textContent = 'We’ll email our answer to ' + v; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); };
  ov.querySelector('.uxa-go').onclick = save;
  inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') save(); });
  setTimeout(function(){ try { inp.focus({ preventScroll: true }); } catch (e) {} }, 300);
}
setTimeout(show, 1400);   /* después de que se pinten los recibos recién generados */
})();
