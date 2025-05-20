import os
import subprocess
import librosa
import numpy as np
import soundfile as sf
from pydub import AudioSegment
from scipy import signal

# Function to create distorted audio for Rock genre
def transform_to_rock(input_file, output_file):
    print("Transforming to ROCK genre...")
    
    # First apply heavy distortion and compression with FFmpeg
    temp_file = "temp_rock.wav"
    ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=40,lowpass=f=14000,equalizer=f=800:width_type=o:width=2:g=8,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=9,volume=3" "{temp_file}"'
    
    subprocess.run(ffmpeg_cmd, shell=True, check=True)
    
    # Load the processed file
    y, sr = librosa.load(temp_file, sr=None)
    
    # Apply additional processing with librosa
    # Add harmonic distortion by amplifying and clipping harmonics
    y_harm = librosa.effects.harmonic(y)
    y_harm = np.clip(y_harm * 2.0, -1.0, 1.0)  # Hard clipping for distortion
    
    # Mix with original
    y_mixed = 0.7 * y_harm + 0.5 * y
    
    # Normalize
    y_mixed = y_mixed / np.max(np.abs(y_mixed))
    
    # Save the final result
    sf.write(output_file, y_mixed, sr)
    
    # Clean up temp file
    os.remove(temp_file)
    print(f"Rock transformation complete: {output_file}")
    
    return output_file

# Function to create electronic music
def transform_to_electronic(input_file, output_file):
    print("Transforming to ELECTRONIC genre...")
    
    # Apply initial effects with FFmpeg
    temp_file = "temp_electronic.wav"
    ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:60|90|120:0.7|0.6|0.5,lowpass=f=15000,highpass=f=50,equalizer=f=5000:width_type=o:width=2:g=8,volume=2.0" "{temp_file}"'
    
    subprocess.run(ffmpeg_cmd, shell=True, check=True)
    
    # Load the processed file
    y, sr = librosa.load(temp_file, sr=None)
    
    # Apply additional processing with librosa
    # Add a wobble bass effect (characteristic of dubstep/electronic)
    y_harm = librosa.effects.harmonic(y)
    
    # Create a wobble bass effect (modulating filter)
    y_wobble = y.copy()
    rate = 4.0  # Hz
    depth = 0.5
    
    # Generate the wobbling modulation
    mod = np.sin(2 * np.pi * rate / sr * np.arange(len(y)))
    mod = 0.5 + depth * mod
    
    # Apply the modulation
    stft = librosa.stft(y_wobble)
    frequencies = librosa.fft_frequencies(sr=sr)
    
    for i in range(stft.shape[1]):
        cutoff_idx = int(np.floor(len(frequencies) * mod[i * 512 % len(mod)]))
        cutoff_idx = min(cutoff_idx, stft.shape[0]-1)
        stft[:cutoff_idx, i] *= 2.0
    
    y_wobble = librosa.istft(stft)
    
    # Mix with original
    y_mixed = 0.5 * y_wobble + 0.5 * y_harm
    
    # Apply time stretching (slightly faster)
    y_mixed = librosa.effects.time_stretch(y_mixed, rate=0.95)
    
    # Normalize
    y_mixed = y_mixed / np.max(np.abs(y_mixed))
    
    # Save the final result
    sf.write(output_file, y_mixed, sr)
    
    # Clean up temp file
    os.remove(temp_file)
    print(f"Electronic transformation complete: {output_file}")
    
    return output_file

# Function to transform to hip-hop
def transform_to_hiphop(input_file, output_file):
    print("Transforming to HIP-HOP genre...")
    
    # Apply initial effects with FFmpeg
    temp_file = "temp_hiphop.wav"
    ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=12,equalizer=f=100:width_type=o:width=2:g=10,equalizer=f=150:width_type=o:width=1:g=8,compand=attacks=0:decays=0.1,volume=1.8" "{temp_file}"'
    
    subprocess.run(ffmpeg_cmd, shell=True, check=True)
    
    # Load the processed file
    y, sr = librosa.load(temp_file, sr=None)
    
    # Apply additional processing with librosa
    # Create a beat emphasis effect
    y_perc = librosa.effects.percussive(y, margin=8.0)
    
    # Add more punch to percussive elements
    y_perc = y_perc * 2.0
    y_perc = np.clip(y_perc, -1.0, 1.0)
    
    # Slow down the tempo slightly
    y_slow = librosa.effects.time_stretch(y, rate=1.05)
    
    # Pitch shift down slightly
    y_pitched = librosa.effects.pitch_shift(y_slow, sr=sr, n_steps=-2)
    
    # Create final mix
    y_final = 0.7 * y_pitched + 0.5 * y_perc
    
    # Normalize
    y_final = y_final / np.max(np.abs(y_final))
    
    # Save the final result
    sf.write(output_file, y_final, sr)
    
    # Clean up temp file
    os.remove(temp_file)
    print(f"Hip-hop transformation complete: {output_file}")
    
    return output_file

# Function to transform to jazz
def transform_to_jazz(input_file, output_file):
    print("Transforming to JAZZ genre...")
    
    # Apply initial effects with FFmpeg
    temp_file = "temp_jazz.wav"
    ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=300:width_type=o:width=2:g=6,equalizer=f=1000:width_type=o:width=2:g=4,equalizer=f=3000:width_type=o:width=2:g=-2,aecho=0.8:0.8:20|40:0.4|0.3,volume=1.7" "{temp_file}"'
    
    subprocess.run(ffmpeg_cmd, shell=True, check=True)
    
    # Load the processed file
    y, sr = librosa.load(temp_file, sr=None)
    
    # Apply additional processing with librosa
    # Slightly reduce percussive elements
    y_harm = librosa.effects.harmonic(y, margin=5.0)
    
    # Add swing feel by adjusting timing
    hop_length = 512
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop_length)
    
    # Create new audio with jazz-like timing
    y_out = np.zeros_like(y)
    for i, beat in enumerate(beats):
        beat_time = librosa.frames_to_time(beat, sr=sr, hop_length=hop_length)
        idx = int(beat_time * sr)
        if idx >= len(y):
            continue
            
        # Apply swing feel
        chunk_size = int(sr * 60 / tempo)
        if i < len(beats) - 1:
            next_beat = beats[i+1]
            next_time = librosa.frames_to_time(next_beat, sr=sr, hop_length=hop_length)
            chunk_size = int((next_time - beat_time) * sr)
        
        if idx + chunk_size <= len(y):
            # Add slight swing by stretching odd beats
            if i % 2 == 1:
                chunk = y[idx:idx+chunk_size]
                stretched_chunk = librosa.effects.time_stretch(chunk, rate=0.92)
                # Pad or truncate to match original size
                if len(stretched_chunk) > chunk_size:
                    stretched_chunk = stretched_chunk[:chunk_size]
                else:
                    stretched_chunk = np.pad(stretched_chunk, (0, chunk_size - len(stretched_chunk)))
                y_out[idx:idx+chunk_size] += stretched_chunk
            else:
                y_out[idx:idx+chunk_size] += y[idx:idx+chunk_size]
    
    # Mix with harmonic content
    y_final = 0.6 * y_out + 0.6 * y_harm
    
    # Normalize
    y_final = y_final / np.max(np.abs(y_final))
    
    # Save the final result
    sf.write(output_file, y_final, sr)
    
    # Clean up temp file
    os.remove(temp_file)
    print(f"Jazz transformation complete: {output_file}")
    
    return output_file

# Function to transform to classical
def transform_to_classical(input_file, output_file):
    print("Transforming to CLASSICAL genre...")
    
    # Apply initial effects with FFmpeg
    temp_file = "temp_classical.wav"
    ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:1000|1800|2600:0.6|0.5|0.4,highpass=f=30,lowpass=f=16000,equalizer=f=700:width_type=o:width=2:g=4,volume=1.6" "{temp_file}"'
    
    subprocess.run(ffmpeg_cmd, shell=True, check=True)
    
    # Load the processed file
    y, sr = librosa.load(temp_file, sr=None)
    
    # Apply additional processing with librosa
    # Extract harmonic components (melodic elements)
    y_harm = librosa.effects.harmonic(y, margin=8.0)
    
    # Apply a large concert hall reverb
    # Simulate by adding multiple delayed and attenuated copies
    y_reverb = y_harm.copy()
    delays = [int(sr * d) for d in [0.05, 0.1, 0.15, 0.2, 0.25, 0.3]]
    attenuations = [0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
    
    for delay, attenuation in zip(delays, attenuations):
        delayed = np.zeros_like(y_harm)
        delayed[delay:] = y_harm[:-delay] * attenuation
        y_reverb += delayed
    
    # Slightly slow down the tempo
    y_stretched = librosa.effects.time_stretch(y_reverb, rate=1.08)
    
    # Add dynamics - louder parts get louder, quieter parts get quieter
    # This is characteristic of classical music performances
    rms = librosa.feature.rms(y=y_stretched)[0]
    rms = np.repeat(rms, hop_length)[:len(y_stretched)]
    
    # Normalize RMS to 0-1 range
    rms = (rms - np.min(rms)) / (np.max(rms) - np.min(rms))
    
    # Apply dynamic expansion
    y_dynamic = y_stretched * (0.5 + 0.5 * rms)
    
    # Normalize
    y_dynamic = y_dynamic / np.max(np.abs(y_dynamic))
    
    # Save the final result
    sf.write(output_file, y_dynamic, sr)
    
    # Clean up temp file
    os.remove(temp_file)
    print(f"Classical transformation complete: {output_file}")
    
    return output_file

# Main function to process the input file
def main():
    # Get all .wav files from the uploads directory
    uploads_dir = 'uploads'
    output_dir = 'audio_samples'
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Find the most recent wav file
    wav_files = [f for f in os.listdir(uploads_dir) if f.endswith('.wav')]
    
    if not wav_files:
        print("No .wav files found in uploads directory.")
        return
    
    # Sort by modification time (most recent first)
    wav_files.sort(key=lambda x: os.path.getmtime(os.path.join(uploads_dir, x)), reverse=True)
    input_file = os.path.join(uploads_dir, wav_files[0])
    
    print(f"Processing most recent file: {input_file}")
    
    # Create output file names
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    
    # Process the file for each genre
    rock_output = os.path.join(output_dir, f"{base_name}_rock.wav")
    electronic_output = os.path.join(output_dir, f"{base_name}_electronic.wav")
    hiphop_output = os.path.join(output_dir, f"{base_name}_hiphop.wav")
    jazz_output = os.path.join(output_dir, f"{base_name}_jazz.wav")
    classical_output = os.path.join(output_dir, f"{base_name}_classical.wav")
    
    # Transform to different genres
    transform_to_rock(input_file, rock_output)
    transform_to_electronic(input_file, electronic_output)
    transform_to_hiphop(input_file, hiphop_output)
    transform_to_jazz(input_file, jazz_output)
    transform_to_classical(input_file, classical_output)
    
    print("\nAll transformations complete!")
    print("Generated audio samples:")
    print(f"Rock: {rock_output}")
    print(f"Electronic: {electronic_output}")
    print(f"Hip-hop: {hiphop_output}")
    print(f"Jazz: {jazz_output}")
    print(f"Classical: {classical_output}")

if __name__ == "__main__":
    main()