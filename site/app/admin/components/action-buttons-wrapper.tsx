'use client'

import { ProcessPostsButton, PublishPostsButton, SchedulerStatus } from './action-buttons'

export default function ActionButtonsWrapper() {
  return (
    <div className="mt-4 flex gap-3">
      <ProcessPostsButton />
      <PublishPostsButton />
      <SchedulerStatus />
    </div>
  )
}
