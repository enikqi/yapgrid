'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import CommentComponent from './comment'
import { MessageCircle, Send } from 'lucide-react'

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

interface CommentSectionProps {
  postId: string
  initialCommentsCount?: number
}

export default function CommentSection({ postId, initialCommentsCount = 0 }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Load comments when component mounts
  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comments?postId=${postId}`)
      const data = await response.json()
      
      if (data.success) {
        setComments(data.data)
      } else {
        console.error('Failed to load comments:', data.error)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setNewComment('')
        toast.success('Comment posted!')
        loadComments() // Reload comments
      } else {
        toast.error(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user?.email) {
      toast.error('Please sign in to reply')
      return
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: replyContent.trim(),
          parentId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setReplyContent('')
        setReplyingTo(null)
        toast.success('Reply posted!')
        loadComments() // Reload comments
      } else {
        toast.error(data.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId)
    setReplyContent('')
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Comment Input */}
      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:shadow-md"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Count */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No comments yet</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <CommentComponent
                comment={comment}
                postId={postId}
                onReply={handleReply}
                onDelete={handleDeleteComment}
              />
              
              {/* Reply Input for this comment */}
              {replyingTo === comment.id && (
                <div className="ml-6 mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {session?.user?.name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm transition-all duration-200"
                        rows={2}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={submitting || !replyContent.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200"
                    >
                      {submitting ? 'Posting...' : 'Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
