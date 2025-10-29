import { Post, Asset } from '@/lib/types'

export function generatePostStructuredData(post: Post & { assets: Asset[] }) {
  const imageAsset = post.assets.find(a => a.type === 'THUMBNAIL')
  const videoAsset = post.assets.find(a => a.type === 'VIDEO')
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "headline": post.title,
    "description": `View this ${videoAsset ? 'video' : 'image'} post from ${post.subreddit} community`,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "YapGrid",
      "url": "https://yapgrid.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yapgrid.com/logo.png"
      }
    },
    "datePublished": post.publishedAt?.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://yapgrid.com/posts/${post.id}`
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": post.score
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": post.commentsCount
      }
    ],
    "about": {
      "@type": "Thing",
      "name": post.subreddit,
      "url": `https://yapgrid.com/communities/${post.subreddit}`
    },
    "url": `https://yapgrid.com/posts/${post.id}`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "YapGrid",
      "url": "https://yapgrid.com"
    }
  }

  // Add media content
  if (videoAsset) {
    structuredData["video"] = {
      "@type": "VideoObject",
      "name": post.title,
      "description": `Video from ${post.subreddit} community`,
      "thumbnailUrl": imageAsset?.url,
      "contentUrl": videoAsset.url,
      "embedUrl": `https://yapgrid.com/posts/${post.id}`,
      "uploadDate": post.publishedAt?.toISOString(),
      "duration": videoAsset.durationSec ? `PT${videoAsset.durationSec}S` : undefined,
      "width": videoAsset.width,
      "height": videoAsset.height
    }
  } else if (imageAsset) {
    structuredData["image"] = {
      "@type": "ImageObject",
      "url": imageAsset.url,
      "width": imageAsset.width,
      "height": imageAsset.height,
      "caption": post.title
    }
  }

  return structuredData
}

export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "YapGrid",
    "alternateName": "Yap Grid",
    "url": "https://yapgrid.com",
    "description": "Discover the best social media content aggregated in one place. Browse trending posts, videos, and images from your favorite communities.",
    "publisher": {
      "@type": "Organization",
      "name": "YapGrid",
      "url": "https://yapgrid.com"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://yapgrid.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://twitter.com/yapgrid",
      "https://facebook.com/yapgrid"
    ]
  }
}

export function generateBreadcrumbStructuredData(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://yapgrid.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": post.subreddit,
        "item": `https://yapgrid.com/communities/${post.subreddit}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://yapgrid.com/posts/${post.id}`
      }
    ]
  }
}
