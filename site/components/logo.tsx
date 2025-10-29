import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export function Logo({ size = 'md', animated = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className} hover:opacity-80 transition-opacity`}>
      {/* Animated Logo Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse"></div>
        
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
          {/* Grid pattern representing "Grid" */}
          <div className="relative w-full h-full">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
                <div className="bg-orange-500 rounded-sm"></div>
                <div className="bg-red-500 rounded-sm"></div>
                <div className="bg-pink-500 rounded-sm"></div>
                <div className="bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            
            {/* Central "Y" */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-bold text-orange-600 dark:text-orange-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
                Y
              </span>
            </div>
            
            {/* Animated particles */}
            {animated && (
              <>
                <div className="absolute top-1 left-1 w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2s' }}></div>
              </>
            )}
          </div>
        </div>
        
        {/* Rotating ring */}
        {animated && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-spin" style={{ animationDuration: '3s' }}></div>
        )}
      </div>
      
      {/* Logo Text */}
      <h1 className={`font-bold text-orange-500 ${textSizes[size]}`}>
        YapGrid
      </h1>
    </Link>
  )
}

// Alternative simpler logo
export function SimpleLogo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className} hover:opacity-80 transition-opacity`}>
      {/* Simple animated logo */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Background circle with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-lg"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="w-3/4 h-3/4 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="bg-orange-500 rounded-sm animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="bg-red-500 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="bg-pink-500 rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="bg-orange-500 rounded-sm animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
        
        {/* Central Y */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-orange-600 dark:text-orange-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
            Y
          </span>
        </div>
      </div>
      
      {/* Logo Text */}
      <h1 className={`font-bold text-orange-500 ${textSizes[size]}`}>
        YapGrid
      </h1>
    </Link>
  )
}

// Reddit-style logo with more animation
export function RedditStyleLogo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className} hover:opacity-80 transition-opacity`}>
      {/* Reddit-style logo */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse"></div>
        
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
          {/* Grid pattern */}
          <div className="w-full h-full p-1">
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
              <div className="bg-orange-500 rounded-sm animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.5s' }}></div>
              <div className="bg-red-500 rounded-sm animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
              <div className="bg-pink-500 rounded-sm animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}></div>
              <div className="bg-orange-500 rounded-sm animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          {/* Central Y */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-orange-600 dark:text-orange-400 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
              Y
            </span>
          </div>
        </div>
        
        {/* Rotating border */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-spin" style={{ animationDuration: '4s' }}></div>
      </div>
      
      {/* Logo Text */}
      <h1 className={`font-bold text-orange-500 ${textSizes[size]}`}>
        YapGrid
      </h1>
    </Link>
  )
}
