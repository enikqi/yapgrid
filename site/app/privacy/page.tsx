'use client'

import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'

export default function PrivacyPage() {
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
            <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: January 2024
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </p>
            
            <h3>Personal Information</h3>
            <ul>
              <li>Email address and username</li>
              <li>Profile information (name, bio, profile picture)</li>
              <li>Content you post, comments, and interactions</li>
              <li>Communication preferences</li>
            </ul>

            <h3>Usage Information</h3>
            <ul>
              <li>Posts you view, vote on, and interact with</li>
              <li>Communities you join and follow</li>
              <li>Search queries and browsing patterns</li>
              <li>Device information and IP address</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience and recommendations</li>
              <li>Communicate with you about our services</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in our operations</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers and infrastructure</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of certain data processing activities</li>
              <li>Withdraw consent for data processing</li>
            </ul>

            <h2>6. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
            </p>

            <h2>7. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete your personal information within 30 days.
            </p>

            <h2>9. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have any questions about this Privacy Policy, please contact us at privacy@yapgrid.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
