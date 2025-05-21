# 🎵 Audio Genre Transformer

This project allows you to transform audio files into different musical genres using a simple web UI. It applies signal processing and FFmpeg effects to modify your uploaded audio.

## 🚀 Features

- Upload audio and apply genre transformations
- Real-time audio processing using Python and FFmpeg
- Intuitive React-based frontend interface

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Python (Librosa, Pydub, FFmpeg)
- **Audio Effects**: Real-time using FFmpeg + NumPy + SciPy filters

---

## 🔧 Getting Started


### 📦 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Python 3.9+](https://www.python.org/)
- **FFmpeg** – [Installation Instructions](#️-installing-ffmpeg)

---

## 🖥️ Running the Project

2. Run the Frontend
In the project root, run:

npm install
npm run dev
The frontend will start on http://localhost:5000

3. Run the Backend
In another terminal, while still in the project root:

# Install dependencies
 use `pip install .` since using pyproject.toml

# Run the backend server
python run.py
🌐 Access the UI
Open your browser and go to:

http://localhost:5000
Upload an audio file and choose your target genre to hear the transformation!

🧰 Installing FFmpeg
This project requires FFmpeg for audio transformation. Follow these steps to install and add it to your system’s PATH:

🔗 Download FFmpeg
Go to the official builds page: https://www.gyan.dev/ffmpeg/builds/

Download the "essentials" build ZIP under Release builds (e.g., ffmpeg-release-essentials.zip)

Extract the ZIP file to a location like C:\ffmpeg

🖥 Add FFmpeg to System PATH (Windows)
Open Start and search for Environment Variables, then click Edit the system environment variables

In the System Properties window, click Environment Variables

Under System variables, find and select the Path variable, then click Edit

Click New and add the path to FFmpeg's bin directory, e.g.:

makefile
Copy
Edit
C:\ffmpeg\bin
Click OK to save and apply the changes

Restart your terminal (or system) and run:

bash
Copy
Edit
ffmpeg -version
You should see FFmpeg version info printed to verify the installation.

🐧 For Linux/macOS users: Install via package manager (e.g., sudo apt install ffmpeg or brew install ffmpeg)

📁 Project Structure
bash
Copy
Edit
.
├── client/               # React frontend
├── server/               # Python backend
│   ├── audio_processor.py
│   └── run.py
├── pyproject.toml        # Python dependency management
├── requirements.txt      # (Optional) For pip installations
├── README.md
📢 Notes
FFmpeg must be available in your system PATH for genre transformations to work.

Genre detection is currently a placeholder for future ML integration.

🤝 Contributions
Feel free to fork the repo and open a pull request if you'd like to contribute!

vbnet
Copy
Edit

