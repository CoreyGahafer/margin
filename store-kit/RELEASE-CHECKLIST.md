# Submission checklist — Margin 0.3.1

## Prepared files

- `../dist/margin-extension.zip`: uploadable package, with `manifest.json` at its root.
- `assets/store-icon-128.png`: 128×128 PNG store icon; also embedded in the extension.
- `assets/promo-440x280.png`: required small promotional tile.
- `assets/marquee-1400x560.png`: optional marquee artwork.
- `assets/screenshot-01-1280x800.png`, `assets/screenshot-02-1280x800.png`, and `assets/screenshot-03-streaming-1280x800.png`: validated store screenshots.
- `LISTING.md`: name, short description, full description, category, language.
- `DASHBOARD-ANSWERS.md`: single purpose, permission explanations, remote-code answer, data disclosures.
- `REVIEWER-INSTRUCTIONS.md`: test steps and original sample text.
- `site/`: privacy policy and optional landing page, ready to host.
- `legal/`: pinned dependency sources, licenses, and provenance review.

## Publisher steps remaining

1. Finish Chrome Web Store developer registration and account verification.
2. Enter the confirmed support email, cgahafer89@gmail.com, in the dashboard. It is included in the policy and listing copy.
3. Verify https://coreygahafer.github.io/margin/privacy.html loads without login and enter that URL in the dashboard.
4. Application license is confirmed as GPL-3.0-or-later. Verify the matching source download at https://github.com/CoreyGahafer/margin/releases/tag/v0.3.1 remains publicly accessible. See `legal/RELEASE-REVIEW.md`.
5. Install the final ZIP in a fresh Chrome profile. Test extraction and the site-specific permission prompt; these native browser integration steps cannot be certified by a plain webpage preview alone.
6. Upload the ZIP, images, listing copy, privacy answers, and reviewer instructions. Review every declaration before certifying it.
7. Choose visibility and distribution settings. For a limited initial rollout, use an unlisted listing if the dashboard supports your desired distribution.
8. Submit for review with manual publication if you want to inspect the approved listing before release.

The kit does not register an account, deploy a website, upload a store item, select a license on your behalf, or submit for review. Store approval is a separate review process.
