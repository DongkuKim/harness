import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("homepage smoke flow passes accessibility checks", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Project ready!" }),
  ).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
