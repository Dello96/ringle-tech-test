module Api
  module V1
    class ConversationsController < BaseController
      before_action :require_conversation_feature!

      def index
        conversations = current_user.conversations
                                    .order(created_at: :desc)

        render json: { conversations: conversations.map(&:as_json) }
      end

      def show
        conversation = current_user.conversations.find(params[:id])
        messages = conversation.messages.where.not(role: :system).order(:created_at)

        render json: {
          conversation: conversation.as_json,
          messages: messages.map(&:as_json)
        }
      end

      def create
        result = ConversationService.new.start_conversation(
          user: current_user,
          topic: params[:topic]
        )

        render json: {
          conversation: result[:conversation].as_json,
          message: result[:message].as_json
        }, status: :created
      end

      private

      def require_conversation_feature!
        require_feature!("conversation")
      end
    end
  end
end
