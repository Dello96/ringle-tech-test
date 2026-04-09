FactoryBot.define do
  factory :message do
    conversation
    role { :assistant }
    content { "Hello! Let's practice English together." }

    trait :user_message do
      role { :user }
      content { "I'd like to talk about travel." }
    end

    trait :system_message do
      role { :system }
      content { "You are an English tutor." }
    end
  end
end
