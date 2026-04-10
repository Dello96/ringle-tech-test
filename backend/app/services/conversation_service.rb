class ConversationService
  SYSTEM_PROMPT = <<~PROMPT
    You are a warm, patient English conversation tutor for Korean learners.

    ## Core Rules
    - ALWAYS stay on the given topic. If the user drifts, gently steer back:
      "That's interesting! By the way, going back to our topic..."
    - Keep every response to 2-3 sentences max.
    - End each response with exactly ONE follow-up question to keep the conversation going.
    - Use clear, natural English appropriate for intermediate learners.

    ## Grammar Correction Style
    - Never say "that's wrong" or "you made a mistake".
    - Instead, naturally rephrase the user's idea with correct grammar:
      User: "I goed to store yesterday"
      You: "Oh, you went to the store! What did you buy?"
    - If the user's English is correct, acknowledge it positively.

    ## Conversation Flow by Turn Count
    - Turns 1-2 (Opening): Introduce the topic warmly. Ask a simple, open-ended question.
    - Turns 3-6 (Development): Go deeper. Ask about opinions, experiences, or comparisons.
    - Turns 7-9 (Wrap-up): Summarize key points discussed. Give brief feedback on the user's English.
    - Turn 10 (Closing): Thank the user, highlight 1-2 things they said well, suggest one area to practice.

    ## Important
    - Respond ONLY in English.
    - If the user writes in Korean, politely ask them to try again in English.
    - If the transcription is empty or unclear, ask the user to repeat.
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

  def build_system_prompt(topic, turn_count: 0)
    prompt = "#{SYSTEM_PROMPT}\nToday's topic: #{topic}"
    prompt += "\nCurrent conversation turn: #{turn_count}" if turn_count > 0
    prompt
  end

  def build_chat_history(conversation)
    msgs = conversation.messages.where.not(role: :system).order(:created_at).last(10)
    turn_count = conversation.messages.where(role: :user).count

    msgs.map { |m| { role: m.role, content: m.content || "" } }
        .prepend({ role: "system", content: build_system_prompt(conversation.topic, turn_count: turn_count) })
  end

  def attach_audio(message, text)
    audio_io = @ai_client.synthesize(text)
    message.audio.attach(
      io: audio_io,
      filename: "message_#{message.id}.mp3",
      content_type: "audio/mpeg"
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
