'use client'

import { ArrowLeft, Crown, Star, Zap, Shield, Sparkles, Check } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'

export default function PremiumPage() {
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Crown className="w-20 h-20 text-orange-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            YapGrid Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Unlock the full potential of YapGrid with premium features, enhanced experience, and exclusive benefits.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">$0</div>
              <p className="text-gray-600 dark:text-gray-400">Forever free</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Basic post creation</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Community access</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Basic recommendations</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Standard support</span>
              </li>
            </ul>
            <button className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Premium</h3>
              <div className="text-4xl font-bold text-orange-500 mb-2">$9.99</div>
              <p className="text-gray-600 dark:text-gray-400">per month</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Everything in Free</span>
              </li>
              <li className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Advanced AI recommendations</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Priority post processing</span>
              </li>
              <li className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">Ad-free experience</span>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span className="text-gray-700 dark:text-gray-300">Exclusive communities</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </li>
            </ul>
            <button className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Upgrade to Premium
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pro</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">$29.99</div>
              <p className="text-gray-600 dark:text-gray-400">per month</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Everything in Premium</span>
              </li>
              <li className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Custom AI training</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Instant post publishing</span>
              </li>
              <li className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">Advanced analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span className="text-gray-700 dark:text-gray-300">White-label options</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Dedicated support</span>
              </li>
            </ul>
            <button className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-orange-500">Premium</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Post Creation</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI Recommendations</td>
                  <td className="py-3 px-4 text-center">Basic</td>
                  <td className="py-3 px-4 text-center">Advanced</td>
                  <td className="py-3 px-4 text-center">Custom</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Ad-Free Experience</td>
                  <td className="py-3 px-4 text-center">✗</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Priority Support</td>
                  <td className="py-3 px-4 text-center">✗</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">Dedicated</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Analytics</td>
                  <td className="py-3 px-4 text-center">Basic</td>
                  <td className="py-3 px-4 text-center">Standard</td>
                  <td className="py-3 px-4 text-center">Advanced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
