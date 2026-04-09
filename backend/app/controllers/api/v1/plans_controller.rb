module Api
  module V1
    class PlansController < BaseController
      skip_before_action :authenticate!

      def index
        plans = MembershipPlan.order(:price_cents)
        render json: { plans: plans.map(&:as_json) }
      end
    end
  end
end
