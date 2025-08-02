import os
import io
import base64
import torch
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
from gtts import gTTS
import tempfile
from transformers import AutoTokenizer
import yaml
import logging

# Import GLIP components
from maskrcnn_benchmark.config import cfg
from maskrcnn_benchmark.engine.predictor_glip import GLIPDemo

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
UPLOAD_FOLDER = 'uploads'
TEST_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'test_images')
CHECKPOINTS_FOLDER = 'checkpoints'
CONFIGS_FOLDER = 'configs'

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEST_IMAGES_FOLDER, exist_ok=True)
os.makedirs(CHECKPOINTS_FOLDER, exist_ok=True)
os.makedirs(CONFIGS_FOLDER, exist_ok=True)

# Global GLIP model
glip_demo = None

def initialize_glip():
    """Initialize GLIP model"""
    global glip_demo
    
    try:
        config_file = os.path.join(CONFIGS_FOLDER, "GLIP_Tiny.yaml")
        weight_file = os.path.join(CHECKPOINTS_FOLDER, "glip_tiny_model.pth")
        
        if not os.path.exists(config_file):
            logger.error(f"Config file not found: {config_file}")
            return False
            
        if not os.path.exists(weight_file):
            logger.error(f"Model weights not found: {weight_file}")
            return False
        
        # Load config
        cfg.merge_from_file(config_file)
        cfg.merge_from_list(["MODEL.WEIGHT", weight_file])
        cfg.merge_from_list(["MODEL.DEVICE", "cuda" if torch.cuda.is_available() else "cpu"])
        
        # Create GLIP demo
        glip_demo = GLIPDemo(
            cfg,
            min_image_size=800,
            confidence_threshold=0.7,
            show_mask_heatmaps=False
        )
        
        logger.info("GLIP model initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing GLIP: {str(e)}")
        return False

def detect_objects_glip(image, custom_prompt="all objects"):
    """Detect objects using GLIP with custom prompt"""
    if glip_demo is None:
        return []
    
    try:
        # Convert PIL image to CV2 format
        image_cv2 = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Run GLIP inference
        predictions = glip_demo.run_on_opencv_image(image_cv2, custom_prompt)
        
        # Extract results
        results = []
        if predictions is not None:
            boxes = predictions.bbox.tolist()
            scores = predictions.get_field("scores").tolist()
            labels = predictions.get_field("labels").tolist()
            
            for box, score, label in zip(boxes, scores, labels):
                if score > 0.5:  # Confidence threshold
                    results.append({
                        'label': custom_prompt.split('.')[label] if '.' in custom_prompt else custom_prompt,
                        'confidence': float(score),
                        'bbox': [int(coord) for coord in box]
                    })
        
        return results
        
    except Exception as e:
        logger.error(f"Error in GLIP detection: {str(e)}")
        return []

def perform_ocr(image, language='eng'):
    """Perform OCR on image"""
    try:
        # Configure language
        lang_map = {
            'eng': 'eng',
            'hin': 'hin',
            'eng+hin': 'eng+hin'
        }
        
        ocr_lang = lang_map.get(language, 'eng')
        
        # Perform OCR
        text = pytesseract.image_to_string(image, lang=ocr_lang)
        
        # Also get word-level bounding boxes
        data = pytesseract.image_to_data(image, lang=ocr_lang, output_type=pytesseract.Output.DICT)
        
        words = []
        for i in range(len(data['text'])):
            if data['text'][i].strip():
                words.append({
                    'text': data['text'][i],
                    'bbox': [data['left'][i], data['top'][i], 
                            data['left'][i] + data['width'][i], 
                            data['top'][i] + data['height'][i]]
                })
        
        return {
            'full_text': text.strip(),
            'words': words
        }
        
    except Exception as e:
        logger.error(f"Error in OCR: {str(e)}")
        return {'full_text': '', 'words': []}

def generate_audio(text, language='en'):
    """Generate audio from text using gTTS"""
    try:
        if not text:
            return None
            
        # Map language codes
        lang_map = {
            'eng': 'en',
            'hin': 'hi',
            'en': 'en',
            'hi': 'hi'
        }
        
        tts_lang = lang_map.get(language, 'en')
        
        # Generate audio
        tts = gTTS(text=text, lang=tts_lang, slow=False)
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        
        # Read and encode audio
        with open(temp_file.name, 'rb') as audio_file:
            audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
        
        # Clean up
        os.unlink(temp_file.name)
        
        return audio_data
        
    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'glip_loaded': glip_demo is not None,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu'
    })

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    """Main endpoint for image analysis"""
    try:
        # Get parameters
        data = request.get_json()
        image_data = data.get('image', '')
        custom_prompt = data.get('prompt', 'all objects')
        ocr_language = data.get('ocr_language', 'eng')
        generate_audio_flag = data.get('generate_audio', True)
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Detect objects with GLIP
        objects = detect_objects_glip(image, custom_prompt)
        
        # Perform OCR
        ocr_results = perform_ocr(image, ocr_language)
        
        # Generate description
        description = f"I detected {len(objects)} objects"
        if objects:
            object_names = [obj['label'] for obj in objects[:3]]  # Top 3
            description += f": {', '.join(object_names)}"
            if len(objects) > 3:
                description += f" and {len(objects) - 3} more"
        
        if ocr_results['full_text']:
            description += f". Text found: {ocr_results['full_text'][:100]}"
        
        # Generate audio if requested
        audio_data = None
        if generate_audio_flag and description:
            # Determine TTS language based on OCR language
            tts_lang = 'hi' if 'hin' in ocr_language else 'en'
            audio_data = generate_audio(description, tts_lang)
        
        return jsonify({
            'success': True,
            'objects': objects,
            'ocr': ocr_results,
            'description': description,
            'audio': audio_data
        })
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test-image/<filename>', methods=['POST'])
def test_image(filename):
    """Test endpoint for pre-loaded images"""
    try:
        # Load test image
        image_path = os.path.join(TEST_IMAGES_FOLDER, filename)
        if not os.path.exists(image_path):
            return jsonify({'error': 'Image not found'}), 404
        
        image = Image.open(image_path).convert('RGB')
        
        # Get parameters
        data = request.get_json() or {}
        custom_prompt = data.get('prompt', 'all objects')
        ocr_language = data.get('ocr_language', 'eng')
        
        # Process image
        objects = detect_objects_glip(image, custom_prompt)
        ocr_results = perform_ocr(image, ocr_language)
        
        return jsonify({
            'success': True,
            'objects': objects,
            'ocr': ocr_results,
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list-test-images', methods=['GET'])
def list_test_images():
    """List available test images"""
    try:
        images = [f for f in os.listdir(TEST_IMAGES_FOLDER) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        return jsonify({'images': images})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize GLIP on startup
    if not initialize_glip():
        logger.warning("GLIP model not initialized. Please ensure model files are in place.")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=8000, debug=True)