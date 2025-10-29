import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLogger } from '@/lib/logger'
import { exec } from 'child_process'
import { promisify } from 'util'

const logger = createLogger('api/admin/cron')
const execAsync = promisify(exec)

// GET /api/admin/cron - Get cron job status
export async function GET() {
  try {
    // Check if background scheduler is running
    let schedulerStatus = 'stopped'
    let schedulerPid = null
    
    try {
      // Use wmic to get more detailed process information
      const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine')
      const lines = stdout.split('\n').filter(line => line.includes('background-scheduler'))
      
      if (lines.length > 0) {
        schedulerStatus = 'running'
        // Get the first PID found
        const pidMatch = lines[0].match(/\s+(\d+)\s+/)
        if (pidMatch) {
          schedulerPid = pidMatch[1]
        }
      }
    } catch (error) {
      logger.warn('Could not check scheduler status:', error)
    }

    // Get cron job settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'auto_ingest_enabled',
            'auto_processing_enabled',
            'auto_posting_enabled',
            'cleanup_enabled'
          ]
        }
      }
    })

    const settingsMap = new Map(settings.map(s => [s.key, s.value === 'true']))

    return NextResponse.json({
      success: true,
      data: {
        scheduler: {
          status: schedulerStatus,
          pid: schedulerPid
        },
        cronJobs: {
          autoIngest: settingsMap.get('auto_ingest_enabled') || false,
          autoProcessing: settingsMap.get('auto_processing_enabled') || false,
          autoPosting: settingsMap.get('auto_posting_enabled') || false,
          cleanup: settingsMap.get('cleanup_enabled') || false
        }
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to get cron status')
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get cron status' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/cron - Control cron jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, jobType } = body

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 })
    }

    let result = { success: true, message: '' }

    switch (action) {
      case 'start_scheduler':
        try {
          // Start background scheduler
          const { spawn } = require('child_process')
          const scheduler = spawn('node', ['background-scheduler.js'], {
            detached: true,
            stdio: 'ignore'
          })
          scheduler.unref()
          
          result.message = 'Background scheduler started successfully'
          logger.info('Background scheduler started')
        } catch (error) {
          result.success = false
          result.message = 'Failed to start scheduler'
          logger.error('Failed to start scheduler:', error)
        }
        break

      case 'stop_scheduler':
        try {
          // First get the PID of background-scheduler processes
          const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine')
          const lines = stdout.split('\n').filter(line => line.includes('background-scheduler'))
          
          if (lines.length > 0) {
            // Extract PIDs and kill them
            for (const line of lines) {
              const pidMatch = line.match(/\s+(\d+)\s+/)
              if (pidMatch) {
                const pid = pidMatch[1]
                try {
                  await execAsync(`taskkill /F /PID ${pid}`)
                  logger.info(`Killed background-scheduler process with PID ${pid}`)
                } catch (killError) {
                  logger.warn(`Failed to kill process ${pid}:`, killError)
                }
              }
            }
            result.message = 'Background scheduler stopped successfully'
          } else {
            result.message = 'Background scheduler was not running'
          }
          logger.info('Background scheduler stopped')
        } catch (error) {
          result.message = 'Background scheduler stopped (was not running)'
          logger.info('Background scheduler stop attempted (process not found)')
        }
        break

      case 'restart_scheduler':
        try {
          // Stop first - get PIDs and kill them
          const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine')
          const lines = stdout.split('\n').filter(line => line.includes('background-scheduler'))
          
          for (const line of lines) {
            const pidMatch = line.match(/\s+(\d+)\s+/)
            if (pidMatch) {
              const pid = pidMatch[1]
              try {
                await execAsync(`taskkill /F /PID ${pid}`)
                logger.info(`Killed background-scheduler process with PID ${pid}`)
              } catch (killError) {
                logger.warn(`Failed to kill process ${pid}:`, killError)
              }
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          
          // Start again
          const { spawn } = require('child_process')
          const scheduler = spawn('node', ['background-scheduler.js'], {
            detached: true,
            stdio: 'ignore'
          })
          scheduler.unref()
          
          result.message = 'Background scheduler restarted successfully'
          logger.info('Background scheduler restarted')
        } catch (error) {
          result.success = false
          result.message = 'Failed to restart scheduler'
          logger.error('Failed to restart scheduler:', error)
        }
        break

      case 'toggle_job':
        const settingKey = `${jobType}_enabled`
        const currentValue = await prisma.setting.findUnique({
          where: { key: settingKey }
        })
        
        const newValue = !(currentValue?.value === 'true')
        
        await prisma.setting.upsert({
          where: { key: settingKey },
          update: { value: newValue.toString() },
          create: { key: settingKey, value: newValue.toString() }
        })
        
        result.message = `${jobType} ${newValue ? 'enabled' : 'disabled'} successfully`
        logger.info({ jobType, enabled: newValue }, 'Job toggled')
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      data: {
        action,
        jobType,
        message: result.message
      }
    })

  } catch (error) {
    logger.error({ error }, 'Failed to control cron jobs')
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to control cron jobs' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
