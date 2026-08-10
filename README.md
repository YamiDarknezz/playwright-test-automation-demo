<div align="center">

# Playwright Test Automation Demo

**TypeScript + Playwright test framework: API, integration and functional E2E tests, wired into CI/CD**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.62-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-18%20(15%20API%20+%203%20UI)-2EAD33)](#what-is-covered)

[![CI](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml)
[![Live report](https://img.shields.io/badge/Live%20HTML%20report-GitHub%20Pages-222222?logo=githubpages)](https://yamidarknezz.github.io/playwright-test-automation-demo/)

</div>

---

## 📋 About

A complete test automation framework demonstrating the responsibilities expected of a test engineer: **API tests**, **integration tests**, **functional E2E tests**, **maintainable test cases** and **CI/CD integration** — all green in CI with a public HTML report.

**System under test**: the [inventory-api](https://github.com/YamiDarknezz/inventory-api) — a Spring Boot REST API with JWT auth and RBAC that I also wrote. Tests run against a **real running instance**, booted automatically by Playwright's `webServer` (local and CI).

## ✅ What is covered

| Type | Suite | What it verifies |
|---|---|---|
| API / integration | `tests/api/auth.spec.ts` | register (201), duplicate (409), validation (400), login (200), bad credentials (401) |
| API / integration | `tests/api/products.spec.ts` | full CRUD lifecycle, RBAC (USER→403, no token→401), pagination, search, 404s |
| E2E functional | `tests/ui/todomvc.spec.ts` | real browser flows: add/complete/filter tasks, counters, clear completed |

**15 API tests + 3 UI tests = 18 tests**, all green in CI.

## 🧠 Why this design (the interview story)

- **Reusable API client** (`tests/helpers/api.ts`): auth flows, seeded credentials and product factory — test cases stay focused on behavior, not HTTP plumbing.
- **Page Object Model** (`tests/ui/pages/todomvc.page.ts`): UI selectors and flows are encapsulated; specs read like requirements.
- **Flaky-test thinking**: the API is booted cold from a JVM jar on every CI run, so `retries` and `reuseExistingServer` handle slow first starts — the same reasoning applied to production services on free tiers.
- **Debugging built-in**: traces and screenshots retained on failure, shipped as CI artifacts, plus JUnit results published to GitHub checks on every run.
- **Clean contract**: the API exposes a shared error envelope (`status`, `message`), making API assertions consistent and readable.

## 📁 Repository structure

```
├── .github/workflows/ci.yml   # CI: builds API, runs tests, publishes checks + Pages report
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

## 🚀 Running locally

Prerequisites: Node 22+, Java 21, and the inventory-api repo as a sibling folder:

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

## 🔧 CI pipeline (GitHub Actions)

| Job | What it does |
|---|---|
| **Run tests (API + UI)** | Checkout demo + `inventory-api`, build the jar, `npx playwright test` (18 tests) |
| **GitHub checks** | JUnit results published per run — every test visible in the PR/push checks |
| **Artifacts** | HTML report (on failure) + raw results (always) |
| **Deploy report** | HTML report published to GitHub Pages on `main` (always) |

## 📄 Example test

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

## 📚 Related

- [inventory-api](https://github.com/YamiDarknezz/inventory-api) — the system under test (Spring Boot, JWT, RBAC, 96% coverage, SonarCloud A/A)
- [GitHub profile](https://github.com/YamiDarknezz)

---

<div align="center">

**Built with TypeScript · Playwright · GitHub Actions · GitHub Pages**

</div>
