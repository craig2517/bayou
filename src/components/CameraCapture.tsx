import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Unable to access camera. Please grant camera permissions.')
      setIsLoading(false)
      toast.error('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
        {isLoading && (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Starting camera...</p>
          </div>
        )}
        
        {error && (
          <div className="text-white text-center p-6">
            <Camera size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-400">{error}</p>
            <Button onClick={startCamera} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        )}
        
        {!isLoading && !error && !capturedImage && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-white/30 rounded-lg m-4"></div>
            </div>
          </>
        )}
        
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-background p-4 border-t border-border">
        {!capturedImage ? (
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleClose}
              variant="outline"
              size="lg"
              className="flex-1 max-w-[150px]"
            >
              <X className="mr-2" size={20} />
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={isLoading || !!error}
              size="lg"
              className="flex-1 max-w-[200px] bg-primary"
            >
              <Camera className="mr-2" size={20} />
              Take Photo
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex-1 max-w-[150px]"
            >
              <X className="mr-2" size={20} />
              Retake
            </Button>
            <Button
              onClick={confirmPhoto}
              size="lg"
              className="flex-1 max-w-[200px] bg-primary"
            >
              <Check className="mr-2" size={20} />
              Use Photo
            </Button>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          Photos expire after 24 hours
        </p>
      </div>
    </div>
  )
}
