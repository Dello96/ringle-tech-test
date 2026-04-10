import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { MembershipPlan } from "../types";

export function PlansPage() {
  const { membership, refresh } = useAuth();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [switchTarget, setSwitchTarget] = useState<MembershipPlan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.plans.list(),
  });

  const executePurchase = async (plan: MembershipPlan, replaceExisting: boolean) => {
    setError("");
    setSuccess("");
    setPurchasing(plan.id);
    try {
      const result = await api.purchases.create({
        plan_id: plan.id,
        card_token: "tok_visa",
        replace_existing: replaceExisting,
      });
      setSuccess(
        `${plan.name} 플랜을 구매했습니다! 거래번호: ${result.transaction_id}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseClick = (plan: MembershipPlan) => {
    if (membership && membership.plan.id !== plan.id) {
      setSwitchTarget(plan);
    } else {
      executePurchase(plan, false);
    }
  };

  const handleConfirmSwitch = () => {
    if (!switchTarget) return;
    setSwitchTarget(null);
    executePurchase(switchTarget, true);
  };

  const formatPrice = (price: number) => `₩${price.toLocaleString()}`;

  if (isLoading) return <div className="text-gray-500">Loading plans...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Membership Plans</h1>
      <p className="text-gray-500 mb-6">기능을 이용하려면 플랜을 선택하세요</p>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-2.5 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-2.5 rounded-xl text-sm mb-4">
          {success}
        </div>
      )}

      {membership && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-primary font-medium">
            현재 플랜: <strong>{membership.plan.name}</strong> — {membership.remaining_days}일 남음
            <span className="text-primary/60 ml-1">
              ({new Date(membership.expires_at).toLocaleDateString('ko-KR')} 만료)
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
        {data?.plans.map((plan) => {
          const isCurrent = membership?.plan.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 bg-white hover:shadow-md"
              }`}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-3xl font-bold text-primary mb-2">
                {formatPrice(plan.price_cents)}
              </p>
              <p className="text-sm text-gray-500 mb-4">{plan.duration_days}일</p>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

              <div className="space-y-1.5 mb-6">
                {["learning", "conversation", "analysis"].map((f) => (
                  <div
                    key={f}
                    className={`text-sm flex items-center gap-2 ${
                      plan.features.includes(f) ? "text-accent" : "text-gray-300"
                    }`}
                  >
                    <span>{plan.features.includes(f) ? "✓" : "✗"}</span>
                    <span className="capitalize">{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="text-center text-sm text-primary font-semibold py-2.5 bg-primary/10 rounded-xl">
                  현재 이용 중
                </div>
              ) : (
                <button
                  onClick={() => handlePurchaseClick(plan)}
                  disabled={purchasing !== null}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {purchasing === plan.id
                    ? "Processing..."
                    : membership
                      ? "플랜 변경"
                      : "구매하기"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {switchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">플랜 변경 확인</h3>

            <div className="bg-surface rounded-xl p-3 mb-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500">현재 플랜</span>
                <span className="font-medium text-gray-900">{membership?.plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">변경할 플랜</span>
                <span className="font-medium text-primary">{switchTarget.name}</span>
              </div>
            </div>

            <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-danger font-medium mb-1">주의사항</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>- 기존 플랜({membership?.plan.name})은 즉시 해지됩니다.</li>
                <li>- 기존 플랜의 남은 기간({membership?.remaining_days}일)에 대한 환불은 어렵습니다.</li>
                <li>- 새 플랜({switchTarget.name})은 오늘부터 {switchTarget.duration_days}일간 적용됩니다.</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSwitchTarget(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                기존 플랜 유지
              </button>
              <button
                onClick={handleConfirmSwitch}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
