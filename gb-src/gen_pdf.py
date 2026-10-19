# Genera los PDF de los guidebooks (4 páginas A4 cada uno) y sus páginas en JPG.
import re, subprocess, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DEALS = os.path.join(HERE, '..', 'vendor', 'vela', 'deals')
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
base = open(os.path.join(HERE, 'manual.html')).read()
CSS = re.search(r'<style>(.*?)</style>', base, re.S).group(1).replace('../site/assets','../../site/assets').replace('zoom:1.1','zoom:1.27')
CSS += """
.note{display:flex;gap:4mm;margin:6mm 0;padding:5mm 6mm;border-radius:5mm;background:rgba(56,91,248,.1);font-size:10pt;line-height:1.55}
.note.am{background:rgba(255,194,51,.25);color:#6b4700}
.amen{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin:5mm 0 9mm}
.amen span{padding:4.5mm 5mm;border-radius:5mm;background:var(--soft);font-size:10.5pt;font-weight:500}
.dish b{display:block;font-size:12pt;margin-bottom:2mm}
.thanks{margin-top:8mm;padding:9mm;border-radius:7mm;background:linear-gradient(135deg,#15153f,#2e4bd0);color:#fff}
.thanks b{display:block;font-size:20pt;line-height:1.2}.thanks span{display:block;margin-top:2mm;font-size:10.5pt;color:rgba(255,255,255,.8)}
.cards.two{grid-template-columns:1fr 1fr}
"""
def e(s): return s
def cover(k, h1a, h1b, tag, sub, photo, pos='center 30%'):
    return f'''<section class="page cover"><div class="ph" style="background-image:url('../../vendor/vela/deals/{photo}');background-position:{pos}"></div><span class="tag">{tag}</span>
<div class="tx"><h1>{h1a} <em>{h1b}</em></h1><p>{sub}</p><div class="meta"><span>Edition<b>2026</b></span><span>Your hosts<b>Marta &amp; Javier</b></span><span>Reach us<b>In the app, any time</b></span></div></div></section>'''
def page(n, name, eye, h2a, h2b, body):
    return f'<section class="page"><div class="eye">{eye}</div><h2>{h2a} <em>{h2b}</em></h2>{body}<div class="ft"><span>Villa Calipso · {name}</span><span>{n} / 4</span></div></section>'
def lead(t): return f'<p class="lead">{t}</p>'
def cards(items, two=False):
    return '<div class="cards%s">' % (' two' if two else '') + ''.join(f'<div class="card"><small>{a}</small><b>{b}</b><span>{c}</span></div>' for a,b,c in items) + '</div>'
def kv2(a,b): return f'<div class="wifi"><div><small>{a[0]}</small><code>{a[1]}</code></div><div><small>{b[0]}</small><code>{b[1]}</code></div></div>'
def kv1(a): return f'<div class="wifi" style="grid-template-columns:1fr"><div><small>{a[0]}</small><code>{a[1]}</code></div></div>'
def steps(l): return '<ol class="st">' + ''.join(f'<li><span>{x}</span></li>' for x in l) + '</ol>'
def h3(t): return f'<h3>{t}</h3>'
def p(t): return f'<p style="margin-bottom:5mm">{t}</p>'
def rules(items): return '<div class="rules">' + ''.join(f'<div class="rule"><b>{a}</b><p>{b}</p></div>' for a,b in items) + '</div>'
def lst(items): return '<div class="list">' + ''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a,b in items) + '</div>'
def note(t, am=False): return f'<div class="note{" am" if am else ""}"><span>{t}</span></div>'
def amen(l): return '<div class="amen">' + ''.join(f'<span>{x}</span>' for x in l) + '</div>'
def bins(): return '<div class="bins"><div class="bin"><i style="background:#f2c230"></i><b>Yellow</b><small>Plastic, cans and cartons</small></div><div class="bin"><i style="background:#385bf8"></i><b>Blue</b><small>Paper and cardboard</small></div><div class="bin"><i style="background:#37b36d"></i><b>Green</b><small>Glass, without lids</small></div><div class="bin"><i style="background:#7b8099"></i><b>Grey</b><small>Everything else</small></div></div>'
def sos(t, n='112'): return f'<div class="sos"><span>{t}</span><b>{n}</b></div>'
MAP = '<div class="map"><svg viewBox="0 0 640 280" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect width="640" height="280" fill="#e9edf8"/><path d="M0 200 L640 120" stroke="#fff" stroke-width="22"/><path d="M180 0 L260 280" stroke="#fff" stroke-width="16"/><path d="M430 0 L380 280" stroke="#fff" stroke-width="12"/><path d="M0 60 L640 90" stroke="#fff" stroke-width="9"/><rect x="40" y="215" width="120" height="50" rx="10" fill="#cfe6d4"/><rect x="470" y="140" width="130" height="90" rx="12" fill="#bcd9f5"/><circle cx="300" cy="140" r="26" fill="rgba(56,91,248,.18)"/><circle cx="300" cy="140" r="11" fill="#385bf8"/><circle cx="300" cy="140" r="4.5" fill="#fff"/><text x="318" y="124" font-family="P,sans-serif" font-size="14" font-weight="700" fill="#161643">@@</text><text x="468" y="128" font-family="P,sans-serif" font-size="11" font-weight="600" fill="#6b6b95">Plaza Mayor</text></svg></div>'
def mp(t): return MAP.replace('@@', t)
BOOKS = {
 'wifi': dict(name='Wi-Fi & access', photo='gb-keys2.jpg', pos='center 40%', cover=('Stay','connected','Villa Calipso · Wi-Fi & access','Your network, your door code and everything included.'), pages=[
   ('01 · Wi-Fi','Get','online', lead('Connect to the network below. The signal is strongest in the living room, next to the router.') + kv2(('Network','Calipso_Guest'),('Password','Villa-Calipso-26')) + cards([('Router','Living room','Next to the TV'),('Speed','600 Mb','Fibre'),('Devices','Up to 10','At the same time')]) + h3('If the signal is slow') + steps(['Move closer to the router, which is in the living room.','Thick walls in the bedrooms can weaken it.','Restart the router by unplugging it for ten seconds.'])),
   ('02 · Access','Door','code', lead('The keypad is on the right of the front door. Your personal code unlocks it from your arrival time until check-out.') + steps(['We show your code in the app as soon as you finish check-in.','Type the code on the keypad and push the door.','If the keypad doesn’t respond, press <b>#</b> twice and enter the code again.','Please don’t share your code with anyone.']) + note('The spare key is in the key box to the left of the gate, in case you ever need it.', True) + cards([('Keypad','Right side','Front door'),('Spare key','Key box','Left of the gate')], two=True)),
   ('03 · The house','What’s','included', lead('Everything below is yours to enjoy during your stay.') + amen(['Wi-Fi','Air conditioning','Washing machine','Full kitchen','Free parking','Smart TV','Terrace &amp; pool','Heating']) + h3('Good to know') + lst([('Check-out','By 11:00. Ask us for a later one.'),('Quiet hours','22:00 to 08:00, every day.'),('Wi-Fi','Shared by the whole house: streaming in 4K on many screens may be slow.'),('Need help?','Write to us in the app, any time.')])),
 ]),
 'where': dict(name='Getting there', photo='gb-street2.jpg', pos='center 50%', cover=('Finding the','villa','Villa Calipso · Getting there','By car, train, bus or air: every way to our door.'), pages=[
   ('01 · By car','By','car', lead('Villa Calipso is in the old part of Albacete, a short walk from Plaza Mayor. The street is narrow and one-way, so drive slowly.') + kv1(('Address','Calle Mayor 4, 02001 Albacete')) + steps(['Follow the signs to <b>Centro</b> and turn into <b>Calle Mayor</b>.','Drive slowly: the street is narrow and one-way.','The villa is the <b>white house with the green gate</b>, on the left, at number 4.']) + note('You can unload at the door for a few minutes. The Parking guidebook tells you where to leave the car afterwards.')),
   ('02 · Public transport','Train, bus','&amp; air', lead('Everything you need to reach us without a car.') + cards([('Train','12 min','By taxi from Albacete-Los Llanos'),('Bus','4 min walk','Lines 2 and 4 to Plaza Mayor'),('Airport','2 h','Valencia; Madrid is 2,5 h')]) + p('The easiest way from the airport is a taxi or a private transfer, and we can help you arrange one. Taxis wait outside the main exit of the station.') + note('A bus ticket costs about 1,40 €.')),
   ('03 · Arrival','Arriving','late', lead('Your door code works at any hour, so there is no need to wait for us.') + mp('Villa Calipso') + lst([('Arriving after 22:00','Please keep the noise down: the entrance is next to a neighbour’s bedroom.'),('Lost?','Write to us in the app and we will guide you to the door.'),('Check-in','From 15:00, any time after that.'),('Check-out','By 11:00.')])),
 ]),
 'parking': dict(name='Parking', photo='gb-fiat.jpg', pos='center 55%', cover=('Easy','parking','Villa Calipso · Parking','Street, garage or your own space in our yard.'), pages=[
   ('01 · Street','Free street','parking', lead('You can park for free on Calle Mayor and the streets around it. There is no time limit, although spaces are harder to find in the evening.') + cards([('Distance','200 m','From the door'),('Time limit','None','Any day'),('Price','Free','Always')]) + note('Blue-line spaces are for residents. If a space has a blue line, please choose another one.') + p('Tip: arrive before 20:00 for the best choice of spaces.')),
   ('02 · Garage','Public','garage', lead('The nearest underground garage is under Plaza Mayor, a 5-minute walk away. It is open 24 hours.') + cards([('Distance','5 min','On foot'),('Price','~14 €','Per day'),('Height','2,10 m','Maximum')]) + steps(['The entrance is on the north side of Plaza Mayor.','Take a ticket on the way in and keep it with you.','Pay at the machine before you go back to the car.'])),
   ('03 · Our yard','Reserved','spot', lead('If you prefer to leave the car inside, we have one covered space in the villa’s own yard.') + amen(['Inside the gate','Covered space','Up to 4,8 m','Ask before arrival']) + mp('Plaza Mayor garage') + note('Subject to availability. Write to us before you arrive and we will keep it for you.', True)),
 ]),
 'local': dict(name='Local tips', photo='gb-plazam.jpg', pos='45% 50%', cover=('Our favourite','corners','Villa Calipso · Local tips','Where to eat, what to see and who to call.'), pages=[
   ('01 · Food','Eat like a','local', lead('Order a drink in almost any bar around Plaza Mayor and you get a free tapa. Do not leave without trying these.') + '<div class="rules">' + ''.join(f'<div class="rule dish"><b>{a}</b><p>{b}</p></div>' for a,b in [('Atascaburras','A creamy dish of cod, potato and garlic, perfect for the cold months.'),('Gazpachos manchegos','A hearty stew with flatbread and game. Best shared and in winter.'),('Miguelitos','Little puff pastries with custard that every bakery here sells.'),('A free tapa','With every drink, in almost any bar around Plaza Mayor.')]) + '</div>' + note('Ask us for our favourites: we are happy to recommend.')),
   ('02 · See','Don’t','miss', lead('Nothing fancy: a few things worth seeing, all within a short walk.') + lst([('Cathedral of San Juan Bautista','A calm 8-minute walk through the old town.'),('Cutlery Museum','Albacete has made knives since the Middle Ages.'),('Abelardo Sánchez Park','Shade, ponds and a great place for a morning run.'),('Plaza Mayor','Terraces from midday until late, five minutes from the villa.')]) + mp('Villa Calipso')),
   ('03 · Useful','Groceries &amp;','help', lead('Where to find what you need, and who to call if something goes wrong.') + lst([('Supermarket','4 minutes on foot. Open Monday to Saturday, 09:00–21:30.'),('Pharmacy','Two streets from the villa, open until 22:00.'),('Cash machine','On the corner of Calle Mayor, next to the bakery.'),('Sundays','Small shops open on Plaza Mayor.')]) + sos('In an emergency, call the European emergency number. It works everywhere, free of charge.')),
 ]),
 'out': dict(name='Check-out', photo='gb-hall.jpg', pos='center 50%', cover=('A smooth','goodbye','Villa Calipso · Check-out','Ten minutes and you are done. We take care of the rest.'), pages=[
   ('01 · Before you leave','Before you','leave', lead('We hope you had a wonderful stay. Leaving is easy: you don’t need to strip the beds or do the dishes.') + steps(['Check-out is by <b>11:00</b>.','Close all windows and switch off the lights and the air conditioning.','Check the bathroom, the terrace and the fridge for anything you would like to take with you.','Leave the towels used in the bath, or in the shower if you prefer.']) + note('The door locks by itself when you close it.')),
   ('02 · Keys &amp; rubbish','Keys &amp;','rubbish', rules([('Keys','Leave the keys on the kitchen table. If you used the key box, put the spare key back and close it.'),('Rubbish','Please take the bags down to the bins on the corner, to the right of the green gate.')]) + h3('Recycling') + bins()),
   ('03 · Last details','Late','check-out', lead('If you need a few more hours, ask us the day before and we will do our best to make it work, depending on who arrives next.') + cards([('Standard','11:00','Check-out time'),('Ask us','The day before','For a later one'),('Always','Free','Leaving luggage')]) + '<div class="thanks"><b>Thank you for staying with us.</b><span>Safe travels, and see you soon!</span></div>'),
 ]),
}
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
for k, b in BOOKS.items():
    h = ''.join(['<!doctype html><html><head><meta charset="utf-8"><style>', CSS, '</style></head><body>',
      cover(k, *b['cover'][:2], b['cover'][2], b['cover'][3], b['photo'], b['pos'])])
    for i, (eye, a, c, body) in enumerate(b['pages'], start=2):
        h += page(i, b['name'], eye, a, c, body)
    h += '</body></html>'
    f = os.path.join(HERE, 'out', k + '.html'); open(f, 'w').write(h)
    pdf = os.path.join(HERE, 'out', k + '.pdf')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files', '--print-to-pdf=' + pdf, 'file://' + f], capture_output=True)
    subprocess.run(['pdftoppm', '-jpeg', '-jpegopt', 'quality=82', '-r', '130', pdf, os.path.join(DEALS, 'gb-pdf-' + k)], check=True)
    print(k, subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.split('Pages:')[1].split()[0], 'pages')
