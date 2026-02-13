import { useEffect, useRef } from 'react'
import type { HeatMapPoint } from '@/lib/types'

interface HeatMapProps {
  points: HeatMapPoint[]
}

export function HeatMap({ points }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const mapCanvas = mapCanvasRef.current
    if (!mapCanvas) return

    const mapCtx = mapCanvas.getContext('2d')
    if (!mapCtx) return

    const rect = mapCanvas.getBoundingClientRect()
    mapCanvas.width = rect.width * window.devicePixelRatio
    mapCanvas.height = rect.height * window.devicePixelRatio
    mapCtx.scale(window.devicePixelRatio, window.devicePixelRatio)

    mapCtx.fillStyle = '#1a1a1a'
    mapCtx.fillRect(0, 0, rect.width, rect.height)

    mapCtx.strokeStyle = '#2a2a2a'
    mapCtx.lineWidth = 1
    for (let i = 1; i < 10; i++) {
      const pos = i / 10
      mapCtx.beginPath()
      mapCtx.moveTo(pos * rect.width, 0)
      mapCtx.lineTo(pos * rect.width, rect.height)
      mapCtx.stroke()
      
      mapCtx.beginPath()
      mapCtx.moveTo(0, pos * rect.height)
      mapCtx.lineTo(rect.width, pos * rect.height)
      mapCtx.stroke()
    }

    mapCtx.strokeStyle = '#404040'
    mapCtx.lineWidth = 3
    for (let i = 0; i < 3; i++) {
      const pos = (i + 1) * 0.25
      mapCtx.beginPath()
      mapCtx.moveTo(pos * rect.width, 0)
      mapCtx.lineTo(pos * rect.width, rect.height)
      mapCtx.stroke()
      
      mapCtx.beginPath()
      mapCtx.moveTo(0, pos * rect.height)
      mapCtx.lineTo(rect.width, pos * rect.height)
      mapCtx.stroke()
    }

    mapCtx.strokeStyle = '#333333'
    mapCtx.lineWidth = 2
    mapCtx.beginPath()
    mapCtx.moveTo(0.1 * rect.width, 0.1 * rect.height)
    mapCtx.lineTo(0.9 * rect.width, 0.9 * rect.height)
    mapCtx.stroke()
    
    mapCtx.beginPath()
    mapCtx.moveTo(0.9 * rect.width, 0.1 * rect.height)
    mapCtx.lineTo(0.1 * rect.width, 0.9 * rect.height)
    mapCtx.stroke()

    const parks = [
      { x: 0.15, y: 0.15, width: 0.15, height: 0.12 },
      { x: 0.65, y: 0.35, width: 0.20, height: 0.15 },
      { x: 0.35, y: 0.70, width: 0.12, height: 0.10 }
    ]

    parks.forEach(park => {
      mapCtx.fillStyle = '#1a3a1a'
      mapCtx.fillRect(
        park.x * rect.width,
        park.y * rect.height,
        park.width * rect.width,
        park.height * rect.height
      )
    })

  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.clearRect(0, 0, rect.width, rect.height)

    if (points.length === 0) return

    const minLat = Math.min(...points.map(p => p.lat))
    const maxLat = Math.max(...points.map(p => p.lat))
    const minLng = Math.min(...points.map(p => p.lng))
    const maxLng = Math.max(...points.map(p => p.lng))

    const padding = 40

    const maxIntensity = Math.max(...points.map(p => p.intensity))

    points.forEach(point => {
      const x = padding + ((point.lng - minLng) / (maxLng - minLng)) * (rect.width - padding * 2)
      const y = padding + ((maxLat - point.lat) / (maxLat - minLat)) * (rect.height - padding * 2)

      const radius = 40 + (point.intensity / maxIntensity) * 40
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      
      const brightness = 0.5 + (point.intensity / maxIntensity) * 0.5
      const alpha = point.intensity * brightness
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.0})`)
      gradient.addColorStop(0.15, `rgba(255, 240, 200, ${alpha * 0.95})`)
      gradient.addColorStop(0.25, `rgba(255, 50, 0, ${alpha * 0.9})`)
      gradient.addColorStop(0.35, `rgba(255, 150, 0, ${alpha * 0.8})`)
      gradient.addColorStop(0.45, `rgba(255, 255, 0, ${alpha * 0.7})`)
      gradient.addColorStop(0.55, `rgba(0, 255, 0, ${alpha * 0.6})`)
      gradient.addColorStop(0.65, `rgba(0, 255, 255, ${alpha * 0.5})`)
      gradient.addColorStop(0.75, `rgba(0, 100, 255, ${alpha * 0.4})`)
      gradient.addColorStop(0.85, `rgba(100, 0, 255, ${alpha * 0.3})`)
      gradient.addColorStop(0.95, `rgba(50, 0, 100, ${alpha * 0.2})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    })

  }, [points])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <canvas
        ref={mapCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full mix-blend-screen"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-white animate-pulse" />
        <span className="text-sm font-medium text-foreground">
          {points.length} active nearby
        </span>
      </div>
    </div>
  )
}
