import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("homepage starter contract supports validation", async ({ page }) => {
  const starterCopy =
    "This page gives agents a fast validation target for the shared UI shell, a real button import, and the dark mode hotkey."
  const starterChecklist = [
    "Shared button component renders",
    "Dark mode hotkey flips the theme",
    "Accessibility checks stay green",
  ]

  await page.addInitScript(() => {
    localStorage.setItem("theme", "light")
  })
  await page.goto("/")

  await expect(page).toHaveTitle("Project ready")
  await expect(
    page.getByRole("heading", { name: "Project ready!" }),
  ).toBeVisible()
  await expect(page.getByText(starterCopy)).toBeVisible()
  await expect(page.getByRole("button", { name: "Button" })).toBeVisible()
  for (const item of starterChecklist) {
    await expect(page.getByText(item)).toBeVisible()
  }

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  const html = page.locator("html")
  await page.keyboard.press("d")
  await expect(html).toHaveClass(/dark/)
})
