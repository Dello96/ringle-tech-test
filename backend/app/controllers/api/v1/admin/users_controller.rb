module Api
  module V1
    module Admin
      class UsersController < BaseController
        before_action :require_admin!

        def index
          users = User.where(role: :user)
                      .includes(user_memberships: :membership_plan)
                      .order(:id)

          render json: {
            users: users.map { |u|
              u.as_json.merge("membership" => u.active_membership&.as_json)
            }
          }
        end
      end
    end
  end
end
