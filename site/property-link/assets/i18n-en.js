/* Prototype chrome in English: panel «Controls», mockup bars and the screen index.
   The labels are written in Spanish in the sources; this layer translates exact strings (text nodes and attributes) at runtime. */
(function(){
var D = {
 'Controles': 'Controls', 'Ajustes de la reserva': 'Booking settings', 'Cómo está configurada la propiedad y la reserva': 'How the property and the booking are set up',
 'Cómo está configurada la reserva': 'How the booking is set up', 'Componentes': 'Components', 'Pagos': 'Payments', 'Depósito': 'Deposit', 'Tasas': 'Taxes',
 'Pago reserva': 'Reservation payment', 'Tipo de depósito': 'Deposit type', 'Retención': 'Hold', 'Solo tokenizar': 'Tokenize only', 'Comisiones externas': 'External fees',
 'Sí': 'Yes', 'Número de huéspedes': 'Number of guests', 'Antes': 'Before', 'Ahora': 'Now', 'Vela sombreado': 'Vela shadow', 'Ask Vela tradicional': 'Ask Vela classic',
 'Bordes': 'Borders', 'Con borde': 'With border', 'Sin borde total': 'No border at all', 'Solo documento': 'Document only', 'Biometría': 'Biometrics',
 'Vista': 'View', 'Qué pantalla y qué estado estás viendo': 'Which screen and state you are viewing', 'Skip de la verificación': 'Verification skip',
 'Obligatoria': 'Required', 'Opcional': 'Optional', 'Sin skip': 'No skip', 'Tipos de documento': 'Document types', 'Resultado de la foto': 'Photo result',
 'Correcto': 'Correct', 'Falla la cara': 'Face fails', 'Falla el MRZ': 'MRZ fails', 'Fallan cara y MRZ': 'Face and MRZ fail', 'Falla la biometría (selfie)': 'Biometrics fail (selfie)',
 'Respuesta del backend': 'Backend response', 'Sin fin': 'No end', 'Vídeo del selfie': 'Selfie video', 'Vídeo 1': 'Video 1', 'Vídeo 2': 'Video 2', 'Vídeo 3': 'Video 3',
 'Cámara del selfie': 'Selfie camera', 'Apagada': 'Off', 'Encendida': 'On', 'Mockup del selfie': 'Selfie mockup', 'Cámara real': 'Real camera',
 'Navegación': 'Navigation', 'Índice': 'Index', 'Ver en móvil': 'View on mobile', 'Llaves': 'Keys', 'Bloqueado': 'Locked', 'Antes de llegar': 'Before arrival', 'Listo': 'Ready',
 'Ofertas del anfitrión': 'Host offers', 'Actual': 'Current', 'V1 · Lista': 'V1 · List', 'V2 · Destacada': 'V2 · Featured', 'V3 · Por momento': 'V3 · By moment',
 'Nº de guidebooks': 'No. of guidebooks', 'Sin empezar': 'Not started', 'En camino': 'On the way', 'En progreso': 'In progress', 'Completado': 'Completed',
 'Variante': 'Variant', 'Ofertas': 'Offers', 'Todo': 'All', 'Con autofill': 'With autofill', 'Sin autofill': 'Without autofill', 'Automática': 'Automatic',
 'Solo texto': 'Text only', 'Con casillas': 'With checkboxes', 'Formulario tras la verificación': 'Form after verification', 'Sin contrato': 'No contract', 'Con contrato': 'With contract',
 'Con OPT.': 'With OPT.', 'Sin OPT.': 'Without OPT.', 'Opcionales (OPT.)': 'Optional (OPT.)', 'Contrato': 'Contract', 'Firma': 'Signature', 'Dibujada': 'Drawn', 'Acuerdos': 'Agreements',
 'Completo': 'Full', 'Parcial': 'Partial', 'Lectura simulada': 'Simulated reading', 'Con info': 'With info', 'Sin info': 'Without info', 'Info (tooltips)': 'Info (tooltips)',
 'Validación': 'Validation', 'Sin validar': 'Not validated', 'Correcta': 'Valid', 'Dato erróneo': 'Wrong data', 'Faltan campos': 'Missing fields', 'Resultado del envío': 'Submission result',
 'Éxito': 'Success', 'Ambos': 'Both', 'Fallo': 'Failure', 'Hombre': 'Male', 'Mujer': 'Female', 'Estado': 'State',
 'Modal huéspedes': 'Guests modal', 'Por edad': 'By age', 'Total · solo lectura': 'Total · read-only', 'Por edad · solo lectura': 'By age · read-only', 'Huéspedes': 'Guests',
 'Editable': 'Editable', 'Solo lectura': 'Read-only', 'Registration · comparar (la pantalla es la misma, cambia solo la versión)': 'Registration · compare (same screen, only the version changes)',
 'Sin nada registrado': 'Nothing registered', 'Todo completado': 'All completed', 'Tarjeta del resumen': 'Summary card', 'Invitar en tarjeta': 'Invite on card', 'Invitar en Vela': 'Invite in Vela',
 'Formulario sencillo para menores': 'Simple form for minors', 'Menores': 'Minors', 'Menor': 'Minor', 'Sin menor': 'No minor', 'Con menor': 'With minor',
 'Ejemplo de tasas': 'Tax example', 'Con exención': 'With exemption', 'Sin registrar': 'Not registered', 'Mixto': 'Mixed', 'Exención mixta': 'Mixed exemption', 'Todos pagan': 'Everyone pays', 'Ya pagados + 1': 'Already paid + 1',
 'Sección de depósito': 'Deposit section', 'Protección obligatoria': 'Mandatory protection', 'Liberación de la retención': 'Hold release', '1 día': '1 day', '3 días': '3 days', '7 días': '7 days', '14 días': '14 days',
 'V10 · Una caja': 'V10 · One box', 'V15 · Cobrado vs retenido': 'V15 · Charged vs held', 'No (opcional)': 'No (optional)', 'Formato del guidebook': 'Guidebook format', 'Bloques': 'Blocks', 'HTML importado': 'Imported HTML',
 'Qué queda': 'What is left', 'Huéspedes y pagos': 'Guests and payments', 'Reserva completa': 'Full booking', 'Página de registrado': 'Registered page', 'V2 · como la home': 'V2 · like the home',
 'V1 · Documento': 'V1 · Document', 'V2 · Pasos': 'V2 · Steps', 'V3 · Paneles': 'V3 · Panels', 'Resumen': 'Summary', 'Anillo': 'Ring', 'Deal · estilo': 'Deal · style', 'Varios': 'Several', 'Ninguno': 'None',
 'Vista móvil y tablet': 'Mobile and tablet view', 'Mockup móvil': 'Mobile mockup', 'Mockup tablet': 'Tablet mockup', 'Mockup escritorio': 'Desktop mockup', 'Móvil + escritorio': 'Mobile + desktop', 'Sin mockup': 'No mockup',
 'Girar el dispositivo': 'Rotate device', 'Réplica en el dispositivo': 'Replica on device', 'Réplica en el dispositivo (siguiente)': 'Replica on device (next)', 'Réplica en escritorio': 'Replica on desktop', 'Réplica en móvil': 'Replica on mobile',
 'Pagos existentes': 'Existing payments', 'Pagos pospuestos': 'Postponed payments', 'Reserva': 'Booking', 'Tasas + reserva': 'Taxes + booking', 'Resultado del pago': 'Payment result', 'Se paga bien': 'Pays fine',
 'Tarjeta rechazada': 'Card declined', 'Sin fondos': 'Insufficient funds', 'Cobro OK, depósito rechazado': 'Charge OK, deposit declined', 'El banco pide confirmar (3D Secure)': 'Bank asks to confirm (3D Secure)',
 'Ver paso (sin pagar)': 'See step (without paying)', 'Confirmar en el banco': 'Confirm at the bank', 'Procesando': 'Processing', 'Pagado': 'Paid', 'Fallido': 'Failed', 'Depósito pendiente': 'Deposit pending',
 'Tarjeta de prueba': 'Test card', 'Rellenar 4242 4242 4242 4242': 'Fill in 4242 4242 4242 4242', 'Editor de guidebook': 'Guidebook editor', 'Réplica guestapp v2': 'guestapp v2 replica', 'Réplica de la guestapp v2': 'guestapp v2 replica',
 'Empezar por la Home →': 'Start with the Home →', 'Home y navegación': 'Home and navigation', 'Móvil': 'Mobile', 'Escritorio': 'Desktop', 'Registro de huéspedes': 'Guest registration', 'Autofill: escaneo de documento': 'Autofill: document scan',
 'Verificación de identidad': 'Identity verification', 'Dispositivo': 'Device', 'Móviles': 'Phones', 'Portátil pequeño': 'Small laptop', 'Plegar o desplegar': 'Collapse or expand', 'Vela · estilo': 'Vela · style',
 'Pantallas capturadas de la guestapp de staging, con sus mismos estilos y componentes. Se pueden recorrer haciendo clic. Ábrela en móvil o en escritorio y se adapta sola. Los datos son los de una reserva de pruebas.': 'Screens captured from the staging guest app, with the same styles and components. Click through them. Open it on mobile or desktop and it adapts by itself. The data comes from a test booking.',
 'Guest registration · V1 / V2 / V3': 'Guest registration · V1 / V2 / V3'
};
var RE = [[/^(.+) · escritorio$/, '$1 · desktop'], [/^(.+) · móvil$/, '$1 · mobile']];
function tr(s){
  var t = s.replace(/\s+/g, ' ').trim(); if (!t) return s;
  var v = D[t]; if (v === undefined) { for (var i = 0; i < RE.length; i++) if (RE[i][0].test(t)) { v = t.replace(RE[i][0], RE[i][1]); break; } }
  return v === undefined ? s : s.replace(s.trim(), v);
}
var ATTR = ['aria-label', 'title', 'placeholder', 'label', 'alt'];
var busy = false;
function run(root){
  if (busy || !root) return; busy = true;
  try {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) { var p = n.parentNode && n.parentNode.nodeName; if (p === 'SCRIPT' || p === 'STYLE') continue; list.push(n); }
    list.forEach(function(x){ var v = tr(x.nodeValue); if (v !== x.nodeValue) x.nodeValue = v; });
    root.querySelectorAll && root.querySelectorAll('[aria-label],[title],[placeholder],[label],[alt]').forEach(function(e){ ATTR.forEach(function(a){ var v = e.getAttribute(a); if (v) { var t2 = tr(v); if (t2 !== v) e.setAttribute(a, t2); } }); });
    var dt = tr(document.title); if (dt !== document.title) document.title = dt;
  } catch (e) {}
  busy = false;
}
var timer = null;
function sched(){ if (timer) return; timer = setTimeout(function(){ timer = null; run(document.body); }, 120); }
function start(){ run(document.body); try { new MutationObserver(sched).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
