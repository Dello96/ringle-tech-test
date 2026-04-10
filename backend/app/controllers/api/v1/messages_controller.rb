module Api
  module V1
    class MessagesController < BaseController
      RATE_LIMIT_PER_MINUTE = 10
      MAX_AUDIO_SIZE = 5.megabytes

      before_action :require_conversation_feature!
      before_action :set_conversation
      before_action :check_rate_limit!
      before_action :check_audio_size!

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

      def check_rate_limit!
        recent_count = current_user.conversations
                                   .joins(:messages)
                                   .where(messages: { role: :user, created_at: 1.minute.ago.. })
                                   .count
        if recent_count >= RATE_LIMIT_PER_MINUTE
          render json: { error: "Too many requests. Please wait a moment." }, status: :too_many_requests
        end
      end

      def check_audio_size!
        return unless params[:audio].present?

        if params[:audio].respond_to?(:size) && params[:audio].size > MAX_AUDIO_SIZE
          render_error("Audio file too large (max 5MB)", :unprocessable_entity)
        end
      end
    end
  end
end
