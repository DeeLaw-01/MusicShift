import os
import sys
import subprocess

def transform_audio(input_file, output_file, genre):
    """Transform audio to a specific genre using FFmpeg with dramatic effects"""
    
    ffmpeg_cmd = ""
    
    if genre == "rock":
        # ROCK: Heavy distortion, strong mid-high boost, compression
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=10,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=8,volume=3" "{output_file}"'
    
    elif genre == "electronic":
        # ELECTRONIC: Echo, high tempo, synth-like effects
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:60|90|120:0.7|0.5|0.4,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=8,atempo=0.9,volume=2.0" "{output_file}"'
    
    elif genre == "hiphop":
        # HIP-HOP: Super heavy bass, slower tempo
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=15,equalizer=f=100:width_type=o:width=2:g=12,equalizer=f=150:width_type=o:width=1:g=8,atempo=1.1,volume=2.0" "{output_file}"'
    
    elif genre == "classical":
        # CLASSICAL: Massive hall reverb, enhanced dynamics
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "aecho=0.9:0.9:1000|1800|2600:0.6|0.5|0.4,highpass=f=40,lowpass=f=16000,equalizer=f=800:width_type=o:width=2:g=3,atempo=1.05,dynaudnorm=f=10:g=5:p=0.7,volume=1.5" "{output_file}"'
    
    elif genre == "country":
        # COUNTRY: Twangy midrange, guitar-like effects, vocal emphasis
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=2000:width_type=o:width=2:g=8,equalizer=f=4000:width_type=o:width=2:g=5,equalizer=f=6000:width_type=o:width=2:g=6,aecho=0.8:0.8:20|40:0.4|0.3,volume=1.8" "{output_file}"'
    
    elif genre == "jazz":
        # JAZZ: Warm tone, slight swing, mellower feel
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=300:width_type=o:width=2:g=5,equalizer=f=800:width_type=o:width=2:g=4,equalizer=f=2000:width_type=o:width=2:g=-2,aecho=0.8:0.8:20|30:0.4|0.3,atempo=1.02,volume=1.5" "{output_file}"'
        
    elif genre == "reggae":
        # REGGAE: Emphasized bass, echo, slower tempo
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=60:width_type=o:width=2:g=8,equalizer=f=100:width_type=o:width=2:g=6,aecho=0.9:0.9:80|120:0.5|0.4,atempo=1.05,volume=1.6" "{output_file}"'
        
    else:
        # Default enhancement
        ffmpeg_cmd = f'ffmpeg -y -i "{input_file}" -af "equalizer=f=1000:width_type=q:width=2:g=5,volume=1.5" "{output_file}"'
    
    print(f"Transforming to {genre.upper()} genre...")
    print(f"Running command: {ffmpeg_cmd}")
    
    # Execute FFmpeg command
    try:
        subprocess.run(ffmpeg_cmd, shell=True, check=True)
        print(f"Successfully transformed to {genre} genre: {output_file}")
        return True
    except Exception as e:
        print(f"Error during transformation: {str(e)}")
        return False

def main():
    # Check command line arguments
    if len(sys.argv) < 3:
        print("Usage: python quick_transform.py input_file.wav genre")
        print("Available genres: rock, electronic, hiphop, classical, country, jazz, reggae")
        return
    
    input_file = sys.argv[1]
    genre = sys.argv[2].lower()
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        return
    
    # Create output filename
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = f"{base_name}_{genre}_TRANSFORMED.wav"
    
    # Transform the audio
    transform_audio(input_file, output_file, genre)

if __name__ == "__main__":
    main()