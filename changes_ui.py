"""Three visual directions for the guest-count step. Same UX and copy, different UI.
A = big number · B = people pictograms · C = booking card."""
from changes import extract_parts, swap_content, ICON_INFO

PERSON = ('<svg class="uiB-p uiB-p--%s" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4.6"/><path d="M20 21a8 8 0 0 0-16 0z"/></svg>')
ICON_PEOPLE = ('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
               '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>')

PLAIN = ('<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<circle cx="12" cy="8" r="4.6"/><path d="M20 21a8 8 0 0 0-16 0z"/></svg>')
LABEL = {'adult': ('adult', 'adults'), 'minor': ('minor', 'minors'), 'guest': ('guest', 'guests')}

def guest_count_ui(html, variant, editable, ui, notice=''):
    P = extract_parts(html)
    dec, inc = P['dec'], P['inc']
    ages = variant == 'ages'

    if ages:
        rows = [('adult', 'Adults', '18 or older on arrival day' + (''), 3),
                ('minor', 'Minors', 'Under 18 on arrival day', 2)]
        title = "Who's staying?" if editable else "Confirm who's staying"
        intro = ("Tell us how many adults and minors are coming, including you. We'll set up a check-in for each person." if editable
                 else "This is the group on your booking. We'll set up a check-in for each person.")
    else:
        rows = [('guest', 'Guests', 'Including you' if editable else '', 2)]
        title = 'How many guests are staying?' if editable else "Confirm who's staying"
        intro = ("Count everyone staying, including you and any children. We'll set up a check-in for each person." if editable
                 else "This is the group on your booking. We'll set up a check-in for each person.")
    total = sum(r[3] for r in rows)

    def d(key): return dec.replace('aria-label="Decrement"', 'aria-label="Remove one %s" data-gc="%s-dec"' % (key, key))
    def i(key): return inc.replace('aria-label="Increment"', 'aria-label="Add one %s" data-gc="%s-inc"' % (key, key))
    def num(key, value, cls, label):
        if editable:
            return ('<button type="button" class="gc-num %s" data-gc="%s-val" aria-label="%s: %d. Tap to type a number">%d</button>' % (cls, key, label, value, value))
        return '<span class="%s %s-fixed" data-gc="%s-val" aria-label="%d">%d</span>' % (cls, cls.split()[0], key, value, value)

    if ui == 'b' and not notice: notice = '2'
    TITLE, TEXT = 'Taken from your booking', 'Check that this matches who is arriving and your booking. If your group has changed, update it here.'
    ICON_CAL = ('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>')
    note_default = ('<div class="gc-note" role="note"><span class="gc-note__ic">' + ICON_INFO + '</span><div><b>' + TITLE + '</b><span>' + TEXT + '</span></div></div>')
    note_top = note_mid = note_foot = ''
    if not editable: note = ''
    elif notice == '1':
        note = ''; note_top = ('<div class="nv1" role="note"><span class="nv1__ic">' + ICON_INFO + '</span><div><b>' + TITLE + '</b><span>' + TEXT + '</span></div></div>')
    elif notice == '2':
        note = ''; note_foot = ('<p class="nv2" role="note">' + ICON_INFO + '<span><b>' + TITLE + '.</b> ' + TEXT + '</span></p>')
    elif notice == '3':
        note = ('<div class="nv3" role="note"><div class="nv3__head"><span class="nv3__ic">' + ICON_CAL + '</span><b>' + TITLE + '</b></div>'
                '<div class="nv3__chips"><span>Wed 25 Nov \u2192 Fri 27 Nov</span><span>2 nights</span><span>asasasa, Albacete</span></div>'
                '<p>' + TEXT + '</p></div>')
    else:
        note = note_default
    maxnote = ''
    escape = '' if editable else '<p class="gc-escape">Not right? Contact your host.</p>'

    if ui == 'a':
        cards = ''
        for key, t, sub, v in rows:
            cards += ('<div class="uiA-card" data-gc-row="%s"><div class="uiA-lbl">%s</div><div class="uiA-sub">%s</div>%s%s</div>'
                      % (key, t, sub, num(key, v, 'uiA-num', t), ('<div class="uiA-steps">%s%s</div>' % (d(key), i(key))) if editable else ''))
        body = '<div class="uiA-grid uiA-grid--%d">%s</div>' % (len(rows), cards)
    elif ui == 'b':
        lst = ''
        for key, t, sub, v in rows:
            ctl = ('<div class="uiB-step">%s%s%s</div>' % (d(key), num(key, v, 'uiB-num', t), i(key))) if editable else num(key, v, 'uiB-num', t)
            lst += ('<div class="uiB-row" data-gc-row="%s"><span class="uiB-key uiB-key--%s" aria-hidden="true">%s</span><div class="uiB-txt"><b>%s</b>%s</div>%s</div>'
                    % (key, key, PLAIN, t, ('<span>%s</span>' % sub) if sub else '', ctl))
        body = note_top + '<div class="uiB-list uiB-list--flat">%s</div>' % lst
    else:  # c
        hero = ('<div class="uiC-hero"><div class="uiC-top"><span>Your booking</span><span>asasasa, Albacete</span></div>'
                '<div class="uiC-dates"><div><span>Check-in</span><b>Wed 25 Nov</b></div><i>2 nights</i><div class="r"><span>Check-out</span><b>Fri 27 Nov</b></div></div>'
                '<div class="uiC-count">%s<b data-gc="hero-n">%d</b><span data-gc="hero-label">%s</span></div></div>'
                % (ICON_PEOPLE, total, 'guest' if total == 1 else 'guests'))
        lst = ''
        for key, t, sub, v in rows:
            ctl = ('<div class="uiC-step">%s%s%s</div>' % (d(key), num(key, v, 'uiC-num', t), i(key))) if editable else num(key, v, 'uiC-num', t)
            lst += ('<div class="uiC-row" data-gc-row="%s"><div class="uiC-txt"><b>%s</b>%s</div>%s</div>'
                    % (key, t, ('<span>%s</span>' % sub) if sub else '', ctl))
        body = hero + '<div class="uiC-list">%s</div>' % lst

    HOUSE = ('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>'
             '<path d="M12 17.2c-2.3-1.5-3.3-2.6-3.3-3.9a1.9 1.9 0 0 1 3.3-1.2 1.9 1.9 0 0 1 3.3 1.2c0 1.3-1 2.4-3.3 3.9z"/></svg>')
    lead = ("Confirm who's coming, then finish these steps before you arrive to unlock your keys." if editable
            else "Finish these steps before you arrive to unlock your keys.")
    foot = '' if not editable else ('<p class="nv2 gcw-foot" role="note">' + ICON_INFO + '<span>Pre-filled from your booking. Change it if your group is different, but it must match your arrival and the reservation you booked.</span></p>')
    inner = (
        '<div class="gcw">'
        '<h2 data-slot="dialog-title" class="gcw__t">Welcome to Villa Calipso</h2>'
        '<p class="gcw__p">' + lead + '</p>'
        '</div>'
        '<div class="who-coming-sheet__content flex w-full flex-col transition-opacity duration-300" data-gc-mode="%s" data-gc-editable="%s" data-gc-ui="%s">'
        '<div class="gcw-req" data-gc="req"></div>'
        '%s%s%s'
        '<button type="button" class="%s number-of-guests-form__button mt-5 flex w-full max-w-none" data-gc="confirm">%s</button>%s'
        '</div>'
    ) % (variant, 'true' if editable else 'false', ui,
         body, maxnote, foot, P['confirm_cls'], ('Confirm %d guest%s' % (total, '' if total == 1 else 's')) if editable else 'Continue', escape)
    return swap_content(html, inner)
