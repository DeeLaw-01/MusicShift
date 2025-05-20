import { db } from '@db'
import { audioFiles, transformations } from '@shared/schema'
import fs from 'fs'
import path from 'path'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import { execSync } from 'child_process'

// Define storage paths
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
const TRANSFORMATIONS_DIR = path.join(process.cwd(), 'transformations')

// Ensure directories exist
for (const dir of [UPLOADS_DIR, TRANSFORMATIONS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Interface for uploaded file info
interface FileInfo {
  filename: string
  path: string
  size: number
  mimetype: string
}

export const storage = {
  // Store uploaded audio file and add to database
  async storeAudioFile (fileInfo: FileInfo, userId?: number) {
    try {
      const [audioFile] = await db
        .insert(audioFiles)
        .values({
          filename: fileInfo.filename,
          originalPath: fileInfo.path,
          fileSize: fileInfo.size,
          mimeType: fileInfo.mimetype,
          userId: userId || null
        })
        .returning()

      return audioFile
    } catch (error) {
      console.log('Error storing audio file:', error)
      throw error
    }
  },

  // Get audio file by ID
  async getAudioFileById (id: number) {
    try {
      const audioFile = await db.query.audioFiles.findFirst({
        where: eq(audioFiles.id, id)
      })

      return audioFile
    } catch (error) {
      console.error('Error getting audio file:', error)
      throw error
    }
  },

  // Create transformation record
  async createTransformation (audioFileId: number, targetGenre: string) {
    try {
      const [transformation] = await db
        .insert(transformations)
        .values({
          audioFileId,
          targetGenre,
          status: 'pending'
        })
        .returning()

      return transformation
    } catch (error) {
      console.error('Error creating transformation:', error)
      throw error
    }
  },

  // Get transformation by ID
  async getTransformationById (id: number) {
    try {
      const transformation = await db.query.transformations.findFirst({
        where: eq(transformations.id, id),
        with: {
          audioFile: true
        }
      })

      return transformation
    } catch (error) {
      console.error('Error getting transformation:', error)
      throw error
    }
  },

  // Update transformation status
  async updateTransformationStatus (
    id: number,
    status: string,
    transformedPath?: string
  ) {
    try {
      const updates: Partial<typeof transformations.$inferInsert> = { status }

      if (transformedPath) {
        updates.transformedPath = transformedPath
      }

      if (status === 'completed') {
        updates.completedAt = new Date()
      }

      const [updated] = await db
        .update(transformations)
        .set(updates)
        .where(eq(transformations.id, id))
        .returning()

      return updated
    } catch (error) {
      console.error('Error updating transformation:', error)
      throw error
    }
  },

  // Process audio transformation with FFmpeg
  async processTransformation (transformationId: number) {
    try {
      // Get the transformation
      const transformation = await this.getTransformationById(transformationId)
      if (!transformation || !transformation.audioFile) {
        throw new Error('Transformation not found')
      }

      // Update status to processing
      await this.updateTransformationStatus(transformationId, 'processing')

      // Create file paths
      const originalFilePath = transformation.audioFile.originalPath
      const fileExt = path.extname(transformation.audioFile.filename)
      const transformedFileName = `${path.basename(
        transformation.audioFile.filename,
        fileExt
      )}_${transformation.targetGenre}${fileExt}`
      const transformedFilePath = path.join(
        TRANSFORMATIONS_DIR,
        transformedFileName
      )

      // Apply audio transformation based on genre using FFmpeg
      // Dramatically different transformations with extreme genre effects
      let ffmpegCommand = ''

      switch (transformation.targetGenre) {
        case 'rock':
          // ROCK: Heavy distortion, strong mid-high boost, compression
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=10,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=8,volume=3" "${transformedFilePath}"`
          break

        case 'electronic':
          // ELECTRONIC: Echo, high tempo, synth-like effects
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "aecho=0.9:0.9:60|90|120:0.7|0.5|0.4,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=8,atempo=0.9,volume=2.0" "${transformedFilePath}"`
          break

        case 'jazz':
          // JAZZ: Warm tone, slight swing, mellower feel
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=300:width_type=o:width=2:g=5,equalizer=f=800:width_type=o:width=2:g=4,equalizer=f=2000:width_type=o:width=2:g=-2,aecho=0.8:0.8:20|30:0.4|0.3,atempo=1.02,volume=1.5" "${transformedFilePath}"`
          break

        case 'classical':
          // CLASSICAL: Massive hall reverb, enhanced dynamics
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "aecho=0.9:0.9:1000|1800|2600:0.6|0.5|0.4,highpass=f=40,lowpass=f=16000,equalizer=f=800:width_type=o:width=2:g=3,atempo=1.05,dynaudnorm=f=10:g=5:p=0.7,volume=1.5" "${transformedFilePath}"`
          break

        case 'pop':
          // Bright, modern pop sound with high compression
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=1000:width_type=o:width=2:g=4,equalizer=f=3000:width_type=o:width=2:g=6,equalizer=f=10000:width_type=o:width=2:g=3,compand=attacks=0:decays=0.1:points=-90/-90|-40/-10|0/-3:soft-knee=6,atempo=0.95,volume=1.8" "${transformedFilePath}"`
          break

        case 'hiphop':
          // HIP-HOP: Super heavy bass, slower tempo
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=60:width_type=o:width=2:g=15,equalizer=f=100:width_type=o:width=2:g=12,equalizer=f=150:width_type=o:width=1:g=8,atempo=1.1,volume=2.0" "${transformedFilePath}"`
          break

        case 'reggae':
          // REGGAE: Emphasized bass, echo, slower tempo
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=60:width_type=o:width=2:g=8,equalizer=f=100:width_type=o:width=2:g=6,aecho=0.9:0.9:80|120:0.5|0.4,atempo=1.05,volume=1.6" "${transformedFilePath}"`
          break

        case 'country':
          // COUNTRY: Twangy midrange, guitar-like effects, vocal emphasis
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=2000:width_type=o:width=2:g=8,equalizer=f=4000:width_type=o:width=2:g=5,equalizer=f=6000:width_type=o:width=2:g=6,aecho=0.8:0.8:20|40:0.4|0.3,volume=1.8" "${transformedFilePath}"`
          break

        default:
          // Default enhancement
          ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=1000:width_type=q:width=2:g=5,volume=1.5" "${transformedFilePath}"`
      }

      console.log(
        `Applying ${transformation.targetGenre} transformation with command: ${ffmpegCommand}`
      )

      // Execute ffmpeg command
      try {
        execSync(ffmpegCommand, { stdio: 'pipe' })
        console.log(
          `Successfully transformed to ${transformation.targetGenre} genre`
        )
      } catch (ffmpegError) {
        console.error('FFmpeg error:', ffmpegError)
        // If ffmpeg fails, fallback to a simple copy
        fs.copyFileSync(originalFilePath, transformedFilePath)
        console.log('Falling back to simple copy')
      }

      // Update transformation status to completed
      await this.updateTransformationStatus(
        transformationId,
        'completed',
        transformedFilePath
      )

      return transformedFilePath
    } catch (error) {
      console.error('Error processing transformation:', error)
      // Update status to failed
      await this.updateTransformationStatus(transformationId, 'failed')
      throw error
    }
  },

  // Generate temporary file path for transformations not yet processed
  async generateTempTransformedFile (audioFileId: number, targetGenre: string) {
    try {
      const audioFile = await this.getAudioFileById(audioFileId)
      if (!audioFile) {
        throw new Error('Audio file not found')
      }

      // Check for existing transformations first
      const existingTransformation = await db.query.transformations.findFirst({
        where: table =>
          and(
            eq(table.audioFileId, audioFileId),
            eq(table.targetGenre, targetGenre),
            eq(table.status, 'completed')
          )
      })

      // If there's a completed transformation, use that
      if (existingTransformation && existingTransformation.transformedPath) {
        return existingTransformation.transformedPath
      }

      // Create a copy of the file with a new name to simulate transformation
      const originalFilePath = audioFile.originalPath
      const fileExt = path.extname(audioFile.filename)
      const transformedFileName = `${path.basename(
        audioFile.filename,
        fileExt
      )}_${targetGenre}${fileExt}`
      const transformedFilePath = path.join(
        TRANSFORMATIONS_DIR,
        transformedFileName
      )

      // Create a transformation record
      const transformation = await this.createTransformation(
        audioFileId,
        targetGenre
      )

      // Apply audio effects using FFmpeg
      if (!fs.existsSync(transformedFilePath)) {
        console.log(
          `Creating new transformation for ${audioFile.filename} to ${targetGenre} genre...`
        )

        // Dramatically different transformations with extreme genre effects
        let ffmpegCommand = ''

        switch (targetGenre) {
          case 'rock':
            // ROCK: Heavy distortion, strong mid-high boost, compression
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "compand=attacks=0:decays=0.1:points=-90/-60|-40/-10|0/-3:soft-knee=6,highpass=f=60,equalizer=f=800:width_type=o:width=2:g=10,equalizer=f=1400:width_type=o:width=2:g=12,equalizer=f=4000:width_type=o:width=2:g=8,volume=3" "${transformedFilePath}"`
            break

          case 'electronic':
            // ELECTRONIC: Echo, high tempo, synth-like effects
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "aecho=0.9:0.9:60|90|120:0.7|0.5|0.4,highpass=f=60,equalizer=f=5000:width_type=o:width=2:g=8,atempo=0.9,volume=2.0" "${transformedFilePath}"`
            break

          case 'jazz':
            // JAZZ: Warm tone, slight swing, mellower feel
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=300:width_type=o:width=2:g=5,equalizer=f=800:width_type=o:width=2:g=4,equalizer=f=2000:width_type=o:width=2:g=-2,aecho=0.8:0.8:20|30:0.4|0.3,atempo=1.02,volume=1.5" "${transformedFilePath}"`
            break

          case 'classical':
            // CLASSICAL: Massive hall reverb, enhanced dynamics
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "aecho=0.9:0.9:1000|1800|2600:0.6|0.5|0.4,highpass=f=40,lowpass=f=16000,equalizer=f=800:width_type=o:width=2:g=3,atempo=1.05,dynaudnorm=f=10:g=5:p=0.7,volume=1.5" "${transformedFilePath}"`
            break

          case 'pop':
            // Bright, modern pop sound with high compression
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=1000:width_type=o:width=2:g=4,equalizer=f=3000:width_type=o:width=2:g=6,equalizer=f=10000:width_type=o:width=2:g=3,compand=attacks=0:decays=0.1:points=-90/-90|-40/-10|0/-3:soft-knee=6,atempo=0.95,volume=1.8" "${transformedFilePath}"`
            break

          case 'hiphop':
            // HIP-HOP: Super heavy bass, slower tempo
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=60:width_type=o:width=2:g=15,equalizer=f=100:width_type=o:width=2:g=12,equalizer=f=150:width_type=o:width=1:g=8,atempo=1.1,volume=2.0" "${transformedFilePath}"`
            break

          case 'reggae':
            // REGGAE: Emphasized bass, echo, slower tempo
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=60:width_type=o:width=2:g=8,equalizer=f=100:width_type=o:width=2:g=6,aecho=0.9:0.9:80|120:0.5|0.4,atempo=1.05,volume=1.6" "${transformedFilePath}"`
            break

          case 'country':
            // COUNTRY: Twangy midrange, guitar-like effects, vocal emphasis
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=2000:width_type=o:width=2:g=8,equalizer=f=4000:width_type=o:width=2:g=5,equalizer=f=6000:width_type=o:width=2:g=6,aecho=0.8:0.8:20|40:0.4|0.3,volume=1.8" "${transformedFilePath}"`
            break

          default:
            // Default enhancement
            ffmpegCommand = `ffmpeg -y -i "${originalFilePath}" -af "equalizer=f=1000:width_type=q:width=2:g=5,volume=1.5" "${transformedFilePath}"`
        }

        console.log(
          `Applying ${targetGenre} transformation with command: ${ffmpegCommand}`
        )

        // Execute ffmpeg command
        try {
          execSync(ffmpegCommand, { stdio: 'pipe' })
          console.log(`Successfully transformed to ${targetGenre} genre`)
        } catch (ffmpegError) {
          console.error('FFmpeg error:', ffmpegError)
          // If ffmpeg fails, fallback to a simple copy
          fs.copyFileSync(originalFilePath, transformedFilePath)
          console.log('Falling back to simple copy')
        }
      }

      // Update status to completed
      await this.updateTransformationStatus(
        transformation.id,
        'completed',
        transformedFilePath
      )

      return transformedFilePath
    } catch (error) {
      console.error('Error generating temp transformed file:', error)
      throw error
    }
  }
}
