require "rails_helper"

RSpec.describe MockPaymentGateway do
  subject(:gateway) { described_class.new }

  describe "#charge" do
    context "with valid card" do
      it "returns success with transaction_id" do
        result = gateway.charge(amount_cents: 9900, card_token: "tok_visa")

        expect(result.success?).to be true
        expect(result.transaction_id).to start_with("txn_")
        expect(result.error_message).to be_nil
      end
    end

    context "with decline card number" do
      it "returns failure" do
        result = gateway.charge(amount_cents: 9900, card_token: MockPaymentGateway::DECLINE_CARD)

        expect(result.success?).to be false
        expect(result.transaction_id).to be_nil
        expect(result.error_message).to eq("Card declined")
      end
    end

    context "with invalid amount" do
      it "returns failure for zero amount" do
        result = gateway.charge(amount_cents: 0, card_token: "tok_visa")

        expect(result.success?).to be false
        expect(result.error_message).to eq("Invalid amount")
      end

      it "returns failure for negative amount" do
        result = gateway.charge(amount_cents: -100, card_token: "tok_visa")

        expect(result.success?).to be false
        expect(result.error_message).to eq("Invalid amount")
      end
    end

    context "transaction_id uniqueness" do
      it "generates unique transaction IDs" do
        ids = Array.new(5) { gateway.charge(amount_cents: 100, card_token: "tok_visa").transaction_id }
        expect(ids.uniq.size).to eq(5)
      end
    end
  end
end
