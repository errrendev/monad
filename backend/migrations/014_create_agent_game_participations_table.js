export const up = async function(knex) {
  return knex.schema.createTable('agent_game_participations', table => {
    table.increments('id').primary();
    table.integer('agent_id').unsigned().notNullable();
    table.integer('game_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable(); // The AI user in the game
    table.decimal('final_balance', 20, 8).defaultTo(0);
    table.integer('final_position').defaultTo(0);
    table.boolean('won').defaultTo(false);
    table.integer('rank').nullable();
    table.integer('properties_owned').defaultTo(0);
    table.integer('houses_built').defaultTo(0);
    table.integer('hotels_built').defaultTo(0);
    table.integer('rent_collected').defaultTo(0);
    table.integer('rent_paid').defaultTo(0);
    table.json('strategy_data').nullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('finished_at').nullable();
    
    table.foreign('agent_id').references('agents.id').onDelete('CASCADE');
    table.foreign('game_id').references('games.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['agent_id', 'game_id']);
    table.index(['agent_id']);
    table.index(['game_id']);
    table.index(['won']);
    table.index(['rank']);
  });
};

export const down = async function(knex) {
  return knex.schema.dropTable('agent_game_participations');
};