require "rails_helper"

RSpec.describe "Api::V1::Conversations", type: :request do
  let(:user) { create(:user) }
  let(:plan) { create(:membership_plan, features: %w[conversation]) }

  before do
    create(:user_membership, user: user, membership_plan: plan)
  end

  describe "POST /api/v1/conversations" do
    it "creates a new conversation with AI greeting" do
      post "/api/v1/conversations",
           headers: auth_headers(user),
           params: { topic: "Travel and Vacation" }

      expect(response).to have_http_status(:created)

      json = JSON.parse(response.body)
      expect(json["conversation"]["topic"]).to eq("Travel and Vacation")
      expect(json["message"]["role"]).to eq("assistant")
      expect(json["message"]["content"]).to be_present
      expect(json["message"]["audio_url"]).to be_present
    end

    it "uses random topic when none provided" do
      post "/api/v1/conversations", headers: auth_headers(user)

      expect(response).to have_http_status(:created)

      json = JSON.parse(response.body)
      expect(Conversation::TOPICS).to include(json["conversation"]["topic"])
    end

    context "without conversation feature" do
      let(:plan) { create(:membership_plan, features: %w[learning]) }

      it "returns 403" do
        post "/api/v1/conversations", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without membership" do
      before { user.user_memberships.destroy_all }

      it "returns 403" do
        post "/api/v1/conversations", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns 401" do
        post "/api/v1/conversations"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/conversations" do
    it "returns user conversations in desc order" do
      conv1 = create(:conversation, user: user, topic: "Topic A")
      conv2 = create(:conversation, user: user, topic: "Topic B")

      get "/api/v1/conversations", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json["conversations"].size).to eq(2)
      expect(json["conversations"][0]["id"]).to eq(conv2.id)
    end

    it "does not return other users conversations" do
      other_user = create(:user)
      create(:conversation, user: other_user)
      create(:conversation, user: user)

      get "/api/v1/conversations", headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json["conversations"].size).to eq(1)
    end
  end

  describe "GET /api/v1/conversations/:id" do
    it "returns conversation with messages" do
      conversation = create(:conversation, user: user)
      create(:message, conversation: conversation, role: :assistant, content: "Hello!")
      create(:message, :user_message, conversation: conversation, content: "Hi there")

      get "/api/v1/conversations/#{conversation.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json["conversation"]["id"]).to eq(conversation.id)
      expect(json["messages"].size).to eq(2)
    end

    it "excludes system messages from response" do
      conversation = create(:conversation, user: user)
      create(:message, :system_message, conversation: conversation)
      create(:message, conversation: conversation, role: :assistant, content: "Hello!")

      get "/api/v1/conversations/#{conversation.id}", headers: auth_headers(user)

      json = JSON.parse(response.body)
      roles = json["messages"].map { |m| m["role"] }
      expect(roles).not_to include("system")
    end

    it "returns 404 for another user's conversation" do
      other_conv = create(:conversation, user: create(:user))

      get "/api/v1/conversations/#{other_conv.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end
  end
end
