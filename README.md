# 🎵 Audio Genre Transformer

This project allows you to transform audio files into different musical genres using a simple web UI. It applies signal processing and FFmpeg effects to modify your uploaded audio.

## 🚀 Features

- Upload audio and apply genre transformations
- Real-time audio processing using **Python** and **FFmpeg**
- Intuitive **React-based** frontend interface

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Python (Librosa, Pydub, FFmpeg)
- **Audio Effects**: Real-time using FFmpeg + NumPy + SciPy filters

---

## 🔧 Getting Started

### 📦 Prerequisites

Make sure you have the following installed:

- **Node.js**: [Download here](https://nodejs.org/)
- **Python 3.9+**: [Download here](https://www.python.org/)
- **FFmpeg**: See [Installing FFmpeg](#🧰-installing-ffmpeg)

---

## 🖥️ Running the Project

1.  **Run the Frontend**

    In the project root, run:

    ```bash
    npm install
    npm run dev
    ```

    The frontend will start on `http://localhost:5000`.

2.  **Run the Backend**

    In another terminal, while still in the project root:

    ```bash
    # Install dependencies
    # Use `pip install .` since using pyproject.toml
    pip install .

    # Run the backend server
    python run.py
    ```

### 🌐 Access the UI

Open your browser and go to:

`http://localhost:5000`

Upload an audio file and choose your target genre to hear the transformation!

---

## 🧰 Installing FFmpeg

This project requires **FFmpeg** for audio transformation. Follow these steps to install and add it to your system’s `PATH`:

### 🔗 Download FFmpeg

Go to the official builds page: [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)

Download the "**essentials**" build ZIP under Release builds (e.g., `ffmpeg-release-essentials.zip`).

Extract the ZIP file to a location like `C:\ffmpeg`.

### 🖥 Add FFmpeg to System PATH (Windows)

1.  Open Start and search for **Environment Variables**, then click **Edit the system environment variables**.
2.  In the System Properties window, click **Environment Variables**.
3.  Under System variables, find and select the `Path` variable, then click **Edit**.
4.  Click **New** and add the path to FFmpeg's `bin` directory, for example:

    ```makefile
    C:\ffmpeg\bin
    ```

5.  Click **OK** to save and apply the changes.
6.  Restart your terminal (or system) and run:

    ```bash
    ffmpeg -version
    ```

    You should see FFmpeg version information printed to verify the installation.

---

### 🐧 For Linux/macOS users:

Install via package manager (e.g., `sudo apt install ffmpeg` or `brew install ffmpeg`).

---

## 📁 Project Structure

Markdown

# 🎵 Audio Genre Transformer

This project allows you to transform audio files into different musical genres using a simple web UI. It applies signal processing and FFmpeg effects to modify your uploaded audio.

## 🚀 Features

- Upload audio and apply genre transformations
- Real-time audio processing using **Python** and **FFmpeg**
- Intuitive **React-based** frontend interface

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Python (Librosa, Pydub, FFmpeg)
- **Audio Effects**: Real-time using FFmpeg + NumPy + SciPy filters

---

## 🔧 Getting Started

### 📦 Prerequisites

Make sure you have the following installed:

- **Node.js**: [Download here](https://nodejs.org/)
- **Python 3.9+**: [Download here](https://www.python.org/)
- **FFmpeg**: See [Installing FFmpeg](#🧰-installing-ffmpeg)

---

## 🖥️ Running the Project

1.  **Run the Frontend**

    In the project root, run:

    ```bash
    npm install
    npm run dev
    ```

    The frontend will start on `http://localhost:5000`.

2.  **Run the Backend**

    In another terminal, while still in the project root:

    ```bash
    # Install dependencies
    # Use `pip install .` since using pyproject.toml
    pip install .

    # Run the backend server
    python run.py
    ```

### 🌐 Access the UI

Open your browser and go to:

`http://localhost:5000`

Upload an audio file and choose your target genre to hear the transformation!

---

## 🧰 Installing FFmpeg

This project requires **FFmpeg** for audio transformation. Follow these steps to install and add it to your system’s `PATH`:

### 🔗 Download FFmpeg

Go to the official builds page: [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)

Download the "**essentials**" build ZIP under Release builds (e.g., `ffmpeg-release-essentials.zip`).

Extract the ZIP file to a location like `C:\ffmpeg`.

### 🖥 Add FFmpeg to System PATH (Windows)

1.  Open Start and search for **Environment Variables**, then click **Edit the system environment variables**.
2.  In the System Properties window, click **Environment Variables**.
3.  Under System variables, find and select the `Path` variable, then click **Edit**.
4.  Click **New** and add the path to FFmpeg's `bin` directory, for example:

    ```makefile
    C:\ffmpeg\bin
    ```

5.  Click **OK** to save and apply the changes.
6.  Restart your terminal (or system) and run:

    ```bash
    ffmpeg -version
    ```

    You should see FFmpeg version information printed to verify the installation.

---

### 🐧 For Linux/macOS users:

Install via package manager (e.g., `sudo apt install ffmpeg` or `brew install ffmpeg`).

---

## 📁 Project Structure

├── client/                 # React frontend
├── server/                 # Python backend
│   ├── audio_processor.py
│   └── run.py
├── pyproject.toml          # Python dependency management
└── README.md
