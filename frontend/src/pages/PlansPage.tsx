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
        `Successfully purchased ${plan.name}! Transaction: ${result.transaction_id}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number) => `₩${price.toLocaleString()}`;

  if (isLoading) return <div className="text-gray-400">Loading plans...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Membership Plans</h1>
      <p className="text-gray-400 mb-6">Choose a plan to unlock features</p>

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

      {membership && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-primary">
            Current plan: <strong>{membership.plan.name}</strong> —{" "}
            {membership.remaining_days} days remaining
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {data?.plans.map((plan) => {
          const isCurrent = membership?.plan.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                isCurrent
                  ? "border-primary bg-gray-900"
                  : "border-gray-700 bg-gray-900"
              }`}
            >
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-3xl font-bold text-primary mb-2">
                {formatPrice(plan.price_cents)}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {plan.duration_days} days
              </p>
              <p className="text-sm text-gray-300 mb-4">{plan.description}</p>

              <div className="space-y-1 mb-6">
                {["learning", "conversation", "analysis"].map((f) => (
                  <div
                    key={f}
                    className={`text-sm flex items-center gap-2 ${
                      plan.features.includes(f)
                        ? "text-green-400"
                        : "text-gray-600"
                    }`}
                  >
                    <span>{plan.features.includes(f) ? "✓" : "✗"}</span>
                    <span className="capitalize">{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="text-center text-sm text-primary font-medium py-2">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing !== null}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
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
