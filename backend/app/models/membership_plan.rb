class MembershipPlan < ApplicationRecord
  VALID_FEATURES = %w[learning conversation analysis].freeze

  has_many :user_memberships, dependent: :restrict_with_error

  validates :name, presence: true
  validates :duration_days, presence: true, numericality: { greater_than: 0 }
  validates :price_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :features_must_be_valid

  def has_feature?(feature)
    features.include?(feature.to_s)
  end

  def as_json(options = {})
    super(options.merge(only: %i[id name features duration_days price_cents description created_at]))
  end

  private

  def features_must_be_valid
    return if features.blank?

    invalid = features - VALID_FEATURES
    errors.add(:features, "contain invalid values: #{invalid.join(', ')}") if invalid.any?
  end
end
