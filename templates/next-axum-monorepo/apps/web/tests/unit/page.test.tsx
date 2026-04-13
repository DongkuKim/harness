import { render, screen } from "@testing-library/react"

import Page from "@/app/page"

describe("Page", () => {
  it("renders the starter copy", () => {
    render(<Page />)

    expect(
      screen.getByRole("heading", { name: "Project ready!" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("You may now add components and start building."),
    ).toBeInTheDocument()
  })
})
