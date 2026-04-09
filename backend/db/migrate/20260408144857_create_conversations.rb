class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :topic, null: false
      t.integer :messages_count, null: false, default: 0

      t.timestamps
    end
  end
end
