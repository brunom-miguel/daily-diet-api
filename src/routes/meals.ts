import { FastifyInstance } from "fastify";
import { date, z } from "zod";
import { knex } from "../database";
import { validateAuthToken } from "../middlewares/validate-auth-token";
import { AuthenticatedUser } from "./users";

export async function mealsRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: [validateAuthToken],
        },
        async (request, reply) => {
            const { id: userId } = request.user as AuthenticatedUser;

            const meals = await knex("meals")
                .where({
                    user_id: userId,
                })
                .orderBy("date", "desc");

            return reply.status(200).send({
                meals,
            });
        },
    );

    app.get(
        "/:id",
        {
            preHandler: [validateAuthToken],
        },
        async (request, reply) => {
            const { id: userId } = request.user as AuthenticatedUser;

            const getMealIdParamsSchema = z.object({
                id: z.string().uuid(),
            });
            const { id } = getMealIdParamsSchema.parse(request.params);

            const query = knex("meals").where({ id, user_id: userId });

            const meal = await query.first();
            if (!meal) {
                return reply.status(404).send({
                    error: "Meal not found",
                });
            }

            return reply.status(200).send({
                meal,
            });
        },
    );

    app.get(
        "/metrics",
        { preHandler: [validateAuthToken] },
        async (request, reply) => {
            const { id: userId } = request.user as AuthenticatedUser;

            const totalMeals = await knex("meals")
                .where({
                    user_id: userId,
                })
                .count("*", { as: "total" })
                .first();

            const mealsOutDiet = await knex("meals")
                .where({
                    user_id: userId,
                    in_diet: false,
                })
                .count("*", { as: "total" })
                .first();

            const mealsInDiet = await knex("meals")
                .where({
                    user_id: userId,
                    in_diet: true,
                })
                .count("*", { as: "total" })
                .first();

            const meals = await knex("meals")
                .where({
                    user_id: userId,
                })
                .orderBy("date", "desc")
                .select();

            const { currentInDietStreak, bestStreak } = meals.reduce(
                (acc, meal) => {
                    if (meal.in_diet) {
                        acc.currentStreak += 1;
                        if (!acc.foundOutDietMeal) {
                            acc.currentInDietStreak += 1;
                        }
                    } else {
                        acc.currentStreak = 0;
                        acc.foundOutDietMeal = true;
                    }

                    if (acc.currentStreak > acc.bestStreak) {
                        acc.bestStreak = acc.currentStreak;
                    }

                    return acc;
                },
                {
                    currentStreak: 0,
                    bestStreak: 0,
                    currentInDietStreak: 0,
                    foundOutDietMeal: false,
                },
            );

            return reply.status(200).send({
                totalMeals: totalMeals?.total || 0,
                mealsInDiet: mealsInDiet?.total || 0,
                mealsOutDiet: mealsOutDiet?.total || 0,
                bestStreak,
                currentInDietStreak,
            });
        },
    );

    app.post(
        "/",
        {
            preHandler: [validateAuthToken],
        },
        async (request, reply) => {
            const { id: userID } = request.user as AuthenticatedUser;

            const createMealSchema = z.object({
                name: z.string(),
                description: z.string(),
                in_diet: z.boolean(),
                date: z.coerce.date(), // 2025-02-01T15:30:00.000Z
            });

            const { name, description, in_diet, date } = createMealSchema.parse(
                request.body,
            );

            const meal = await knex("meals").insert({
                id: crypto.randomUUID(),
                name,
                description,
                in_diet,
                date: date.getTime(),
                user_id: userID,
            });

            return reply.status(201).send();
        },
    );

    app.put(
        "/:id",
        {
            preHandler: [validateAuthToken],
        },
        async (request, reply) => {
            const { id: userId } = request.user as AuthenticatedUser;

            const getMealParamsSchema = z.object({
                id: z.string().uuid(),
            });

            const { id } = getMealParamsSchema.parse(request.params);

            const updateMealSchema = z
                .object({
                    name: z.string().optional(),
                    description: z.string().optional(),
                    in_diet: z.boolean().optional(),
                    date: z.date().optional(),
                })
                .refine(
                    (data) => {
                        return Object.values(data).some(
                            (value) => value !== undefined && value !== "",
                        );
                    },
                    {
                        message:
                            "At least one field must be provided for update",
                    },
                );

            const { name, description, in_diet, date } = updateMealSchema.parse(
                request.body,
            );

            const updated = await knex("meals")
                .update({
                    name,
                    in_diet,
                    date: date?.getTime(),
                    description,
                })
                .where({
                    id,
                    user_id: userId,
                });

            return reply.status(204).send();
        },
    );

    app.delete(
        "/:id",
        {
            preHandler: [validateAuthToken],
        },
        async (request, reply) => {
            const { id: userId } = request.user as AuthenticatedUser;

            const getMealIdParamsSchema = z.object({
                id: z.string().uuid(),
            });
            const { id } = getMealIdParamsSchema.parse(request.params);

            const query = knex("meals").where({ id, user_id: userId });

            const deleted = await query.del();
            if (deleted === 0) {
                reply.status(404).send({
                    error: "Meal not found",
                });
            }

            return reply.status(204).send();
        },
    );
}
