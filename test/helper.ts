import { execSync } from "node:child_process";
import TestAgent from "supertest/lib/agent";

export async function resetDatabase() {
    execSync("npm run knex -- migrate:rollback --all");
    execSync("npm run knex -- migrate:latest");
}
