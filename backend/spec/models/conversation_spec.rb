require "rails_helper"

RSpec.describe Conversation, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:messages).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:topic) }
  end

  describe ".random_topic" do
    it "returns a topic from the predefined list" do
      topic = Conversation.random_topic
      expect(Conversation::TOPICS).to include(topic)
    end
  end

  describe "#message_limit_reached?" do
    it "returns false when under limit" do
      conversation = build(:conversation, messages_count: 5)
      expect(conversation.message_limit_reached?).to be false
    end

    it "returns true when at limit" do
      conversation = build(:conversation, messages_count: Conversation::MAX_MESSAGES)
      expect(conversation.message_limit_reached?).to be true
    end
  end

  describe "#as_json" do
    let(:conversation) { create(:conversation) }
    let(:json) { conversation.as_json }

    it "includes expected fields" do
      expect(json.keys).to match_array(%w[id topic messages_count created_at])
    end
  end
end
