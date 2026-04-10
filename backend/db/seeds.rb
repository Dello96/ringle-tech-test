puts "Seeding users..."

admin = User.find_or_create_by!(email: "admin@example.com") do |user|
  user.name = "Admin"
  user.password = "password123"
  user.role = :admin
end

demo_user = User.find_or_create_by!(email: "user@example.com") do |user|
  user.name = "Demo User"
  user.password = "password123"
  user.role = :user
end

puts "Seeded #{User.count} users."

puts "Seeding membership plans..."

desired_plans = [
  {
    name: "Basic",
    features: %w[learning],
    duration_days: 30,
    price_cents: 348000,
    description: "Access to learning materials for 30 days."
  },
  {
    name: "Premium",
    features: %w[learning conversation analysis],
    duration_days: 60,
    price_cents: 828000,
    description: "Full access: learning, conversation, and analysis for 60 days."
  }
]

desired_names = desired_plans.map { |plan| plan[:name] }

MembershipPlan.where.not(name: desired_names).destroy_all

desired_plans.each do |attrs|
  plan = MembershipPlan.find_or_initialize_by(name: attrs[:name])
  plan.update!(attrs)
end

puts "Seeded #{MembershipPlan.count} plans."

puts "Seeding demo membership..."

premium_plan = MembershipPlan.find_by!(name: "Premium")

unless demo_user.active_membership
  demo_user.user_memberships.create!(
    membership_plan: premium_plan,
    starts_at: Time.current,
    expires_at: premium_plan.duration_days.days.from_now
  )
  puts "Created Premium membership for demo user."
else
  puts "Demo user already has an active membership."
end

puts "Seed complete!"
