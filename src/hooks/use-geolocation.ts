import { useState, useEffect, useCallback } from 'react'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  permissionState: 'granted' | 'denied' | 'prompt' | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permissionState: null
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionState: 'granted'
        })
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
            setState(prev => ({ ...prev, error: errorMessage, loading: false, permissionState: 'denied' }))
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            setState(prev => ({ ...prev, error: errorMessage, loading: false }))
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            setState(prev => ({ ...prev, error: errorMessage, loading: false }))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [])

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState(prev => ({ ...prev, permissionState: result.state as 'granted' | 'denied' | 'prompt' }))
        
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: result.state as 'granted' | 'denied' | 'prompt' }))
        })
      })
    }
  }, [])

  return {
    ...state,
    requestLocation
  }
}
