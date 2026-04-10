module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate!

      rescue_from ActiveRecord::RecordNotFound do |e|
        render json: { error: e.message }, status: :not_found
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end

      rescue_from ActionController::ParameterMissing do |e|
        render json: { error: e.message }, status: :bad_request
      end

      private

      def authenticate!
        token = request.headers["Authorization"]&.split(" ")&.last
        @current_user = User.find_by(auth_token: token)

        render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
      end

      def current_user
        @current_user
      end

      def require_admin!
        render json: { error: "Forbidden" }, status: :forbidden unless current_user&.admin?
      end

      def require_feature!(feature)
        return render json: { error: "Forbidden" }, status: :forbidden unless current_user

        unless current_user.has_feature?(feature)
          render json: { error: "This feature requires a valid membership" }, status: :forbidden
        end
      end

      def render_error(message, status = :unprocessable_entity)
        render json: { error: message }, status: status
      end
    end
  end
end
