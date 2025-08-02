# app.py
from flask import Flask, request, jsonify

# Initialize the Flask application
app = Flask(__name__)

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    """
    Endpoint to receive an image and prepare for face recognition.
    For now, it just confirms the image was received.
    """
    # Check if an image file is present in the request
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']

    # For this step, we just confirm the file was received successfully
    print(f"Received image: {image_file.filename}")

    # In the next steps, we will add AI processing here.
    # For now, return a placeholder success message.
    return jsonify({
        "message": "Image received successfully. Ready for processing.",
        "filename": image_file.filename
    })

# Run the app
if __name__ == '__main__':
    # Running on port 5001 to avoid conflict with frontend (3000) and backend (8000)
    app.run(host='0.0.0.0', port=5001, debug=True)