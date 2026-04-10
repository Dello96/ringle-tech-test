require "rails_helper"

RSpec.describe ConversationService do
  let(:user) { create(:user) }
  let(:ai_client) { Ai::FakeClient.new }
  let(:service) { described_class.new(ai_client: ai_client) }

  describe "#start_conversation" do
    it "creates a conversation with a topic" do
      result = service.start_conversation(user: user, topic: "Travel and Vacation")

      expect(result[:conversation]).to be_persisted
      expect(result[:conversation].topic).to eq("Travel and Vacation")
      expect(result[:conversation].user).to eq(user)
    end

    it "creates system and assistant messages" do
      result = service.start_conversation(user: user, topic: "Food and Cooking")

      conversation = result[:conversation]
      expect(conversation.messages.count).to eq(2)
      expect(conversation.messages.first.role).to eq("system")
      expect(conversation.messages.second.role).to eq("assistant")
    end

    it "returns the AI greeting message" do
      result = service.start_conversation(user: user, topic: "Travel and Vacation")

      expect(result[:message].content).to be_present
      expect(result[:message].role).to eq("assistant")
    end

    it "attaches audio to AI message" do
      result = service.start_conversation(user: user, topic: "Travel and Vacation")

      expect(result[:message].audio).to be_attached
    end

    it "uses random topic when none provided" do
      result = service.start_conversation(user: user)

      expect(Conversation::TOPICS).to include(result[:conversation].topic)
    end
  end

  describe "#reply" do
    let(:conversation) do
      result = service.start_conversation(user: user, topic: "Travel and Vacation")
      result[:conversation]
    end

    context "with text input" do
      it "creates user and AI messages" do
        result = service.reply(conversation: conversation, text: "I love traveling!")

        expect(result[:user_message].role).to eq("user")
        expect(result[:user_message].content).to eq("I love traveling!")
        expect(result[:ai_message].role).to eq("assistant")
        expect(result[:ai_message].content).to be_present
      end

      it "attaches audio to AI response" do
        result = service.reply(conversation: conversation, text: "I love traveling!")

        expect(result[:ai_message].audio).to be_attached
      end

      it "increments messages count" do
        expect {
          service.reply(conversation: conversation, text: "Hello")
        }.to change { conversation.reload.messages_count }.by(2)
      end
    end

    context "with audio input" do
      it "transcribes audio and creates messages" do
        audio = StringIO.new("fake audio data")
        result = service.reply(conversation: conversation, audio: audio)

        expect(result[:user_message].content).to include("fake transcription")
        expect(result[:ai_message].content).to be_present
      end
    end

    context "when message limit is reached" do
      it "raises an error" do
        conversation.update_column(:messages_count, Conversation::MAX_MESSAGES)

        expect {
          service.reply(conversation: conversation, text: "Hello")
        }.to raise_error("Conversation message limit reached")
      end
    end

    context "chat history" do
      it "includes previous messages for context" do
        service.reply(conversation: conversation, text: "First message")
        service.reply(conversation: conversation, text: "Second message")

        expect(conversation.messages.count).to be >= 6
      end
    end
  end
end
