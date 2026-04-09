Rails.application.config.ai_client_class = if ENV["OPENAI_API_KEY"].present?
  "Ai::Client"
else
  "Ai::FakeClient"
end
