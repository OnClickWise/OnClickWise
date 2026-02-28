'use client'

interface Props {
  stats: any
}

export default function TeamPerformanceCard({ stats }: Props) {
  const team = stats?.leadsByUser || []

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-6">
        Team Performance
      </h3>

      <div className="space-y-6">
        {team.map((member: any, index: number) => {
          const avgTicket =
            member.count > 0
              ? (member.value / member.count).toFixed(2)
              : 0

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{member.user}</p>
                  <p className="text-xs text-gray-500">
                    {member.count} leads
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    ${member.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: ${avgTicket}
                  </p>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${member.percentage || 0}%`,
                  }}
                />
              </div>
            </div>
          )
        })}

        {team.length === 0 && (
          <p className="text-sm text-gray-500">
            No team data available.
          </p>
        )}
      </div>
    </div>
  )
}