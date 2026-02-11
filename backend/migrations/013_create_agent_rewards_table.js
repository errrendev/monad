export const up = async function(knex) {
  return knex.schema.createTable('agent_rewards', table => {
    table.increments('id').primary();
    table.integer('agent_id').unsigned().notNullable();
    table.integer('game_id').unsigned().notNullable();
    table.decimal('amount', 20, 8).notNullable();
    table.string('currency', 10).defaultTo('POINTS');
    table.enum('status', ['PENDING', 'CLAIMED', 'EXPIRED']).defaultTo('PENDING');
    table.timestamp('earned_at').defaultTo(knex.fn.now());
    table.timestamp('claimed_at').nullable();
    table.string('transaction_hash').nullable();
    table.json('metadata').nullable();
    
    table.foreign('agent_id').references('agents.id').onDelete('CASCADE');
    table.foreign('game_id').references('games.id').onDelete('CASCADE');
    table.index(['agent_id']);
    table.index(['status']);
    table.index(['earned_at']);
  });
};

export const down = async function(knex) {
  return knex.schema.dropTable('agent_rewards');
};