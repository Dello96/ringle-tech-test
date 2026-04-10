require "rails_helper"

RSpec.describe Message, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:conversation).counter_cache(true) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:role) }

    it "requires content for assistant messages" do
      message = build(:message, role: :assistant, content: nil)
      expect(message).not_to be_valid
    end

    it "allows nil content for user messages (audio-only)" do
      message = build(:message, :user_message, content: nil)
      expect(message).to be_valid
    end
  end

  describe "enum" do
    it { is_expected.to define_enum_for(:role).with_values(user: 0, assistant: 1, system: 2) }
  end

  describe "#audio_url" do
    it "returns nil when no audio attached" do
      message = build(:message)
      expect(message.audio_url).to be_nil
    end
  end

  describe "#as_json" do
    let(:message) { create(:message) }
    let(:json) { message.as_json }

    it "includes expected fields" do
      expect(json.keys).to match_array(%w[id role content created_at audio_url])
    end

    it "includes audio_url field" do
      expect(json).to have_key("audio_url")
    end
  end

  describe "counter_cache" do
    it "increments conversation messages_count" do
      conversation = create(:conversation)
      expect {
        create(:message, conversation: conversation)
      }.to change { conversation.reload.messages_count }.by(1)
    end
  end
end
