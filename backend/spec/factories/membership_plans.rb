FactoryBot.define do
  factory :membership_plan do
    name { "Basic Plan" }
    features { %w[learning] }
    duration_days { 30 }
    price_cents { 9900 }
    description { "Basic learning plan" }

    trait :premium do
      name { "Premium Plan" }
      features { %w[learning conversation analysis] }
      duration_days { 30 }
      price_cents { 29900 }
    end

    trait :conversation_only do
      name { "Conversation Only" }
      features { %w[conversation] }
      duration_days { 30 }
      price_cents { 14900 }
    end
  end
end
