import type { Preview } from "@storybook/nextjs-vite"

import "../src/styles/globals.css"

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
    },
    layout: "centered",
  },
}

export default preview
