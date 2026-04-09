Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173")

    resource "/api/*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[Authorization]

    resource "/rails/active_storage/*",
      headers: :any,
      methods: %i[get options head]
  end
end
