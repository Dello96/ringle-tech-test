require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.1

    config.autoload_lib(ignore: %w[assets tasks])

    config.time_zone = "UTC"

    config.active_storage.resolve_model_to_route = :rails_storage_proxy

    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot, dir: "spec/factories"
    end
  end
end
