import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

import {
  cleanDatabase
} from "./helpers/db.js";

import {
  registerTestUser
} from "./helpers/auth.js";

describe("Auth API", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    it("registers a new user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!"
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data.user).toMatchObject({
        name: "John Doe",
        email: "john@example.com"
      });

      expect(
        response.body.data.user.id
      ).toEqual(expect.any(String));

      expect(
        response.body.data.accessToken
      ).toEqual(expect.any(String));

      expect(
        response.body.data.refreshToken
      ).toEqual(expect.any(String));
    });

    it("rejects duplicate email", async () => {
      const user = {
        name: "John Doe",
        email: "duplicate@example.com",
        password: "Password123!"
      };

      const first = await request(app)
        .post("/api/v1/auth/register")
        .send(user);

      expect(first.status).toBe(201);

      const second = await request(app)
        .post("/api/v1/auth/register")
        .send(user);

      expect(second.status).toBe(409);

      expect(
        second.body.error.code
      ).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("rejects invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "not-an-email",
          password: "Password123!"
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("rejects weak passwords", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "123"
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in an existing user", async () => {
      await registerTestUser({
        email: "login@example.com"
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "login@example.com",
          password: "TestPassword123!"
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(
        response.body.data.accessToken
      ).toEqual(expect.any(String));

      expect(
        response.body.data.refreshToken
      ).toEqual(expect.any(String));

      expect(
        response.body.data.user.email
      ).toBe("login@example.com");
    });

    it("rejects incorrect password", async () => {
      await registerTestUser({
        email: "wrong-password@example.com"
      });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "wrong-password@example.com",
          password: "WrongPassword123!"
        });

      expect(response.status).toBe(401);

      expect(
        response.body.error.code
      ).toBe("INVALID_CREDENTIALS");
    });

    it("rejects unknown email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "does-not-exist@example.com",
          password: "Password123!"
        });

      expect(response.status).toBe(401);

      expect(
        response.body.error.code
      ).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("requires authentication", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("returns the authenticated user", async () => {
      const auth = await registerTestUser({
        name: "Authenticated User",
        email: "me@example.com"
      });

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set(
          "Authorization",
          `Bearer ${auth.accessToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(
        response.body.data.user
      ).toMatchObject({
        id: auth.user.id,
        name: "Authenticated User",
        email: "me@example.com"
      });
    });

    it("rejects an invalid access token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set(
          "Authorization",
          "Bearer invalid-token"
        );

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("refreshes an access token", async () => {
      const auth = await registerTestUser();

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken:
            auth.refreshToken
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(
        response.body.data.accessToken
      ).toEqual(expect.any(String));

      expect(
        response.body.data.refreshToken
      ).toEqual(expect.any(String));

      expect(
        response.body.data.refreshToken
      ).not.toBe(auth.refreshToken);
    });

    it("rejects a missing refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({});

      expect(response.status).toBe(400);

      expect(
        response.body.error.code
      ).toBe("REFRESH_TOKEN_REQUIRED");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out successfully", async () => {
      const auth = await registerTestUser();

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .send({
          refreshToken:
            auth.refreshToken
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
    });

    it("rejects a revoked refresh token", async () => {
      const auth = await registerTestUser();

      const first = await request(app)
        .post("/api/v1/auth/logout")
        .send({
          refreshToken:
            auth.refreshToken
        });

      expect(first.status).toBe(200);

      const second = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken:
            auth.refreshToken
        });

      expect(second.status).toBe(401);

      expect(
        second.body.error.code
      ).toBe("REFRESH_SESSION_REVOKED");
    });
  });
});