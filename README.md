# Learning — a Claude Code tutor

A Claude Code port of [amosblomqvist/learn](https://github.com/amosblomqvist/learn). Open this folder in Claude Code and Claude acts as a tutor whose aim is **understanding, not memorization**.

## How it works

```
You: /teach how public-key cryptography works
         │
         ▼
┌─ teach skill ────────────────────────────────────────────┐
│ 1. PROBE   quizzes find the edge of what you know;       │
│            a question pins down what you want            │
│ 2. PLAN    researcher subagent verifies the topic →      │
│            dependency map (Mermaid) → waits for your OK  │
│ 3. TEACH   per node: motivate → establish → connect →    │
│            quiz-check                                    │
└──────────────────────────────────────────────────────────┘
     │ unsure of a fact?        │ idea clearer as a picture?
     ▼                          ▼
 researcher (web, cited)    visualize → mermaid-maker / svg-maker
                            (render → look → fix → notes/viz/*.png)

 Every turn: md_log hook → notes/<date> <topic>.md (read it rendered)
```

### The two teaching principles

1. **Unconditional truths first.** Start from facts you can accept with zero caveats ("ALL network communication is packets"). Your brain commits to those instantly, and everything else is built on top.
2. **"How could I have discovered this?"** Each new idea is derived from what you already know, starting from the problem it solves, so nothing feels arbitrary and every fact is connected to others.

### The pieces

| File | What it does |
|---|---|
| `.claude/skills/teach/` | The method: probe → plan → teach, plus the quiz rules |
| `.claude/skills/visualize/` | Decides when a picture helps and briefs a maker subagent |
| `.claude/agents/researcher.md` | Searches the web to verify facts and scope topics, with citations |
| `.claude/agents/mermaid-maker.md` | Draws graphs and flows, renders them, **looks at the result**, iterates |
| `.claude/agents/svg-maker.md` | The same for geometry, number lines, plots and vectors |
| `.claude/tools/render.mjs` | Renders `.mmd` / `.svg` to PNG (uses your installed Chrome for Mermaid) |
| `.claude/hooks/md_log.mjs` | Mirrors each session to `notes/` |
| `CLAUDE.md` | Tells Claude this folder is a tutor and to always use `teach` |

## Setup (one time)

1. **Install [Obsidian](https://obsidian.md)** (free) and use *Open folder as vault* on `D:\Dev Stuff\Learning`. Your notes then render with LaTeX math, Mermaid diagrams, images and the quiz call-outs. VS Code's Markdown preview (`Ctrl+Shift+V`) also works; it renders math and images, but Mermaid only with an extension.
2. Open the folder in Claude Code (desktop: pick `D:\Dev Stuff\Learning` as the project folder).
3. If you ever move this folder to another PC, reinstall the renderer: `cd .claude/tools` then `npm install` (set `PUPPETEER_SKIP_DOWNLOAD=1` to reuse your installed Chrome).

## Using it

### Start a topic

```
/teach how TCP makes an unreliable network reliable
```

You can also just ask a question. `CLAUDE.md` makes Claude use the method anyway, but `/teach` is the explicit trigger.

### What a session feels like

1. **A burst of quizzes.** Claude is looking for the *edge* of your knowledge, so it deliberately keeps making questions harder until you miss one. That's expected and not a test you're failing. **Pick "I don't know" honestly** instead of guessing: a lucky guess makes Claude build on ground you don't have.
2. **A "what do you want out of this?" question.** No right answer here; be specific ("enough to read the RFC", "intuition, no math").
3. **The plan.** A short paragraph plus a dependency map. Push back now if a starting point seems too basic or too advanced; that's cheap to fix here. Approve it to begin.
4. **Teaching, one node at a time.** Each idea is motivated, derived, linked to earlier ones, then checked with one quick quiz. Get it wrong and Claude repairs that node before moving on.

### Quizzes

They appear as question popups with the header **Quiz**. Pick an option, choose **I don't know**, or type your own answer in *Other*. Claude grades on its next message (✓ / ✗ plus why). Questions with no right answer, such as preferences or direction, use a different header and aren't graded.

### Steering mid-lesson

Just type:
- "slower" / "skip ahead, I know this"
- "just explain it" (narration instead of Socratic questions) / "let me try" (more Socratic)
- "draw this" (asks for a diagram)
- "are you sure? check that" (sends a fact to the researcher)
- "where are we on the map?"

### Notes

Each session is written to `notes/YYYY-MM-DD <first words of your prompt>.md`: your prompts, Claude's explanations, every quiz with your answer, and the diagrams. Tool noise is left out. Questions appear in the notes **while you're answering them**; the rest is added at the end of each turn. Keep Obsidian open beside Claude for comfortable reading.

### Resuming later

```
continue TCP from notes/2026-10-03 how-tcp-makes-an-unreliable-network.md
```

Claude reads the old notes, re-checks the last few ideas with a quiz, and continues the map. Each new session still gets its own notes file.

## Customizing

- **Your learning style:** edit `.claude/skills/teach/SKILL.md`. It's written to be changed (e.g. "always use programming analogies", "fewer quizzes when I say I'm tired").
- **Cost / speed:** the subagents use `model: sonnet`. Set the researcher to `haiku` for cheaper, less careful checks.
- **Turn off the notes for a while:** set the environment variable `MD_LOG_DISABLED=1`, or remove the `hooks` block in `.claude/settings.json`.

## Differences from the original (pi) version

- **Quizzes** use Claude Code's built-in `AskUserQuestion` (at most 3 answers + "I don't know"). Claude grades on its next message rather than instantly in the popup.
- **Notes** use standard Markdown image links (`![x](viz/x.png)`), so they render in Obsidian *and* VS Code. The original used Obsidian-only `![[x.png]]`.
- **Researcher** runs on Claude (Sonnet) instead of GLM via OpenRouter.
- **Diagram tools** are a single Node script driven via Bash, instead of custom pi tools.
