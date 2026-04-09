module Api
  module V1
    class MessagesController < BaseController
      before_action :require_conversation_feature!
      before_action :set_conversation

      def create
        if @conversation.message_limit_reached?
          return render_error("Message limit reached for this conversation", :unprocessable_entity)
        end

        result = ConversationService.new.reply(
          conversation: @conversation,
          audio: params[:audio],
          text: params[:text]
        )

        render json: {
          user_message: result[:user_message].as_json,
          ai_message: result[:ai_message].as_json
        }, status: :created
      rescue RuntimeError => e
        render_error(e.message, :unprocessable_entity)
      rescue StandardError => e
        Rails.logger.error("Message creation failed: #{e.class} - #{e.message}")
        render_error("Failed to process message. Please try again.", :unprocessable_entity)
      end

      private

      def require_conversation_feature!
        require_feature!("conversation")
      end

      def set_conversation
        @conversation = current_user.conversations.find(params[:conversation_id])
      end
    end
  end
end
