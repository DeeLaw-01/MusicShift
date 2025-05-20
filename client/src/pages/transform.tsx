import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WorkflowSteps from '@/components/workflow-steps'
import { useToast } from '@/hooks/use-toast'
import { FileAudio } from 'lucide-react'

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

      const response = await fetch('http://127.0.0.1:8080/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          targetGenre: selectedGenre
        })
      })

      if (!response.ok) {
        throw new Error('Failed to convert file')
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        filename.replace(/\.[^/.]+$/, '') + '_' + selectedGenre + '.wav'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Conversion Successful',
        description: 'Your audio file has been converted successfully.'
      })

      // Navigate back to home
      setLocation('/')
    } catch (error) {
      console.log('Conversion error:', error)
      toast({
        title: 'Conversion Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to convert audio file',
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
