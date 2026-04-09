import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { AdminUser, MembershipPlan } from '../types'

export function AdminPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.admin.users.list(),
  })

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.plans.list(),
  })

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  const handleAssign = async (user: AdminUser, planId: string) => {
    if (!planId) return
    try {
      await api.admin.memberships.create({
        user_id: user.id,
        plan_id: Number(planId),
      })
      showMessage(`${user.name}님에게 멤버십을 부여했습니다.`)
      setEditingUserId(null)
      setSelectedPlanId('')
      refreshData()
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '멤버십 부여 실패', true)
    }
  }

  const handleUpdate = async (user: AdminUser, planId: string) => {
    if (!planId || !user.membership) return
    try {
      await api.admin.memberships.update(user.membership.id, {
        plan_id: Number(planId),
      })
      showMessage(`${user.name}님의 멤버십을 변경했습니다.`)
      setEditingUserId(null)
      setSelectedPlanId('')
      refreshData()
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '멤버십 변경 실패', true)
    }
  }

  const handleRevoke = async (user: AdminUser) => {
    if (!user.membership) return
    if (!confirm(`${user.name}님의 멤버십을 삭제하시겠습니까?`)) return
    try {
      await api.admin.memberships.destroy(user.membership.id)
      showMessage(`${user.name}님의 멤버십을 삭제했습니다.`)
      refreshData()
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '멤버십 삭제 실패', true)
    }
  }

  const startEditing = (user: AdminUser) => {
    setEditingUserId(user.id)
    setSelectedPlanId(user.membership ? String(user.membership.plan.id) : '')
  }

  const cancelEditing = () => {
    setEditingUserId(null)
    setSelectedPlanId('')
  }

  const formatPrice = (price: number) => `₩${price.toLocaleString()}`

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">관리자 페이지</h1>
      <p className="text-gray-400 mb-6">가입된 유저 목록과 멤버십을 관리합니다</p>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-2 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}

      {usersLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {usersData?.users.map((user) => {
            const m = user.membership
            const isEditing = editingUserId === user.id

            return (
              <div key={user.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{user.name}</span>
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                    </div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {m && m['active?'] ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-400 mb-1">
                          {m.plan.name}
                        </span>
                        <div className="text-xs text-gray-400">
                          {m.remaining_days}일 남음
                        </div>
                        <div className="text-xs text-gray-500">
                          만료: {new Date(m.expires_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-500">
                        플랜 없음
                      </span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-3 flex-wrap">
                    <PlanSelector
                      plans={plansData?.plans || []}
                      value={selectedPlanId}
                      onChange={setSelectedPlanId}
                      formatPrice={formatPrice}
                    />
                    <button
                      onClick={() => m && m['active?']
                        ? handleUpdate(user, selectedPlanId)
                        : handleAssign(user, selectedPlanId)
                      }
                      disabled={!selectedPlanId}
                      className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {m && m['active?'] ? '변경 확인' : '부여 확인'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-400 hover:text-white px-3 py-1.5 rounded text-sm transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                    {m && m['active?'] ? (
                      <>
                        <button
                          onClick={() => startEditing(user)}
                          className="text-primary hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          플랜 변경
                        </button>
                        <button
                          onClick={() => handleRevoke(user)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          멤버십 삭제
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(user)}
                        className="text-primary hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        멤버십 부여
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {usersData?.users.length === 0 && (
            <div className="text-gray-500 text-center py-8">가입된 유저가 없습니다</div>
          )}
        </div>
      )}
    </div>
  )
}

function PlanSelector({
  plans, value, onChange, formatPrice,
}: {
  plans: MembershipPlan[]
  value: string
  onChange: (v: string) => void
  formatPrice: (n: number) => string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
    >
      <option value="">플랜 선택</option>
      {plans.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} — {formatPrice(p.price_cents)} / {p.duration_days}일
        </option>
      ))}
    </select>
  )
}
