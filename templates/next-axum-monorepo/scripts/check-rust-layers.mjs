import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const layers = ["api", "core", "domain"]
const layerRank = new Map(layers.map((layer, index) => [layer, index]))

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(scriptDir, "../apps/axum/src")
const violations = []

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const nextPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(nextPath)
      continue
    }

    if (!entry.name.endsWith(".rs")) {
      continue
    }

    const relativePath = path.relative(srcDir, nextPath)
    const [ownerLayer] = relativePath.split(path.sep)

    if (!layerRank.has(ownerLayer)) {
      continue
    }

    const source = stripComments(readFileSync(nextPath, "utf8"))
    const matches = findReferencedLayers(source)

    for (const targetLayer of matches) {
      if (layerRank.get(targetLayer) < layerRank.get(ownerLayer)) {
        violations.push(
          `${relativePath}: ${ownerLayer} must not depend on higher layer ${targetLayer}`,
        )
      }
    }
  }
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
}

function findReferencedLayers(source) {
  const referencedLayers = []

  for (const match of source.matchAll(/\bcrate::(api|core|domain)\b/g)) {
    referencedLayers.push(match[1])
  }

  for (const match of source.matchAll(/\bcrate::\{/g)) {
    const groupContent = readBalancedGroup(source, match.index + "crate::".length)

    if (!groupContent) {
      continue
    }

    for (const entry of splitTopLevelItems(groupContent)) {
      const layerMatch = entry.match(/^(api|core|domain)\b/)

      if (layerMatch) {
        referencedLayers.push(layerMatch[1])
      }
    }
  }

  return referencedLayers
}

function readBalancedGroup(source, openBraceIndex) {
  if (source[openBraceIndex] !== "{") {
    return null
  }

  let depth = 0

  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1
    } else if (source[index] === "}") {
      depth -= 1

      if (depth === 0) {
        return source.slice(openBraceIndex + 1, index)
      }
    }
  }

  return null
}

function splitTopLevelItems(groupContent) {
  const items = []
  let depth = 0
  let start = 0

  for (let index = 0; index < groupContent.length; index += 1) {
    if (groupContent[index] === "{") {
      depth += 1
      continue
    }

    if (groupContent[index] === "}") {
      depth -= 1
      continue
    }

    if (groupContent[index] === "," && depth === 0) {
      const item = groupContent.slice(start, index).trim()

      if (item) {
        items.push(item)
      }

      start = index + 1
    }
  }

  const trailingItem = groupContent.slice(start).trim()

  if (trailingItem) {
    items.push(trailingItem)
  }

  return items
}

walk(srcDir)

if (violations.length > 0) {
  console.error("Rust layer check failed:")

  for (const violation of violations) {
    console.error(`- ${violation}`)
  }

  process.exit(1)
}

console.log("Rust layer check passed.")
