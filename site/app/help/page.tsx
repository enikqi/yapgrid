'use client'

import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, Clock } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <SimpleLogo size="md" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <HelpCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Help Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find answers to your questions about YapGrid
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Getting Started */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Getting Started
              </h2>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    How do I create an account?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click "Sign In" in the top right corner and use the Test User button for development, or sign in with Google.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    How do I create a post?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the "Create Post" button in the sidebar to share text, images, videos, or links with the community.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    How do I vote on posts?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the upvote (↑) or downvote (↓) buttons next to any post or comment to express your opinion.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Features
              </h2>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Personalized Feed
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    YapGrid learns from your interactions to show you content you'll love. Vote, comment, and save posts to improve recommendations.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Communities
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discover trending communities and join discussions on topics that interest you.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Media Support
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload and share images and videos directly on YapGrid. Auto-play videos and fullscreen support included.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              Still need help?
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Email Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">support@yapgrid.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Phone Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Response Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}