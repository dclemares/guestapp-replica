# guestapp-replica

A static, click-through replica of the Chekin **guest app v2**, used to prototype and review UI changes (check-in, payments, deposit, tourist taxes, offers, guidebooks…) without touching the real product.

It is built from DOM snapshots of the staging app plus a layer of our own scripts and styles, so the screens keep the original components and look, and every flow can be walked through with real clicks. Nothing is saved anywhere: completing a flow never changes other screens, and reloading resets everything.

## Run it

The `site/` folder is the ready-to-use build. Serve it with any static server:

```bash
python3 -m http.server 7791 -d site
# then open http://localhost:7791/
```

The root page opens the **mobile + desktop mockup** side by side (`split.html`): whatever you do in one frame is mirrored in the other. Single-device mockups (phone, tablet, desktop) are one click away in the top bar, and `screens.html` lists every captured screen.

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
