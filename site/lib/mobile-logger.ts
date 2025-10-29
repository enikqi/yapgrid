/**
 * Mobile Debug Logger
 * Sends logs to server for debugging mobile issues
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  level: LogLevel
  message: string
  data?: Record<string, unknown>
  component?: string
  userAgent?: string
  timestamp?: string
}

class MobileLogger {
  private queue: LogData[] = []
  private isFlushingQueue = false
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Auto-flush queue every 5 seconds
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flush()
      }, 5000)

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  private isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  private async sendLog(logData: LogData) {
    try {
      await fetch('/api/debug/mobile-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logData,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      // Silently fail - don't want to break the app
      console.error('Failed to send mobile log:', error)
    }
  }

  private async flush() {
    if (this.isFlushingQueue || this.queue.length === 0) return

    this.isFlushingQueue = true
    const logsToSend = [...this.queue]
    this.queue = []

    try {
      await fetch('/api/debug/mobile-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          message: 'Batch logs',
          data: { logs: logsToSend },
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      // Re-add logs to queue if failed
      this.queue.unshift(...logsToSend)
      console.error('Failed to flush mobile logs:', error)
    } finally {
      this.isFlushingQueue = false
    }
  }

  log(level: LogLevel, message: string, data?: Record<string, unknown>, component?: string) {
    // Only log from mobile devices
    if (!this.isMobile()) {
      return
    }

    const logData: LogData = {
      level,
      message,
      data,
      component,
    }

    // Add to queue
    this.queue.push(logData)

    // If error, send immediately
    if (level === 'error') {
      this.sendLog(logData)
    }

    // Also log to console
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleMethod(`[Mobile ${level.toUpperCase()}] ${component ? `[${component}] ` : ''}${message}`, data || '')
  }

  info(message: string, data?: Record<string, unknown>, component?: string) {
    this.log('info', message, data, component)
  }

  warn(message: string, data?: Record<string, unknown>, component?: string) {
    this.log('warn', message, data, component)
  }

  error(message: string, data?: Record<string, unknown>, component?: string) {
    this.log('error', message, data, component)
  }

  debug(message: string, data?: Record<string, unknown>, component?: string) {
    this.log('debug', message, data, component)
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// Export singleton instance
export const mobileLogger = new MobileLogger()
