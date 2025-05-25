import os                   # for file path operations
import librosa              # for audio processing (loading, pitch shifting, time stretching, etc.)
import soundfile as sf      # for saving audio files
import numpy as np          # for number crunching (arrays, math)
from scipy.signal import butter, lfilter, spectrogram  # for digital filters and spectrogram
import subprocess           # for running terminal commands like FFmpeg
import logging              # for logging messages
import torch               # for PyTorch model
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms  # for image transformations
from PIL import Image      # for image processing
import matplotlib
matplotlib.use('Agg')  # Set backend to Agg for thread safety
import matplotlib.pyplot as plt  # for generating spectrograms
# import tensorflow as tf
# from tensorflow.keras.models import load_model
# import librosa.feature


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for audio processing
SR = 22050  # Standard sample rate (CD quality is 44100Hz, but 22050Hz is common for processing)
TRANSFORMATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'transformations')
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'model', 'music_genre_cnn_weights.pth')

# Ensure transformations directory exists
os.makedirs(TRANSFORMATIONS_DIR, exist_ok=True)

# Image transform for model input
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

# Genre mapping
GENRES = ['rock', 'disco', 'hiphop', 'classical', 'country']
label_to_genre = {i: genre for i, genre in enumerate(GENRES)}

# Define the SimpleCNN model class
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(32 * 32 * 32, 128)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = F.relu(self.conv1(x))  # [B, 16, 128, 128]
        x = F.max_pool2d(x, 2)     # [B, 16, 64, 64]
        x = F.relu(self.conv2(x))  # [B, 32, 64, 64]
        x = F.max_pool2d(x, 2)     # [B, 32, 32, 32]
        x = x.view(x.size(0), -1)  # Flatten
        x = F.relu(self.fc1(x))
        return self.fc2(x)

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
    def load_model():
        """Load the trained genre classification model"""
        try:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            # Create model instance
            model = SimpleCNN(num_classes=5).to(device)
            # Load state dict
            state_dict = torch.load(MODEL_PATH, map_location=device)
            # Load the state dict into the model
            model.load_state_dict(state_dict)
            model.eval()
            logger.info("Successfully loaded genre prediction model")
            return model, device
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return None, None

    @staticmethod
    def predict_genre(image_path, model, device):
        """Predict genre from spectrogram image"""
        try:
            image = Image.open(image_path).convert("RGB")
            image = transform(image).unsqueeze(0).to(device)
            with torch.no_grad():
                output = model(image)
                predicted = torch.argmax(output, 1).item()
                return label_to_genre[predicted]
        except Exception as e:
            logger.error(f"Error predicting genre: {e}")
            return None

    @staticmethod
    def generate_spectrogram(audio_path, output_path):
        """Generate spectrogram from audio file using only scipy"""
        try:
            # Load audio file using soundfile instead of librosa
            y, sr = sf.read(audio_path)
            if len(y.shape) > 1:  # Convert stereo to mono if needed
                y = np.mean(y, axis=1)
            
            # Generate spectrogram using scipy
            frequencies, times, Sxx = spectrogram(y, fs=sr, nperseg=1024, noverlap=512)
            
            # Convert to log scale and normalize
            Sxx_db = 10 * np.log10(Sxx + 1e-10)
            Sxx_db = (Sxx_db - Sxx_db.min()) / (Sxx_db.max() - Sxx_db.min())
            
            # Convert to image
            plt.figure(figsize=(10, 4))
            plt.imshow(Sxx_db, aspect='auto', origin='lower', cmap='viridis')
            plt.axis('off')  # Hide axes
            plt.tight_layout()
            
            # Save as PNG
            plt.savefig(output_path, bbox_inches='tight', pad_inches=0)
            plt.close()
            
            return output_path
        except Exception as e:
            logger.error(f"Error generating spectrogram: {e}")
            return None

    @staticmethod
    def transform_genre(input_file, output_file, target_genre):
        """
        Transform an audio file to match a target genre using FFmpeg.
        Returns a tuple of (success, predicted_genre, target_genre)
        """
        logger.info(f"Transforming {input_file} to {target_genre} genre...")
        
        predicted_genre = None
        # Load model and predict genre
        model, device = AudioProcessor.load_model()
        if model is not None:
            # Generate spectrogram
            spectrogram_path = os.path.splitext(input_file)[0] + '.png'
            if AudioProcessor.generate_spectrogram(input_file, spectrogram_path):
                try:
                    predicted_genre = AudioProcessor.predict_genre(spectrogram_path, model, device)
                    if predicted_genre:
                        logger.info(f"Predicted genre of input file: {predicted_genre}")
                    else:
                        logger.error("Genre prediction failed - model returned None")
                except Exception as e:
                    logger.error(f"Error during genre prediction: {str(e)}")
                finally:
                    # Clean up spectrogram file
                    try:
                        os.remove(spectrogram_path)
                    except:
                        pass
        
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
            return False, predicted_genre, target_genre
        
        try:
            # Execute FFmpeg command
            logger.info(f"Running FFmpeg command: {ffmpeg_cmd}")
            subprocess.run(ffmpeg_cmd, shell=True, check=True)
            
            # Verify the output file exists
            if not os.path.exists(output_file):
                logger.error(f"Output file not created: {output_file}")
                return False, predicted_genre, target_genre
                
            logger.info(f"Successfully transformed to {target_genre} genre: {output_file}")
            return True, predicted_genre, target_genre
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {str(e)}")
            return False, predicted_genre, target_genre
        except Exception as e:
            logger.error(f"Error during transformation: {str(e)}")
            return False, predicted_genre, target_genre
    