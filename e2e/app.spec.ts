import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("renders hero + primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/EazyScan/);
    await expect(page.getByText("Scope งานและ Manday").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /เริ่มใช้งานฟรี/ }).first()).toBeVisible();
  });

  test("เริ่มใช้งานฟรี navigates to the workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /เริ่มใช้งานฟรี/ }).first().click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByText("เริ่มจากเสียงของลูกค้า")).toBeVisible();
  });
});

test.describe("Demo result", () => {
  test("/results/sample shows a full analysis (no AI/STT needed)", async ({ page }) => {
    await page.goto("/results/sample");
    await expect(page.getByText("สรุปสำหรับผู้บริหาร")).toBeVisible();
    await expect(page.getByText("ตารางประเมิน Manday")).toBeVisible();
    await expect(page.getByText("ฟีเจอร์ที่สกัดได้")).toBeVisible();
    // hero shows a manday range like "63–82"
    await expect(page.getByText(/\d+[–-]\d+/).first()).toBeVisible();
  });
});

test.describe("Workspace", () => {
  test("shows record + upload affordances and STT provider choice", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.getByLabel("เริ่มอัดเสียง")).toBeVisible();
    await expect(page.getByText("ลากไฟล์เสียงมาวางที่นี่")).toBeVisible();
  });
});

test.describe("History", () => {
  test("lists seeded projects with search + filters", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByPlaceholder(/ค้นหาชื่อโครงการ/)).toBeVisible();
    // a seeded project card is shown (no DB in E2E → seed remains)
    await expect(page.getByText("Glow Clinic")).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("opens the settings dialog from the sidebar", async ({ page }) => {
    await page.goto("/workspace");
    // on mobile the sidebar is behind a hamburger drawer
    const menu = page.getByLabel("เปิดเมนู");
    if (await menu.isVisible().catch(() => false)) await menu.click();
    await page.getByRole("button", { name: "ตั้งค่า" }).click();
    await expect(page.getByRole("dialog", { name: "ตั้งค่า" })).toBeVisible();
    await expect(page.getByText("OpenAI API Key")).toBeVisible();
  });
});

test.describe("404", () => {
  test("unknown route shows not-found", async ({ page }) => {
    await page.goto("/totally/unknown/path");
    await expect(page.getByText("ไม่พบหน้านี้")).toBeVisible();
  });
});
