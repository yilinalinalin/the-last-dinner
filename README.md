# Floating 3D Models Homepage

A beautiful interactive homepage featuring floating 3D models of yarns, apples, and icebergs with hover interactions.

## Features

- **3D Models**: Three floating objects (yarn, apple, iceberg) with smooth animations
- **Hover Interactions**: Text boxes appear when hovering over each model
- **Modern Design**: Gradient background with smooth transitions
- **Responsive**: Works on different screen sizes

## How to Use

**Important:** This project uses ES modules and requires a local web server to run. You cannot open `index.html` directly in the browser.

### Option 1: Use the Python Server Script (Recommended)

1. Run the server script:
   ```bash
   python3 server.py
   ```
   This will automatically open your browser at `http://localhost:8000`

### Option 2: Use the Shell Script

1. Run the start script:
   ```bash
   ./start-server.sh
   ```
   Then open `http://localhost:8000` in your browser

### Option 3: Manual Server Setup

**Python 3:**
```bash
python3 -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (if you have it):**
```bash
npx http-server -p 8000
```

Then open `http://localhost:8000/index.html` in your browser.

### Using the Page

1. Move your mouse over the floating 3D models
2. Text boxes will appear showing information about each object
3. The apple model loads from the FBX file in the `apple/` folder

## Technologies Used

- **Three.js**: For 3D rendering and animations
- **HTML5/CSS3**: For structure and styling
- **JavaScript**: For interactivity and animations

## Browser Compatibility

Works best in modern browsers that support WebGL:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

