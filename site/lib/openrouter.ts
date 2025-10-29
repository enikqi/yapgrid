interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface TitleOptimizationRequest {
  originalTitle: string
  subreddit: string
  contentType: 'image' | 'video' | 'text'
}

export class OpenRouterService {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async optimizeTitle(request: TitleOptimizationRequest): Promise<string> {
    try {
      const prompt = this.buildPrompt(request)
      
      // Try multiple models in case one fails
      const models = [
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku',
        'meta-llama/llama-3.1-8b-instruct:free'
      ]
      
      for (const model of models) {
        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://yapgrid.com',
              'X-Title': 'YapGrid Title Optimizer'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an SEO expert specializing in creating engaging, clickable titles for social media content. Your goal is to make titles more appealing while maintaining their original meaning and improving SEO.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 100,
              temperature: 0.7,
              top_p: 0.9
            })
          })

          if (response.ok) {
            const data: OpenRouterResponse = await response.json()
            
            if (data.choices && data.choices.length > 0) {
              const optimizedTitle = data.choices[0].message.content.trim()
              return this.cleanTitle(optimizedTitle)
            }
          } else {
            console.warn(`Model ${model} failed with status ${response.status}`)
          }
        } catch (error) {
          console.warn(`Model ${model} failed:`, error)
          continue
        }
      }

      throw new Error('All models failed')
    } catch (error) {
      console.error('OpenRouter API error:', error)
      // Return original title if API fails
      return request.originalTitle
    }
  }

  private buildPrompt(request: TitleOptimizationRequest): string {
    const { originalTitle, subreddit, contentType } = request
    
    return `Optimize this Reddit post title for better SEO and engagement:

Original Title: "${originalTitle}"
Subreddit: r/${subreddit}
Content Type: ${contentType}

Requirements:
1. Keep the core meaning intact
2. Make it more engaging and clickable
3. Improve SEO with relevant keywords
4. Keep it under 100 characters
5. Make it sound natural and appealing
6. Add emotional triggers if appropriate
7. Include relevant keywords for the subreddit topic

Return only the optimized title, no explanations or quotes.`
  }

  private cleanTitle(title: string): string {
    // Remove quotes and extra whitespace
    return title.replace(/^["']|["']$/g, '').trim()
  }

  // Batch optimize multiple titles
  async optimizeTitles(requests: TitleOptimizationRequest[]): Promise<string[]> {
    const results: string[] = []
    
    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < requests.length; i += 5) {
      const batch = requests.slice(i, i + 5)
      const batchPromises = batch.map(request => this.optimizeTitle(request))
      
      try {
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
        
        // Add delay between batches to respect rate limits
        if (i + 5 < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Batch optimization error:', error)
        // Add original titles for failed batch
        results.push(...batch.map(req => req.originalTitle))
      }
    }
    
    return results
  }
}

// Singleton instance
let openRouterService: OpenRouterService | null = null

export function getOpenRouterService(): OpenRouterService {
  if (!openRouterService) {
    const apiKey = process.env.OPENROUTER_API_KEY || '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'
    openRouterService = new OpenRouterService(apiKey)
  }
  return openRouterService
}
