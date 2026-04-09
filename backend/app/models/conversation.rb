class Conversation < ApplicationRecord
  TOPICS = [
    "Travel and Vacation",
    "Food and Cooking",
    "Technology and Innovation",
    "Health and Fitness",
    "Movies and Entertainment",
    "Career and Work Life",
    "Education and Learning",
    "Environment and Sustainability"
  ].freeze

  MAX_MESSAGES = 20

  belongs_to :user
  has_many :messages, dependent: :destroy

  validates :topic, presence: true

  def self.random_topic
    TOPICS.sample
  end

  def message_limit_reached?
    messages_count >= MAX_MESSAGES
  end

  def as_json(options = {})
    super(options.merge(
      only: %i[id topic messages_count created_at]
    ))
  end
end
