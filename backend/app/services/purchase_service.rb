class PurchaseService
  class PurchaseError < StandardError; end

  def initialize(gateway: MockPaymentGateway.new)
    @gateway = gateway
  end

  def call(user:, plan:, card_token:)
    result = @gateway.charge(
      amount_cents: plan.price_cents,
      card_token: card_token,
      description: "#{plan.name} for #{user.email}"
    )

    raise PurchaseError, result.error_message unless result.success?

    ActiveRecord::Base.transaction do
      membership = user.user_memberships.create!(
        membership_plan: plan,
        starts_at: Time.current,
        expires_at: Time.current + plan.duration_days.days
      )

      {
        membership: membership,
        transaction_id: result.transaction_id
      }
    end
  end
end
