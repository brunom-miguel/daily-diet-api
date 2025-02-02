import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "../src/app";
import { resetDatabase } from "./helper";
import { knex } from "../src/database";

const api = supertest(app.server);

describe("Melas routes", () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        resetDatabase();
        await api
            .post("/users")
            .send({
                name: "teste",
                email: "teste@email.com",
                password: "teste123",
            })
            .expect(201);
    });

    it("should create user's meal", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        const response = await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: true,
                date: new Date(),
            });

        expect(response.status).toEqual(201);
    });

    it("should get user's meals", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: false,
                date: new Date(),
            })
            .expect(201);

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "empada",
                description: "empada de palmito",
                in_diet: false,
                date: new Date(),
            })
            .expect(201);

        const getMealsListResponse = await api
            .get("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        expect(getMealsListResponse.status).toEqual(200);
        expect(getMealsListResponse.body.meals).toHaveLength(2);
        expect(getMealsListResponse.body.meals).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    description: expect.any(String),
                    in_diet: expect.any(Number),
                    date: expect.any(Number),
                    user_id: expect.any(String),
                    created_at: expect.any(String),
                    updated_at: expect.any(String),
                }),
            ]),
        );
    });

    it("should get user's specific meal", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: false,
                date: new Date(),
            })
            .expect(201);

        const getMealsListResponse = await api
            .get("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        const mealId = getMealsListResponse.body.meals[0].id;

        const getSpecificMealResponse = await api
            .get(`/meals/${mealId}`)
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        expect(getSpecificMealResponse.status).toEqual(200);
        expect(getSpecificMealResponse.body.meal).toEqual(
            expect.objectContaining({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: 0,
            }),
        );
    });

    it("should update user's specific meal", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        const mealDate = new Date();

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: false,
                date: mealDate,
            })
            .expect(201);

        const getMealsListResponse = await api
            .get("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        const mealId = getMealsListResponse.body.meals[0].id;

        const updateSpecificMeal = await api
            .put(`/meals/${mealId}`)
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "lasanha",
                description: "lasanha de brocolis",
            });

        expect(updateSpecificMeal.status).toEqual(204);

        const updatedMeal = await knex("meals").where({ id: mealId }).first();

        expect(updatedMeal?.name).toEqual("lasanha");
        expect(updatedMeal?.description).toEqual("lasanha de brocolis");
        expect(updatedMeal?.date).toEqual(mealDate.getTime());
    });

    it("should delete user's specific meal", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: false,
                date: new Date(),
            })
            .expect(201);

        const getMealsListResponse = await api
            .get("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        const mealId = getMealsListResponse.body.meals[0].id;

        const deleteUserResponse = await api
            .delete(`/meals/${mealId}`)
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        expect(deleteUserResponse.status).toEqual(204);

        const meal = await knex("meals").where({ id: mealId }).first();

        expect(meal).not.toBeDefined();
    });

    it("should get user's meals metrics", async () => {
        const getTokenResponse = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "pastel",
                description: "pastel de brocolis",
                in_diet: false,
                date: new Date(),
            })
            .expect(201);

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "salada",
                description: "salada de tomate",
                in_diet: true,
                date: new Date(),
            })
            .expect(201);

        await api
            .post("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`)
            .send({
                name: "ala minuta",
                description: "arroz, feijão, frango e ovo",
                in_diet: true,
                date: new Date(),
            })
            .expect(201);

        const getList = await api
            .get("/meals")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        const getMetricsResponse = await api
            .get("/meals/metrics")
            .set("Authorization", `Bearer ${getTokenResponse.body.token}`);

        expect(getMetricsResponse.status).toEqual(200);
        expect(getMetricsResponse.body).toEqual({
            totalMeals: 3,
            mealsInDiet: 2,
            mealsOutDiet: 1,
            bestStreak: 2,
            currentInDietStreak: 2,
        });
    });
});
