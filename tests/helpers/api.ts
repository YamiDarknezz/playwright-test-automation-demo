import { APIRequestContext, expect } from "@playwright/test";

export interface User {
  username: string;
  email: string;
  password: string;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
}

const uniqueSuffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function randomUser(): User {
  const suffix = uniqueSuffix();
  return {
    username: `user_${suffix}`,
    email: `user_${suffix}@example.com`,
    password: "TestPass123",
  };
}

export function randomProductName(): string {
  return `Playwright Product ${uniqueSuffix()}`;
}

export async function registerUser(request: APIRequestContext, user?: User) {
  const payload = user ?? randomUser();
  const res = await request.post("/api/auth/register", { data: payload });
  expect(res.status(), `register should succeed for ${payload.username}`).toBe(201);
  return payload;
}

export async function login(request: APIRequestContext, username: string, password: string) {
  const res = await request.post("/api/auth/login", { data: { username, password } });
  expect(res.status(), "login should return 200").toBe(200);
  const body = await res.json();
  return body.token as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** ADMIN + USER credentials seeded by the inventory-api dev profile. */
export const seeded = {
  admin: { username: "admin", password: "admin123" },
  user: { username: "demo", password: "demo1234" },
};

export async function createProduct(request: APIRequestContext, token: string, product: Product) {
  const res = await request.post("/api/products", {
    headers: authHeader(token),
    data: product,
  });
  expect(res.status(), "create product should return 201").toBe(201);
  return res.json() as Promise<Product>;
}
