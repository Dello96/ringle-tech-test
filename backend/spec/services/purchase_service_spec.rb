require "rails_helper"

RSpec.describe PurchaseService do
  let(:user) { create(:user) }
  let(:plan) { create(:membership_plan, duration_days: 30, price_cents: 9900) }

  describe "#call" do
    context "with successful payment" do
      it "creates a membership and returns transaction_id" do
        result = described_class.new.call(user: user, plan: plan, card_token: "tok_visa")

        expect(result[:membership]).to be_a(UserMembership)
        expect(result[:membership]).to be_persisted
        expect(result[:membership].membership_plan).to eq(plan)
        expect(result[:membership].user).to eq(user)
        expect(result[:transaction_id]).to start_with("txn_")
      end

      it "sets correct membership dates" do
        freeze_time do
          result = described_class.new.call(user: user, plan: plan, card_token: "tok_visa")

          expect(result[:membership].starts_at).to be_within(1.second).of(Time.current)
          expect(result[:membership].expires_at).to be_within(1.second).of(30.days.from_now)
        end
      end

      it "increments user memberships count" do
        expect {
          described_class.new.call(user: user, plan: plan, card_token: "tok_visa")
        }.to change { user.user_memberships.count }.by(1)
      end
    end

    context "with declined card" do
      it "raises PurchaseError" do
        expect {
          described_class.new.call(
            user: user,
            plan: plan,
            card_token: MockPaymentGateway::DECLINE_CARD
          )
        }.to raise_error(PurchaseService::PurchaseError, "Card declined")
      end

      it "does not create a membership" do
        expect {
          described_class.new.call(
            user: user,
            plan: plan,
            card_token: MockPaymentGateway::DECLINE_CARD
          ) rescue nil
        }.not_to change(UserMembership, :count)
      end
    end

    context "with custom gateway" do
      it "uses the injected gateway" do
        fake_gateway = instance_double(MockPaymentGateway)
        allow(fake_gateway).to receive(:charge).and_return(
          MockPaymentGateway::Result.new(success?: true, transaction_id: "txn_custom", error_message: nil)
        )

        result = described_class.new(gateway: fake_gateway).call(
          user: user, plan: plan, card_token: "tok_any"
        )

        expect(result[:transaction_id]).to eq("txn_custom")
        expect(fake_gateway).to have_received(:charge).with(
          amount_cents: 9900,
          card_token: "tok_any",
          description: "Basic Plan for #{user.email}"
        )
      end
    end
  end
end
