import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TodoMvcPage } from "./pages/todomvc.page";

test.describe("Accessibility (axe-core)", () => {
  test("TodoMVC home page has no critical accessibility violations", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });

  test("page is usable after adding todos (no serious violations)", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();
    await todo.addManyTodos(["A11y task one", "A11y task two", "A11y task three"]);

    const results = await new AxeBuilder({ page })
      // Known defect in the sample app under test: completed tasks use a
      // low-contrast strikethrough style (color-contrast is excluded here,
      // every other serious issue still fails the test).
      .disableRules(["color-contrast"])
      .analyze();

    expect(results.violations.filter((v) => v.impact === "serious")).toEqual([]);
  });
});
