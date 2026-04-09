module Api
  module V1
    class PurchasesController < BaseController
      def create
        plan = MembershipPlan.find(params[:plan_id])

        result = PurchaseService.new.call(
          user: current_user,
          plan: plan,
          card_token: params[:card_token]
        )

        render json: {
          membership: result[:membership].as_json,
          transaction_id: result[:transaction_id]
        }, status: :created
      rescue PurchaseService::PurchaseError => e
        render json: { error: e.message }, status: :payment_required
      end
    end
  end
end
