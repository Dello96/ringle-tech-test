class User < ApplicationRecord
  has_secure_password
  has_secure_token :auth_token

  has_many :user_memberships, dependent: :destroy
  has_many :conversations, dependent: :destroy

  enum :role, { user: 0, admin: 1 }

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, if: :password_required?

  normalizes :email, with: ->(email) { email.strip.downcase }

  def active_membership
    user_memberships.active.order(expires_at: :desc).first
  end

  def has_feature?(feature)
    active_membership&.has_feature?(feature) || false
  end

  def as_json(options = {})
    super(options.merge(only: %i[id email name role created_at]))
  end

  private

  def password_required?
    new_record? || password.present?
  end
end
