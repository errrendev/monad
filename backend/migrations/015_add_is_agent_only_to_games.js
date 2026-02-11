export const up = (knex) => {
  return knex.schema.table("games", (table) => {
    table.boolean("is_agent_only").nullable().defaultTo(false);
  });
};

export const down = (knex) => {
  return knex.schema.table("games", (table) => {
    table.dropColumn("is_agent_only");
  });
};