# Genera las páginas HTML "importadas" de cada guidebook (cada una con su propio fondo y estilo).
import re, os
HERE = os.path.dirname(os.path.abspath(__file__))
DEALS = os.path.join(HERE, '..', 'vendor', 'vela', 'deals')
src = open(os.path.join(HERE, 'import-rules-original.html')).read()
CSS = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
for a, b in [('#ff7a59', 'var(--c1)'), ('#2ee6c5', 'var(--c2)'), ('#7b5cff', 'var(--c3)'), ('#0e1650', 'var(--b1)'), ('#0a0f38', 'var(--b2)'), ('#0c1240', 'var(--b1)'), ('#ffd166', 'var(--g1)'), ('#ff5d8f', 'var(--g3)'), ('rgba(255,122,89,0)', 'transparent'), ('rgba(46,230,197,0)', 'transparent'), ('rgba(123,92,255,0)', 'transparent')]:
    CSS = CSS.replace(a, b)
CSS = CSS.replace('linear-gradient(90deg,var(--g1),var(--c1) 55%,var(--g3))', 'linear-gradient(90deg,var(--g1),var(--g2) 55%,var(--g3))')
CSS = CSS.replace('.rings{', '.rings{color:#fff;') + '.rv{opacity:1!important;transform:none!important;transition:none!important}' + '.tl::before{display:none}.st:not(:last-child)::after{content:"";position:absolute;left:-24px;top:20px;bottom:-4px;width:2px;border-radius:2px;background:linear-gradient(180deg,var(--c2),var(--c3))}'
ICON = {
 'moon': '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', 'pulse': '<path d="M3 12h4l3-8 4 16 3-8h4"/>', 'heart': '<path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6C19 16.6 12 21 12 21z"/>',
 'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>', 'bolt': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', 'devices': '<rect x="3" y="4" width="14" height="10" rx="2"/><path d="M8 18h4M7 21h6M19 8h2v11h-5"/>',
 'train': '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/>', 'bus': '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 21v-4M16 21v-4"/>', 'plane': '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>',
 'car': '<path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>', 'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', 'euro': '<path d="M18 7a7 7 0 1 0 0 10M4 10h9M4 14h9"/>', 'ruler': '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
 'fork': '<path d="M3 2v7a3 3 0 0 0 3 3v10M9 2v7M6 2v7M17 22V2c-2 1-4 4-4 8s2 5 4 5"/>', 'star': '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>', 'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 'key': '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>', 'trash': '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 'door': '<path d="M5 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M13 12h.01"/>', 'pin': '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
}
def icon(n, col): return f'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
MOTIF = {
 'rings': '<circle cx="380" cy="380" r="120"/><circle cx="380" cy="380" r="200"/><circle cx="380" cy="380" r="280"/><circle cx="380" cy="380" r="360"/>',
 'dots': ''.join(f'<circle cx="{40+x*60}" cy="{40+y*60}" r="2.2" fill="#fff" stroke="none"/>' for x in range(12) for y in range(12)),
 'lines': ''.join(f'<path d="M-40 {60+i*58} C 180 {-20+i*58}, 400 {160+i*58}, 800 {40+i*58}"/>' for i in range(12)),
 'stripes': ''.join(f'<path d="M{-200+i*90} 800 L{200+i*90} -40" stroke-width="22" opacity=".5"/>' for i in range(14)),
 'arcs': ''.join(f'<path d="M{380-r} 560 A{r} {r} 0 0 1 {380+r} 560"/>' for r in (90, 170, 250, 330, 410)),
 'bubbles': '<circle cx="190" cy="220" r="150"/><circle cx="560" cy="170" r="110"/><circle cx="470" cy="520" r="210"/><circle cx="110" cy="560" r="90"/>',
}
def kvs(rows): return '<div class="glass">' + ''.join(f'<div class="kv"><div><small>{a}</small><code>{b}</code></div>' + (f'<button data-c="{b}">Copy</button>' if cp else '') + '</div>' for a, b, cp in rows) + '</div>'
def tl(rows): return '<div class="glass"><div class="tl">' + ''.join(f'<div class="st"><em>{a}</em><b>{b}</b><span>{c}</span></div>' for a, b, c in rows) + '</div></div>'
def grid(rows, cols): return '<div class="grid">' + ''.join(f'<div class="rule">{icon(i, cols[n % len(cols)])}<div><b>{b}</b><span>{c}</span></div></div>' for n, (i, b, c) in enumerate(rows)) + '</div>'
def spots(rows): return '<div class="spots">' + ''.join(f'<div class="spot"><div><b>{a}</b><span>{b}</span></div><i>{c}</i></div>' for a, b, c in rows) + '</div>'
def sec(t, s, body): return f'<section class="rv"><h2>{t}</h2><p class="sub">{s}</p>{body}</section>'
def sign(t, s): return f'<div class="sign rv"><b>{t}</b><span>{s}</span></div>'
def chips(rows): return '<div class="chips rv">' + ''.join(f'<div class="chip"><small>{a}</small><b>{b}</b></div>' for a, b in rows) + '</div>'
T = {
 'wifi': dict(v='--c1:#2f7bff;--c2:#22d3ee;--c3:#a855f7;--b1:#071a4d;--b2:#050d33;--g1:#7dd3fc;--g2:#60a5fa;--g3:#c084fc', motif='rings', eye='Villa Calipso · Wi-Fi &amp; access', h1=('Stay', 'connected.'), lead='Your network, your door code and everything included in your stay. Take a minute now: it will make your first evening much easier.',
   chips=[('Network', 'Calipso_Guest'), ('Speed', '600 Mb'), ('Devices', 'up to 10')], cols=['#22d3ee', '#7dd3fc', '#c084fc'], body=[
   sec('Get online', 'The signal is strongest in the living room.', kvs([('Network', 'Calipso_Guest', 1), ('Password', 'Villa-Calipso-26', 1)])),
   sec('If it feels slow', 'Three quick fixes.', tl([('First', 'Move closer', 'The router is in the living room, next to the TV.'), ('Then', 'Mind the walls', 'Thick walls in the bedrooms can weaken the signal.'), ('Last', 'Restart the router', 'Unplug it for ten seconds and plug it in again.')])),
   sec('Your door code', 'The keypad is on the right of the front door.', tl([('On arrival', 'Check your code', 'It appears in the app as soon as you finish check-in.'), ('At the door', 'Type it and push', 'If the keypad doesn’t respond, press # twice and try again.'), ('Just in case', 'Spare key', 'It is in the key box to the left of the gate.')])),
   sec('What’s included', 'All yours during your stay.', grid([('wifi', 'Wi-Fi', 'Fibre, whole house'), ('sun', 'Air conditioning', 'Every bedroom'), ('car', 'Free parking', 'Inside the gate')], ['#22d3ee', '#7dd3fc', '#c084fc'])),
   sign('Need a hand?', 'Write to us from the app, any time. — Marta &amp; Javier')]),
 'rules': dict(v='--c1:#ff7a59;--c2:#2ee6c5;--c3:#7b5cff;--b1:#0e1650;--b2:#0a0f38;--g1:#ffd166;--g2:#ff7a59;--g3:#ff5d8f', motif='rings'),
 'where': dict(v='--c1:#f5b942;--c2:#1fbf8f;--c3:#0ea5a4;--b1:#08302b;--b2:#04201d;--g1:#fde68a;--g2:#fbbf24;--g3:#34d399', motif='lines', eye='Villa Calipso · Getting there', h1=('Finding the', 'villa.'), lead='In the old part of Albacete, a short walk from Plaza Mayor. Here is how to reach the door by car, train, bus or plane.',
   chips=[('Address', 'Calle Mayor 4'), ('Check-in', 'from 15:00'), ('From the station', '12 min')], cols=['#fde68a', '#34d399', '#5eead4'], body=[
   sec('Address', 'Tap to copy and paste it into your map app.', kvs([('Address', 'Calle Mayor 4, 02001 Albacete', 1)])),
   sec('By car', 'The street is narrow and one-way: drive slowly.', tl([('Step 1', 'Head to Centro', 'Follow the signs and turn into Calle Mayor.'), ('Step 2', 'Go slowly', 'It is a narrow, one-way street.'), ('Step 3', 'Look for the green gate', 'The white house at number 4, on the left. You can unload at the door.')])),
   sec('Other ways', 'Without a car.', grid([('train', 'Train', '12 min by taxi from the station'), ('bus', 'Bus', 'Lines 2 and 4 to Plaza Mayor'), ('plane', 'Airport', 'Valencia 2 h · Madrid 2,5 h')], ['#fde68a', '#34d399', '#5eead4'])),
   sec('Arriving late?', 'Your code works at any hour.', spots([('After 22:00', 'Please keep the noise down: a neighbour sleeps next to the entrance.', 'Quiet'), ('Lost on the way?', 'Write to us in the app and we will guide you to the door.', 'Help')])),
   sign('See you at the green gate.', 'We can’t wait to welcome you. — Marta &amp; Javier')]),
 'parking': dict(v='--c1:#ffb800;--c2:#ff6b35;--c3:#6b7280;--b1:#15171c;--b2:#0b0c0f;--g1:#ffe066;--g2:#ffb800;--g3:#ff6b35', motif='stripes', eye='Villa Calipso · Parking', h1=('Easy', 'parking.'), lead='The streets around the villa are narrow, so it helps to know your options before you arrive. Street, garage or your own space in our yard.',
   chips=[('Street', 'free'), ('Garage', '~14 € / day'), ('Our yard', '1 space')], cols=['#ffe066', '#ffb800', '#ff6b35'], body=[
   sec('Free street parking', 'Calle Mayor and the streets around it.', grid([('ruler', '200 m', 'From the door'), ('clock', 'No limit', 'Any day'), ('euro', 'Free', 'Always')], ['#ffe066', '#ffb800', '#ff6b35'])),
   sec('Public garage', 'Under Plaza Mayor, open 24 hours.', spots([('Plaza Mayor garage', 'Entrance on the north side of the square', '5 min'), ('Price', 'About 14 € per day', '~14 €'), ('Height', 'Vehicles up to 2,10 m', '2,10 m')])),
   sec('Reserved spot', 'One covered space in our own yard.', tl([('Step 1', 'Ask us', 'Write to us before you arrive, subject to availability.'), ('Step 2', 'We keep it for you', 'It fits a car up to 4,8 m and is yours for the whole stay.'), ('Step 3', 'Open the gate', 'Your door code also opens the gate of the yard.')])),
   sign('Tip: arrive before 20:00.', 'It is the easiest time to find a free space on the street.')]),
 'local': dict(v='--c1:#ff5d8f;--c2:#ffb347;--c3:#c2410c;--b1:#3b0d2e;--b2:#22071a;--g1:#ffd89b;--g2:#ff9a6c;--g3:#ff5d8f', motif='bubbles', eye='Villa Calipso · Local tips', h1=('Our favourite', 'corners.'), lead='We have lived in Albacete all our lives, and these are the places we take our own friends to. Good food, a few things worth seeing and who to call.',
   chips=[('Tapa', 'free with a drink'), ('Plaza Mayor', '5 min'), ('Emergencies', '112')], cols=['#ffd89b', '#ff9a6c', '#ff5d8f'], body=[
   sec('Eat like a local', 'Order a drink and you get a free tapa.', grid([('fork', 'Atascaburras', 'Cod, potato and garlic'), ('fork', 'Gazpachos manchegos', 'A hearty stew, best shared'), ('star', 'Miguelitos', 'Puff pastry with custard')], ['#ffd89b', '#ff9a6c', '#ff5d8f'])),
   sec('Don’t miss', 'All within a short walk.', spots([('Cathedral of San Juan Bautista', 'A calm walk through the old town', '8 min'), ('Cutlery Museum', 'Knives have been made here since the Middle Ages', '10 min'), ('Abelardo Sánchez Park', 'Shade, ponds and a great morning run', '12 min')])),
   sec('Handy to know', 'Groceries, pharmacy and help.', spots([('Supermarket', 'Monday to Saturday, 09:00–21:30', '4 min'), ('Pharmacy', 'Open until 22:00', '3 min')])),
   sec('In an emergency', 'Free of charge, everywhere in Europe.', kvs([('Emergencies', '112', 1)])),
   sign('Ask us for our favourites.', 'We love recommending. — Marta &amp; Javier')]),
 'out': dict(v='--c1:#ff9d8a;--c2:#ffd6a5;--c3:#6d83f2;--b1:#1a2155;--b2:#0e1236;--g1:#ffd6a5;--g2:#ff9d8a;--g3:#ff7eb6', motif='arcs', eye='Villa Calipso · Check-out', h1=('A smooth', 'goodbye.'), lead='We hope you had a wonderful stay. Leaving takes about ten minutes, and you don’t need to strip the beds or do the dishes.',
   chips=[('Check-out', 'by 11:00'), ('Late check-out', 'ask the day before')], cols=['#ffd6a5', '#ff9d8a', '#ff7eb6'], body=[
   sec('Before you leave', 'A quick last look.', tl([('By 11:00', 'Check-out time', 'Ask us the day before if you need a few more hours.'), ('Windows', 'Close them all', 'And switch off the lights and the air conditioning.'), ('One last look', 'Bathroom, terrace, fridge', 'Anything you would like to take with you?'), ('Towels', 'In the bath', 'Or in the shower, if you prefer.')])),
   sec('Keys & rubbish', 'The door locks by itself when you close it.', grid([('key', 'Keys', 'On the kitchen table'), ('key', 'Key box', 'Put the spare key back'), ('trash', 'Bins', 'On the corner, right of the gate')], ['#ffd6a5', '#ff9d8a', '#ff7eb6'])),
   sec('Recycling', 'Four colours, easy.', spots([('Yellow', 'Plastic, cans and cartons', 'Yellow'), ('Blue', 'Paper and cardboard', 'Blue'), ('Green container', 'Glass, without lids', 'Green'), ('Grey', 'Everything else', 'Grey')])),
   sign('Thank you for staying with us.', 'Safe travels, and see you soon! — Marta &amp; Javier')]),
}
# la de House rules se queda como estaba (HTML original), solo con su nombre nuevo
rules = open(os.path.join(HERE, 'import-rules-original.html')).read().replace('</style>', '.rv{opacity:1!important;transform:none!important;transition:none!important}.tl::before{display:none}.st:not(:last-child)::after{content:"";position:absolute;left:-24px;top:20px;bottom:-4px;width:2px;border-radius:2px;background:linear-gradient(180deg,#2ee6c5,#7b5cff)}</style>', 1)
open(os.path.join(DEALS, 'gb-import-rules.html'), 'w').write(rules)
JS = re.search(r'<script>(.*?)</script>', src, re.S).group(1)
for k, t in T.items():
    if k == 'rules': continue
    h = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Villa Calipso · {t["eye"]}</title><style>:root{{{t["v"]}}}{CSS}</style></head><body>'
    h += f'<svg class="rings" viewBox="0 0 760 760" fill="none" stroke="#fff" stroke-width="1">{MOTIF[t["motif"]]}</svg><main class="wrap"><span class="eye rv"><i></i>{t["eye"]}</span><h1 class="rv">{t["h1"][0]} <span>{t["h1"][1]}</span></h1><p class="lead rv">{t["lead"]}</p>{chips(t["chips"])}'
    h += ''.join(t['body']) + f'</main><script>{JS}</script></body></html>'
    open(os.path.join(DEALS, f'gb-import-{k}.html'), 'w').write(h)
    print(k, len(h))
