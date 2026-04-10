FactoryBot.define do
  factory :user_membership do
    user
    membership_plan

    starts_at { Time.current }
    expires_at { 30.days.from_now }

    trait :expired do
      starts_at { 60.days.ago }
      expires_at { 30.days.ago }
    end

    trait :future do
      starts_at { 10.days.from_now }
      expires_at { 40.days.from_now }
    end
  end
end
