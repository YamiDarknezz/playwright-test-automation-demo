import { test, expect } from "@playwright/test";
import { authHeader, seeded } from "../helpers/api";

test.describe("Performance smoke", () => {
  test("products listing responds under 3s (p95, cold JVM excluded)", async ({ request }) => {
    const login = await request.post("/api/auth/login", { data: seeded.admin });
    expect(login.status()).toBe(200);
    const { token } = await login.json();

    const latencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      const res = await request.get("/api/products", { headers: authHeader(token) });
      const elapsed = Date.now() - start;
      expect(res.status()).toBe(200);
      latencies.push(elapsed);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1];
    expect(p95, `p95 latency ${p95}ms should be under 3000ms`).toBeLessThan(3000);
  });

  test("login responds under 2s after warm-up", async ({ request }) => {
    // warm up (JVM cold start handled by webServer + retries; admin creds via env for remote)
    await request.post("/api/auth/login", { data: seeded.admin });

    const start = Date.now();
    const res = await request.post("/api/auth/login", { data: seeded.admin });
    const elapsed = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });
});
