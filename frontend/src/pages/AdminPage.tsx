import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function AdminPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignPlanId, setAssignPlanId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: membershipsData, isLoading } = useQuery({
    queryKey: ['admin-memberships', statusFilter],
    queryFn: () => api.admin.memberships.list(statusFilter ? { status: statusFilter } : undefined),
  })

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.plans.list(),
  })

  const handleAssign = async () => {
    if (!assignUserId || !assignPlanId) return
    setError('')
    setSuccess('')
    try {
      await api.admin.memberships.create({
        user_id: Number(assignUserId),
        plan_id: Number(assignPlanId),
      })
      setSuccess('Membership assigned successfully')
      setAssignUserId('')
      setAssignPlanId('')
      queryClient.invalidateQueries({ queryKey: ['admin-memberships'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign')
    }
  }

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this membership?')) return
    setError('')
    try {
      await api.admin.memberships.destroy(id)
      setSuccess('Membership revoked')
      queryClient.invalidateQueries({ queryKey: ['admin-memberships'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin — Membership Management</h1>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-2 rounded-lg text-sm mb-4">{success}</div>}

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Assign Membership</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-1">User ID</label>
            <input
              type="number" value={assignUserId}
              onChange={e => setAssignUserId(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Plan</label>
            <select
              value={assignPlanId}
              onChange={e => setAssignPlanId(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
            >
              <option value="">Select plan</option>
              {plansData?.plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAssign}
            disabled={!assignUserId || !assignPlanId}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">All Memberships</h2>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-700">
                <th className="pb-2 pr-4">User</th>
                <th className="pb-2 pr-4">Plan</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Expires</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {membershipsData?.memberships.map(m => (
                <tr key={m.id} className="border-b border-gray-800">
                  <td className="py-2 pr-4">
                    <div>{m.user.name}</div>
                    <div className="text-xs text-gray-500">{m.user.email} (ID: {m.user.id})</div>
                  </td>
                  <td className="py-2 pr-4">{m.plan.name}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      m['active?'] ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {m['active?'] ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-400">
                    {new Date(m.expires_at).toLocaleDateString()}
                    {m['active?'] && <span className="text-xs ml-1">({m.remaining_days}d)</span>}
                  </td>
                  <td className="py-2">
                    {m['active?'] && (
                      <button
                        onClick={() => handleRevoke(m.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {membershipsData?.memberships.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-gray-500 text-center">No memberships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
