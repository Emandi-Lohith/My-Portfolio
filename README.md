# Lohith's liquid glass portfolio

A responsive portfolio built with HTML, CSS, and JavaScript. No installation or build is needed.

## Preview

1. Open the `dist` folder.
2. Double-click `index.html` to open the website in your browser.
3. Move your mouse to see the glass cursor and smooth liquid bubble trail. After your first click, moving and hovering also produce quiet liquid sounds. Click to create a bubble splash and soft pop sound. Use the Sound button to mute it and the pause button to stop motion.
4. Scroll to reveal the profile, Agricompare project, and interests through liquid splashes and dispersing glass shards. Try narrowing the browser to see the phone layout.

For a local server, open a terminal in this folder and run `node preview.mjs`, then visit http://127.0.0.1:4173. Stop it with Ctrl+C. Google Fonts need internet; system fonts work offline. Pop sounds are synthesized locally and start only after a click. No audio files or tracking services are used.

## Save a snapshot

This folder already has Git initialized and a first commit saved. After making an edit, open this folder in VS Code, choose **Terminal → New Terminal**, and run:

```powershell
git add .
git commit -m "Personalize my portfolio"
```

See your latest snapshot with `git log --oneline -1`.

For a completely new copy without Git history, run `git init` before those commands. If Git asks who you are, set `git config user.name` to your name and `git config user.email` to your own email, then try the commit again.

## Make a change yourself

- **Your words and project link:** edit `dist/index.html`, save, and refresh the browser.
- **Glass colors:** edit `--bg`, `--mint`, and `--violet` at the beginning of `dist/style.css`.
- **Typing messages:** edit the `phrases` list in `dist/script.js`.
- **Pop sound volume:** adjust the `.075` gain value inside `popSound` in `dist/script.js`.

The site includes keyboard focus, reduced-motion support, a motion pause control, and a sound toggle. Mouse effects adapt to touch devices. Glass artwork and project graphics are original decorative illustrations; the Agricompare visual is not a screenshot. Only the supplied education, interests, and workshop details are used as personal facts.

