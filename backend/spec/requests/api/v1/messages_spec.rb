require "rails_helper"

RSpec.describe "Api::V1::Messages", type: :request do
  let(:user) { create(:user) }
  let(:plan) { create(:membership_plan, features: %w[conversation]) }

  before { create(:user_membership, user: user, membership_plan: plan) }

  let(:conversation) do
    service = ConversationService.new(ai_client: Ai::FakeClient.new)
    result = service.start_conversation(user: user, topic: "Travel and Vacation")
    result[:conversation]
  end

  describe "POST /api/v1/conversations/:conversation_id/messages" do
    context "with text input" do
      it "creates user and AI messages" do
        post "/api/v1/conversations/#{conversation.id}/messages",
             headers: auth_headers(user),
             params: { text: "I love traveling to Japan!" }

        expect(response).to have_http_status(:created)

        json = JSON.parse(response.body)
        expect(json["user_message"]["role"]).to eq("user")
        expect(json["user_message"]["content"]).to eq("I love traveling to Japan!")
        expect(json["ai_message"]["role"]).to eq("assistant")
        expect(json["ai_message"]["content"]).to be_present
        expect(json["ai_message"]["audio_url"]).to be_present
      end
    end

    context "when message limit reached" do
      it "returns 422" do
        conversation.update_column(:messages_count, Conversation::MAX_MESSAGES)

        post "/api/v1/conversations/#{conversation.id}/messages",
             headers: auth_headers(user),
             params: { text: "One more message" }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["error"]).to include("limit")
      end
    end

    context "for another user's conversation" do
      it "returns 404" do
        other_user = create(:user)
        other_plan = create(:membership_plan, features: %w[conversation])
        create(:user_membership, user: other_user, membership_plan: other_plan)
        other_conv = create(:conversation, user: other_user)

        post "/api/v1/conversations/#{other_conv.id}/messages",
             headers: auth_headers(user),
             params: { text: "Hello" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "without conversation feature" do
      it "returns 403" do
        user_no_conv = create(:user)
        learning_plan = create(:membership_plan, features: %w[learning])
        create(:user_membership, user: user_no_conv, membership_plan: learning_plan)
        conv = create(:conversation, user: user_no_conv)

        post "/api/v1/conversations/#{conv.id}/messages",
             headers: auth_headers(user_no_conv),
             params: { text: "Hello" }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns 401" do
        post "/api/v1/conversations/#{conversation.id}/messages",
             params: { text: "Hello" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
