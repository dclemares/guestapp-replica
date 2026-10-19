
(function(){
var S = window.__SCREEN || {};
if (S.id !== 'guidebook') return;
var P = {
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>', compass:'<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>', link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  wifi:'<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
  doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  map:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  car:'<path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', ext:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'
};
Object.assign(P, { x: '<path d="M18 6 6 18M6 6l12 12"/>', wash: '<rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 6h.01M11 6h.01"/>', snow: '<path d="M12 2v20M4.9 7l14.2 10M19.1 7 4.9 17"/>', kitchen: '<path d="M3 2v7a3 3 0 0 0 3 3v10M9 2v7M6 2v7M17 22V2c-2 1-4 4-4 8s2 5 4 5"/>', tv: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/>', pool: '<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>', flame: '<path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>', clip: '<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5L13 2.4a4 4 0 0 1 5.7 5.6l-9.3 9.3a2 2 0 0 1-2.8-2.8L15 6.4"/>', play: '<path d="M7 4l13 8-13 8z"/>', dl: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>' });
var ic = function(n, s){ return '<svg viewBox="0 0 24 24" width="' + (s || 18) + '" height="' + (s || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; };
var kv = function(l, v){ return '<div class="kv"><span><small>' + l + '</small><code>' + v + '</code></span><button class="cp" data-c="' + v + '">Copy</button></div>'; };
var MAPS = 'https://www.google.com/maps/search/?api=1&query=Villa+Calipso+Albacete';
var YT = function(t, dur, ch, img){   /* vídeo incrustado de YouTube (simulado) */
  return '<div class="yt2"><img src="../assets/vela/deals/' + (img || 'habitacion') + '.jpg" alt=""><div class="yt2-top"><span class="yt2-av">' + ch.charAt(0) + '</span><span class="yt2-ti">' + t + '</span></div><span class="yt2-pl"><svg viewBox="0 0 68 48" width="68" height="48"><rect width="68" height="48" rx="12" fill="#f00"/><path d="M27 14l20 10-20 10z" fill="#fff"/></svg></span><div class="yt2-bar"><span class="yt2-pr"><i></i></span><span class="yt2-ct"><span>0:00 / ' + dur + '</span><span class="yt2-lg"><svg viewBox="0 0 90 20" width="64" height="14"><rect width="28" height="20" rx="6" fill="#f00"/><path d="M11 5l8 5-8 5z" fill="#fff"/><text x="32" y="15" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="700" fill="#fff" letter-spacing="-.5">YouTube</text></svg></span></span></div></div>';
};
var GM = function(addr){ return '<div class="gm2"><iframe title="Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + encodeURIComponent(addr) + '&z=15&output=embed"></iframe></div>'; };
var LINKIC = function(){ return ic('link', 22); };   /* icono del enlace: la cadena */
var FL2 = function(n, sub, kind){   /* archivo (se descarga) o enlace incrustado (se abre) */
  var lk = kind === 'link';
  return '<a class="fl2' + (lk ? ' lk' : '') + '" href="#"' + (lk ? ' target="_blank" rel="noopener noreferrer"' : ' download') + '><span class="fl2-ic">' + (lk ? LINKIC() : '<b>PDF</b>') + '</span><span class="fl2-tx"><b>' + n + '</b><small>' + sub + '</small></span><span class="fl2-dl">' + (lk ? 'Open link ' + ic('ext', 15) : ic('dl', 16) + 'Download') + '</span></a>';
};
var FIG = function(img, cap){ return '<figure class="fg2"><img src="../assets/vela/deals/' + img + '.jpg" alt=""><figcaption>' + cap + '</figcaption></figure>'; };
var C2 = function(l, r){ return '<div class="c2p"><div>' + l + '</div><div>' + r + '</div></div>'; };
var NT = function(i, t, kind){ return '<div class="note' + (kind === 'bl' ? ' bl' : '') + '">' + ic(i, 18) + '<span>' + t + '</span></div>'; };
var STEPS = function(a){ return '<ol class="stp">' + a.map(function(t){ return '<li><span>' + t + '</span></li>'; }).join('') + '</ol>'; };
var BIN = function(a){ return '<div class="bins">' + a.map(function(x){ return '<span class="bin"><i style="background:' + x[0] + '"></i><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></span>'; }).join('') + '</div>'; };
var PL = function(a){ return '<div class="pls">' + a.map(function(x){ return '<span class="pl"><span class="pl-ic">' + ic(x[0], 18) + '</span><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></span>'; }).join('') + '</div>'; };
var H = function(v){ return { t: 'h2', v: v }; };
var BOOKS = [
 { k:'wifi', t:'Wi-Fi & access', i:'wifi', c:['rgba(56,91,248,.16)','#385bf8'], blocks:[
   { t:'h1', v:'Stay connected' },
   { t:'text', v:'Everything you need to get online and to get in, in one place. Take a minute to read it before you arrive: it will make your first evening much easier.' },
   { t:'divider' },
   H('Wi-Fi'),
   { t:'text', v:'Connect to the network below. The signal is strongest in the living room.' },
   { t:'html', v:kv('Network','Calipso_Guest') + kv('Password','Villa-Calipso-26') },
   { t:'image', img:'gb-terrace2', v:'The terrace and pool, where the signal reaches too', al:'center' },
   { t:'cols', l:'<b>If the signal is slow</b><br>Move closer to the router, which is in the <i>living room</i>, next to the TV. Thick walls in the bedrooms can weaken it.<br>Restart the router by unplugging it for <u>ten seconds</u>.', r:'<b>Good to know</b><br>Check-out is by <u>11:00</u> and quiet hours are <i>22:00–08:00</i>.<br>The Wi-Fi is shared by the whole house, so streaming in <b>4K</b> on several screens at once may be slow.' },
   { t:'divider' },
   H('Door code'),
   { t:'text', v:'The keypad is on the right of the front door. Your personal code unlocks it from your arrival time until check-out.' },
   { t:'html', v:YT('How the keypad works', '0:40', 'Villa Calipso', 'gb-door') },
   { t:'html', v:'<div class="note">' + ic('lock',18) + '<span>We’ll show your code in the app as soon as you finish check-in.</span></div>' },
   { t:'small', v:'<i>Your code is personal: please don’t share it.</i>', al:'right' },
   { t:'text', v:'If the keypad doesn’t respond, press <b>#</b> twice and enter the code again. The spare key is in the key box to the left of the gate.' },
   { t:'divider' },
   H('What’s included'),
   { t:'amenity', v:[['wifi','Wi-Fi'],['snow','Air conditioning'],['wash','Washing machine'],['kitchen','Full kitchen'],['car','Free parking'],['tv','Smart TV'],['pool','Terrace & pool'],['flame','Heating']] },
   { t:'cols', l:FIG('gb-pool','The pool'), r:FIG('gb-living2','The living room') },
   { t:'divider' },
   H('Around the villa'),
   { t:'html', v:GM('Calle Mayor 4, Albacete') + '<p><b>Calle Mayor 4</b>, Albacete</p>' },
   { t:'file', v:'House-manual.pdf', sub:'PDF · 1,2 MB' },
   { t:'file', v:'Albacete city guide', sub:'albacete.es', kind:'link' } ] },
 { k:'rules', t:'House rules', i:'doc', c:['rgba(255,194,51,.3)','#7a5200'], blocks:[
   { t:'h1', v:'Living well together' },
   { t:'text', v:'Villa Calipso sits in a quiet residential street, and a few small habits keep it that way for you, for us and for the neighbours. Nothing strict: just the things that make everybody’s stay easier.' },
   { t:'image', img:'gb-living', v:'The living room, our favourite place to unwind', al:'center' },
   H('Quiet hours'),
   { t:'text', v:'Please keep noise down between <b>22:00 and 08:00</b>. Sound carries a lot in the street at night, and our neighbours really appreciate it.' },
   { t:'cols', l:'<b>Inside</b><br>Music and TV at a comfortable volume, and no parties or events in the house.', r:'<b>On the terrace</b><br>You can stay out as late as you like; just keep conversations <i>low after 22:00</i>.' },
   H('Smoking'),
   { t:'text', v:'The house is <b>smoke-free indoors</b>. You are welcome to smoke on the terrace: there is an ashtray on the table, please use it and don’t leave cigarette ends in the garden.' },
   { t:'html', v:NT('flame','For safety, never leave candles, the barbecue or cigarettes unattended.') },
   H('Pets'),
   { t:'text', v:'Well-behaved pets are welcome, as long as we know before you arrive so we can get the house ready for them.' },
   { t:'amenity', v:[['star','Bowls on request'],['car','Not on the sofas'],['sun','Garden, on a lead'],['info','Tell us in advance']] },
   H('Waste & recycling'),
   { t:'text', v:'Albacete recycles by colour. The bins are on the corner, to the right of the green gate.' },
   { t:'html', v:BIN([['#f2c230','Yellow','Plastic, cans and cartons'],['#385bf8','Blue','Paper and cardboard'],['#37b36d','Green container','Glass, without lids'],['#7b8099','Grey','Everything else']]) },
   H('Water & energy'),
   { t:'text', v:'The villa runs on solar panels and the summers are hot, so a couple of habits go a long way.' },
   { t:'cols', l:'<b>Air conditioning</b><br>Keep windows and doors closed while it’s on, and switch it off when you go out.', r:'<b>Water</b><br>Short showers help: the hot water tank is <u>150 litres</u> and takes a while to refill.' } ] },
 { k:'where', t:'Getting there', i:'map', c:['rgba(55,224,143,.26)','#0b5c37'], blocks:[
   { t:'h1', v:'Finding the villa' },
   { t:'text', v:'Villa Calipso is in the old part of Albacete, a short walk from Plaza Mayor. Here is how to get to the door from the road, the station or the airport, and what to do if you arrive late.' },
   { t:'image', img:'gb-street', v:'Our street, in the old part of town', al:'center' },
   H('Address'),
   { t:'html', v:kv('Address','Calle Mayor 4, 02001 Albacete') },
   { t:'html', v:GM('Calle Mayor 4, Albacete') },
   H('By car'),
   { t:'html', v:STEPS(['Follow the signs to <b>Centro</b> and turn into <b>Calle Mayor</b>.','Drive slowly: the street is narrow and one-way.','The villa is the <b>white house with the green gate</b>, on the left, at number 4.']) },
   { t:'text', v:'You can unload at the door for a few minutes. The Parking guidebook tells you where to leave the car afterwards.' },
   H('By train or bus'),
   { t:'cols', l:'<b>Train</b><br>Albacete-Los Llanos station is <u>12 minutes</u> from the villa by taxi. Taxis wait outside the main exit.', r:'<b>Bus</b><br>Lines <b>2</b> and <b>4</b> stop at Plaza Mayor, a <i>4-minute walk</i> away. A ticket costs about 1,40 €.' },
   H('From the airport'),
   { t:'text', v:'The closest airports are <b>Valencia</b> (about 2 hours by road) and <b>Madrid</b> (about 2,5 hours). The easiest way is a taxi or a private transfer, and we can help you arrange one.' },
   { t:'html', v:NT('lock','Arriving after 22:00? Your door code works at any hour, but please keep the noise down: the entrance is next to a neighbour’s bedroom.','bl') },
   { t:'file', v:'Arrival-directions.pdf', sub:'PDF · 0,8 MB' } ] },
 { k:'parking', t:'Parking', i:'car', c:['rgba(56,91,248,.16)','#385bf8'], blocks:[
   { t:'h1', v:'Easy parking' },
   { t:'text', v:'The streets around the villa are narrow, so it helps to know your options before you arrive. There is free parking nearby, a public garage and, if you prefer, a reserved spot in our own yard.' },
   { t:'image', img:'gb-parking', v:'Free spaces along the streets around the villa', al:'center' },
   H('Free street parking'),
   { t:'text', v:'You can park for free on <b>Calle Mayor</b> and the streets around it, about <u>200 metres</u> from the door. There is no time limit, although spaces are harder to find in the evening.' },
   { t:'html', v:NT('info','Blue-line spaces are for residents. If a space has a blue line, please choose another one.','bl') },
   H('Public garage'),
   { t:'text', v:'The nearest underground garage is under <b>Plaza Mayor</b>, a 5-minute walk away. It is open 24 hours and the entrance is on the north side of the square.' },
   { t:'cols', l:'<b>Price</b><br>About <b>14 €</b> per day.', r:'<b>Height</b><br>Vehicles up to <b>2,10 m</b>.' },
   H('Reserved spot'),
   { t:'text', v:'If you prefer to leave the car inside, we have <b>one covered space</b> in the villa’s own yard. It fits a standard car and is available for the whole stay, subject to availability.' },
   { t:'amenity', v:[['lock','Inside the gate'],['sun','Covered space'],['car','Up to 4,8 m'],['info','Ask before arrival']] },
   H('Where to find us'),
   { t:'html', v:GM('Plaza Mayor, Albacete') + '<p>Plaza Mayor underground garage</p>' } ] },
 { k:'local', t:'Local tips', i:'star', c:['rgba(255,194,51,.3)','#7a5200'], blocks:[
   { t:'h1', v:'Our favourite corners' },
   { t:'text', v:'We have lived in Albacete all our lives, and these are the places we take our own friends to. Nothing fancy: good food, a few things worth seeing and where to find help if you need it.' },
   { t:'image', img:'gb-tapas', v:'A drink, a free tapa and good company', al:'center' },
   H('Eat like a local'),
   { t:'text', v:'Order a drink in almost any bar around Plaza Mayor and you get a <b>free tapa</b>. Do not leave without trying these three things.' },
   { t:'cols', l:'<b>Atascaburras</b><br>A creamy dish of cod, potato and garlic, perfect for the cold months.', r:'<b>Gazpachos manchegos</b><br>A hearty stew with flatbread and game. Best shared and in winter.' },
   { t:'text', v:'And for something sweet, ask for <i>miguelitos</i>, the little puff pastries with custard that every bakery here sells.' },
   H('Don’t miss'),
   { t:'html', v:PL([['book','Cathedral of San Juan Bautista','A calm 5-minute walk from the villa'],['star','Cutlery Museum','Albacete has made knives since the Middle Ages'],['sun','Abelardo Sánchez Park','Shade, ponds and a great place for a morning run']]) },
   { t:'html', v:YT('A walk through the old town', '2:15', 'Villa Calipso', 'gb-plaza') },
   H('Groceries & pharmacy'),
   { t:'text', v:'The supermarket is <b>4 minutes on foot</b>, at the end of Calle Mayor. It opens Monday to Saturday, from <u>09:00 to 21:30</u>. On Sundays you will find small shops open on Plaza Mayor.' },
   { t:'cols', l:'<b>Pharmacy</b><br>Two streets from the villa, open until <u>22:00</u>.', r:'<b>Cash machine</b><br>On the corner of Calle Mayor, next to the bakery.' },
   H('In an emergency'),
   { t:'html', v:kv('Emergencies','112') },
   { t:'text', v:'The number works anywhere in Europe, free of charge and in several languages. For anything about the villa, you can always write to us from the app.' },
   { t:'file', v:'Albacete city guide', sub:'albacete.es', kind:'link' } ] },
 { k:'out', t:'Check-out', i:'lock', c:['rgba(255,194,51,.3)','#7a5200'], blocks:[
   { t:'h1', v:'A smooth goodbye' },
   { t:'text', v:'We hope you had a wonderful stay. Leaving is easy: it takes about ten minutes, and you don’t need to strip the beds or do the dishes. We take care of the rest.' },
   { t:'image', img:'gb-keys', v:'Until next time', al:'center' },
   H('Before you leave'),
   { t:'html', v:STEPS(['Check-out is by <b>11:00</b>.','Close all windows and switch off the lights and the air conditioning.','Check the bathroom, the terrace and the fridge for anything you’d like to take with you.','Leave the towels used in the bath, or in the shower if you prefer.']) },
   H('Keys'),
   { t:'text', v:'Leave the keys on the <b>kitchen table</b>. If you used the key box, please put the spare key back and close it. The door locks by itself when you close it.' },
   H('Rubbish'),
   { t:'text', v:'Please take the bags down to the bins on the corner, to the right of the green gate.' },
   { t:'html', v:BIN([['#f2c230','Yellow','Plastic, cans and cartons'],['#385bf8','Blue','Paper and cardboard'],['#37b36d','Green container','Glass, without lids'],['#7b8099','Grey','Everything else']]) },
   H('Late check-out'),
   { t:'text', v:'If you need a few more hours, ask us <b>the day before</b> and we’ll do our best to make it work, depending on who arrives next.' },
   { t:'html', v:NT('star','Thank you for staying with us. Safe travels, and see you soon!','bl') } ] }
];

var q = function(n){ var m = location.search.match(new RegExp('[?&]' + n + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : ''; };
var V = /\.d\.html/.test(location.pathname) ? 'd' : 'm';
var GV = '4';   /* una sola vista: V4 · Editorial */
var PG = 0;
var nb = parseInt(q('n'), 10); if (nb >= 1 && nb < BOOKS.length) BOOKS = BOOKS.slice(0, nb);
var WELCOME = { k: 'welcome', t: 'Welcome to Villa Calipso', i: 'book', c: ['rgba(56,91,248,.16)', '#385bf8'], min: 4, s: [], blocks: [
  { t: 'h1', v: 'Make yourself at home' },
  { t: 'text', v: 'We’re so happy to host you. Here you’ll find everything you need for a relaxed stay: how to get in, how the house works, what’s included and where to find us.' },
  { t: 'image', v: 'The terrace and pool, our favourite corner', img: 'room' },
  { t: 'divider' },
  { t: 'h2', v: 'Getting in' },
  { t: 'text', v: 'The keypad is on the right of the front door. Your personal code unlocks it from your arrival time until check-out.' },
  { t: 'small', v: 'Your code appears in the app as soon as you finish check-in.' },
  { t: 'video', v: 'How the keypad works', dur: '0:40' },
  { t: 'h2', v: 'Around the house' },
  { t: 'cols', l: ['Wi-Fi', 'Network <b>Calipso_Guest</b><br>Password <b>Villa-Calipso-26</b>'], r: ['Good to know', 'Check-out by <b>11:00</b>.<br>Quiet hours <b>22:00–08:00</b>.'] },
  { t: 'h2', v: 'What’s included' },
  { t: 'amenity', v: [['wifi', 'Wi-Fi'], ['snow', 'Air conditioning'], ['wash', 'Washing machine'], ['kitchen', 'Full kitchen'], ['car', 'Free parking'], ['tv', 'Smart TV'], ['pool', 'Terrace & pool'], ['flame', 'Heating']] },
  { t: 'divider' },
  { t: 'h2', v: 'Find us' },
  { t: 'map', v: 'Calle Mayor 4, Albacete' },
  { t: 'h2', v: 'Useful documents' },
  { t: 'file', v: 'House-manual.pdf', sub: 'PDF · 1,2 MB' },
  { t: 'file', v: 'Local-guide.pdf', sub: 'PDF · 3,4 MB' }
] };
var g = q('g') || 'wifi', books = g === 'welcome' ? [WELCOME] : g === 'all' ? BOOKS : BOOKS.filter(function(b){ return b.k === g; });
if (!books.length) { books = BOOKS.slice(0, 1); g = books[0].k; }
var blocksOf = function(){ if (books[0].blocks) return books[0].blocks; var out = []; books.forEach(function(b){ if (books.length > 1) out.push({ t: 'h1', v: b.t }); else out.push({ t: 'h1', v: b.t }); b.s.forEach(function(sc){ out.push({ t: 'h2', v: sc.h }); out.push({ t: 'html', v: sc.b.replace(/__V__/g, V) }); }); }); return out; };
var one = books.length === 1 ? books[0] : null;
var secCount = books.reduce(function(a, b){ return a + (b.s || []).length; }, 0), mins = books.reduce(function(a, b){ return a + (b.min || 0); }, 0);
var title = one ? one.t : 'Villa Calipso guide';
var allSecs = function(){ var out = []; books.forEach(function(b){ b.s.forEach(function(sc, i){ out.push({ b: b, s: sc, i: i }); }); }); return out; };
var secBody = function(x){ return x.s.b.replace(/__V__/g, V); };
/* ---------- bloques reales de Chekin: Heading 1/2, Text, Secondary text, 2 columns, Divider, Image, Video, Amenity, File, Google Map ---------- */
var IMGB = '../assets/vela/deals/';
var emH = function(v){ var w = String(v).trim().split(' '); if (w.length < 2) return v; var l = w.pop(); return w.join(' ') + ' <span class="gb-em">' + l + '</span>'; };
var blk = function(b){
  switch (b.t) {
    case 'h1': return '<div class="bk bk-h1">' + emH(b.v) + '</div>';
    case 'h2': return '<div class="bk bk-h2">' + b.v + '</div>';
    case 'text': return '<p class="bk bk-t">' + b.v + '</p>';
    case 'small': return '<p class="bk bk-s">' + b.v + '</p>';
    case 'html': return '<div class="bk bk-x">' + b.v + '</div>';
    case 'divider': return '<hr class="bk bk-dv">';
    case 'cols': return '<div class="bk">' + (Array.isArray(b.l) ? C2('<b>' + b.l[0] + '</b><br>' + b.l[1], '<b>' + b.r[0] + '</b><br>' + b.r[1]) : C2(b.l, b.r)) + '</div>';
    case 'image': return '<figure class="bk bk-im"><img src="' + IMGB + b.img + '.jpg" alt=""><figcaption>' + b.v + '</figcaption></figure>';
    case 'video': return '<div class="bk">' + YT(b.v, b.dur, 'Villa Calipso') + '</div>';
    case 'amenity': return '<div class="bk bk-am2">' + b.v.map(function(a){ return '<span>' + ic(a[0], 20) + a[1] + '</span>'; }).join('') + '</div>';
    case 'file': return '<div class="bk">' + FL2(b.v, b.sub, b.kind) + '</div>';
    case 'map': return '<div class="bk">' + GM(b.v) + '</div>';
  }
  return '';
};
var chapters = function(){   /* parte los bloques por «Heading 2»: portada (antes del primero) y un capítulo por H2 */
  var bl = blocksOf(), cover = [], ch = [], cur = null;
  bl.forEach(function(b){ if (b.t === 'h2') { cur = { h: b.v, b: [] }; ch.push(cur); } else if (cur) cur.b.push(b); else cover.push(b); });
  return { cover: cover, ch: ch };
};
var DESC = { wifi: 'Network, password and door code', rules: 'Quiet hours, smoking, pets and recycling', where: 'Address, by car, by train and from the airport', parking: 'Street, garage and your reserved spot', local: 'Where to eat, what to see and emergencies', out: 'Before you leave, keys, rubbish and late check-out', welcome: 'Everything you need for a relaxed stay' };
var HV = '6';   /* cabecera elegida: cristal sobre duotono, en móvil y escritorio */
var heroImg = function(){ var c = chapters().cover.filter(function(b){ return b.t === 'image'; })[0]; return IMGB + (c ? c.img : ({ wifi: 'gb-terrace' })[books[0].k] || 'gb-terrace') + '.jpg'; };
var headCard = function(){
  if (HV !== '1') {
    var b = books[0], one1 = books.length === 1, ti = one1 ? b.t : 'Villa Calipso guide', ds = one1 ? (DESC[b.k] || '') : 'All the guidebooks of your stay';
    var ico = '<span class="gb-hd-ic">' + ic(one1 ? b.i : 'book', 26) + '</span>', eye = '<span class="gb-hd-eye">Guidebook · from your host</span>', img = '<img src="' + heroImg() + '" alt="">';
    if (HV === '2') return '<section class="gb-hd gh gh2">' + img + '<div class="gh-sc"></div><div class="gh-in">' + ico + '<div class="gb-hd-tx">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div></div></section>';
    if (HV === '3') return '<section class="gb-hd gh gh3"><div class="gh-ph">' + img + '</div><div class="gh-card">' + ico + '<div class="gb-hd-tx">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div></div></section>';
    var tx = '<div class="gb-hd-tx">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div>';
    if (HV === '5') return '<section class="gb-hd gh gh5">' + img + '<div class="gh-sc"></div><span class="gh5-ic">' + ic(one1 ? b.i : 'book', 22) + '</span><div class="gh5-in">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div></section>';
    if (HV === '6') return '<section class="gb-hd gh gh6">' + img + '<div class="gh6-gl">' + ico + tx + '</div></section>';
    if (HV === '7') return '<section class="gb-hd gh gh7"><div class="gh-ph">' + img + '</div><span class="gh7-ic">' + ic(one1 ? b.i : 'book', 28) + '</span><div class="gh7-tx">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div></section>';
    if (HV === '8') return '<section class="gb-hd gh gh8"><div class="gh8-tx">' + ico + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div><div class="gh8-ph">' + img + '</div></section>';
    if (HV === '9') return '<section class="gb-hd gh gh9">' + img + '<div class="gh-sc"></div><div class="gh9-in">' + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div></section>';
    if (HV === '10') return '<section class="gb-hd gh gh9 gh10">' + img + '<div class="gh-sc"></div><div class="gh9-in">' + ico + tx + '</div></section>';
    return '<section class="gb-hd gh gh4"><div class="gh-tx">' + ico + eye + '<h2>' + ti + '</h2><p>' + ds + '</p></div><div class="gh-ph">' + img + '</div></section>';
  }
  return headCard1();
};
var headCard1 = function(){   /* tarjeta azul de la cabecera (solo escritorio): icono, título y descripción */
  var b = books[0], one1 = books.length === 1;
  return '<section class="gb-hd"><span class="gb-hd-ic">' + ic(one1 ? b.i : 'book', 26) + '</span><div class="gb-hd-tx"><span class="gb-hd-eye">Guidebook · from your host</span><h2>' + (one1 ? b.t : 'Villa Calipso guide') + '</h2><p>' + (one1 ? (DESC[b.k] || '') : 'All the guidebooks of your stay') + '</p></div></section>';
};
var trimDv = function(a){ var r = a.slice(); while (r.length && r[r.length - 1].t === 'divider') r.pop(); return r; };
var DV = '<hr class="bk bk-dv" role="separator">';
var bodyV4 = function(){   /* V4 · Editorial: una hoja de lectura, de arriba abajo; un Divider claro entre cada sección */
  var C = chapters(), first = trimDv(C.cover.filter(function(b){ return b.t !== 'image'; })), im = C.cover.filter(function(b){ return b.t === 'image'; })[0];
  var parts = [];
  if (first.length) parts.push('<section class="sh-s">' + first.map(blk).join('') + '</section>');
  C.ch.forEach(function(c, ci){ parts.push('<section class="sh-s" id="gs-' + ci + '"><div class="bk bk-h2">' + c.h + '</div>' + trimDv(c.b).map(blk).join('') + '</section>'); });
  return '<div class="gv4">' + headCard() + '<article class="sheet">' + (im ? blk(im) : '') + '<div class="sh-in">' + parts.map(function(p,i){ return p + (first.length && i === 0 && parts.length > 1 ? DV : ''); }).join('') + '</div></article></div>';
};
var VV = '1';   /* lista de Vela elegida: V1 · Lista */
var FM = (function(){ var v = new URLSearchParams(location.search).get('fm'); return /^(pdf|html)$/.test(v || '') ? v : ''; })();   /* formato: bloques (por defecto), PDF o HTML importado */
var DLS = '../assets/vela/deals/';
var PDFN = { wifi: 'Wi-Fi-guide.pdf', rules: 'House-manual.pdf', where: 'Getting-there.pdf', parking: 'Parking-guide.pdf', local: 'Local-tips.pdf', out: 'Check-out-guide.pdf' };
var bk = function(){ return books[0] && PDFN[books[0].k] ? books[0].k : 'rules'; };
var bodyPDF = function(){   /* visor de PDF: páginas una debajo de otra, con scroll (sin descarga) */
  var n = 4, k = bk(), pg = ''; for (var i = 1; i <= n; i++) pg += '<figure class="pdfp"><img src="' + DLS + 'gb-pdf-' + k + '-' + i + '.jpg" alt="Page ' + i + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '"><figcaption>' + i + '</figcaption></figure>';
  return '<div class="gv4"><div class="pdfv"><div class="pdfv-sc">' + pg + '</div></div></div>';
};
var bodyHTML = function(){   /* HTML importado: página propia, con su fondo y estilo, dentro de la app */
  return '<div class="gv4"><div class="imp"><iframe class="imp-fr" src="' + DLS + 'gb-import-' + bk() + '.html" title="Imported guidebook" scrolling="no"></iframe></div></div>';
};
var body = FM === 'pdf' ? bodyPDF : FM === 'html' ? bodyHTML : bodyV4;
var go = function(id){ location.href = id + '.' + V + '.html' + (/[?&]embed=1/.test(location.search) ? '?embed=1' : ''); };
var apply = function(){
  var h1 = document.querySelector('h1'); if (!h1) return false;
  var hd = h1.closest('header'), cont = hd && hd.parentElement; if (!cont) return false;
  var nm = one ? one.t : 'Villa Calipso guide';
  if (h1.getAttribute('data-gbs') !== nm) { h1.setAttribute('data-gbs', nm); h1.textContent = nm; document.title = title + ' · Villa Calipso'; }
  var p = hd.querySelector('p');
  hd.style.display = 'none';   /* el nombre del guidebook va en las migas y en la barra superior, no en el contenido */
  [].forEach.call(document.querySelectorAll('.dbk-eye'), function(e){ if (e.textContent !== nm) e.textContent = nm; });
  if (p) p.style.display = 'none';   /* sin «N sections · M min read…» */
  [].forEach.call(document.querySelectorAll('span.truncate'), function(e){ if (/^\s*Guidebook\s*$/.test(e.textContent) && !e.closest('#gbs')) e.textContent = nm; });
  cont.style.maxWidth = '780px';
  /* menú lateral: Home activo */
  [].forEach.call(document.querySelectorAll('[data-sidebar="menu-button"]'), function(b){ b.setAttribute('data-active', /^\s*Home\s*$/.test(b.textContent) ? 'true' : 'false'); });
  /* Vela (escritorio): solo las secciones de este guidebook (si es de bloques) o un acceso rápido al resto de guías */
  var as = document.querySelector('aside[data-slot="assistant-panel"]');
  var sc = as && as.querySelector('section');
  if (as && sc && !sc.getAttribute('data-gl')) {
    var ap = as.querySelector(':scope > p'); if (ap) ap.style.display = 'none';
    var tpl = sc.querySelector('button'), lab = sc.querySelector(':scope > span');
    if (tpl && lab) {
      var item = function(t, ic0, fn){
        var bt = tpl.cloneNode(true), st = bt.querySelector('strong'), sp = bt.querySelector('span.block, span[class*="block"]'), tile = bt.querySelector('span[class*="rounded-[9px]"]');
        if (st) st.textContent = t; if (sp) sp.remove(); if (tile) tile.innerHTML = ic0; bt.addEventListener('click', function(ev){ ev.preventDefault(); fn(); }); return bt;
      };
      [].slice.call(sc.querySelectorAll('button')).forEach(function(x){ x.remove(); });
      {
        var chs = FM ? [] : chapters().ch, oth = BOOKS.filter(function(x){ return x.k !== books[0].k; });
        var Hd = function(t, s){ return '<div class="vlh"><b>' + t + '</b><small>' + s + '</small></div>'; };
        var HA = Hd('On this page', 'Jump to a section of this guidebook.'), HB = Hd('Other guidebooks', 'More guides from your host for Villa Calipso.');
        var ico = function(n){ return ic(n, 14); };
        var descOf = function(c){ var b = c.b.filter(function(t){ return t.t === 'text'; })[0], s = b ? b.v : ''; s = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); return s.length > 60 ? s.slice(0, 58).replace(/\s+\S*$/, '') + '…' : s; };
        var dn = '<svg class="vl-ch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
        var up = '<svg class="vl-ch" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10M7 17 17 7"/></svg>';
        var wrapB = function(inner){ return '<div class="vl-oth">' + inner + '</div>'; };
        var htm = '';
        if (VV === '1') {
          if (chs.length) htm += '<div class="vl-cur">' + HA + chs.map(function(c, i){ return '<button type="button" class="vl1r" data-g="' + i + '" data-gi="' + i + '"><i class="n">' + (i + 1) + '</i><span>' + c.h + '</span>' + dn + '</button>'; }).join('') + '</div>';
          htm += wrapB(HB + oth.map(function(x){ return '<button type="button" class="vl1r o" data-b="' + x.k + '"><span class="ic" style="background:#fff;color:' + x.c[1] + '">' + ic(x.i, 16) + '</span><span class="t"><strong>' + x.t + '</strong><small>' + (DESC[x.k] || '') + '</small></span>' + up + '</button>'; }).join(''));
        } else if (VV === '2') {
          if (chs.length) htm += '<div class="vl-cur">' + HA + '<ol class="vl2-rail">' + chs.map(function(c, i){ return '<li data-g="' + i + '" data-gi="' + i + '"><i>' + (i + 1) + '</i><span>' + c.h + '</span></li>'; }).join('') + '</ol></div>';
          htm += wrapB(HB + '<div class="vl2-chips">' + oth.map(function(x){ return '<button type="button" data-b="' + x.k + '">' + ic(x.i, 14) + x.t + up + '</button>'; }).join('') + '</div>');
        } else if (VV === '3') {
          if (chs.length) htm += '<div class="vl-cur">' + HA + '<div class="vl3-cards">' + chs.map(function(c, i){ return '<button type="button" class="vl3c" data-g="' + i + '" data-gi="' + i + '"><b class="n">' + (i + 1) + '</b><span><strong>' + c.h + '</strong><small>' + descOf(c) + '</small></span>' + dn + '</button>'; }).join('') + '</div></div>';
          htm += wrapB(HB + '<div class="vl3-grid">' + oth.map(function(x){ return '<button type="button" class="vl3t" data-b="' + x.k + '"><span class="ic" style="background:' + x.c[0] + ';color:' + x.c[1] + '">' + ic(x.i, 18) + '</span><strong>' + x.t + '</strong></button>'; }).join('') + '</div>');
        } else {
          var rowsG = chs.map(function(c, i){ return '<button type="button" class="vl4r" data-g="' + i + '" data-gi="' + i + '"><span>' + c.h + '</span>' + dn + '</button>'; }).join('');
          var rowsB = oth.map(function(x){ return '<button type="button" class="vl4r" data-b="' + x.k + '"><span>' + x.t + '</span>' + up + '</button>'; }).join('');
          if (chs.length) htm += '<div class="vl4t"><button type="button" class="on" data-t="0">On this page</button><button type="button" data-t="1">Other guidebooks</button></div><div class="vl4p" data-p="0">' + HA + rowsG + '</div><div class="vl4p" data-p="1" hidden>' + HB + rowsB + '</div>';
          else htm += '<div class="vl4p">' + HB + rowsB + '</div>';
        }
        [].slice.call(sc.children).forEach(function(x){ x.remove(); });
        var host = document.createElement('div'); host.className = 'vl vl' + VV; host.innerHTML = htm; sc.appendChild(host);
        host.addEventListener('click', function(ev){
          var t = ev.target.closest('[data-t]'); if (t) { [].forEach.call(host.querySelectorAll('[data-t]'), function(b){ b.classList.toggle('on', b === t); }); [].forEach.call(host.querySelectorAll('[data-p]'), function(p){ p.hidden = p.getAttribute('data-p') !== t.getAttribute('data-t'); }); return; }
          var g = ev.target.closest('[data-g]'); if (g) { var el = document.getElementById('gs-' + g.getAttribute('data-g')); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(function(){ var d = el.getBoundingClientRect().top - 66; if (Math.abs(d) > 4) el.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 900); } return; }
          var b2 = ev.target.closest('[data-b]'); if (b2) { var u = new URL(location.href); u.searchParams.set('g', b2.getAttribute('data-b')); location.href = u.toString(); }
        });
        sc.setAttribute('data-gl', '1');
        /* Vela nunca hace scroll ni esconde nada: si la lista no cabe en la altura de la ventana, se compacta nivel a nivel */
        var fitVl = function(){
          var h = document.querySelector('aside[data-slot="assistant-panel"] .vl'), a2 = h && h.closest('aside'); if (!h || !a2) return;
          h.className = h.className.replace(/\bvf\d\b/g, '').replace(/\s+/g, ' ').trim();
          for (var n = 0; n <= 5; n++) { if (n) h.classList.add('vf' + n); if (a2.scrollHeight <= a2.clientHeight + 1) break; }
        };
        fitVl(); setTimeout(fitVl, 300); setTimeout(fitVl, 1200); window.addEventListener('resize', fitVl);
        if (!window.__vlSpy) { window.__vlSpy = 1; var spy2 = function(){ var cur = 0; [].forEach.call(document.querySelectorAll('#gbs .sh-s[id^="gs-"]'), function(s, i){ if (s.getBoundingClientRect().top < 160) cur = i; }); [].forEach.call(document.querySelectorAll('aside[data-slot="assistant-panel"] [data-gi]'), function(e){ e.classList.toggle('on', e.getAttribute('data-gi') === String(cur)); }); }; window.addEventListener('scroll', spy2, true); setInterval(spy2, 600); }
        return true;
      }
      var others = function(){
        BOOKS.filter(function(x){ return x.k !== books[0].k; }).forEach(function(x){ sc.appendChild(item(x.t, ic(x.i, 16), function(){ var u = new URL(location.href); u.searchParams.set('g', x.k); location.href = u.toString(); })); });
      };
      if (!FM) {
        lab.textContent = 'In this guidebook';
        chapters().ch.forEach(function(c, i){ sc.appendChild(item(c.h, '<b style="font-size:12px;font-weight:700">' + (i + 1) + '</b>', function(){ var el = document.getElementById('gs-' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); })); });
        var lab2 = lab.cloneNode(true); lab2.textContent = 'Other guidebooks'; sc.appendChild(lab2); others();
      } else {
        lab.textContent = 'Other guidebooks'; others();
      }
      sc.setAttribute('data-gl', '1');
    }
  }
  /* restos de la pantalla de origen (tarjetas de huéspedes, importe del carrito y botón de confirmar) */
  var tv = document.querySelector('.taxes-view'); if (tv) [].slice.call(tv.children).forEach(function(c){ if (!c.contains(hd) && !c.classList.contains('dbk-row') && !c.querySelector('.dbk-row') && !/^\s*(Back to|Home)/.test(c.textContent.trim())) c.remove(); });
  [].forEach.call(document.querySelectorAll('div.sticky.bottom-0.z-10.mt-auto'), function(d){ if (/Confirm and go back/.test(d.textContent)) d.remove(); });
  [].forEach.call(document.querySelectorAll('button'), function(b){ if (/Confirm and go back to Payment/.test(b.textContent) && !b.closest('#rep-panel')) { var d = b.closest('div.sticky') || b.parentElement; d.style.display = 'none'; } });
  /* contenido: se sustituye todo lo que hay debajo del título */
  var box = document.getElementById('gbs'), sig = GV + ':' + PG + ':' + g + ':' + (nb || '') + ':' + HV + ':' + FM;
  if (!box || !cont.contains(box) || box.getAttribute('data-sig') !== sig) {
    if (box) box.remove();
    var nx = hd.nextElementSibling; while (nx) { var nn = nx.nextElementSibling; if (nx.id !== 'gbs') nx.remove(); nx = nn; }
    box = document.createElement('div'); box.id = 'gbs'; box.className = 'hv' + HV + (FM ? ' fm-' + FM : ''); box.setAttribute('data-sig', sig); box.innerHTML = body(); cont.appendChild(box); if (GV === '2') spy();
    var fr = box.querySelector('.imp-fr'); if (fr) { var fit = function(){ try { fr.style.height = fr.contentDocument.documentElement.scrollHeight + 'px'; } catch (er) {} }; fr.addEventListener('load', function(){ fit(); setTimeout(fit, 300); setTimeout(fit, 1200); }); window.addEventListener('resize', fit); }
    var pgs = box.querySelectorAll('.pdfp'); if (pgs.length && window.IntersectionObserver) { var vis = {}, num = box.querySelector('.pdfv-pg b'); var io = new IntersectionObserver(function(es){ es.forEach(function(e){ vis[e.target.getAttribute('data-n')] = e.isIntersecting ? e.intersectionRatio : 0; }); var best = 1, bv = -1; Object.keys(vis).forEach(function(k){ if (vis[k] > bv) { bv = vis[k]; best = k; } }); if (num) num.textContent = best; }, { threshold: [0, .25, .5, .75, 1] }); [].forEach.call(pgs, function(p, i){ p.setAttribute('data-n', i + 1); io.observe(p); }); }
    var sec = q('s'); if (sec) { var el = document.getElementById(sec); if (el) setTimeout(function(){ el.scrollIntoView(); }, 50); }
  }
  document.documentElement.classList.add('gbs-ready');   /* el guidebook ya está pintado: se muestra la pantalla */
  return true;
};
var rerender = function(){ var b = document.getElementById('gbs'); if (b) b.setAttribute('data-sig', 'x'); apply(); };
var spy = function(){ var links = [].slice.call(document.querySelectorAll('#gbs .ix a')); var upd = function(){ var cur = null; [].forEach.call(document.querySelectorAll('#gbs .ar-s'), function(e){ if (e.getBoundingClientRect().top < 160) cur = e.id; }); links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('data-ix') === (cur || (links[0] && links[0].getAttribute('data-ix')))); }); }; document.addEventListener('scroll', upd, { passive: true, capture: true }); upd(); };
var lb = function(src, cap){
  var o = document.createElement('div'); o.className = 'gbs-lb'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
  o.innerHTML = '<button type="button" class="gbs-lb-x" aria-label="Close">' + ic('x', 20) + '</button><figure><img src="' + src + '" alt=""><figcaption>' + (cap || '') + '</figcaption></figure>';
  var close = function(){ o.remove(); document.removeEventListener('keydown', kd, true); }, kd = function(ev){ if (ev.key === 'Escape') close(); };
  o.addEventListener('click', function(ev){ if (ev.target.tagName !== 'IMG') close(); }); document.addEventListener('keydown', kd, true); document.body.appendChild(o);
};
document.addEventListener('click', function(e){
  var im = e.target.closest && e.target.closest('#gbs img'); if (im && !im.closest('.yt2') && !im.closest('.gb-hd')) { var f = im.closest('figure'); e.preventDefault(); lb(im.getAttribute('src'), f && f.querySelector('figcaption') ? f.querySelector('figcaption').innerHTML : ''); return; }
  var c = e.target.closest && e.target.closest('#gbs .cp'); if (c) { try { navigator.clipboard.writeText(c.getAttribute('data-c')); } catch (er) {} c.textContent = 'Copied'; c.classList.add('ok'); setTimeout(function(){ c.textContent = 'Copy'; c.classList.remove('ok'); }, 1500); return; }
  var a = e.target.closest && e.target.closest('#gbs .toc a, #gbs .ix a'); if (a && /^#/.test(a.getAttribute('href'))) { e.preventDefault(); var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, true);
var n = 0; (function t(){ if (!apply() && n++ < 40) setTimeout(t, 150); else setInterval(apply, 900); })();
/* control del panel: qué guidebook se ve */
(function(){ var k = 0, t2 = setInterval(function(){ if (!window.__repPanel) { if (++k > 40) clearInterval(t2); return; } clearInterval(t2);
  var d = document.createElement('div'); d.className = 'rail-switch';
  var all = [['wifi', 'Wi-Fi'], ['rules', 'Rules'], ['where', 'Getting there'], ['parking', 'Parking'], ['local', 'Local tips'], ['out', 'Check-out']];
  d.innerHTML = all.map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === g ? ' on' : '') + '" data-gk="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  d.addEventListener('click', function(ev){ var b = ev.target.closest('[data-gk]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); var u = new URL(location.href); u.searchParams.set('g', b.getAttribute('data-gk')); location.href = u.toString(); }, true);
  window.__repPanel.add('Guidebook', d, 27.4);
  var f = document.createElement('div'); f.className = 'rail-switch';
  f.innerHTML = [['', 'Bloques'], ['pdf', 'PDF'], ['html', 'HTML importado']].map(function(o){ return '<button type="button" class="rs-chip' + (o[0] === FM ? ' on' : '') + '" data-fm="' + o[0] + '">' + o[1] + '</button>'; }).join('');
  f.addEventListener('click', function(ev){ var b = ev.target.closest('[data-fm]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); var u = new URL(location.href); if (b.getAttribute('data-fm')) u.searchParams.set('fm', b.getAttribute('data-fm')); else u.searchParams.delete('fm'); location.href = u.toString(); }, true);
  window.__repPanel.add('Formato del guidebook', f, 27.6);
}, 150); })();
})();
