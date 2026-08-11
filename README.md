# 🚀 Rimath - Fast Math Practice

Rimath is a fast-paced mathematical calculation game designed to sharpen your mental arithmetic and improve computational speed. Wrapped in a futuristic **Dark Space** interface with immersive sound effects, Rimath turns math practice into an engaging and challenging experience.

## ✨ Key Features

* **🧮 Custom Math Engine (PEMDAS)**
  A dynamic question generator that automatically handles mathematical operations according to proper order of operations. Players can customize operators (`+`, `-`, `*`, `/`), the number of operands (2–10 numbers), and difficulty levels (Easy, Medium, Hard).

* **🎵 Dual-Channel Audio System**
  Built entirely with the Web Audio API. Separate GainNodes are used for **Background Music (BGM)** and **Sound Effects (SFX)**, ensuring that answer and combo sound effects never interfere with the BGM volume.

* **🔥 Streak & Combo System**
  Tracks consecutive correct answers and rewards consistent performance with visual animations and special sound effects when reaching **Milestone Combos** at 5, 10, and 20 consecutive correct answers.

* **⏳ Flexible Game Modes**
  Choose between **Time Attack**, where you race against the clock within a selected duration, or **Endless Mode**, where you can practice without a time limit.

* **💾 Local Storage Auto-Save**
  Your preferences are automatically saved in your browser, including difficulty settings, game configuration, and BGM & SFX volume levels.

* **🌌 Dark Space Glassmorphism UI**
  A modern, responsive interface featuring **glassmorphism**, *backdrop blur*, a midnight-blue color palette, and vibrant neon-cyan accents.

## 🛠️ Built With

Rimath runs entirely on the client side and is built using standard web technologies with no additional frameworks or dependencies:

* **HTML5** — Application structure.
* **CSS3** — Styling, animations, and custom range sliders for audio controls.
* **Vanilla JavaScript** — Game logic, DOM manipulation, and audio synthesis using the Web Audio API.

## 🚀 Getting Started

Rimath is a fully static web application, so there is no need to install dependencies or run a build process.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/amiaarinn-del/Mental-Math-Training.git
   ```

2. **Open the project folder.**

3. **Launch `index.html`** in your preferred web browser.

> 💡 Alternatively, you can try the live demo through GitHub Pages if it has been enabled for the repository.

## 🎮 How to Play

1. Open the **⚙️ Settings** menu before starting your first game.
2. Configure the operators, number of operands, difficulty level, and game duration.
3. Adjust the **BGM** and **SFX** volume using the Audio panel. A sound preview is available while adjusting the sliders.
4. Click **Save** and start the game.
5. Enter the correct answer in the input field and press `Enter` to submit.
6. Build your streak and aim for the highest **combo** possible!

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute it.
