# משחק האות — Hebrew Letter Quest

An educational browser game for 3-year-old toddlers to learn Hebrew letter shapes through audio-visual recognition and positive reinforcement.

## Features

- **27 Hebrew symbols** — all regular letters plus the 5 final forms (ך ם ן ף ץ)
- **Native Hebrew speech** — uses the device's built-in he-IL voice; auto-selects the best available voice
- **Adaptive learning** — letters answered incorrectly appear more frequently
- **Visual similarity training** — distractors are chosen from visually confusable letters (e.g. ה vs ח vs ת)
- **Progressive unlocking** — starts with 5 easy letters; new groups unlock as accuracy improves
- **Star rewards** — earn a star per correct answer; every 10 stars triggers a celebration screen
- **Special letter mode** — optionally accept both forms (כ and ך) for the same prompt
- **Parent dashboard** — protected by a simple math challenge; shows per-letter accuracy stats and controls
- **Fully offline** — no backend, no database; all state stored in `localStorage`
- **Works on** iPhone Safari, Android Chrome, and desktop browsers

## Project Structure

```
index.html          — single-page app shell
style.css           — all styles, animations, responsive layout
script.js           — complete game logic (vanilla JS, no dependencies)
assets/sounds/      — reserved for future audio assets (currently using Web Audio API)
README.md           — this file
```

## How to Run Locally

No build step required — just open the file:

```bash
# Option 1: open directly in browser
open index.html

# Option 2: serve with any static server (recommended for consistent voice API behavior)
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

> **Note:** Speech synthesis works best when the page is served (not opened as a local `file://` URL), especially on Chrome.

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and the `/ (root)` folder.
4. Click **Save**.
5. Your game will be live at `https://<username>.github.io/<repository-name>/`.

## Accessing the Parent Dashboard

Tap the small **⚙** button in the top-right corner of the game.
You will be asked to solve a simple addition problem (e.g. `5 + 3 = ?`).
Enter the correct answer to open the dashboard.

Inside the dashboard you can:
- View per-letter accuracy (sorted by worst first)
- Reset progress or stars
- Unlock all 27 letters immediately
- Enable **Special Letter Mode** (כ/ך, מ/ם, נ/ן, פ/ף, צ/ץ all accepted)
- Toggle progressive letter unlocking on/off

## Hebrew Voice Setup

The game uses the device's built-in Speech Synthesis API with preference for `he-IL` voices.

If no Hebrew voice is found, a banner is shown for parents with instructions.

- **iPhone / iPad**: Settings → Accessibility → Spoken Content → Voices → Hebrew
- **Android**: Settings → Accessibility → Text-to-Speech → Install Hebrew language pack
- **Windows**: Settings → Time & Language → Language → Add Hebrew
- **macOS**: System Settings → Accessibility → Spoken Content → System Voice → Hebrew

## Browser Support

| Browser       | Speech | Sounds | Notes |
|---------------|--------|--------|-------|
| Chrome (desktop) | ✅ | ✅ | Best experience |
| Safari (iOS)  | ✅ | ✅ | Requires first tap to unlock audio |
| Chrome (Android) | ✅ | ✅ | Install Hebrew TTS if needed |
| Firefox       | ✅ | ✅ | Hebrew voice availability varies |
| Safari (macOS) | ✅ | ✅ | |

## License

MIT — free to use, modify, and distribute.
