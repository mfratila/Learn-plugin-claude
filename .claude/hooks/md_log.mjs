#!/usr/bin/env node
/**
 * md_log.mjs — mirror the learning session into a readable Markdown file.
 *
 * Claude Code port of the pi `md-log` extension. The terminal/chat is a poor
 * place to re-read a lesson; this writes the reading-relevant parts of the
 * session to notes/<date> <topic>.md so it can be read rendered (Obsidian or
 * VS Code preview): math in $…$, code, and embedded diagrams all render.
 *
 * Captures only:
 *   - your prompts
 *   - Claude's prose
 *   - quiz / question blocks (AskUserQuestion) and your answers
 * Every other tool call (Bash, Read, subagents, …) is omitted.
 *
 * Wired up in .claude/settings.json as:
 *   - PreToolUse (AskUserQuestion) → flush, then write the question so it
 *     shows up in the notes while you are still answering it
 *   - Stop                         → flush everything from the finished turn
 *
 * Append-only and idempotent: what has been written is tracked per session in
 * .claude/state/md-log/<session>.json, so re-running never duplicates text.
 * Never blocks Claude: every failure exits 0.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const NOTES_DIR = join(PROJECT_ROOT, "notes")
const STATE_DIR = join(PROJECT_ROOT, ".claude", "state", "md-log")
const QA_TOOL = "AskUserQuestion"

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"))
  } catch {
    return null
  }
}

function readTranscript(path) {
  if (!path || !existsSync(path)) return []
  const out = []
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue
    try {
      out.push(JSON.parse(line))
    } catch {
      // a partially written last line — picked up on the next flush
    }
  }
  return out
}

/** Turn a raw user message into what you actually typed, or null to skip it. */
function cleanUserText(text) {
  if (typeof text !== "string") return null
  const cmd = text.match(/<command-name>\s*([^<]+?)\s*<\/command-name>/)
  if (cmd) {
    const args = text.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1]?.trim()
    return args ? `${cmd[1]} ${args}` : cmd[1]
  }
  const cleaned = text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<(local-command-[a-z]+|command-message)>[\s\S]*?<\/\1>/g, "")
    .trim()
  if (!cleaned || cleaned.startsWith("[Request interrupted")) return null
  return cleaned
}

function isHumanPrompt(rec) {
  if (rec.type !== "user" || rec.isMeta || rec.isSidechain || rec.toolUseResult) return false
  if (rec.origin && rec.origin.kind !== "human") return false
  const c = rec.message?.content
  return typeof c === "string" || (Array.isArray(c) && c.every((b) => b.type === "text"))
}

function userText(rec) {
  const c = rec.message.content
  const raw = typeof c === "string" ? c : c.map((b) => b.text).join("\n")
  return cleanUserText(raw)
}

function slugFromPrompt(text) {
  const words = (text || "session")
    .replace(/^\/\S+\s*/, "") // drop a leading /teach
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7)
  return words.join("-") || "session"
}

function formatQuestions(input) {
  const qs = input?.questions ?? []
  return qs
    .map((q) => {
      const opts = (q.options ?? []).map((o, i) => `${i + 1}. ${o.label}${o.description ? ` — ${o.description}` : ""}`)
      const kind = q.multiSelect ? " *(pick all that apply)*" : ""
      return `> [!question] ${q.header ?? "Question"}\n> ${q.question.replace(/\n/g, "\n> ")}${kind}\n>\n> ${opts.join("\n> ")}`
    })
    .join("\n\n")
}

function formatAnswers(result) {
  const answers = result?.answers ?? {}
  const lines = Object.values(answers).map((a) => `**Your answer:** ${Array.isArray(a) ? a.join(", ") : a}`)
  return lines.length ? lines.join("\n") : "**Your answer:** *(skipped)*"
}

function loadState(sessionId) {
  const file = join(STATE_DIR, `${sessionId}.json`)
  try {
    const s = JSON.parse(readFileSync(file, "utf8"))
    return { file, logFile: s.logFile, written: new Set(s.written), speaker: s.speaker ?? null }
  } catch {
    return { file, logFile: null, written: new Set(), speaker: null }
  }
}

function saveState(st) {
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(st.file, JSON.stringify({ logFile: st.logFile, written: [...st.written], speaker: st.speaker }))
}

function ensureLogFile(st, records) {
  if (st.logFile) return
  const first = records.find(isHumanPrompt)
  const firstText = first ? userText(first) : null
  if (!firstText) return // nothing worth logging yet
  mkdirSync(NOTES_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  let name = `${date} ${slugFromPrompt(firstText)}`
  for (let n = 2; existsSync(join(NOTES_DIR, `${name}.md`)); n++) name = `${date} ${slugFromPrompt(firstText)}-${n}`
  st.logFile = join(NOTES_DIR, `${name}.md`)
  writeFileSync(st.logFile, `# ${firstText.split("\n")[0].replace(/^\/\S+\s*/, "").slice(0, 100) || "Learning session"}\n\n*${date}*\n`)
}

function emit(st, key, speaker, body) {
  if (st.written.has(key) || !body?.trim()) return
  const header = speaker !== st.speaker ? `\n---\n\n### ${speaker}\n\n` : "\n"
  appendFileSync(st.logFile, `${header}${body.trim()}\n`)
  st.written.add(key)
  st.speaker = speaker
}

function flush(st, records) {
  ensureLogFile(st, records)
  if (!st.logFile) return
  for (const rec of records) {
    if (rec.isSidechain) continue
    if (isHumanPrompt(rec)) {
      emit(st, rec.uuid, "You", userText(rec))
      continue
    }
    if (rec.type === "user" && rec.toolUseResult?.answers) {
      const block = rec.message?.content?.find?.((b) => b.type === "tool_result")
      if (block) emit(st, `ans:${block.tool_use_id}`, "You", formatAnswers(rec.toolUseResult))
      continue
    }
    if (rec.type === "assistant" && Array.isArray(rec.message?.content)) {
      rec.message.content.forEach((b, i) => {
        if (b.type === "text") emit(st, `${rec.uuid}:${i}`, "Claude", b.text)
        else if (b.type === "tool_use" && b.name === QA_TOOL) emit(st, `q:${b.id}`, "Claude", formatQuestions(b.input))
      })
    }
  }
}

try {
  const input = readStdin()
  if (input?.session_id && !process.env.MD_LOG_DISABLED) {
    const st = loadState(input.session_id)
    flush(st, readTranscript(input.transcript_path))
    if (st.logFile && input.hook_event_name === "PreToolUse" && input.tool_name === QA_TOOL && input.tool_use_id) {
      emit(st, `q:${input.tool_use_id}`, "Claude", formatQuestions(input.tool_input))
    }
    saveState(st)
  }
} catch (e) {
  process.stderr.write(`md_log: ${e.message}\n`)
}
process.exit(0)
