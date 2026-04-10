FactoryBot.define do
  factory :conversation do
    user
    topic { Conversation::TOPICS.sample }
  end
end
