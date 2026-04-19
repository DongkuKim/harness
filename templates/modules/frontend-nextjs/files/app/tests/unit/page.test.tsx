import { render, screen, within } from "@testing-library/react"

import Page from "@/app/page"

describe("Page", () => {
  it("renders the starter UX contract", () => {
    const starterCopy =
      "This page gives agents a fast validation target for the shared UI shell, a real button import, and the dark mode hotkey."
    const starterChecklist = [
      "Shared button component renders",
      "Dark mode hotkey flips the theme",
      "Accessibility checks stay green",
    ]

    render(<Page />)

    expect(
      screen.getByRole("heading", { name: "Project ready!" }),
    ).toBeInTheDocument()
    expect(screen.getByText(starterCopy)).toBeInTheDocument()

    const list = screen.getByRole("list")
    for (const item of starterChecklist) {
      expect(within(list).getByText(item)).toBeInTheDocument()
    }

    expect(screen.getByRole("button", { name: "Button" })).toBeEnabled()
    expect(
      screen.getByText((_, element) => {
        return element?.textContent === "Press d to toggle dark mode"
      }),
    ).toBeInTheDocument()
  })
})
