'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  imageUrl: string
  title: string
  onClose: () => void
}

export function ImageModal({ isOpen, imageUrl, title, onClose }: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Download button */}
      <a
        href={imageUrl}
        download={`${title.substring(0, 50).replace(/[^a-z0-9]/gi, '-')}.jpg`}
        className="absolute top-4 left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
        onClick={(e) => e.stopPropagation()}
        aria-label="Download image"
      >
        <Download className="w-6 h-6" />
      </a>
      
      {/* Image */}
      <img
        src={imageUrl}
        alt={title}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Title */}
      {title && (
        <div className="absolute bottom-4 left-4 right-4 text-white text-center">
          <p id="image-modal-title" className="text-sm font-medium">{title}</p>
        </div>
      )}
    </div>
  )
}
