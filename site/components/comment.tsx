'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { formatNumber } from '@/lib/utils'
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2,
  Reply,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Comment {
  id: string
  content: string
  score: number
  upvotes: number
  downvotes: number
  repliesCount: number
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    karma: number
  }
  votes: Array<{
    userId: string
    type: 'UPVOTE' | 'DOWNVOTE'
  }>
}

interface CommentProps {
  comment: Comment
  postId: string
  onReply?: (parentId: string) => void
  onDelete?: (commentId: string) => void
  depth?: number
}

export default function CommentComponent({ 
  comment, 
  postId, 
  onReply, 
  onDelete, 
  depth = 0 
}: CommentProps) {
  const { data: session } = useSession()
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [isDownvoted, setIsDownvoted] = useState(false)
  const [score, setScore] = useState(comment.score)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load user's vote status
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/comments/vote?commentId=${comment.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setIsUpvoted(data.voteType === 'UPVOTE')
            setIsDownvoted(data.voteType === 'DOWNVOTE')
          }
        })
        .catch(error => {
          console.error('Failed to load vote status:', error)
        })
    }
  }, [comment.id, session?.user?.email])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleUpvote = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to vote')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentId: comment.id, 
          voteType: 'UPVOTE' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        if (data.action === 'removed') {
          setIsUpvoted(false)
          setIsDownvoted(false)
        } else if (data.action === 'changed') {
          setIsUpvoted(true)
          setIsDownvoted(false)
        } else {
          setIsUpvoted(true)
          setIsDownvoted(false)
        }

        setScore(data.newScore)
        toast.success(data.action === 'removed' ? 'Upvote removed' : 'Upvoted!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownvote = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to vote')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentId: comment.id, 
          voteType: 'DOWNVOTE' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        if (data.action === 'removed') {
          setIsUpvoted(false)
          setIsDownvoted(false)
        } else if (data.action === 'changed') {
          setIsUpvoted(false)
          setIsDownvoted(true)
        } else {
          setIsUpvoted(false)
          setIsDownvoted(true)
        }

        setScore(data.newScore)
        toast.success(data.action === 'removed' ? 'Downvote removed' : 'Downvoted!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    } finally {
      setIsLoading(false)
    }
  }

  const loadReplies = async () => {
    if (replies.length > 0) return // Already loaded

    setLoadingReplies(true)
    try {
      const response = await fetch(`/api/comments?postId=${postId}&parentId=${comment.id}`)
      const data = await response.json()
      
      if (data.success) {
        setReplies(data.data)
      }
    } catch (error) {
      console.error('Failed to load replies:', error)
      toast.error('Failed to load replies')
    } finally {
      setLoadingReplies(false)
    }
  }

  const toggleReplies = () => {
    if (!showReplies) {
      loadReplies()
    }
    setShowReplies(!showReplies)
  }

  const handleDelete = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to delete comments')
      return
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/comments?commentId=${comment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Comment deleted successfully')
        if (onDelete) {
          onDelete(comment.id)
        }
        
        // Force refresh to update UI immediately
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const isOwnComment = session?.user?.email && comment.author.username === session.user.name

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
        {/* Comment Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-white">
              {comment.author.name?.[0] || comment.author.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                u/{comment.author.username || 'unknown'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {formatNumber(comment.author.karma)} karma
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          
          {/* More options dropdown */}
          {isOwnComment && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Comment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
          {comment.content}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-6">
          {/* Vote buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUpvote}
              disabled={isLoading}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 ${
                isUpvoted ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[24px] text-center px-2">
              {formatNumber(score)}
            </span>
            <button
              onClick={handleDownvote}
              disabled={isLoading}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 ${
                isDownvoted ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Reply button */}
          <button
            onClick={() => onReply?.(comment.id)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Reply className="w-4 h-4" />
            <span className="text-sm font-medium">Reply</span>
          </button>

          {/* Show replies button */}
          {comment.repliesCount > 0 && (
            <button
              onClick={toggleReplies}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showReplies ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {showReplies ? 'Hide' : 'Show'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && (
        <div className="mt-2">
          {loadingReplies ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading replies...
            </div>
          ) : (
            replies.map((reply) => (
              <CommentComponent
                key={reply.id}
                comment={reply}
                postId={postId}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
