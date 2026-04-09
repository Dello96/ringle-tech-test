module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate!, only: %i[register login]

      def register
        if params[:role] == "admin"
          return render_error("Invalid admin code") unless params[:admin_code] == "0000"
        end

        user = User.new(register_params)

        if user.save
          render json: { user: user.as_json }, status: :created
        else
          render_error(user.errors.full_messages.join(", "))
        end
      end

      def login
        user = User.find_by(email: params[:email])

        unless user&.authenticate(params[:password])
          return render json: { error: "Invalid email or password" }, status: :unauthorized
        end

        render json: { user: user.as_json, token: user.auth_token }
      end

      def me
        render json: {
          user: current_user.as_json,
          membership: current_user.active_membership&.as_json
        }
      end

      private

      def register_params
        params.permit(:email, :password, :name, :role)
      end
    end
  end
end
