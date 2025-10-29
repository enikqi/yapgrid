'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type VideoPlayerProps = {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onError?: (error: Error) => void
}

export function AdvancedVideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  loop = true,
  muted = true,
  controls = true,
  onPlay,
  onPause,
  onEnded,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(muted ? 0 : 0.5)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false)
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const doubleTapTimeout = useRef<NodeJS.Timeout>()
  const hideControlsTimeout = useRef<NodeJS.Timeout>()

  // Handle video play/pause
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      if (videoRef.current.paused) {
        await videoRef.current.play()
        setIsPlaying(true)
        setError(null)
        onPlay?.()
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
        onPause?.()
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err)
      setError('Failed to play video. Please try again.')
      onError?.(err as Error)
    }
  }, [onPlay, onPause, onError])

  // Toggle mute/unmute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    
    const newMuted = !videoRef.current.muted
    videoRef.current.muted = newMuted
    setIsMuted(newMuted)
    
    // If unmuting, set volume to last known volume or 0.5
    if (newMuted === false && videoRef.current.volume === 0) {
      const newVolume = volume > 0 ? volume : 0.5
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
    
    // Show volume control briefly
    setShowVolumeControl(true)
    clearTimeout(hideControlsTimeout.current)
    hideControlsTimeout.current = setTimeout(() => setShowVolumeControl(false), 2000)
  }, [volume])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    
    const newVolume = parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    videoRef.current.muted = newVolume === 0
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    
    // Show volume control briefly
    setShowVolumeControl(true)
    clearTimeout(hideControlsTimeout.current)
    hideControlsTimeout.current = setTimeout(() => setShowVolumeControl(false), 2000)
  }, [])

  // Handle progress bar click
  const handleProgressBarClick = useCallback((e: React.MouseEvent) => {
    if (!progressBarRef.current || !videoRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * videoRef.current.duration
  }, [])

  // Handle progress bar drag
  const handleProgressBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (!videoRef.current) return
    
    e.stopPropagation()
    setIsDraggingProgress(true)
    setWasPlayingBeforeDrag(!videoRef.current.paused)
    
    if (!videoRef.current.paused) {
      videoRef.current.pause()
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current || !videoRef.current) return
      
      const rect = progressBarRef.current.getBoundingClientRect()
      let pos = (moveEvent.clientX - rect.left) / rect.width
      pos = Math.max(0, Math.min(1, pos)) // Clamp between 0 and 1
      
      const newTime = pos * videoRef.current.duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      if (wasPlayingBeforeDrag && videoRef.current) {
        videoRef.current.play().catch(console.error)
      }
      
      setIsDraggingProgress(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp, { once: true })
  }, [wasPlayingBeforeDrag])

  // Handle video tap (play/pause on mobile)
  const handleVideoTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Check for double tap
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300 // ms
    
    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - toggle fullscreen
      clearTimeout(doubleTapTimeout.current)
      toggleFullscreen()
      setLastTap(0)
    } else {
      // Single tap - toggle play/pause
      clearTimeout(doubleTapTimeout.current)
      
      doubleTapTimeout.current = setTimeout(() => {
        togglePlayPause()
        setLastTap(0)
      }, DOUBLE_TAP_DELAY)
      
      setLastTap(now)
    }
  }, [lastTap, togglePlayPause, toggleFullscreen])

  // Initialize video
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return
    
    setIsLoading(true)
    setError(null)
    
    // Set initial volume and muted state
    videoElement.volume = volume
    videoElement.muted = isMuted
    
    // Set up event listeners
    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(videoElement.duration)
      
      // Auto-play if requested
      if (autoPlay) {
        videoElement.play().catch(err => {
          console.error('Autoplay failed:', err)
          setError('Click to play video')
        })
      }
    }
    
    const handleError = () => {
      console.error('Video error:', videoElement.error)
      setIsLoading(false)
      setError('Failed to load video. Please try again.')
      onError?.(videoElement.error || new Error('Unknown video error'))
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime)
    }
    
    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    
    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    
    // Detect mobile
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    setIsMobile(isMobileDevice)
    
    // Add event listeners
    videoElement.addEventListener('loadeddata', handleLoadedData)
    videoElement.addEventListener('error', handleError)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('ended', handleEnded)
    
    // Cleanup
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData)
      videoElement.removeEventListener('error', handleError)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('ended', handleEnded)
      
      clearTimeout(doubleTapTimeout.current)
      clearTimeout(hideControlsTimeout.current)
    }
  }, [autoPlay, isMuted, volume, onPlay, onPause, onEnded, onError])

  // Auto-hide controls
  useEffect(() => {
    if (!controls) return
    
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(hideControlsTimeout.current)
      hideControlsTimeout.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }
    
    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('touchmove', handleMouseMove)
      
      // Show controls on touch start
      const handleTouchStart = () => {
        setShowControls(true)
        clearTimeout(hideControlsTimeout.current)
      }
      
      container.addEventListener('touchstart', handleTouchStart)
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('touchmove', handleMouseMove)
        container.removeEventListener('touchstart', handleTouchStart)
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [controls, isPlaying])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Format time in seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!controls) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      // Only handle keyboard shortcuts when video is focused or in fullscreen
      if (document.activeElement !== videoRef.current && !document.fullscreenElement) return
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlayPause()
          break
          
        case 'm':
          e.preventDefault()
          toggleMute()
          break
          
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
          
        case 'arrowleft':
        case 'j':
          e.preventDefault()
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
          break
          
        case 'arrowright':
        case 'l':
          e.preventDefault()
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + 5
          )
          break
          
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault()
          const percent = parseInt(e.key) / 10
          videoRef.current.currentTime = videoRef.current.duration * percent
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [controls, togglePlayPause, toggleMute, toggleFullscreen])

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full h-full bg-black rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
      
      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4 text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              videoRef.current?.load()
            }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      )}
      
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={poster}
        controls={false}
        loop={loop}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        disablePictureInPicture
        onClick={handleVideoTap}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          display: isLoading ? 'none' : 'block'
        }}
      />
      
      {/* Play/Pause overlay (visible when not playing) */}
      {!isPlaying && !isLoading && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
      
      {/* Volume control (shown when volume changes) */}
      {showVolumeControl && controls && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/70 p-3 rounded-lg z-20">
          <div className="h-24 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-24 w-8 -rotate-90 accent-white"
              style={{ WebkitAppearance: 'slider-vertical' }}
              aria-label="Volume"
            />
          </div>
        </div>
      )}
      
      {/* Controls overlay */}
      {controls && (
        <div 
          ref={controlsRef}
          className={cn(
            'absolute inset-0 transition-opacity duration-300 z-10',
            showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100',
            isDraggingProgress && 'opacity-100' // Keep controls visible while dragging progress
          )}
        >
          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Progress bar */}
            <div 
              ref={progressBarRef}
              className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer"
              onClick={handleProgressBarClick}
              onMouseDown={handleProgressBarMouseDown}
            >
              <div 
                className="h-full bg-red-500 rounded-full relative"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              >
                <div className="absolute -right-1.5 -top-0.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Play/Pause button */}
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-gray-300 transition-colors p-1"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} className="ml-0.5" />
                  )}
                </button>
                
                {/* Volume control */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 transition-colors p-1"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                  
                  <div className="w-20">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 accent-white"
                      aria-label="Volume"
                    />
                  </div>
                </div>
                
                {/* Current time / duration */}
                <div className="text-white text-xs font-mono select-none">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors p-1"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
