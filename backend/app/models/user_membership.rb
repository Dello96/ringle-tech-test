class UserMembership < ApplicationRecord
  belongs_to :user
  belongs_to :membership_plan

  validates :starts_at, presence: true
  validates :expires_at, presence: true
  validate :expires_after_starts

  scope :active, -> { where("starts_at <= ? AND expires_at > ?", Time.current, Time.current) }

  def active?
    starts_at <= Time.current && expires_at > Time.current
  end

  def expired?
    expires_at <= Time.current
  end

  def has_feature?(feature)
    active? && membership_plan.has_feature?(feature)
  end

  def remaining_days
    return 0 if expired?

    (expires_at.to_date - Date.current).to_i
  end

  def as_json(options = {})
    super(options.merge(
      only: %i[id starts_at expires_at created_at],
      methods: %i[active? remaining_days]
    )).merge("plan" => membership_plan.as_json)
  end

  private

  def expires_after_starts
    return if starts_at.blank? || expires_at.blank?

    errors.add(:expires_at, "must be after starts_at") if expires_at <= starts_at
  end
end
