import { useEffect, useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useEmployeeNotes(org: string) {
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    if (!org) return

    const fetchNotes = async () => {
      try {
        setLoading(true)

        const res = await fetch(`/api/${org}/employee/notes`)
        const data = await res.json()

        setNotes(data.notes ?? '')
      } catch (err) {
        setError('Failed to load notes')
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [org])

  useEffect(() => {
    if (!org) return

    const timeout = setTimeout(async () => {
      try {
        setSaving(true)
        setStatus('saving')

        await fetch(`/api/${org}/employee/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })

        setStatus('saved')
      } catch (err) {
        setStatus('error')
        setError('Failed to save notes')
      } finally {
        setSaving(false)
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [notes, org])

  return {
    notes,
    setNotes,
    loading,
    saving,
    error,
    status,
  }
}