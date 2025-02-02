import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("meals", (table) => {
        table.uuid("id").primary();
        table.string("name").notNullable();
        table.string("description").notNullable();
        table.boolean("in_diet").notNullable();
        table.date("date").notNullable();

        table
            .uuid("user_id")
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");

        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("meals");
}
