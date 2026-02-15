import { useEffect, useRef } from 'react'
import type { HeatMapPoint } from '@/lib/types'

interface HeatMapProps {
  points: HeatMapPoint[]
}

export function HeatMap({ points }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current
    if (!gridCanvas) return

    const gridCtx = gridCanvas.getContext('2d')
    if (!gridCtx) return

    const rect = gridCanvas.getBoundingClientRect()
    gridCanvas.width = rect.width * window.devicePixelRatio
    gridCanvas.height = rect.height * window.devicePixelRatio
    gridCtx.scale(window.devicePixelRatio, window.devicePixelRatio)

    gridCtx.fillStyle = '#f8f9fa'
    gridCtx.fillRect(0, 0, rect.width, rect.height)

    gridCtx.strokeStyle = '#e0e0e0'
    gridCtx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < rect.width; x += gridSize) {
      gridCtx.beginPath()
      gridCtx.moveTo(x, 0)
      gridCtx.lineTo(x, rect.height)
      gridCtx.stroke()
    }
    for (let y = 0; y < rect.height; y += gridSize) {
      gridCtx.beginPath()
      gridCtx.moveTo(0, y)
      gridCtx.lineTo(rect.width, y)
      gridCtx.stroke()
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

      const baseRadius = 45
      const intensityMultiplier = point.intensity / maxIntensity
      const radius = baseRadius * (0.8 + intensityMultiplier * 0.6)

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

      if (intensityMultiplier > 0.7) {
        gradient.addColorStop(0, 'rgba(178, 34, 34, 0.9)')
        gradient.addColorStop(0.3, 'rgba(220, 20, 60, 0.7)')
        gradient.addColorStop(0.6, 'rgba(255, 69, 0, 0.5)')
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)')
      } else if (intensityMultiplier > 0.4) {
        gradient.addColorStop(0, 'rgba(255, 140, 0, 0.8)')
        gradient.addColorStop(0.3, 'rgba(255, 165, 0, 0.6)')
        gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.7)')
        gradient.addColorStop(0.3, 'rgba(173, 255, 47, 0.5)')
        gradient.addColorStop(0.6, 'rgba(50, 205, 50, 0.3)')
        gradient.addColorStop(1, 'rgba(50, 205, 50, 0)')
      }

      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    })

  }, [points])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%', mixBlendMode: 'multiply' }}
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2 px-3 py-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border shadow-md">
        <div className="text-xs font-semibold text-foreground mb-1">Activity Level</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'rgb(178, 34, 34)' }} />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'rgb(255, 140, 0)' }} />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'rgb(173, 255, 47)' }} />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-border shadow-md">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-foreground">
          {points.length} active nearby
        </span>
      </div>
    </div>
  )
}
