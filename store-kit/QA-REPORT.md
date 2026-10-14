# Validation — Margin 0.3.1

- Fifteen JavaScript tests passed after the source-traceable pronunciation engine was bundled.
- The extension ZIP has `manifest.json` at its root, includes PNG icons at 16/32/48/128 pixels, and includes the local privacy page with the publisher-confirmed support email.
- Unused `storage` permission and the old pronunciation binary were removed. No localhost service endpoint remains in the extension manifest or panel code.
- Model and voice-asset SHA-256 values match the recorded provenance.
- PNG icon, small promo, optional marquee, and all three screenshots have the required exact dimensions and were visually reviewed.
- Store screenshots were captured in an isolated headless Chrome session authorized by the publisher. The original article fixture and staged title/source metadata are identified as demonstration content. Real generation and playback produced the completed audio screenshot; the streaming screenshot was captured at “1 of 5 passages” while inference continued.
- With the same CSP on the page and worker responses as the installed extension, isolated Chrome produced a playable 6.92-second WAV from the bundled model and ephone engine. No Python server or remote inference endpoint was involved.
- All eight voice tables were exercised with the final pronunciation engine in Chrome. Audio output was non-silent.
- Console errors observed during browser QA were requests for a missing development-server favicon, not failures of inference, playback, or packaged assets.

The remaining checks belong to the publisher's distribution environment: load the final ZIP into a fresh Chrome profile and verify native side-panel invocation and the site-specific access prompt; confirm the application license; publish the policy and source materials; and review store declarations before certification. Website hosting and store submission have not occurred.
