"""Home (desktop) right panel: four UI directions for an offers-only panel that now includes Transfers."""

DEALS = [('Early check-in', 'Access from 11:00', '€25', 'room'),
         ('Parking spot', 'On-site, per night', '€15', 'parking'),
         ('Late check-out', 'Until 14:00', '€20', 'habitacion'),
         ('Welcome groceries', 'Stocked on arrival', '€18', 'mesa'),
         ('Beach gear', 'Towels & parasol', '€12', 'beach')]
TOUR_IMG = '../assets/vela/deals/madrid4.jpg'
def img(n): return '../assets/vela/deals/%s.jpg' % n

def svg(d, size=16, sw=2, fill='none'):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="%s" stroke="currentColor" stroke-width="%s" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, fill, sw, d))
EXT = svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', 13)
PLUS = svg('<path d="M5 12h14"/><path d="M12 5v14"/>', 16, 2.4)
CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 16, 2.6)
ARROW = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 14, 2.4)

def head():
    return ('<header class="rp-head"><h2>Offers for your stay</h2>'
            '<p>Picked for your arrival and trip — small extras to make check-in smoother.</p></header>')

def esim():
    return ('<div class="rp-esim" data-k="e"><span class="rp-esim__mark"><i></i><i></i></span><div class="rp-esim__t"><b>Activate your eSIM, no roaming</b>'
            '<small>airalo · From €4.00</small></div><span class="rp-esim__tag">Sponsored</span><button type="button" class="rp-btn rp-btn--light">View plans</button></div>')

def add_btn(label): return '<button type="button" class="rp-add" aria-pressed="false" aria-label="Add %s">%s</button>' % (label, PLUS)

# ---------------- A: featured transfers + carousel ----------------
def variant_a(T):
    cards = ''.join('<div class="rpA-card"><div class="rpA-img" style="background-image:url(%s)"><span class="rpA-price">%s</span></div><b>%s</b><span>%s</span></div>'
                    % (img(n), p, t, s) for t, s, p, n in DEALS)
    return ('<div class="rv rv-a">' + head() +
            '<article class="rpA-feature"><img src="%s" alt=""><div class="rpA-shade"></div><span class="rp-tag">Transportation</span>'
            '<div class="rpA-body"><h3>Airport &amp; City Transfers</h3><p>Prebook airport shuttles, taxis, buses and limousines, anytime and everywhere.</p>'
            '<div class="rpA-row"><span class="rp-partner">%s Partner offer</span><button type="button" class="rp-btn rp-btn--light">Book</button></div></div></article>'
            '<div class="rp-sec"><h3>Extras for your stay</h3><a class="rp-seeall">See all</a></div>'
            '<div class="rpA-rail">%s</div>'
            '<article class="rpA-promo" style="background-image:url(%s)"><span class="rpA-sticker">JOIN<br>FREE</span><span class="rp-kick">Free walking tours</span>'
            '<h3>Discover Madrid<br>with local guides</h3><button type="button" class="rp-btn rp-btn--light">Book tour %s</button></article>'
            % (T, EXT, cards, TOUR_IMG, ARROW) + esim() + '</div>')

# ---------------- B: compact grouped list ----------------
def row(thumb, title, sub, end):
    return ('<div class="rpB-row"><div class="rpB-thumb" style="background-image:url(%s)"></div><div class="rpB-txt"><b>%s</b><span>%s</span></div><div class="rpB-end">%s</div></div>'
            % (thumb, title, sub, end))
def variant_b(T):
    deals = ''.join(row(img(n), t, s, '<span class="rpB-price">%s</span>%s' % (p, add_btn(t))) for t, s, p, n in DEALS)
    return ('<div class="rv rv-b">' + head() +
            '<section class="rpB-sec" data-k="t"><h3>Getting here</h3>' +
            row(T, 'Airport &amp; City Transfers', 'Partner · shuttles, taxis, limousines', '<button type="button" class="rp-btn rp-btn--ghost">Book %s</button>' % EXT) + '</section>'
            '<section class="rpB-sec" data-k="h"><div class="rp-sec rp-sec--tight"><h3>Add to your stay</h3><a class="rp-seeall">See all</a></div>' + deals + '</section>'
            '<section class="rpB-sec" data-k="f"><h3>Things to do</h3>' +
            row(TOUR_IMG, 'Free walking tours', 'Discover Madrid with local guides', '<span class="rpB-free">Join free</span>') + '</section>' +
            esim() + '</div>')

# ---------------- C: chips + cards ----------------
def variant_c(T):
    mini = ''.join('<div class="rpC-mini" data-cat="extras"><div class="rpC-mimg" style="background-image:url(%s)"></div><b>%s</b><span>%s</span><div class="rpC-mfoot"><em>%s</em>%s</div></div>'
                   % (img(n), t, s, p, add_btn(t)) for t, s, p, n in DEALS[:4])
    return ('<div class="rv rv-c">' + head() +
            '<div class="rpC-chips" role="tablist"><button type="button" class="on" data-cat="all">All</button><button type="button" data-cat="transport">Transport</button>'
            '<button type="button" data-cat="extras">Extras</button><button type="button" data-cat="things">Tours</button></div>'
            '<div class="rpC-feed">'
            '<article class="rpC-card" data-cat="transport"><div class="rpC-photo" style="background-image:url(%s)"><span class="rp-tag">Transportation</span></div>'
            '<div class="rpC-cbody"><b>Airport &amp; City Transfers</b><p>Prebook airport shuttles, taxis, buses and limousines, anytime and everywhere.</p>'
            '<div class="rpC-cfoot"><span class="rp-partner">%s Partner offer</span><button type="button" class="rp-btn rp-btn--blue">Book</button></div></div></article>'
            '<div class="rpC-grid" data-cat="extras">%s</div>'
            '<article class="rpC-card rpC-card--wide" data-cat="things"><div class="rpC-photo rpC-photo--short" style="background-image:url(%s)"><span class="rp-tag rp-tag--green">Free</span></div>'
            '<div class="rpC-cbody"><b>Discover Madrid with local guides</b><p>Free walking tours — pay what you like at the end.</p>'
            '<div class="rpC-cfoot"><span class="rp-partner">%s Partner offer</span><button type="button" class="rp-btn rp-btn--blue">Book tour</button></div></div></article>'
            '</div>' % (T, EXT, mini, TOUR_IMG, EXT) + esim() + '</div>')

# ---------------- D: bento ----------------
def tile(n, t, s, p):
    return ('<div class="rpD-tile" style="background-image:url(%s)"><span class="rpD-price">%s</span>%s<div class="rpD-ttxt"><b>%s</b><span>%s</span></div></div>' % (img(n), p, add_btn(t), t, s))
def variant_d(T):
    tiles = ''.join(tile(n, t, s, p) for t, s, p, n in DEALS[:4])
    return ('<div class="rv rv-d">' + head() +
            '<div class="rpD-grid">'
            '<article class="rpD-wide rpD-transfer" style="background-image:url(%s)"><span class="rp-tag">Transportation</span><div class="rpD-wtxt"><b>Airport &amp; City Transfers</b>'
            '<span>Shuttles, taxis, limousines</span></div><button type="button" class="rp-btn rp-btn--light">Book %s</button></article>'
            '%s'
            '<article class="rpD-wide rpD-tour" style="background-image:url(%s)"><span class="rpA-sticker rpD-sticker">JOIN<br>FREE</span><div class="rpD-wtxt"><b>Discover Madrid</b>'
            '<span>Free walking tours with local guides</span></div><button type="button" class="rp-btn rp-btn--light">Book tour %s</button></article>'
            '</div><div class="rp-sec rp-sec--end"><a class="rp-seeall">See all offers</a></div>' % (T, EXT, tiles, TOUR_IMG, ARROW) + esim() + '</div>')

def all_variants(T):
    return {'a': variant_a(T), 'b': variant_b(T), 'c': variant_c(T), 'd': variant_d(T)}
