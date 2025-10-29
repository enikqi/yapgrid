'use client'

import { ArrowLeft, Heart, Users, Zap, Shield, Globe, Award } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'

export default function AboutPage() {
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <SimpleLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            About YapGrid
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            YapGrid is a modern social media platform that brings together the best content from Reddit communities, enhanced with AI-powered personalization and a beautiful user experience.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="text-center mb-8">
            <Heart className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Our Mission
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed text-center">
            We believe that great content deserves to be discovered and shared. YapGrid uses advanced AI technology to curate and personalize content from Reddit communities, making it easier for users to find posts that truly resonate with their interests and preferences.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI-Powered Recommendations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Our advanced algorithm learns from your interactions to show you content you'll love.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Community Focused
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Discover trending communities and connect with like-minded people.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Privacy First
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your data is protected with industry-leading security and privacy measures.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-white mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">YapGrid by the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-orange-100">Active Communities</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">1000+</div>
              <div className="text-orange-100">Posts Processed Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-orange-100">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-orange-100">Auto-Publishing</div>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="text-center mb-6">
            <Globe className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Built with Modern Technology
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Next.js 15 with React 18</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Backend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Node.js with Express</li>
                <li>• Prisma ORM with SQLite</li>
                <li>• NextAuth.js for authentication</li>
                <li>• AI-powered content optimization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-6">
            <Award className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Our Team
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            YapGrid is built by a passionate team of developers, designers, and AI researchers who believe in the power of community-driven content.
          </p>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              We're always looking for talented individuals to join our mission.
            </p>
            <Link 
              href="/contact" 
              className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-medium"
            >
              Join our team →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
