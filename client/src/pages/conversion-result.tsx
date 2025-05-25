import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileAudio, ArrowRight, Download, Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ConversionResult () {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [conversionData, setConversionData] = useState<{
    filename: string
    predictedGenre: string
    targetGenre: string
    downloadUrl: string
  } | null>(null)

  useEffect(() => {
    // Get conversion data from session storage
    const data = sessionStorage.getItem('conversionResult')
    if (!data) {
      setLocation('/')
      return
    }
    setConversionData(JSON.parse(data))
  }, [setLocation])

  const handleDownload = () => {
    if (!conversionData) return

    const a = document.createElement('a')
    a.href = conversionData.downloadUrl
    a.download = conversionData.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(conversionData.downloadUrl)
  }

  const handleNewConversion = () => {
    sessionStorage.removeItem('conversionResult')
    setLocation('/')
  }

  if (!conversionData) {
    return null
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Conversion Complete!
      </h1>

      <Card className='mb-8'>
        <CardContent className='pt-6'>
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center mb-6'>
              <FileAudio className='h-12 w-12 text-primary' />
            </div>

            <h2 className='text-2xl font-semibold mb-4'>
              Genre Transformation
            </h2>

            <div className='flex items-center justify-center space-x-4 mb-6'>
              <div className='text-center'>
                <p className='text-sm text-gray-500 mb-1'>Original Genre</p>
                <p className='text-lg font-medium'>
                  {conversionData.predictedGenre}
                </p>
              </div>

              <ArrowRight className='h-6 w-6 text-gray-400' />

              <div className='text-center'>
                <p className='text-sm text-gray-500 mb-1'>Target Genre</p>
                <p className='text-lg font-medium'>
                  {conversionData.targetGenre}
                </p>
              </div>
            </div>

            <p className='text-gray-600 mb-8'>
              Your audio file has been successfully transformed from{' '}
              {conversionData.predictedGenre} to {conversionData.targetGenre}.
            </p>

            <div className='flex justify-center space-x-4'>
              <Button onClick={handleDownload} className='flex items-center'>
                <Download className='mr-2 h-4 w-4' />
                Download Converted File
              </Button>

              <Button
                variant='outline'
                onClick={handleNewConversion}
                className='flex items-center'
              >
                <Home className='mr-2 h-4 w-4' />
                Start New Conversion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
