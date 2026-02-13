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

    const majorStreets = [
      { coords: [{ x: 0.05, y: 0.15 }, { x: 0.95, y: 0.15 }], name: 'Eastern Pkwy', width: 3 },
      { coords: [{ x: 0.05, y: 0.35 }, { x: 0.95, y: 0.38 }], name: 'Cherokee Rd', width: 2 },
      { coords: [{ x: 0.05, y: 0.48 }, { x: 0.95, y: 0.50 }], name: 'Grinstead Dr', width: 2 },
      { coords: [{ x: 0.05, y: 0.65 }, { x: 0.95, y: 0.67 }], name: 'Broadway', width: 3 },
      { coords: [{ x: 0.05, y: 0.78 }, { x: 0.95, y: 0.78 }], name: 'Lexington Rd', width: 2 },
      { coords: [{ x: 0.15, y: 0.08 }, { x: 0.15, y: 0.92 }], name: 'Bardstown Rd', width: 3 },
      { coords: [{ x: 0.28, y: 0.05 }, { x: 0.28, y: 0.95 }], name: 'Baxter Ave', width: 2 },
      { coords: [{ x: 0.42, y: 0.05 }, { x: 0.42, y: 0.95 }], name: 'Highland Ave', width: 2 },
      { coords: [{ x: 0.58, y: 0.10 }, { x: 0.60, y: 0.88 }], name: 'Cherokee Pkwy', width: 2 },
      { coords: [{ x: 0.72, y: 0.05 }, { x: 0.72, y: 0.95 }], name: 'Longest Ave', width: 2 },
      { coords: [{ x: 0.85, y: 0.08 }, { x: 0.85, y: 0.92 }], name: 'Frankfort Ave', width: 2 }
    ]

    const minorStreets = [
      { coords: [{ x: 0.05, y: 0.22 }, { x: 0.95, y: 0.23 }] },
      { coords: [{ x: 0.05, y: 0.28 }, { x: 0.95, y: 0.29 }] },
      { coords: [{ x: 0.05, y: 0.42 }, { x: 0.95, y: 0.43 }] },
      { coords: [{ x: 0.05, y: 0.55 }, { x: 0.95, y: 0.56 }] },
      { coords: [{ x: 0.05, y: 0.60 }, { x: 0.95, y: 0.61 }] },
      { coords: [{ x: 0.05, y: 0.72 }, { x: 0.95, y: 0.73 }] },
      { coords: [{ x: 0.05, y: 0.84 }, { x: 0.95, y: 0.85 }] },
      { coords: [{ x: 0.22, y: 0.05 }, { x: 0.22, y: 0.95 }] },
      { coords: [{ x: 0.35, y: 0.05 }, { x: 0.35, y: 0.95 }] },
      { coords: [{ x: 0.50, y: 0.05 }, { x: 0.50, y: 0.95 }] },
      { coords: [{ x: 0.65, y: 0.05 }, { x: 0.65, y: 0.95 }] },
      { coords: [{ x: 0.78, y: 0.05 }, { x: 0.78, y: 0.95 }] }
    ]

    mapCtx.strokeStyle = '#2a2a2a'
    mapCtx.lineWidth = 1
    minorStreets.forEach(street => {
      mapCtx.beginPath()
      mapCtx.moveTo(street.coords[0].x * rect.width, street.coords[0].y * rect.height)
      mapCtx.lineTo(street.coords[1].x * rect.width, street.coords[1].y * rect.height)
      mapCtx.stroke()
    })

    majorStreets.forEach(street => {
      mapCtx.strokeStyle = '#404040'
      mapCtx.lineWidth = street.width
      mapCtx.beginPath()
      mapCtx.moveTo(street.coords[0].x * rect.width, street.coords[0].y * rect.height)
      mapCtx.lineTo(street.coords[1].x * rect.width, street.coords[1].y * rect.height)
      mapCtx.stroke()
    })

    mapCtx.fillStyle = '#888888'
    mapCtx.font = 'bold 12px Inter, sans-serif'
    mapCtx.textBaseline = 'middle'

    const labeledStreets = [
      { name: 'Bardstown Rd', x: 0.15, y: 0.04, vertical: true },
      { name: 'Eastern Pkwy', x: 0.48, y: 0.15, vertical: false },
      { name: 'Baxter Ave', x: 0.28, y: 0.04, vertical: true },
      { name: 'Highland Ave', x: 0.42, y: 0.04, vertical: true },
      { name: 'Cherokee Pkwy', x: 0.59, y: 0.96, vertical: true },
      { name: 'Cherokee Rd', x: 0.48, y: 0.365, vertical: false },
      { name: 'Broadway', x: 0.48, y: 0.66, vertical: false },
      { name: 'Frankfort Ave', x: 0.85, y: 0.04, vertical: true }
    ]

    labeledStreets.forEach(street => {
      if (street.vertical) {
        const x = street.x * rect.width
        const y = street.y * rect.height
        mapCtx.save()
        mapCtx.translate(x, y)
        mapCtx.rotate(-Math.PI / 2)
        mapCtx.textAlign = 'left'
        mapCtx.fillText(street.name, 5, -5)
        mapCtx.restore()
      } else {
        const x = street.x * rect.width
        const y = street.y * rect.height
        mapCtx.textAlign = 'center'
        mapCtx.fillText(street.name, x, y - 8)
      }
    })

    const parks = [
      { x: 0.30, y: 0.20, width: 0.08, height: 0.06 },
      { x: 0.62, y: 0.32, width: 0.12, height: 0.10 },
      { x: 0.18, y: 0.52, width: 0.06, height: 0.05 }
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
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          40205 - Highlands, Louisville KY
        </span>
      </div>
    </div>
  )
}
