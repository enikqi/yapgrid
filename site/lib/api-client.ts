// Utility for making API calls with proper error handling
// Ensures we never try to parse HTML as JSON

export async function apiClient<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`API returned non-JSON response for ${url}`)
      return {
        success: false,
        error: 'Server returned invalid response format',
      }
    }

    const data = await response.json()
    
    // If response has success field, return as is
    if ('success' in data) {
      return data
    }

    // If no success field but response is OK, wrap it
    if (response.ok) {
      return {
        success: true,
        data,
      }
    }

    // Response not OK
    return {
      success: false,
      error: data.error || data.message || 'Request failed',
    }
  } catch (error) {
    console.warn(`API call failed for ${url}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Specialized version for NextAuth endpoints that might return HTML errors
export async function authApiClient<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Always include credentials for auth endpoints
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // NextAuth returned HTML error page, treat as auth error
      return {
        success: false,
        error: 'Authentication error',
      }
    }

    const data = await response.json()
    
    if ('success' in data) {
      return data
    }

    if (response.ok) {
      return {
        success: true,
        data,
      }
    }

    return {
      success: false,
      error: data.error || 'Authentication failed',
    }
  } catch (error) {
    // Silently fail for auth errors to avoid console spam
    return {
      success: false,
      error: 'Authentication error',
    }
  }
}

