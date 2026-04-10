module Ai
  class FakeClient
    FAKE_RESPONSES = [
      "That's a great point! Could you elaborate on that?",
      "Interesting! Let me share my thoughts on this topic.",
      "I see what you mean. How about we explore another angle?",
      "That's correct! Your English is improving nicely.",
      "Good try! A more natural way to say that would be slightly different, but I understood you perfectly."
    ].freeze

    def chat(messages:, topic: nil)
      last_user_msg = messages.reverse.find { |m| m[:role] == "user" }&.dig(:content)
      if last_user_msg
        "That's an interesting perspective on '#{last_user_msg.truncate(50)}'. #{FAKE_RESPONSES.sample}"
      else
        "Hello! Today let's talk about #{topic || 'daily life'}. What do you think about this topic?"
      end
    end

    def transcribe(audio_file)
      "This is a fake transcription of the uploaded audio."
    end

    def synthesize(text)
      silence = generate_silence_wav
      StringIO.new(silence)
    end

    private

    def generate_silence_wav
      sample_rate = 24000
      duration = 1
      num_samples = sample_rate * duration
      data_size = num_samples * 2

      header = "RIFF"
      header += [36 + data_size].pack("V")
      header += "WAVEfmt "
      header += [16, 1, 1, sample_rate, sample_rate * 2, 2, 16].pack("VvvVVvv")
      header += "data"
      header += [data_size].pack("V")
      header + ("\x00" * data_size)
    end
  end
end
