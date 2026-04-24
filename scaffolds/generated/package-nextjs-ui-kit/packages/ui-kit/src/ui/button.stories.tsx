import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button.js"

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Button",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
}

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
}
