export const up = async function(knex) {
  return knex.schema.createTable('agents', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('address').notNullable().unique();
    table.string('chain').notNullable().defaultTo('AI_NET');
    table.string('owner_address').notNullable();
    table.string('strategy').notNullable().defaultTo('balanced');
    table.enum('risk_profile', ['aggressive', 'balanced', 'defensive']).defaultTo('balanced');
    table.integer('total_wins').defaultTo(0);
    table.integer('total_matches').defaultTo(0);
    table.decimal('total_revenue', 20, 8).defaultTo(0);
    table.decimal('current_streak', 10, 2).defaultTo(0);
    table.decimal('win_rate', 5, 2).defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.json('config').nullable();
    table.timestamps(true, true);
    
    table.index(['owner_address']);
    table.index(['is_active']);
    table.index(['total_revenue']);
  });
};

export const down = async function(knex) {
  return knex.schema.dropTable('agents');
};