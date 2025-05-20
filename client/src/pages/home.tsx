import { useState } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FileDropzone from '@/components/ui/dropzone'
import WorkflowSteps from '@/components/workflow-steps'
import { formatFileSize } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { FileAudio, Trash2 } from 'lucide-react'

export default function Home () {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFilesAccepted = (files: File[]) => {
    setUploadedFile(files[0])
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  const handleCancelUpload = () => {
    setUploadedFile(null)
  }

  const handleUpload = async () => {
    if (!uploadedFile) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('http://127.0.0.1:8080/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()

      toast({
        title: 'Upload Successful',
        description: 'Your audio file has been uploaded successfully.'
      })

      // Navigate to the transform page with the filename
      setLocation(`/transform?filename=${data.filename}`)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to upload audio file',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='max-w-6xl mx-auto'>
      <h2 className='text-3xl font-semibold text-center mb-6'>
        Transform Your Music
      </h2>
      <p className='text-center text-gray-600 mb-8 max-w-2xl mx-auto'>
        Upload your song and use our AI to transform it into a different genre
        while preserving the melody and structure.
      </p>

      <WorkflowSteps currentStep={1} />

      <Card className='mb-8'>
        <CardContent className='pt-6'>
          <h3 className='text-xl font-semibold mb-4'>Upload Your Audio</h3>

          {!uploadedFile ? (
            <FileDropzone onFilesAccepted={handleFilesAccepted} />
          ) : (
            <div className='bg-gray-100 rounded-lg p-4 mb-4'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center'>
                  <FileAudio className='text-primary mr-2 h-5 w-5' />
                  <div>
                    <p className='font-medium'>{uploadedFile.name}</p>
                    <p className='text-xs text-gray-500'>
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleRemoveFile}
                  className='text-red-500 hover:text-red-700'
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          )}

          <div className='flex justify-end mt-6'>
            <Button
              variant='outline'
              onClick={handleCancelUpload}
              className='mr-2'
            >
              Cancel
            </Button>
            <Button
              disabled={!uploadedFile || uploading}
              onClick={handleUpload}
              className={!uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {uploading ? (
                <>
                  <span className='animate-spin mr-2'>⏳</span>
                  Uploading...
                </>
              ) : (
                'Next: Select Genre'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
