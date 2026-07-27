import { useEffect, useRef, useState } from 'react'
import type { HeatMapPoint } from '@/lib/types'

declare global {
  interface Window {
    L: any
  }
}

interface HeatMapProps {
  points: HeatMapPoint[]
  userLocation?: { lat: number; lng: number } | null
}

export function HeatMap({ points, userLocation }: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.L) {
      setLeafletLoaded(true)
      setMapError(null)
      return
    }

    const checkLeaflet = setInterval(() => {
      if (typeof window !== 'undefined' && window.L) {
        setLeafletLoaded(true)
        setMapError(null)
        clearInterval(checkLeaflet)
      }
    }, 100)

    timeoutRef.current = setTimeout(() => {
      clearInterval(checkLeaflet)
      if (!window.L) {
        console.error('Leaflet (window.L) not available after 10 seconds')
        setMapError('Map library failed to load. Please refresh the page.')
      }
    }, 10000)

    return () => {
      clearInterval(checkLeaflet)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !leafletLoaded || !window.L) return

    try {
      const L = window.L
      const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng]
        : [40.7128, -74.0060]

      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      mapInstanceRef.current = map
      setMapError(null)
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError('Failed to load map')
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      } catch (error) {
        console.error('Failed to cleanup map:', error)
      }
    }
  }, [leafletLoaded, userLocation])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !userLocation || !window.L) return

    const L = window.L

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
    }

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 40px; height: 40px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            animation: userLocationPulse 2s infinite;
            z-index: 1;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(map)

    userMarkerRef.current.bindPopup('<strong>📍 Your Location</strong>')

    map.setView([userLocation.lat, userLocation.lng], map.getZoom())
  }, [userLocation])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return

    const L = window.L

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (points.length === 0) return

    const heatLayer = L.layerGroup()
    
    const maxIntensity = Math.max(...points.map(p => p.intensity || 1))
    
    points.forEach(point => {
      const intensity = (point.intensity || 1) / maxIntensity
      const radius = 50 + (intensity * 100)
      
      let color: string
      let opacity: number
      
      if (intensity > 0.7) {
        color = '#b22222'
        opacity = 0.6
      } else if (intensity > 0.4) {
        color = '#ff8c00'
        opacity = 0.5
      } else {
        color = '#adff2f'
        opacity = 0.4
      }

      L.circle([point.lat, point.lng], {
        radius: radius,
        fillColor: color,
        fillOpacity: opacity,
        stroke: false
      }).addTo(heatLayer)
    })

    heatLayer.addTo(map)
    heatLayerRef.current = heatLayer

  }, [points])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {mapError ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center p-6">
            <p className="text-destructive font-semibold mb-2">Map Error</p>
            <p className="text-sm text-muted-foreground">{mapError}</p>
            <p className="text-xs text-muted-foreground mt-2">Check browser console for details</p>
          </div>
        </div>
      ) : (
        <>
          <style>{`
            @keyframes userLocationPulse {
              0% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(2);
              }
            }
            .leaflet-container {
              width: 100%;
              height: 100%;
            }
            .user-location-marker {
              pointer-events: none;
            }
          `}</style>
          <div ref={mapRef} className="w-full h-full" />
          <div className="absolute top-4 right-4 flex flex-col gap-2 px-3 py-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border shadow-md z-[1000]">
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
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-border shadow-md z-[1000]">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {points.length} active nearby
            </span>
          </div>
        </>
      )}
    </div>
  )
}
