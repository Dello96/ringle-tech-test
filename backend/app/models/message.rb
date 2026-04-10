class Message < ApplicationRecord
  belongs_to :conversation, counter_cache: true

  has_one_attached :audio

  enum :role, { user: 0, assistant: 1, system: 2 }

  validates :role, presence: true
  validates :content, presence: true, unless: :user?

  def audio_url
    return nil unless audio.attached?

    Rails.application.routes.url_helpers.rails_storage_proxy_path(audio, only_path: true)
  end

  def as_json(options = {})
    super(options.merge(only: %i[id role content created_at])).merge(
      "audio_url" => audio_url
    )
  end
end
