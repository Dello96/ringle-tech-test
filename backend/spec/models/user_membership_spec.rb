require "rails_helper"

RSpec.describe UserMembership, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:membership_plan) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:starts_at) }
    it { is_expected.to validate_presence_of(:expires_at) }

    it "requires expires_at after starts_at" do
      membership = build(:user_membership, starts_at: Time.current, expires_at: 1.day.ago)
      expect(membership).not_to be_valid
      expect(membership.errors[:expires_at]).to include("must be after starts_at")
    end
  end

  describe "scopes" do
    let!(:active_membership) { create(:user_membership) }
    let!(:expired_membership) { create(:user_membership, :expired) }
    let!(:future_membership) { create(:user_membership, :future) }

    it ".active returns only currently active memberships" do
      expect(UserMembership.active).to contain_exactly(active_membership)
    end
  end

  describe "#active?" do
    it "returns true for current membership" do
      membership = build(:user_membership, starts_at: 1.day.ago, expires_at: 29.days.from_now)
      expect(membership.active?).to be true
    end

    it "returns false for expired membership" do
      membership = build(:user_membership, :expired)
      expect(membership.active?).to be false
    end

    it "returns false for future membership" do
      membership = build(:user_membership, :future)
      expect(membership.active?).to be false
    end
  end

  describe "#expired?" do
    it "returns true when expires_at is in the past" do
      membership = build(:user_membership, :expired)
      expect(membership.expired?).to be true
    end

    it "returns false when expires_at is in the future" do
      membership = build(:user_membership)
      expect(membership.expired?).to be false
    end
  end

  describe "#has_feature?" do
    let(:plan) { build(:membership_plan, :premium) }

    it "returns true for active membership with feature" do
      membership = build(:user_membership, membership_plan: plan, starts_at: 1.day.ago, expires_at: 29.days.from_now)
      expect(membership.has_feature?(:conversation)).to be true
    end

    it "returns false for expired membership even with feature" do
      membership = build(:user_membership, :expired, membership_plan: plan)
      expect(membership.has_feature?(:conversation)).to be false
    end

    it "returns false for active membership without feature" do
      basic_plan = build(:membership_plan, features: %w[learning])
      membership = build(:user_membership, membership_plan: basic_plan, starts_at: 1.day.ago, expires_at: 29.days.from_now)
      expect(membership.has_feature?(:conversation)).to be false
    end
  end

  describe "#remaining_days" do
    it "returns positive days for active membership" do
      membership = build(:user_membership, starts_at: Time.current, expires_at: 15.days.from_now)
      expect(membership.remaining_days).to eq(15)
    end

    it "returns 0 for expired membership" do
      membership = build(:user_membership, :expired)
      expect(membership.remaining_days).to eq(0)
    end
  end

  describe "#as_json" do
    let(:membership) { create(:user_membership) }
    let(:json) { membership.as_json }

    it "includes expected fields" do
      expect(json.keys).to match_array(%w[id starts_at expires_at created_at active? remaining_days plan])
    end

    it "nests plan data" do
      expect(json["plan"]).to have_key("name")
      expect(json["plan"]).to have_key("features")
    end
  end
end
