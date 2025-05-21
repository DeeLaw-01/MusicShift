import os                   # for file path operations
import librosa              # for audio processing (loading, pitch shifting, time stretching, etc.)
import soundfile as sf      # for saving audio files
import numpy as np          # for number crunching (arrays, math)
from scipy.signal import butter, lfilter  # for digital filters like lowpass/highpass
import subprocess           # for running terminal commands like FFmpeg
import logging              # for logging messages
# import tensorflow as tf
# from tensorflow.keras.models import load_model
# import librosa.feature


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for audio processing
SR = 22050  # Standard sample rate (CD quality is 44100Hz, but 22050Hz is common for processing)
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
            # librosa.load converts audio to mono and resamples to specified sample rate
            # Returns (y, sr) where y is the time series array and sr is the sample rate
            y, sr = librosa.load(filepath, sr=SR)
            return y, sr
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise

    @staticmethod
    def save_audio(y, sr, output_path):
        """Save audio file using soundfile"""
        try:
            # sf.write saves audio data to a file
            # 'PCM_16' specifies 16-bit PCM encoding (CD quality)
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
                # librosa.effects.pitch_shift shifts the pitch of the audio
                # n_steps: number of semitones to shift (positive = up, negative = down)
                processed = librosa.effects.pitch_shift(processed, sr=sr, n_steps=params)
            
            elif effect == 'time_stretch':
                # librosa.effects.time_stretch changes the tempo without affecting pitch
                # rate > 1 speeds up, rate < 1 slows down
                processed = librosa.effects.time_stretch(processed, rate=params)
            
            elif effect == 'reverb':
                # Custom reverb implementation using delay and decay
                # delay_samples: number of samples to delay the signal
                # decay: how much the delayed signal is reduced in amplitude
                delay_samples = int(sr * params['delay'])
                decay = params['decay']
                
                # Create delay buffer (zero-padded array)
                delay_buffer = np.zeros_like(processed)
                # Add delayed signal with decay
                delay_buffer[delay_samples:] = processed[:-delay_samples] * decay
                
                # Mix original and delayed signal
                processed = processed + delay_buffer
                
                # Normalize to prevent clipping
                processed = processed / np.max(np.abs(processed))
            
            elif effect == 'lowpass':
                # Apply lowpass filter to remove high frequencies
                # nyquist: half the sampling rate (highest possible frequency)
                # cutoff: frequency below which signals pass through
                nyquist = 0.5 * sr
                cutoff = params / nyquist
                # butter: creates Butterworth filter coefficients
                # 4: filter order (higher = sharper cutoff)
                b, a = butter(4, cutoff, btype='low')
                # lfilter: applies the filter to the signal
                processed = lfilter(b, a, processed)
            
            elif effect == 'highpass':
                # Apply highpass filter to remove low frequencies
                # Similar to lowpass but removes frequencies below cutoff
                nyquist = 0.5 * sr
                cutoff = params / nyquist
                b, a = butter(4, cutoff, btype='high')
                processed = lfilter(b, a, processed)
            
            elif effect == 'bass_boost':
                # Boost frequencies below 150Hz using Short-Time Fourier Transform (STFT)
                # stft: converts time domain to frequency domain
                stft = librosa.stft(processed)
                # Get frequency bins
                frequencies = librosa.fft_frequencies(sr=sr)
                # Find indices of frequencies below 150Hz
                bass_indices = frequencies < 150
                # Apply boost to those frequencies
                stft[bass_indices, :] *= params
                # Convert back to time domain
                processed = librosa.istft(stft)
            
            elif effect == 'compression':
                # Dynamic range compression
                # threshold: level above which compression starts
                # ratio: how much to reduce signals above threshold
                threshold = params['threshold']
                ratio = params['ratio']
                
                # Apply compression
                magnitude = np.abs(processed)
                mask = magnitude > threshold
                # Reduce amplitude of signals above threshold
                processed[mask] = threshold + (processed[mask] - threshold) / ratio
        
        return processed

    @staticmethod
    def transform_genre(input_file, output_file, target_genre):
        """
        Transform an audio file to match a target genre using FFmpeg.
        FFmpeg filters used:
        - compand: dynamic range compression
        - highpass/lowpass: frequency filtering
        - equalizer: frequency band adjustment
        - aecho: echo/reverb effect
        - volume: gain adjustment
        """
        logger.info(f"Transforming {input_file} to {target_genre} genre...")
        
        # Choose transformation based on genre
        if target_genre == "rock":
            # ROCK: Heavy distortion, compression, boosted mids and highs
            # compand: dynamic range compression with specific attack/decay
            # highpass: remove frequencies below 60Hz
            # equalizer: boost specific frequency bands
            # volume: increase overall volume
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=8,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=9,volume=3" "{output_file}"'
            
        elif target_genre == "electronic":
            # ELECTRONIC: Echo, filter sweeps, punchy beats
            # aecho: multiple echo delays with different decay rates
            # highpass: remove low frequencies
            # equalizer: boost high frequencies
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:60|90:0.7|0.5,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=5,volume=1.8" "{output_file}"'
            
        elif target_genre == "hiphop":
            # HIP-HOP: Heavy bass, slower tempo, emphasis on beats
            # equalizer: boost low frequencies for bass
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=12,equalizer=f=100:width_type=o:width=2:g=10,volume=1.6" "{output_file}"'
            
        elif target_genre == "classical":
            # CLASSICAL: Reverb, dynamic range, orchestral effect
            # aecho: long reverb for hall effect
            # highpass: remove very low frequencies
            # equalizer: subtle mid-range boost
            ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:1000|1800:0.6|0.4,highpass=f=30,equalizer=f=700:width_type=o:width=2:g=3,volume=1.4" "{output_file}"'
            
        elif target_genre == "country":
            # COUNTRY: Twangy, vocal clarity, slight reverb
            # equalizer: boost mid-high frequencies for twang
            # aecho: short reverb for space
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
    
    # @staticmethod
    # def extract_features(audio_path, n_mels=128, n_fft=2048, hop_length=512):
    #     """
    #     Extract mel spectrogram features from audio file.
        
    #     Args:
    #         audio_path: Path to audio file
    #         n_mels: Number of mel bands
    #         n_fft: FFT window size
    #         hop_length: Number of samples between successive frames
            
    #     Returns:
    #         mel_spec: Mel spectrogram features
    #     """
    #     try:
    #         # Load audio file
    #         y, sr = librosa.load(audio_path, sr=22050)
            
    #         # Extract mel spectrogram
    #         mel_spec = librosa.feature.melspectrogram(
    #             y=y, 
    #             sr=sr,
    #             n_mels=n_mels,
    #             n_fft=n_fft,
    #             hop_length=hop_length
    #         )
            
    #         # Convert to log scale (dB)
    #         mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            
    #         # Normalize
    #         mel_spec_norm = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min())
            
    #         # Reshape for model input (add channel dimension)
    #         mel_spec_norm = np.expand_dims(mel_spec_norm, axis=-1)
            
    #         return mel_spec_norm
            
    #     except Exception as e:
    #         logger.error(f"Error extracting features: {e}")
    #         raise

    # @staticmethod
    # def detect_genre(audio_file):
        """
        Detect the genre of an audio file using a pre-trained CNN model.
        
        Args:
            audio_file: Path to the audio file
            
        Returns:
            str: Predicted genre
        """
        try:
            # Define supported genres (matching our transformation genres)
            GENRES = ['rock', 'electronic', 'hiphop', 'classical', 'country']
            
            # Load the pre-trained model
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'genre_model.h5')
            if not os.path.exists(model_path):
                logger.error("Genre detection model not found. Please train the model first.")
                return "unknown"
                
            model = load_model(model_path)
            
            # Extract features
            features = AudioProcessor.extract_features(audio_file)
            
            # Make prediction
            predictions = model.predict(np.expand_dims(features, axis=0))
            predicted_genre_idx = np.argmax(predictions[0])
            predicted_genre = GENRES[predicted_genre_idx]
            
            # Get confidence score
            confidence = predictions[0][predicted_genre_idx]
            
            logger.info(f"Detected genre: {predicted_genre} (confidence: {confidence:.2f})")
            return predicted_genre
            
        except Exception as e:
            logger.error(f"Error in genre detection: {e}")
            return "unknown"