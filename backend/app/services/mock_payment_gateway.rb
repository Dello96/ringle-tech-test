class MockPaymentGateway
  DECLINE_CARD = "4000000000000002"

  Result = Struct.new(:success?, :transaction_id, :error_message, keyword_init: true)

  def charge(amount_cents:, card_token:, description: nil)
    if card_token == DECLINE_CARD
      Result.new(success?: false, transaction_id: nil, error_message: "Card declined")
    elsif amount_cents <= 0
      Result.new(success?: false, transaction_id: nil, error_message: "Invalid amount")
    else
      Result.new(success?: true, transaction_id: "txn_#{SecureRandom.hex(12)}", error_message: nil)
    end
  end
end
