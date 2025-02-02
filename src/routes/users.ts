import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { knex } from "../database";
import { validateAuthToken } from "../middlewares/validate-auth-token";

export interface AuthenticatedUser {
    id: string;
    role: string;
}

export async function usersRoutes(app: FastifyInstance) {
    app.get("/", async (request, reply) => {
        const users = await knex("users")
            .orderBy("created_at", "desc")
            .select();

        return reply.status(200).send({
            users,
        });
    });

    app.post("/", async (request, reply) => {
        const createUserSchema = z.object({
            name: z.string(),
            email: z.string().email({ message: "Invalid email" }),
            password: z.string().min(6, {
                message: "Password should have at least 6 charactes",
            }),
        });

        const { email, name, password } = createUserSchema.parse(request.body);

        const existingUser = await knex("users").where({ email }).first();
        if (existingUser) {
            return reply.status(400).send({
                error: "Unable to create user",
            });
        }

        const hashedPassword = await app.bcrypt.hash(password);
        const user = await knex("users").insert({
            id: crypto.randomUUID(),
            name,
            email,
            password: hashedPassword,
        });

        return reply.status(201).send();
    });

    app.delete("/:id", async (request, reply) => {
        const getIdParamsSchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = getIdParamsSchema.parse(request.params);

        const existingUser = await knex("users").where({ id }).first();
        if (!existingUser) {
            return reply.status(404).send({
                error: "User not found",
            });
        }

        await knex("users").where({ id }).del();

        return reply.status(204).send();
    });
}
