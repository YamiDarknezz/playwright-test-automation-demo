import { test, expect } from "@playwright/test";
import { TodoMvcPage } from "./pages/todomvc.page";

test.describe("TodoMVC functional E2E", () => {
  test("create, complete and filter tasks", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();

    await todo.addManyTodos(["Write API tests", "Wire up CI", "Document the repo"]);
    await todo.expectTodoCount(3);

    await todo.completeTodo("Write API tests");
    await todo.expectTodoCount(3); // still visible on All

    await todo.filter("Completed");
    await todo.expectTodoCount(1);
    await expect(todo.todoItem("Write API tests")).toBeVisible();

    await todo.filter("Active");
    await todo.expectTodoCount(2);
    await expect(todo.todoItem("Wire up CI")).toBeVisible();
  });

  test("counter shows remaining active items", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();

    await todo.addManyTodos(["First task", "Second task", "Third task"]);
    await todo.completeTodo("First task");

    expect(await todo.itemsLeftCount).toBe("2");
  });

  test("clear completed removes only done items", async ({ page }) => {
    const todo = new TodoMvcPage(page);
    await todo.goto();

    await todo.addManyTodos(["Keep me", "Remove me"]);
    await todo.completeTodo("Remove me");

    await todo.clearCompleted();
    await todo.expectTodoCount(1);
    await expect(todo.todoItem("Keep me")).toBeVisible();
  });
});
