FactoryBot.define do
  factory :user do
    email { Faker::Internet.unique.email }
    name { Faker::Name.name }
    password { "password123" }
    role { :user }

    trait :admin do
      role { :admin }
    end
  end
end
