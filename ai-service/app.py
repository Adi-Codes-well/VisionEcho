# app.py
from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp

# Initialize Flask and MediaPipe
app = Flask(__name__)
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    """
    Endpoint to receive an image and perform face detection.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']

    # 1. Read the image file from the request and convert it to an OpenCV image
    # Read the file's bytes into a numpy array
    np_arr = np.frombuffer(image_file.read(), np.uint8)
    # Decode the numpy array into an image
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"error": "Could not decode image"}), 400

    # 2. Process the image with MediaPipe
    # Convert the BGR image to RGB as MediaPipe expects RGB
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_image)

    # 3. Format the results into a JSON response
    faces = []
    if results.detections:
        image_height, image_width, _ = image.shape
        for detection in results.detections:
            # Extract bounding box coordinates and score
            box = detection.location_data.relative_bounding_box
            faces.append({
                "confidence": float(detection.score[0]),
                "box": {
                    "xmin": int(box.xmin * image_width),
                    "ymin": int(box.ymin * image_height),
                    "width": int(box.width * image_width),
                    "height": int(box.height * image_height),
                }
            })

    return jsonify({
        "message": f"Found {len(faces)} face(s).",
        "faces": faces
    })

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)