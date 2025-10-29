// Simple console logger to avoid worker thread issues
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '')
  },
}

// Create child loggers for specific modules
export const createLogger = (module: string) => {
  return {
    debug: (message: string, data?: any) => logger.debug(`[${module}] ${message}`, data),
    info: (message: string, data?: any) => logger.info(`[${module}] ${message}`, data),
    warn: (message: string, data?: any) => logger.warn(`[${module}] ${message}`, data),
    error: (message: string, data?: any) => logger.error(`[${module}] ${message}`, data),
  }
}
