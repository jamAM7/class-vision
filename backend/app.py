from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import tempfile
import os
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'best.pt')
print(f"Loading model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
print("Model loaded successfully.")

FRAME_SAMPLE_RATE = 60
CONF_THRESHOLD = 0.5
CLASS_PERSON = 0
CLASS_MONITOR = 1


def format_time(seconds):
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/process_video', methods=['POST'])
def process_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video_file = request.files['video']
    room_capacity = request.form.get('room_capacity', None)
    if room_capacity is not None:
        try:
            room_capacity = int(room_capacity)
        except ValueError:
            room_capacity = None

    suffix = os.path.splitext(video_file.filename)[-1] or '.mp4'
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        video_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return jsonify({'error': 'Could not open video file'}), 400

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        per_frame = []
        event_log = []
        prev_status = None
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % FRAME_SAMPLE_RATE == 0:
                results = model.predict(frame, conf=CONF_THRESHOLD, verbose=False)
                boxes = results[0].boxes

                if boxes is not None and len(boxes) > 0:
                    classes = boxes.cls.cpu().numpy().astype(int)
                    person_count = int(np.sum(classes == CLASS_PERSON))
                    monitor_count = int(np.sum(classes == CLASS_MONITOR))
                else:
                    person_count = 0
                    monitor_count = 0

                difference = person_count - monitor_count
                timestamp_sec = frame_idx / fps

                per_frame.append({
                    'frame': frame_idx,
                    'timestamp': round(timestamp_sec, 2),
                    'timestamp_str': format_time(timestamp_sec),
                    'person': person_count,
                    'monitor': monitor_count,
                    'difference': difference,
                })

                status = 'over' if difference > 0 else 'ok'
                if prev_status is not None and status != prev_status:
                    ts = format_time(timestamp_sec)
                    if status == 'over':
                        event_log.append(f"{ts} — Person count exceeded monitor count")
                    else:
                        event_log.append(f"{ts} — Capacity restored")
                prev_status = status

            frame_idx += 1

        cap.release()

        if not per_frame:
            return jsonify({'error': 'No frames could be processed'}), 500

        persons = [f['person'] for f in per_frame]
        monitors = [f['monitor'] for f in per_frame]
        latest = per_frame[-1]

        peak_person = int(max(persons))
        peak_monitor = int(max(monitors))
        peak_diff = peak_person - peak_monitor

        # Uncertainty: std deviation across all sampled frames
        person_std = round(float(np.std(persons)), 1)
        monitor_std = round(float(np.std(monitors)), 1)

        # Utilisation: peak people vs known room capacity
        effective_capacity = room_capacity if (room_capacity and room_capacity > 0) else peak_monitor
        utilisation = round((peak_person / effective_capacity) * 100, 1) if effective_capacity > 0 else None

        # utilisation = None
        # if room_capacity and room_capacity > 0:
        #     utilisation = round((peak_person / room_capacity) * 100, 1)

        over_capacity = peak_diff > 0

        summary = {
            'status': 'Over Capacity' if over_capacity else 'Within Capacity',
            # Peak values (shown in main counters)
            'peak_person': peak_person,
            'peak_monitor': peak_monitor,
            'peak_difference': peak_diff,
            # Uncertainty ranges
            'person_std': person_std,
            'monitor_std': monitor_std,
            # Utilisation
            'utilisation': utilisation,
            'room_capacity': room_capacity,
            # Event log
            'event_log': event_log,
            'total_frames_processed': len(per_frame),
        }

        return jsonify({'per_frame': per_frame, 'summary': summary})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)