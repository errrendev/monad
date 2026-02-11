export const up = (knex) => {
    return knex.schema.table("game_properties", (table) => {
        table.integer("development").notNullable().defaultTo(0);
    });
};

export const down = (knex) => {
    return knex.schema.table("game_properties", (table) => {
        table.dropColumn("development");
    });
};
