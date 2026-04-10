Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login",    to: "auth#login"
      get  "auth/me",       to: "auth#me"

      resources :plans, only: :index

      namespace :admin do
        resources :users, only: :index
        resources :memberships, only: %i[index create update destroy]
      end

      resources :purchases, only: :create

      resources :conversations, only: %i[index show create] do
        resources :messages, only: :create
      end
    end
  end
end
