"""Design changes applied on top of the captured snapshots (build time).
Each change is documented in CAMBIOS.md."""
import re
from dom import find_outer

def _attr(h, pattern):
    m = re.search(pattern, h)
    if not m: raise SystemExit('pattern not found: ' + pattern)
    return m.group(1)

def _outer(h, pred):
    r = find_outer(h, pred)
    if not r: raise SystemExit('element not found')
    return h[r[0]:r[1]], r

ICON_INFO = ('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>')
ICON_USERS = ('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
              '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>')
ICON_CHECK = ('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>')
ICON_LOCK = ('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>')

def guest_count(html, variant, editable=True, proposal=True):
    """Change 1: 'Change guest count' sheet -> required step 'Who's staying?', with an age variant."""
    P = extract_parts(html)
    stepper_cls, title_cls, counter_cls, value_cls = P['stepper_cls'], P['title_cls'], P['counter_cls'], P['value_cls']
    dec, inc, confirm_cls, h2_cls, p_cls, head_cls = P['dec'], P['inc'], P['confirm_cls'], P['h2_cls'], P['p_cls'], P['head_cls']

    def row(key, title, sub, value, tag='', note='', note_text=''):
        d = dec.replace('aria-label="Decrement"', 'aria-label="Remove one %s" data-gc="%s-dec"' % (key, key))
        i = inc.replace('aria-label="Increment"', 'aria-label="Add one %s" data-gc="%s-inc"' % (key, key))
        if proposal:
            subhtml = ('<div class="gc-sub">%s</div>' % sub if sub else '') + ('<div class="gc-sub gc-sub--note" data-gc-note="%s">%s</div>' % (note, note_text) if note_text else '')
        else:
            subhtml = ('<div class="gc-sub"%s>%s</div>' % (' data-gc-note="%s"' % note if note else '', sub)) if sub else ''
        if editable:
            if proposal:
                val = '<button type="button" class="%s gc-num" data-gc="%s-val" aria-label="%s: %d. Tap to type a number">%d</button>' % (value_cls, key, title.split(' ·')[0], value, value)
            else:
                val = '<span class="%s" data-gc="%s-val" aria-live="polite">%d</span>' % (value_cls, key, value)
            ctl = '<div class="%s">%s%s%s</div>' % (counter_cls, d, val, i)
        else:
            ctl = '<span class="gc-fixed" data-gc="%s-val" aria-label="%d">%d</span>' % (key, value, value)
        return ('<div class="%s gc-row" data-gc-row="%s"><div class="counter-stepper__details min-w-0 flex-1">'
                '<div class="%s">%s%s</div>%s</div>%s</div>'
                % (stepper_cls, key, title_cls, title, tag, subhtml, ctl))

    if not proposal:
        body = ('Change it if your group is different, but it must match your arrival and the reservation you booked.' if editable else
                'This information must match your arrival and the reservation you booked.')
        note = '' if not editable else ('<div class="gc-note" role="note"><span class="gc-note__ic">' + ICON_INFO + '</span>'
                '<div><b>Pre-filled from your booking</b><span>' + body + '</span></div></div>')
    else:
        note = '' if not editable else ('<div class="gc-note" role="note"><span class="gc-note__ic">' + ICON_INFO + '</span>'
                '<div><b>Taken from your booking</b><span>Check that this matches who is arriving and your booking. If your group has changed, update it here.</span></div></div>')
    if variant == 'ages':
        if proposal:
            title = "Who's staying?" if editable else "Confirm who's staying"
            intro = ("Tell us how many adults and minors are coming, including you. We'll set up a check-in for each person." if editable
                     else "This is the group on your booking. We'll set up a check-in for each person.")
            rows = (row('adult', 'Adults', '18 or older on arrival day' + (''), 3) +
                    row('minor', 'Minors', 'Under 18 on arrival day', 2))
        else:
            title = "Who's staying?"
            intro = "Adults and minors on this reservation. We'll set up one registration for each person."
            rows = (row('adult', 'Adults · 18 or older', 'At least 1 adult is needed' if editable else '', 3) +
                    row('minor', 'Minors · under 18', 'Short form, no ID photos', 2, '', 'minors'))
        total_txt = '5 guest registrations will be created'
        confirm = 'Confirm 5 guests'
    else:
        if proposal:
            title = 'How many guests are staying?' if editable else "Confirm who's staying"
            intro = ("Count everyone staying, including you and any children. We'll set up a check-in for each person." if editable
                     else "This is the group on your booking. We'll set up a check-in for each person.")
            rows = row('guest', 'Guests', 'Including you' if editable else '', 2)
        else:
            title = 'How many guests are staying?'
            intro = "We'll set up one registration for each guest, so you can fill them in now or send each person a link."
            rows = row('guest', 'Guests', 'Include everyone staying, children too' if editable else '', 2)
        total_txt = '2 guest registrations will be created'
        confirm = 'Confirm 2 guests'
    hint = ''
    extra_max = ''
    escape = '<p class="gc-escape">Not right? Contact your host.</p>' if (proposal and not editable) else ''

    inner = (
        '<div class="%s"><h2 data-slot="dialog-title" class="%s">%s</h2><p class="%s">%s</p></div>'
        '<div class="who-coming-sheet__content flex w-full flex-col transition-opacity duration-300" data-gc-mode="%s" data-gc-editable="%s">'
        '<div class="gc-rows">%s</div>'
        '%s%s%s'
        '<button type="button" class="%s number-of-guests-form__button mt-5 flex w-full max-w-none" data-gc="confirm">%s</button>%s'
        '</div>'
    ) % (head_cls, h2_cls, title, p_cls, intro, variant, 'true' if editable else 'false', rows, note, extra_max, hint, confirm_cls, confirm, escape)

    return swap_content(html, inner)

def extract_parts(html):
    """real component markup/classes taken from the captured sheet"""
    dialog, _ = _outer(html, lambda t: 'role="dialog"' in t)
    stepper_cls = _attr(dialog, r'class="(counter-stepper flex[^"]*)"')
    title_cls = _attr(dialog, r'class="(counter-stepper__title[^"]*)"')
    counter_cls = _attr(dialog, r'class="(counter flex[^"]*)"')
    value_cls = _attr(dialog, r'class="(counter__value[^"]*)"')
    dec, _ = _outer(dialog, lambda t: 'counter__decrease-button' in t)
    inc, _ = _outer(dialog, lambda t: 'counter__increase-button' in t)
    confirm_cls = _attr(dialog, r'<button type="button" class="(button relative[^"]*)">Confirm</button>')
    h2_open, _ = _outer(dialog, lambda t: 'data-slot="dialog-title"' in t)
    h2_cls = _attr(h2_open, r'class="([^"]*)"')
    p_cls = _attr(dialog, r'<p aria-hidden="true" class="([^"]*)">')
    head_cls = _attr(dialog, r'<div class="(mb-\[var\(--sheet-header-gap\)\])"')

    return dict(dialog=dialog, stepper_cls=stepper_cls, title_cls=title_cls, counter_cls=counter_cls, value_cls=value_cls, dec=dec, inc=inc,
                confirm_cls=confirm_cls, h2_cls=h2_cls, p_cls=p_cls, head_cls=head_cls)

def swap_content(html, inner):
    content, (a, b) = _outer(html, lambda t: 'data-slot="responsive-sheet-content"' in t)
    open_tag = re.match(r'<div[^>]*>', content).group(0)
    html = html[:a] + open_tag + inner + '</div>' + html[b:]

    # ---- it is a required step: no handle to drag, no close button
    r = find_outer(html, lambda t: 'data-drawer-handle="true"' in t)
    if r: html = html[:r[0]] + html[r[1]:]
    r = find_outer(html, lambda t: 'data-slot="dialog-close"' in t)
    if r: html = html[:r[0]] + html[r[1]:]
    html = html.replace(' react-draggable', '')
    html = re.sub(r'(<p data-slot="(?:drawer|dialog)-description"[^>]*>)[^<]*(</p>)',
                  r"\1" + ("Choose how many people are staying. This step is required before you can start registering guests.") + r"\2", html)
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/changes.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../guestcount.js"></script><script src="../replica.js">', 1)
    return html


def rail_json(transfers_img):
    import json
    deals = [("Early check-in", "Access from 11:00", "\u20ac25", "room"), ("Parking spot", "On-site, per night", "\u20ac15", "parking"),
             ("Late check-out", "Until 14:00", "\u20ac20", "habitacion"), ("Welcome groceries", "Stocked on arrival", "\u20ac18", "mesa"),
             ("Beach gear", "Towels & parasol", "\u20ac12", "beach")]
    items = [
        {"type": "section", "label": "Offered by your host", "tone": "blue", "see": "See all"},
        {"type": "deals-carousel", "deals": [{"img": "../assets/vela/deals/%s.jpg" % n, "title": t, "sub": s, "price": p} for t, s, p, n in deals]},
        {"type": "section", "label": "Extras for your stay", "tone": "blue"},
        {"type": "ride", "img": "../assets/vela/deals/transfer-van.jpg", "kik": "Private transfers", "headline": "Your ride is ready\nwhen you land",
         "sub": "Prebook shuttles, taxis and limousines.", "from": "Airport", "to": "Your stay", "cta": "Book your ride", "sticker": "PRE-\nBOOK"},
        {"type": "tour", "img": "../assets/vela/deals/madrid4.jpg", "kik": "Walking tours", "headline": "Discover the city with local guides",
         "sub": "See the tours near your stay.", "cta": "Explore tours"},
    ]
    return json.dumps(items, ensure_ascii=False).replace("</", "<\\/")


def home_rail(html):
    """Change 3: Home (desktop) right panel = offers only, now including Transfers. Four UI directions + the previous one, switchable with ?rail=."""
    import re
    import rail_ui
    r = find_outer(html, lambda t: t.startswith('<section class="contents lg:flex lg:flex-col lg:gap-2.5"'))
    if not r:
        return html
    old = html[r[0]:r[1]]
    m = re.search(r'<img src="([^"]+)"', old)
    transfers_img = m.group(1) if m else ''
    actual = ('<div class="rv rv-actual"><chekin-vela flat-text hide-header reco-title="" heading="Offers for your stay" '
              'heading-sub="Picked for your arrival and trip \u2014 small extras to make check-in smoother."><script type="application/json">'
              + rail_json(transfers_img) + '</script></chekin-vela>' + rail_ui.esim() + '</div>')
    variants = rail_ui.all_variants(transfers_img)
    mount = '<div class="rail-vela rail-multi" data-rail="actual" data-set="htfe">' + actual + '<div class="rv rv-combo"></div>' + variants['b'] + '</div>'
    html = html[:r[0]] + mount + html[r[1]:]
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/vela-rail.css"><link rel="stylesheet" href="../assets/rail-variants.css"><link rel="stylesheet" href="../assets/rail-combo.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/vela/chekin-vela.js"></script><script src="../assets/rail.js"></script><script src="../replica.js">', 1)
    return html


EXT_ICON = ('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>')

def home_center(html, v='d'):
    """Change 68: Home centre column. Removes "Handpicked for your trip" (recommendations section) and renames the
    "Directions" link of the stay card to "Open in Maps" with an external-link icon (it opens Google Maps in a new tab)."""
    import re
    from dom import find_outer
    r = find_outer(html, lambda t: 'data-testid="recommendations-section"' in t)
    if r:
        mount = ''
        if v == 'm':
            import rail_ui
            mount = ('<section class="mob-offers" data-testid="offers-mobile"><div class="rail-vela rail-multi" data-rail="actual" data-set="htfe"><div class="rv rv-actual"><chekin-vela flat-text hide-header reco-title="" heading="Offers for your stay" '
                     'heading-sub="Picked for your arrival and trip \u2014 small extras to make check-in smoother."><script type="application/json">' + rail_json('') + '</script></chekin-vela>' + rail_ui.esim() + '</div><div class="rv rv-combo"></div>'
                     + rail_ui.all_variants('../assets/vela/deals/transfer-van.jpg')['b'] + '</div></section>')
        html = html[:r[0]] + mount + html[r[1]:]
        if v == 'm':
            html = html.replace('</head>', '<link rel="stylesheet" href="../assets/vela-rail.css"><link rel="stylesheet" href="../assets/rail-variants.css"><link rel="stylesheet" href="../assets/rail-combo.css"><link rel="stylesheet" href="../assets/offers-mobile.css"></head>', 1)
            html = html.replace('<script src="../replica.js">', '<script src="../assets/vela/chekin-vela.js"></script><script src="../assets/rail.js"></script><script src="../replica.js">', 1)

    html = re.sub(r'(rel="noopener noreferrer"[^>]*>)Directions<svg[^>]*>.*?</svg></a>', lambda m: m.group(1) + 'Open in Maps' + EXT_ICON + '</a>', html, count=1, flags=re.S)
    return html


def hero_access(html):
    """Change 70: stay card gets check-in/out times and a "How to get in" tile (keys viewer, see access.js)."""
    if 'data-testid="checkin-hero-strip"' not in html:
        return html
    cls = 'acc-time'
    html = html.replace('Wed 25 Nov</p>', 'Wed 25 Nov</p><p class="%s">from 15:00</p>' % cls, 1)
    html = html.replace('Fri 27 Nov</p>', 'Fri 27 Nov</p><p class="%s">by 11:00</p>' % cls, 1)
    html = html.replace('</p></div></div></section><section data-testid="checkin-checklist">',
                        '</p><button type="button" class="acc-tile" aria-haspopup="dialog"></button></div></div></section><section data-testid="checkin-checklist">', 1)
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/access.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/access.js"></script><script src="../replica.js">', 1)
    return html


def checkin_variants(html):
    """Home "Complete your check-in": Actual (x), C1 y N4 (por defecto, la principal) + el original sin tocar (o, solo por URL)."""
    import re
    from dom import find_outer
    r = find_outer(html, lambda t: 'data-testid="checkin-checklist"' in t)
    if not r:
        return html
    sec = html[r[0]:r[1]]
    rows, pos = [], 0
    while True:
        m = re.compile(r'<button data-slot="task-row"').search(sec, pos)
        if not m:
            break
        e = find_outer(sec[m.start():], lambda t: t.startswith('<button data-slot="task-row"'))
        rows.append(sec[m.start():m.start() + e[1]]); pos = m.start() + e[1]
    if len(rows) < 2:
        return html
    h2 = re.search(r'<h2[^>]*>.*?</h2>', sec, re.S).group(0)
    ARW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
    CAL = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
    LOCK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
    def cta(row, text):
        i = row.rindex('</button>')
        return row[:i] + '<span class="chk-cta">' + text + ' ' + ARW + '</span>' + row[i:]
    txt = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', sec))
    m_due = re.search(r'due before (\d{1,2}) ([A-Za-z]+)', txt, re.I)
    due_short = ('%s %s' % (m_due.group(1), m_due.group(2)[:3])) if m_due else '25 Nov'
    m_left = re.search(r'(\d+) steps? left', txt)
    steps_left = m_left.group(1) if m_left else '2'
    m_amt = re.search(r'(\u20ac\s?[\d.,]+) left to pay', txt)
    amount = m_amt.group(1).replace(' ', '') if m_amt else ''
    m_g = re.search(r'(\d+) of (\d+) guests', txt)
    go_label = 'Start' if (m_g and m_g.group(1) == '0') else 'Continue'
    r1 = cta(rows[0], go_label)
    r2 = cta(rows[1], ('Pay ' + amount).strip())          # N4 y anteriores: el importe sale de la propia fila
    DUE = '<span class="chk-due">' + CAL.replace('width="22" height="22"', 'width="14" height="14"') + 'Due before ' + due_short + '</span>'
    ring = ('<span class="chk-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#e9ebf6" stroke-width="7"/>'
            '<circle cx="32" cy="32" r="27" fill="none" stroke="#385bf8" stroke-width="7" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="169.6" transform="rotate(-90 32 32)"/></svg><b>0<small>/2</small></b></span>')
    x = ('<div class="chk-v chk-vx">' + h2 + '<div class="chk-card"><div class="chk-xhead">' + ring + '<div class="chk-xt"><b>Let\'s get you checked in</b><span>2 steps left · finish both to unlock your keys</span></div>' + DUE + '</div>'
         '<div class="chk-list chk-first">' + r1 + r2 + '</div></div></div>')
    band = '<div class="chk-deadline">' + CAL + '<div><b>Due before 25 November</b><span>0 of 2 steps done</span></div></div>'
    c1 = ('<div class="chk-v chk-vc1">' + h2 + '<div class="chk-card">' + band + '<div class="chk-list chk-first"><div>' + r1 + '</div><div>' + r2 + '</div></div></div></div>')
    LOCK_S = LOCK.replace('width="18" height="18"', 'width="16" height="16"')
    CLOCK_S = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    # N4-N7: sin el titulo "Complete your check-in"; la propia tarjeta lleva su cabecera (un h2 pequeño, para no perder la estructura)
    CLK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5v7"/><path d="M12 17.6v.1"/></svg>'  # simbolo de alerta (!)
    def pend(row):
        """N4: adornos de estado "pendiente" (se muestran segun la variante P1-P4): chip junto al titulo, reloj sobre el icono y etiqueta sobre el icono."""
        row = re.sub(r'(flex-col"><span [^>]*>)([^<]+)(</span>)', lambda m: m.group(1) + m.group(2) + '<span class="chk-pt">Pending</span>' + m.group(3), row, count=1)
        row = row.replace('</span><span class="flex min-w-0 flex-1 flex-col">', '<i class="chk-pclock" aria-hidden="true">' + CLK + '</i></span><span class="flex min-w-0 flex-1 flex-col">', 1)
        i = row.rindex('</button>')
        return row[:i] + '<span class="chk-ptag" aria-hidden="true">Pending</span>' + row[i:]
    r1n, r2n = pend(r1), pend(r2)
    n4 = ('<div class="chk-v chk-vn4"><div class="chk-card chk-k4"><div class="chk-k4h"><span class="chk-k4l">' + LOCK_S + '<h2 class="chk-ht">' + steps_left + ' steps to unlock your keys</h2></span>'
          '<span class="chk-k4d">' + CLOCK_S + 'Due before ' + due_short + '</span></div>'
          '<div class="chk-list chk-first"><div>' + r1n + '</div><div>' + r2n + '</div></div></div></div>')
    cc = c1 + n4
    orig = sec.replace('<section data-testid="checkin-checklist"', '<section data-testid="checkin-checklist" class="chk-orig"', 1)
    html = html[:r[0]] + '<div class="chk-wrap">' + orig + x + cc + '</div>' + html[r[1]:]
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/checkin.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/checkin.js"></script><script src="../replica.js">', 1)
    return html


def hub_variants():
    """Registration: versiones V1 (original mejorada), V2 (lista única), V4 (siguiente paso). V3 = estilo home."""
    def ic(p, w=18): return '<svg viewBox="0 0 24 24" width="%d" height="%d" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>' % (w, w, p)
    ARW = ic('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 15)
    CHV = ic('<path d="m9 18 6-6-6-6"/>', 20)
    PLUS = ic('<path d="M12 5v14M5 12h14"/>', 18)
    CHK = ic('<path d="M20 6 9 17l-5-5"/>', 13)
    CIR = ic('<circle cx="12" cy="12" r="8"/>', 13)
    USER = ic('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>', 20)
    ring = ('<span class="v1-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#e9ebf6" stroke-width="7"/>'
            '<circle cx="32" cy="32" r="27" fill="none" stroke="#385bf8" stroke-width="7" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="84.8" transform="rotate(-90 32 32)"/></svg><b>1<small>/2</small></b></span>')
    share = '<div class="hv-share"><p><b>Not together right now?</b> Share a link so the others can register from their own phone.</p><button type="button" class="hv-lnk">Share</button></div>'
    v1 = ('<div class="hv hv1"><div class="v1-sum">' + ring + '<span class="v1-st"><b>1 of 2 guests registered</b><span>Next step: verify Test Guest Demo\'s ID</span></span>'
          '<button type="button" class="v1-ico" aria-label="Change guest count" data-to="home-sheet">' + ic('<circle cx="9" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M19 8v6M22 11h-6"/>', 18) + '</button></div>'
          '<h3 class="v1-h">Booking holder</h3>'
          '<div class="v1-row"><span class="v1-av">TG</span><span class="v1-tx"><b>Test Guest Demo</b><span>You · Details saved</span><em class="v1-chip">ID verification pending</em></span>'
          '<button type="button" class="v1-btn" data-to="iv-1-intro">Verify ID ' + ARW + '</button></div>'
          '<h3 class="v1-h">Other guests</h3>'
          '<div class="v1-row v1-empty"><span class="v1-av v1-dash">' + PLUS + '</span><span class="v1-tx"><b>Guest 2</b><span>Not added yet</span></span>'
          '<button type="button" class="v1-btn v1-sec" data-to="g2-form-empty">Add guest</button></div></div>')
    v2 = ('<div class="hv hv2"><div class="v2-card"><div class="v2-top"><b>Details saved for 1 of 2 guests</b><span>Due before 25 Nov</span></div>'
          '<div class="v2-bar" role="progressbar" aria-valuemin="0" aria-valuemax="2" aria-valuenow="1" aria-label="Guests with details saved"><i></i></div>'
          '<div class="v2-row"><span class="v2-av">TG</span><span class="v2-tx"><b>Test Guest Demo<em>Booking holder</em></b>'
          '<span class="v2-steps"><span class="ok">' + CHK + 'Details</span><span class="todo">' + CIR + 'ID verification</span></span></span>'
          '<button type="button" class="v2-btn" data-to="iv-1-intro">Verify ID</button></div>'
          '<div class="v2-row"><span class="v2-av v2-dash">' + USER + '</span><span class="v2-tx"><b>Guest 2</b><span class="v2-steps"><span class="todo">' + CIR + 'Not added yet</span></span></span>'
          '<button type="button" class="v2-btn v2-sec" data-to="g2-form-empty">Add guest</button></div>'
          '<div class="v2-foot"><button type="button" class="hv-lnk">Share a link for the others</button><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div></div></div>')
    v4 = ('<div class="hv hv4"><div class="v4-hero"><span class="v4-eye">Next step</span><h2>Verify Test Guest Demo\'s ID</h2>'
          '<p>Finish this registration to move closer to unlocking your keys.</p><button type="button" class="v4-go" data-to="iv-1-intro">Verify ID ' + ARW + '</button></div>'
          '<div class="v4-hd"><b>Guests</b><span>1 of 2 registered</span></div>'
          '<div class="v4-list"><button type="button" class="v4-g" data-to="iv-1-intro"><span class="v4-av">TG</span><span class="v4-tx"><b>Test Guest Demo</b><span>You · Details saved · ID pending</span></span>' + CHV + '</button>'
          '<button type="button" class="v4-g v4-add" data-to="g2-form-empty"><span class="v4-av v4-dash">' + PLUS + '</span><span class="v4-tx"><b>Add guest 2</b><span>Fill in now or send them a link</span></span>' + CHV + '</button></div>'
          '<div class="v4-links"><button type="button" class="hv-lnk">Share a link</button><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div></div>')

    HOLDER = lambda btn: ('<h3 class="v1-h">Booking holder</h3><div class="v1-row"><span class="v1-av">TG</span><span class="v1-tx"><b>Test Guest Demo</b><span>You · Details saved</span><em class="v1-chip">ID verification pending</em></span>'
        + ('<button type="button" class="v1-btn" data-to="iv-1-intro">Verify ID ' + ARW + '</button>' if btn else '<button type="button" class="v1-go" data-to="iv-1-intro" aria-label="Open Test Guest Demo">' + CHV + '</button>') + '</div>')
    OTHER = lambda btn: ('<h3 class="v1-h">Other guests</h3><div class="v1-row v1-empty"><span class="v1-av v1-dash">' + PLUS + '</span><span class="v1-tx"><b>Guest 2</b><span>Not added yet</span></span>'
        + ('<button type="button" class="v1-btn v1-sec" data-to="g2-form-empty">Add guest</button>' if btn else '<button type="button" class="v1-go" data-to="g2-form-empty" aria-label="Add guest 2">' + CHV + '</button>') + '</div>')
    v1b = ('<div class="hv hv1b"><div class="v1b-prog"><div class="v1b-t"><b>1 of 2 guests registered</b><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>'
           '<div class="v2-bar" role="progressbar" aria-valuemin="0" aria-valuemax="2" aria-valuenow="1" aria-label="Guests registered"><i></i></div>'
           '<span class="v1b-n">Next step: verify Test Guest Demo\'s ID</span></div>' + HOLDER(True) + OTHER(True) + '</div>')
    v1c = ('<div class="hv hv1c"><div class="v1-sum">' + ring + '<span class="v1-st"><b>1 of 2 guests registered</b><span>Next step: verify Test Guest Demo\'s ID</span></span>'
           '<button type="button" class="v1-ico" aria-label="Change guest count" data-to="home-sheet">' + ic('<circle cx="9" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M19 8v6M22 11h-6"/>', 18) + '</button></div>' + HOLDER(False) + OTHER(False) + '</div>')
    GUESTS = ('<div class="v4-hd"><b>Guests</b><span>1 of 2 registered</span></div>'
          '<div class="v4-list"><button type="button" class="v4-g" data-to="iv-1-intro"><span class="v4-av">TG</span><span class="v4-tx"><b>Test Guest Demo</b><span>You · Details saved · ID pending</span></span>' + CHV + '</button>'
          '<button type="button" class="v4-g v4-add" data-to="g2-form-empty"><span class="v4-av v4-dash">' + PLUS + '</span><span class="v4-tx"><b>Add guest 2</b><span>Fill in now or send them a link</span></span>' + CHV + '</button></div>'
          '<div class="v4-links"><button type="button" class="hv-lnk">Share a link</button><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>')
    v4b = ('<div class="hv hv4b"><div class="v4b-hero"><span class="v4b-eye">Next step</span><h2>Verify Test Guest Demo\'s ID</h2>'
           '<ul class="v4b-steps"><li class="ok">' + CHK + 'Details saved</li><li class="now">' + CIR + 'ID verification</li></ul>'
           '<button type="button" class="v4b-go" data-to="iv-1-intro">Verify ID ' + ARW + '</button></div>' + GUESTS + '</div>')
    v4c = ('<div class="hv hv4c"><div class="v4c-strip"><span class="v4c-dot" aria-hidden="true">!</span><span class="v4c-tx"><b>Verify Test Guest Demo\'s ID</b><span>Next step</span></span>'
           '<button type="button" class="v1-btn" data-to="iv-1-intro">Verify ID</button></div>' + GUESTS + '</div>')
    v5 = ('<div class="hv hv5"><div class="v5-prog"><span class="v5-dots" aria-hidden="true"><i class="half"></i><i></i></span><b>1 of 2 guests registered</b><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>'
          '<div class="v5-card v5-open"><div class="v5-head"><span class="v5-av">TG</span><span class="v5-tx"><b>Test Guest Demo</b><span>You · Booking holder</span></span><span class="v5-badge">1 step left</span></div>'
          '<ol class="v5-steps"><li class="done"><span class="v5-n">' + CHK + '</span><span class="v5-s"><b>Details</b><span>Saved</span></span></li>'
          '<li class="cur"><span class="v5-n">2</span><span class="v5-s"><b>ID verification</b><span>Pending</span></span><button type="button" class="v1-btn" data-to="iv-1-intro">Verify ID ' + ARW + '</button></li></ol></div>'
          '<div class="v5-card"><div class="v5-head"><span class="v5-av v5-dash">' + PLUS + '</span><span class="v5-tx"><b>Guest 2</b><span>Not added yet</span></span>'
          '<button type="button" class="v1-btn v1-sec" data-to="g2-form-empty">Add guest</button></div></div>'
          '<div class="v4-links"><button type="button" class="hv-lnk">Share a link for the others</button></div></div>')

    # ---- 4 huéspedes: 1 registrado (Ana), 1 pendiente (titular), 2 sin registrar ----
    TICKS = ic('<path d="M20 6 9 17l-5-5"/>', 14)
    def h_row(btn, sub=True):
        return ('<div class="v1-row"><span class="v1-av">TG</span><span class="v1-tx"><b>Test Guest Demo</b>' + ('<span>You · Details saved</span>' if sub else '') + '<em class="v1-chip">ID verification pending</em></span>'
                + ('<button type="button" class="v1-btn" data-to="iv-1-intro">Verify ID ' + ARW + '</button>' if btn else '<button type="button" class="v1-go" data-to="iv-1-intro" aria-label="Open Test Guest Demo">' + CHV + '</button>') + '</div>')
    def r_row(sub=True):
        return ('<div class="v1-row"><span class="v1-av v1-ok">AG</span><span class="v1-tx"><b>Ana García</b>' + ('<span>Details saved · ID verified</span>' if sub else '') + '<em class="v1-chip v1-chip-ok">Registered</em></span>'
                '<button type="button" class="v1-kebab" aria-label="Guest actions for Ana García" aria-haspopup="menu">' + ic('<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>', 22) + '</button></div>')
    def a_row(n, btn):
        return ('<div class="v1-row v1-empty"><span class="v1-av v1-dash">' + PLUS + '</span><span class="v1-tx"><b>Guest ' + str(n) + '</b><span>Not added yet</span></span>'
                + ('<button type="button" class="v1-btn" data-to="g2-form-empty">Add guest</button>' if btn else '<button type="button" class="v1-go" data-to="g2-form-empty" aria-label="Add guest ' + str(n) + '">' + CHV + '</button>') + '</div>')
    def sec(title, *rows): return '<h3 class="v1-h">' + title + '</h3><div class="v1-stack">' + ''.join(rows) + '</div>'
    LINKS = '<div class="v4-links"><button type="button" class="hv-lnk">Share a link</button><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>'
    HERO = ('<div class="v4-hero"><span class="v4-eye">Next step</span><h2>Verify Test Guest Demo\'s ID</h2>'
            '<p>Finish this registration to move closer to unlocking your keys.</p><button type="button" class="v4-go" data-to="iv-1-intro">Verify ID ' + ARW + '</button></div>')
    v1b = ('<div class="hv hv1b"><div class="v1b-prog"><div class="v1b-t"><b>1 of 4 guests registered</b><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>'
           '<div class="v1b-seg" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Guests registered"><i class="full"></i><i class="half"></i><i></i><i></i></div>'
           '<span class="v1b-n">Next step: verify Test Guest Demo\'s ID</span></div>'
           + sec('Booking holder', h_row(True)) + sec('Other guests', r_row(), a_row(3, True), a_row(4, True)) + '</div>')
    v4 = ('<div class="hv hv4">' + HERO + sec('Booking holder', h_row(True)) + sec('Other guests', r_row(), a_row(3, False), a_row(4, False)) + LINKS + '</div>')   # V4 base, ahora con secciones y 4 huéspedes
    n1 = ('<div class="hv hv4n1">' + HERO + sec('Booking holder', h_row(True, False)) + sec('Other guests', r_row(False), a_row(3, True), a_row(4, True)) + LINKS + '</div>')
    mini = lambda n: a_row(n, False).replace('v1-row v1-empty', 'v1-row v1-empty v1-mini')
    n2 = ('<div class="hv hv4n2">' + HERO + sec('Booking holder', h_row(False)) + sec('Other guests', r_row(), mini(3), mini(4)) + LINKS + '</div>')
    grp = ('<div class="v1-row v1-empty"><span class="v1-av v1-dash">+2</span><span class="v1-tx"><b>2 guests not added yet</b><span>Fill them in now or send each a link</span></span>'
           '<button type="button" class="v1-btn v1-sec" data-to="g2-form-empty">Add guests</button></div>')
    n3 = ('<div class="hv hv4n3">' + HERO + sec('Booking holder', h_row(False)) + sec('Other guests', r_row(), grp) + LINKS + '</div>')
    seg = lambda cls: '<i class="' + cls + '"></i>'
    hero4 = ('<div class="v4-hero"><span class="v4-eye">Next step · 1 of 4 registered</span><h2>Verify Test Guest Demo\'s ID</h2>'
             '<div class="v4n4-seg" aria-hidden="true">' + seg('full') + seg('half') + seg('') + seg('') + '</div>'
             '<button type="button" class="v4-go" data-to="iv-1-intro">Verify ID ' + ARW + '</button></div>')
    n4 = ('<div class="hv hv4n4">' + hero4 + sec('Booking holder · 1', h_row(False)) + sec('Other guests · 3', r_row(), a_row(3, False), a_row(4, False)) + LINKS + '</div>')

    # ---- V4·1a/b/c: filas "sin añadir" que se vean clicables ----
    def m_solid(n):   # a: fila sólida (sin borde discontinuo), avatar azul claro
        return ('<div class="v1-row"><span class="v1-av v1-tint">' + PLUS + '</span><span class="v1-tx"><b>Guest ' + str(n) + '</b><span>Not added yet</span></span>'
                '<button type="button" class="v1-btn" data-to="g2-form-empty">Add guest</button></div>')
    def m_btn(n):     # b: la fila entera es un botón
        return ('<button type="button" class="v4m-add" data-to="g2-form-empty"><span class="v4m-pl">' + PLUS + '</span><span class="v4m-t">Add guest ' + str(n) + '</span>' + ARW + '</button>')
    def m_chip(n):    # c: misma lógica de chip que el resto de estados
        return ('<div class="v1-row"><span class="v1-av v1-grey">G' + str(n) + '</span><span class="v1-tx"><b>Guest ' + str(n) + '</b><em class="v1-chip v1-chip-na">Not added</em></span>'
                '<button type="button" class="v1-btn" data-to="g2-form-empty">Add guest</button></div>')
    def mk(cls, a3, a4): return ('<div class="hv ' + cls + '">' + HERO + sec('Booking holder', h_row(True, False)) + sec('Other guests', r_row(False), a3, a4) + LINKS + '</div>')
    m1 = mk('hv4m1', m_solid(3), m_solid(4)); m2 = mk('hv4m2', m_btn(3), m_btn(4)); m3 = mk('hv4m3', m_chip(3), m_chip(4))

    # ---- V5a/b/c: la tarjeta degradada de V4 pasa a ser un resumen del registro (sin "siguiente paso") ----
    USERS_P = ic('<circle cx="9" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M19 8v6M22 11h-6"/>', 15)
    CLK = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14)
    SHR = ic('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>', 15)
    pill = lambda ic_, t, cls='': '<button type="button" class="v5h-pill ' + cls + '" data-to="home-sheet">' + ic_ + '<span>' + t + '</span></button>'
    segs = '<div class="v4n4-seg" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Guests registered">' + seg('full') + seg('half') + seg('') + seg('') + '</div>'
    BODY = sec('Booking holder', h_row(True, False)) + sec('Other guests', r_row(False), m_solid(3), m_solid(4))
    v5a = ('<div class="hv hv5a"><div class="v4-hero v5-hero"><div class="v5h-top"><span class="v4-eye">Registration</span>' + pill(USERS_P, 'Change guest count') + '</div>'
           '<h2 class="v5h-big"><b>1</b> of 4 guests registered</h2>' + segs + '<p class="v5h-st">1 pending · 2 not added yet</p></div>' + BODY + '<div class="v4-links"><button type="button" class="hv-lnk">Share a link</button></div></div>')
    ring5 = ('<span class="v5b-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/>'
             '<circle cx="32" cy="32" r="27" fill="none" stroke="#37e08f" stroke-width="7" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="127.2" transform="rotate(-90 32 32)"/></svg><b>1<small>/4</small></b></span>')
    stats = ('<div class="v5b-stats"><div><i class="g"></i><b>1</b><span>Registered</span></div><div><i class="y"></i><b>1</b><span>Pending</span></div><div><i class="n"></i><b>2</b><span>Not added</span></div></div>')
    v5b = ('<div class="hv hv5b"><div class="v4-hero v5-hero"><span class="v4-eye">Registration</span>'
           '<div class="v5b-main">' + ring5 + '<span class="v5b-tx"><b>1 of 4 guests registered</b><span>Booking for 4 guests</span></span></div>' + stats + pill(USERS_P, 'Change guest count', 'v5h-full') + '</div>'
           + BODY + '<div class="v4-links"><button type="button" class="hv-lnk">Share a link</button></div></div>')
    v5c = ('<div class="hv hv5c"><div class="v4-hero v5-hero"><div class="v5h-top"><span class="v4-eye">Registration</span><span class="v5h-due">' + CLK + 'Due before 25 Nov</span></div>'
           '<h2 class="v5h-big"><b>1</b> of 4 guests registered</h2>' + segs + '<p class="v5h-st">Pending: Test Guest Demo · 2 spots still empty</p>'
           '<div class="v5c-acts">' + pill(USERS_P, 'Change guest count') + '<button type="button" class="v5h-pill">' + SHR + '<span>Share a link</span></button></div></div>' + BODY + '</div>')

    # ---- Other minor guests: sale Guest 4 de Other guests y entra un menor en estado pendiente ----
    def minor_row(sub):
        return ('<div class="v1-row"><span class="v1-av">LG</span><span class="v1-tx"><b>Leo García</b>' + ('<span>Under 18</span>' if sub else '') + '<em class="v1-chip">Details pending</em></span>'
                '<button type="button" class="v1-btn" data-to="g2-form-empty">Complete details</button></div>')
    seg4 = '<i class="full"></i><i class="half"></i><i class="half"></i><i></i>'
    v1b = ('<div class="hv hv1b"><div class="v1b-prog"><div class="v1b-t"><b>1 of 4 guests registered</b><button type="button" class="hv-lnk" data-to="home-sheet">Change guest count</button></div>'
           '<div class="v1b-seg" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Guests registered">' + seg4 + '</div>'
           '<span class="v1b-n">Next step: verify Test Guest Demo\'s ID</span></div>'
           + sec('Booking holder', h_row(True)) + sec('Other guests', r_row(), a_row(3, True)) + sec('Other minor guests', minor_row(True)) + '</div>')
    BODY3 = sec('Booking holder', h_row(True, False)) + sec('Other guests', r_row(False), m_solid(3)) + sec('Other minor guests', minor_row(False))
    m1 = '<div class="hv hv4m1">' + HERO + BODY3 + LINKS + '</div>'
    segs3 = '<div class="v4n4-seg" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Guests registered">' + seg4 + '</div>'
    v5c = ('<div class="hv hv5c"><div class="v4-hero v5-hero"><div class="v5h-top"><span class="v4-eye">Registration</span><span class="v5h-due">' + CLK + 'Due before 25 Nov</span></div>'
           '<h2 class="v5h-big"><b>1</b> of 4 guests registered</h2>' + segs3 + '<p class="v5h-st">2 pending · 1 not added yet</p>'
           '<div class="v5c-acts">' + pill(USERS_P, 'Change guest count') + '<button type="button" class="v5h-pill">' + SHR + '<span>Share a link</span></button></div></div>' + BODY3 + '</div>')
    return v1 + v2 + v4 + v1b + v1c + v4b + v4c + v5 + n1 + n2 + n3 + n4 + m1 + m2 + m3 + v5a + v5b + v5c


def hub_style(html, v='m'):
    """Registration (guest summary): el contador y las secciones pasan a una tarjeta con el estilo de la de check-in de la home
    (cabecera con degradado, filas con insignia + estado pendiente/hecho, CTA azul). Tres estados: sin empezar, en camino, completado (hub.js)."""
    import re
    from dom import find_outer
    if 'guest-register-view' not in html or 'data-slot="progress-ring"' not in html:
        return html
    a = find_outer(html, lambda t: 'gap-[14px] rounded-[var(--card-radi' in t)
    b = find_outer(html, lambda t: t == '<div class="flex w-full flex-col gap-4">')
    if not a or not b or b[0] < a[1]:
        return html
    kb = re.search(r'<button type="button" aria-label="Guest actions".*?</button>', html, re.S)
    KEBAB = '<span class="hub-kebab">' + (kb.group(0) if kb else '') + '</span>'
    def ic(p, w=18): return '<svg viewBox="0 0 24 24" width="%d" height="%d" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>' % (w, w, p)
    USERS = ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', 16)
    USER = ic('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>')
    USERP = ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>')
    CLOCK = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14)
    EDIT = ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 14)
    TICK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>'
    EXC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5v7"/><path d="M12 17.6v.1"/></svg>'
    ARW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
    CHV = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>'
    def row(icon, name, desc, cta, to, done=False, kebab=True):
        dot = '<i class="hub-dot" aria-hidden="true">' + (TICK if done else EXC) + '</i>'
        chip = '<span class="hub-chip" aria-hidden="true">' + ('Done' if done else 'Pending') + '</span>'
        act = ('<span class="hub-chv">' + CHV + '</span>') if done else ('<span class="hub-cta">' + cta + ' ' + ARW + '</span>')
        return ('<div class="hub-item' + (' hub-done' if done else '') + '" role="listitem"><button type="button" class="hub-row" data-to="' + to + '">'
                '<span class="hub-badge">' + icon + dot + '</span>'
                '<span class="hub-txt"><span class="hub-t">' + name + chip + '</span><span class="hub-d">' + desc + '</span></span>' + act + '</button>'
                + (KEBAB if kebab else '') + '</div>')
    def card(st, title, rows, done=False):
        if done:
            head = ('<div class="hub-h hub-hdone"><span class="hub-tick">' + TICK + '</span><h2 class="hub-ht">' + title + '</h2>'
                    '<p class="hub-sub">Everyone\'s details are in. You\'re all set</p></div>')
        else:
            head = ('<div class="hub-h"><span class="hub-hl">' + USERS + '<h2 class="hub-ht">' + title + '</h2></span>'
                    '<span class="hub-hr"><span class="hub-due">' + CLOCK + 'Due before 25 Nov</span>'
                    '<button type="button" class="hub-edit" aria-label="Change guest count">' + EDIT + '<span>Change guest count</span></button></span></div>')
        return '<div class="hub-card" data-hs="' + st + '">' + head + '<div class="hub-list" role="list">' + ''.join(rows) + '</div></div>'
    new = card('new', '2 guests to go', [
        row(USER, 'Test Guest Demo', 'You · Booking holder · Not started', 'Start', 'form-empty'),
        row(USERP, 'Guest 2', 'Not added yet', 'Add guest', 'g2-form-empty', kebab=False)])
    way = card('way', '2 guests to go', [
        row(USER, 'Test Guest Demo', 'You · Details saved · ID verification pending', 'Verify ID', 'iv-1-intro'),
        row(USERP, 'Guest 2', 'Not added yet', 'Add guest', 'g2-form-empty', kebab=False)])
    done = card('done', 'All guests registered', [
        row(USER, 'Test Guest Demo', 'You · Registered and verified', '', 'g2-submit-c', done=True),
        row(USER, 'Ana García', 'Registered and verified', '', 'g2-submit-c', done=True)], done=True)
    wrap = '<div class="hub-wrap" data-v="' + v + '">' + new + way + done + '</div>'
    wrap = wrap + hub_variants()
    html = html[:a[0]] + wrap + '<div class="hub-orig">' + html[a[0]:b[1]] + '</div>' + html[b[1]:]   # el original se queda; el estilo home solo con ?reg=home
    html = html.replace('class="flex w-full items-center gap-[14px] rounded-[14px] border', 'class="hub-share flex w-full items-center gap-[14px] rounded-[14px] border', 1)
    if v == 'm':
        try:
            import os, re as _re
            hs = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snaps', 'm', 'home.html'), encoding='utf-8').read()
            i0 = hs.find('<nav data-slot="bottom-nav"'); i1 = hs.find('</nav>', i0) + 6
            nav = hs[i0:i1]
            btns = _re.findall(r'<button data-slot="bottom-nav-item".*?</button>', nav, _re.S)
            if len(btns) == 4:
                tos = ['home', None, None, 'offers-all']
                new = []
                for k, b in enumerate(btns):
                    b = b.replace(' data-active="true" aria-current="page"', ' data-active="false"')
                    if k == 1: b = b.replace('data-active="false"', 'data-active="true" aria-current="page"', 1)
                    if tos[k]: b = b.replace('<button ', '<button data-to="%s" ' % tos[k], 1)
                    new.append(b)
                nav2 = nav
                for old, nb in zip(btns, new): nav2 = nav2.replace(old, nb, 1)
                html = html.replace('</body>', '<div class="mb-tabs">' + nav2 + '</div></body>', 1)
        except Exception as e:
            pass
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/hub.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/hub.js"></script><script src="../replica.js">', 1)
    return html


def form_assets(html):
    """Formulario de huésped: tres propuestas (hero con progreso, secciones plegables, tarjeta única) sobre el original (form.css / form.js)."""
    if 'guest-form-fields' not in html:
        return html
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/form.css"><link rel="stylesheet" href="../assets/autofill.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/form.js"></script><script src="../assets/autofill-data.js"></script><script src="../assets/autofill.js"></script><script src="../replica.js">', 1)
    return html


def registered_assets(html):
    """Página "Guest registered" (g2-registered): tres variantes (registered.css / registered.js)."""
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/vela-rail.css"><link rel="stylesheet" href="../assets/rail-variants.css"><link rel="stylesheet" href="../assets/rail-combo.css"><link rel="stylesheet" href="../assets/offers-mobile.css"><link rel="stylesheet" href="../assets/registered.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/vela/chekin-vela.js"></script><script src="../assets/registered.js"></script><script src="../replica.js">', 1)
    return html


def iv_assets(html):
    """Identity verification (g2-iv): flujo documento → partes → selfie → verificado (iv.css / iv.js)."""
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/ivskip.css"><link rel="stylesheet" href="../assets/iv.css"><style>html:not([data-iv-rail="1"]) aside{visibility:hidden;animation:ivRailShow 0s 1.2s forwards}@keyframes ivRailShow{to{visibility:visible}}</style></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/ivskip.js"></script><script src="../assets/iv.js"></script><script src="../replica.js">', 1)
    return html


def ivintro_assets(html):
    """Intro de la identity verification: píldora de duración y aviso de privacidad (ivintro.css / ivintro.js)."""
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/ivskip.css"><link rel="stylesheet" href="../assets/ivintro.css"></head>', 1)
    html = html.replace('<script src="../replica.js">', '<script src="../assets/ivskip.js"></script><script src="../assets/ivintro.js"></script><script src="../replica.js">', 1)
    return html
