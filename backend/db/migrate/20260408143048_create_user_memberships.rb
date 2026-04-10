class CreateUserMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :user_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :membership_plan, null: false, foreign_key: true
      t.datetime :starts_at, null: false
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :user_memberships, %i[user_id expires_at]
  end
end
