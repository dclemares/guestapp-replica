# guestapp-replica

A static, click-through replica of the Chekin **guest app v2**, used to prototype and review UI changes (check-in, payments, deposit, tourist taxes, offers, guidebooks…) without touching the real product.

It is built from DOM snapshots of the staging app plus a layer of our own scripts and styles, so the screens keep the original components and look, and every flow can be walked through with real clicks. Nothing is saved anywhere: completing a flow never changes other screens, and reloading resets everything.

## Live demo

The `site/` folder is deployed to GitHub Pages on every push to `main`: https://dclemares.github.io/guestapp-replica/

## Run it

The `site/` folder is the ready-to-use build. Serve it with any static server:

```bash
python3 -m http.server 7791 -d site
# then open http://localhost:7791/
```

The root page opens the **mobile + desktop mockup** side by side (`split.html`): whatever you do in one frame is mirrored in the other. Single-device mockups (phone, tablet, desktop) are one click away in the top bar, and `screens.html` lists every captured screen.

## Identity verification with a QR code at the property (Italy)

`site/ivqr-flows.html` is a review page for the IV-with-QR flows: pick a design at the top, walk every screen from the **Flows** panel and change states from **Controls**. «Old design v3» follows what production does today, with our redesign on top:

- **A · Reservation link** (guest app, signed in): summaries before and in the check-in window, with every guest registered or with guests still pending; the QR scanner (same camera UI as the identity verification, the code is read when you tap «Scan QR code»); wrong property, outside the window, unreadable code and camera blocked.
- **B · Property QR** (public page with the Property Link design): find your reservation, multiple matches with document number, not found, document mismatch, and «Reservation found» that leads into the guest summary.

Live at https://dclemares.github.io/guestapp-replica/ivqr-flows.html

## Host's own deal (upselling)

`site/upsell-flows.html` is a review page for the detail view of an offer the host sells themselves (early check-in, late check-out, parking, transfer or a custom offer), redesigned to convert. Pick a design at the top, walk every screen from the **Flows** panel and change the deal from **Controls**:

- **Designs:** V1 · Direct (everything on one screen, the first free option already picked, total always in the buy bar), V2 · Showcase (large photo, with/without comparison, what you get, host note, other offers, options in a sheet) V3 · Guided (choose · review · pay), V4 · At a glance (when, where and for whom first, then what you get and how it works), V5 · Story (the headline is the result and changes with what you pick), V6 · Pick one (the decision is a list of options with benefit and price) V7 · Express (short screen, questions answered, one-tap wallet payment), and four full-screen concepts with their own visual language: V8 · Ticket (the deal as a ticket that gets stamped when bought), V9 · Chat (the host offers it in a conversation with quick replies), V10 · Stories (three full-photo screens that advance with a tap) and V11 · Your day (an itinerary drawn to scale with a switch that shows the day with and without the extra).
- **Flows:** automatic confirmation (deal → options → payment → declined card → confirmed), host approval (deal → options → send request → waiting → approved / rejected with the hold released or a refund) and offers that can't be bought (few left, sold out, past the deadline, already bought).
- **Booking settings** tab: the deal as the host sets it up in the dashboard: offer, price type, availability (time slots, days, limited quantity), confirmation, how the card is charged with approval, deadline, other offers and social proof. Price types, the charge with approval and the deadline are marked «to confirm»; social proof needs data Chekin doesn't have today.
- **Controls** tab: design, screen, offer state and a test card that is accepted or declined.
- The own offers on the Home («Offered by your host») open this deal.
- Screens `upsell-*` start from the Payments screen and `upsell.js` / `upsell.css` fill the gap. `python3 build_upsell.py` regenerates them from the built `site/` without a full rebuild; `build_replica.py` includes them too.

Live at https://dclemares.github.io/guestapp-replica/upsell-flows.html

## Property link prototype

`site/property-link/` is a standalone prototype of the **property link / user link**: the public entry point where a guest finds their booking before the online check-in. Live at https://dclemares.github.io/guestapp-replica/property-link/ (mobile + desktop mockup).

- The **Booking settings** tab of the controls panel mirrors the dashboard settings (Account → Online check-in → Guest Reservation Lookup): link type (property link / user link), lookup methods (name + arrival date, booking code, email + arrival date; one or more), ask for the property (user link only) and create the booking if not found (property link only).
- The **Controls** tab switches the search result (found, several matches → departure date, still ambiguous, not found, connection error, too many attempts), the method picker (tabs or cards), with/without property photo and a test stay length.
- Mobile never scrolls: if a state does not fit, secondary content is collapsed step by step. Desktop uses a full-screen photo with a floating card.
- When a booking is found, the header expands to full screen, shows the stay and opens the replica home.
- Sources: `plink.html`, `assets/plink.js`, `assets/plink.css`; `python3 build.py` (run inside `site/property-link/`) regenerates `screens/`. Property and generic images are loaded from Unsplash (Unsplash License).

### One click check-in

The same prototype also contains the **one click check-in** screen (switch screens from the controls panel, or open `property-link/split.html?s=one-click`). Unlike the property link, the booking is already known.

- Desktop: full-screen property photo in the brand blue with a slow looping zoom, the "Welcome to" block bottom-left and a floating **Your stay** card on the right: a journey line (Booked → Online check-in → Arrival → Departure) where the current step holds the check-in box: "0 of 3 guests checked in", Continue with Google / Apple (recommended, to save guests for next time), "Been here before?" and "Continue without an account".
- Mobile: same structure as the property link (photo header with "Welcome to"), with the **Your stay** card as the white body. No scroll.
- Flow after signing in with Google / Apple (each step replaces the content of the same card; the header photo stays in place):
  1. **Confirm who's coming**: adults and minors pre-filled from the booking, plus the steps to finish before arrival (guest registration and the payments enabled in Booking settings: security deposit, tourist tax, reservation payment).
  2. **Who's coming?**: pick the saved guests for this stay (or add someone new).
  3. **Registering…**: the same registration animation as the guest app.
  4. **What's left** (only if something is missing): who is already checked in and which guests still have pending details. "Complete details" walks through each incomplete guest in turn ("Guest 1 of 2", Save and continue / Save and finish, Back), asking only for the missing fields.
  5. **Final screen**: "N steps left before you arrive", an animated list of what is done and what is still pending, and "Opening your booking" before handing over to the guest app home.
- "Continue without an account" goes straight to the final screen and then to the guest app home.
- Booking settings include a saved-guests state where two guests have pending details (one missing 1 field, the other 5) to test long forms.
- Desktop: the card never scrolls; when content does not fit it tightens spacing, drops secondary text, switches fields to two columns and, as a last resort, scales the content down.
- Booking data is sample data.

## Rebuild

```bash
python3 build_replica.py   # regenerates site/ from snaps/ + the sources in this folder
```

The build downloads fonts and images referenced by the snapshots from the staging host, so it needs network access.

## Layout

| Path | What it is |
| --- | --- |
| `snaps/` | Captured DOM snapshots of the staging app (`m/` mobile, `d/` desktop). Session tokens and the Stripe test key were redacted. |
| `build_replica.py`, `changes*.py`, `rail_ui.py` | Build pipeline: turns the snapshots into the static site and injects our layers. |
| `own.js`/`own.css`, `hub.*`, `checkin.*`, `checkout.*`, `deposit.*`, `taxes.*`, `registered.*`, `form.*`, `iv*.*`, `pay-views.*`, … | One script/stylesheet pair per feature (home, check-in, checkout, deposit, taxes, registered guests, identity verification…). |
| `rail.js`, `rail-*.css`, `vela-rail.css` | The right-hand Vela rail with offers (private transfers, tours, eSIM) and its height-fitting logic. |
| `gbs.js`, `gbs.css`, `titles.js` | The guest-facing **Guidebook** screen: block-based guidebooks, PDF viewer, imported-HTML format, Vela section list. |
| `guidebook-editor.html` | Host-side guidebook editor prototype. |
| `gb-src/` | Generators for the sample PDF guidebooks and imported-HTML pages (`gen_pdf.py`, `gen_html.py`). |
| `panel.js`, `split.html`, `phone.html`, `compare.html` | The "Controls" panel and the mockup frames. |
| `vendor/` | Third-party assets: Vela widget, fonts, and photos (guidebook photos are from Unsplash, free to use under the Unsplash license). |
| `site/` | The generated static site. |

## Notes

- This is a design prototype, not production code. Data (names, prices, codes) is fictional.
- The captured screens belong to Chekin's guest app; this repository is meant for internal design review.
