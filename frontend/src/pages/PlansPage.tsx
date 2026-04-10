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

  const { data, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.plans.list(),
  });

  const handlePurchase = async (plan: MembershipPlan) => {
    setError("");
    setSuccess("");
    setPurchasing(plan.id);
    try {
      const result = await api.purchases.create({
        plan_id: plan.id,
        card_token: "tok_visa",
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
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing !== null}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {purchasing === plan.id ? "Processing..." : "Purchase"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
