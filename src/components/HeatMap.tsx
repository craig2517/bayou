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

    mapCtx.strokeStyle = '#333333'
    mapCtx.lineWidth = 2

    const majorStreets = [
      [{ x: 0.05, y: 0.35 }, { x: 0.95, y: 0.35 }],
      [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }],
      [{ x: 0.05, y: 0.65 }, { x: 0.95, y: 0.65 }],
      [{ x: 0.15, y: 0.05 }, { x: 0.15, y: 0.95 }],
      [{ x: 0.3, y: 0.05 }, { x: 0.3, y: 0.95 }],
      [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }],
      [{ x: 0.7, y: 0.05 }, { x: 0.7, y: 0.95 }],
      [{ x: 0.85, y: 0.05 }, { x: 0.85, y: 0.95 }]
    ]

    majorStreets.forEach(street => {
      mapCtx.beginPath()
      mapCtx.moveTo(street[0].x * rect.width, street[0].y * rect.height)
      mapCtx.lineTo(street[1].x * rect.width, street[1].y * rect.height)
      mapCtx.stroke()
    })

    mapCtx.strokeStyle = '#2a2a2a'
    mapCtx.lineWidth = 1

    for (let i = 0; i < 15; i++) {
      const isHorizontal = Math.random() > 0.5
      if (isHorizontal) {
        const y = Math.random()
        mapCtx.beginPath()
        mapCtx.moveTo(0.1 * rect.width, y * rect.height)
        mapCtx.lineTo(0.9 * rect.width, y * rect.height)
        mapCtx.stroke()
      } else {
        const x = Math.random()
        mapCtx.beginPath()
        mapCtx.moveTo(x * rect.width, 0.1 * rect.height)
        mapCtx.lineTo(x * rect.width, 0.9 * rect.height)
        mapCtx.stroke()
      }
    }

    for (let i = 0; i < 8; i++) {
      const x = 0.15 + Math.random() * 0.7
      const y = 0.15 + Math.random() * 0.7
      const size = 3 + Math.random() * 4
      
      mapCtx.fillStyle = '#2a4a2a'
      mapCtx.fillRect(
        x * rect.width - size / 2,
        y * rect.height - size / 2,
        size,
        size
      )
    }

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
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          40205 - Highlands, Louisville KY
        </span>
      </div>
    </div>
  )
}
