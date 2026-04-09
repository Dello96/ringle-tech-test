require "rails_helper"

RSpec.describe MembershipPlan, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:user_memberships).dependent(:restrict_with_error) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:duration_days) }
    it { is_expected.to validate_numericality_of(:duration_days).is_greater_than(0) }
    it { is_expected.to validate_presence_of(:price_cents) }
    it { is_expected.to validate_numericality_of(:price_cents).is_greater_than_or_equal_to(0) }

    context "features validation" do
      it "accepts valid features" do
        plan = build(:membership_plan, features: %w[learning conversation analysis])
        expect(plan).to be_valid
      end

      it "rejects invalid features" do
        plan = build(:membership_plan, features: %w[learning teleport])
        expect(plan).not_to be_valid
        expect(plan.errors[:features].first).to include("teleport")
      end

      it "accepts empty features" do
        plan = build(:membership_plan, features: [])
        expect(plan).to be_valid
      end
    end
  end

  describe "#has_feature?" do
    let(:plan) { build(:membership_plan, features: %w[learning conversation]) }

    it "returns true for included feature" do
      expect(plan.has_feature?(:learning)).to be true
    end

    it "returns false for excluded feature" do
      expect(plan.has_feature?(:analysis)).to be false
    end

    it "handles string arguments" do
      expect(plan.has_feature?("conversation")).to be true
    end
  end

  describe "#as_json" do
    let(:plan) { create(:membership_plan) }
    let(:json) { plan.as_json }

    it "includes expected fields" do
      expect(json.keys).to match_array(%w[id name features duration_days price_cents description created_at])
    end

    it "excludes timestamps other than created_at" do
      expect(json).not_to have_key("updated_at")
    end
  end
end
