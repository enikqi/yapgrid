'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Users, Hash, Eye, EyeOff, Lock, Globe, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public', // public, restricted, private
    nsfw: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.email) {
      toast.error('Please sign in to create a community')
      router.push('/auth/signin')
      return
    }

    try {
      setIsLoading(true)
      
      // Validate community name
      if (!formData.name || formData.name.length < 3) {
        toast.error('Community name must be at least 3 characters long')
        return
      }

      // Check if community name is valid (alphanumeric and underscores only)
      const nameRegex = /^[a-zA-Z0-9_]+$/
      if (!nameRegex.test(formData.name)) {
        toast.error('Community name can only contain letters, numbers, and underscores')
        return
      }

      // TODO: Implement API call to create community
      // For now, just show success message
      toast.success(`Community "${formData.name}" created successfully!`)
      
      // Redirect to the new community
      router.push(`/communities/${formData.name}`)
      
    } catch (error) {
      console.error('Error creating community:', error)
      toast.error('Failed to create community. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to YapGrid
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Sign in required
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You need to be signed in to create a community.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to YapGrid
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create a Community
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new community where people can share and discuss topics they're passionate about.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Community Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter community name"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Community names must be 3-21 characters, and can only contain letters, numbers, and underscores.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your community..."
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A brief description of your community (optional).
              </p>
            </div>

            {/* Community Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Community Type
              </label>
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="radio"
                    id="public"
                    name="type"
                    value="public"
                    checked={formData.type === 'public'}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <label htmlFor="public" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Anyone can view, post, and comment
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="radio"
                    id="restricted"
                    name="type"
                    value="restricted"
                    checked={formData.type === 'restricted'}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <label htmlFor="restricted" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Restricted
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Anyone can view, but only approved users can post
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="radio"
                    id="private"
                    name="type"
                    value="private"
                    checked={formData.type === 'private'}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <label htmlFor="private" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Private
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Only approved users can view and post
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="nsfw" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adult Content
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mark this community as NSFW (18+)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, nsfw: !prev.nsfw }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  formData.nsfw ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.nsfw ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Community Guidelines
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Be respectful and follow YapGrid's community guidelines</li>
                  <li>You'll be the moderator of your community</li>
                  <li>Community names cannot be changed after creation</li>
                  <li>You can always update settings and description later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
