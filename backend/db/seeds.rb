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

basic = MembershipPlan.find_or_create_by!(name: "Basic") do |plan|
  plan.features = %w[learning]
  plan.duration_days = 30
  plan.price_cents = 9900
  plan.description = "Access to learning materials for 30 days."
end

standard = MembershipPlan.find_or_create_by!(name: "Standard") do |plan|
  plan.features = %w[learning conversation]
  plan.duration_days = 30
  plan.price_cents = 19900
  plan.description = "Learning + AI conversation practice for 30 days."
end

premium = MembershipPlan.find_or_create_by!(name: "Premium") do |plan|
  plan.features = %w[learning conversation analysis]
  plan.duration_days = 30
  plan.price_cents = 29900
  plan.description = "Full access: learning, conversation, and analysis for 30 days."
end

puts "Seeded #{MembershipPlan.count} plans."

puts "Seeding demo membership..."

unless demo_user.active_membership
  demo_user.user_memberships.create!(
    membership_plan: premium,
    starts_at: Time.current,
    expires_at: 30.days.from_now
  )
  puts "Created Premium membership for demo user."
else
  puts "Demo user already has an active membership."
end

puts "Seed complete!"
