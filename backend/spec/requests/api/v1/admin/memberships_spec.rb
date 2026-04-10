require "rails_helper"

RSpec.describe "Api::V1::Admin::Memberships", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:regular_user) { create(:user) }
  let(:plan) { create(:membership_plan, :premium) }

  describe "GET /api/v1/admin/memberships" do
    context "as admin" do
      it "returns all memberships" do
        create(:user_membership, user: regular_user, membership_plan: plan)

        get "/api/v1/admin/memberships", headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)

        json = JSON.parse(response.body)
        expect(json["memberships"].size).to eq(1)
        expect(json["memberships"][0]).to have_key("user")
        expect(json["memberships"][0]).to have_key("plan")
      end

      it "filters by user_id" do
        other_user = create(:user)
        create(:user_membership, user: regular_user, membership_plan: plan)
        create(:user_membership, user: other_user, membership_plan: plan)

        get "/api/v1/admin/memberships", headers: auth_headers(admin), params: { user_id: regular_user.id }

        json = JSON.parse(response.body)
        expect(json["memberships"].size).to eq(1)
        expect(json["memberships"][0]["user"]["id"]).to eq(regular_user.id)
      end

      it "filters by status=active" do
        create(:user_membership, user: regular_user, membership_plan: plan)
        create(:user_membership, :expired, user: create(:user), membership_plan: plan)

        get "/api/v1/admin/memberships", headers: auth_headers(admin), params: { status: "active" }

        json = JSON.parse(response.body)
        expect(json["memberships"].size).to eq(1)
      end

      it "filters by status=expired" do
        create(:user_membership, user: regular_user, membership_plan: plan)
        create(:user_membership, :expired, user: create(:user), membership_plan: plan)

        get "/api/v1/admin/memberships", headers: auth_headers(admin), params: { status: "expired" }

        json = JSON.parse(response.body)
        expect(json["memberships"].size).to eq(1)
        expect(json["memberships"][0]["active?"]).to be false
      end

      it "returns empty array when no memberships exist" do
        get "/api/v1/admin/memberships", headers: auth_headers(admin)

        json = JSON.parse(response.body)
        expect(json["memberships"]).to eq([])
      end
    end

    context "as regular user" do
      it "returns 403" do
        get "/api/v1/admin/memberships", headers: auth_headers(regular_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns 401" do
        get "/api/v1/admin/memberships"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/admin/memberships" do
    context "as admin" do
      it "creates a membership for a user" do
        expect {
          post "/api/v1/admin/memberships",
               headers: auth_headers(admin),
               params: { user_id: regular_user.id, plan_id: plan.id }
        }.to change(UserMembership, :count).by(1)

        expect(response).to have_http_status(:created)

        json = JSON.parse(response.body)
        expect(json["membership"]["plan"]["name"]).to eq(plan.name)
        expect(json["membership"]["active?"]).to be true
      end

      it "returns 404 for nonexistent user" do
        post "/api/v1/admin/memberships",
             headers: auth_headers(admin),
             params: { user_id: 0, plan_id: plan.id }

        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 for nonexistent plan" do
        post "/api/v1/admin/memberships",
             headers: auth_headers(admin),
             params: { user_id: regular_user.id, plan_id: 0 }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "as regular user" do
      it "returns 403" do
        post "/api/v1/admin/memberships",
             headers: auth_headers(regular_user),
             params: { user_id: regular_user.id, plan_id: plan.id }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/admin/memberships/:id" do
    context "as admin" do
      it "revokes a membership" do
        membership = create(:user_membership, user: regular_user, membership_plan: plan)

        expect {
          delete "/api/v1/admin/memberships/#{membership.id}", headers: auth_headers(admin)
        }.to change(UserMembership, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["message"]).to eq("Membership revoked")
      end

      it "returns 404 for nonexistent membership" do
        delete "/api/v1/admin/memberships/0", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "as regular user" do
      it "returns 403" do
        membership = create(:user_membership, user: regular_user, membership_plan: plan)

        delete "/api/v1/admin/memberships/#{membership.id}", headers: auth_headers(regular_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
