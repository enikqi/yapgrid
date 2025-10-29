import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function formatNumber(num: number): string {
  // Round to nearest integer for clean display
  const roundedNum = Math.round(num)
  
  if (roundedNum >= 1000000) {
    return `${(roundedNum / 1000000).toFixed(1)}M`
  }
  if (roundedNum >= 1000) {
    return `${(roundedNum / 1000).toFixed(1)}K`
  }
  return roundedNum.toString()
}

export function getRedditVideoId(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/[^\/]+\/comments\/([^\/]+)/)
  return match ? match[1] : null
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 255)
}

export function generateVideoFileName(postId: string, extension = 'mp4'): string {
  const timestamp = Date.now()
  return `${postId}_${timestamp}.${extension}`
}

export function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export function isValidAspectRatioForPinterest(width: number, height: number): boolean {
  const ratio = width / height
  
  // Pinterest recommended aspect ratios
  const validRatios = [
    1,        // 1:1 (square)
    2/3,      // 2:3 (portrait)
    9/16,     // 9:16 (tall)
    0.8,      // 4:5
  ]
  
  // Allow some tolerance
  const tolerance = 0.05
  return validRatios.some(validRatio => 
    Math.abs(ratio - validRatio) <= tolerance
  )
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Parse Reddit URL patterns
export function parseRedditUrl(url: string): { subreddit?: string; postId?: string } | null {
  const patterns = [
    /reddit\.com\/r\/(\w+)\/comments\/(\w+)/,
    /redd\.it\/(\w+)/,
    /reddit\.com\/(\w+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      if (pattern === patterns[0]) {
        return { subreddit: match[1], postId: match[2] }
      } else {
        return { postId: match[1] }
      }
    }
  }

  return null
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Deep merge objects
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target }
  
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object && key in target) {
      output[key as keyof T] = deepMerge(target[key as keyof T], source[key])
    } else {
      output[key as keyof T] = source[key] as T[keyof T]
    }
  })
  
  return output
}
