(function(){
'use strict';
/* Identity verification (IV): documento → cada parte (anverso, reverso, selfie) con sus instrucciones y cámara simulada → verificando → verificado.
   Pantalla móvil g2-iv. ?from=form (viene de Complete registration) | hub (viene del resumen). ?gn= nombre del huésped. */
var Q = new URLSearchParams(location.search), html = document.documentElement;
var SID = (window.__SCREEN && window.__SCREEN.id) || '';
var FROM = (SID === 'g2-ivf') ? 'flow' : (Q.get('from') === 'hub' || SID === 'g2-ivh') ? 'hub' : 'form', NAME = (Q.get('gn') || '').trim();
function ic(p, w){ return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var I = { img: ic('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-5-8 9"/>', 18), ok: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 22), okS: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14), cam: ic('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>', 18),
  flat: ic('<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M6 14V9l6-5 6 5v5"/>', 18), sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 18),
  eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', 18), lines: ic('<path d="M4 8h16M4 12h16M4 16h10"/>', 18), user: ic('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>', 18),
  shield: ic('<path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>', 16) };
/* catálogo global de documentos (global-document-catalog, copiado en ../autofill/): [código, país, anverso, reverso, pasaporte] — sin DNI: anverso vacío */
I.x = ic('<path d="M6 6l12 12M18 6 6 18"/>', 14); I.warn = ic('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>', 22);
/* resultado simulado de la validación de cada foto (control «Resultado de la foto»): ok | face | mrz | both */
var OUT = 'ok'; try { OUT = localStorage.getItem('rep-io') || 'ok'; } catch (e) {}
var TRIES = 0;
/* duración simulada de la verificación en segundos (0 = no termina nunca: se queda al 99 %) */
var VT = 5; try { var vtv = localStorage.getItem('rep-iv-t'); if (vtv !== null) VT = Number(vtv); } catch (e) {}
var CAT = [["AF","Afghanistan","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["AL","Albania","AL-id-front.webp","AL-id-back.webp","AL-passport.webp"],["DZ","Algeria","DZ-id-front.webp","DZ-id-back.webp","DZ-passport.webp"],["AD","Andorra","","","generic-passport.webp"],["AO","Angola","","","generic-passport.webp"],["AG","Antigua and Barbuda","","","generic-passport.webp"],["AR","Argentina","AR-id-front.webp","AR-id-back.webp","AR-passport.webp"],["AM","Armenia","","","generic-passport.webp"],["AU","Australia","","","AU-passport.webp"],["AT","Austria","AT-id-front.webp","AT-id-back.webp","AT-passport.webp"],["AZ","Azerbaijan","","","AZ-passport.webp"],["BS","Bahamas","","","generic-passport.webp"],["BH","Bahrain","","","generic-passport.webp"],["BD","Bangladesh","","","generic-passport.webp"],["BB","Barbados","","","generic-passport.webp"],["BY","Belarus","BY-id-front.webp","BY-id-back.webp","BY-passport.webp"],["BE","Belgium","BE-id-front.webp","BE-id-back.webp","BE-passport.webp"],["BZ","Belize","","","generic-passport.webp"],["BJ","Benin","","","generic-passport.webp"],["BT","Bhutan","","","generic-passport.webp"],["BO","Bolivia","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["BA","Bosnia and Herzegovina","BA-id-front.webp","BA-id-back.webp","BA-passport.webp"],["BW","Botswana","","","generic-passport.webp"],["BR","Brazil","BR-id-front.webp","BR-id-back.webp","BR-passport.webp"],["BN","Brunei","","","generic-passport.webp"],["BG","Bulgaria","BG-id-front.webp","BG-id-back.webp","BG-passport.webp"],["BF","Burkina Faso","","","generic-passport.webp"],["BI","Burundi","","","generic-passport.webp"],["KH","Cambodia","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["CM","Cameroon","","","generic-passport.webp"],["CA","Canada","","","CA-passport.webp"],["CV","Cape Verde","","","generic-passport.webp"],["CF","Central African Republic","","","generic-passport.webp"],["TD","Chad","","","generic-passport.webp"],["CL","Chile","CL-id-front.webp","CL-id-back.webp","CL-passport.webp"],["CN","China","","","CN-passport.webp"],["CO","Colombia","CO-id-front.webp","CO-id-back.webp","CO-passport.webp"],["KM","Comoros","","","generic-passport.webp"],["CG","Congo","","","generic-passport.webp"],["CR","Costa Rica","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["CI","Côte d'Ivoire","","","generic-passport.webp"],["HR","Croatia","HR-id-front.webp","HR-id-back.webp","HR-passport.webp"],["CU","Cuba","","","generic-passport.webp"],["CY","Cyprus","CY-id-front.webp","CY-id-back.webp","CY-passport.webp"],["CZ","Czechia","CZ-id-front.webp","CZ-id-back.webp","CZ-passport.webp"],["CD","Democratic Republic of the Congo","","","generic-passport.webp"],["DK","Denmark","","","DK-passport.webp"],["DJ","Djibouti","","","generic-passport.webp"],["DM","Dominica","","","generic-passport.webp"],["DO","Dominican Republic","","","generic-passport.webp"],["EC","Ecuador","generic-id-front.webp","EC-id-back.webp","generic-passport.webp"],["EG","Egypt","","","generic-passport.webp"],["SV","El Salvador","","","generic-passport.webp"],["GQ","Equatorial Guinea","","","generic-passport.webp"],["ER","Eritrea","","","generic-passport.webp"],["EE","Estonia","EE-id-front.webp","EE-id-back.webp","EE-passport.webp"],["SZ","Eswatini","","","generic-passport.webp"],["ET","Ethiopia","","","generic-passport.webp"],["FJ","Fiji","","","generic-passport.webp"],["FI","Finland","FI-id-front.webp","FI-id-back.webp","FI-passport.webp"],["FR","France","FR-id-front.webp","FR-id-back.webp","FR-passport.webp"],["GA","Gabon","","","generic-passport.webp"],["GM","Gambia","","","generic-passport.webp"],["GE","Georgia","GE-id-front.webp","GE-id-back.webp","GE-passport.webp"],["DE","Germany","DE-id-front.webp","DE-id-back.webp","DE-passport.webp"],["GH","Ghana","","","generic-passport.webp"],["GR","Greece","GR-id-front.webp","GR-id-back.webp","GR-passport.webp"],["GD","Grenada","","","generic-passport.webp"],["GT","Guatemala","","","generic-passport.webp"],["GN","Guinea","","","generic-passport.webp"],["GW","Guinea-Bissau","","","generic-passport.webp"],["GY","Guyana","","","generic-passport.webp"],["HT","Haiti","","","generic-passport.webp"],["HN","Honduras","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["HU","Hungary","HU-id-front.webp","HU-id-back.webp","HU-passport.webp"],["IS","Iceland","IS-id-front.webp","IS-id-back.webp","IS-passport.webp"],["IN","India","","","IN-passport.webp"],["ID","Indonesia","","","generic-passport.webp"],["IR","Iran","","","generic-passport.webp"],["IQ","Iraq","","","generic-passport.webp"],["IE","Ireland","","","IE-passport.webp"],["IL","Israel","","","IL-passport.webp"],["IT","Italy","IT-id-front.webp","IT-id-back.webp","IT-passport.webp"],["JM","Jamaica","","","generic-passport.webp"],["JP","Japan","","","JP-passport.webp"],["JO","Jordan","","","generic-passport.webp"],["KZ","Kazakhstan","","","generic-passport.webp"],["KE","Kenya","","","generic-passport.webp"],["KI","Kiribati","","","generic-passport.webp"],["XK","Kosovo","XK-id-front.webp","XK-id-back.webp","XK-passport.webp"],["KW","Kuwait","","","generic-passport.webp"],["KG","Kyrgyzstan","","","generic-passport.webp"],["LA","Laos","","","generic-passport.webp"],["LV","Latvia","LV-id-front.webp","LV-id-back.webp","LV-passport.webp"],["LB","Lebanon","","","generic-passport.webp"],["LS","Lesotho","","","generic-passport.webp"],["LR","Liberia","","","generic-passport.webp"],["LY","Libya","","","generic-passport.webp"],["LI","Liechtenstein","LI-id-front.webp","LI-id-back.webp","LI-passport.webp"],["LT","Lithuania","LT-id-front.webp","LT-id-back.webp","LT-passport.webp"],["LU","Luxembourg","LU-id-front.webp","LU-id-back.webp","LU-passport.webp"],["MG","Madagascar","","","generic-passport.webp"],["MW","Malawi","","","generic-passport.webp"],["MY","Malaysia","","","MY-passport.webp"],["MV","Maldives","","","generic-passport.webp"],["ML","Mali","","","generic-passport.webp"],["MT","Malta","MT-id-front.webp","MT-id-back.webp","MT-passport.webp"],["MH","Marshall Islands","","","generic-passport.webp"],["MR","Mauritania","","","generic-passport.webp"],["MU","Mauritius","","","generic-passport.webp"],["MX","Mexico","MX-id-front.webp","MX-id-back.webp","MX-passport.webp"],["FM","Micronesia","","","generic-passport.webp"],["MD","Moldova","MD-id-front.webp","MD-id-back.webp","MD-passport.webp"],["MC","Monaco","MC-id-front.webp","MC-id-back.webp","MC-passport.webp"],["MN","Mongolia","","","generic-passport.webp"],["ME","Montenegro","ME-id-front.webp","ME-id-back.webp","ME-passport.webp"],["MA","Morocco","MA-id-front.webp","MA-id-back.webp","MA-passport.webp"],["MZ","Mozambique","","","generic-passport.webp"],["MM","Myanmar","","","generic-passport.webp"],["NA","Namibia","","","generic-passport.webp"],["NR","Nauru","","","generic-passport.webp"],["NP","Nepal","","","generic-passport.webp"],["NL","Netherlands","NL-id-front.webp","NL-id-back.webp","NL-passport.webp"],["NZ","New Zealand","","","generic-passport.webp"],["NI","Nicaragua","","","generic-passport.webp"],["NE","Niger","","","generic-passport.webp"],["NG","Nigeria","","","generic-passport.webp"],["KP","North Korea","","","generic-passport.webp"],["MK","North Macedonia","MK-id-front.webp","MK-id-back.webp","MK-passport.webp"],["NO","Norway","NO-id-front.webp","NO-id-back.webp","NO-passport.webp"],["OM","Oman","","","generic-passport.webp"],["PK","Pakistan","","","generic-passport.webp"],["PW","Palau","","","generic-passport.webp"],["PS","Palestinian Territories","","","generic-passport.webp"],["PA","Panama","","","generic-passport.webp"],["PG","Papua New Guinea","","","generic-passport.webp"],["PY","Paraguay","","","generic-passport.webp"],["PE","Peru","PE-id-front.webp","PE-id-back.webp","PE-passport.webp"],["PH","Philippines","","","generic-passport.webp"],["PL","Poland","PL-id-front.webp","PL-id-back.webp","PL-passport.webp"],["PT","Portugal","PT-id-front.webp","PT-id-back.webp","PT-passport.webp"],["QA","Qatar","","","generic-passport.webp"],["RO","Romania","RO-id-front.webp","RO-id-back.webp","RO-passport.webp"],["RU","Russia","","","RU-passport.webp"],["RW","Rwanda","","","generic-passport.webp"],["KN","Saint Kitts and Nevis","","","generic-passport.webp"],["LC","Saint Lucia","","","generic-passport.webp"],["VC","Saint Vincent and the Grenadines","","","generic-passport.webp"],["WS","Samoa","","","generic-passport.webp"],["SM","San Marino","SM-id-front.webp","SM-id-back.webp","generic-passport.webp"],["ST","São Tomé and Príncipe","","","generic-passport.webp"],["SA","Saudi Arabia","","","generic-passport.webp"],["SN","Senegal","","","generic-passport.webp"],["RS","Serbia","RS-id-front.webp","RS-id-back.webp","RS-passport.webp"],["SC","Seychelles","","","generic-passport.webp"],["SL","Sierra Leone","","","generic-passport.webp"],["SG","Singapore","","","generic-passport.webp"],["SK","Slovakia","SK-id-front.webp","SK-id-back.webp","SK-passport.webp"],["SI","Slovenia","SI-id-front.webp","SI-id-back.webp","SI-passport.webp"],["SB","Solomon Islands","","","generic-passport.webp"],["SO","Somalia","","","generic-passport.webp"],["ZA","South Africa","","","generic-passport.webp"],["KR","South Korea","","","KR-passport.webp"],["SS","South Sudan","","","generic-passport.webp"],["ES","Spain","ES-id-front.webp","ES-id-back.webp","ES-passport.webp"],["LK","Sri Lanka","","","generic-passport.webp"],["SD","Sudan","","","generic-passport.webp"],["SR","Suriname","","","generic-passport.webp"],["SE","Sweden","SE-id-front.webp","SE-id-back.webp","SE-passport.webp"],["CH","Switzerland","CH-id-front.webp","CH-id-back.webp","CH-passport.webp"],["SY","Syria","","","generic-passport.webp"],["TJ","Tajikistan","","","generic-passport.webp"],["TZ","Tanzania","","","generic-passport.webp"],["TH","Thailand","","","TH-passport.webp"],["TL","Timor-Leste","","","generic-passport.webp"],["TG","Togo","","","generic-passport.webp"],["TO","Tonga","","","generic-passport.webp"],["TT","Trinidad and Tobago","","","generic-passport.webp"],["TN","Tunisia","","","TN-passport.webp"],["TR","Turkey","TR-id-front.webp","TR-id-back.webp","TR-passport.webp"],["TM","Turkmenistan","","","generic-passport.webp"],["TV","Tuvalu","","","generic-passport.webp"],["UG","Uganda","","","generic-passport.webp"],["UA","Ukraine","UA-id-front.webp","UA-id-back.webp","UA-passport.webp"],["AE","United Arab Emirates","AE-id-front.webp","AE-id-back.webp","AE-passport.webp"],["GB","United Kingdom","","","GB-passport.webp"],["US","United States","","","US-passport.webp"],["UY","Uruguay","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["UZ","Uzbekistan","","","generic-passport.webp"],["VU","Vanuatu","","","generic-passport.webp"],["VA","Vatican City","","","VA-passport.webp"],["VE","Venezuela","","","generic-passport.webp"],["VN","Vietnam","generic-id-front.webp","generic-id-back.webp","generic-passport.webp"],["YE","Yemen","","","generic-passport.webp"],["ZM","Zambia","","","generic-passport.webp"],["ZW","Zimbabwe","","","generic-passport.webp"]];
var COUNTRIES = CAT.map(function(x){ return [x[0], x[1]]; });
var CATBY = {}; CAT.forEach(function(x){ CATBY[x[0]] = x; });
function hasId(c){ return !!(CATBY[c] && CATBY[c][2]); }
/* tipos de documento que se ofrecen (ejemplo con 1, 2, 3 o 4 opciones; ?dt=, se recuerda) */
var DT = Number(Q.get('dt')); try { if (DT) localStorage.setItem('rep-dt', String(DT)); else DT = Number(localStorage.getItem('rep-dt')); } catch (e) {}
if ([1, 2, 3, 4].indexOf(DT) < 0) DT = 2;
var KINDSET = { 1: ['passport'], 2: ['id', 'passport'], 3: ['id', 'passport', 'dl'], 4: ['id', 'passport', 'dl', 'rp'] };
var KLAB = { id: 'ID card', idold: 'ID card · before 2021', passport: 'Passport', dl: 'Driving licence', rp: 'Residence permit' };
var OLD = { FR: 'id-paper', RO: 'id-classic' };   /* DNI antiguo con las líneas de lectura (MRZ) en el anverso: solo se fotografía el anverso */
var KIC = { id: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 13h3M6.5 16c.4-1.4 1.3-2 2.5-2s2.1.6 2.5 2"/>', passport: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>', dl: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h6M7 13h4"/><circle cx="17" cy="12" r="1.6"/>', rp: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M12 8.5 8 10v2.6c0 1.6 1.7 2.6 4 3.4 2.3-.8 4-1.8 4-3.4V10l-4-1.5z"/>' };
var IMG = function(c, k){ var x = CATBY[c] || CATBY.ES; return '../autofill/assets/catalog/' + (k === 'id-front' ? x[2] : k === 'id-back' ? x[3] : k === 'passport' ? x[4] : c + '-' + k + '.webp'); };
function kindsFor(c){ var k = KINDSET[DT].filter(function(x){ return x !== 'id' || hasId(c); }); if (k.indexOf('id') >= 0 && OLD[c]) k.splice(k.indexOf('id') + 1, 0, 'idold'); return k.length ? k : ['passport']; }
function kl(k){ return k === 'id' && OLD[S.c] ? 'ID card · since 2021' : KLAB[k]; }
function sideImg(kind, side){ return kind === 'idold' ? '../autofill/assets/catalog/' + S.c + '-' + OLD[S.c] + '-front.webp' : kind === 'dl' ? IMG('US', 'dl-' + side) : kind === 'rp' ? IMG('ES', 'tie-' + side) : IMG(S.c, 'id-' + side); }   /* carnet de conducir y permiso de residencia: imágenes de ejemplo del catálogo */

KIC.idold = KIC.id;
var SELFIE_PART = { k: 'selfie', t: 'Selfie', ttl: 'Get ready for your selfie', sub: 'We compare your face with the photo on your document. Two quick things first.', steps: [['Remove anything covering your face', I.user], ['Your face well lit, with no shadows', I.sun], ['Take a selfie', I.cam]], tips: [[I.user, 'Take off hats, caps and sunglasses'], [I.sun, 'Use good, even light on your face'], [I.eye, 'Look straight at the camera']] };
/* segundo del vídeo (a 1×) en que se cumple cada paso: gafas fuera · luz corregida */
var SV = '3'; try { SV = localStorage.getItem('rep-sv'); if (!/^[123]$/.test(SV)) SV = '3'; } catch (e) {}
var SELFIE_VIDS = { '1': { src: 'selfie-clean-1.mp4', at: [1.9, 2.7, 3.6], rate: 0.75 }, '2': { src: 'selfie-clean-2.mp4', at: [4.3, 6.4, 7.4], rate: 1 }, '3': { src: 'selfie-clean-3.mp4', at: [3.7, 5.9, 6.9], rate: 1 } };   /* vídeo 2: gorra ~1,6 s · gafas ~4,3 s · luz ~6,4 s */

/* recorta el fondo del vídeo (relleno desde los bordes por color) y lo pinta en un canvas con el fondo transparente */
function keyVideo(v, cv){
  var x = cv.getContext('2d'), sm = document.createElement('canvas'), sx = sm.getContext('2d', { willReadFrequently: true }), W = 0, H = 0, SW = 0, SH = 0, busy = 0;
  function size(){ var st = cv.parentNode, dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(st.clientWidth * dpr), h = Math.round(st.clientHeight * dpr); if (!w || !h) return false; if (w !== W || h !== H) { W = cv.width = w; H = cv.height = h; SW = sm.width = Math.max(40, Math.round(w / 3)); SH = sm.height = Math.max(40, Math.round(h / 3)); } return true; }
  function crop(){ var vw = v.videoWidth, vh = v.videoHeight, k = Math.max(W / vw, H / vh), cw = W / k, ch = H / k; return [(vw - cw) * 0.38, (vh - ch) * 0.3, cw, ch]; }
  function frame(){
    if (!v.videoWidth || !size()) return;
    var c = crop(); sx.clearRect(0, 0, SW, SH); sx.drawImage(v, c[0], c[1], c[2], c[3], 0, 0, SW, SH);
    var im = sx.getImageData(0, 0, SW, SH), d = im.data, n = SW * SH, bg = new Uint8Array(n), q = new Int32Array(n), qh = 0, qt = 0, i, p;
    /* color de referencia del fondo: mediana de 16 puntos de la fila de arriba (y las dos columnas laterales altas), para que un brazo o la mano que toca una esquina no la contamine */
    var rs = [], gs = [], bs = [], k;
    function samp(px, py){ p = (py * SW + px) * 4; rs.push(d[p]); gs.push(d[p + 1]); bs.push(d[p + 2]); }
    for (k = 0; k < 16; k++) samp(Math.round(k * (SW - 1) / 15), 1);
    for (k = 0; k < 4; k++) { samp(1, 2 + k * 2); samp(SW - 2, 2 + k * 2); }
    function med(a){ a.sort(function(x, y){ return x - y; }); return a[a.length >> 1]; }
    var rr = med(rs), rg = med(gs), rb = med(bs);
    function far(o){ return Math.abs(d[o] - rr) + Math.abs(d[o + 1] - rg) + Math.abs(d[o + 2] - rb); }
    function seed(a){ if (!bg[a] && far(a * 4) < 90) { bg[a] = 1; q[qt++] = a; } }
    for (i = 0; i < SW; i++) { seed(i); seed((SH - 1) * SW + i); }
    for (i = 0; i < SH; i++) { seed(i * SW); seed(i * SW + SW - 1); }
    while (qh < qt) {
      var a = q[qh++], ax = a % SW, ay = (a / SW) | 0, o = a * 4, nb = [ax > 0 ? a - 1 : -1, ax < SW - 1 ? a + 1 : -1, ay > 0 ? a - SW : -1, ay < SH - 1 ? a + SW : -1];
      for (var j = 0; j < 4; j++) { var b = nb[j]; if (b < 0 || bg[b]) continue; var ob = b * 4;
        if (Math.abs(d[ob] - d[o]) + Math.abs(d[ob + 1] - d[o + 1]) + Math.abs(d[ob + 2] - d[o + 2]) < 20 && far(ob) < 150) { bg[b] = 1; q[qt++] = b; } }
    }
    var lightBg = (rr + rg + rb) / 3 > 215;   /* fondo claro: también se quitan los huecos cerrados (p. ej. entre el brazo y el cuerpo) */
    for (i = 0; i < n; i++) { if (lightBg && !bg[i] && (far(i * 4) < 60 || (d[i * 4] > 218 && d[i * 4 + 1] > 218 && d[i * 4 + 2] > 218))) bg[i] = 1; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = bg[i] ? 0 : 255; }
    sx.putImageData(im, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); x.imageSmoothingQuality = 'high'; x.drawImage(v, c[0], c[1], c[2], c[3], 0, 0, W, H);
    x.globalCompositeOperation = 'destination-in'; x.filter = 'blur(1.2px)'; x.drawImage(sm, 0, 0, W, H); x.filter = 'none'; x.globalCompositeOperation = 'source-over';
  }
  function loop(){ frame(); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(loop); else if (!v.ended) requestAnimationFrame(loop); }
  v.addEventListener('loadeddata', frame); v.addEventListener('seeked', frame); v.addEventListener('ended', frame); window.addEventListener('resize', frame);
  loop();
}
function selfieVid(){
  var v = document.querySelector('video.iv-selfie-anim'); if (!v) return;
  
  var st = v.parentNode, rows = [].slice.call(document.querySelectorAll('.iv-ssteps li'));
  var rt = SELFIE_VIDS[SV].rate; v.defaultPlaybackRate = v.playbackRate = rt;
  function upd(){ var t = v.currentTime; rows.forEach(function(r){ r.classList.toggle('ok', t >= +r.getAttribute('data-at')); }); st.classList.toggle('ok', t >= SELFIE_VIDS[SV].at[0]); }
  v.addEventListener('timeupdate', upd); v.addEventListener('ended', function(){ rows.forEach(function(r){ r.classList.add('ok'); }); st.classList.add('ok'); });
  v.addEventListener('playing', function(){ v.playbackRate = rt; });
}
/* modo de verificación (Controles > Identity verification): 'bio' = anverso + reverso + selfie y se analiza cara, biometría y MRZ · 'doc' = solo la parte con las líneas de lectura y solo se analiza el MRZ */
var MODE = 'bio'; try { MODE = localStorage.getItem('rep-ivm') === 'doc' ? 'doc' : 'bio'; } catch (e) {}
var S = { step: 'doc', c: 'ES', d: kindsFor('ES')[0], i: 0 };   /* España por defecto */   /* i: parte actual */
function parts(){
  var all = partsAll(); if (MODE !== 'doc') return all;
  var p = S.d === 'passport' || S.d === 'idold' ? all[0] : all.filter(function(x){ return x.k === 'back'; })[0];
  if (p && p.k === 'back') p = Object.assign({}, p, { ttl: 'Photograph the back side' });
  return [p];
}
function partsAll(){
  if (S.d === 'passport') return [{ k: 'page', t: 'Photo page', ttl: 'Photograph the photo page', sub: 'Open the passport and place the page with your photo and details in the frame.', img: IMG(S.c, 'passport'), tips: [[I.flat, 'Lay it flat on a plain background'], [I.lines, 'Keep the two lines at the bottom in view'], [I.sun, 'No glare or fingers']] },
    SELFIE_PART];
  if (S.d === 'idold') return [{ k: 'front', t: 'Front side', ttl: 'Photograph the front side', sub: 'Place the side with your photo inside the frame.', img: sideImg('idold', 'front'), tips: [[I.flat, 'Lay it flat on a plain background'], [I.lines, 'Keep the reading lines in view'], [I.sun, 'No glare or fingers']] },
    SELFIE_PART];
  return [{ k: 'front', t: 'Front side', ttl: 'Photograph the front side', sub: 'Place the side with your photo inside the frame.', img: sideImg(S.d, 'front'), tips: [[I.flat, 'Lay it flat on a plain background'], [I.eye, 'Make sure all the text is readable'], [I.sun, 'No glare or fingers']] },
    { k: 'back', t: 'Back side', ttl: 'Now the back side', sub: 'Turn your document over and place the reverse side inside the frame.', img: sideImg(S.d, 'back'), tips: [[I.flat, 'Keep it on the same background'], [I.lines, 'The reading lines must be fully in view'], [I.sun, 'No glare or fingers']] },
    SELFIE_PART];
}
function face(){ return '<svg class="iv-face" viewBox="0 0 120 150" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><ellipse cx="60" cy="68" rx="40" ry="52" stroke-dasharray="3 7"/><circle cx="60" cy="58" r="16" stroke-opacity=".55"/><path d="M26 140c4-22 18-32 34-32s30 10 34 32" stroke-opacity=".55"/></svg>'; }
function fig(src, cap){ return '<figure class="iv-fig"><div class="iv-fi"><img src="' + src + '" alt="' + cap + ' example"></div><figcaption>' + cap + '</figcaption></figure>'; }
function segs(){ var n = parts().length, h = ''; for (var k = 0; k < n; k++) h += '<i class="' + (k < S.i || S.step === 'verifying' || S.step === 'done' ? 'on' : k === S.i ? 'cur' : '') + '"></i>'; return '<div class="iv-seg" role="img" aria-label="Part ' + Math.min(S.i + 1, n) + ' of ' + n + '">' + h + '</div>'; }
var MOCK = 'he'; try { MOCK = localStorage.getItem('rep-smock') === 'she' ? 'she' : 'he'; } catch (e) {}   /* silueta guía del selfie: he = hombre · she = mujer */
function ghost(){ return '<img class="iv-ghost m-' + MOCK + '" src="../selfie/mannequin-' + MOCK + '.png" alt="" draggable="false">'; }
var DCAM = 'std'; try { DCAM = localStorage.getItem('rep-dcam') === 'anim' ? 'anim' : 'std'; } catch (e) {}   /* cámara del documento: std = como hasta ahora · anim = arranca apagada y se enciende con la animación del selfie */
var DOCON = true;
var CAMON = false, CAMT = 0;   /* cámara del selfie encendida: arranca apagada y se enciende sola con animación */
/* escritorio: mismas pantallas con sufijo .d; el formulario de escritorio es form-empty y lo que solo existe en móvil vuelve al resumen */
var DESK = window.matchMedia('(min-width:1025px)').matches;
function pg(name, q){ var n = name; if (DESK) { if (n === 'g2-form-empty') n = 'form-empty'; else if (n === 'g2-registering') n = 'hub-after-1'; } return n + '.' + (DESK ? 'd' : 'm') + '.html' + (q || ''); }
function gal(p){ return p && p.k === 'selfie' ? '' : btn('gallery', I.img + 'Choose from gallery', 'sec'); }   /* el selfie solo se hace con la cámara: sin galería */
function fitTtl(p){ return p.k === 'selfie' ? 'Fit your face in the oval' : 'Fit the ' + p.t.toLowerCase() + ' in the frame'; }
function btn(a, label, cls, extra){ return '<button type="button" class="iv-b ' + (cls || 'pri') + '" data-a="' + a + '"' + (extra || '') + '>' + label + '</button>'; }

/* animación de "Get ready" de la maqueta del autofill (marco prep.html): anverso = modelo antiguo de Francia (líneas de lectura en el frente) */
function protoFor(p){
  var c = hasId(S.c) ? S.c : 'ES';
  if (p.k === 'front' && S.d === 'idold') return [S.c, OLD[S.c]];
  if (p.k === 'front') return [c, 'id:front'];
  if (p.k === 'back') return [c, 'id'];
  if (p.k === 'page') return [S.c || 'ES', 'passport'];
  return null;
}
function prepBody(pr){ return '<div class="iv-prepw"><iframe class="iv-prep" title="How to hold your document" scrolling="no" src="../autofill/prep.html" data-c="' + pr[0] + '" data-k="' + pr[1] + '"></iframe></div>'; }
/* comprobaciones en segundo plano de cada foto: documento → cara + líneas de lectura (MRZ); selfie → cara */
function checks(p){
  if (!p) return [];
  if (MODE === 'doc') return [{ k: 'mrz' }];                                 /* solo documento: únicamente el MRZ */
  if (p.k === 'selfie') return [{ k: 'face' }, { k: 'match' }];            /* selfie: cara + comprobación biométrica con el documento */
  if (p.k === 'back') return [{ k: 'mrz' }];                                /* reverso: solo el MRZ */
  if (p.k === 'page' || S.d === 'idold') return [{ k: 'face' }, { k: 'mrz' }];   /* pasaporte y DNI antiguo (FR, RO): cara + MRZ */
  return [{ k: 'face' }];                                                   /* anverso: solo la cara */
}
function failed(p){ return checks(p).filter(function(c){ return OUT === c.k || (OUT === 'both' && c.k !== 'match'); }).map(function(c){ return c.k; }); }
function errCopy(p){
  var f = failed(p), still = TRIES >= 2, both = f.length > 1, k = f[0], tips, ttl, b;
  if (both) { ttl = still ? 'We still can\'t verify your document' : 'We couldn\'t verify your document'; b = 'We couldn\'t find a face or read the lines of your document.'; }
  else if (k === 'mrz') { ttl = still ? 'We still can\'t read your document' : 'We couldn\'t read your document'; b = 'We couldn\'t read the lines of your document.'; }
  else if (k === 'match') { ttl = still ? 'We still can\'t match your selfie' : 'We couldn\'t match your selfie'; b = 'We couldn\'t confirm that your selfie matches the photo on your document.'; }
  else { ttl = still ? 'We still can\'t find your face' : 'We couldn\'t find your face'; b = p.k === 'selfie' ? 'We couldn\'t find a face in your selfie.' : 'We couldn\'t find a face in this photo.'; }
  tips = p.k === 'selfie' ? SELFIE_PART.tips : [[I.cam, 'Fit the whole document inside the frame'], [I.sun, 'Use good, even light and avoid glare'], [I.flat, 'Hold still until the photo is sharp']];
  return { ttl: ttl, b: b, tips: tips, s: still ? 'You can try once more with a new photo.' : 'This can happen if the photo is blurry, the picture is cut off or the light is poor.' };
}
function msgs(p){
  var tail = ['Still working on it…', 'Running an extra check…', 'Almost there, thanks for your patience…'], h = [];
  checks(p).forEach(function(c){ h.push(c.k === 'face' ? 'Analyzing your face…' : c.k === 'mrz' ? 'Reading the lines of your document…' : 'Comparing your selfie with your document…'); });
  if (p && p.k !== 'selfie') h.push('Checking the photo is sharp and complete…');
  return h.concat(tail);
}
function runChecks(){
  var P = parts(), p = P[S.i], cs = checks(p), bad = failed(p), n = P.length, ML = msgs(p), T = 30000, t0 = Date.now(), last = -1, tf = 0, pf = 0, pc = 0, ivl = 2800, R = 52, C = 2 * Math.PI * R;
  clearTimeout(tm);
  function draw(pc){ var pr = root && root.querySelector('#iv-pr'), tx = root && root.querySelector('#iv-pct'); if (!pr) return; pr.setAttribute('stroke-dashoffset', (C * (1 - pc / 100)).toFixed(1)); tx.textContent = Math.floor(pc) + '%'; tx.setAttribute('aria-valuenow', Math.floor(pc)); }
  function say(k){ var m = root && root.querySelector('#iv-msg'); if (!m) return; var L = ML.length, tail = L - 3, t = k < L ? ML[k] : ML[tail + (k - L) % 3]; m.classList.add('out'); setTimeout(function(){ if (m.isConnected) { m.textContent = t; m.classList.remove('out'); } }, 180); }
  function verdict(){
    var big = root.querySelector('#iv-ring'), h = root.querySelector('.iv-h'), m = root.querySelector('#iv-msg'), sub = root.querySelector('.iv-sub');
    if (bad.length) { big.classList.add('ko'); big.querySelector('.iv-pc').innerHTML = '<span class="iv-ckok ko">' + I.x + '</span>'; if (m) m.textContent = 'We found a problem with the photo.'; TRIES++; tm = setTimeout(function(){ go('error'); }, 900); return; }
    TRIES = 0; big.classList.add('ok'); railPre(); big.querySelector('.iv-pc').innerHTML = '<span class="iv-ckok">' + I.ok + '</span>'; if (h) h.textContent = 'Photo verified'; if (sub) sub.innerHTML = '&nbsp;'; if (m) m.textContent = 'Everything looks good.';
    tm = setTimeout(function(){ if (S.i < n - 1) { S.i++; go('intro'); } else { if (FROM === 'flow') { location.href = pg('g2-form-empty', '?ivd=1&ivc=' + encodeURIComponent(S.c) + '&ivk=' + encodeURIComponent(S.d) + '&ivn=' + encodeURIComponent((CATBY[S.c] || [])[1] || '')); return; } go('verifying'); tm = setTimeout(function(){ go('done'); }, 3200); } }, 900);
  }
  function resolve(k){
    var c = root && root.querySelector('.iv-chip[data-k="' + cs[k].k + '"]'); if (!c) return; var ko = bad.indexOf(cs[k].k) >= 0; c.className = 'iv-chip ' + (ko ? 'ko' : 'ok'); c.firstChild.innerHTML = ko ? I.x : I.okS;
    if (k + 1 < cs.length) tm = setTimeout(function(){ resolve(k + 1); }, 450); else tm = setTimeout(verdict, 600);
  }
  /* el tiempo real del backend no se conoce: la barra siempre sigue la misma curva lenta (96 % a los 30 s) y, cuando llega la respuesta, completa el 100 % desde donde esté */
  function loop(){
    if (!root || S.step !== 'checking') return;
    var el = Date.now() - t0;
    if (tf) {
      var q = Math.min(1, (Date.now() - tf) / 1000); draw(pf + (100 - pf) * (1 - Math.pow(1 - q, 2)));
      if (q >= 1) { tm = setTimeout(function(){ resolve(0); }, 350); return; }
      tm = setTimeout(loop, 30); return;
    }
    if (VT && el >= VT * 1000) { tf = Date.now(); pf = pc; var mm = root.querySelector('#iv-msg'); if (mm) mm.textContent = 'Finishing up…'; tm = setTimeout(loop, 0); return; }
    pc = el < T ? 96 * (1 - Math.pow(1 - el / T, 1.35)) : Math.min(99, 96 + Math.floor((el - T) / 5000));
    draw(pc);
    var k = Math.floor(el / ivl); if (k !== last) { last = k; if (k > 0) say(k); }
    tm = setTimeout(loop, 100);
  }
  loop();
}
var root = null, tm = 0;
function stepLabel(){ if (S.step === 'doc') return ''; var n = parts().length + 1; return 'Step ' + (S.i + 1) + ' of ' + n; }   /* anverso 1 · reverso 2 · selfie 3 · formulario 4 (con pasaporte: página 1 · selfie 2 · formulario 3) */   /* el "Step 1 of 4" aparece al llegar a la foto del anverso */
function view(){
  var P = parts(), p = P[S.i];
  if (S.step === 'doc') {
    var kinds = S.c ? kindsFor(S.c) : [];
    return { eye: '', ttl: 'Which document will you use?', sub: MODE === 'doc' ? 'We\'ll guide you through photographing it so we can read it.' : 'We\'ll guide you through each part of it and finish with a quick selfie.',
      body: '<label class="iv-lbl" for="iv-ctry">Nationality</label><div class="iv-selw"><select id="iv-ctry" class="iv-sel"><option value="">Choose a country</option>' + COUNTRIES.map(function(x){ return '<option value="' + x[0] + '"' + (x[0] === S.c ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></div>'
        + (S.c ? '<div class="iv-lbl">Document type</div><div class="iv-types n' + kinds.length + '" role="radiogroup" aria-label="Document type">' + kinds.map(function(k){ return '<button type="button" role="radio" aria-checked="' + (k === S.d) + '" class="iv-type' + (k === S.d ? ' on' : '') + '" data-a="type" data-k="' + k + '"><span class="iv-tic">' + ic(KIC[k], 22) + '</span><span class="iv-tl">' + kl(k) + '</span><span class="iv-rd"></span></button>'; }).join('') + '</div>' : '')
        + (S.c && S.d ? (function(){ var one = S.d === 'passport' || S.d === 'idold', two = !one && MODE !== 'doc', dOnly = MODE === 'doc';
          var imgs = dOnly && !one ? '<img src="' + sideImg(S.d, 'back') + '" alt="Back side of your ' + kl(S.d) + '">' : two ? '<img src="' + sideImg(S.d, 'front') + '" alt="Front side of your ' + kl(S.d) + '"><img src="' + sideImg(S.d, 'back') + '" alt="Back side of your ' + kl(S.d) + '">' : S.d === 'idold' ? '<img src="' + sideImg('idold', 'front') + '" alt="Front side of your ' + KLAB.idold + '">' : '<img src="' + IMG(S.c, 'passport') + '" alt="Photo page of your passport">';
          var ttl = S.d === 'passport' ? 'Photo page' : S.d === 'idold' ? 'Front side only' : dOnly ? 'Back side only' : 'Front and back side', sb = S.d === 'passport' ? 'The page with your photo and details' + (dOnly ? '.' : ', then a quick selfie.') : S.d === 'idold' ? 'The reading lines are on the front, so you don\'t need the back.' + (dOnly ? '' : ' Then a quick selfie.') : dOnly ? 'The reading lines are on the back of your document.' : 'Both sides of your document, then a quick selfie.';
          return '<div class="iv-pv"><div class="iv-pvi' + (two ? ' two' : '') + '">' + imgs + '</div><p class="iv-pvc"><b>You will photograph: ' + ttl + '</b><span>' + sb + '</span></p></div>'; })() : ''),
      act: btn('start', 'Continue', 'pri', S.d ? '' : ' disabled') };
  }
  if (S.step === 'intro') {
    var pr = protoFor(p);
    if (pr) return { eye: '', ttl: p.ttl, sub: 'Follow these tips for a sharp, readable photo.', pp: true, body: prepBody(pr), act: btn('cam', 'I\'m ready · Open camera', 'pri') + gal(p) };
    var stage = p.k === 'selfie' ? '<div class="iv-stage selfie"><video class="iv-selfie-anim" src="../selfie/' + SELFIE_VIDS[SV].src + '" autoplay muted playsinline role="img" aria-label="Take off your hat and glasses, then take your selfie"></video></div>' : '<div class="iv-stage"><img src="' + p.img + '" alt=""></div>';
    return { eye: 'Part ' + (S.i + 1) + ' of ' + P.length + ' · ' + p.t, ttl: p.ttl, sub: p.sub, body: stage + (p.steps ? '<ol class="iv-ssteps">' + p.steps.map(function(t, n){ return '<li data-at="' + SELFIE_VIDS[SV].at[n] + '"><i aria-hidden="true"><span class="ic">' + t[1] + '</span></i>' + t[0] + '</li>'; }).join('') + '</ol>' : '<ul class="iv-tips">' + p.tips.map(function(t){ return '<li><span>' + t[0] + '</span>' + t[1] + '</li>'; }).join('') + '</ul>'), act: btn('cam', I.cam + 'Open camera', 'pri') + gal(p) };
  }
  if (S.step === 'cam') {
    var pr2 = protoFor(p);
    if (pr2) return { eye: '', ttl: fitTtl(p), sub: '', pp: true, body: prepBody(pr2), act: btn('shoot', I.cam + 'Take photo', 'pri', DOCON ? '' : ' disabled') + gal(p) };
    var camMsg = CAMON ? (LIVE && CAMERR ? 'Camera unavailable · allow access' : 'Keep your whole face inside the oval') : (CAMW ? '<i class="iv-cspin"></i>Turning on camera…' : 'Camera is off');
    var inner = p.k === 'selfie' ? '<div class="iv-vf selfie ' + (CAMON ? 'on' : 'off') + '"><div class="iv-feed">' + (LIVE ? '' : '<img class="iv-feedimg" src="../selfie/selfie-photo.jpg" alt="" draggable="false">') + '</div><div class="iv-oval" data-oval>' + ghost() + '</div><span class="iv-chip">' + camMsg + '</span></div>' : '<div class="iv-vf"><span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span><img src="' + p.img + '" alt=""><i class="iv-scan"></i></div>';
    return { eye: 'Part ' + (S.i + 1) + ' of ' + P.length + ' · ' + p.t, ttl: fitTtl(p), sub: '', body: '<div class="iv-stage cam">' + inner + '<p class="iv-hint">' + (p.k === 'selfie' ? 'Look straight ahead · keep your face evenly lit' : 'Hold still until the photo is sharp') + '</p></div>',
      act: btn('shoot', I.cam + 'Take photo', 'pri', p.k === 'selfie' && !CAMON ? ' disabled' : '') + gal(p) };
  }
  if (S.step === 'adjust') {
    var selfieAdj = p.k === 'selfie';
    return { eye: 'Part ' + (S.i + 1) + ' of ' + P.length + ' · ' + p.t, ttl: fitTtl(p), sub: '',
      body: '<div class="iv-adj' + (selfieAdj ? ' selfie' : '') + '"><div class="iv-adj-st" data-adj><img class="iv-adj-img" src="' + S.img + '" alt="Your photo" draggable="false"><div class="iv-adj-fr">' + (selfieAdj ? '' + ghost() + '' : '') + '</div>' + (selfieAdj ? '' : adjMock(p)) + '<span class="iv-chip">' + (selfieAdj ? 'Drag and zoom to fit your face in the oval' : 'Drag and zoom to fit it inside the frame') + '</span></div>'
        + '<div class="iv-adj-z"><button type="button" data-z="-1" aria-label="Zoom out">' + ic('<path d="M5 12h14"/>', 18) + '</button><input type="range" class="iv-adj-r" min="1" max="4" step="0.01" value="1" aria-label="Zoom"><button type="button" data-z="1" aria-label="Zoom in">' + ic('<path d="M12 5v14M5 12h14"/>', 18) + '</button></div></div>',
      act: btn('adjconfirm', 'Confirm photo', 'pri') + btn('gallery', I.img + 'Choose another photo', 'sec') };
  }
  if (S.step === 'checking') { var cs = checks(p), R = 52, C = (2 * Math.PI * R).toFixed(1); return { eye: '', ttl: 'Checking your photo', sub: 'Please keep this screen open.', body: '<div class="iv-mid iv-pg">'
    + '<div class="iv-ring" id="iv-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="ivg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a6cff"/><stop offset="1" stop-color="#8aa2ff"/></linearGradient></defs><circle class="tr" cx="60" cy="60" r="' + R + '"/><circle class="pr" id="iv-pr" cx="60" cy="60" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/></svg><div class="iv-pc"><b id="iv-pct" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">0%</b></div></div>'
    + '<p class="iv-msg" id="iv-msg" role="status" aria-live="polite">' + msgs(p)[0] + '</p>'
    + '<div class="iv-chips">' + cs.map(function(c){ return '<span class="iv-chip" data-k="' + c.k + '"><i></i>' + (c.k === 'face' ? 'Face' : c.k === 'mrz' ? 'Document lines' : 'Match with document') + '</span>'; }).join('') + '</div></div>', act: '' }; }
  if (S.step === 'error') { var er = errCopy(p); return { eye: '', ttl: er.ttl, sub: '', err: true, body: '<div class="iv-alert">' + I.warn + '<div><b>' + er.b + '</b><span>' + er.s + '</span></div></div><ul class="iv-etips">' + er.tips.map(function(t){ return '<li><span>' + t[0] + '</span>' + t[1] + '</li>'; }).join('') + '</ul>', act: btn('cam', 'Retake photo', 'pri') + gal(p) }; }
  if (S.step === 'verifying') return { eye: '', ttl: MODE === 'doc' ? 'Verifying your document…' : 'Verifying your identity…', sub: '&nbsp;', body: '<div class="iv-mid"><i class="iv-spin"></i><ol class="iv-vs"><li class="d">Document read</li>' + (MODE === 'doc' ? '<li class="a">Checking the reading lines</li><li>Document confirmed</li>' : '<li class="a">Matching your selfie</li><li>Identity confirmed</li>') + '</ol></div>', act: '' };
  var toForm = FROM === 'flow';
  return { eye: '', ttl: MODE === 'doc' ? 'Document verified' : 'Identity verified', sub: (NAME ? esc(NAME) + ', your' : 'Your') + (MODE === 'doc' ? ' document has been read.' : ' document and selfie match.'), body: '<div class="iv-mid ok"><span class="iv-okc">' + I.ok + '</span>' + (toForm ? '<p class="iv-note go"><i class="iv-spin sm"></i>Taking you to your details…</p>' : '<p class="iv-note">' + I.shield + 'Your photos are used only to verify your identity.</p>') + '</div>', act: toForm ? '' : btn('fin', FROM === 'hub' ? 'Back to summary' : 'Continue', 'pri') };
}

/* Elegir de la galería: abre el selector nativo del dispositivo; la imagen se encuadra (mover / ampliar) contra el marco guía y se confirma o se elige otra */
function pickFile(){
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  inp.addEventListener('change', function(){
    var f = inp.files && inp.files[0]; if (inp.parentNode) inp.parentNode.removeChild(inp); if (!f || !/^image\//.test(f.type)) return;
    if (S.img) { try { URL.revokeObjectURL(S.img); } catch (e) {} }
    S.img = URL.createObjectURL(f); clearTimeout(tm); go('adjust'); if (window.__ivGalleryShare) window.__ivGalleryShare();
  });
  document.body.appendChild(inp); inp.click();
}
/* cámara real (Controles > Cámara real): detrás del óvalo del selfie o del marco del documento se ve la cámara del dispositivo */
var LIVE = false; try { LIVE = localStorage.getItem('rep-livecam') === '1'; } catch (e) {}
var CAM = null;
function camStop(){ CAMREQ = false; if (CAM) { try { CAM.getTracks().forEach(function(t){ t.stop(); }); } catch (e) {} CAM = null; } }
var CAMERR = false, CAMREQ = false, CAMW = false, CAMT0 = 0;
function camStart(){
  if (!LIVE || S.step !== 'cam' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  function attach(tries){
    var p = parts()[S.i], selfie = p && p.k === 'selfie', v, fr = root && root.querySelector('.iv-prep');
    if (selfie) { var vf = root && root.querySelector('.iv-vf.selfie'); if (!vf) return; v = vf.querySelector('.iv-live'); if (!v) { v = document.createElement('video'); v.className = 'iv-live'; v.muted = true; v.setAttribute('playsinline', ''); v.setAttribute('autoplay', ''); vf.querySelector('.iv-feed').appendChild(v); } }
    else { var d = fr && fr.contentDocument; v = d && d.querySelector('.cam-video'); if (!v) { if (tries < 30) setTimeout(function(){ attach(tries + 1); }, 150); return; } var st = d.querySelector('.stage.cam'); if (st && !st.classList.contains('has-video')) { camCue(st, function(){ if (st.isConnected) st.classList.add('has-video'); }); } }
    v.srcObject = CAM; var pl = v.play(); if (pl && pl.catch) pl.catch(function(){});
  }
  if (CAM) { attach(0); return; }   /* la cámara sigue abierta entre repintados */
  if (CAMREQ) return;
  var p0 = parts()[S.i], selfie0 = p0 && p0.k === 'selfie'; CAMREQ = true; CAMERR = false;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: selfie0 ? 'user' : 'environment' }, audio: false }).then(function(m){
    CAMREQ = false; if (S.step !== 'cam') { m.getTracks().forEach(function(t){ t.stop(); }); return; }
    CAM = m; attach(0);
  }).catch(function(){ CAMREQ = false; CAMERR = true; });
}
/* cámara del documento «con encendido»: arranca apagada («Turning on camera…») y se abre en círculo como la del selfie; entonces arranca la animación de siempre (el documento viaja y se convierte en el mockup) */
function docCamStart(){
  var w = root && root.querySelector('.iv-prepw'); if (!w || w.querySelector('.iv-camoff')) return;
  var off = document.createElement('div'); off.className = 'iv-camoff'; off.innerHTML = '<span class="iv-chip"><i class="iv-cspin"></i>Turning on camera…</span>'; w.appendChild(off);
  setTimeout(function(){
    if (S.step !== 'cam' || !off.isConnected) return; off.classList.add('lift');
    var fr = root.querySelector('.iv-prep'); if (fr && fr.contentWindow) { try { fr.contentWindow.postMessage({ rep: 'cam-go', c: fr.getAttribute('data-c'), k: fr.getAttribute('data-k') }, '*'); } catch (e) {} }
    setTimeout(function(){ if (S.step === 'cam') { DOCON = true; paint(); } }, 700);
    setTimeout(function(){ if (off.parentNode) off.parentNode.removeChild(off); }, 1100);
  }, 1200);
}
/* la cámara del documento usa los mismos niveles que la galería: mockup al 60 % con sombra fina, fondo claro (atenuación del 28 % solo fuera del marco) */
function camLook(){
  [].forEach.call((root || document).querySelectorAll('.iv-prep'), function(f){
    var skin = function(){ try { var d = f.contentDocument; if (!d || !d.head || d.getElementById('rep-camlook')) return; var t = d.createElement('style'); t.id = 'rep-camlook';
      t.textContent = '.cam-mock{opacity:.6!important;filter:drop-shadow(0 0 2px rgba(0,0,0,.55))}.cam-mock>*{opacity:1!important}.stage.cam.has-video .cam-scrim{background:none!important;opacity:0!important}.stage.cam.has-video .cam-frame{box-shadow:0 0 0 999px rgba(9,10,32,.72);border-radius:7px}.iv-veil{position:absolute;inset:0;z-index:60;pointer-events:none;transition:opacity .45s ease}.iv-veil.lift{opacity:0}.iv-veil>span{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:99px;background:rgba(255,255,255,.16);color:#fff;font:600 12.5px/17px Poppins,system-ui,sans-serif;white-space:nowrap}.iv-veil>span i{display:inline-block;width:12px;height:12px;margin-right:7px;vertical-align:-1px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:ivSp .8s linear infinite;box-sizing:border-box}@keyframes ivSp{to{transform:rotate(360deg)}}@keyframes camFade{from{opacity:0}to{opacity:1}}.stage.cam:not(.has-video) .cam-video{opacity:0}.stage.cam.has-video .cam-video{animation:camFade .6s ease both!important}'; d.head.appendChild(t); } catch (e) {} };
    if (!f.__look) { f.__look = 1; f.addEventListener('load', skin); } skin();
  });
}
/* cámara real del documento: el visor arranca «apagado» (velo oscuro con «Turning on camera…», como el selfie) y el velo se abre en círculo al terminar la transición del documento al mockup */
/* sincroniza la cámara con el documento: arranca justo cuando la imagen del documento empieza a desaparecer (y el mockup a salir) */
function camCue(st, fn){
  var done = false, img = st.querySelector('.cam-card img');
  function go(){ if (done) return; done = true; fn(); }
  if (img) {
    img.addEventListener('animationstart', function(e){ if (/imgOut/.test(e.animationName || '')) go(); });
    try { if ((img.getAnimations ? img.getAnimations() : []).some(function(a){ return a.animationName === 'imgOut' && a.currentTime >= 1300; })) { go(); return; } } catch (e) {}
  }
  setTimeout(go, Math.max(0, CAMT0 - Date.now()) + 1500);
}
function veilStart(){
  var fr = root && root.querySelector('.iv-prep'); if (!fr) return; var n = 0;
  (function wait(){
    var d = null; try { d = fr.contentDocument; } catch (e) {}
    var st = d && d.querySelector('.stage.cam');
    if (!st) { if (n++ < 40 && S.step === 'cam') setTimeout(wait, 100); return; }
    if (d.querySelector('.iv-veil')) return;
    var v = d.createElement('div'); v.className = 'iv-veil'; v.innerHTML = '<span><i></i>Turning on camera…</span>'; st.appendChild(v);
    camCue(st, function(){ if (!v.isConnected) return; v.classList.add('lift'); setTimeout(function(){ if (v.parentNode) v.parentNode.removeChild(v); }, 900); });
  })();
}
function ovalInit(){
  var o = document.querySelector('[data-oval]'); if (!o) return; var st = o.closest('.iv-stage');
  function size(){ var H = st.clientHeight, W = st.clientWidth, h = Math.min(H * 0.9, W * 0.94 / 0.78); o.style.height = h + 'px'; o.style.width = (h * 0.78) + 'px'; }   /* el óvalo ocupa casi todo el visor: la cara sale lo más grande posible */
  size(); window.addEventListener('resize', function(){ if (document.querySelector('[data-oval]') === o) size(); });
}
function adjustInit(){
  var st = document.querySelector('.iv-adj-st'); if (!st) return;
  var img = st.querySelector('.iv-adj-img'), fr = st.querySelector('.iv-adj-fr'), rg = document.querySelector('.iv-adj-r'), selfie = !!document.querySelector('.iv-adj.selfie');
  var A = { x: 0, y: 0, z: 1, s0: 1, iw: 1, ih: 1, fw: 1, fh: 1 };
  window.__adjFrame = function(w, h){ A.fw = w; A.fh = h; fr.style.width = w + 'px'; fr.style.height = h + 'px'; A.s0 = Math.max(A.fw / A.iw, A.fh / A.ih); apply(); };
  function frame(){
    var W = st.clientWidth, H = st.clientHeight;
    if (selfie) { A.fh = Math.min(H * 0.92, W * 0.94 / 0.78); A.fw = A.fh * 0.78; } else { A.fw = Math.min(W * 0.9, H * 0.86 * 1.586); A.fh = A.fw / 1.586; }
    fr.style.width = A.fw + 'px'; fr.style.height = A.fh + 'px';
    A.s0 = Math.max(A.fw / A.iw, A.fh / A.ih);
  }
  function apply(){
    var s = A.s0 * A.z, mx = Math.max(0, (A.iw * s - A.fw) / 2), my = Math.max(0, (A.ih * s - A.fh) / 2);
    A.x = Math.max(-mx, Math.min(mx, A.x)); A.y = Math.max(-my, Math.min(my, A.y));
    img.style.transform = 'translate(-50%,-50%) translate(' + A.x + 'px,' + A.y + 'px) scale(' + s + ')'; if (rg) rg.value = A.z;
  }
  function setZ(z){ var old = A.z; A.z = Math.max(1, Math.min(4, z)); var k = A.z / old; A.x *= k; A.y *= k; apply(); }
  function ready(){ A.iw = img.naturalWidth || 1; A.ih = img.naturalHeight || 1; img.style.width = A.iw + 'px'; img.style.height = A.ih + 'px'; frame(); apply(); }
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready);
  window.addEventListener('resize', function(){ if (document.querySelector('.iv-adj-st') === st) { frame(); apply(); } });
  var P = {}, last = null, d0 = 0, z0 = 1;
  st.addEventListener('pointerdown', function(e){ try { st.setPointerCapture(e.pointerId); } catch (x) {} P[e.pointerId] = [e.clientX, e.clientY]; var ks = Object.keys(P); if (ks.length === 2) { d0 = Math.hypot(P[ks[0]][0] - P[ks[1]][0], P[ks[0]][1] - P[ks[1]][1]); z0 = A.z; } st.classList.add('drag'); });
  st.addEventListener('pointermove', function(e){
    if (!P[e.pointerId]) return; var ks = Object.keys(P), prev = P[e.pointerId]; P[e.pointerId] = [e.clientX, e.clientY];
    if (ks.length >= 2) { var dd = Math.hypot(P[ks[0]][0] - P[ks[1]][0], P[ks[0]][1] - P[ks[1]][1]); if (d0) setZ(z0 * dd / d0); }
    else { A.x += e.clientX - prev[0]; A.y += e.clientY - prev[1]; apply(); }
  });
  var up = function(e){ delete P[e.pointerId]; if (!Object.keys(P).length) st.classList.remove('drag'); };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  st.addEventListener('wheel', function(e){ e.preventDefault(); setZ(A.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  if (rg) rg.addEventListener('input', function(){ setZ(parseFloat(rg.value)); });
  [].forEach.call(document.querySelectorAll('.iv-adj-z [data-z]'), function(b){ b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); setZ(A.z + 0.25 * parseInt(b.getAttribute('data-z'), 10)); }); });
}
/* vista previa del documento: se coloca apilada (arriba/abajo) o en paralelo (izquierda/derecha) según el espacio, para que se vea grande sin apretar la página */
var PVRO = null;
/* galería: el mockup del documento es el mismo de la cámara (el visor de la maqueta del autofill), no la foto del documento */
function adjMock(p){ var pr = protoFor(p); return pr ? '<iframe class="iv-adj-mock" title="" tabindex="-1" aria-hidden="true" scrolling="no" src="../autofill/prep.html" data-c="' + pr[0] + '" data-k="' + pr[1] + '"></iframe>' : ''; }
function adjMockInit(){
  var f = document.querySelector('.iv-adj-mock'); if (!f) return; var st = f.parentNode;
  /* el marco de encuadre (recorte claro) mide y se coloca igual que el marco azul del mockup de la cámara */
  function place(){
    var fr = st.querySelector('.iv-adj-fr'); if (!fr || !f.isConnected) return; var fw = fr.offsetWidth, W = Math.round(fw + 60), H = Math.round(W * 536 / 358), cf = null, d = null;
    f.style.width = W + 'px'; f.style.height = H + 'px';
    try { d = f.contentDocument; cf = d && d.querySelector('.cam-frame'); } catch (e) {}
    var cx = W / 2, cy = H / 2;
    if (cf && cf.offsetWidth > 40) { try { var c1 = cf.querySelector('.c.tl'), rr = c1 && parseFloat(f.contentWindow.getComputedStyle(c1).borderTopLeftRadius); if (rr >= 0) { fr.style.borderRadius = rr + 'px'; fr.style.borderWidth = '0'; } } catch (e) {} if (window.__adjFrame && !f.__fit) { f.__fit = 1; var ccs = f.contentWindow.getComputedStyle(cf); window.__adjFrame(parseFloat(ccs.width) || cf.offsetWidth, parseFloat(ccs.height) || cf.offsetHeight); } var cr = cf.getBoundingClientRect(); cx = cr.left + cr.width / 2; cy = cr.top + cr.height / 2; }   /* el centro no cambia con la animación de escala; sin redondear: alineación al subpíxel */
    f.style.left = (st.clientWidth / 2 - cx) + 'px'; f.style.top = (st.clientHeight / 2 - cy) + 'px';
  }
  function skin(){ try { var d = f.contentDocument; if (!d || d.getElementById('rep-adjmock')) return; var t = d.createElement('style'); t.id = 'rep-adjmock'; var base = 'html,body,#root,.stage,.stage.cam{background:transparent!important}.cam-bg,.cam-scrim,.cam-video,.cam-chip,.dialog-top,.dialog-actions,.step-label,#dialog-title,.steps,.dialog-body>.hint,.cam-note,.scan{display:none!important}.cam-card img{opacity:0!important}.cam-mock,.cam-mock>*{opacity:1!important}';
    t.textContent = base + '.cam-card{background:transparent}.cam-mock{opacity:.6!important;filter:drop-shadow(0 0 2px rgba(0,0,0,.55))}'; d.head.appendChild(t); } catch (e) {} }
  var go = function(){ skin(); place(); try { f.contentWindow.postMessage({ rep: 'cam-go', c: f.getAttribute('data-c'), k: f.getAttribute('data-k') }, '*'); } catch (e) {} };
  place(); window.addEventListener('resize', function(){ f.__fit = 0; place(); }); f.addEventListener('load', function(){ skin(); place(); setTimeout(go, 60); });
  window.addEventListener('message', function(e){ if (e.source === f.contentWindow && e.data && e.data.rep === 'prep-ready') go(); });
  var tries = 0, iv = setInterval(function(){ if (!f.isConnected || f.__fit || tries++ > 80) { clearInterval(iv); return; } try { place(); } catch (e) {} }, 120);   /* hasta que el marco del mockup esté maquetado */
}
function pvFit(){
  if (PVRO) { try { PVRO.disconnect(); } catch (e) {} PVRO = null; }
  var box = document.querySelector('.iv-pvi'); if (!box) return;
  var imgs = [].slice.call(box.querySelectorAll('img')); if (!imgs.length) return;
  var CAP = 380, GAP = 14;   /* ni gigante ni pegado: tope de ancho por documento y separación entre ambos */
  function fit(){
    var W = box.clientWidth, H = box.clientHeight - 20; if (!W || H < 40) return;   /* 10 px de aire arriba y abajo */
    var ar = imgs.map(function(i){ return i.naturalWidth && i.naturalHeight ? i.naturalWidth / i.naturalHeight : 1.586; });
    var put = function(i, w){ i.style.width = Math.round(w) + 'px'; i.style.height = 'auto'; i.style.maxWidth = 'none'; i.style.maxHeight = 'none'; i.style.flex = 'none'; };
    if (imgs.length === 1) { put(imgs[0], Math.max(60, Math.min(W, H * ar[0], CAP))); return; }
    var wSt = Math.min(W, (H - GAP) / 2 * ar[0], CAP), wSd = Math.min((W - GAP) / 2, H * ar[0], CAP);
    var side = wSd > wSt * 1.1;   /* en paralelo solo si el documento sale claramente más grande */
    box.classList.toggle('side', side); var w = Math.max(60, side ? wSd : wSt); imgs.forEach(function(i){ put(i, w); });
  }
  fit(); imgs.forEach(function(i){ if (!i.complete) i.addEventListener('load', fit); });
  if (window.ResizeObserver) { PVRO = new ResizeObserver(fit); PVRO.observe(box); }
}
function paint(){
  if (!root) return; var v = view(), main = root.querySelector('.iv-main'), keep = v.pp && main.querySelector('.iv-prepw');
  root.className = 'iv-m iv-s-' + S.step + (v.err ? ' iv-err' : '');
  var sk = ['doc', 'intro', 'cam', 'error'].indexOf(S.step) >= 0;   /* «Skip for now» se mantiene en el mismo sitio (a la derecha del título) hasta el formulario */
  var dtop = DESK ? '<div class="dbk-row iv-dtop"><button type="button" class="dbk-pill" data-a="prev" data-dbk="Back" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><i class="dbk-sep" aria-hidden="true">/</i><span class="dbk-eye">Identity verification' + (stepLabel() ? ' · ' + stepLabel() : '') + '</span></div>' : '';
  var head = dtop + '<div class="iv-hr' + (sk ? ' hs' : '') + '"><h1 class="iv-h">' + v.ttl + '</h1>' + (sk ? '<button type="button" class="iv-skipb" data-a="skip">Skip for now</button>' : '') + '</div>' + (v.sub ? '<p class="iv-sub">' + v.sub + '</p>' : '');
  if (keep) {   /* intro ⇄ cámara: se conserva el marco y solo cambian el título y los botones */
    var tmp = document.createElement('div'); tmp.innerHTML = head;
    [].slice.call(main.children).forEach(function(n){ if (!n.classList.contains('iv-prepw')) main.removeChild(n); });
    while (tmp.lastChild) main.insertBefore(tmp.lastChild, main.firstChild);
    var fr = main.querySelector('.iv-prep'); if (fr && fr.contentWindow && !(S.step === 'cam' && DCAM === 'anim')) fr.contentWindow.postMessage({ rep: S.step === 'cam' ? 'cam-go' : 'prep-go', c: fr.getAttribute('data-c'), k: fr.getAttribute('data-k') }, '*');
  } else main.innerHTML = head + v.body;
  var ft = root.querySelector('.iv-ft'); ft.innerHTML = v.act; ft.style.display = v.act ? '' : 'none';
  try { localStorage.setItem('rep-ivn', String(parts().length + 1)); } catch (e) {}
  if (window.__mobBar) window.__mobBar.sub(stepLabel()); var sb = document.querySelector('header .mb-sub'); if (sb) sb.style.display = stepLabel() ? '' : 'none';
  selfieVid(); adjustInit(); camLook(); adjMockInit(); railPaint(); ovalInit(); pvFit(); if (S.step === 'cam') camStart(); else camStop();
  var bk = document.querySelector('header button[aria-label="Back"]'); if (bk) { bk.removeAttribute('data-to'); bk.setAttribute('data-a', 'prev'); }
}
var RC = 0;   /* centro vertical del anillo de «Checking your photo»: el spinner y el círculo de «Verified» se colocan exactamente ahí */
function go(st){
  var rg = root && root.querySelector('#iv-ring'); if (rg) { var rb = rg.getBoundingClientRect(); RC = rb.top + rb.height / 2; }
  S.step = st; paint();
  if (RC && (st === 'verifying' || st === 'done') && root) {
    var el = root.querySelector('.iv-spin:not(.sm), .iv-okc'), mid = root.querySelector('.iv-mid');
    if (el && mid) { var eb = el.getBoundingClientRect(); mid.style.transform = 'translateY(' + Math.round(RC - (eb.top + eb.height / 2)) + 'px)'; }
  }
  if (st === 'checking' || st === 'doc' || st === 'cam') RC = 0;
}
function onClick(e){
  var t = e.target.closest('[data-a]'); if (!t || t.disabled) return; e.preventDefault(); e.stopPropagation();
  var a = t.getAttribute('data-a'), n = parts().length;
  if (a === 'type') { S.d = t.getAttribute('data-k'); return paint(); }
  if (a === 'skip') { if (window.__ivSkip) window.__ivSkip.open({ progress: S.i > 0 || ['error', 'checking', 'verifying', 'done'].indexOf(S.step) >= 0, go: null, to: FROM === 'flow' ? pg('g2-form-empty') : FROM === 'form' ? pg('g2-registering', '?gn=' + encodeURIComponent(NAME)) : pg('hub-after-1') }); return; }
  if (a === 'start') { S.i = 0; return go('intro'); }
  if (a === 'cam') { CAMT0 = Date.now() + 2300 + (DCAM === 'anim' ? 1200 : 0); CAMON = false; clearTimeout(CAMT); var pc = parts()[S.i], sf = pc && pc.k === 'selfie'; CAMW = !!sf; if (window.__camSync) window.__camSync(); go('cam');
    if (sf) { var t0 = Date.now(); (function w(){ if (S.step !== 'cam') return; var el = Date.now() - t0; if (el >= 1300 && (!LIVE || CAM || CAMERR || el > 6000)) { CAMW = false; CAMON = true; if (window.__camSync) window.__camSync(); paint(); } else CAMT = setTimeout(w, 150); })(); }
    if (!sf && DCAM === 'anim' && protoFor(pc)) { DOCON = false; paint(); docCamStart(); } else DOCON = true;
    if (!sf && LIVE && DCAM !== 'anim' && protoFor(pc)) veilStart();
    return; }
  if (a === 'back') return go('intro');
  if (a === 'shoot') { go('checking'); runChecks(); return; }
  if (a === 'gallery') return pickFile();
  if (a === 'adjconfirm') { go('checking'); runChecks(); return; }
  if (a === 'fin') { location.href = FROM === 'flow' ? pg('g2-form-empty') : FROM === 'form' ? pg('g2-registering', '?gn=' + encodeURIComponent(NAME)) : pg('hub-after-1'); return; }
  if (a === 'prev') {
    var sp = S.step, toDoc = function(){ clearTimeout(tm); S.i = 0; TRIES = 0; go('doc'); };
    /* con fotos ya tomadas no se puede volver a la foto anterior: «atrás» lleva a elegir documento y hay que repetir las fotos, y el aviso lo dice */
    var ask = function(fn){ if (window.__leave && window.__leave.askBack) window.__leave.askBack(fn, { title: 'Go back to document selection?', text: 'You\'ll return to choosing the document you\'ll use. The photos you\'ve taken so far will be discarded and you\'ll need to take them again.', go: 'Back to document selection' }); else fn(); };
    if (sp === 'doc') { clearTimeout(tm); location.href = FROM === 'flow' ? pg('iv-intro-f') : FROM === 'hub' ? pg('iv-intro-h') : pg('g2-form-empty'); return; }
    if (sp === 'adjust') { clearTimeout(tm); return go('intro'); }   /* la foto aún no está confirmada: sin aviso */
    if (sp === 'cam') { clearTimeout(tm); return go('intro'); }   /* de la cámara a las instrucciones: sin aviso */
    if (sp === 'intro') { if (S.i > 0) return ask(toDoc); clearTimeout(tm); return go('doc'); }
    if (sp === 'error') { if (S.i > 0) return ask(toDoc); clearTimeout(tm); return go('intro'); }
    if (sp === 'checking' || sp === 'verifying' || sp === 'done') return ask(toDoc);
    return;
  }
}
window.addEventListener('message', function(e){
  var m = e.data; if (!m || !root || m.rep !== 'prep-ready') return; var fr = root.querySelector('.iv-prep'); if (!fr || e.source !== fr.contentWindow) return;
  if (S.step === 'cam' && DCAM === 'anim') return;
  fr.contentWindow.postMessage({ rep: S.step === 'cam' ? 'cam-go' : 'prep-go', c: fr.getAttribute('data-c'), k: fr.getAttribute('data-k') }, '*');
});
/* escritorio: el panel de Vela de toda la verificación es el de la intro («Verify your identity»): mismo texto, «Good to know» con «Privacy protected» y «No camera?» con el QR */
/* panel de Vela según el paso: antes de las fotos («Privacy protected» el primero); desde el paso 1 de N: «Your verification» con el progreso + «Privacy protected» + «No camera?» */
var RK = '', RPC = null;   /* RPC: paso del progreso en la última pintura, para animar el avance */
var RI = { id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6.5 16c.6-1.2 1.5-1.8 2.5-1.8s1.9.6 2.5 1.8"/>', scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M8 12h8"/>', who: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>', doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' };
function rsvg(p, w){ return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
/* recomendaciones del panel de Vela mientras se ve la imagen: con la cámara, cómo tomar la foto; desde la galería, cómo debe ser la foto elegida */
function photoTips(p, gallery){
  var k = p ? p.k : 'front', corners = rsvg(RI.scan, 18);
  if (k === 'selfie') return gallery
    ? { h: 'Choose a good selfie', t: [[I.user, 'Only you, face fully visible', 'No hats, sunglasses, masks or other people.'], [I.eye, 'Looking straight ahead', 'A front-facing photo, not a profile or a tilted head.'], [I.sun, 'Well lit and sharp', 'Even light on your face, no blur and no heavy shadows.'], [I.img, 'Recent and unedited', 'A photo that looks like you today, without filters.']] }
    : { h: 'Tips for your selfie', t: [[I.user, 'Keep your face inside the oval', 'Centered, with your whole face in view.'], [I.sun, 'Face the light', 'Even light on your face, with no shadows or backlight.'], [I.eye, 'Look at the camera', 'Straight ahead, with a neutral expression.'], [I.flat, 'Take off hats and sunglasses', 'Nothing covering your face.']] };
  var reading = k === 'back' ? 'Keep the reading lines in view' : k === 'page' ? 'Keep the two lines at the bottom in view' : 'Show the side with your photo';
  return gallery
    ? { h: 'Choose a good photo', t: [[I.img, 'Use the original photo', 'Not a screenshot or a photo of a screen.'], [corners, 'All four corners visible', 'The document uncropped, with a little margin.'], [I.sun, 'Sharp, with no glare', 'Readable text and no flash reflections.'], [I.lines, k === 'back' ? 'Reading lines in view' : k === 'page' ? 'The two lines at the bottom in view' : 'Straight-on and unedited', k === 'front' ? 'Not tilted, and with no filters.' : 'Not tilted, and with no filters.']] }
    : { h: 'Tips for a good photo', t: [[I.flat, 'Lay it flat on a plain surface', 'A dark, uncluttered background works best.'], [corners, 'Fit it inside the frame', 'All four corners in view, filling the guide.'], [I.sun, 'Avoid glare and shadows', 'Tilt away from lights and don\'t use flash.'], [I.lines, reading, 'And keep your fingers off the edges.']] };
}
function railPaint(force){
  if (!DESK) return; var asd = document.querySelector('aside'); if (!asd || !asd.__iv) return;
  var P = parts(), n = P.length, steps = stepLabel() !== '', cur = (S.step === 'verifying' || S.step === 'done') ? n : S.i;
  var tipOn = steps && (S.step === 'cam' || S.step === 'adjust') && cur < n, key = steps ? 'p' + n + ':' + cur + (tipOn ? ':' + S.step : '') : 'i'; if (!force && key === RK) return; RK = key;
  asd.innerHTML = asd.__iv; asd.classList.remove('fx-nointro');
  var qr = [].filter.call(asd.querySelectorAll('svg'), function(v){ return v.getBoundingClientRect().width > 80; })[0]; if (qr) qr.setAttribute('data-qr', '1');
  var gk = asd.querySelector('section'); if (!gk) return;
  var items = [].slice.call(gk.children).filter(function(e){ return e.tagName === 'DIV'; }), doc = items[0], priv = items[1], head = gk.querySelector(':scope > span');
  if (!doc || !priv) return;
  if (!steps) {
    RPC = null;
    gk.insertBefore(priv, doc);   /* «Privacy protected» primero */
    if (window.__railFit) window.__railFit();
    return;
  }
  /* desde el paso 1: se quita «Good to know» y su primer campo; arriba, el progreso */
  gk.removeChild(doc);   /* «Good to know» se queda solo con «Privacy protected» */
  if (qr) { var nc = qr; while (nc.parentElement && nc.parentElement !== asd && !/Good to know|Your verification/.test(nc.parentElement.textContent)) nc = nc.parentElement; nc.style.display = 'none'; }   /* desde el paso 1 se quita toda la sección «No camera?» */
  var sec2 = gk.cloneNode(false); sec2.classList.add('iv-rv0');   /* desde el paso 1: sin texto de intro, y el progreso sin título de sección ni icono */
  asd.classList.add('fx-nointro');
  var pr = priv.cloneNode(true); var pic = pr.querySelector('span'); if (pic && pic.querySelector('svg')) pic.parentNode.removeChild(pic); pr.querySelector('strong').textContent = 'Where you are in your registration'; var pd = pr.querySelector('strong').nextElementSibling; if (pd) pd.textContent = 'A few quick steps — we\'ll guide you through each one.';
  var animFrom = (RPC !== null && RPC < cur) ? RPC : null; RPC = cur;
  var tipsL = P.map(function(p, i){ return 'Step ' + (i + 1) + ' · ' + (p.k === 'selfie' ? 'Selfie (biometrics)' : p.k === 'back' ? 'Back side photo' : p.k === 'page' ? 'Photo page' : 'Front side photo'); }); tipsL.push('Step ' + (P.length + 1) + ' · Your details');
  try { localStorage.setItem('rep-ivtips', JSON.stringify(tipsL)); } catch (e) {}
  var kinds = n === 1 ? (P[0].k === 'back' ? ['scan'] : ['id']) : P.map(function(p){ return p.k === 'selfie' ? 'who' : p.k === 'back' ? 'scan' : 'id'; }); kinds.push('doc');
  try { localStorage.setItem('rep-ivkinds', kinds.join(',')); } catch (e) {}
  var st = '<div class="iv-vst" role="img" aria-label="' + stepLabel() + '">' + kinds.map(function(k, i){ var cs0 = animFrom !== null ? animFrom : cur; var cls = i < cs0 ? 'done' : i === cs0 ? 'now' : ''; return (i ? '<i class="iv-vl' + (i <= cs0 ? ' on' : '') + '"></i>' : '') + '<span class="iv-vc ' + cls + '" tabindex="0" data-tip="' + tipsL[i] + '"><b>' + rsvg(i < cs0 ? RI.ok : RI[k], 20) + '</b></span>'; }).join('') + '</div>';
  var body = pr.querySelector('.min-w-0'); if (body) body.insertAdjacentHTML('beforeend', st);
  sec2.appendChild(pr); gk.parentNode.insertBefore(sec2, gk);
  if (tipOn) {
    var tp = photoTips(P[S.i], S.step === 'adjust'), sec3 = gk.cloneNode(false), h3 = head ? head.cloneNode(true) : null;
    if (h3) { h3.textContent = tp.h; sec3.appendChild(h3); }
    var ul = document.createElement('div'); ul.className = 'iv-rtips';
    ul.innerHTML = tp.t.map(function(t){ return '<div class="iv-rtip"><i>' + t[0] + '</i><p><b>' + t[1] + '</b><span>' + t[2] + '</span></p></div>'; }).join('');
    sec3.appendChild(ul); gk.after(sec3);   /* debajo de «Good to know» («Privacy protected») */
    if (asd.scrollHeight > asd.clientHeight + 1) ul.classList.add('c');   /* si no cabe, solo los títulos */
  }
  if (animFrom !== null) railAnim(sec2.querySelector('.iv-vst'), kinds, animFrom, cur);
  if (window.__railFit) window.__railFit();
}
/* avance del progreso de Vela: la línea se rellena, el paso hecho salta y se dibuja el check, y el siguiente se enciende con un pulso */
function railAnim(st, kinds, from, to, now){
  if (!st) return; var cs = st.querySelectorAll('.iv-vc'), ls = st.querySelectorAll('.iv-vl'), t = now ? 0 : 380, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  function step(i){
    if (i >= to) return;
    var a = cs[i], l = ls[i], b = cs[i + 1]; if (!a || !b) return;
    a.className = 'iv-vc done pop'; a.firstChild.innerHTML = rsvg(RI.ok, 20); [].forEach.call(a.querySelectorAll('svg *'), function(e){ e.setAttribute('pathLength', '1'); });
    setTimeout(function(){ if (l) l.classList.add('on'); }, reduce ? 0 : 260);
    setTimeout(function(){ b.className = 'iv-vc now pulse'; if (i + 1 < to) step(i + 1); }, reduce ? 0 : 260 + 420);
  }
  setTimeout(function(){ step(from); }, reduce ? 0 : t);
}
/* al confirmarse la foto (el anillo pasa a verde) el progreso de Vela avanza ya, sin esperar al siguiente paso */
function railPre(){
  if (!DESK) return; var asd = document.querySelector('aside'), st = asd && asd.querySelector('.iv-vst'); if (!st) return;
  var n = parts().length; if (S.i > n || RPC === null || RPC !== S.i) return;
  RPC = S.i + 1; railAnim(st, null, S.i, S.i + 1, true);
}
function railSync(){
  if (!DESK) { html.setAttribute('data-iv-rail', '1'); return; }
  var asd = document.querySelector('aside'); if (!asd) return;
  var show = function(){ html.setAttribute('data-iv-rail', '1'); };   /* el panel genérico no llega a verse: se muestra ya con el de la IV */
  fetch('iv-intro-f.d.html').then(function(r){ return r.text(); }).then(function(t){
    var src = new DOMParser().parseFromString(t, 'text/html').querySelector('aside'); if (!src) { show(); return; }
    asd.innerHTML = src.innerHTML;
    var leaf = [].slice.call(asd.querySelectorAll('*')).filter(function(e){ return !e.children.length && /^\s*It only takes a minute\s*$/.test(e.textContent); })[0];
    if (leaf) {
      var d = leaf.nextElementSibling; leaf.textContent = 'Privacy protected'; if (d) d.textContent = 'Photos are encrypted, used only for this verification, and deleted afterwards per GDPR.';
      var row = leaf.parentElement, old = null; while (row && !(old = row.querySelector('svg'))) row = row.parentElement;
      if (old) old.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + (old.getAttribute('width') || 16) + '" height="' + (old.getAttribute('height') || 16) + '" fill="none" stroke="#385bf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';
    }
  asd.__iv = asd.innerHTML; railPaint(true); show(); }).catch(show);
}
function mount(){
  var bar = document.querySelector('header.relative.flex.shrink-0'); if (!bar) return false;
  var wrap = bar.parentElement && bar.parentElement.parentElement; if (!wrap) return false;
  var main = bar.parentElement.nextElementSibling; if (main) main.style.display = 'none';
  root = document.createElement('main'); root.innerHTML = '<div class="iv-main"></div><footer class="iv-ft"></footer>'; wrap.appendChild(root);
  root.addEventListener('click', onClick); root.addEventListener('change', function(e){ if (e.target.id === 'iv-ctry') { S.c = e.target.value; S.d = S.c ? kindsFor(S.c)[0] : ''; paint(); var s = root.querySelector('#iv-ctry'); if (s) s.focus(); } });
  var t = bar.querySelector('div[class*="flex-col"] > span:first-child'); if (t) t.textContent = 'Guest registration';
  document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('header button[aria-label="Back"]'); if (b && b.getAttribute('data-a') === 'prev') { e.preventDefault(); e.stopImmediatePropagation(); onClick({ target: b, preventDefault: function(){}, stopPropagation: function(){} }); } }, true);
  railSync(); html.setAttribute('data-iv-flow', '1'); if (window.__ivSkip) { var sync = function(m){ html.classList.toggle('iv-nosk', m === 'none'); }; sync(window.__ivSkip.mode()); window.__ivSkip.onChange(sync); } paint(); return true;
}
/* control: cuántos tipos de documento se ofrecen */
(function(){ var d = document.createElement('div'); d.className = 'ff-sw'; d.innerHTML = [1, 2, 3, 4].map(function(k){ return '<button type="button" data-v="' + k + '"' + (k === DT ? ' class="on"' : '') + '>' + k + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var q = new URLSearchParams(location.search); q.set('dt', b.getAttribute('data-v')); location.search = '?' + q.toString(); });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Tipos de documento', d, 48); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: resultado simulado de la validación de cada foto */
(function(){ var o = [['ok', 'Correcto'], ['face', 'Falla la cara'], ['mrz', 'Falla el MRZ'], ['both', 'Fallan cara y MRZ'], ['match', 'Falla la biometría (selfie)']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === OUT ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); OUT = b.getAttribute('data-v'); try { localStorage.setItem('rep-io', OUT); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Resultado de la foto', d, 49); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: cuánto tarda la verificación */
(function(){ var o = [[2, '2 s'], [5, '5 s'], [10, '10 s'], [30, '30 s'], [0, 'Sin fin']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === VT ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); VT = Number(b.getAttribute('data-v')); try { localStorage.setItem('rep-iv-t', String(VT)); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Respuesta del backend', d, 50); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: qué vídeo se ve en el paso previo del selfie */
(function(){ var o = [['1', 'Vídeo 1'], ['2', 'Vídeo 2'], ['3', 'Vídeo 3']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === SV ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); SV = b.getAttribute('data-v'); try { localStorage.setItem('rep-sv', SV); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); if (document.querySelector('video.iv-selfie-anim')) paint(); });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Vídeo del selfie', d, 51); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: cámara del selfie apagada / encendida (con la animación de encendido); la fuente es la foto de ejemplo o, con «Cámara real» = Sí, la cámara del dispositivo. Al abrir la cámara arranca apagada y se enciende sola */
(function(){ var o = [['0', 'Apagada'], ['1', 'Encendida']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('');
  function sync(){ [].forEach.call(d.children, function(c){ c.classList.toggle('on', (c.getAttribute('data-v') === '1') === CAMON); }); }
  window.__camSync = sync; sync();
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); clearTimeout(CAMT); CAMW = false; CAMON = b.getAttribute('data-v') === '1'; sync(); if (S.step === 'cam') { camStop(); paint(); } });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Cámara del selfie', d, 52); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: cámara real detrás del mockup (para ver cómo quedaría en el móvil) */
(function(){ var o = [['0', 'No'], ['1', 'Sí']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + ((x[0] === '1') === LIVE ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); LIVE = b.getAttribute('data-v') === '1'; try { localStorage.setItem('rep-livecam', LIVE ? '1' : '0'); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); if (S.step === 'cam') { if (LIVE) { paint(); } else { camStop(); paint(); } } });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Cámara real', d, 54); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* control: variante del mockup del selfie */
(function(){ var o = [['he', 'Hombre'], ['she', 'Mujer']], d = document.createElement('div'); d.className = 'ff-sw';
  d.innerHTML = o.map(function(x){ return '<button type="button" data-v="' + x[0] + '"' + (x[0] === MOCK ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
  d.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); MOCK = b.getAttribute('data-v'); try { localStorage.setItem('rep-smock', MOCK); } catch (x) {} [].forEach.call(d.children, function(c){ c.classList.toggle('on', c === b); }); if (S.step === 'cam' || S.step === 'adjust') paint(); });
  var add = function(){ if (window.__repPanel) window.__repPanel.add('Mockup del selfie', d, 53); }; if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add); })();
/* vista «Móvil + escritorio» (split.html): las pulsaciones se replican en el otro marco (panel.js), así cada vista ejecuta su propia lógica (cámara simulada, spinners, temporizadores). Aquí solo queda lo que no se puede replicar con una pulsación: la imagen elegida en «Choose from gallery» (abre un selector de archivos) */
(function(){
  try { if (window.parent === window || !window.parent.__phoneSplit) return; } catch (e) { return; }
  window.__ivSnap = function(){ return JSON.stringify({ step: S.step, c: S.c, d: S.d, i: S.i }); };
  window.__ivGalleryShare = function(){ try { window.parent.postMessage({ rep: 'iv-gallery', img: S.img }, '*'); } catch (e) {} };
  window.addEventListener('message', function(ev){
    var m = ev.data; if (!m || m.rep !== 'iv-gallery' || !m.img) return;
    S.img = m.img; clearTimeout(tm); go('adjust');   /* la misma imagen (un blob del otro marco, mismo origen) y el mismo paso de ajuste */
  });
})();
var n = 0; (function tryMount(){ if (!mount() && n++ < 20) setTimeout(tryMount, 100); })();
})();
