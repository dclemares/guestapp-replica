(function(){
'use strict';
/* Formulario de huésped: estructura original (escaneo + secciones), campos en dos columnas y título de sección fuera de la tarjeta (versión final).
   Opciones por URL: ?af=0 sin escaneo · ?sg=draw firma dibujada · ?ag=1 acuerdos con casillas · ?ct=1 con contrato. */
var secs = [].slice.call(document.querySelectorAll('section[data-slot="form-section"]')); if (!secs.length) return;
var Q = new URLSearchParams(location.search), V = (window.__SCREEN && window.__SCREEN.v) || 'm';
var FH = Q.get('fh'); if (['1', '2', '3', 'orig'].indexOf(FH) < 0) FH = '1';
var AF = Q.get('af') !== '0', SG = Q.get('sg') === 'draw', AG = Q.get('ag') === '1', CT = Q.get('ct') === '1';
var html = document.documentElement; html.setAttribute('data-fh', FH); var OB = Q.get('ob'); if (['0', '1', '2'].indexOf(OB) < 0) OB = '2';   /* definitivo: chip en la esquina inferior derecha (las otras solo por URL) */ html.setAttribute('data-ob', OB); html.setAttribute('data-af', AF ? '1' : '0');
secs.forEach(function(s){ if (s.querySelector('[data-field]')) s.setAttribute('data-ffk', ''); });   /* solo las secciones con campos */
['nationality', 'second_surname', 'document_type', 'document_number', 'email', 'phone'].forEach(function(n){ var f = document.querySelector('[data-field="' + n + '"]'); if (f) f.classList.add('ff-wide'); });
function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }

/* el botón de envío va al final del formulario (ya no está fijo) y un botón flotante lleva hasta él */
html.setAttribute('data-fdock', '1');
var dock = [].filter.call(document.querySelectorAll('[data-slot="cta-dock"]'), function(d){ return d.querySelector('button') && /Submit/.test(d.textContent); })[0];
if (dock) {
  var go = document.createElement('button'); go.type = 'button'; go.className = 'fx-go'; go.setAttribute('aria-label', 'Go to submit information');
  go.innerHTML = ic('<path d="m6 9 6 6 6-6"/>', 18) + '<span>Go to submit information</span>'; document.body.appendChild(go);
  var raf = 0, upd = function(){ raf = 0; var r = dock.getBoundingClientRect(); go.classList.toggle('on', r.top > window.innerHeight - 8); };
  var q = function(){ if (!raf) raf = requestAnimationFrame(upd); };
  window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', q); document.addEventListener('input', q, true); document.addEventListener('change', q, true); setTimeout(q, 150); q();
  go.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); dock.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' }); }, true);
}
/* los campos opcionales llevan el chip "OPT." (el mismo de los acuerdos) */
[].forEach.call(document.querySelectorAll('[data-field] *'), function(o){ if (!o.children.length && /^\s*Optional\s*$/i.test(o.textContent)) { o.textContent = 'OPT.'; o.classList.add('fx-optchip'); } });

/* "Complete registration": lleva siempre al pasillo de registro (no se valida; el prototipo deja registrar con datos a medias) */
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-slot="cta-dock"] button'); if (!b || !/Complete registration/.test(b.textContent)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (window.__ffGate && window.__ffGate()) return;
  function val(n){ var f = document.querySelector('[data-field="' + n + '"]'); if (!f) return ''; var h = f.querySelector('input[type=hidden]'); if (h && h.value) return h.value; var i = f.querySelector('input.input__control'); if (i && i.value) return i.value.trim(); var sp = f.querySelector('button span'); return sp ? sp.textContent.trim() : ''; }
  var nm = (val('name') + ' ' + val('surname')).trim();
  var to = 'g2-registering.' + V + '.html' + (nm || Q.get('sr') === 'fail' ? '?' : '') + (nm ? 'gn=' + encodeURIComponent(nm) : '') + (Q.get('sr') === 'fail' ? (nm ? '&' : '') + 'sr=fail' : '');
  location.href = to;
}, true);
/* botón de envío: "Submit to host" */
[].forEach.call(document.querySelectorAll('[data-slot="cta-dock"] button'), function(b){ if (/^\s*Submit\s*$/.test(b.textContent)) b.textContent = 'Complete registration'; });

/* firma y acuerdos */
var agreements = secs.filter(function(s){ return !s.hasAttribute('data-ffk') && /agreements/i.test((s.querySelector('[data-slot="form-section-header"]') || {}).textContent || ''); })[0];
if (agreements && (SG || AG || CT)) {
  agreements.style.display = 'none';
  var host = agreements.parentNode, after = agreements, built = [];
  if (SG) {
    var sig = document.createElement('div'); sig.className = 'fx-sec';
    sig.innerHTML = '<h3 class="fx-t">Signature</h3><div class="fx-card"><div class="fx-pad" role="img" aria-label="Signature area. ' + (V === 'd' ? 'Use your mouse' : 'Use your finger') + ' to sign."><canvas></canvas><div class="fx-ph">' + ic('<path d="M3 17c3-6 4-10 6-10s-1 9 2 9 2-5 4-5 1 3 3 3 2-2 3-2"/>', 22) + '<b>Draw your signature</b><span>' + (V === 'd' ? 'Use your mouse' : 'Use your finger') + '</span></div></div><div class="fx-row"><button type="button" class="fx-clear" disabled>' + ic('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>', 16) + '<span>Clear</span></button></div></div>';
    built.push(sig);
  }
  var ag = document.createElement('div'); ag.className = 'fx-sec';
  var items = '';
  if (AG && CT) items += '<li><label class="fx-ck"><input type="checkbox"><i></i><span>Send me a copy of the <b>contract</b> by email.</span></label></li>';
  if (AG) items += '<li><label class="fx-ck"><input type="checkbox"><i></i><span><em class="fx-opt">OPT.</em> Receive marketing communications from the host.</span></label></li>';
  var legal = SG ? ('By submitting you accept ' + (CT ? 'the <a href="#">Contract</a> and our <a href="#">Privacy Policy</a>' : 'our <a href="#">Privacy Policy</a>') + '.')
                 : ('By clicking ‘Complete registration’ you accept to sign the form with your name' + (CT ? ', the <a href="#">Contract</a>' : '') + ' and the <a href="#">Privacy Policy</a>.');
  ag.innerHTML = '<h3 class="fx-t">Agreements</h3><div class="fx-card">' + (items ? '<ul class="fx-list">' + items + '</ul>' : '') + '<p class="fx-legal">' + legal + '</p></div>';
  built.push(ag);
  built.forEach(function(n){ host.insertBefore(n, after.nextSibling); after = n; });
  /* lienzo de la firma */
  var cv = document.querySelector('.fx-pad canvas');
  if (cv) {
    var pad = cv.parentNode, ph = pad.querySelector('.fx-ph'), clr = document.querySelector('.fx-clear'), ctx = cv.getContext('2d'), drawing = false, inked = false;
    var fit = function(){ var r = pad.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.scale(d, d); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#161643'; };
    fit(); window.addEventListener('resize', function(){ if (!inked) fit(); });
    var pt = function(e){ var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', function(e){ drawing = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} var p = pt(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + .01, p[1]); ctx.stroke(); if (!inked) { inked = true; ph.style.display = 'none'; clr.disabled = false; } e.preventDefault(); });
    cv.addEventListener('pointermove', function(e){ if (!drawing) return; var p = pt(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(t){ cv.addEventListener(t, function(){ drawing = false; }); });
    clr.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); var d = window.devicePixelRatio || 1; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); inked = false; ph.style.display = ''; clr.disabled = true; });
  }
}

/* el texto legal original también nombra el botón: Submit pasa a Complete registration */
if (agreements) { var tw = document.createTreeWalker(agreements, NodeFilter.SHOW_TEXT, null), tn, tl = []; while ((tn = tw.nextNode())) { if (/\bSubmit\b/.test(tn.nodeValue)) tl.push(tn); } tl.forEach(function(t){ t.nodeValue = t.nodeValue.replace(/\bSubmit\b/g, 'Complete registration'); }); }

/* escaneo: tres variantes de aspecto (?as=1 banner · 2 fila punteada · 3 fila con botón); sin ?as= es la original */
var AS = Q.get('as'); if (['0', '1', '2', '3'].indexOf(AS) < 0) AS = '1';   /* definitivo: banner azul oscuro (1); las demás solo por URL */
html.setAttribute('data-as', AS);
var card = document.querySelector('.auto-fill-card');
if (card && AS !== '0' && AF) {
  var ttl = (card.querySelector('.auto-fill-card__title') || {}).textContent || 'Scan document to autofill', sub = (card.querySelector('.auto-fill-card__subtitle') || {}).textContent || 'Scan a passport or identity card to automatically fill in details.';
  /* con verificación de identidad requerida (y sin venir ya de ella) el escaneo se sustituye por la verificación, que rellena el formulario al terminar */
  var IVREQ = (function(){ if (Q.get('ivd') === '1') return false; var q = Q.get('iv'); if (q === '0' || q === '1') return q === '1'; try { return localStorage.getItem('rep-iv') !== '0'; } catch (e) { return true; } })();
  var btnTxt = 'Scan document';
  if (IVREQ) { ttl = 'Verify your identity to fill in your details'; sub = 'You\'ll go through a quick identity verification, and we\'ll use it to fill in this form for you once it\'s finished.'; btnTxt = 'Start verification'; }
  var I_SC = ic('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>', 22);
  var el = document.createElement('div'); el.className = 'as as' + AS; el.setAttribute('data-as-go', '');
  if (AS === '1') el.innerHTML = '<div class="as-t"><b>' + ttl + '</b><span>' + sub + '</span></div><button type="button" class="as-btn">' + ic('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>', 18) + '<span>' + btnTxt + '</span></button>';
  if (AS === '2') el.innerHTML = '<button type="button" class="as-row">' + I_SC + '<b>' + ttl + '</b><span>' + sub + '</span></button>';
  if (AS === '3') el.innerHTML = '<span class="as-ic">' + I_SC + '</span><div class="as-t"><b>' + ttl + '</b><span>' + sub + '</span></div><button type="button" class="as-btn">Scan</button>';
  card.parentNode.insertBefore(el, card); card.style.display = 'none';
  el.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (!IVREQ && window.__afOpen) { window.__afOpen(el); return; } var to = IVREQ ? 'iv-intro-f' : 'scan-1-country', qs = IVREQ ? '?bk=form' : '', u = to + '.' + V + '.html' + qs;   /* bk=form: la intro de la verificación vuelve a este formulario */ if (V === 'd') { fetch(u, { method: 'HEAD' }).then(function(res){ location.href = res.ok ? u : to + '.m.html' + qs; }, function(){ location.href = u; }); } else location.href = u; }, true);
  if (AS === '1' || AS === '3') el.tabIndex = -1;
  el.setAttribute('role', 'group');
}

/* controles */
function group(title, order, opts, cur, param, off){
  var d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = opts.map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var p = new URLSearchParams(location.search); var v = b.getAttribute('data-v'); if (v === off) p.delete(param); else p.set(param, v); location.search = p.toString(); }, true);
  return [title, d, order];
}

/* ---------- validación simulada: campos que faltan o con datos erróneos (?ve=missing|wrong|both) ---------- */
var VE = Q.get('ve'); if (['missing', 'wrong', 'both'].indexOf(VE) < 0) VE = 'off';
var REQ = ['nationality', 'name', 'surname', 'birth_date', 'gender', 'document_type', 'document_number'];
function vf(n){ return document.querySelector('[data-field="' + n + '"]'); }
function vval(n){ var f = vf(n); if (!f) return ''; var h = f.querySelector('input[type=hidden]'); if (h && h.value) return h.value; var i = f.querySelector('input.input__control'); if (i && i.value) return i.value.trim(); var sp = f.querySelector('button span'); return sp ? sp.textContent.trim() : ''; }
function clearInvalid(f){
  f.removeAttribute('data-severity'); f.style.removeProperty('--field-border-invalid'); f.style.removeProperty('--error-message-color');
  var p = f.querySelector('p[data-vmsg]'); if (p) p.parentNode.removeChild(p);
  [].forEach.call(f.querySelectorAll('[aria-invalid="true"]'), function(e){ e.setAttribute('aria-invalid', 'false'); });
  [].forEach.call(f.querySelectorAll('.input--invalid'), function(e){ e.classList.remove('input--invalid'); });
  [].forEach.call(f.querySelectorAll('fieldset'), function(e){ var c = e.getAttribute('class') || ''; e.setAttribute('class', c.replace('border-[var(--field-border-invalid)]', 'border-[var(--field-border)]')); });
}
function markInvalid(n, msg, sev){
  var f = vf(n); if (!f) return; clearInvalid(f);
  var warn = sev === 'warning';
  f.setAttribute('data-severity', sev); f.style.setProperty('--field-border-invalid', warn ? 'var(--chekin-amber-500,#f5a524)' : '#e5565b'); f.style.setProperty('--error-message-color', warn ? 'var(--chekin-amber-700,#a05a00)' : '#c0392b');
  [].forEach.call(f.querySelectorAll('[aria-invalid]'), function(e){ e.setAttribute('aria-invalid', 'true'); });
  var wrap = f.querySelector('[data-field-name]'); if (wrap && /\binput\b/.test(wrap.getAttribute('class') || '')) wrap.classList.add('input--invalid');
  [].forEach.call(f.querySelectorAll('fieldset'), function(e){ var c = e.getAttribute('class') || ''; e.setAttribute('class', c.replace('border-[var(--field-border)]', 'border-[var(--field-border-invalid)]')); });
  var pp = document.createElement('p'); pp.setAttribute('data-vmsg', ''); pp.setAttribute('role', 'alert'); pp.className = 'flex items-center gap-1 font-medium text-[var(--error-message-color)] mt-[1px] text-[14px]';
  pp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--error-message-color)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] shrink-0 text-white" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><span>' + msg + '</span>';
  (wrap || f).appendChild(pp);
}
var WRONG = { document_number: ['AB12', 'This document number doesn\'t look valid'], email: ['lucia@', 'Enter a valid email address'], phone: ['12', 'Enter a valid phone number'], birth_date: ['9 June 2031', 'Birth date can\'t be in the future'] };
function raiseF(f){
  [].slice.call(f.querySelectorAll('*')).forEach(function(el){
    var c = el.getAttribute('class'); if (!c) return; var o = c;
    c = c.replace(/var\(--field-label-top\)/g, 'var(--field-label-raised-top)').replace(/var\(--field-label-font-size\)/g, 'var(--field-label-raised-font-size)').replace(/var\(--field-label-font-weight\)/g, 'var(--field-label-raised-font-weight)').replace(/max-w-\[0\.01px\]/g, 'max-w-full !duration-100 !delay-[50ms]').replace(/var\(--empty-field-background\)/g, 'var(--field-background)');
    if (el.tagName === 'BUTTON') c = c.replace('text-[var(--chekin-color-gray-1)]', 'text-[var(--chekin-color-brand-navy)]');
    if (el.tagName === 'INPUT' && el.type === 'text' && c.indexOf('brand-navy') < 0) c = c.replace('leading-5', 'leading-5 text-[var(--chekin-color-brand-navy)]');
    c = c.replace(/\binput--empty\b/, '').replace(/\s+/g, ' ').trim(); if (c !== o) el.setAttribute('class', c);
    if (el.tagName === 'LABEL' && el.parentNode && !/!px-1/.test(el.parentNode.getAttribute('class') || '')) el.parentNode.setAttribute('class', el.parentNode.getAttribute('class') + ' !px-1');
  });
}
function setWrongValue(n, v){
  var f = vf(n); if (!f) return; var i = f.querySelector('input.input__control') || f.querySelector('input[type=tel],input[type=text]'); if (i && !i.value) { i.value = v; i.setAttribute('value', v); raiseF(f); return; }
  var sp = f.querySelector('button span'); if (sp && !sp.textContent.trim()) { sp.textContent = v; raiseF(f); }
}
function validate(){
  if (VE === 'off') return 0;
  var bad = 0;
  Object.keys(WRONG).forEach(function(n){ var f = vf(n); if (f) clearInvalid(f); });
  REQ.forEach(function(n){ var f = vf(n); if (f) clearInvalid(f); });
  if (VE === 'wrong' || VE === 'both') Object.keys(WRONG).forEach(function(n){ var cur = vval(n); if (!cur) { setWrongValue(n, WRONG[n][0]); cur = WRONG[n][0]; } if (cur === WRONG[n][0]) { markInvalid(n, WRONG[n][1], 'error'); bad++; } });   /* con un dato corregido (p. ej. tras el autofill) el error desaparece */
  if (VE === 'missing' || VE === 'both') REQ.forEach(function(n){ if (!vval(n)) { markInvalid(n, 'This field is required', 'warning'); bad++; } });
  return bad;
}
window.__ffValidate = validate;
var vT = 0; function vSoon(){ if (VE === 'off') return; clearTimeout(vT); vT = setTimeout(function(){ if (VE !== 'off') validate(); }, 250); }   /* en "faltan" los avisos desaparecen al rellenar el campo */
document.addEventListener('input', vSoon, true);
setTimeout(validate, 60);
function vSheet(wrong){
  if (document.querySelector('.fx-vsheet')) return;
  var el = document.createElement('div'); el.className = 'fx-vsheet';
  el.innerHTML = '<div class="fx-vbd" data-vclose></div><div class="fx-vp" role="alertdialog" aria-modal="true"><i class="fx-vg"></i><h2>' + (wrong ? 'Please check your details' : 'Incomplete Personal Data') + '</h2><p>' + (wrong ? 'Some of the information you entered doesn\'t look right. Correct the highlighted fields to continue.' : 'Please complete all the required data before continuing.') + '</p><button type="button" data-vclose>OK</button></div>';
  document.body.appendChild(el); requestAnimationFrame(function(){ el.classList.add('in'); });
  el.addEventListener('click', function(e){ if (e.target.closest('[data-vclose]')) { e.preventDefault(); e.stopPropagation(); el.parentNode.removeChild(el); var first = document.querySelector('[data-severity]'); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, true);
}
window.__ffGate = function(){ if (VE === 'off') return false; var bad = validate(); if (bad) { vSheet(VE === 'wrong'); return true; } return false; };

/* ---------- tooltips en campos (mismo estilo que el chip OPT., en la esquina superior derecha para que puedan convivir) ---------- */
var TT = Q.get('tt') !== '0';
var OPC = Q.get('op') !== '0'; document.documentElement.setAttribute('data-op', OPC ? '1' : '0');   /* chips OPT. de los campos opcionales */
var TIPS = {
  document_number: ['Document number: where do I find it?', 'On an ID card it is the code printed on the front (for a Spanish DNI, 8 digits and a letter). On a passport, look on the photo page next to "Passport no.".'],
  second_surname: ['Second surname: do I need it?', 'Some documents list two surnames. Add the second one only if yours does; otherwise leave it empty.'],
  email: ['Email: why do we ask?', 'We only use it to send you the confirmation of your registration and the access details of your stay.']
};
if (TT) Object.keys(TIPS).forEach(function(n){
  var f = document.querySelector('[data-field="' + n + '"]'); if (!f) return;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-tip'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'More information about ' + n.replace('_', ' '));
  b.innerHTML = ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/>', 12) + '<span>INFO</span>';
  var tip = document.createElement('div'); tip.className = 'fx-tipb'; tip.setAttribute('role', 'tooltip'); tip.id = 'fx-tip-' + n; tip.hidden = true;
  tip.innerHTML = '<b>' + TIPS[n][0] + '</b><span>' + TIPS[n][1] + '</span>'; b.setAttribute('aria-describedby', tip.id);
  f.appendChild(b); f.appendChild(tip);
  b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if (window.innerWidth < 700) { tipSheet(n); return; } var open = tip.hidden; closeTips(); if (open) { tip.hidden = false; b.setAttribute('aria-expanded', 'true'); b.classList.add('on'); } });   /* móvil: modal · escritorio: burbuja */
});
function tipSheet(n){
  if (document.querySelector('.fx-isheet')) return;
  var el = document.createElement('div'); el.className = 'fx-isheet';
  el.innerHTML = '<div class="fx-vbd" data-iclose></div><div class="fx-vp" role="dialog" aria-modal="true" aria-label="' + TIPS[n][0] + '"><i class="fx-vg"></i><h2>' + TIPS[n][0] + '</h2><p>' + TIPS[n][1] + '</p><button type="button" data-iclose>Got it</button></div>';
  document.body.appendChild(el); requestAnimationFrame(function(){ el.classList.add('in'); });
  el.addEventListener('click', function(e){ if (e.target.closest('[data-iclose]')) { e.preventDefault(); e.stopPropagation(); el.classList.remove('in'); setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 220); } }, true);
}
function closeTips(){ [].forEach.call(document.querySelectorAll('.fx-tipb'), function(t){ t.hidden = true; }); [].forEach.call(document.querySelectorAll('.fx-tip'), function(b){ b.setAttribute('aria-expanded', 'false'); b.classList.remove('on'); }); }
document.addEventListener('click', function(e){ if (!e.target.closest('.fx-tip,.fx-tipb')) closeTips(); }, true);
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeTips(); });
try { if (Q.get('iv') === '0' || Q.get('iv') === '1') localStorage.setItem('rep-iv', Q.get('iv')); } catch (e) {}
var IVON = (function(){ var q = Q.get('iv'); if (q === '0' || q === '1') return q === '1'; try { return localStorage.getItem('rep-iv') !== '0'; } catch (e) { return true; } })();
var rows = [group('Autofill', 45, [['1', 'Con autofill'], ['0', 'Sin autofill']], AF ? '1' : '0', 'af', '1'),
  group('Firma', 46, [['auto', 'Automática'], ['draw', 'Dibujada']], SG ? 'draw' : 'auto', 'sg', 'auto'),
  group('Acuerdos', 47, [['0', 'Solo texto'], ['1', 'Con casillas']], AG ? '1' : '0', 'ag', '0'),
  group('Contrato', 48, [['0', 'Sin contrato'], ['1', 'Con contrato']], CT ? '1' : '0', 'ct', '0'),
  group('Opcionales (OPT.)', 49, [['1', 'Con OPT.'], ['0', 'Sin OPT.']], OPC ? '1' : '0', 'op', '1'),
  group('Info (tooltips)', 50, [['1', 'Con info'], ['0', 'Sin info']], TT ? '1' : '0', 'tt', '1'),
  group('Validación', 51, [['off', 'Sin validar'], ['missing', 'Faltan campos'], ['wrong', 'Dato erróneo'], ['both', 'Ambos']], VE, 've', 'off'),
  group('Resultado del envío', 52, [['ok', 'Éxito'], ['fail', 'Fallo']], Q.get('sr') === 'fail' ? 'fail' : 'ok', 'sr', 'ok')];
function init(){ rows.forEach(function(r){ if (window.__repPanel) window.__repPanel.add(r[0], r[1], r[2]); else document.body.appendChild(r[1]); }); }
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

/* panel de Vela del formulario: se quita «Quick actions» (no hay nada que compartir), «Why we ask for your data» abre su explicación y se añaden más «Good to know» */
(function(){
var asd = document.querySelector('aside[data-slot="assistant-panel"]'); if (!asd) return;
var secs0 = [].slice.call(asd.querySelectorAll(':scope > section'));
secs0.forEach(function(s){ var h = s.querySelector(':scope > span'); if (h && /Quick actions/i.test(h.textContent)) s.parentNode.removeChild(s); });
var CT = false, CC = true; try { CT = localStorage.getItem('replica-comp-trad') === '1' && localStorage.getItem('replica-comp-chat') === '0'; CC = !CT; } catch (e) {}
var V2 = false, V3 = false, V4 = CC;   /* el chat es siempre el final (antes V5) */
var sec = [].filter.call(asd.querySelectorAll(':scope > section'), function(s){ var h = s.querySelector(':scope > span'); return h && /Good to know/i.test(h.textContent); })[0]; if (!sec) return;
var btn = sec.querySelector(':scope > button'); if (!btn) return;
var row = btn.firstElementChild;   /* la fila con el icono y el texto */
function mk(ico, ttl, txt){ var d = document.createElement('div'); d.className = 'fx-gtk fx-x'; var r = row.cloneNode(true); r.querySelector('span svg').outerHTML = ic(ico, 16); r.querySelector('strong').textContent = ttl; r.querySelector('strong + span').textContent = txt; d.appendChild(r); return d; }
var more = [
  ['<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>', 'Write it as on your document', 'Names, number and dates should match your ID or passport exactly.'],
  ['<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>', 'Optional fields', 'Fields marked OPT. can be left empty.'],
  ['<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 'Review before you submit', 'If something is missing or wrong, we\'ll highlight it so you can fix it.'],
  ['<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 'Your data is safe', 'We handle your details securely and in line with GDPR.']
];
var hasOpt = (document.documentElement.getAttribute('data-op') !== '0') && !!document.querySelector('.fx-optchip, .fx-opt'); more = more.filter(function(m){ return m[1] !== 'Optional fields' || hasOpt; });   /* «Optional fields» solo si el formulario tiene campos opcionales */
var PRI = ['Your data is safe', 'Optional fields', 'Write it as on your document', 'Review before you submit'];   /* de más a menos importante: si no cabe, se quitan desde el final */
more.sort(function(x, y){ return PRI.indexOf(x[1]) - PRI.indexOf(y[1]); });
if (CC) more = [];   /* con el chat, los consejos de «Good to know» pasan a ser preguntas de «Ask Vela» (y la sección se oculta) */
more.forEach(function(m){ sec.appendChild(mk(m[0], m[1], m[2])); });
/* icono de «Why we ask for your data» */
var bi = btn.querySelector('span svg'); if (bi) bi.outerHTML = ic('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', 16);
/* «Why we ask for your data» pasa a su propia sección, encima de «Good to know» */
var sw = sec.cloneNode(false), hw = sec.querySelector(':scope > span').cloneNode(true); sw.classList.add('fx-wsec'); hw.textContent = 'Ask Vela'; sw.appendChild(hw);
/* «Your data» (tradicional): el botón «Why we ask for your data» abre la ventana de explicación. Si no se usa, queda oculto y solo sirve de plantilla de fila */
var st = sec.cloneNode(false), ht = sec.querySelector(':scope > span').cloneNode(true); st.classList.add('fx-tsec'); ht.textContent = 'Your data'; st.appendChild(ht); st.appendChild(btn);
if (!CT) { btn.style.display = 'none'; st.style.display = 'none'; }
btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); why(); });
/* orden: Ask Vela (chat) · Your data (tradicional) · Good to know */
var ref0 = sec; if (CT) sec.parentNode.insertBefore(st, ref0); else sec.parentNode.insertBefore(st, ref0);
if (CC) sec.parentNode.insertBefore(sw, st);
/* «Ask Vela» con el estilo Q2 del resumen: una sola respuesta a la vista (pregunta en burbuja azul, Vela «escribiendo…» y respuesta en burbuja gris) y las preguntas debajo, una por fila */
(function(){
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPK = '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>';
  var av = '<span class="vc-av">' + ic(SPK, 12) + '</span>';
  var QS = [
    { p: 100, t: 'Why do you ask for my data?', a: 'As required by local law, all tourist accommodations must keep a record of their guests, so we need a small amount of personal information from you. Completing it online before you arrive will save you time.' },
    { p: 90, t: 'Is my data safe?', a: 'We handle all personal data in line with the General Data Protection Regulation (GDPR). To learn more, please read our privacy policy.<a class="fx-pp" href="#">Read our Privacy Policy</a>' },
    { p: 80, t: 'How should I write my details?', a: 'Names, number and dates should match your ID or passport exactly.' }
  ];
  if (hasOpt) QS.push({ p: 70, t: 'Which fields are optional?', a: 'Fields marked OPT. can be left empty.' });
  QS.push({ p: 60, t: 'What if I make a mistake?', a: 'If something is missing or wrong, we’ll highlight it so you can fix it.' });
  QS.sort(function(x, y){ return y.p - x.p; }); QS = QS.slice(0, 5);   /* como mucho cinco preguntas */
  var DOTS = '<span class="pc-dots"><i></i><i></i><i></i></span>';
  var xch = function(i, typing){ var x = document.createElement('div'); x.className = 'pc-x'; x.innerHTML = '<div class="vc-q">' + QS[i].t + '</div><div class="vc-a">' + av + '<div class="ty' + (typing ? ' on' : '') + '">' + DOTS + '<span class="ty-t">' + QS[i].a + '</span></div></div>'; return x; };
  if (!CC) return;
  var cw = document.createElement('div'); cw.className = 'pq2';
  var chipsHtml = '<div class="pq-ch">' + QS.map(function(o, i){ return '<button type="button" class="vc-chip" data-ask="' + i + '">' + o.t + '</button>'; }).join('') + '</div>';
  var ex, host, ppClick = function(e){ if (e.target.closest('.fx-pp')) { e.preventDefault(); e.stopPropagation(); return true; } return false; };
  if (V2) {
    /* Chat V2: «Ask Vela» con las preguntas sugeridas arriba y, debajo, «Vela answer» con la pregunta y la respuesta */
    cw.innerHTML = chipsHtml; sw.appendChild(cw);
    var sw2 = sw.cloneNode(false), h2 = hw.cloneNode(true); h2.textContent = 'Vela answer'; h2.classList.add('vx-noacc'); sw2.appendChild(h2); hw.textContent = 'Suggested questions';
    ex = document.createElement('div'); ex.className = 'pq2-ex'; ex.setAttribute('aria-live', 'polite'); sw2.appendChild(ex); host = sw2;
    sw.parentNode.insertBefore(sw2, sw.nextSibling);
    sw2.addEventListener('click', ppClick);
  } else {
    cw.innerHTML = '<div class="pq2-ex" aria-live="polite"></div><span class="vc-lb">Suggested</span>' + chipsHtml; sw.appendChild(cw);
    ex = cw.querySelector('.pq2-ex'); host = cw;
  }
  var cur = -1;
  var size = function(){ if (V4) { ex.style.minHeight = ''; return; }
    var m = document.createElement('div'); m.className = 'pq2-ex'; m.style.cssText = 'position:absolute;visibility:hidden;left:0;right:0;min-height:0'; host.appendChild(m); var h = 0; QS.forEach(function(o, i){ m.innerHTML = ''; m.appendChild(xch(i, false)); h = Math.max(h, m.offsetHeight); }); host.removeChild(m); ex.style.minHeight = h + 'px'; };
  var show = function(i, first){ cur = i; ex.innerHTML = ''; var x = xch(i, !first); ex.appendChild(x); var t = x.querySelector('.ty.on'); if (t) { if (window.__velaLoad) window.__velaLoad(t); else setTimeout(function(){ t.classList.remove('on'); }, RM ? 0 : 600); }
    [].forEach.call(cw.querySelectorAll('.vc-chip'), function(r){ r.classList.toggle('on', +r.getAttribute('data-ask') === i); }); };
  cw.addEventListener('click', function(e){ if (ppClick(e)) return; var b = e.target.closest('[data-ask]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var i = +b.getAttribute('data-ask'); if (i !== cur) show(i); });
  show(0, true); setTimeout(size, 0); setTimeout(size, 400); addEventListener('resize', function(){ setTimeout(size, 60); });
})();
function why(){
  var ov = document.createElement('div'); ov.className = 'fx-why'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'fx-why-t');
  var it = [['<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>', 'As required by local law, all tourist accommodations must keep a record of their guests. This means we need a small amount of personal information from you.'],
    ['<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', 'Completing the online check-in before you arrive will save you time.'],
    ['<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', 'We handle all personal data in line with the General Data Protection Regulation (GDPR). To learn more, please read our privacy policy.']];
  ov.innerHTML = '<div class="fx-why-c"><button type="button" class="fx-why-x" aria-label="Close">' + ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20) + '</button><h2 id="fx-why-t">Why is all this data required?</h2>'
    + it.map(function(x){ return '<div class="fx-why-i"><i>' + ic(x[0], 18) + '</i><p>' + x[1] + '</p></div>'; }).join('')
    + '<a class="fx-why-l" href="#">Read our Privacy Policy ' + ic('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', 17) + '</a><button type="button" class="fx-why-b rep-cta">Got it</button></div>';
  document.body.appendChild(ov); requestAnimationFrame(function(){ ov.classList.add('in'); });
  var prev = document.activeElement;
  function close(){ ov.classList.remove('in'); document.removeEventListener('keydown', k, true); setTimeout(function(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }, 200); if (prev && prev.focus) prev.focus(); }
  function k(e){ if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', k, true);
  ov.addEventListener('click', function(e){ e.stopPropagation(); if (e.target === ov || e.target.closest('.fx-why-x, .fx-why-b')) close(); if (e.target.closest('.fx-why-l')) e.preventDefault(); });
  ov.querySelector('.fx-why-b').focus();
}
})();

/* el panel conserva el mismo texto y «Your verification» que en la verificación: el formulario es su último paso */
(function(){
  var asd = document.querySelector('aside[data-slot="assistant-panel"]'); if (!asd) return;
  var p = asd.querySelector(':scope > p'); asd.classList.add('fx-nointro');   /* sin texto de intro, como en los pasos de la verificación */
  var sec = [].filter.call(asd.querySelectorAll(':scope > section'), function(s){ var h = s.querySelector(':scope > span'); return h && /Good to know/i.test(h.textContent); })[0]; if (!sec) return;
  var RI = { id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6.5 16c.6-1.2 1.5-1.8 2.5-1.8s1.9.6 2.5 1.8"/>', scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M8 12h8"/>', who: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>', doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>' };
  var kinds = ['id', 'scan', 'who', 'doc']; try { var k = (localStorage.getItem('rep-ivkinds') || '').split(',').filter(Boolean); if (k.length > 1 && k[k.length - 1] === 'doc') kinds = k; } catch (e) {}
  var cur = kinds.length - 1;
  var tipsL = []; try { tipsL = JSON.parse(localStorage.getItem('rep-ivtips') || '[]'); } catch (e) {} if (tipsL.length !== kinds.length) tipsL = kinds.map(function(k, i){ return 'Step ' + (i + 1) + ' · ' + ({ id: 'Front side photo', scan: 'Back side photo', who: 'Selfie (biometrics)', doc: 'Your details' }[k] || ''); });
  var viaIV = Q.get('ivd') === '1';   /* solo se marcan como hechos los pasos previos si se llega desde la verificación; si se saltó, quedan pendientes */
  var st = '<div class="iv-vst" role="img" aria-label="Step ' + kinds.length + ' of ' + kinds.length + '">' + kinds.map(function(k, i){ var cls = i === cur ? 'now' : (i < cur ? (viaIV ? 'done' : 'skip') : ''); return (i ? '<i class="iv-vl' + (i <= cur ? (viaIV ? ' on' : ' skip') : '') + '"></i>' : '') + '<span class="iv-vc ' + cls + '" tabindex="0" data-tip="' + (tipsL[i] || '') + '"><b>' + ic(i < cur && viaIV ? RI.ok : RI[k], 20) + '</b></span>'; }).join('') + '</div>';
  var s2 = sec.cloneNode(false); s2.classList.add('iv-rv0');
  var rowEl = (sec.querySelector(':scope > button') || asd.querySelector('.fx-tsec > button')).firstElementChild.cloneNode(true), d = document.createElement('div'); d.className = 'fx-gtk';
  var ri = rowEl.querySelector('span'); if (ri && ri.querySelector('svg')) ri.parentNode.removeChild(ri);
  rowEl.querySelector('strong').textContent = 'Where you are in your registration'; rowEl.querySelector('strong + span').textContent = viaIV ? 'The last step: your details. Almost done.' : 'You skipped the identity verification. Fill in your details to continue.';
  rowEl.querySelector('.min-w-0').insertAdjacentHTML('beforeend', st); d.appendChild(rowEl); s2.appendChild(d);
  var ref = asd.querySelector(':scope > section.fx-wsec, :scope > section.fx-tsec') || sec; ref.parentNode.insertBefore(s2, ref);   /* el progreso sigue arriba del todo */
})();

/* si el panel no cabe, se quitan consejos del final (menos importantes); si aun así no cupiera, scroll interno */
(function(){
  var asd = document.querySelector('aside[data-slot="assistant-panel"]'); if (!asd) return;
  try { if (!(localStorage.getItem('replica-comp-trad') === '1' && localStorage.getItem('replica-comp-chat') === '0')) [].forEach.call(asd.querySelectorAll(':scope > section'), function(x){ var h = x.querySelector(':scope > span'); if (h && /Good to know/i.test(h.textContent)) x.style.display = 'none'; }); } catch (e) {}   /* con el chat, «Good to know» se oculta: sus consejos ya son preguntas del chat */
  var items = [].slice.call(asd.querySelectorAll('.fx-x'));
  function over(){ return asd.scrollHeight > asd.clientHeight + 1; }
  function fit(){ items.forEach(function(e){ e.style.display = ''; }); asd.style.overflowY = ''; for (var i = items.length - 1; i > 0 && over(); i--) items[i].style.display = 'none'; if (over()) asd.style.overflowY = 'auto'; }
  var t = 0; addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(fit, 80); }); setTimeout(fit, 0); setTimeout(fit, 400);
})();
})();
