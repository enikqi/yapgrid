export default function AdminTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Admin Dashboard Test
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
              ✅ Authentication Working
            </h2>
            <p className="text-green-700 dark:text-green-300">
              You have successfully accessed the admin dashboard!
            </p>
          </div>
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              🔧 Test Credentials
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              Email: admin@test.com<br />
              Password: admin123
            </p>
          </div>
          
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              📋 Next Steps
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              The admin dashboard is working! You can now:
              <br />• Configure Reddit API settings
              <br />• Set up Pinterest integration
              <br />• Manage video processing
              <br />• Monitor job queues
            </p>
          </div>
          
          <div className="text-center">
            <a 
              href="/" 
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
