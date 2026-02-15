import { useEffect, useRef } from 'react'
import type { HeatMapPoint } from '@/lib/types'

interface HeatMapProps {
  points: HeatMapPoint[]
}

export function HeatMap({ points }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streetMapRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const streetCanvas = streetMapRef.current
    if (!streetCanvas) return

    const streetCtx = streetCanvas.getContext('2d')
    if (!streetCtx) return

    const rect = streetCanvas.getBoundingClientRect()
    streetCanvas.width = rect.width * window.devicePixelRatio
    streetCanvas.height = rect.height * window.devicePixelRatio
    streetCtx.scale(window.devicePixelRatio, window.devicePixelRatio)

    streetCtx.fillStyle = '#f5f5f0'
    streetCtx.fillRect(0, 0, rect.width, rect.height)

    const seed = 42
    const random = (min: number, max: number, index: number) => {
      const x = Math.sin(seed + index) * 10000
      return min + (x - Math.floor(x)) * (max - min)
    }

    streetCtx.strokeStyle = '#d4d4d0'
    streetCtx.lineWidth = 4
    streetCtx.lineCap = 'round'

    const numMainStreets = 8
    for (let i = 0; i < numMainStreets; i++) {
      const y = (i + 1) * (rect.height / (numMainStreets + 1)) + random(-15, 15, i)
      streetCtx.beginPath()
      streetCtx.moveTo(0, y)
      const segments = 15
      for (let j = 1; j <= segments; j++) {
        const x = (j / segments) * rect.width
        const yOffset = random(-8, 8, i * 100 + j)
        streetCtx.lineTo(x, y + yOffset)
      }
      streetCtx.stroke()
    }

    for (let i = 0; i < numMainStreets; i++) {
      const x = (i + 1) * (rect.width / (numMainStreets + 1)) + random(-15, 15, i + 100)
      streetCtx.beginPath()
      streetCtx.moveTo(x, 0)
      const segments = 15
      for (let j = 1; j <= segments; j++) {
        const y = (j / segments) * rect.height
        const xOffset = random(-8, 8, i * 100 + j + 200)
        streetCtx.lineTo(x + xOffset, y)
      }
      streetCtx.stroke()
    }

    streetCtx.strokeStyle = '#e8e8e3'
    streetCtx.lineWidth = 2
    const numMinorStreets = 20
    for (let i = 0; i < numMinorStreets; i++) {
      const y = random(20, rect.height - 20, i + 300)
      const startX = random(0, rect.width * 0.2, i + 400)
      const endX = random(rect.width * 0.8, rect.width, i + 500)
      
      streetCtx.beginPath()
      streetCtx.moveTo(startX, y)
      const segments = 10
      for (let j = 1; j <= segments; j++) {
        const x = startX + (j / segments) * (endX - startX)
        const yOffset = random(-5, 5, i * 50 + j + 600)
        streetCtx.lineTo(x, y + yOffset)
      }
      streetCtx.stroke()
    }

    for (let i = 0; i < numMinorStreets; i++) {
      const x = random(20, rect.width - 20, i + 700)
      const startY = random(0, rect.height * 0.2, i + 800)
      const endY = random(rect.height * 0.8, rect.height, i + 900)
      
      streetCtx.beginPath()
      streetCtx.moveTo(x, startY)
      const segments = 10
      for (let j = 1; j <= segments; j++) {
        const y = startY + (j / segments) * (endY - startY)
        const xOffset = random(-5, 5, i * 50 + j + 1000)
        streetCtx.lineTo(x + xOffset, y)
      }
      streetCtx.stroke()
    }

    streetCtx.fillStyle = '#e0e0d8'
    for (let i = 0; i < 25; i++) {
      const x = random(30, rect.width - 30, i + 1100)
      const y = random(30, rect.height - 30, i + 1200)
      const width = random(30, 80, i + 1300)
      const height = random(30, 80, i + 1400)
      
      streetCtx.fillRect(x - width / 2, y - height / 2, width, height)
      
      streetCtx.strokeStyle = '#c8c8c0'
      streetCtx.lineWidth = 1
      streetCtx.strokeRect(x - width / 2, y - height / 2, width, height)
    }

    streetCtx.strokeStyle = '#b8d4b8'
    streetCtx.fillStyle = '#c8e6c8'
    for (let i = 0; i < 12; i++) {
      const x = random(50, rect.width - 50, i + 1500)
      const y = random(50, rect.height - 50, i + 1600)
      const size = random(15, 35, i + 1700)
      
      streetCtx.beginPath()
      streetCtx.arc(x, y, size, 0, Math.PI * 2)
      streetCtx.fill()
      streetCtx.lineWidth = 1
      streetCtx.stroke()
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
        ref={streetMapRef}
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
