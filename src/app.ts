import fastify from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import fastifyJwt from "fastify-jwt";

import { usersRoutes } from "./routes/users";
import { tokenRoutes } from "./routes/token";
import { mealsRoutes } from "./routes/meals";
import { env } from "./env";

export const app = fastify();
app.register(fastifyJwt, {
    secret: env.TOKEN_SECRET,
    sign: { expiresIn: env.TOKEN_EXPIRATION },
});
app.register(fastifyBcrypt, {
    saltWorkFactor: 10,
});
app.register(tokenRoutes, {
    prefix: "token",
});
app.register(usersRoutes, {
    prefix: "users",
});
app.register(mealsRoutes, {
    prefix: "meals",
});
