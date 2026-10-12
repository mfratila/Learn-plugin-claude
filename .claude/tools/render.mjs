#!/usr/bin/env node
/**
 * render.mjs — render a Mermaid (.mmd) or SVG (.svg) source file to PNG.
 *
 * Used by the mermaid-maker and svg-maker subagents (the Claude Code port of
 * the pi `visual-tools` extension). The subagent writes a source file, renders
 * a preview, LOOKS at the PNG with the Read tool, iterates, then publishes.
 *
 *   node .claude/tools/render.mjs <source.mmd|source.svg>
 *       → renders a preview PNG next to the source, prints its path
 *
 *   node .claude/tools/render.mjs <source.mmd|source.svg> --publish <kebab-slug>
 *       → renders and copies it into notes/viz/viz-<slug>-<timestamp>.png
 *
 * Mermaid renders through mermaid-cli using the locally installed Chrome/Edge
 * (no bundled Chromium download). SVG renders through resvg (no browser).
 */

import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(TOOLS_DIR, "..", "..")
const VIZ_DIR = join(PROJECT_ROOT, "notes", "viz")

const BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean)

function fail(msg) {
  console.error(`RENDER ERROR: ${msg}`)
  process.exit(1)
}

function renderMermaid(src, out) {
  const browser = BROWSER_CANDIDATES.find((p) => existsSync(p))
  if (!browser) fail("no Chrome/Edge found; set PUPPETEER_EXECUTABLE_PATH")

  const puppeteerCfg = join(TOOLS_DIR, ".puppeteer.json")
  writeFileSync(puppeteerCfg, JSON.stringify({ executablePath: browser, headless: "shell" }))

  const pkgPath = join(TOOLS_DIR, "node_modules", "@mermaid-js", "mermaid-cli", "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.mmdc
  const cli = join(dirname(pkgPath), bin)

  const res = spawnSync(
    process.execPath,
    [cli, "-i", src, "-o", out, "-b", "white", "-s", "2", "-p", puppeteerCfg, "-q"],
    { encoding: "utf8", timeout: 90_000 },
  )
  if (res.status !== 0) fail((res.stderr || res.stdout || "mermaid-cli failed").trim())
}

async function renderSvg(src, out) {
  const { Resvg } = await import("@resvg/resvg-js")
  const svg = readFileSync(src, "utf8")
  let png
  try {
    png = new Resvg(svg, {
      background: "white",
      fitTo: { mode: "zoom", value: 2 },
      font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
    })
      .render()
      .asPng()
  } catch (e) {
    fail(`invalid SVG: ${e.message}`)
  }
  writeFileSync(out, png)
}

const args = process.argv.slice(2)
const src = args[0] && resolve(args[0])
if (!src || !existsSync(src)) fail(`source file not found: ${args[0] ?? "(none)"}`)

const pubIdx = args.indexOf("--publish")
const slug = pubIdx >= 0 ? args[pubIdx + 1] : null
if (pubIdx >= 0 && !/^[a-z0-9][a-z0-9-]*$/.test(slug ?? "")) fail("--publish needs a kebab-case slug")

const ext = extname(src).toLowerCase()
const preview = join(dirname(src), `${basename(src, ext)}.preview.png`)

if (ext === ".mmd" || ext === ".mermaid") renderMermaid(src, preview)
else if (ext === ".svg") await renderSvg(src, preview)
else fail(`unsupported extension ${ext} (use .mmd or .svg)`)

if (!slug) {
  console.log(`PREVIEW: ${preview}`)
} else {
  mkdirSync(VIZ_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
  const filename = `viz-${slug}-${stamp}.png`
  const dest = join(VIZ_DIR, filename)
  copyFileSync(preview, dest)
  console.log(`PUBLISHED\nfilename: ${filename}\npath: ${dest}\nembed: ![${slug}](viz/${filename})`)
}
