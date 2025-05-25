import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WorkflowSteps from '@/components/workflow-steps'
import { useToast } from '@/hooks/use-toast'
import { FileAudio, ArrowRight } from 'lucide-react'
import axios, { AxiosError } from 'axios'

const GENRES = [
  { id: 'rock', name: 'Rock' },
  { id: 'electronic', name: 'Electronic' },
  { id: 'hiphop', name: 'Hip Hop' },
  { id: 'classical', name: 'Classical' },
  { id: 'country', name: 'Country' }
]

export default function Transform () {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [filename, setFilename] = useState<string>('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [converting, setConverting] = useState(false)
  const [predictedGenre, setPredictedGenre] = useState<string | null>(null)

  useEffect(() => {
    // Get filename from URL query parameter
    const params = new URLSearchParams(window.location.search)
    const file = params.get('filename')
    if (!file) {
      setLocation('/')
      return
    }
    setFilename(file)
  }, [setLocation])

  const handleConvert = async () => {
    if (!selectedGenre) {
      toast({
        title: 'No Genre Selected',
        description: 'Please select a target genre to convert your audio.',
        variant: 'destructive'
      })
      return
    }

    try {
      setConverting(true)

      const response = await axios.post(
        'http://127.0.0.1:8080/api/convert',
        {
          filename,
          targetGenre: selectedGenre
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Response:', response)
      console.log('Response headers:', response.headers)

      // Get metadata from response headers
      const encodedMetadata =
        response.headers['x-conversion-metadata'] ||
        response.headers['X-Conversion-Metadata']
      console.log('Encoded metadata from headers:', encodedMetadata)

      let metadata: { predictedGenre?: string } = {}

      if (encodedMetadata) {
        try {
          const decodedMetadata = atob(encodedMetadata)
          console.log('Decoded metadata:', decodedMetadata)
          metadata = JSON.parse(decodedMetadata)
          console.log('Parsed metadata:', metadata)

          if (metadata.predictedGenre) {
            console.log('Setting predicted genre:', metadata.predictedGenre)
            setPredictedGenre(metadata.predictedGenre)
          }
        } catch (error) {
          console.error('Error parsing metadata:', error)
        }
      } else {
        console.log('No metadata found in response headers')
        // Log all available headers for debugging
        console.log('All available headers:', Object.keys(response.headers))
      }

      // Create a download link
      const url = window.URL.createObjectURL(response.data)

      // Store conversion data in session storage
      const conversionData = {
        filename:
          filename.replace(/\.[^/.]+$/, '') + '_' + selectedGenre + '.wav',
        predictedGenre: metadata.predictedGenre || 'unknown',
        targetGenre: selectedGenre,
        downloadUrl: url
      }
      sessionStorage.setItem('conversionResult', JSON.stringify(conversionData))

      // Navigate to result page
      setLocation('/conversion-result')
    } catch (error) {
      console.error('Conversion error:', error)
      const axiosError = error as AxiosError
      const errorMessage =
        //@ts-ignore
        axiosError.response?.data?.error || 'Failed to convert audio file'
      toast({
        title: 'Conversion Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className='max-w-6xl mx-auto'>
      <h2 className='text-3xl font-semibold text-center mb-6'>
        Select Target Genre
      </h2>
      <p className='text-center text-gray-600 mb-8 max-w-2xl mx-auto'>
        Choose the genre you want to transform your audio into.
      </p>

      <WorkflowSteps currentStep={2} />

      <Card className='mb-8'>
        <CardContent className='pt-6'>
          <h3 className='text-xl font-semibold mb-4'>Transform Your Audio</h3>

          <div className='bg-gray-100 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
              <FileAudio className='text-primary mr-2 h-5 w-5' />
              <div>
                <p className='font-medium'>{filename}</p>
                {predictedGenre && (
                  <div className='flex items-center mt-2 text-sm text-gray-600'>
                    <span>Detected Genre: {predictedGenre}</span>
                    <ArrowRight className='mx-2 h-4 w-4' />
                    <span>Target Genre: {selectedGenre}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
            {GENRES.map(genre => (
              <Button
                key={genre.id}
                variant={selectedGenre === genre.id ? 'default' : 'outline'}
                className='h-24 text-lg'
                onClick={() => setSelectedGenre(genre.id)}
              >
                {genre.name}
              </Button>
            ))}
          </div>

          <div className='flex justify-end mt-6'>
            <Button
              variant='outline'
              onClick={() => setLocation('/')}
              className='mr-2'
            >
              Back
            </Button>
            <Button
              disabled={!selectedGenre || converting}
              onClick={handleConvert}
              className={!selectedGenre ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {converting ? (
                <>
                  <span className='animate-spin mr-2'>⏳</span>
                  Converting...
                </>
              ) : (
                'Convert Now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
