import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // All files go to media directory
    const uploadDir = 'media'

    // Ensure directory exists
    const uploadPath = join(process.cwd(), uploadDir)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Keep original filename without adding timestamp prefix
    const filename = file.name
    const filepath = join(uploadPath, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Return file info
    const fileUrl = `/${uploadDir}/${filename}`
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        path: filepath
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 }
    )
  }
}
