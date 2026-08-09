# Playwright Test Automation Demo

[![CI](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml)

**Live HTML report** (updated on every push to main): https://yamidarknezz.github.io/playwright-test-automation-demo/

A **TypeScript + Playwright** test framework demonstrating API, integration and functional E2E tests, wired into CI/CD with GitHub Actions and HTML reporting.

**System under test**: the [inventory-api](https://github.com/YamiDarknezz/inventory-api) — a Spring Boot REST API with JWT auth and role-based access control that I also wrote. Tests run against a real running instance, started automatically by Playwright's `webServer`.

## What is covered

| Type | Suite | What it verifies |
|---|---|---|
| API / integration | `tests/api/auth.spec.ts` | register (201), duplicate (409), validation (400), login (200), bad credentials (401) |
| API / integration | `tests/api/products.spec.ts` | full CRUD lifecycle, RBAC (USER→403, no token→401), pagination, search, 404s |
| E2E functional | `tests/ui/todomvc.spec.ts` | real browser flows: add/complete/filter tasks, counters, clear completed |

**15 API tests + 3 UI tests = 18 tests**, all green in CI.

## Why this design (the interview story)

- **Reusable API client** (`tests/helpers/api.ts`): auth flows, seeded credentials and product factory — test cases stay focused on behavior, not HTTP plumbing.
- **Page Object Model** (`tests/ui/pages/todomvc.page.ts`): UI selectors and flows are encapsulated; specs read like requirements.
- **Flaky-test thinking**: the API is booted cold from a JVM jar on every CI run, so `retries` and `reuseExistingServer` handle slow first starts — the same reasoning applied to production services on free tiers.
- **Debugging built-in**: traces and screenshots are retained on failure and shipped as a CI artifact (`playwright-report`), ready for root-cause analysis.
- **Clean contract**: shared error envelope (`status`, `message`) makes API assertions consistent.

## Repository structure

```
├── .github/workflows/ci.yml   # CI: builds the API, runs all tests, uploads report
├── playwright.config.ts       # projects (api / ui), retries, webServer, reporters
├── tests/
│   ├── api/                   # API + integration tests against inventory-api
│   │   ├── auth.spec.ts
│   │   └── products.spec.ts
│   ├── ui/                    # functional E2E in a real browser
│   │   ├── todomvc.spec.ts
│   │   └── pages/todomvc.page.ts   # Page Object Model
│   └── helpers/api.ts         # reusable API client + data factories
```

## Running locally

Prerequisites: Node 22+, Java 21, and the inventory-api repo as a sibling folder (its jar is built once):

```bash
# 1. build the API jar (once)
cd ../inventory-api && ./mvnw package -DskipTests && cd ../playwright-test-automation-demo

# 2. install deps + browsers (once)
npm install
npx playwright install chromium

# 3. run everything (Playwright boots the API automatically)
npx playwright test

# 4. open the HTML report
npx playwright show-report
```

Useful flags: `npx playwright test tests/api` (API only), `npx playwright test --headed` (watch the browser), `API_URL=http://myhost:8080 npx playwright test` (point to a remote API).

## CI pipeline (GitHub Actions)

1. Check out this repo **and** `inventory-api`
2. Build the API jar (Java 21, Maven cache)
3. `npx playwright test` — Playwright starts the API, runs all 18 tests
4. On failure: `playwright-report/` uploaded as an artifact (7 days)

## Example test

```ts
test("USER cannot create products (403)", async ({ request }) => {
  const user = await registerUser(request);
  const login = await request.post("/api/auth/login", {
    data: { username: user.username, password: user.password },
  });
  const { token } = await login.json();

  const res = await request.post("/api/products", {
    headers: authHeader(token),
    data: { name: "Forbidden", price: 1.0 },
  });
  expect(res.status()).toBe(403);
});
```
