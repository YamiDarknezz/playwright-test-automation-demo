import { test, expect } from "@playwright/test";
import { randomUser, registerUser } from "../helpers/api";

test.describe("Auth API", () => {
  test("register creates a user and returns a JWT", async ({ request }) => {
    const user = randomUser();

    const res = await request.post("/api/auth/register", { data: user });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.tokenType).toBe("Bearer");
    expect(body.user.username).toBe(user.username);
    expect(body.user.role).toBe("USER");
    expect(body.user.password).toBeUndefined();
  });

  test("register rejects a duplicate username with 409", async ({ request }) => {
    const user = await registerUser(request);

    const res = await request.post("/api/auth/register", { data: user });
    expect(res.status()).toBe(409);

    const body = await res.json();
    expect(body.status).toBe(409);
    expect(body.message).toContain("Username already taken");
  });

  test("register validates the payload with 400", async ({ request }) => {
    const cases = [
      { username: "x", email: "bad-email", password: "secret123" }, // short username + bad email
      { username: "validname", email: "ok@example.com", password: "short" }, // short password
      { username: "", email: "", password: "" }, // all empty
    ];

    for (const payload of cases) {
      const res = await request.post("/api/auth/register", { data: payload });
      expect(res.status(), `expected 400 for ${JSON.stringify(payload)}`).toBe(400);
      const body = await res.json();
      expect(body.status).toBe(400);
    }
  });

  test("login with valid credentials returns a token", async ({ request }) => {
    const user = await registerUser(request);

    const res = await request.post("/api/auth/login", {
      data: { username: user.username, password: user.password },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.username).toBe(user.username);
  });

  test("login with wrong password returns 401", async ({ request }) => {
    const user = await registerUser(request);

    const res = await request.post("/api/auth/login", {
      data: { username: user.username, password: "WrongPass999" },
    });
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.status).toBe(401);
  });

  test("login with unknown user returns 401", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { username: "ghost", password: "Whatever123" },
    });
    expect(res.status()).toBe(401);
  });
});
