require "rails_helper"

RSpec.describe "Api::V1::Purchases", type: :request do
  let(:user) { create(:user) }
  let(:plan) { create(:membership_plan, price_cents: 9900, duration_days: 30) }

  describe "POST /api/v1/purchases" do
    context "with valid payment" do
      it "creates a membership and returns transaction" do
        expect {
          post "/api/v1/purchases",
               headers: auth_headers(user),
               params: { plan_id: plan.id, card_token: "tok_visa" }
        }.to change(UserMembership, :count).by(1)

        expect(response).to have_http_status(:created)

        json = JSON.parse(response.body)
        expect(json["membership"]["active?"]).to be true
        expect(json["membership"]["plan"]["id"]).to eq(plan.id)
        expect(json["transaction_id"]).to start_with("txn_")
      end

      it "sets correct expiration" do
        freeze_time do
          post "/api/v1/purchases",
               headers: auth_headers(user),
               params: { plan_id: plan.id, card_token: "tok_visa" }

          json = JSON.parse(response.body)
          expires_at = Time.parse(json["membership"]["expires_at"])
          expect(expires_at).to be_within(2.seconds).of(30.days.from_now)
        end
      end
    end

    context "with declined card" do
      it "returns 402 payment required" do
        expect {
          post "/api/v1/purchases",
               headers: auth_headers(user),
               params: { plan_id: plan.id, card_token: MockPaymentGateway::DECLINE_CARD }
        }.not_to change(UserMembership, :count)

        expect(response).to have_http_status(:payment_required)
        expect(JSON.parse(response.body)["error"]).to eq("Card declined")
      end
    end

    context "with nonexistent plan" do
      it "returns 404" do
        post "/api/v1/purchases",
             headers: auth_headers(user),
             params: { plan_id: 0, card_token: "tok_visa" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "without authentication" do
      it "returns 401" do
        post "/api/v1/purchases",
             params: { plan_id: plan.id, card_token: "tok_visa" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
