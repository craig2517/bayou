import { useEffect, useRef } from 'react'
import type { HeatMapPoint } from '@/lib/types'

interface HeatMapProps {
  points: HeatMapPoint[]
}

export function HeatMap({ points }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    const minLat = Math.min(...points.map(p => p.lat))
    const maxLat = Math.max(...points.map(p => p.lat))
    const minLng = Math.min(...points.map(p => p.lng))
    const maxLng = Math.max(...points.map(p => p.lng))

    const padding = 40

    points.forEach(point => {
      const x = padding + ((point.lng - minLng) / (maxLng - minLng)) * (rect.width - padding * 2)
      const y = padding + ((maxLat - point.lat) / (maxLat - minLat)) * (rect.height - padding * 2)

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 60)
      
      const alpha = point.intensity * 0.6
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
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
      ctx.fillRect(x - 60, y - 60, 120, 120)
    })

    ctx.globalCompositeOperation = 'source-atop'
    const overlayGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    overlayGradient.addColorStop(0, 'rgba(255, 50, 0, 0.1)')
    overlayGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.08)')
    overlayGradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)')
    ctx.fillStyle = overlayGradient
    ctx.fillRect(0, 0, rect.width, rect.height)

  }, [points])

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-black via-gray-900 to-blue-950/30 rounded-lg overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,100,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,255,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(100,0,255,0.15),transparent_40%)]" />
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
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
