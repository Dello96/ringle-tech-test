require "rails_helper"

RSpec.describe "Api::V1::Plans", type: :request do
  describe "GET /api/v1/plans" do
    it "returns plans ordered by price" do
      premium = create(:membership_plan, :premium, price_cents: 29900)
      basic = create(:membership_plan, name: "Basic", price_cents: 9900, features: %w[learning])

      get "/api/v1/plans"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json["plans"].size).to eq(2)
      expect(json["plans"][0]["name"]).to eq("Basic")
      expect(json["plans"][1]["name"]).to eq("Premium Plan")
    end

    it "does not require authentication" do
      get "/api/v1/plans"

      expect(response).to have_http_status(:ok)
    end

    it "returns empty array when no plans exist" do
      get "/api/v1/plans"

      json = JSON.parse(response.body)
      expect(json["plans"]).to eq([])
    end

    it "includes expected fields in each plan" do
      create(:membership_plan)

      get "/api/v1/plans"

      json = JSON.parse(response.body)
      plan = json["plans"].first
      expect(plan.keys).to match_array(%w[id name features duration_days price_cents description created_at])
    end
  end
end
