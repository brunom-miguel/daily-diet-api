import { afterAll, beforeAll, describe, expect, it, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../src/app";
import { knex } from "../src/database";
import { resetDatabase } from "./helper";

const api = supertest(app.server);

describe("Users routes", () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        resetDatabase();
    });

    it("should be able to create new user", async () => {
        const response = await api.post("/users").send({
            name: "teste",
            email: "teste@email.com",
            password: "teste123",
        });
        expect(response.status).toEqual(201);

        const user = await knex("users")
            .where({ email: "teste@email.com" })
            .first();

        expect(user).toBeDefined();
        expect(user?.name).toBe("teste");
        expect(user?.password).not.toBe("teste123");
    });

    it("should be able to get all users", async () => {
        await api.post("/users").send({
            name: "teste",
            email: "teste@email.com",
            password: "teste123",
        });

        const getUserListResponse = await api.get("/users");

        expect(getUserListResponse.status).toEqual(200);
        expect(getUserListResponse.body.users).toEqual([
            expect.objectContaining({
                name: "teste",
                email: "teste@email.com",
                password: expect.any(String),
            }),
        ]);
    });

    it("should be able to delete user", async () => {
        await api.post("/users").send({
            name: "teste",
            email: "teste@email.com",
            password: "teste123",
        });

        const getUserListResponse = await api.get("/users").send();
        const userId = getUserListResponse.body.users[0].id;

        const deleteUserResponse = await api.delete(`/users/${userId}`);

        expect(deleteUserResponse.status).toEqual(204);

        const userQuery = await knex("users")
            .where({ email: "teste@email.com" })
            .first();
        expect(userQuery).not.toBeDefined();
    });
});
