export const up = async function(knex) {
  return knex.schema.table('agent_rewards', (table) => {
    table.integer('game_id').unsigned().nullable().alter();
  });
};

export const down = async function(knex) {
  return knex.schema.table('agent_rewards', (table) => {
    table.integer('game_id').unsigned().notNullable().alter();
  });
};
