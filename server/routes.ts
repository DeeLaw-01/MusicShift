import type { Express } from 'express'
import { createServer, type Server } from 'http'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { execSync } from 'child_process'

// Configure multer for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
const TRANSFORMATIONS_DIR = path.join(process.cwd(), 'transformations')

// Ensure directories exist
for (const dir of [UPLOADS_DIR, TRANSFORMATIONS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: (req, file, cb) => {
    const acceptedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav'
    ]
    if (acceptedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only MP3 and WAV files are allowed.'))
    }
  }
})

export async function registerRoutes (app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = '/api'

  // File upload endpoint
  app.post(`${apiPrefix}/upload`, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      res.status(201).json({
        filename: req.file.filename,
        originalFilename: req.file.originalname
      })
    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({ error: 'Failed to process upload' })
    }
  })

  // Convert audio file
  app.post(`${apiPrefix}/convert`, async (req, res) => {
    try {
      const schema = z.object({
        filename: z.string(),
        targetGenre: z.string()
      })

      const data = schema.parse(req.body)
      const inputPath = path.join(UPLOADS_DIR, data.filename)

      if (!fs.existsSync(inputPath)) {
        return res.status(404).json({ error: 'File not found' })
      }

      // Create output filename
      const fileExt = path.extname(data.filename)
      const baseName = path.basename(data.filename, fileExt)
      const outputFilename = `${baseName}_${data.targetGenre}${fileExt}`
      const outputPath = path.join(TRANSFORMATIONS_DIR, outputFilename)

      // Apply audio transformation based on genre using FFmpeg
      let ffmpegCommand = ''

      switch (data.targetGenre) {
        case 'rock':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=10,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=8,volume=3" "${outputPath}"`
          break
        case 'electronic':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "aecho=0.9:0.9:60|90|120:0.7|0.5|0.4,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=8,atempo=0.9,volume=2.0" "${outputPath}"`
          break
        case 'jazz':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "equalizer=f=300:width_type=o:width=2:g=5,equalizer=f=800:width_type=o:width=2:g=4,equalizer=f=2000:width_type=o:width=2:g=-2,aecho=0.8:0.8:20|30:0.4|0.3,atempo=1.02,volume=1.5" "${outputPath}"`
          break
        case 'classical':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "aecho=0.9:0.9:1000|1800|2600:0.6|0.5|0.4,highpass=f=40,lowpass=f=16000,equalizer=f=800:width_type=o:width=2:g=3,atempo=1.05,dynaudnorm=f=10:g=5:p=0.7,volume=1.5" "${outputPath}"`
          break
        case 'pop':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "equalizer=f=1000:width_type=o:width=2:g=4,equalizer=f=3000:width_type=o:width=2:g=6,equalizer=f=10000:width_type=o:width=2:g=3,compand=attacks=0:decays=0.1:points=-90/-90|-40/-10|0/-3:soft-knee=6,atempo=0.95,volume=1.8" "${outputPath}"`
          break
        case 'hiphop':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "equalizer=f=60:width_type=o:width=2:g=15,equalizer=f=100:width_type=o:width=2:g=12,equalizer=f=150:width_type=o:width=1:g=8,atempo=1.1,volume=2.0" "${outputPath}"`
          break
        case 'reggae':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "equalizer=f=60:width_type=o:width=2:g=8,equalizer=f=100:width_type=o:width=2:g=6,aecho=0.9:0.9:80|120:0.5|0.4,atempo=1.05,volume=1.6" "${outputPath}"`
          break
        case 'country':
          ffmpegCommand = `ffmpeg -y -i "${inputPath}" -af "equalizer=f=2000:width_type=o:width=2:g=8,equalizer=f=4000:width_type=o:width=2:g=5,equalizer=f=6000:width_type=o:width=2:g=6,aecho=0.8:0.8:20|40:0.4|0.3,volume=1.8" "${outputPath}"`
          break
        default:
          return res.status(400).json({ error: 'Invalid target genre' })
      }

      // Execute ffmpeg command
      try {
        execSync(ffmpegCommand, { stdio: 'pipe' })
      } catch (ffmpegError) {
        console.error('FFmpeg error:', ffmpegError)
        return res.status(500).json({ error: 'Failed to process audio' })
      }

      // Send the transformed file
      res.setHeader('Content-Type', 'audio/wav')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${outputFilename}"`
      )
      const fileStream = fs.createReadStream(outputPath)
      fileStream.pipe(res)

      // Clean up files after sending
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(inputPath)
          fs.unlinkSync(outputPath)
        } catch (error) {
          console.error('Error cleaning up files:', error)
        }
      })
    } catch (error) {
      console.error('Conversion error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      res.status(500).json({ error: 'Failed to convert audio' })
    }
  })

  return createServer(app)
}
