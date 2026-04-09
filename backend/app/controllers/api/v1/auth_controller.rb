module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate!, only: %i[register login]

      def register
        user = User.new(register_params)

        if user.save
          render json: { user: user.as_json, token: user.auth_token }, status: :created
        else
          render_error(user.errors.full_messages.join(", "))
        end
      end

      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          render json: { user: user.as_json, token: user.auth_token }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def me
        render json: {
          user: current_user.as_json,
          membership: current_user.active_membership&.as_json
        }
      end

      private

      def register_params
        params.permit(:email, :password, :name)
      end
    end
  end
end
