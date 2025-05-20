import type { Express } from 'express'
import { createServer, type Server } from 'http'
import { storage } from './storage'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { db } from '@db'
import { audioFiles } from '@shared/schema'
import { eq } from 'drizzle-orm'

// Configure multer for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
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
  app.post(
    `${apiPrefix}/uploads`,
    upload.single('audioFile'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' })
        }

        const fileInfo = {
          filename: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        }

        const audioFile = await storage.storeAudioFile(fileInfo)

        res.status(201).json({
          id: audioFile.id,
          filename: audioFile.filename,
          fileSize: audioFile.fileSize,
          url: `${apiPrefix}/uploads/${audioFile.id}`
        })
      } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({ error: 'Failed to process upload' })
      }
    }
  )

  // Get audio file by ID
  app.get(`${apiPrefix}/uploads/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' })
      }

      const audioFile = await storage.getAudioFileById(id)
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' })
      }

      // Detect genre from filename for demo purposes
      let detectedGenre = audioFile.detectedGenre
      if (!detectedGenre) {
        const filename = audioFile.filename.toLowerCase()
        if (filename.includes('rock')) detectedGenre = 'rock'
        else if (filename.includes('pop')) detectedGenre = 'pop'
        else if (filename.includes('jazz')) detectedGenre = 'jazz'
        else if (filename.includes('classical')) detectedGenre = 'classical'
        else if (filename.includes('electronic')) detectedGenre = 'electronic'
        else if (
          filename.includes('hiphop') ||
          filename.includes('hip-hop') ||
          filename.includes('hip_hop')
        )
          detectedGenre = 'hiphop'
        else if (filename.includes('reggae')) detectedGenre = 'reggae'
        else if (filename.includes('country')) detectedGenre = 'country'
        else if (filename.includes('blues')) detectedGenre = 'jazz' // Map blues to jazz for demo

        // Update the detected genre in the database
        if (detectedGenre) {
          await db
            .update(audioFiles)
            .set({ detectedGenre })
            .where(eq(audioFiles.id, audioFile.id))
        }
      }

      res.json({
        id: audioFile.id,
        filename: audioFile.filename,
        fileSize: audioFile.fileSize,
        detectedGenre: detectedGenre || null,
        createdAt: audioFile.createdAt,
        url: `${apiPrefix}/stream/${audioFile.id}`
      })
    } catch (error) {
      console.error('Error getting audio file:', error)
      res.status(500).json({ error: 'Failed to get audio file' })
    }
  })

  // Stream audio file
  app.get(`${apiPrefix}/stream/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' })
      }

      const audioFile = await storage.getAudioFileById(id)
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' })
      }

      const filePath = audioFile.originalPath
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' })
      }

      res.setHeader('Content-Type', audioFile.mimeType)
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${audioFile.filename}"`
      )

      const fileStream = fs.createReadStream(filePath)
      fileStream.pipe(res)
    } catch (error) {
      console.error('Error streaming audio:', error)
      res.status(500).json({ error: 'Failed to stream audio file' })
    }
  })

  // Create transformation
  app.post(`${apiPrefix}/transformations`, async (req, res) => {
    try {
      const schema = z.object({
        fileId: z.number(),
        targetGenre: z.string()
      })

      const data = schema.parse(req.body)

      // Check if audio file exists
      const audioFile = await storage.getAudioFileById(data.fileId)
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' })
      }

      // Create transformation
      const transformation = await storage.createTransformation(
        data.fileId,
        data.targetGenre
      )

      // Start the transformation process asynchronously
      storage.processTransformation(transformation.id).catch(console.error)

      res.status(201).json({
        id: transformation.id,
        status: transformation.status,
        createdAt: transformation.createdAt
      })
    } catch (error) {
      console.error('Transformation error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      res.status(500).json({ error: 'Failed to create transformation' })
    }
  })

  // Get transformed audio
  app.get(`${apiPrefix}/transformed/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' })
      }

      const genre = req.query.genre as string
      if (!genre) {
        return res.status(400).json({ error: 'Target genre is required' })
      }

      // Check if audio file exists
      const audioFile = await storage.getAudioFileById(id)
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' })
      }

      // Generate or get transformed file
      const transformedFilePath = await storage.generateTempTransformedFile(
        id,
        genre
      )

      // Stream the file
      res.setHeader('Content-Type', audioFile.mimeType)
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${path.basename(transformedFilePath)}"`
      )

      const fileStream = fs.createReadStream(transformedFilePath)
      fileStream.pipe(res)
    } catch (error) {
      console.error('Error streaming transformed audio:', error)
      res.status(500).json({ error: 'Failed to stream transformed audio' })
    }
  })

  // Download transformed audio
  app.get(`${apiPrefix}/download/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' })
      }

      const format = (req.query.format as string) || 'mp3'
      const genre = req.query.genre as string

      if (!genre) {
        return res.status(400).json({ error: 'Target genre is required' })
      }

      // Check if audio file exists
      const audioFile = await storage.getAudioFileById(id)
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' })
      }

      // Generate or get transformed file
      const transformedFilePath = await storage.generateTempTransformedFile(
        id,
        genre
      )

      // Determine the content type based on format
      const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg'

      // Create file name
      const fileExt = format === 'wav' ? '.wav' : '.mp3'
      const fileName = `${path.basename(
        audioFile.filename,
        path.extname(audioFile.filename)
      )}_${genre}${fileExt}`

      // Stream the file for download
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

      const fileStream = fs.createReadStream(transformedFilePath)
      fileStream.pipe(res)
    } catch (error) {
      console.error('Error downloading transformed audio:', error)
      res.status(500).json({ error: 'Failed to download transformed audio' })
    }
  })

  const httpServer = createServer(app)
  return httpServer
}
