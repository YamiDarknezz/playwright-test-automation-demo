import { test, expect } from "@playwright/test";
import { TodoMvcPage } from "./pages/todomvc.page";

test.describe("Visual regression", () => {
  test("default view matches the baseline snapshot", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();
    await expect(page).toHaveScreenshot("todomvc-empty.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("view with todos and filters matches the baseline snapshot", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();
    await todo.addManyTodos(["First item", "Second item", "Third item"]);
    await todo.completeTodo("First item");

    await expect(page).toHaveScreenshot("todomvc-with-todos.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
