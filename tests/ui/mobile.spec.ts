import { test, expect } from "@playwright/test";
import { TodoMvcPage } from "./pages/todomvc.page";

test.describe("Mobile (emulated iPhone 13)", () => {
  test("app renders and works on a mobile viewport", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();

    await todo.addManyTodos(["Mobile task", "Second mobile task"]);
    await todo.expectTodoCount(2);
    await todo.completeTodo("Mobile task");

    await todo.filter("Completed");
    await todo.expectTodoCount(1);
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.goto("https://demo.playwright.dev/todomvc");

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
