class ConversationService
  SYSTEM_PROMPT = <<~PROMPT
    You are an friendly English conversation tutor. Your role is to:
    1. Keep the conversation focused on the given topic.
    2. Use simple, clear English appropriate for intermediate learners.
    3. Gently correct grammar mistakes by rephrasing naturally.
    4. Ask follow-up questions to keep the conversation going.
    5. Keep responses concise (2-3 sentences max).
    6. Be encouraging and supportive.
  PROMPT

  def initialize(ai_client: nil)
    @ai_client = ai_client || resolve_ai_client
  end

  def start_conversation(user:, topic: nil)
    topic ||= Conversation.random_topic

    conversation = user.conversations.create!(topic: topic)

    system_msg = conversation.messages.create!(
      role: :system,
      content: build_system_prompt(topic)
    )

    ai_text = @ai_client.chat(
      messages: [{ role: "system", content: system_msg.content }],
      topic: topic
    )

    ai_message = conversation.messages.create!(role: :assistant, content: ai_text)
    attach_audio(ai_message, ai_text)

    { conversation: conversation, message: ai_message }
  end

  def reply(conversation:, audio: nil, text: nil)
    raise "Conversation message limit reached" if conversation.message_limit_reached?

    user_text = if audio
      @ai_client.transcribe(audio)
    else
      text
    end

    user_message = conversation.messages.create!(role: :user, content: user_text)

    if audio
      rewind_audio(audio)
      attach_user_audio(user_message, audio)
    end

    chat_history = build_chat_history(conversation)

    ai_text = @ai_client.chat(messages: chat_history, topic: conversation.topic)

    ai_message = conversation.messages.create!(role: :assistant, content: ai_text)
    attach_audio(ai_message, ai_text)

    { user_message: user_message, ai_message: ai_message }
  end

  private

  def resolve_ai_client
    Rails.application.config.ai_client_class.constantize.new
  end

  def build_system_prompt(topic)
    "#{SYSTEM_PROMPT}\nToday's topic: #{topic}"
  end

  def build_chat_history(conversation)
    conversation.messages
                .where.not(role: :system)
                .order(:created_at)
                .last(10)
                .map { |m| { role: m.role, content: m.content || "" } }
                .prepend({ role: "system", content: build_system_prompt(conversation.topic) })
  end

  def attach_audio(message, text)
    audio_io = @ai_client.synthesize(text)
    message.audio.attach(
      io: audio_io,
      filename: "message_#{message.id}.wav",
      content_type: "audio/wav"
    )
  end

  def attach_user_audio(message, audio)
    io = audio.respond_to?(:tempfile) ? audio.tempfile : audio
    io.rewind if io.respond_to?(:rewind)
    message.audio.attach(
      io: io,
      filename: "user_#{message.id}.webm",
      content_type: "audio/webm"
    )
  end

  def rewind_audio(audio)
    if audio.respond_to?(:tempfile)
      audio.tempfile.rewind
    elsif audio.respond_to?(:rewind)
      audio.rewind
    end
  end
end
