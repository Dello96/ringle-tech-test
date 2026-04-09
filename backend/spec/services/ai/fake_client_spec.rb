require "rails_helper"

RSpec.describe Ai::FakeClient do
  subject(:client) { described_class.new }

  describe "#chat" do
    it "returns greeting when no user message exists" do
      messages = [{ role: "system", content: "You are an English tutor." }]
      response = client.chat(messages: messages, topic: "travel")

      expect(response).to include("travel")
    end

    it "echoes part of the user message" do
      messages = [
        { role: "system", content: "You are an English tutor." },
        { role: "user", content: "I love traveling to Japan" }
      ]
      response = client.chat(messages: messages)

      expect(response).to include("I love traveling to Japan")
    end

    it "returns a string" do
      response = client.chat(messages: [{ role: "user", content: "Hello" }])
      expect(response).to be_a(String)
      expect(response.length).to be > 0
    end
  end

  describe "#transcribe" do
    it "returns a fake transcription string" do
      result = client.transcribe("fake_audio_data")

      expect(result).to be_a(String)
      expect(result).to include("fake transcription")
    end
  end

  describe "#synthesize" do
    it "returns a StringIO containing WAV data" do
      result = client.synthesize("Hello world")

      expect(result).to be_a(StringIO)
      data = result.read
      expect(data[0..3]).to eq("RIFF")
      expect(data[8..11]).to eq("WAVE")
    end

    it "generates valid WAV header" do
      result = client.synthesize("Test")
      data = result.read

      expect(data.length).to be > 44
    end
  end
end
