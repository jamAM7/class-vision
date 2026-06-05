# ClassVision by CapacityAI

A classroom occupancy monitoring web app. Upload a video recorded from a fixed elevated camera and the system runs YOLOv8s inference to count people and monitors, reporting peak counts, utilisation, and detection uncertainty.

---

## Project Structure

```
class-vision/
├── backend/
│   ├── app.py          # Flask inference server
│   ├── best.pt         # Trained YOLOv8s model weights
│   └── venv/           # Python virtual environment (not committed)
├── src/
│   ├── App.jsx         # Main React component
│   └── App.css         # Styles
├── package.json
└── vite.config.js
```

---

## Requirements

- Python 3.11+
- Node.js 18+
- The `best.pt` model weights file in `backend/`

---

## Setup

### 1. Backend (Flask + YOLO)

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

> Use `opencv-python-headless` not `opencv-python` — the headless version avoids GUI dependencies that aren't needed for server-side frame processing.

Start the Flask server:

```bash
python app.py
```

You should see:

```
Loading model from: .../backend/best.pt
Model loaded successfully.
Running on http://0.0.0.0:8080
```

Verify it's running by opening `http://localhost:8080/health` in a browser — it should return `{"status":"ok"}`.

---

### 2. Frontend (React + Vite)

Open a **second terminal** (leave Flask running in the first) and navigate to the project root:

```bash
cd class-vision
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or `5174` if that port is in use).

---

## Usage

1. Open the React app in your browser
2. Optionally enter the **known room capacity** (number of seats) in the input field — this enables the utilisation % calculation
3. Click **Upload Video** and select an `.mp4` file recorded from the classroom camera
4. Click **Analyse** — processing takes roughly 1-5 minutes depending on video length (every 60 frames is sampled)
5. Results appear once complete:
   - **Peak People / Peak Monitors** — maximum detections at any single point in the video
   - **Peak Difference** — people minus monitors at peak (negative = within capacity)
   - **Status** — Within Capacity or Over Capacity based on peak difference
   - **Room Utilisation %** — peak people as a percentage of known capacity (only shown if capacity was entered)
   - **Detection Uncertainty** — standard deviation of counts across all sampled frames; higher values indicate inconsistent detection due to occlusion or camera angle

---

## Notes

- The model was trained on two classes: `Person` (index 0) and `Monitor` (index 1)
- Inference runs on CPU — no GPU required
- Frame sample rate is set to every 60 frames (~1 frame per 2 seconds at 30fps) to keep processing time reasonable on standard hardware
- Monitor detection is inherently less reliable than person detection due to occlusion, image resolution at distance, and visual similarity between monitor screens and PC shells — this is reflected in the higher std dev values typically seen for monitor counts

---

## Restarting the Backend

If you need to restart Flask (e.g. after changing `app.py`):

1. In the Flask terminal, press `Ctrl+C`
2. Run `python app.py` again

Make sure the venv is still active (you'll see `(venv)` at the start of the terminal prompt). If not, re-activate it:

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```


## Restarting After First Time
Open a terminal and navigate to the backend folder:

```bash
cd backend

venv\Scripts\activate # Windows

or

source venv/bin/activate # Mac/Linux
```

Start the Flask server:

```bash
python app.py
```

Go to http://localhost:8080/health to check if status is ok then:

Open a **second terminal** (leave Flask running in the first) and navigate to the project root:

```bash
cd class-vision
npm run dev
```