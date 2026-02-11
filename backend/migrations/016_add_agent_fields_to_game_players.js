export const up = (knex) => {
  return knex.schema.table("game_players", (table) => {
    table.integer("agent_id").unsigned().nullable();
    table.boolean("is_ai").nullable().defaultTo(false);
    table.foreign("agent_id").references("agents.id").onDelete("SET NULL");
  });
};

export const down = (knex) => {
  return knex.schema.table("game_players", (table) => {
    table.dropForeign("agent_id");
    table.dropColumn("agent_id");
    table.dropColumn("is_ai");
  });
};