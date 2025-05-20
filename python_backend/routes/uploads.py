import os
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import uuid
from python_backend.utils.audio_processor import AudioProcessor

# Create blueprint
uploads_bp = Blueprint('uploads', __name__)

# Define upload and transformations directories
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'shared', 'uploads')
TRANSFORMATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'shared', 'transformations')

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TRANSFORMATIONS_DIR, exist_ok=True)

# Initialize audio processor
audio_processor = AudioProcessor()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@uploads_bp.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not file or not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Generate a unique filename
        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}_{original_filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save the file
        file.save(filepath)
        
        return jsonify({
            'filename': filename,
            'original_filename': original_filename
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@uploads_bp.route('/api/convert', methods=['POST'])
def convert_file():
    """Convert uploaded file to target genre"""
    try:
        print("Starting conversion process...")
        data = request.json
        if not data or 'filename' not in data or 'targetGenre' not in data:
            print("Missing required data:", data)
            return jsonify({'error': 'Missing filename or target genre'}), 400
        
        filename = data['filename']
        target_genre = data['targetGenre']
        print(f"Converting file {filename} to {target_genre} genre")
        
        # Validate target genre
        valid_genres = ['rock', 'electronic', 'hiphop', 'classical', 'country']
        if target_genre not in valid_genres:
            print(f"Invalid genre: {target_genre}")
            return jsonify({'error': 'Invalid target genre'}), 400
        
        # Get file paths
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(input_path):
            print(f"Input file not found: {input_path}")
            return jsonify({'error': 'File not found'}), 404
        
        print(f"Input file found at: {input_path}")
        
        # Generate output filename
        base_name = os.path.splitext(filename)[0]
        output_filename = f"{base_name}_{target_genre}.wav"
        output_path = os.path.join(TRANSFORMATIONS_DIR, output_filename)
        print(f"Output will be saved to: {output_path}")
        
        # Transform the file
        print("Starting audio transformation...")
        success = audio_processor.transform_genre(input_path, output_path, target_genre)
        
        if not success:
            print("Transformation failed")
            return jsonify({'error': 'Failed to transform file'}), 500
        
        print("Transformation successful, sending file...")
        
        # Check if output file exists
        if not os.path.exists(output_path):
            print(f"Output file not found after transformation: {output_path}")
            return jsonify({'error': 'Transformed file not found'}), 500
        
        # Send the transformed file
        return send_file(
            output_path,
            as_attachment=True,
            download_name=output_filename,
            mimetype='audio/wav'
        )
        
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@uploads_bp.route('/api/uploads/<filename>', methods=['GET'])
def get_file(filename):
    """
    Get information about an uploaded file.
    """
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    # Get file info
    filesize = os.path.getsize(filepath)
    
    # Detect genre
    detected_genre = AudioProcessor.detect_genre(filepath)
    
    # Return file information
    return jsonify({
        'filename': filename,
        'filesize': filesize,
        'filepath': filepath,
        'detectedGenre': detected_genre
    })

@uploads_bp.route('/api/uploads/<filename>/download', methods=['GET'])
def download_file(filename):
    """
    Download an uploaded file.
    """
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, as_attachment=True)