'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { OptimizedImage } from './optimized-image'
import type { Asset } from '@/lib/types'

interface GalleryCarouselProps {
  images: Asset[]
  title: string
}

export function GalleryCarousel({ images, title }: GalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  if (images.length === 0) return null

  return (
    <div className="relative w-full h-full bg-black group">
      {/* Current Image */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={images[currentIndex].url}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation()
            // Transform URL to use /api/media/ for proper serving
            let imageUrl = images[currentIndex].url
            if (imageUrl.startsWith('/media/')) {
              imageUrl = `/api${imageUrl}`
            }
            // Open image in new tab
            window.open(imageUrl, '_blank')
          }}
          loading="lazy"
        />
      </div>

      {/* Navigation Buttons - Show only if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Image Counter Badge */}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

