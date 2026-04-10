module Ai
  class Client
    CHAT_MODEL = "gpt-4o-mini"
    TTS_MODEL = "tts-1"
    TTS_VOICE = "nova"
    STT_MODEL = "whisper-1"

    def initialize
      @openai = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))
    end

    def chat(messages:, topic: nil)
      response = @openai.chat(
        parameters: {
          model: CHAT_MODEL,
          messages: messages.map { |m| { role: m[:role].to_s, content: m[:content].to_s } },
          max_tokens: 200,
          temperature: 0.8
        }
      )
      response.dig("choices", 0, "message", "content") || "I'm sorry, I couldn't generate a response."
    end

    def transcribe(audio_file)
      tmp_path = prepare_audio_file(audio_file)
      response = @openai.audio.transcribe(
        parameters: {
          model: STT_MODEL,
          file: File.open(tmp_path, "rb"),
          language: "en"
        }
      )
      text = response["text"].to_s.strip
      Rails.logger.info("[STT] Transcribed #{File.size(tmp_path)} bytes -> \"#{text.truncate(100)}\"")
      text
    ensure
      File.delete(tmp_path) if tmp_path && File.exist?(tmp_path) && tmp_path.start_with?(Dir.tmpdir)
    end

    def synthesize(text)
      response = @openai.audio.speech(
        parameters: {
          model: TTS_MODEL,
          input: text,
          voice: TTS_VOICE,
          response_format: "mp3"
        }
      )
      StringIO.new(response)
    end

    private

    # Write audio to a real file with proper extension for OpenAI Whisper.
    # ruby-openai v8 works best with File objects opened from disk.
    def prepare_audio_file(audio_file)
      ext = case audio_file
            when ActionDispatch::Http::UploadedFile
              File.extname(audio_file.original_filename).presence || ".webm"
            else
              ".webm"
            end

      tmp_path = File.join(Dir.tmpdir, "whisper_#{SecureRandom.hex(8)}#{ext}")

      source = case audio_file
               when ActionDispatch::Http::UploadedFile then audio_file.tempfile
               else audio_file
               end

      source.rewind if source.respond_to?(:rewind)
      File.open(tmp_path, "wb") { |f| IO.copy_stream(source, f) }

      Rails.logger.info("[STT] Prepared audio file: #{tmp_path} (#{File.size(tmp_path)} bytes)")
      tmp_path
    end
  end
end
