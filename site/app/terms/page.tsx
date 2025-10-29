'use client'

import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/logo'

export default function TermsPage() {
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
            <FileText className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: January 2024
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using YapGrid, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of YapGrid per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained on YapGrid</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>

            <h2>4. Content Policy</h2>
            <p>
              You are responsible for the content you post on YapGrid. You agree not to post content that:
            </p>
            <ul>
              <li>is illegal, harmful, or violates any laws</li>
              <li>infringes on intellectual property rights</li>
              <li>contains spam or unsolicited promotional content</li>
              <li>harasses, abuses, or harms others</li>
              <li>contains malware or malicious code</li>
            </ul>

            <h2>5. Privacy Policy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
            </p>

            <h2>6. Prohibited Uses</h2>
            <p>
              You may not use our service:
            </p>
            <ul>
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>

            <h2>7. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2>8. Disclaimer</h2>
            <p>
              The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company:
            </p>
            <ul>
              <li>excludes all representations and warranties relating to this website and its contents</li>
              <li>excludes all liability for damages arising out of or in connection with your use of this website</li>
            </ul>

            <h2>9. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the State of California and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have any questions about these Terms of Service, please contact us at legal@yapgrid.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
