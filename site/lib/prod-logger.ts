/**
 * Production-safe logger
 * Only logs in development mode, except for errors which always log
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isClient = typeof window !== 'undefined'

export const prodLog = {
  /**
   * Debug logs - only in development
   */
  debug: (...args: any[]) => {
    if (isDevelopment && isClient) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info logs - only in development  
   */
  log: (...args: any[]) => {
    if (isDevelopment && isClient) {
      console.log(...args)
    }
  },

  /**
   * Info logs - only in development
   */
  info: (...args: any[]) => {
    if (isDevelopment && isClient) {
      console.info(...args)
    }
  },

  /**
   * Warning logs - only in development
   */
  warn: (...args: any[]) => {
    if (isDevelopment && isClient) {
      console.warn(...args)
    }
  },

  /**
   * Error logs - ALWAYS log (even in production)
   */
  error: (...args: any[]) => {
    console.error(...args)
  },
}

// No-op logger for production (fully disabled)
export const noLog = {
  debug: (..._args: any[]) => {},
  log: (..._args: any[]) => {},
  info: (..._args: any[]) => {},
  warn: (..._args: any[]) => {},
  error: (...args: any[]) => console.error(...args), // Errors always
}

