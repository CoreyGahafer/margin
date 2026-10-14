# Margin Chrome Web Store submission kit

This folder is the store submission kit for build **0.3.1**. Use `RELEASE-CHECKLIST.md` as the dashboard checklist. The public listing copy is in `LISTING.md`; privacy declarations and permission explanations are in `DASHBOARD-ANSWERS.md`; testing instructions are in `REVIEWER-INSTRUCTIONS.md`.

Current capture status: complete. The publisher subsequently authorized isolated headless Chrome; three 1280×800 screenshots were captured and visually checked using the actual panel code with original demonstration article text. The publisher confirmed GPL-3.0-or-later. Public repository: https://github.com/CoreyGahafer/margin. Matching source downloads accompany release v0.3.1.

## Images

Upload the individual PNG files in `assets/`, not the contact sheet. Required assets are the 128×128 icon, 440×280 promotional tile, and at least one 1280×800 screenshot. The 1400×560 marquee is optional. Icons at 16, 32, 48, and 128 pixels are embedded in the extension package.

Screenshots use original demonstration article text beside the actual Margin panel code: 01 shows article and voice choices, 02 shows the completed WAV player, and 03 shows playback while later passages generate. They are staged product demonstrations, not images of a third-party publisher's website. Article title/source metadata was staged in the fixture; generation, streaming, and playback were live. `sample-article.html` is the capture fixture; `scripts/store-art.py` is the reproducible artwork source.

## Website

`site/` is ready to upload to a static HTTPS host. It includes a privacy policy and an optional product landing page. See `SITE-HOSTING.md`. The website is also committed in `docs/` for GitHub Pages. Privacy URL: https://coreygahafer.github.io/margin/privacy.html. Verify it loads publicly before submission.

## Public source and licensing

See `legal/RELEASE-REVIEW.md`. Matching dependency source archives are prepared, and the legacy pronunciation wrapper has been replaced with a source-traceable eSpeak release. Application source is GPL-3.0-or-later. Public matching source materials: https://github.com/CoreyGahafer/margin/releases/tag/v0.3.1.

## Package

The extension ZIP to upload is `../dist/margin-extension.zip`. The submission-kit ZIP is `../dist/margin-store-kit.zip`. The larger dependency and application-source archives are separately bundled in `../dist/margin-source-materials.zip`, so the store kit stays convenient to download. Never upload either kit as the extension package: they contain supporting materials rather than a manifest at their root.

## Validation

Run `npm test`, `npm run build`, and `npm run package` after changing extension code. The package and image checker is `scripts/validate-store.py`; the source-kit builder is `scripts/package-store.py`.
