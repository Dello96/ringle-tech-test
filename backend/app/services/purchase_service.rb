class PurchaseService
  class PurchaseError < StandardError; end

  def initialize(gateway: MockPaymentGateway.new)
    @gateway = gateway
  end

  def call(user:, plan:, card_token:, replace_existing: false)
    active = user.active_membership

    if active && active.membership_plan_id == plan.id
      raise PurchaseError, "이미 동일한 플랜을 이용 중입니다."
    end

    if active && !replace_existing
      raise PurchaseError, "이미 활성 플랜이 있습니다. 플랜을 변경하려면 기존 플랜 해지에 동의해 주세요."
    end

    result = @gateway.charge(
      amount_cents: plan.price_cents,
      card_token: card_token,
      description: "#{plan.name} for #{user.email}"
    )

    raise PurchaseError, result.error_message unless result.success?

    ActiveRecord::Base.transaction do
      if replace_existing && active
        active.update!(expires_at: Time.current)
      end

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
