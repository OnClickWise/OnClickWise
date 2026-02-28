'use client'

import { useEmployeeNotes } from '@/hooks/useEmployeeNotes'

interface Props {
  org: string
}

export default function EmployeeNotesCard({ org }: Props) {
  const { notes, setNotes, loading, saving, error, status } =
    useEmployeeNotes(org)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        Loading notes...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        My Notes
      </h3>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full min-h-[160px] border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
      />

      <div className="mt-3 text-sm">
        {status === 'saving' && (
          <span className="text-blue-500">Saving...</span>
        )}
        {status === 'saved' && (
          <span className="text-green-500">
            Saved automatically ✓
          </span>
        )}
        {status === 'error' && (
          <span className="text-red-500">
            Error saving notes
          </span>
        )}
      </div>

      {saving && (
        <div className="mt-2 text-xs text-gray-400">
          Syncing...
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-500">
          Something went wrong.
        </div>
      )}
    </div>
  )
}