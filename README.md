# no-movies-quizlet 📚

A distraction-free, ultra-fast Quizlet copy featuring **Flashcards**, **Learn**, and **Match** study modes with **Catppuccin Pastel** and **Classic Dark** themes.

Zero build steps, zero bloated ads, zero paywalls. Built with modern Vanilla HTML5, CSS custom properties, and modular ES6 JavaScript.

---

## ✨ Features

- **🎴 3D Flashcards**:
  - Smooth 3D card flip animations with hardware-accelerated perspective.
  - Keyboard controls (`Space` to flip, `←` / `→` arrows to navigate, `S` to star, `R` to shuffle, `F` to swap sides).
  - Star difficulty filter (*"Study starred only"*).
  - Side swap (study Term-first or Definition-first).
- **🧠 Adaptive Learn Mode**:
  - Spaced repetition algorithm re-testing missed terms until 100% mastery.
  - **Multiple Choice** with dynamic distractors.
  - **Write / Type Answer** mode toggle for spelling and active recall testing.
  - Instant answer validation and victory celebration stats.
- **⏱️ Timed Match Game**:
  - High-tempo tile matching memory game.
  - Millisecond live stopwatch timer.
  - Green pop match animations and red horizontal wobble on mismatches.
  - Per-deck local best-time leaderboard.
- **🎨 5 Pastel & Dark Color Palettes**:
  - **Catppuccin Latte** (Pastel Warm Light)
  - **Catppuccin Frappé** (Pastel Soft Dark)
  - **Catppuccin Macchiato** (Pastel Medium Dark)
  - **Catppuccin Mocha** (Pastel Deep Dark)
  - **Classic Dark** (Pitch / Slate Dark with Quizlet Blue)
- **✏️ Set Creator & Importer**:
  - Create and edit custom decks with dynamic rows and quick `Tab` navigation.
  - Quick-import parser supporting Quizlet exports (Tab/CSV/Dash separated text).
  - Export decks to clipboard with one click.
  - Preloaded starter decks for SAT Vocab, Spanish Verbs, and Web Development.

---

## 🚀 Local Development

Serve the application locally using any static web server:

```bash
# Using npx serve
npx serve .

# Or using Python
python3 -m http.server 3000
```

---

## 🌐 Deploy to Vercel

Deploy directly to Vercel via terminal:

```bash
npx vercel --prod
```

---

## 📄 License

MIT License. Designed with ❤️ by noexistencen.
