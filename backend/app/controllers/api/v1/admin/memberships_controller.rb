module Api
  module V1
    module Admin
      class MembershipsController < BaseController
        before_action :require_admin!

        def index
          memberships = UserMembership.includes(:user, :membership_plan)
                                      .order(created_at: :desc)

          memberships = memberships.where(user_id: params[:user_id]) if params[:user_id].present?

          if params[:status] == "active"
            memberships = memberships.active
          elsif params[:status] == "expired"
            memberships = memberships.where("expires_at <= ?", Time.current)
          end

          render json: {
            memberships: memberships.map { |m|
              m.as_json.merge("user" => m.user.as_json)
            }
          }
        end

        def create
          user = User.find(params[:user_id])
          plan = MembershipPlan.find(params[:plan_id])

          starts_at = Time.current
          expires_at = starts_at + plan.duration_days.days

          membership = user.user_memberships.create!(
            membership_plan: plan,
            starts_at: starts_at,
            expires_at: expires_at
          )

          render json: { membership: membership.as_json }, status: :created
        end

        def destroy
          membership = UserMembership.find(params[:id])
          membership.destroy!

          render json: { message: "Membership revoked" }
        end
      end
    end
  end
end
