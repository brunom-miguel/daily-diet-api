import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";

export async function tokenRoutes(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
        const getUserAcessSchema = z.object({
            email: z.string(),
            password: z.string(),
        });

        const { email, password } = getUserAcessSchema.parse(request.body);

        const user = await knex("users").where({ email }).first();

        if (!user) {
            return reply.status(400).send({
                error: "Invalid data",
            });
        }

        const isValidPassword = await app.bcrypt.compare(
            password,
            user.password,
        );
        if (!isValidPassword) {
            return reply.status(400).send({
                error: "Invalid data",
            });
        }

        const token = app.jwt.sign({
            id: user.id,
        });

        return reply.status(200).send({
            token,
        });
    });
}
