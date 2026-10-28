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
