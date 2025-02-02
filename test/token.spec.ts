import { afterAll, beforeAll, describe, it, beforeEach, expect } from "vitest";
import supertest from "supertest";
import { app } from "../src/app";
import { execSync } from "node:child_process";

const api = supertest(app.server);

describe("Token routes", () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        execSync("npm run knex -- migrate:rollback --all");
        execSync("npm run knex -- migrate:latest");
        await api
            .post("/users")
            .send({
                name: "teste",
                email: "teste@email.com",
                password: "teste123",
            })
            .expect(201);
    });

    it("should generate new token when user data is correct", async () => {
        const response = await api.post("/token").send({
            email: "teste@email.com",
            password: "teste123",
        });

        expect(response.body).toEqual({
            token: expect.any(String),
        });
    });

    it("should not generate new token when email is incorrect", async () => {
        const response = await api.post("/token").send({
            email: "incorrect@email.com",
            password: "teste123",
        });

        expect(response.status).toEqual(400);
    });

    it("should not generate new token when password is incorrect", async () => {
        const response = await api.post("/token").send({
            email: "teste@email.com",
            password: "incorrect",
        });

        expect(response.status).toEqual(400);
    });
});
