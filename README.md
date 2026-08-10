<div align="center">

# Playwright Test Automation Demo

**TypeScript + Playwright test framework: API, integration, functional E2E, accessibility, mobile and visual regression tests, wired into CI/CD**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.62-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-26%20(17%20API%20+%209%20UI)-2EAD33)](#what-is-covered)

[![CI](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/YamiDarknezz/playwright-test-automation-demo/actions/workflows/ci.yml)
[![Live report](https://img.shields.io/badge/Live%20HTML%20report-GitHub%20Pages-222222?logo=githubpages)](https://yamidarknezz.github.io/playwright-test-automation-demo/)

</div>

---

## 📋 About

A complete test automation framework covering **every dimension a test engineer owns**: API tests, integration tests, functional E2E, **accessibility (axe-core)**, **mobile emulation (WebKit)**, **visual regression** and **performance smoke** — all green in CI with a public HTML report and per-test GitHub checks.

**System under test**: the [inventory-api](https://github.com/YamiDarknezz/inventory-api) — a Spring Boot REST API with JWT auth and RBAC that I also wrote. Tests run against a **real running instance**, booted automatically by Playwright's `webServer` (local and CI).

## ✅ What is covered

| Dimension | Suite | What it verifies |
|---|---|---|
| API / integration | `tests/api/auth.spec.ts` | register (201), duplicate (409), validation (400), login (200), bad credentials (401) |
| API / integration | `tests/api/products.spec.ts` | full CRUD lifecycle, RBAC (USER→403, no token→401), pagination, search, 404s |
| Performance smoke | `tests/api/performance.spec.ts` | p95 latency budgets on listing and login |
| E2E functional | `tests/ui/todomvc.spec.ts` | browser flows: add/complete/filter tasks, counters, clear completed |
| Accessibility | `tests/ui/a11y.spec.ts` | axe-core scan: no critical/serious violations (known contrast defect documented & excluded) |
| Mobile (WebKit/iPhone 13) | `tests/ui/mobile.spec.ts` | full flows on a mobile viewport + no horizontal overflow |
| Visual regression | `tests/ui/visual.spec.ts` | baseline snapshot comparison (max 1% pixel diff) |

**17 API tests + 9 UI tests = 26 tests**, all green in CI across Chromium + WebKit.

## 🧠 Why this design (the interview story)

- **Reusable API client** (`tests/helpers/api.ts`): auth flows, seeded credentials and product factory — test cases stay focused on behavior, not HTTP plumbing.
- **Page Object Model** (`tests/ui/pages/todomvc.page.ts`): selectors and flows encapsulated; specs read like requirements (exact-match item locators avoid ambiguous filters).
- **Flaky-test thinking**: the API boots cold from a JVM jar in CI, so `retries` + `reuseExistingServer` handle slow first starts — the same reasoning applied to production services on free tiers.
- **Debugging built-in**: traces and screenshots retained on failure, JUnit results published to GitHub checks, HTML report shipped on failure.
- **Accessibility as a gate**: axe-core with a **documented exclusion** for a known app defect — the test still catches any other serious issue (exactly how you treat real-world known bugs).
- **Performance budgets**: p95 assertions on core endpoints catch regressions early without needing a load-testing tool.
- **Clean contract**: the API's shared error envelope (`status`, `message`) makes API assertions consistent.

## 📁 Repository structure

```
├── .github/workflows/ci.yml   # CI: builds API, runs all tests, publishes checks + Pages report
├── playwright.config.ts       # projects (api / ui / ui-mobile), retries, webServer, reporters
├── tests/
│   ├── api/                   # API + integration + performance smoke
│   │   ├── auth.spec.ts
│   │   ├── products.spec.ts
│   │   └── performance.spec.ts
│   ├── ui/                    # functional, a11y, mobile and visual tests
│   │   ├── todomvc.spec.ts
│   │   ├── a11y.spec.ts
│   │   ├── mobile.spec.ts
│   │   ├── visual.spec.ts
│   │   ├── pages/todomvc.page.ts        # Page Object Model
│   │   └── visual.spec.ts-snapshots/    # baseline screenshots
│   └── helpers/api.ts         # reusable API client + data factories
```

## 🚀 Running locally

Prerequisites: Node 22+, Java 21, and the inventory-api repo as a sibling folder:

```bash
# 1. build the API jar (once)
cd ../inventory-api && ./mvnw package -DskipTests && cd ../playwright-test-automation-demo

# 2. install deps + browsers (once)
npm install
npx playwright install chromium webkit

# 3. run everything (Playwright boots the API automatically)
npx playwright test

# 4. open the HTML report
npx playwright show-report
```

Useful flags: `npx playwright test tests/api` (API only), `npx playwright test --headed` (watch the browser), `npx playwright test --update-snapshots` (refresh visual baselines), `API_URL=http://myhost:8080 npx playwright test` (point to a remote API).

## 🔧 CI pipeline (GitHub Actions)

| Job | What it does |
|---|---|
| **Run tests (API + UI)** | Checkout demo + `inventory-api`, build the jar, `npx playwright test` (26 tests, Chromium + WebKit) |
| **GitHub checks** | JUnit results published per run — every test visible in the PR/push checks |
| **Artifacts** | HTML report (on failure) + raw results (always) |
| **Deploy report** | HTML report published to GitHub Pages on `main` |

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

**Built with TypeScript · Playwright · axe-core · GitHub Actions · GitHub Pages**

</div>
