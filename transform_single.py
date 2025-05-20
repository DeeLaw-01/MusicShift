import os
import sys
import subprocess
import librosa
import numpy as np
import soundfile as sf
from scipy import signal

# Constants
hop_length = 512  # for librosa processing

def transform_to_genre(input_file, output_file, genre):
    """Transform input audio to specified genre with dramatic, noticeable changes"""
    print(f"Transforming to {genre.upper()} genre...")
    
    # First load the audio file
    y, sr = librosa.load(input_file, sr=None)
    
    # Choose transformation based on genre
    if genre == "rock":
        # ROCK: Heavy distortion, compression, boosted mids and highs
        
        # Apply FFmpeg effects first
        temp_file = "temp_output.wav"
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=8,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=9,volume=3" "{temp_file}"'
        
        subprocess.run(ffmpeg_cmd, shell=True)
        
        # Load the processed file and apply more effects
        y, sr = librosa.load(temp_file, sr=None)
        
        # Add distortion by clipping
        gain = 2.5
        y = np.clip(y * gain, -0.8, 0.8)
        
        # Add a slight "guitar amp" effect
        y_harmonic = librosa.effects.harmonic(y)
        y = 0.7 * y + 0.3 * y_harmonic
        
        # Save the final result
        sf.write(output_file, y, sr)
        os.remove(temp_file)
        
    elif genre == "electronic":
        # ELECTRONIC: Echo, filter sweeps, punchy beats
        
        # Apply FFmpeg effects first for basic processing
        temp_file = "temp_output.wav"
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:60|90:0.7|0.5,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=5,volume=1.8" "{temp_file}"'
        
        subprocess.run(ffmpeg_cmd, shell=True)
        
        # Load the processed file and apply more effects
        y, sr = librosa.load(temp_file, sr=None)
        
        # Create a filter sweep effect (similar to electronic music)
        y_sweep = np.zeros_like(y)
        sweep_rate = 0.5  # Hz - speed of filter sweep
        
        # Generate sweep pattern
        t = np.arange(len(y)) / sr
        sweep = 0.5 + 0.5 * np.sin(2 * np.pi * sweep_rate * t)
        
        # Apply sweep to different frequency bands
        stft = librosa.stft(y)
        for i in range(stft.shape[1]):
            # Get current sweep position
            sweep_pos = sweep[min(i * hop_length, len(sweep)-1)]
            # Apply different gains to different frequency bands based on sweep
            stft[:int(stft.shape[0] * sweep_pos), i] *= 1.8  # Boost swept frequencies
        
        y_sweep = librosa.istft(stft)
        
        # Speed up slightly (common in electronic music)
        y_faster = librosa.effects.time_stretch(y_sweep, rate=0.95)
        
        # Add back some of the original with slight delay for "fattening"
        if len(y_faster) < len(y):
            # Pad y_faster if needed
            y_faster = np.pad(y_faster, (0, len(y) - len(y_faster)))
        else:
            # Trim y_faster if needed
            y_faster = y_faster[:len(y)]
            
        delay_samples = int(0.05 * sr)  # 50ms delay
        y_delayed = np.zeros_like(y)
        y_delayed[delay_samples:] = y[:-delay_samples] * 0.4
        
        # Mix it all together
        y = 0.7 * y_faster + 0.3 * y_delayed
        
        # Normalize
        y = y / max(np.max(np.abs(y)), 1.0)
        
        # Save the final result
        sf.write(output_file, y, sr)
        os.remove(temp_file)
        
    elif genre == "hiphop":
        # HIP-HOP: Heavy bass, slower tempo, emphasis on beats
        
        # Apply FFmpeg effects first
        temp_file = "temp_output.wav"
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=12,equalizer=f=100:width_type=o:width=2:g=10,volume=1.6" "{temp_file}"'
        
        subprocess.run(ffmpeg_cmd, shell=True)
        
        # Load the processed file and apply more effects
        y, sr = librosa.load(temp_file, sr=None)
        
        # Separate percussive and harmonic components
        y_perc = librosa.effects.percussive(y, margin=10.0)
        y_harm = librosa.effects.harmonic(y, margin=10.0)
        
        # Emphasize percussive elements
        y_perc *= 2.0
        y_perc = np.clip(y_perc, -0.8, 0.8)
        
        # Slow down the tempo (hip-hop is often slower)
        y_slower = librosa.effects.time_stretch(y_harm, rate=1.1)  # 10% slower
        
        # Pitch shift down
        y_lower = librosa.effects.pitch_shift(y_slower, sr=sr, n_steps=-2.5)
        
        # Ensure length matches y_perc
        if len(y_lower) > len(y_perc):
            y_lower = y_lower[:len(y_perc)]
        else:
            y_perc = y_perc[:len(y_lower)]
            
        # Mix the processed components
        y = 0.7 * y_lower + 0.6 * y_perc
        
        # Normalize
        y = y / max(np.max(np.abs(y)), 1.0)
        
        # Save the final result
        sf.write(output_file, y, sr)
        os.remove(temp_file)
    
    elif genre == "classical":
        # CLASSICAL: Reverb, dynamic range, orchestral effect
        
        # Apply FFmpeg effects for initial processing
        temp_file = "temp_output.wav"
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:1000|1800:0.6|0.4,highpass=f=30,equalizer=f=700:width_type=o:width=2:g=3,volume=1.4" "{temp_file}"'
        
        subprocess.run(ffmpeg_cmd, shell=True)
        
        # Load the processed file and apply more effects
        y, sr = librosa.load(temp_file, sr=None)
        
        # Extract harmonic components (melodic elements are emphasized in classical)
        y_harm = librosa.effects.harmonic(y, margin=5.0)
        
        # Add concert hall reverb effect
        y_reverb = np.zeros_like(y_harm)
        y_reverb[:] = y_harm
        
        # Add multiple reflections for realistic reverb
        delays = [int(sr * t) for t in [0.03, 0.06, 0.09, 0.12, 0.15]]
        decays = [0.7, 0.5, 0.4, 0.3, 0.2]
        
        for delay, decay in zip(delays, decays):
            if delay < len(y_harm):
                echo = np.zeros_like(y_harm)
                echo[delay:] = y_harm[:-delay] * decay
                y_reverb += echo
        
        # Slow down slightly
        y_slower = librosa.effects.time_stretch(y_reverb, rate=1.05)
        
        # Normalize
        y_slower = y_slower / max(np.max(np.abs(y_slower)), 1.0)
        
        # Save the final result
        sf.write(output_file, y_slower, sr)
        os.remove(temp_file)
    
    elif genre == "country":
        # COUNTRY: Twangy, vocal clarity, slight reverb
        
        # Apply FFmpeg effects for initial processing
        temp_file = "temp_output.wav"
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=2000:width_type=o:width=2:g=6,equalizer=f=4000:width_type=o:width=2:g=4,equalizer=f=6000:width_type=o:width=2:g=5,aecho=0.6:0.6:20|40:0.3|0.2,volume=1.5" "{temp_file}"'
        
        subprocess.run(ffmpeg_cmd, shell=True)
        
        # Load the processed file and apply more effects
        y, sr = librosa.load(temp_file, sr=None)
        
        # Create "twang" effect by boosting specific harmonics
        stft = librosa.stft(y)
        freqs = librosa.fft_frequencies(sr=sr)
        
        # Boost the "twangy" frequencies (typically in 2-5kHz range)
        twang_mask = (freqs > 2000) & (freqs < 5000)
        stft[twang_mask, :] *= 1.8
        
        y_twang = librosa.istft(stft)
        
        # Add a subtle rhythmic emphasis
        y_perc = librosa.effects.percussive(y)
        y_perc = y_perc * 1.3
        
        # Mix components
        if len(y_twang) != len(y_perc):
            min_len = min(len(y_twang), len(y_perc))
            y_twang = y_twang[:min_len]
            y_perc = y_perc[:min_len]
            
        y = 0.7 * y_twang + 0.3 * y_perc
        
        # Normalize
        y = y / max(np.max(np.abs(y)), 1.0)
        
        # Save the final result
        sf.write(output_file, y, sr)
        os.remove(temp_file)
    
    else:
        print(f"Genre '{genre}' not recognized.")
        return False
    
    print(f"Successfully transformed to {genre} genre: {output_file}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python transform_single.py input_file.wav genre")
        print("Genres: rock, electronic, hiphop, classical, country")
        sys.exit(1)
    
    input_file = sys.argv[1]
    genre = sys.argv[2].lower()
    
    # Output file name
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = f"{base_name}_{genre}_transformed.wav"
    
    transform_to_genre(input_file, output_file, genre)
    print(f"Transformation complete: {output_file}")