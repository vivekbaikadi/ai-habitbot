import request from "supertest";

import app from "../../src/app.js";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
  };

  accessToken: string;
  refreshToken: string;
}

export async function registerTestUser(
  overrides: Partial<TestUser> = {}
): Promise<AuthResult> {
  const user: TestUser = {
    name: "Test User",

    email:
      overrides.email ??
      `test-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}@example.com`,

    password:
      overrides.password ??
      "TestPassword123!"
  };

  if (overrides.name !== undefined) {
    user.name = overrides.name;
  }

  const response = await request(app)
    .post("/api/v1/auth/register")
    .send(user);

  if (response.status !== 201) {
    throw new Error(
      `Test user registration failed: ${JSON.stringify(
        response.body
      )}`
    );
  }

  return response.body.data as AuthResult;
}