require "rails_helper"

RSpec.describe User, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:user_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:conversations).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:password).is_at_least(8) }

    it "rejects invalid email formats" do
      user = build(:user, email: "not-an-email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end
  end

  describe "email normalization" do
    it "downcases and strips email" do
      user = create(:user, email: "  TEST@Example.COM  ")
      expect(user.email).to eq("test@example.com")
    end
  end

  describe "authentication" do
    it "authenticates with correct password" do
      user = create(:user, password: "password123")
      expect(user.authenticate("password123")).to eq(user)
    end

    it "rejects incorrect password" do
      user = create(:user, password: "password123")
      expect(user.authenticate("wrong")).to be false
    end
  end

  describe "auth_token" do
    it "generates auth_token on creation" do
      user = create(:user)
      expect(user.auth_token).to be_present
    end

    it "generates unique tokens" do
      tokens = Array.new(3) { create(:user).auth_token }
      expect(tokens.uniq.size).to eq(3)
    end
  end

  describe "roles" do
    it "defaults to user role" do
      user = User.new
      expect(user).to be_user
    end

    it "can be set to admin" do
      user = create(:user, :admin)
      expect(user).to be_admin
    end
  end

  describe "#as_json" do
    it "excludes sensitive fields" do
      user = create(:user)
      json = user.as_json

      expect(json.keys.map(&:to_s)).to contain_exactly("id", "email", "name", "role", "created_at")
      expect(json).not_to have_key("password_digest")
      expect(json).not_to have_key("auth_token")
    end
  end

  describe "#active_membership" do
    let(:user) { create(:user) }
    let(:plan) { create(:membership_plan, :premium) }

    it "returns nil when no membership exists" do
      expect(user.active_membership).to be_nil
    end

    it "returns the active membership" do
      membership = create(:user_membership, user: user, membership_plan: plan)
      expect(user.active_membership).to eq(membership)
    end

    it "ignores expired memberships" do
      create(:user_membership, :expired, user: user, membership_plan: plan)
      expect(user.active_membership).to be_nil
    end

    it "returns the latest expiring membership when multiple are active" do
      create(:user_membership, user: user, membership_plan: plan, starts_at: 1.day.ago, expires_at: 10.days.from_now)
      later = create(:user_membership, user: user, membership_plan: plan, starts_at: 1.day.ago, expires_at: 20.days.from_now)
      expect(user.active_membership).to eq(later)
    end
  end

  describe "#has_feature?" do
    let(:user) { create(:user) }

    it "returns false when no membership exists" do
      expect(user.has_feature?("conversation")).to be false
    end

    it "returns true when active membership has the feature" do
      plan = create(:membership_plan, features: %w[conversation])
      create(:user_membership, user: user, membership_plan: plan)
      expect(user.has_feature?("conversation")).to be true
    end

    it "returns false when active membership lacks the feature" do
      plan = create(:membership_plan, features: %w[learning])
      create(:user_membership, user: user, membership_plan: plan)
      expect(user.has_feature?("conversation")).to be false
    end

    it "returns false when membership is expired" do
      plan = create(:membership_plan, features: %w[conversation])
      create(:user_membership, :expired, user: user, membership_plan: plan)
      expect(user.has_feature?("conversation")).to be false
    end
  end

  describe "password validation" do
    it "does not require password on update when not changing it" do
      user = create(:user, password: "password123")
      user.name = "Updated Name"
      expect(user).to be_valid
    end
  end
end
