import { test, expect } from "@playwright/test";
import {
  authHeader,
  createProduct,
  randomProductName,
  registerAndLogin,
  registerUser,
  seeded,
} from "../helpers/api";

test.describe("Products API", () => {
  test.describe("as ADMIN", () => {
    test("full CRUD lifecycle: create, read, update, delete", async ({ request }) => {
      const token = await loginAsAdmin(request);

      // create
      const created = await createProduct(request, token, {
        name: randomProductName(),
        description: "Created by Playwright",
        price: 29.99,
      });
      expect(created.id).toBeTruthy();

      // read
      const found = await request.get(`/api/products/${created.id}`, {
        headers: authHeader(token),
      });
      expect(found.status()).toBe(200);
      expect((await found.json()).name).toBe(created.name);

      // update
      const updated = await request.put(`/api/products/${created.id}`, {
        headers: authHeader(token),
        data: { name: created.name + " (updated)", price: 39.99 },
      });
      expect(updated.status()).toBe(200);
      expect((await updated.json()).price).toBe(39.99);

      // delete
      const deleted = await request.delete(`/api/products/${created.id}`, {
        headers: authHeader(token),
      });
      expect(deleted.status()).toBe(204);

      // gone
      const gone = await request.get(`/api/products/${created.id}`, {
        headers: authHeader(token),
      });
      expect(gone.status()).toBe(404);
    });

    test("create rejects an invalid payload with 400", async ({ request }) => {
      const token = await loginAsAdmin(request);

      const cases = [
        { name: "", price: 10 }, // blank name
        { name: "Valid", price: 0 }, // price must be positive
        { name: "Valid", price: -5 }, // negative price
        { name: "No price" }, // missing price
      ];

      for (const payload of cases) {
        const res = await request.post("/api/products", {
          headers: authHeader(token),
          data: payload,
        });
        expect(res.status(), `expected 400 for ${JSON.stringify(payload)}`).toBe(400);
      }
    });

    test("update and delete a missing product return 404", async ({ request }) => {
      const token = await loginAsAdmin(request);

      const update = await request.put("/api/products/999999", {
        headers: authHeader(token),
        data: { name: "Ghost", price: 1.0 },
      });
      expect(update.status()).toBe(404);

      const del = await request.delete("/api/products/999999", {
        headers: authHeader(token),
      });
      expect(del.status()).toBe(404);
    });
  });

  test.describe("role-based access control (RBAC)", () => {
    test("USER cannot create products (403)", async ({ request }) => {
      const user = await registerUser(request);
      const login = await request.post("/api/auth/login", {
        data: { username: user.username, password: user.password },
      });
      expect(login.status()).toBe(200);
      const { token } = await login.json();

      const res = await request.post("/api/products", {
        headers: authHeader(token),
        data: { name: "Forbidden", price: 1.0 },
      });
      expect(res.status()).toBe(403);
    });

    test("unauthenticated requests are rejected with 401", async ({ request }) => {
      const res = await request.get("/api/products");
      expect(res.status()).toBe(401);
    });

    test("USER cannot list users (403), ADMIN can (200)", async ({ request }) => {
      const userToken = await registerAndLogin(request);
      const adminToken = await loginAsAdmin(request);

      const asUser = await request.get("/api/users", {
        headers: authHeader(userToken),
      });
      expect(asUser.status()).toBe(403);

      const asAdmin = await request.get("/api/users", {
        headers: authHeader(adminToken),
      });
      expect(asAdmin.status()).toBe(200);
      expect(Array.isArray(await asAdmin.json())).toBeTruthy();
    });
  });

  test.describe("listing and pagination", () => {
    test("list all products returns an array of products", async ({ request }) => {
      const token = await registerAndLogin(request);

      const res = await request.get("/api/products", {
        headers: authHeader(token),
      });
      expect(res.status()).toBe(200);

      const products = await res.json();
      expect(Array.isArray(products)).toBeTruthy();
      expect(products.length).toBeGreaterThanOrEqual(0);
      if (products.length > 0) {
        expect(products[0]).toHaveProperty("name");
        expect(products[0]).toHaveProperty("price");
      }
    });

    test("paginated listing filters by name and returns page metadata", async ({ request }) => {
      const adminToken = await loginAsAdmin(request);
      const uniqueName = `USB Search ${Date.now()}`;
      await createProduct(request, adminToken, { name: uniqueName, price: 5.0 });

      const token = await registerAndLogin(request);
      const res = await request.get(`/api/products/paged?page=0&size=2&search=USB`, {
        headers: authHeader(token),
      });
      expect(res.status()).toBe(200);

      const page = await res.json();
      expect(page.totalElements).toBeGreaterThanOrEqual(1);
      expect(page.content.length).toBeLessThanOrEqual(2);
      expect(page.pageable).toBeTruthy();
    });

    test("pagination is stable across pages", async ({ request }) => {
      const adminToken = await loginAsAdmin(request);
      // Ensure enough rows exist to span 2 pages regardless of environment state
      for (let i = 0; i < 4; i++) {
        await createProduct(request, adminToken, {
          name: `Paginated Seed ${Date.now()} ${i}`,
          price: 1.0,
        });
      }

      const token = await registerAndLogin(request);

      const page1 = await (
        await request.get("/api/products/paged?page=0&size=3&sort=id,asc", {
          headers: authHeader(token),
        })
      ).json();
      const page2 = await (
        await request.get("/api/products/paged?page=1&size=3&sort=id,asc", {
          headers: authHeader(token),
        })
      ).json();

      expect(page1.content.length).toBe(3);
      expect(page2.content.length).toBeGreaterThanOrEqual(1);

      const ids1 = page1.content.map((p: { id: number }) => p.id);
      const ids2 = page2.content.map((p: { id: number }) => p.id);
      expect(ids1).not.toContain(ids2[0]);
    });
  });
});

async function loginAsAdmin(request: Parameters<typeof test>[0]["request"]) {
  const res = await request.post("/api/auth/login", {
    data: seeded.admin,
  });
  expect(res.status()).toBe(200);
  return (await res.json()).token as string;
}
