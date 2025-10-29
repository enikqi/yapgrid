import { prisma } from './db/prisma'

export interface CreateNotificationParams {
  userId: string
  type: 'comment' | 'upvote' | 'new_post' | 'community_update' | 'reply'
  title: string
  message: string
  link?: string
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        isRead: false
      }
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Create a notification when someone comments on user's post
 */
export async function notifyOnComment(params: {
  postOwnerId: string
  commenterName: string
  postTitle: string
  postId: string
  subreddit: string
}) {
  return createNotification({
    userId: params.postOwnerId,
    type: 'comment',
    title: 'New comment on your post',
    message: `${params.commenterName} commented on your post in r/${params.subreddit}`,
    link: `/post/${params.postId}`
  })
}

/**
 * Create a notification when someone upvotes user's post
 */
export async function notifyOnUpvote(params: {
  postOwnerId: string
  voterName: string
  postTitle: string
  postId: string
}) {
  return createNotification({
    userId: params.postOwnerId,
    type: 'upvote',
    title: 'Post upvoted',
    message: `${params.voterName} upvoted your post: "${params.postTitle}"`,
    link: `/post/${params.postId}`
  })
}

/**
 * Create a notification for new posts in subscribed communities
 */
export async function notifyCommunityUpdate(params: {
  userId: string
  communityName: string
  postTitle: string
  postId: string
}) {
  return createNotification({
    userId: params.userId,
    type: 'new_post',
    title: 'New post in your community',
    message: `New post in r/${params.communityName}: "${params.postTitle}"`,
    link: `/post/${params.postId}`
  })
}

/**
 * Create a notification when someone replies to user's comment
 */
export async function notifyOnReply(params: {
  commentOwnerId: string
  replierName: string
  postTitle: string
  postId: string
}) {
  return createNotification({
    userId: params.commentOwnerId,
    type: 'reply',
    title: 'New reply to your comment',
    message: `${params.replierName} replied to your comment on "${params.postTitle}"`,
    link: `/post/${params.postId}`
  })
}

