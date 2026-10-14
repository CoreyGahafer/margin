# Privacy practices and permission explanations

These answers describe build 0.3.1. Review them as the publisher before certifying the dashboard declarations.

## Single purpose

Convert article text or user-pasted text into locally generated speech for listening and WAV download inside Chrome.

## activeTab

Provides temporary access to the article tab when the user invokes Margin from its toolbar icon. Margin reads page content only after the user chooses “Read this tab.” It does not continuously monitor pages.

## tabs

Identifies the active tab and its current URL when the user chooses “Read this tab.” The URL is needed to identify unsupported pages and request optional access only to that website if temporary activeTab access is unavailable. Margin does not enumerate browsing history or track visits in the background.

## scripting

Runs the packaged Mozilla Readability extractor and selection-reading script in the user-requested article tab. These scripts extract article text for local narration. No remote scripts are injected or executed.

## sidePanel

Displays the article text, voice and speed choices, generation controls, streaming playback, and WAV download in Chrome's side panel beside the article.

## Optional host permissions: http://*/* and https://*/*

Article websites are not known at installation. These optional patterns let Margin request one specific website origin when the user chooses “Allow this site.” Runtime permission requests use the current website origin, not all websites. Site access is used only for user-requested article extraction. Pasting text and generating speech do not require website access.

## Remote code

Select: **No, I am not using remote code.**

All JavaScript, the WebAssembly inference runtime, the pronunciation engine, the KittenTTS model, and voice data are included in the extension ZIP. Runtime asset requests are to packaged extension URLs. The extension does not download models, executable code, or pronunciation data. `wasm-unsafe-eval` allows the packaged ONNX WebAssembly runtime to run; it does not enable remote code or JavaScript eval.

## Data-type disclosures

Do not claim that Margin handles no user data simply because processing is local. Google's FAQ expressly requires disclosure for local processing.

Recommended selections for this build:

- **Website content:** article text, selected text, article title and author, and user-pasted text used to create speech. Processing is local and temporary.
- **Web history:** the active page's URL is accessed only for the requested extraction and site-access flow. Explain that this is current-page metadata; no visit history is collected, tracked, uploaded, or retained.

Margin does not independently request identity details, passwords, payment information, health records, or email accounts, and does not collect analytics, clicks, or keystroke logs. Content the user chooses to narrate may itself contain sensitive information; it receives the same local-only processing. If the dashboard wording differs, classify the actual handled data conservatively and keep the policy and declarations consistent.

## Data-use certifications

This build does not sell or transfer article data to third parties; use it for advertising, profiling, creditworthiness, or lending; or use it for purposes unrelated to the visible article-to-audio feature. No developer-side system receives the user's article text or audio. Certify the corresponding dashboard statements only after confirming that you have not added integrations or telemetry.

## Privacy policy URL

Host `site/privacy.html` at a public HTTPS URL and paste that URL here. Publishing the local HTML file alone does not create a public URL. The optional hosting instructions are in `SITE-HOSTING.md`.

## Official references

- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq (especially questions 3 and 14)
- https://developer.chrome.com/docs/webstore/program-policies/permissions
