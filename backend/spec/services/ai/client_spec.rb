require "rails_helper"

RSpec.describe Ai::Client do
  around do |example|
    original = ENV["OPENAI_API_KEY"]
    ENV["OPENAI_API_KEY"] = "test-key-for-specs"
    example.run
  ensure
    ENV["OPENAI_API_KEY"] = original
  end

  describe "#chat" do
    it "calls OpenAI chat API and returns content" do
      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_return(
          status: 200,
          body: {
            choices: [{ message: { content: "Great question about travel!" } }]
          }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      client = described_class.new
      result = client.chat(messages: [{ role: "user", content: "Tell me about travel" }])

      expect(result).to eq("Great question about travel!")
    end
  end

  describe "#transcribe" do
    it "calls OpenAI Whisper API and returns text" do
      stub_request(:post, "https://api.openai.com/v1/audio/transcriptions")
        .to_return(
          status: 200,
          body: { text: "Hello, how are you?" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      audio = Tempfile.new(["test", ".wav"])
      audio.write("fake audio data")
      audio.rewind

      client = described_class.new
      result = client.transcribe(audio)

      expect(result).to eq("Hello, how are you?")
    ensure
      audio&.close!
    end
  end

  describe "#synthesize" do
    it "calls OpenAI TTS API and returns audio IO" do
      stub_request(:post, "https://api.openai.com/v1/audio/speech")
        .to_return(
          status: 200,
          body: "fake_audio_bytes",
          headers: { "Content-Type" => "audio/wav" }
        )

      client = described_class.new
      result = client.synthesize("Hello world")

      expect(result).to be_a(StringIO)
      expect(result.read).to eq("fake_audio_bytes")
    end
  end
end
