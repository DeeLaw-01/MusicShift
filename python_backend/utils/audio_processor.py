import os
import librosa
import soundfile as sf
import numpy as np
from pydub import AudioSegment
from scipy.signal import butter, lfilter
import subprocess
import tempfile
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for audio processing
SR = 22050  # Standard sample rate
TRANSFORMATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'transformations')

# Ensure transformations directory exists
os.makedirs(TRANSFORMATIONS_DIR, exist_ok=True)

class AudioProcessor:
    """
    Class for audio processing and transformation using FFmpeg
    """
    
    @staticmethod
    def load_audio(filepath):
        """Load audio file using librosa"""
        try:
            y, sr = librosa.load(filepath, sr=SR)
            return y, sr
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise

    @staticmethod
    def save_audio(y, sr, output_path):
        """Save audio file using soundfile"""
        try:
            sf.write(output_path, y, sr, 'PCM_16')
            return output_path
        except Exception as e:
            logger.error(f"Error saving audio file: {e}")
            raise

    @staticmethod
    def apply_effects(y, sr, effects):
        """Apply audio effects to a signal"""
        processed = y.copy()
        
        # Apply each effect in the effects dictionary
        for effect, params in effects.items():
            if effect == 'pitch_shift':
                processed = librosa.effects.pitch_shift(processed, sr=sr, n_steps=params)
            elif effect == 'time_stretch':
                processed = librosa.effects.time_stretch(processed, rate=params)
            elif effect == 'reverb':
                # Custom reverb implementation
                delay_samples = int(sr * params['delay'])
                decay = params['decay']
                
                # Create delay buffer
                delay_buffer = np.zeros_like(processed)
                delay_buffer[delay_samples:] = processed[:-delay_samples] * decay
                
                # Add to original signal
                processed = processed + delay_buffer
                
                # Normalize
                processed = processed / np.max(np.abs(processed))
            elif effect == 'lowpass':
                # Apply lowpass filter
                nyquist = 0.5 * sr
                cutoff = params / nyquist
                b, a = butter(4, cutoff, btype='low')
                processed = lfilter(b, a, processed)
            elif effect == 'highpass':
                # Apply highpass filter
                nyquist = 0.5 * sr
                cutoff = params / nyquist
                b, a = butter(4, cutoff, btype='high')
                processed = lfilter(b, a, processed)
            elif effect == 'bass_boost':
                # Boost frequencies below 150Hz
                boost_factor = params
                stft = librosa.stft(processed)
                frequencies = librosa.fft_frequencies(sr=sr)
                bass_indices = frequencies < 150
                stft[bass_indices, :] *= boost_factor
                processed = librosa.istft(stft)
            elif effect == 'compression':
                # Simple compression
                threshold = params['threshold']
                ratio = params['ratio']
                
                # Apply compression
                magnitude = np.abs(processed)
                mask = magnitude > threshold
                processed[mask] = threshold + (processed[mask] - threshold) / ratio
        
        return processed

    @staticmethod
    def transform_genre(input_file, output_file, target_genre):
        """
        Transform an audio file to match a target genre using FFmpeg.
        """
        logger.info(f"Transforming {input_file} to {target_genre} genre...")
        
        # Choose transformation based on genre
        if target_genre == "rock":
            # ROCK: Heavy distortion, compression, boosted mids and highs
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=8,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=9,volume=3" "{output_file}"'
            
        elif target_genre == "electronic":
            # ELECTRONIC: Echo, filter sweeps, punchy beats
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:60|90:0.7|0.5,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=5,volume=1.8" "{output_file}"'
            
        elif target_genre == "hiphop":
            # HIP-HOP: Heavy bass, slower tempo, emphasis on beats
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=12,equalizer=f=100:width_type=o:width=2:g=10,volume=1.6" "{output_file}"'
            
        elif target_genre == "classical":
            # CLASSICAL: Reverb, dynamic range, orchestral effect
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:1000|1800:0.6|0.4,highpass=f=30,equalizer=f=700:width_type=o:width=2:g=3,volume=1.4" "{output_file}"'
            
        elif target_genre == "country":
            # COUNTRY: Twangy, vocal clarity, slight reverb
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=2000:width_type=o:width=2:g=6,equalizer=f=4000:width_type=o:width=2:g=4,equalizer=f=6000:width_type=o:width=2:g=5,aecho=0.6:0.6:20|40:0.3|0.2,volume=1.5" "{output_file}"'
            
        else:
            logger.error(f"Genre '{target_genre}' not recognized.")
            return False
        
        try:
            # Execute FFmpeg command
            logger.info(f"Running FFmpeg command: {ffmpeg_cmd}")
            subprocess.run(ffmpeg_cmd, shell=True, check=True)
            
            # Verify the output file exists
            if not os.path.exists(output_file):
                logger.error(f"Output file not created: {output_file}")
                return False
                
            logger.info(f"Successfully transformed to {target_genre} genre: {output_file}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error during transformation: {str(e)}")
            return False
    
    @staticmethod
    def detect_genre(audio_file):
        """
        Placeholder for genre detection.
        In a real implementation, this would use ML models.
        """
        return "unknown"