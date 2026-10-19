(function(){
'use strict';
/* Flujo "Autofill with a photo" dentro del formulario de huésped (se abre desde el banner de escaneo).
   Pasos: Document → Get ready → Photo → lectura → resultado (rellena el formulario) · error de lectura.
   Pantalla completa en móvil, modal en escritorio. Lectura simulada: ?ar=ok|error. */
if (!document.querySelector('[data-field="name"]')) return;
var Q = new URLSearchParams(location.search), html = document.documentElement;
var FL = '2';   /* definitivo: pantalla completa en móvil (2) y modal centrado en escritorio (1); la 3 queda en el código sin uso */
var AR = Q.get('ar'); if (['ok', 'error'].indexOf(AR) < 0) AR = 'ok';

function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
var I = {
  x: ic('<path d="M18 6 6 18M6 6l12 12"/>', 20), back: ic('<path d="m15 18-6-6 6-6"/>', 22), ok: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18),
  cam: ic('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>', 18),
  img: ic('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-5-8 9"/>', 18),
  side: ic('<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>', 18),
  flat: ic('<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M6 14V9l6-5 6 5v5"/>', 18),
  lines: ic('<path d="M4 8h16M4 12h16M4 16h10"/>', 18),
  sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 18),
  xs: ic('<path d="M18 6 6 18M6 6l12 12"/>', 14),
  camera: ic('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>', 18),
  warn: ic('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>', 22)
};
var COUNTRIES = [['ES', 'Spain'], ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['PT', 'Portugal'], ['GB', 'United Kingdom'], ['US', 'United States']];
var NAMES = {}; COUNTRIES.forEach(function(c){ NAMES[c[0]] = c[1]; });
/* tipos de documento que se ofrecen (ejemplo con 1, 2, 3 o 4 opciones; ?dt=, se recuerda) */
var DT = Number(Q.get('dt')); try { if (DT) localStorage.setItem('rep-dt', String(DT)); else DT = Number(localStorage.getItem('rep-dt')); } catch (e) {}
if ([1, 2, 3, 4].indexOf(DT) < 0) DT = 2;
var KINDSET = { 1: ['passport'], 2: ['id', 'passport'], 3: ['id', 'passport', 'dl'], 4: ['id', 'passport', 'dl', 'rp'] };
var KLAB = { id: 'ID card', passport: 'Passport', dl: 'Driving licence', rp: 'Residence permit' };
var KIC = { id: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 13h3M6.5 16c.4-1.4 1.3-2 2.5-2s2.1.6 2.5 2"/>', passport: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>', dl: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h6M7 13h4"/><circle cx="17" cy="12" r="1.6"/>', rp: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M12 8.5 8 10v2.6c0 1.6 1.7 2.6 4 3.4 2.3-.8 4-1.8 4-3.4V10l-4-1.5z"/>' };
function kindsOf(c){ return c ? KINDSET[DT] : []; }
function protoKey(k){ return (k === 'dl' || k === 'rp') ? 'id' : k; }   /* los tipos extra reutilizan la animación del DNI */
var DOCS = { ES: ['id', 'passport'], FR: ['id', 'passport'], DE: ['id', 'passport'], IT: ['id', 'passport'], PT: ['id', 'passport'], GB: ['passport'], US: ['passport'] };
var SAMPLES = {
  ES: { n: 'Lucía', s: 'García', s2: 'López', b: '1988-03-14', g: 'F', num: { id: '12345678Z', passport: 'PAA123456' } },
  FR: { n: 'Camille', s: 'Martin', b: '1992-11-02', g: 'F', num: { id: '920412345678', passport: '12AB34567' } },
  DE: { n: 'Jonas', s: 'Becker', b: '1985-01-27', g: 'M', num: { id: 'L01X00T47', passport: 'C01X00T47' } },
  IT: { n: 'Marco', s: 'Rossi', b: '1990-06-09', g: 'M', num: { id: 'CA12345AB', passport: 'YB1234567' } },
  PT: { n: 'Inês', s: 'Silva', b: '1991-09-21', g: 'F', num: { id: '12345678 9 ZZ1', passport: 'N123456' } },
  GB: { n: 'Oliver', s: 'Smith', b: '1987-05-30', g: 'M', num: { passport: '533456789' } },
  US: { n: 'Emily', s: 'Johnson', b: '1993-12-04', g: 'F', num: { passport: '912345678' } }
};
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtDate(iso){ var p = iso.split('-'); return +p[2] + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
function docLabel(c, k){ return k === 'passport' ? 'Passport' : (c === 'ES' ? 'National identity card (DNI)' : 'National identity card'); }

/* ---------- documentos reales (catálogo de la maqueta: imágenes, lados a fotografiar y zonas de lectura) ---------- */
var D = window.__AFD || { docs: {}, layouts: {} };
function DOC(){
  var c = D.docs[S.country]; if (!c) return null;
  if (S.doc === 'dl' || S.doc === 'rp') { var b = c.docs.id; if (!b) return null; var img = S.doc === 'dl' ? '../autofill/assets/catalog/US-dl-back.webp' : '../autofill/assets/catalog/ES-tie-back.webp';
    return Object.assign({}, b, { image: img, alt: KLAB[S.doc] + ' example, back', sideLabel: 'Back · reverse side', title: 'Photograph the back of your ' + KLAB[S.doc].toLowerCase() }); }
  return c.docs[S.doc];
}
function layOf(d){ var k = (d.image || '').split('/').pop().replace(/\.\w+$/, ''); return D.layouts[k] || []; }
function mrzBox(d){ var m = layOf(d).filter(function(z){ return z[0] === 'mrz'; })[0]; return m ? [m[1], m[2], m[3], m[4]] : (d.mrz || [5, 70, 90, 22]); }
function hot(d, cls, delay){ var m = mrzBox(d); return '<i class="afl-hot ' + (cls || '') + '" style="left:' + m[0] + '%;top:' + m[1] + '%;width:' + m[2] + '%;height:' + m[3] + '%;animation-delay:' + (delay || 0) + 's"></i>'; }
function zones(d){ var n = 0; return layOf(d).map(function(z){ var t = z[0] === 'mrz' ? 'mrz' : z[0] === 'photo' || z[0] === 'ghost' ? 'ph' : z[0] === 'chip' ? 'chip' : 'tx'; return '<i class="afl-z ' + t + '" style="left:' + z[1] + '%;top:' + z[2] + '%;width:' + z[3] + '%;height:' + z[4] + '%;animation-delay:' + (0.4 + 0.16 * n++) + 's"></i>'; }).join(''); }
function ratio(d){ return d.formType === 'passport' ? (d.image.indexOf('DE-') >= 0 ? 1000 / 796 : 1000 / 690) : 1000 / 632; }
/* modo: flip (preparar: gira el DNI / abre el pasaporte, mano y reflejo de mal ejemplo) · cam (visor) · plain (lectura) · bad (error) */
function stageDoc(d, mode){
  var r = ratio(d).toFixed(4);
  if (mode === 'flip') {
    var body = d.formType === 'passport'
      ? '<div class="afl-pass" style="aspect-ratio:' + r + '"><img class="data" src="' + d.image + '" alt="' + esc(d.alt) + '">' + hot(d, 'late', 5.6) + '<img class="cov" src="../assets/autofill/passport/cover.webp" alt=""></div>'
      : '<div class="afl-flip" style="aspect-ratio:' + r + '"><div class="afl-fin"><div class="afl-face"><img src="' + (d.imageOther || d.image) + '" alt=""></div><div class="afl-face bk"><img src="' + d.image + '" alt="' + esc(d.alt) + '">' + hot(d, 'late', 5.6) + '</div></div></div>';
    return '<div class="afl-stage light prep"><div class="afl-tilt">' + body + '<i class="afl-ring"></i></div><img class="afl-hand" src="../assets/autofill/hand.webp" alt=""><i class="afl-gl"></i></div>';
  }
  if (mode === 'cam') return '<div class="afl-stage cam"><div class="afl-vf"><div class="afl-cd" style="aspect-ratio:' + r + '"><img src="' + d.image + '" alt="' + esc(d.alt) + '">' + zones(d) + '<i class="afl-scan"></i></div><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span></div><p class="afl-camhint">' + (d.formType === 'passport' ? 'Keep the two lines at the bottom inside the frame' : 'Keep the reading lines inside the frame') + '</p></div>';
  return '<div class="afl-stage light' + (mode === 'bad' ? ' bad' : '') + '"><div class="afl-cd" style="aspect-ratio:' + r + '"><img src="' + d.image + '" alt="' + esc(d.alt) + '">' + hot(d) + (mode === 'bad' ? '<i class="afl-glr"></i>' : '<i class="afl-scan"></i>') + '</div></div>';
}

/* ---------- campos del formulario ---------- */
function F(n){ return document.querySelector('[data-field="' + n + '"]'); }
function inputOf(n){ var f = F(n); return f && f.querySelector('input.input__control'); }
function getVal(n){
  var f = F(n); if (!f) return '';
  if (n === 'nationality' || n === 'gender' || n === 'document_type') { var h = f.querySelector('input[type=hidden]'); return h ? h.value : ''; }
  if (n === 'birth_date') { var s = f.querySelector('button span'); return s ? s.textContent.trim() : ''; }
  var i = inputOf(n); return i ? i.value.trim() : '';
}
function raise(f){
  [].slice.call(f.querySelectorAll('*')).forEach(function(el){
    var c = el.getAttribute('class'); if (!c) return;
    var o = c;
    c = c.replace(/var\(--field-label-top\)/g, 'var(--field-label-raised-top)').replace(/var\(--field-label-font-size\)/g, 'var(--field-label-raised-font-size)').replace(/var\(--field-label-font-weight\)/g, 'var(--field-label-raised-font-weight)').replace(/var\(--field-border\)/g, 'var(--field-border-activated)').replace(/max-w-\[0\.01px\]/g, 'max-w-full !duration-100 !delay-[50ms]').replace(/var\(--empty-field-background\)/g, 'var(--field-background)');
    if (el.tagName === 'BUTTON') c = c.replace('text-[var(--chekin-color-gray-1)]', 'text-[var(--chekin-color-brand-navy)]');
    if (el.tagName === 'INPUT' && el.type === 'text' && c.indexOf('brand-navy') < 0) c = c.replace('leading-5', 'leading-5 text-[var(--chekin-color-brand-navy)]');
    c = c.replace(/\binput--empty\b/, '').replace(/\s+/g, ' ').trim();
    if (c !== o) el.setAttribute('class', c);
    if (el.tagName === 'LABEL' && el.parentNode && !/!px-1/.test(el.parentNode.getAttribute('class') || '')) el.parentNode.setAttribute('class', el.parentNode.getAttribute('class') + ' !px-1');
  });
}
function setField(n, text, code){
  var f = F(n); if (!f) return;
  raise(f);
  if (n === 'name' || n === 'surname' || n === 'second_surname' || n === 'document_number') { var i = inputOf(n); if (i) { i.value = text; i.setAttribute('value', text); } }
  else if (n === 'nationality') { var h = f.querySelector('input[type=hidden]'); if (h) h.value = code; var t = f.querySelector('input[role],input[id$="-trigger"]') || f.querySelector('input[type=text]'); if (t) { t.value = text; t.setAttribute('value', text); } var sp = f.querySelector('span[aria-hidden="true"].invisible'); if (sp) sp.textContent = text; }
  else if (n === 'birth_date') { var s = f.querySelector('button span'); if (s) s.textContent = text; }
  else { var h2 = f.querySelector('input[type=hidden]'); if (h2) h2.value = code; var v = f.querySelector('[id$="-value"]'); if (v) v.textContent = text; }
  f.classList.add('af-flash'); setTimeout(function(){ f.classList.remove('af-flash'); }, 3200);
}

/* ---------- estado y pasos ---------- */
var S = null, host = null, root = null, tok = 0, okEl = null, doneOnce = false;
function reset(){
  var nat = getVal('nationality'), c = DOCS[nat] ? nat : '';
  S = { step: 'doc', country: c, doc: c ? kindsOf(c)[0] : '', attempts: 0, read: null, fix: null };
}
function stepper(n){
  var L = ['Document', 'Get ready', 'Photo'];
  return '<ol class="afl-steps" aria-label="Steps">' + L.map(function(l, i){ var k = i + 1; return '<li class="' + (k === n ? 'on' : k < n ? 'done' : '') + '"><b>' + (k < n ? I.ok : k) + '</b><span>' + l + '</span></li>'; }).join('') + '</ol>';
}
function btn(a, label, cls, extra){ return '<button type="button" class="afl-b ' + (cls || '') + '" data-a="' + a + '"' + (extra || '') + '>' + label + '</button>'; }

/* "Get ready": la animación es la de la maqueta tal cual (vendor/autofill-proto, /autofill/prep.html) en un marco; el resto del flujo es propio */
function prepFrame(c, k){ return '<div class="afl-prepw"><iframe class="afl-prep" title="How to hold your document" scrolling="no" src="../autofill/prep.html" data-c="' + c + '" data-k="' + k + '"></iframe></div>'; }
window.addEventListener('message', function(e){
  var m = e.data; if (!m || !root) return; var fr = root.querySelector('.afl-prep'); if (!fr || e.source !== fr.contentWindow) return;
  if (m.rep === 'prep-ready') fr.contentWindow.postMessage({ rep: S.step === 'photo' ? 'cam-go' : 'prep-go', c: fr.getAttribute('data-c'), k: fr.getAttribute('data-k') }, '*');
});

function ppBody(c, k, pass){
  return '<div class="afl-pp"><p class="afl-chip"><span>' + esc(NAMES[c]) + ' · ' + (pass ? 'Passport' : 'ID card') + '</span><button type="button" data-a="doc">Change</button></p>' + prepFrame(c, k) + '</div>';
}
function view(){
  var c = S.country, d = S.doc, st = S.step;
  var dd = DOC();
  if (st === 'doc') {
    var kinds = kindsOf(c);
    var side = dd ? (dd.formType === 'passport' ? ['Photo page', 'The page with your photo and details.'] : [dd.sideLabel, 'Just this side; the other isn\'t needed.']) : null;
    return { n: 1, title: 'Which document will you use?', sub: 'We\'ll show you how to photograph it so the details are read correctly.',
      body: '<label class="afl-lbl" for="afl-ctry">Nationality</label><div class="afl-selw"><select id="afl-ctry" class="afl-sel"><option value="">Choose a country</option>' + COUNTRIES.map(function(x){ return '<option value="' + x[0] + '"' + (x[0] === c ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>'
        + (c ? '<div class="afl-lbl">Document type</div><div class="afl-types n' + kinds.length + '" role="radiogroup" aria-label="Document type">' + kinds.map(function(k){ return '<button type="button" role="radio" aria-checked="' + (k === d) + '" class="afl-type' + (k === d ? ' on' : '') + '" data-a="type" data-k="' + k + '"><span class="afl-tic">' + ic(KIC[k], 22) + '</span><span class="afl-tl">' + KLAB[k] + '</span><span class="afl-rd"></span></button>'; }).join('') + '</div>' : '')
        + (dd ? '<div class="afl-pv"><div class="afl-pvi"><img src="' + dd.image + '" alt="' + esc(dd.alt) + '"></div><p class="afl-pvc"><b>You will photograph: ' + side[0] + '</b><span>' + side[1] + '</span></p></div>' : ''),
      act: btn('next', 'Continue', 'pri', d ? '' : ' disabled') + btn('close', 'Fill in manually', 'txt') };
  }
  if (st === 'ready') {
    var pass = d === 'passport', tips = [[I.side, pass ? 'Open it to the photo page' : (dd.side === 'back' ? 'Show the back side' : 'Show the photo side')], [I.flat, 'Lay it flat on a plain background'], [I.lines, pass ? 'Keep the two lines at the bottom in view' : 'Keep the bottom lines fully in view'], [I.sun, 'No glare or fingers']];
    return { n: 2, title: 'Get your ' + (pass ? 'passport' : 'ID document') + ' ready', sub: '',
      pp: true, body: ppBody(c, protoKey(d), pass),
      act: btn('cam', 'I\'m ready · Open camera', 'pri') + btn('gallery', I.img + 'Choose from gallery', 'sec') };
  }
  if (st === 'photo') {
    return { n: 3, title: dd.title, sub: dd.instruction, pp: true, body: ppBody(c, protoKey(d), d === 'passport'),
      act: btn('shoot', I.camera + 'Take photo', 'pri') + btn('gallery', I.img + 'Choose from gallery', 'sec') };
  }
  if (st === 'reading') {
    return { n: 0, title: 'We\'re reading the lines', sub: 'When they\'re ready, we\'ll fill in the form fields.',
      body: '<div class="afl-read">' + stageDoc(dd, 'plain') + '<p class="afl-st" role="status"><i class="afl-spin"></i>Reading the document…</p></div>',
      act: btn('close', 'Cancel reading', 'sec') };
  }
  if (st === 'error') {
    var again = S.attempts >= 2;
    return { n: 0, title: again ? 'We still can\'t read your document' : 'We couldn\'t read your document', sub: '', err: true,
      body: '<div class="afl-alert">' + I.warn + '<div><b>We couldn\'t get your details from this photo.</b><span>' + (again ? 'You can try once more or fill in your details by hand.' : 'This can happen if the photo is blurry, the document is cut off or the light is poor.') + '</span></div></div>'
        + '<ul class="afl-etips"><li><span>' + I.cam + '</span>Fit the whole document inside the frame</li><li><span>' + I.sun + '</span>Use good, even light and avoid glare</li><li><span>' + I.flat + '</span>Hold still until the photo is sharp</li></ul>',
      act: btn('retake', 'Retake photo', 'pri') + btn('close', 'Fill in manually', 'sec') };
  }
  return { n: 0, title: '', body: '', act: '' };
}

function subtitleFor(v){ return v.n ? 'Step ' + v.n + ' of 3' : (S.step === 'reading' ? 'Reading your document' : 'Try again'); }
function paint(focus){
  if (!root) return;
  var v = view(), main = root.querySelector('.afl-main'), keep = v.pp && main.querySelector('.afl-prepw');
  root.classList.toggle('err', !!v.err); root.classList.remove('dark');
  root.querySelector('.afl-prog i').style.width = (v.n ? v.n / 3 * 100 : 100) + '%';
  var head = (v.n ? stepper(v.n) + '<p class="afl-no">Step ' + v.n + ' of 3 · ' + ['Document', 'Get ready', 'Photo'][v.n - 1] + '</p>' : '') + '<h2 class="afl-h" tabindex="-1">' + v.title + '</h2>' + (v.sub ? '<p class="afl-sub">' + v.sub + '</p>' : '');
  if (keep) {   /* ready ⇄ photo: se conserva el marco de la maqueta y solo cambian cabecera, chip y botones */
    var tmp = document.createElement('div'); tmp.innerHTML = head;
    [].slice.call(main.children).forEach(function(n){ if (!n.classList.contains('afl-pp')) main.removeChild(n); });
    while (tmp.lastChild) main.insertBefore(tmp.lastChild, main.firstChild);
    var chip = main.querySelector('.afl-chip'); if (chip) chip.style.display = S.step === 'ready' ? '' : 'none';
    var fr = main.querySelector('.afl-prep'); if (fr && fr.contentWindow) fr.contentWindow.postMessage({ rep: S.step === 'photo' ? 'cam-go' : 'prep-go', c: fr.getAttribute('data-c'), k: fr.getAttribute('data-k') }, '*');
  } else main.innerHTML = head + v.body;
  root.querySelector('.afl-ft').innerHTML = v.act;
  var back = root.querySelector('.afl-back'); if (back) back.style.visibility = (S.step === 'reading' || (S.step === 'doc' && FL !== '2')) ? 'hidden' : '';
  var sub = root.querySelector('.mb-sub'); if (sub) sub.textContent = subtitleFor(v);
  if (!keep) main.scrollTop = 0;
  if (focus !== false) { var h = root.querySelector('.afl-h'); if (h) try { h.focus({ preventScroll: true }); } catch (e) {} }
}
function go(step){ S.step = step; paint(); if (FL === '3' && root) root.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
function pageBar(){ var h = document.querySelector('header.relative.flex.shrink-0'); return h && h.parentElement; }
function shell(){
  var d = document.createElement('div'); d.className = 'afl afl-v' + FL;
  d.setAttribute('role', FL === '3' ? 'region' : 'dialog'); if (FL !== '3') d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Autofill with a photo');
  var bar = FL === '2' ? pageBar() : null;
  d.innerHTML = (FL === '1' ? '<div class="afl-bd" data-a="close"></div>' : '') + '<div class="afl-panel">' + (FL === '1' ? '<div class="afl-grab"></div>' : '')
    + (bar ? '<div class="afl-bar"></div>' : '<header class="afl-hd"><button type="button" class="afl-ib afl-back" data-a="back" aria-label="Back">' + I.back + '</button><span class="afl-ctx">Autofill with a photo</span><button type="button" class="afl-ib afl-x" data-a="close" aria-label="Close">' + I.x + '</button></header>')
    + '<div class="afl-prog"><i></i></div><div class="afl-main"></div><footer class="afl-ft"></footer></div>';
  if (bar) {   /* misma barra que la pantalla de registro: mismo botón atrás, mismo título; solo cambia el texto */
    var c = bar.cloneNode(true), b = c.querySelector('button[aria-label="Back"]');
    if (b) { b.removeAttribute('data-to'); b.setAttribute('data-a', 'back'); b.classList.add('afl-back'); }
    var spans = c.querySelectorAll('header > div > span'); if (spans[0]) spans[0].textContent = 'Autofill with a photo';
    var right = c.querySelector('header > div:last-child'); if (right && right !== (b && b.parentNode) && right.querySelector('button, img, svg') && !right.querySelector('span.truncate')) right.innerHTML = '';
    d.querySelector('.afl-bar').appendChild(c);
  }
  return d;
}
function open(el){
  FL = window.innerWidth < 700 ? '2' : '1';
  tok++; reset(); host = el;
  root = shell();
  (function(){ var n = pageBar(), bg = ''; while (n && !bg) { var c = getComputedStyle(n).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') bg = c; n = n.parentElement; } if (!bg) bg = getComputedStyle(document.body).backgroundColor; if (!bg || bg === 'rgba(0, 0, 0, 0)') bg = '#fff'; root.style.setProperty('--afl-bg', bg); })();
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('keydown', function(e){ if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  if (FL === '3') { host.style.display = 'none'; if (okEl) okEl.style.display = 'none'; host.parentNode.insertBefore(root, host.nextSibling); }
  else { document.body.appendChild(root); html.classList.add('afl-open'); }
  paint(); requestAnimationFrame(function(){ root.classList.add('in'); if (FL === '3') root.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
}
function close(){
  tok++; if (!root) return;
  var r = root; root = null; html.classList.remove('afl-open'); if (r.parentNode) r.parentNode.removeChild(r);
  if (host) { if (okEl && doneOnce) { okEl.style.display = ''; host.style.display = 'none'; } else host.style.display = ''; }
}
function onChange(e){
  if (e.target.id === 'afl-ctry') { S.country = e.target.value; S.doc = S.country ? kindsOf(S.country)[0] : ''; paint(false); var s = root.querySelector('#afl-ctry'); if (s) s.focus(); }
}
function onClick(e){
  var t = e.target.closest('[data-a]'); if (!t) return; if (t.disabled) return;
  e.preventDefault(); e.stopPropagation();
  var a = t.getAttribute('data-a');
  if (a === 'close') return close();
  if (a === 'back') { var m = { doc: 'close', ready: 'doc', photo: 'ready', error: 'photo' }[S.step]; return m === 'close' ? close() : go(m); }
  if (a === 'prev') return go(S.step === 'photo' ? 'ready' : 'doc');
  if (a === 'type') { S.doc = t.getAttribute('data-k'); return paint(false); }
  if (a === 'next') return go('ready');
  if (a === 'doc') return go('doc');
  if (a === 'cam' || a === 'retake') return go('photo');
  if (a === 'shoot' || a === 'gallery') return read();
}
function sampleRead(){
  var s = SAMPLES[S.country] || SAMPLES.ES, num = s.num[protoKey(S.doc)] || s.num.passport;
  var r = { n: s.n, s: s.s, s2: s.s2 || '', b: s.b, g: s.g, nat: S.country, num: num };
  return r;
}
function read(){
  S.attempts++; var my = ++tok; S.read = sampleRead(); go('reading');
  setTimeout(function(){
    if (my !== tok || !root) return;
    if (AR === 'error' && S.attempts === 1) return go('error');
    finish();
  }, 1700);
}
function finish(){
  var r = S.read, plan = [], cur = { name: getVal('name'), surname: getVal('surname'), second_surname: getVal('second_surname'), nationality: getVal('nationality'), birth_date: getVal('birth_date'), gender: getVal('gender'), document_type: getVal('document_type'), document_number: getVal('document_number') };
  function put(k, text, code){ if (!text || cur[k] === (code || text)) return; plan.push([k, text, code]); }
  put('nationality', NAMES[r.nat], r.nat); put('name', r.n); put('surname', r.s); put('second_surname', r.s2); put('birth_date', fmtDate(r.b)); put('gender', r.g === 'M' ? 'Male' : 'Female', r.g);
  put('document_type', docLabel(S.country, S.doc), S.doc === 'passport' ? 'P' : 'ID'); put('document_number', r.num);
  doneOnce = true; showOk(plan.length);
  close();
  /* se rellena todo a la vez y los campos rellenados se marcan en verde un momento */
  plan.forEach(function(x){ setField(x[0], x[1], x[2]); });
  if (window.__ffValidate) window.__ffValidate();   /* los avisos de campo obligatorio / erróneo se actualizan con lo rellenado */
  var first = F(plan.length ? plan[0][0] : 'nationality'); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function showOk(n){
  if (!okEl) { okEl = document.createElement('div'); okEl.className = 'as as1 afl-okb'; okEl.setAttribute('role', 'status'); host.parentNode.insertBefore(okEl, host.nextSibling); okEl.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); open(host); }, true); }
  okEl.innerHTML = '<div class="as-t"><b><i class="afl-okic2">' + I.ok + '</i>Document read</b><span>' + (n ? n + ' fields filled in. Check them and complete the rest.' : 'The details were already in the form.') + '</span></div><button type="button" class="as-btn">' + I.cam + '<span>Scan again</span></button>';
  okEl.style.display = '';
}
window.__afOpen = open;

/* ---------- llegada desde la verificación de identidad (?ivd=1&ivc=ES&ivk=id): el formulario llega rellenado con lo leído del documento ---------- */
var IVD = Q.get('ivd') === '1', IVF = Q.get('ivf'); try { if (['full', 'partial'].indexOf(IVF) >= 0) localStorage.setItem('rep-ivf', IVF); else IVF = localStorage.getItem('rep-ivf'); } catch (e) {}
if (['full', 'partial'].indexOf(IVF) < 0) IVF = 'full';
function fromIV(){
  var cc = Q.get('ivc') || 'ES', kind = Q.get('ivk') || 'id', cname = Q.get('ivn') || NAMES[cc] || 'Spain';
  var sm = SAMPLES[cc] || SAMPLES.ES, pass = kind === 'passport', num = pass ? (sm.num.passport || 'PAA123456') : (sm.num.id || sm.num.passport);
  var plan = [['nationality', cname, cc], ['name', sm.n], ['surname', sm.s], ['birth_date', fmtDate(sm.b)], ['document_type', docLabel(cc, pass ? 'passport' : 'id'), pass ? 'P' : 'ID'], ['document_number', num]];
  if (IVF === 'full') { if (sm.s2 || true) plan.push(['second_surname', sm.s2 || sm.s]); plan.push(['gender', sm.g === 'M' ? 'Male' : 'Female', sm.g]); }
  var mine = document.querySelector('.as[data-as-go]'), card = document.querySelector('.auto-fill-card'), anchor = mine || card; if (!anchor) return;
  var n = plan.length, full = IVF === 'full';
  var el = document.createElement('div'); el.className = 'as as1 afl-okb ivfr'; el.setAttribute('role', 'status');
  el.innerHTML = '<div class="as-t"><b><i class="afl-okic2">' + I.ok + '</i>' + (full ? 'Form completed' : 'Form partially completed') + '</b><span>' + (full ? 'Your identity is verified and we filled in all your details. Check them before you continue.' : 'Your identity is verified. We filled in ' + n + ' fields from your document; complete the rest.') + '</span></div>';
  anchor.parentNode.insertBefore(el, anchor); if (mine) mine.style.display = 'none'; if (card) card.style.display = 'none';
  setTimeout(function(){ plan.forEach(function(x){ setField(x[0], x[1], x[2]); }); if (window.__ffValidate) window.__ffValidate(); }, 500);
}
if (IVD) { var run = function(){ setTimeout(fromIV, 150); }; if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run); }

/* ---------- controles ---------- */
function group(title, order, opts, cur, param, off){
  var d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = opts.map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (o[0] === cur ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var p = new URLSearchParams(location.search), v = b.getAttribute('data-v'); if (v === off) p.delete(param); else p.set(param, v); var s = p.toString(); location.search = s ? '?' + s : '?'; });
  return [title, d, order];
}
function ivfGroup(){ var o = [['full', 'Completo'], ['partial', 'Parcial']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === IVF ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var p = new URLSearchParams(location.search); p.set('ivf', b.getAttribute('data-v')); if (!p.get('ivd')) { p.set('ivd', '1'); } location.search = '?' + p.toString(); });
  return ['Formulario tras la verificación', d, 47]; }
var rows = [ivfGroup(), group('Tipos de documento', 48, [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], String(DT), 'dt', null),
  group('Lectura simulada', 49, [['ok', 'Correcta'], ['error', 'Error']], AR, 'ar', 'ok')];
function init(){ rows.forEach(function(r){ if (window.__repPanel) window.__repPanel.add(r[0], r[1], r[2]); else document.body.appendChild(r[1]); }); }
if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
