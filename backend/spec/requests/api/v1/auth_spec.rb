require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/register" do
    let(:valid_params) { { email: "new@example.com", password: "password123", name: "Test User" } }

    context "with valid params" do
      it "creates a user and returns user info" do
        expect { post "/api/v1/auth/register", params: valid_params }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)

        json = JSON.parse(response.body)
        expect(json["user"]["email"]).to eq("new@example.com")
        expect(json["user"]["name"]).to eq("Test User")
        expect(json["user"]["role"]).to eq("user")

        expect(json["user"]).not_to have_key("password_digest")
        expect(json["user"]).not_to have_key("auth_token")
      end
    end

    context "with duplicate email" do
      before { create(:user, email: "new@example.com") }

      it "returns 422" do
        post "/api/v1/auth/register", params: valid_params

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["error"]).to include("Email")
      end
    end

    context "with missing fields" do
      it "returns 422 when email is missing" do
        post "/api/v1/auth/register", params: { password: "password123", name: "Test" }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "returns 422 when name is missing" do
        post "/api/v1/auth/register", params: { email: "a@b.com", password: "password123" }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["error"]).to include("Name")
      end

      it "returns 422 when password is too short" do
        post "/api/v1/auth/register", params: { email: "a@b.com", password: "short", name: "Test" }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["error"]).to include("Password")
      end
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "login@example.com", password: "password123") }

    context "with valid credentials" do
      it "returns user and token" do
        post "/api/v1/auth/login", params: { email: "login@example.com", password: "password123" }

        expect(response).to have_http_status(:ok)

        json = JSON.parse(response.body)
        expect(json["user"]["email"]).to eq("login@example.com")
        expect(json["token"]).to eq(user.auth_token)
      end
    end

    context "with wrong password" do
      it "returns 401" do
        post "/api/v1/auth/login", params: { email: "login@example.com", password: "wrongpassword" }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Invalid email or password")
      end
    end

    context "with nonexistent email" do
      it "returns 401" do
        post "/api/v1/auth/login", params: { email: "nobody@example.com", password: "password123" }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Invalid email or password")
      end
    end

    context "with case-insensitive email" do
      it "finds the correct user and returns valid token" do
        post "/api/v1/auth/login", params: { email: "LOGIN@Example.COM", password: "password123" }

        expect(response).to have_http_status(:ok)

        json = JSON.parse(response.body)
        expect(json["user"]["email"]).to eq("login@example.com")
        expect(json["token"]).to eq(user.auth_token)
      end
    end
  end

  describe "GET /api/v1/auth/me" do
    context "with valid token" do
      let(:user) { create(:user) }

      it "returns current user info with nil membership when none exists" do
        get "/api/v1/auth/me", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        json = JSON.parse(response.body)
        expect(json["user"]["id"]).to eq(user.id)
        expect(json["user"]["email"]).to eq(user.email)
        expect(json["membership"]).to be_nil
      end

      it "includes active membership when one exists" do
        plan = create(:membership_plan, :premium)
        create(:user_membership, user: user, membership_plan: plan)

        get "/api/v1/auth/me", headers: auth_headers(user)

        json = JSON.parse(response.body)
        expect(json["membership"]).not_to be_nil
        expect(json["membership"]["active?"]).to be true
        expect(json["membership"]["plan"]["name"]).to eq("Premium Plan")
        expect(json["membership"]["remaining_days"]).to be > 0
      end

      it "returns nil membership when membership is expired" do
        plan = create(:membership_plan)
        create(:user_membership, :expired, user: user, membership_plan: plan)

        get "/api/v1/auth/me", headers: auth_headers(user)

        json = JSON.parse(response.body)
        expect(json["membership"]).to be_nil
      end
    end

    context "without token" do
      it "returns 401" do
        get "/api/v1/auth/me"

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Unauthorized")
      end
    end

    context "with invalid token" do
      it "returns 401" do
        get "/api/v1/auth/me", headers: { "Authorization" => "Bearer invalidtoken123" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
