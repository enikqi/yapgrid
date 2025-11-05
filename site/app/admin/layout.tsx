import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  const isAdmin = (session.user as any)?.isAdmin || false

  if (!isAdmin) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminHeader user={{ 
        email: session.user?.email || '', 
        name: session.user?.name || '', 
        isAdmin: (session.user as any)?.isAdmin || false 
      } as any} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
