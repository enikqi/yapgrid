'use client'

import { useState } from 'react'
import { Upload, File, Video, Image, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedFile {
  name: string
  originalName: string
  size: number
  type: string
  url: string
  path: string
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        
        if (result.success) {
          setUploadedFiles(prev => [...prev, result.file])
        } else {
          console.error('Upload failed:', result.message)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
    
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-blue-500" />
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Upload Media Files
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload videos and images from your desktop to the server
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-orange-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Supports videos (MP4, WebM, AVI, MOV) and images (JPG, PNG, GIF, WebP)
            <br />
            All files will be stored in /media/ directory
          </p>
          
          <input
            type="file"
            multiple
            accept="video/*,image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Choose Files
          </label>
        </div>

        {/* Upload Status */}
        {uploading && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-blue-700 dark:text-blue-300">Uploading files...</span>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start gap-3">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.type}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(file.url)}
                      className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Instructions
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• Drag and drop files from your desktop (C:\Users\Admin\Desktop\pin_reddit\media) to the upload area above</p>
            <p>• Or click "Choose Files" to select files from your computer</p>
            <p>• All files will be stored in /media/ directory</p>
            <p>• Files are automatically renamed with timestamps to avoid conflicts</p>
            <p>• You can copy the file URLs to use them in your posts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
