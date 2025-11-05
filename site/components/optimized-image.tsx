'use client'

import { useState, useEffect, useRef, memo, useMemo } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  loading?: 'lazy' | 'eager'
  priority?: boolean
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  onClick,
  onLoad,
  onError,
  loading = 'lazy',
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Transform URL to proper format (similar to AutoPlayVideo)
  const transformedSrc = useMemo(() => {
    if (!src) return ''
    
    try {
      // If already absolute, return as is
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return src
      }
      
      // Convert /media/... to /api/media/... for proper serving
      if (src.startsWith('/media/')) {
        return `/api${src}`
      }
      
      // If it's already /api/media/..., return as is
      if (src.startsWith('/api/media/')) {
        return src
      }
      
      // For any other relative path, prepend /api/media/
      return `/api/media/${src}`
    } catch (err) {
      console.error('Error transforming image URL:', err)
      return src
    }
  }, [src])

  useEffect(() => {
    // For eager/priority images, set a timeout to force show after 3 seconds
    if (priority || loading === 'eager') {
      loadTimeoutRef.current = setTimeout(() => {
        if (!isLoaded) {
          console.log('Image load timeout, forcing display:', transformedSrc)
          setIsLoaded(true)
        }
      }, 3000)
    }

    // Use Intersection Observer for lazy loading
    if (!priority && loading === 'lazy' && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && imgRef.current) {
              // Start loading the image
              imgRef.current.src = transformedSrc
              observer.disconnect()
            }
          })
        },
        {
          rootMargin: '50px', // Start loading 50px before entering viewport
        }
      )

      observer.observe(imgRef.current)

      return () => {
        observer.disconnect()
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
      }
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [transformedSrc, priority, loading, isLoaded])

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
    setHasError(true)
    onError?.(e)
  }

  if (hasError) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Image failed to load</span>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Show very subtle loading indicator for eager images */}
      {!isLoaded && (priority || loading === 'eager') && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Show full loading spinner for lazy images */}
      {!isLoaded && !(priority || loading === 'eager') && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}

      <img
        ref={imgRef}
        src={priority || loading === 'eager' ? transformedSrc : undefined}
        data-src={!priority && loading === 'lazy' ? transformedSrc : undefined}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : (priority || loading === 'eager' ? 'opacity-50' : 'opacity-0')
        }`}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding="async"
      />
    </div>
  )
})

