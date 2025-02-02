import { FastifyRequest, FastifyReply } from "fastify";
import { knex } from "../database";
import { AuthenticatedUser } from "../routes/users";

export async function validateAuthToken(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        await request.jwtVerify();
        const { id } = request.user as AuthenticatedUser;
        const user = knex("users").where({ id });
        if (!user) {
            return reply.status(401).send({
                error: "Invalid token",
            });
        }
    } catch (error) {
        return reply.status(401).send({
            error: "Invalid token",
        });
    }
}
