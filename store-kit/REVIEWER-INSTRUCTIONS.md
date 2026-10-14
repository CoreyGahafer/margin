# Reviewer test instructions

No login, payment, account credentials, external service, local server, or model download is required. The extension bundles its model and runtime.

1. Pin Margin and click its toolbar icon to open the side panel.
2. Expand “Review or paste text” and paste the sample text below.
3. Choose Luna and 1× narration, then click “Make audio.” The first run initializes the local model and may take longer. Playback starts after the first passage is generated; later passages continue generating in the worker.
4. During generation, use “Pause listening” and “Resume listening.” Pausing playback does not pause generation. “Cancel generation” stops both synthesis and its streaming audio.
5. When generation completes, the full player continues at the current position. “Save WAV” downloads the complete locally generated file.
6. Generate the same text at 1.5× narration. The downloaded audio should be shorter. The separate Playback speed affects listening only and becomes available after generation finishes.
7. To test extraction, open an ordinary HTTPS article, invoke Margin on that tab, and click “Read this tab.” If temporary access is unavailable, click “Allow this site.” The permission prompt is for that website only. The extracted text can be reviewed before generation. Highlighting a passage extracts only that selection.
8. To test offline generation, leave the side panel open, disconnect network access, paste text, and generate again. Model and runtime files are packaged; no inference request goes to a server.

Keep the side panel open while listening and generating. Chrome internal pages, the Web Store, and PDF viewers are intentionally unsupported for extraction. Generation speed depends on CPU resources. No voice cloning is included.

## Sample text (original content supplied with Margin)

The overlooked art of walking

A walk does not need a destination to be useful. It can begin with a familiar street, a quiet corner, or a small patch of green you usually pass without noticing. The point is to make a little room for attention.

At a slower pace, the ordinary becomes easier to see. A tree changes color. A window catches the afternoon light. Someone has planted flowers beside a doorway. These details were there yesterday, but today you have time to notice them.

Walking also gives a thought somewhere to go. A question that seemed tangled at a desk can become simpler after a few blocks. There is no promise of an answer, only a change of rhythm and a chance to listen to yourself.

On the way home, leave the last few minutes unplanned. Take a slightly different turn. Notice one new thing. A good walk can be short, and a small change of pace can stay with you for the rest of the day.
