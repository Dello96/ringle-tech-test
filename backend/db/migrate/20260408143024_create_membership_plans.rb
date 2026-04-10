class CreateMembershipPlans < ActiveRecord::Migration[8.1]
  def change
    create_table :membership_plans do |t|
      t.string :name, null: false
      t.string :features, array: true, default: [], null: false
      t.integer :duration_days, null: false
      t.integer :price_cents, null: false
      t.text :description

      t.timestamps
    end
  end
end
