"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  ClosedCaption,
  AlertCircle,
} from "lucide-react";
import type { Post, Asset } from "@/lib/types";
import { mobileLogger } from "@/lib/mobile-logger";
import { cn } from "@/lib/utils";
import { useMobileDetection } from "@/lib/use-mobile-detection";

interface AutoPlayVideoProps {
  post: Post & { assets: Asset[] };
  onVideoPlay: (post: Post & { assets: Asset[] }) => void;
  showPlayButton?: boolean;
  className?: string;
}

// Global state to track currently playing video
let currentlyPlayingVideo: HTMLVideoElement | null = null;
let currentPlaybackTime = 0;

// Track all intersecting videos with their ratios
const intersectingVideos = new Map<HTMLVideoElement, number>();

// Store current video time when opening fullscreen
let videoStartTime: number | undefined = undefined;

export default function AutoPlayVideo({
  post,
  onVideoPlay,
  showPlayButton = true,
  className,
}: AutoPlayVideoProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPlayButtonOverlay, setShowPlayButtonOverlay] = useState(false);
  const isMobile = useMobileDetection();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get video URL with fallback
  const getVideoUrl = useCallback((url: string | null | undefined): string => {
    if (!url) {
      console.warn("Video URL is empty or undefined");
      return "";
    }

    try {
      // If it's a reddit video URL, use the fallback
      if (url.includes("v.redd.it") || url.includes("reddit.com")) {
        return `https://v.redd.it/8n3sx9sib2wf1/DASH_720.mp4`;
      }

      // If already absolute, return as is
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      // Convert /media/... to /api/media/... for proper serving
      if (url.startsWith("/media/")) {
        return `/api${url}`;
      }

      // If it's already /api/media/..., return as is
      if (url.startsWith("/api/media/")) {
        return url;
      }

      // For any other relative path, prepend /api/media/
      return `/api/media/${url}`;
    } catch (err) {
      console.error("Error getting video URL:", err);
      setError("Invalid video URL");
      return "";
    }
  }, []);

  // Load saved volume from localStorage
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("videoVolume");
      return savedVolume ? parseFloat(savedVolume) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(volume === 0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const timelineStartXRef = useRef<number>(0);
  const timelineStartTimeRef = useRef<number>(0);
  const timelineWidthRef = useRef<number>(0);

  // Find video asset
  const videoAsset = post.assets.find((a) => a.type === "VIDEO");
  const thumbnailAsset = post.assets.find((a) => a.type === "THUMBNAIL");
  const displayAsset = thumbnailAsset || videoAsset || post.assets[0];

  if (!displayAsset) {
    return null;
  }

  // Function to pause all other videos
  const pauseAllOtherVideos = useCallback(() => {
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      if (video !== videoRef.current && !video.paused) {
        video.pause();
      }
    });
  }, []);

  // Intersection Observer for auto-play - plays video when in view, pauses when out
  useEffect(() => {
    if (!videoAsset) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!videoRef.current) return;

        entries.forEach((entry) => {
          // Track visibility for lazy media loading
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
          // Update this video's visibility ratio in the global map
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            intersectingVideos.set(videoRef.current!, entry.intersectionRatio);
          } else {
            intersectingVideos.delete(videoRef.current!);
          }
        });

        // Find the most visible video from all intersecting videos
        let targetVideo: HTMLVideoElement | null = null;
        let maxRatio = 0;

        for (const [videoElement, ratio] of intersectingVideos) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            targetVideo = videoElement;
          }
        }

        // Debug logging in development
        if (process.env.NODE_ENV === "development") {
          console.log("Video observer:", {
            isIntersecting: entries[0]?.isIntersecting,
            intersectionRatio: entries[0]?.intersectionRatio,
            targetVideoIsThis: targetVideo === videoRef.current,
            currentlyPlaying: currentlyPlayingVideo === videoRef.current,
            isMobile,
          });
        }

        // Play the most visible video, pause all others
        if (targetVideo && targetVideo !== currentlyPlayingVideo) {
          pauseAllOtherVideos();

          // Desktop vs Mobile autoplay strategy
          if (targetVideo === videoRef.current) {
            if (isMobile) {
              // Mobile: Only force mute if user hasn't interacted with volume
              if (!hasUserInteracted && volume === 1) {
                targetVideo.muted = true;
              } else {
                // Respect user's volume setting
                targetVideo.muted = volume === 0;
              }
            } else {
              // Desktop: Try unmuted first, fallback to muted if blocked
              if (!hasUserInteracted) {
                targetVideo.muted = false;
                targetVideo.volume = 0.5; // Start with moderate volume
              } else {
                // Respect user's volume setting
                targetVideo.muted = volume === 0;
                targetVideo.volume = volume;
              }
            }
          }

          // Attempt to play with error handling
          targetVideo.play().catch((error) => {
            console.log(
              `Autoplay ${isMobile ? 'on mobile' : 'with sound'} prevented:`,
              error.name,
            );

            // Log autoplay prevention
            mobileLogger.warn(
              "Autoplay prevented",
              {
                errorName: error.name,
                errorMessage: error.message,
                postId: post.id,
                isMuted: targetVideo.muted,
                volume: targetVideo.volume,
                isMobile,
              },
              "AutoPlayVideo",
            );

            // Fallback strategy for desktop: try muted autoplay
            if (!isMobile && targetVideo === videoRef.current) {
              console.log("Trying muted autoplay fallback for desktop");
              targetVideo.muted = true;
              targetVideo.play().catch((retryError) => {
                console.error("Muted autoplay also failed:", retryError);
                // Show play button overlay as last resort
                setShowPlayButtonOverlay(true);
                setIsPlaying(false);
              });
            } else if (targetVideo === videoRef.current) {
              // Mobile: show play button overlay
              setShowPlayButtonOverlay(true);
              setIsPlaying(false);
            }
          });
          
          currentlyPlayingVideo = targetVideo;

          // Update state for the video that's now playing
          if (targetVideo === videoRef.current) {
            setIsPlaying(true);
            setShowPlayButtonOverlay(false);
          }
        } else if (!targetVideo && currentlyPlayingVideo === videoRef.current) {
          // This video was playing but is no longer the most visible, so it's paused
          if (videoRef.current) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
          currentlyPlayingVideo = null;
        }
      },
      {
        // Better thresholds for desktop: 50% visibility
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "0px",
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [videoAsset, pauseAllOtherVideos, hasUserInteracted, volume, isMobile, post.id]);

  // Update time display
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Apply saved volume to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      const shouldMute = volume === 0;
      setIsMuted(shouldMute);
      video.muted = shouldMute;

      // Force unmute on mobile if user has set volume > 0
      if (!shouldMute) {
        video.muted = false;
      }
    }
  }, [volume]);

  // Add event listeners for play/pause to ensure only one video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      pauseAllOtherVideos();
      currentlyPlayingVideo = video;
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (currentlyPlayingVideo === video) {
        currentlyPlayingVideo = null;
      }
      setIsPlaying(false);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      if (currentlyPlayingVideo === video) {
        currentlyPlayingVideo = null;
      }
    };
  }, [pauseAllOtherVideos]);

  // Global mouse handlers for timeline dragging - can move outside timeline
  useEffect(() => {
    let rafId: number | null = null;
    let lastUpdate = 0;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (
        !isDragging ||
        !videoRef.current ||
        !duration ||
        !timelineWidthRef.current
      )
        return;

      // Use RAF for smooth updates
      const now = performance.now();
      if (now - lastUpdate < 16) return; // Throttle to ~60fps
      lastUpdate = now;

      // Calculate delta from starting position (allows dragging outside timeline)
      const deltaX = e.clientX - timelineStartXRef.current;
      const deltaPercentage = deltaX / timelineWidthRef.current;
      const newTime = Math.max(
        0,
        Math.min(
          duration,
          timelineStartTimeRef.current + deltaPercentage * duration,
        ),
      );

      // Clamp to valid range
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, Math.min(duration, newTime));
        setCurrentTime(Math.max(0, Math.min(duration, newTime)));
      }
    };

    const handleGlobalMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (isDragging && videoRef.current && wasPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, wasPlaying, duration]);

  // Cleanup volume timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  // Handle video error with retry mechanism
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      console.error("Video error:", e);
      const video = e.target as HTMLVideoElement;
      const error = video.error;
      let errorMsg = "Failed to load video";

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = "Video format not supported by your browser";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = "Network error loading video. Check your connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = "Error decoding video. The file may be corrupted.";
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = "Video playback was interrupted";
            break;
        }
        console.error("Video error details:", {
          code: error.code,
          message: error.message,
          retryCount,
        });
      }

      // Auto-retry up to 2 times for network errors
      if (error?.code === MediaError.MEDIA_ERR_NETWORK && retryCount < 2) {
        console.log(`Auto-retrying video load (attempt ${retryCount + 1}/2)`);
        // Clear any existing timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(retryCount + 1);
          if (video) {
            video.load();
          }
          retryTimeoutRef.current = null;
        }, 1000);
        return;
      }

      setError(errorMsg);
      setHasUserInteracted(false);
      setIsPlaying(false);
    },
    [retryCount],
  );

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Format time helper function
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle timeline mouse down for scrubbing
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !duration) return;

    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    
    setIsDragging(true);
    setWasPlaying(isPlaying);
    
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    timelineStartXRef.current = e.clientX;
    timelineStartTimeRef.current = percentage * duration;
    timelineWidthRef.current = rect.width;
  };

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !duration || isDragging) return;

    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle fullscreen toggle
  const handleFullscreen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Handle mute toggle
  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setHasUserInteracted(true);

    if (videoRef.current) {
      if (newMutedState) {
        videoRef.current.muted = true;
        setVolume(0);
        localStorage.setItem("videoVolume", "0");
      } else {
        const newVolume = volume === 0 ? 1 : volume;
        videoRef.current.muted = false;
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        localStorage.setItem("videoVolume", newVolume.toString());
      }
    }
  };

  // Render error state
  if (error) {
    return (
      <div
        className={cn(
          "relative w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4",
          className,
        )}
      >
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-center text-gray-700 dark:text-gray-300 mb-2 font-medium">
          {error}
        </p>
        {retryCount > 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4">
            Retried {retryCount} time{retryCount > 1 ? 's' : ''}
          </p>
        )}
        <button
          onClick={() => {
            setError(null);
            setRetryCount(0);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-full bg-black overflow-hidden",
        className,
      )}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsHideTimerRef.current) {
          clearTimeout(controlsHideTimerRef.current);
        }
        controlsHideTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 2000);
      }}
      onMouseLeave={() => {
        if (controlsHideTimerRef.current) {
          clearTimeout(controlsHideTimerRef.current);
          controlsHideTimerRef.current = null;
        }
        setShowControls(false);
      }}
    >
      {videoAsset ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black cursor-pointer"
            playsInline={isMobile}
            preload="metadata"
            loop
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onError={handleError}
            onClick={(e) => {
              e.stopPropagation();
              // Desktop: Click to toggle play/pause
              if (!isMobile) {
                if (videoRef.current?.paused) {
                  videoRef.current?.play().catch(console.error);
                } else {
                  videoRef.current?.pause();
                }
              } else {
                // Mobile: Open modal
                onVideoPlay(post);
              }
            }}
            disablePictureInPicture
            controlsList="nodownload noremoteplayback"
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {isVisible && (
              <source src={getVideoUrl(videoAsset.url)} type="video/mp4" />
            )}
          </video>

          {!isPlaying && thumbnailAsset?.url && (
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src={thumbnailAsset.url}
                alt={post.title}
                className="w-full h-full object-contain bg-black"
              />
            </div>
          )}

          {(!isPlaying || showPlayButtonOverlay) && (
            <div 
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowPlayButtonOverlay(false);
                setHasUserInteracted(true);
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.play().catch((err) => {
                    console.error("Manual play failed:", err);
                    // Try muted as fallback
                    if (videoRef.current) {
                      videoRef.current.muted = true;
                      videoRef.current.play().catch(console.error);
                    }
                  });
                }
              }}
            >
              <div className="w-20 h-20 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all">
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
      ) : displayAsset?.url ? (
        <img
          src={displayAsset.url}
          alt={post.title}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {/* Video Controls - only for actual videos */}
      {videoAsset && showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) {
                  videoRef.current?.pause();
                } else {
                  videoRef.current?.play();
                }
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Timeline/Progress Bar */}
            <div
              className="flex-1 h-1.5 bg-white/30 rounded-full relative group/timeline cursor-pointer"
              onMouseDown={handleTimelineMouseDown}
              onClick={handleTimelineClick}
            >
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  transition: isDragging ? "none" : "width 0.1s",
                }}
              />
              <div
                className="absolute top-1/2 left-0 w-3 h-3 -mt-1.5 bg-white rounded-full shadow-lg group-hover/timeline:opacity-100 transition-opacity"
                style={{
                  left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)`,
                  opacity: isDragging ? 1 : 0,
                }}
              />
            </div>

            {/* 3. Time Display */}
            <div className="text-white text-xs font-mono whitespace-nowrap min-w-[60px] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* 4. Closed Captions */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors ${showCaptions ? "bg-white/20" : ""}`}
            >
              <ClosedCaption className="w-5 h-5" />
            </button>

            {/* 5. Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors ${showSettings ? "bg-white/20" : ""}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Menu */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-black/95 rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-white text-sm font-medium border-b border-white/10">
                      Quality
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuality("480p");
                        setShowSettings(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors ${selectedQuality === "480p" ? "bg-white/10" : ""}`}
                    >
                      480p {selectedQuality === "480p" && "✓"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuality("720p");
                        setShowSettings(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors ${selectedQuality === "720p" ? "bg-white/10" : ""}`}
                    >
                      720p {selectedQuality === "720p" && "✓"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuality("1080p");
                        setShowSettings(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors ${selectedQuality === "1080p" ? "bg-white/10" : ""}`}
                    >
                      1080p {selectedQuality === "1080p" && "✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Full Screen - Window contained */}
            <button
              onClick={handleFullscreen}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>

            {/* 7. Volume Control with Vertical Slider */}
            <div className="relative">
              <button
                onClick={handleToggleMute}
                onMouseEnter={() => {
                  setShowVolumeSlider(true);
                  if (volumeTimeoutRef.current) {
                    clearTimeout(volumeTimeoutRef.current);
                    volumeTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  if (volumeTimeoutRef.current) {
                    clearTimeout(volumeTimeoutRef.current);
                  }
                  volumeTimeoutRef.current = setTimeout(
                    () => setShowVolumeSlider(false),
                    300,
                  );
                }}
                className="flex items-center justify-center"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {showVolumeSlider && (
                <div
                  ref={volumeSliderRef}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-8 h-24 bg-black bg-opacity-70 rounded-md p-1.5"
                  onMouseEnter={() => {
                    if (volumeTimeoutRef.current) {
                      clearTimeout(volumeTimeoutRef.current);
                      volumeTimeoutRef.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    volumeTimeoutRef.current = setTimeout(
                      () => setShowVolumeSlider(false),
                      300,
                    );
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!volumeSliderRef.current) return;

                    const rect =
                      volumeSliderRef.current.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const percentage = Math.max(
                      0,
                      Math.min(1, 1 - y / rect.height),
                    );
                    const newVolume = percentage;

                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                    }
                    localStorage.setItem("videoVolume", newVolume.toString());

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      if (!volumeSliderRef.current) return;

                      const rect =
                        volumeSliderRef.current.getBoundingClientRect();
                      const y = moveEvent.clientY - rect.top;
                      const percentage = Math.max(
                        0,
                        Math.min(1, 1 - y / rect.height),
                      );
                      const newVolume = percentage;

                      setVolume(newVolume);
                      setIsMuted(newVolume === 0);
                      if (videoRef.current) {
                        videoRef.current.volume = newVolume;
                      }
                      localStorage.setItem("videoVolume", newVolume.toString());
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove,
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!volumeSliderRef.current) return;

                    const rect =
                      volumeSliderRef.current.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const percentage = Math.max(
                      0,
                      Math.min(1, 1 - y / rect.height),
                    );
                    const newVolume = percentage;

                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                    }
                    localStorage.setItem("videoVolume", newVolume.toString());
                  }}
                >
                  {/* Visual track and indicator */}
                  <div className="relative w-1 h-full">
                    {/* Background track */}
                    <div className="w-1 h-full bg-white/20 rounded-full"></div>

                    {/* Orange fill */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-full"
                      style={{
                        height: isMuted ? "0%" : `${volume * 100}%`,
                        transition: "none",
                      }}
                    />

                    {/* Round pointer - perfectly centered */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-orange-500 -mt-1.5"
                      style={{
                        bottom: isMuted ? "0%" : `${volume * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-white text-xs text-center font-mono min-w-[30px]">
                    {isMuted ? 0 : Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duration badge - Positioned above controls */}
      {videoAsset?.durationSec && !showControls && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded z-30">
          {videoAsset.durationSec > 0
            ? `${Math.floor(videoAsset.durationSec / 60)}:${String(Math.floor(videoAsset.durationSec % 60)).padStart(2, "0")}`
            : "Video"}
        </div>
      )}

      {/* NSFW badge */}
      {post.nsfw && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded z-30">
          NSFW
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .video-player input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }

        .video-player input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .video-player input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
