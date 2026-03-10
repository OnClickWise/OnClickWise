'use client'

interface Props {
  stats: any
}

export default function ConversationsCard({ stats }: Props) {
  const conversations = stats?.conversationStats || []

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">
        Conversation Performance
      </h3>

      <div className="space-y-6">
        {conversations.map((conv: any, index: number) => {
          const activityRate =
            conv.total > 0
              ? Math.round((conv.active / conv.total) * 100)
              : 0

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{conv.user}</span>
                <span>{activityRate}% active</span>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${activityRate}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{conv.active} active</span>
                <span>{conv.total} total</span>
              </div>
            </div>
          )
        })}

        {conversations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No conversation data available.
          </p>
        )}
      </div>
    </div>
  )
}