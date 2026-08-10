import { Locator, Page, expect } from "@playwright/test";

/**
 * Page Object Model for the TodoMVC app (https://demo.playwright.dev/todomvc).
 * Encapsulates selectors and user flows so specs stay readable and resilient.
 */
export class TodoMvcPage {
  readonly page: Page;
  readonly input: Locator;
  readonly todoItems: Locator;
  readonly itemsLeft: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder("What needs to be done?");
    this.todoItems = page.locator(".todo-list li");
    this.itemsLeft = page.locator(".todo-count strong");
  }

  async goto() {
    await this.page.goto("https://demo.playwright.dev/todomvc");
  }

  async addTodo(title: string) {
    await this.input.fill(title);
    await this.input.press("Enter");
  }

  async addManyTodos(titles: string[]) {
    for (const title of titles) {
      await this.addTodo(title);
    }
  }

  async expectTodoCount(count: number) {
    await expect(this.todoItems).toHaveCount(count);
  }

  todoItem(title: string): Locator {
    return this.todoItems.filter({ hasText: new RegExp(`^${title}$`) });
  }

  async completeTodo(title: string) {
    await this.todoItem(title).locator(".toggle").check();
  }

  async filter(filter: "All" | "Active" | "Completed") {
    await this.page.getByRole("link", { name: filter }).click();
  }

  async clearCompleted() {
    await this.page.getByRole("button", { name: "Clear completed" }).click();
  }

  get itemsLeftCount() {
    return this.itemsLeft.textContent();
  }
}
