'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Image, Link as LinkIcon, FileText, Video, Upload, X, Search, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function CreatePostPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [postType, setPostType] = useState<'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO'>('TEXT')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    subreddit: '',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [communities, setCommunities] = useState<Array<{name: string, postsCount: number, type: string}>>([])
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false)
  const [communitySearch, setCommunitySearch] = useState('')
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false)

  // Set post type based on URL parameters
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'image') {
      setPostType('IMAGE')
    } else if (type === 'video') {
      setPostType('VIDEO')
    }
  }, [searchParams])

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch('/api/communities')
        const data = await response.json()
        if (data.success) {
          setCommunities(data.data.communities)
        }
      } catch (error) {
        console.error('Failed to fetch communities:', error)
      }
    }
    fetchCommunities()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.community-dropdown')) {
        setShowCommunityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Sign in required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be signed in to create posts.
          </p>
          <Link
            href="/auth/signin"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.title.trim()) {
      toast.error('Title is required')
      setIsLoading(false)
      return
    }

    if (!formData.subreddit.trim()) {
      toast.error('Subreddit is required')
      setIsLoading(false)
      return
    }

    if (postType === 'LINK' && !formData.url.trim()) {
      toast.error('URL is required for link posts')
      setIsLoading(false)
      return
    }

    if ((postType === 'IMAGE' || postType === 'VIDEO') && !uploadedFile) {
      toast.error('Please upload a file for image/video posts')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          url: formData.url,
          subreddit: formData.subreddit,
          type: postType,
          fileUrl: filePreview,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Post created successfully!')
        // Force refresh and redirect to the community page
        console.log('Post created successfully, redirecting to:', `/r/${formData.subreddit}`)
        setTimeout(() => {
          window.location.href = `/r/${formData.subreddit}`
        }, 1000)
      } else {
        toast.error(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Create post error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUploadedFile(file)
        setFilePreview(data.url)
        toast.success('File uploaded successfully!')
        
        // Force refresh and redirect to the community page after upload
        console.log('File uploaded successfully, checking redirect...')
        setTimeout(() => {
          if (formData.subreddit) {
            console.log('Redirecting to community:', `/r/${formData.subreddit}`)
            window.location.href = `/r/${formData.subreddit}`
          } else {
            console.log('No community selected, reloading page...')
            window.location.reload()
          }
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg']
    
    if (postType === 'IMAGE' && !allowedImageTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)')
      return
    }
    
    if (postType === 'VIDEO' && !allowedVideoTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, WebM, OGG)')
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    handleFileUpload(file)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePostTypeChange = (type: 'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO') => {
    setPostType(type)
    // Clear uploaded file when changing post type
    if (uploadedFile) {
      removeFile()
    }
  }

  const handleCommunitySelect = (communityName: string) => {
    setFormData({ ...formData, subreddit: communityName })
    setShowCommunityDropdown(false)
    setCommunitySearch('')
  }

  const handleCreateCommunity = async () => {
    if (!communitySearch.trim()) {
      toast.error('Please enter a community name')
      return
    }

    setIsCreatingCommunity(true)
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: communitySearch.trim(),
          description: ''
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Community created! You can now post to it.')
        setFormData({ ...formData, subreddit: communitySearch.trim().toLowerCase() })
        setShowCommunityDropdown(false)
        setCommunitySearch('')
        // Force refresh to get updated communities list
        console.log('Community created successfully, reloading page...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(data.error || 'Failed to create community')
      }
    } catch (error) {
      console.error('Create community error:', error)
      toast.error('Failed to create community')
    } finally {
      setIsCreatingCommunity(false)
    }
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(communitySearch.toLowerCase())
  )

  const postTypes = [
    { type: 'TEXT' as const, icon: FileText, label: 'Text', description: 'Share your thoughts' },
    { type: 'LINK' as const, icon: LinkIcon, label: 'Link', description: 'Share a link' },
    { type: 'IMAGE' as const, icon: Image, label: 'Image', description: 'Share an image' },
    { type: 'VIDEO' as const, icon: Video, label: 'Video', description: 'Share a video' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Create Post</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4">Choose a post type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {postTypes.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handlePostTypeChange(type)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    postType === type
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    postType === type ? 'text-orange-500' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Post Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              {/* Subreddit */}
              <div>
                <label htmlFor="subreddit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Community
                </label>
                <div className="relative community-dropdown">
                  <div className="flex">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">r/</span>
                    <input
                      id="subreddit"
                      name="subreddit"
                      type="text"
                      required
                      value={formData.subreddit}
                      onChange={(e) => {
                        setFormData({ ...formData, subreddit: e.target.value })
                        setCommunitySearch(e.target.value)
                        setShowCommunityDropdown(true)
                      }}
                      onFocus={() => setShowCommunityDropdown(true)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Enter community name"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                      className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Community Dropdown */}
                  {showCommunityDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {/* Search input */}
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <input
                          type="text"
                          value={communitySearch}
                          onChange={(e) => setCommunitySearch(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Search communities..."
                        />
                      </div>
                      
                      {/* Communities list */}
                      <div className="py-1">
                        {filteredCommunities.length > 0 ? (
                          filteredCommunities.map((community) => (
                            <button
                              key={community.name}
                              type="button"
                              onClick={() => handleCommunitySelect(community.name)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">r/{community.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {community.postsCount} posts • {community.type}
                                </div>
                              </div>
                              {formData.subreddit === community.name && (
                                <Check className="w-4 h-4 text-orange-500" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No communities found
                          </div>
                        )}
                      </div>
                      
                      {/* Create new community */}
                      {communitySearch.trim() && !communities.some(c => c.name === communitySearch.trim().toLowerCase()) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                          <button
                            type="button"
                            onClick={handleCreateCommunity}
                            disabled={isCreatingCommunity}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            {isCreatingCommunity ? 'Creating...' : `Create r/${communitySearch.trim()}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="An interesting title"
                />
              </div>

              {/* URL (for link posts) */}
              {postType === 'LINK' && (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {/* File Upload (for image/video posts) */}
              {(postType === 'IMAGE' || postType === 'VIDEO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload {postType === 'IMAGE' ? 'Image' : 'Video'}
                  </label>
                  
                  {!uploadedFile ? (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={postType === 'IMAGE' ? 'image/*' : 'video/*'}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex flex-col items-center justify-center w-full py-8"
                      >
                        <Upload className={`w-12 h-12 mb-4 ${isUploading ? 'text-gray-400' : 'text-gray-400'}`} />
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {isUploading ? 'Uploading...' : `Click to upload ${postType === 'IMAGE' ? 'image' : 'video'}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {postType === 'IMAGE' 
                            ? 'PNG, JPG, GIF, WebP up to 10MB'
                            : 'MP4, WebM, OGG up to 10MB'
                          }
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      {postType === 'IMAGE' ? (
                        <div className="relative">
                          <img
                            src={filePreview || ''}
                            alt="Preview"
                            className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <video
                            src={filePreview || ''}
                            controls
                            className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {postType === 'TEXT' ? 'Text (optional)' : 'Description (optional)'}
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder={
                    postType === 'TEXT' 
                      ? 'Share your thoughts...'
                      : 'Add a description...'
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
