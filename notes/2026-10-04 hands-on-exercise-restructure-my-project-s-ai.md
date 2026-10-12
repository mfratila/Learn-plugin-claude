# Hands-on exercise: restructure my project's AI setup using what I learned in the "AI agents" lesson.

*2026-10-04*

---

### You

/teach Hands-on exercise: restructure my project's AI setup using what I learned in the "AI agents" lesson.

Context: read `notes/2026-10-03 i-want-to-learn-more-about-ai.md` first (previous lessons, both sessions). Summary of what I already have solid:
- Three roots: (1) the model only knows what's in its context; (2) context is finite and every token costs space, money and attention, so aim for the smallest set of tokens needed right now; (3) context is advice, and only code the harness runs is a guarantee.
- Mechanisms, each derived from those: CLAUDE.md/AGENTS.md = always-on facts (<200 lines; @imports don't save tokens; subfolder CLAUDE.md loads only when work reaches that folder; .claude/rules with paths load per file pattern). Skills = on-demand know-how via progressive disclosure (the description decides whether it's used). MCP = new abilities from external systems (tool definitions cost context). Subagents = separate empty window, where the only bridge is the prompt string. Multi-agent = ~15x tokens, use only when the pieces pass the independence test. Permissions (deny/ask/allow) = "never"; hooks (PreToolUse, PostToolUse, Stop…) = "always". Plugins/marketplaces = packaging for teams.
- Watch-point: "advice vs guarantee" took 3 passes to land. Re-check it with a quick quiz early on (test: "if the model slips, does any code stop it?").

The exercise: my project is at D:\Dev Stuff\QA Learning App. It currently has a CLAUDE.md plus `.claude/knowledge/` and `.claude/process/` folders with .md files it reads every session. Run it as a guided exercise:
1. Inventory: read CLAUDE.md, .claude/knowledge, .claude/process and the project layout. Show me what's loaded when (and how it gets loaded) and its rough token cost.
2. I classify: for each file, I decide where it belongs (always-on CLAUDE.md, subfolder CLAUDE.md or path-scoped rule, skill, subagent, hook/permission, or delete). Quiz me on it, then give your take and why.
3. Plan: agree a target layout together (CLAUDE.md per functionality where it fits, skills, maybe subagents, settings/hooks).
4. Apply only after I say go, on a git branch if the repo uses git.
Don't change any files before step 4.

---

### Claude

> [!question] Quiz 1/2
> Your coding-standards.md says "Do not modify an already-applied migration." Late in a long session, Claude calls Edit on prisma/migrations/<old>/migration.sql. What happens?
>
> 1. Claude Code blocks the edit — The harness rejects the Edit call.
> 2. The model refuses at the last step — It catches itself before the call runs.
> 3. The edit goes through — The file is changed.
> 4. I don't know

> [!question] Quiz 2/2
> AGENTS.md has a table listing `.claude/knowledge/architecture.md`, `roadmap.md` etc. by path. At the start of a session, before Claude has done anything, how much of architecture.md is in its context?
>
> 1. All of it — Every file named in the table is loaded.
> 2. None of it — Only its path, as text in AGENTS.md.
> 3. Its headings only — A summary is loaded, the body on use.
> 4. I don't know

---

### You

**Your answer:** The edit goes through
**Your answer:** None of it

---

### Claude

> [!question] Other tools
> Do you (or will you) use other agents on this repo besides Claude Code, e.g. Codex? (I saw a `chore/codex-agent-context` branch.) This decides whether AGENTS.md stays the shared main file.
>
> 1. Yes, Codex/others too — Keep AGENTS.md as the shared file; CLAUDE.md imports it and adds Claude-only parts.
> 2. Claude Code only — Make CLAUDE.md the main file; AGENTS.md can go.
> 3. Not now, maybe later — Keep the option open.

> [!question] Quiz 1/3
> coding-standards.md: "Prefer clarity over cleverness: explicit names, small functions, predictable control flow, visible dependencies." Where does this belong?
>
> 1. Always-on CLAUDE.md
> 2. Path-scoped rule on src/**
> 3. Delete it
> 4. I don't know

> [!question] Quiz 2/3
> coding-standards.md's "Prisma and Migration Standards" section (schema changes, migrations, backfills, seed; ~90 lines). Where does it belong?
>
> 1. Path-scoped rule on prisma/**
> 2. Always-on CLAUDE.md
> 3. A subagent's prompt
> 4. I don't know

> [!question] Quiz 3/3
> project-progress.md: 57k tokens of dated entries for every past increment. When should its content be in Claude's context?
>
> 1. Every session, to know recent work
> 2. When editing files in src/features
> 3. Only when a task asks about history
> 4. I don't know

✓ **Quiz 1, correct: the edit goes through.** Your `settings.json` has no deny rule covering `prisma/migrations/`, so that line in coding-standards.md is only advice. "If the model slips, does any code stop it?" Here the answer is no. That's three correct in a row on this idea, so I'll treat it as solid now.

✓ **Quiz 2, correct: none of it.** A file path written in AGENTS.md is just text. It isn't an `@import`. architecture.md only gets into context if the model decides to call Read on it.

## Step 1: Inventory

I checked the loading rules against the current docs ([memory](https://code.claude.com/docs/en/memory)) before writing this. Token counts are rough (bytes ÷ 4).

| What | How it gets into context | When | ~Tokens |
|---|---|---|---|
| `AGENTS.md` (533 lines) | **The harness loads it automatically**, as a fallback because there's no CLAUDE.md | Every session, every turn | **~3k** |
| `.claude/settings.json` (deny/allow) | **Never.** The harness checks each tool call against it | Every tool call | **0** |
| 12 files in `knowledge/` + `process/` | **The model calls Read** because AGENTS.md's text tells it to | Whenever the model decides to | **~193k total** |

The 12 files, largest first:

| File | Lines | ~Tokens |
|---|---|---|
| process/project-progress.md | 4,340 | 57k |
| process/decision-log.md | 3,122 | 40k |
| knowledge/implementation-status.md | 3,008 | 27k |
| knowledge/roadmap.md | 1,837 | 17k |
| knowledge/architecture.md | 1,647 | 15k |
| knowledge/design-system.md | 1,252 | 9k |
| process/current-focus.md | 720 | 8k |
| process/coding-standards.md | 1,376 | 7k |
| knowledge/product-language.md | 988 | 6k |
| knowledge/domain-model.md | 946 | 5k |
| knowledge/product-vision.md | 369 | 2k |

**What this shows:**

1. **The always-on layer is cheap (3k), but too long for what it does.** AGENTS.md is 2.7× the ~200-line guideline. Much of it is generic advice the model follows anyway ("prefer the simpler solution", "leave the repo better").
2. **The real cost comes from what the model pulls in on advice.** AGENTS.md's "feature implementation" recipe reads implementation-status + architecture + current-focus + coding-standards. That's about **57k tokens before any code is read**. The "Repository Memory Check" lists nine files. A model that follows it diligently could pull in most of 193k, which doesn't fit in a 200k window alongside actual work. The two history logs alone are about half of it (97k).
3. **You already built progressive disclosure by hand.** AGENTS.md is the index (tier 1) and the files are tier 2. But the trigger is prose, and the unit is a whole file: needing one fact from architecture.md costs 15k.
4. **A hidden trap.** AGENTS.md loads *only because* no CLAUDE.md exists. If you ever add a `CLAUDE.local.md` for personal notes, AGENTS.md **silently stops loading**.
5. **Your advice and your lock disagree.** coding-standards.md tells the model to run `pnpm db:seed` for local checks, while your deny list blocks `pnpm db:seed*`. The lock wins, so nothing breaks, but every attempt wastes a turn. One side should change.
6. **There are no hooks.** Several "always" rules live only as advice: "validate before saying done", "do the Memory Check before finishing".

## Step 2: How you'll classify

Most files mix several kinds of content, so we'll classify **pieces**, not whole files. For each piece, ask these questions in order and stop at the first "yes":

1. **Must it hold even if the model slips?** → deny rule ("never") or hook ("always")
2. **Would removing it cause no mistakes?** (the model does it anyway, or code/git already say it) → **delete**
3. **Needed in almost every session, and short?** → root CLAUDE.md / AGENTS.md
4. **Needed only when working on certain files?** → subfolder CLAUDE.md or path-scoped rule (`.claude/rules/*.md` with `paths:`; it loads when Claude reads or edits a matching file)
5. **Needed only for one kind of task, like a procedure?** → skill
6. **Large reference where you need a conclusion, not the text?** → keep it as a doc, read on request or by a subagent

First batch, with one setup question:

---

### You

**Your answer:** Yes, Codex/others too
**Your answer:** Delete it
**Your answer:** Path-scoped rule on prisma/**
**Your answer:** I don't know

---

### Claude

> [!question] Quiz 1/3
> design-system.md (~9k tokens: visual philosophy, screen archetypes, tokens, typography, motion). Where does it belong?
>
> 1. Skill for UI work
> 2. Path-scoped rule on **/*.tsx
> 3. Always-on CLAUDE.md
> 4. I don't know

> [!question] Quiz 2/3
> The single rule "Do not modify an already-applied migration." Where does it belong?
>
> 1. Path-scoped rule on prisma/**
> 2. Deny rule in settings.json
> 3. Always-on CLAUDE.md
> 4. I don't know

> [!question] Quiz 3/3
> AGENTS.md's "Repository Memory Check": at the end of an increment, decide which of the 9 docs need updating and write entries in the required format. Where does it belong?
>
> 1. A Stop hook that does the updates
> 2. Always-on CLAUDE.md
> 3. A skill
> 4. I don't know

**Other tools: noted, you use Codex too.** That adds a constraint to everything that follows. Codex doesn't read Claude-only mechanisms (`.claude/rules`, hooks, `settings.json`). So anything *both* agents need should live where both can see it. I've asked the researcher exactly what Codex reads (nested AGENTS.md files, skills folders) so the plan in step 3 rests on verified facts.

✓ **Quiz 1, correct: delete it.** Use the test "would removing it cause mistakes?" Explicit names and small functions are what the model already does from training (its weights), so the line costs tokens and changes nothing. Much of coding-standards.md (1,376 lines) is this kind of content. My guess is that well over half of it goes.

✓ **Quiz 2, correct: a path-scoped rule on `prisma/**`.** It's real, repo-specific know-how, but it only matters when work touches the schema or migrations. As a rule with `paths: ["prisma/**"]` it loads the moment Claude reads or edits a file there, and costs nothing otherwise. Always-on would pay for it in every UI session. A subagent prompt would only help if a subagent did the migration work.

**Quiz 3, I don't know: the answer is "only when a task asks about history."** Go through the questions in order:
- *Every session?* No. "What's happening now" already lives in current-focus.md's `NOW` section. 57k tokens of past increments on every turn would cost a lot and bury what matters.
- *When editing src/features?* No. Path triggers suit knowledge about **files**. History is about **time**, not a folder.
- So it lands at question 6: a large reference you consult for a conclusion ("when and why did the career layer change?"). Even then, the right move is to grep for the one entry or send a subagent, not read the whole 4,340 lines. Git log and your PRs already hold much of this. AGENTS.md itself says it "complements git history".

There's a second half to this file: **writing** a new entry at the end of an increment. That's a procedure for one kind of task, which leads to the next batch.

---

### You

**Your answer:** Skill for UI work
**Your answer:** Deny rule in settings.json
**Your answer:** A Stop hook that does the updates

---

### Claude

> [!question] Quiz
> Which of these could a hook do completely on its own, with no model involved?
>
> 1. Decide if architecture.md needs a new section
> 2. Run pnpm lint after every edit
> 3. Write a decision-log entry explaining why
> 4. I don't know

---

### You

**Your answer:** Run pnpm lint after every edit

---

### Claude

> [!question] Quiz 1/3
> The "SQL Sandbox" sections of implementation-status.md and architecture.md (what's built, how it's structured, limitations, "verify before changing"). Where do they belong?
>
> 1. Root AGENTS.md, always-on
> 2. A file in src/features/sql-sandbox/
> 3. A skill for sandbox work
> 4. I don't know

> [!question] Quiz 2/3
> current-focus.md, "standing, applies to every future slice": "The dynamic lesson route must remain a generic host. It must not own feature-specific scoring, copy, or persistence rules." Where does it belong?
>
> 1. A deny rule on the route's files
> 2. Leave it in current-focus.md
> 3. A file scoped to the lesson route folder
> 4. I don't know

> [!question] Quiz 3/3
> AGENTS.md, "Active Work Selection": implement only what's under NOW in current-focus.md; never start the NEXT slice on your own; stop after the requested increment. Where does it belong?
>
> 1. Root AGENTS.md, always-on
> 2. A skill for planning work
> 3. Delete it
> 4. I don't know

---

### You

**Your answer:** A file in src/features/sql-sandbox/
**Your answer:** A file scoped to the lesson route folder
**Your answer:** A skill for planning work

---

### Claude

> [!question] Quiz 1/2
> coding-standards.md: "Use pnpm. Do not introduce commands or documentation that assume npm or Yarn." Where does it belong?
>
> 1. A skill for dependency work
> 2. Root AGENTS.md, always-on
> 3. A path rule on package.json
> 4. I don't know

> [!question] Quiz 2/2
> Which of these jobs is the best fit for a subagent?
>
> 1. Follow design-system rules while building a page
> 2. Decide which NOW slice to implement next
> 3. Find why a past rank rule was chosen, from the 40k decision-log
> 4. I don't know

---

### You

**Your answer:** I don't know
**Your answer:** Find why a past rank rule was chosen, from the 40k decision-log

---

### Claude

> [!question] Quiz 1/4
> A fact is needed equally in UI work, database work and test work, in any folder. Where should it live?
>
> 1. A skill with a broad description
> 2. Path rules on each of those folders
> 3. Root AGENTS.md, always-on
> 4. I don't know

> [!question] Quiz 2/4
> product-language.md (~6k: vocabulary like "QA Engineer, not student", tone, button and error-message wording). Where does it belong?
>
> 1. Root AGENTS.md, always-on
> 2. Inside the UI skill
> 3. A file in src/components/
> 4. I don't know

> [!question] Quiz 3/4
> roadmap.md + product-vision.md (~19k: long-term stages, future learning paths). Where do they belong?
>
> 1. A skill for product planning
> 2. Root AGENTS.md, always-on
> 3. A file in src/features/
> 4. I don't know

> [!question] Quiz 4/4
> domain-model.md (~5k: what each database entity means, who owns it, what it must never become). Where does it belong?
>
> 1. Inside the UI skill
> 2. A file scoped to prisma/
> 3. Root AGENTS.md, always-on
> 4. I don't know

---

### You

**Your answer:** Root AGENTS.md, always-on
**Your answer:** Inside the UI skill
**Your answer:** A file in src/features/
**Your answer:** A file scoped to prisma/

---

### Claude

> [!question] Wiring
> How should folder-level files be wired for the two tools?
>
> 1. AGENTS.md + 1-line CLAUDE.md (Recommended) — Documented pattern; robust; doubles the file count (the CLAUDE.md files are one line each).
> 2. AGENTS.md only, no CLAUDE.md — Fewer files; relies on Claude's fallback mode, which stops working if anyone adds a CLAUDE.local.md.

> [!question] Codex skills
> Codex can't see .claude/skills (it reads .agents/skills). How should Codex get the three skills?
>
> 1. Pointer lines in AGENTS.md (Recommended) — e.g. "For UI work, read .claude/skills/ui-design/SKILL.md". One copy; for Codex it's advice-level.
> 2. Duplicate into .agents/skills — Native for both tools, but two copies that can drift (symlinks are unreliable on Windows).
> 3. Ignore Codex for skills — Only Claude gets them.

> [!question] History log
> project-progress.md is 57k tokens and largely duplicates git history and PRs. What should happen to it?
>
> 1. Keep it, never read whole — Unchanged; the history agent greps it when asked.
> 2. Archive old entries — Move entries before e.g. Stage 3 into an archive file; keep recent ones.
> 3. Stop writing it; rely on git + PRs — Freeze the file; repo-memory skill writes good PR descriptions instead.

> [!question] Guarantees
> Which guarantees do you want in settings.json? (pick any) *(pick all that apply)*
>
> 1. Deny editing applied migrations — Edit(prisma/migrations/**) in deny.
> 2. Deny reading .env files — Read of .env / .env.local blocked (.env.example still readable).
> 3. PostToolUse: eslint the edited file — After each Edit/Write of a .ts/.tsx file, lint just that file and feed errors back.
> 4. Stop hook: repo-memory nudge — Once per session, if files changed, block finishing with "run the repo-memory skill".

✓ **Quiz 1, correct: root AGENTS.md.** No narrower trigger, so it's always-on. The principle has landed.

✓ **Quiz 2, correct: inside the UI skill.** The trigger is a *kind of task*: writing what learners read (labels, buttons, errors). That's the same trigger as design-system.md, so both go in one skill.

✓ **Quiz 4, correct: a file scoped to `prisma/`.** The schema is where entities get changed, so that's where their meaning is needed.

✗ **Quiz 3: the answer is a skill for product planning.** Roadmap and vision are needed for one *kind of task*: deciding what to build next. They aren't tied to a *place*. A file in `src/features/` would also load whenever Claude opens any feature file, which happens in nearly every session. That makes it 19k tokens of almost-always-on, the same trap as the `*.tsx` rule earlier. Your own AGENTS.md already supports this: "the roadmap informs direction; current focus authorizes." Implementation sessions shouldn't read it at all.

## Your classification, complete (with my take on the parts we didn't quiz)

| Piece | Goes to |
|---|---|
| AGENTS.md: mission (5 lines), "Active Work Selection", pnpm + commands, a short doc index | **Root AGENTS.md** (~100–150 lines) |
| AGENTS.md: workflow steps 1–7, working principles, general expectations, final principle | **Delete** (the model does these by default) |
| AGENTS.md: Memory Check, doc responsibilities, entry formats · coding-standards: completion checklist | **Skill `repo-memory`** |
| coding-standards: generic principles (clarity, naming…) | **Delete** |
| coding-standards: Prisma/migration/seed + domain-model.md | **`prisma/` folder file** |
| coding-standards: testing standards + current-focus "Testing Requirements" | **`tests/` folder file** |
| current-focus "Architecture Requirements" (generic lesson host) | **`src/app/(protected)/learn/` folder file** |
| implementation-status + architecture, per-feature sections | **`src/features/<x>/` folder files** |
| architecture: cross-cutting parts (layers, feature boundaries) | **Slimmed architecture.md**, pointed to from root |
| design-system + product-language + coding-standards styling/a11y | **Skill `ui-design`** (short SKILL.md; the two docs as tier-3 references) |
| roadmap + product-vision | **Skill `product-planning`** |
| decision-log + project-progress | **Stay as docs, never read whole.** A **`history` subagent** answers "why/when", and `repo-memory` writes new entries |
| current-focus.md | **Stays**, trimmed to NOW / NEXT / NOT NOW (~2k instead of 8k) |
| "Never edit an applied migration" | **Deny `Edit(prisma/migrations/**)`** |
| "Run pnpm db:seed" advice vs your deny rule | **Remove the advice** (the lock already holds) |

## Step 3: Proposed target layout

```
QA Learning App/
├── AGENTS.md                  ← ~120 lines, both tools: mission, pnpm + commands,
│                                NOW rule, index of folder files / skills / docs
├── CLAUDE.md                  ← "@AGENTS.md" + Claude-only notes (skills, history agent)
├── prisma/AGENTS.md           ← migration/seed standards + domain model
├── prisma/CLAUDE.md           ← "@AGENTS.md"
├── tests/AGENTS.md + CLAUDE.md
├── src/app/(protected)/learn/AGENTS.md + CLAUDE.md   ← "generic lesson host" rule
├── src/features/<feature>/AGENTS.md + CLAUDE.md      ← that feature's status + architecture
└── .claude/
    ├── settings.json          ← + new deny rules, + hook(s)
    ├── skills/ui-design/      ← SKILL.md + references/{design-system,product-language}.md
    ├── skills/repo-memory/    ← SKILL.md (Memory Check + entry formats)
    ├── skills/product-planning/ ← SKILL.md + references/{roadmap,product-vision}.md
    ├── agents/history.md      ← read-only; answers "why/when" from the two logs
    ├── knowledge/architecture.md   ← cross-cutting only
    └── process/{current-focus, decision-log, project-progress}.md
```

**Why a CLAUDE.md beside each AGENTS.md.** That's the documented pattern for repos shared with other tools. Once a root CLAUDE.md exists, Claude stops auto-reading subfolder AGENTS.md files, so each folder needs its own one-line `@AGENTS.md` file. The alternative, no CLAUDE.md anywhere, works today. But it breaks **silently** the day anyone adds a `CLAUDE.local.md`.

**Expected cost.** Always-on drops from ~3k to ~1.5k tokens. The bigger change is a typical feature task: from ~57k pulled in on advice to roughly the root file + one feature file + current-focus, about **5–8k**.

A few decisions are yours:

---

### You

**Your answer:** AGENTS.md + 1-line CLAUDE.md (Recommended)
**Your answer:** Pointer lines in AGENTS.md (Recommended)
**Your answer:** Keep it, never read whole
**Your answer:** Deny editing applied migrations, Deny reading .env files, PostToolUse: eslint the edited file, Stop hook: repo-memory nudge

---

### Claude

> [!question] Apply
> Ready for step 4? Which base should the new branch (chore/agent-context-restructure) start from?
>
> 1. Go, branch from main — Clean base; your current branch claude/small-fixes is left alone.
> 2. Go, branch from claude/small-fixes — Builds on your current (clean) branch.
> 3. Not yet — Change something in the plan first.

---

### You

**Your answer:** claude/small-fixed has been merged into main, go, branch from main

---

### Claude

I'll do the mechanical moves with a script so sections are copied **verbatim** rather than retyped. First the section map:

LF everywhere. I'll make the archive go at the top of project-progress.md (it's newest-first), and avoid touching unrelated blank lines:

Moved. Now an integrity check: every non-blank line removed from the old files should exist in one of the new files.

Next I'll check which files point at paths that moved, before rewriting the root file:

Now the `repo-memory` skill. Let me see the procedure text I extracted, so I can update its paths:

Now the two hook scripts. I'll check the ESLint version first so the flags are right:

The local modifications are only my own extraction, and the original stays in git history, so forcing the removal is safe:

Now `settings.json`: the new deny rules and both hooks.

Now the stale pointers. Let me look at the live (non-history) references to files that no longer exist:

Settings are valid JSON. Now I'll test both hooks by feeding them the same kind of JSON Claude Code sends:

Hooks work on the awkward paths too. Last step is the before/after measurement:

I've applied the restructure on branch `chore/agent-context-restructure`, created from `origin/main` and untracked so a push can't land on main. All changes are staged but **not committed**, so you can review the diff first.

## Before → after

| | Before | After |
|---|---|---|
| Loaded in every session (root files) | 533 lines, ~3k tokens | 112 lines, ~1.5k tokens |
| Typical feature task (root + what the model is told to read) | ~57k tokens | ~6k tokens (root + one feature file + current-focus) |
| History logs (97k tokens) | Read whole on advice | Never read whole; the `history` subagent searches them |
| Guarantees | One deny list | Deny list + 6 new deny rules + 2 hooks |

## What moved where

- **Root `AGENTS.md`** (shared by both tools): mission, commands, the NOW rule, stable systems, the repo-specific code conventions, and an index of where everything else lives. **`CLAUDE.md`** imports it and adds the Claude-only notes.
- **25 folder files** (each an `AGENTS.md` plus a one-line `CLAUDE.md`): 22 features in `src/features/`, plus the lesson route, `prisma/` (including the full domain model) and `tests/`. Their sections were moved **verbatim**. A script checked that every non-heading line removed from the old files exists in a new one; zero lines are missing.
- **Three skills**: `ui-design` (design system, product language, UI standards), `product-planning` (roadmap, vision) and `repo-memory` (Memory Check, entry formats, completion checklist).
- **`history` subagent**: read-only, on the cheap Haiku model.
- **Deleted**: `coding-standards.md` (its generic parts are gone and the rest was distributed), the redundant "Repository Planning Rule", and `domain-model.md` (now in `prisma/AGENTS.md`). The old milestone history from current-focus.md is now at the top of project-progress.md.
- I also fixed six stale pointers to the moved files: one in README, one in docs, one code comment, and three in the remaining docs.

**Tested:** I ran the lint hook on a clean file (passes), a file with errors (reports them back), Markdown (skipped), and a path containing `(protected)`. The Stop hook blocks once, then lets Claude finish. `settings.json` is valid.

## Things to know before you commit

1. **The migration deny has a real cost.** It also blocks the common pattern of `prisma migrate dev --create-only` followed by hand-editing the new file to add custom SQL. If you hit that, you either make the edit yourself or I switch the rule from `deny` to `ask`.
2. **The `.env` protection only partly holds.** `Read` deny covers the file tools, and I added `cat .env*` and `Get-Content .env*`. But other shell commands (`head`, `type`…) aren't covered, so it holds against slips, not against every route.
3. **I didn't touch one stale fact.** current-focus.md's "Current Milestone" still says Stage 2 is active, while NOW says Stage 3 is finished. That content is your call.
4. **Codex only reads a folder `AGENTS.md` if it's launched in that folder.** Otherwise it relies on the index table's "read it before working there" line, which is advice.
5. **The hooks and new deny rules take effect in the next session** you open in the project.

## Your map after this exercise

Each mechanism now has a real job in your repo:
- **Always-on** holds only rules with no narrower trigger.
- **Folder files** are triggered by *place*, **skills** by *kind of task*, the **subagent** by *needing a conclusion*.
- **Deny rules and hooks** cover what must hold even when the model slips.

Two ideas took a second pass this session: "a hook guarantees that something happens, a skill guides how it's done", and "a guardrail must be present wherever the behaviour can happen". Both are worth a quick re-check next time.

To commit after reviewing the staged diff:

```bash
git -C "D:/Dev Stuff/QA Learning App" commit -m "Restructure agent context: folder AGENTS.md files, skills, history agent, hooks"
```

Or tell me to commit it, and whether you want the migration rule changed to `ask` first.

---

### You

That's alright, I did some changes and also some additional ones., you can check, check the local repo again D:/Dev Stuff/QA Learning App and see what were the exact changes made, for md documents placements, agents.md, subagents, hooks and rules. After that, I have one more project that we can exercise on.

---

### Claude

> [!question] Quiz
> prisma/seed.ts itself refuses to run when VERCEL is set or APP_ENV/NODE_ENV isn't development-like. With the deny rule removed, Claude runs `pnpm db:seed` on your laptop mid-session. What happens?
>
> 1. The script's guard refuses to run
> 2. Claude Code blocks it per CLAUDE.md
> 3. Your local learner data is wiped
> 4. I don't know

I've checked the repo. Here's what landed, then one thing worth discussing.

## What's in the repo now

| Commit | What it did |
|---|---|
| `1b512d5` (directly on main) | The restructure as I staged it: 25 folder `AGENTS.md` + `CLAUDE.md` pairs, the 3 skills, the `history` agent and the 2 hooks |
| `0a23a98` (directly on main) | The other half: slimmed root `AGENTS.md`, old knowledge files removed, `settings.json` deny rules and hooks, pointer fixes |
| `13705cb` (PR #58) | **Your change:** domain model split out of `prisma/AGENTS.md`; a **SessionStart baseline** for the Stop hook |
| `4bfd50f` (PR #58) | **Your change:** removed the `pnpm db:seed` deny rules |
| uncommitted, on `main` | A proposed Stage 4 increment map in `roadmap.md` (Increments 34–47, decisions D1–D8), plus a matching line in `current-focus.md` |

There's no `.claude/rules/` folder, which fits the Codex decision: everything path-scoped lives in folder `AGENTS.md` files both tools can read.

## Your changes, and my take

**1. `prisma/domain-model.md` split out: a good call.** I'd put 26.5 KB into a file that loads whenever *any* file under `prisma/` is read. Now 7.5 KB loads automatically, and the entity model loads only when needed. The trade-off is deliberate: reading the domain model is now advice (a pointer), not automatic. For a ~5k-token reference that most schema edits don't need, that's the right side of the trade.

**2. SessionStart baseline: this fixes a real flaw in my hook.** My Stop hook fired whenever the tree was dirty, including changes that existed *before* the session began. Your version takes a fingerprint at session start (HEAD + status + diff) and nudges only if it changed. It keeps the first baseline across resume, `/clear` and compaction, and counts a session that commits its own work. Two minor limits, both acknowledged in your own comments: edits to files that were already untracked aren't detected, and marker files pile up in the temp folder.

**3. Removing the `db:seed` deny: this one contradicts the rest of the setup.** The lock is gone, but the advice still says it's there:
- `AGENTS.md:22`: "is denied to agents; ask the user"
- `CLAUDE.md:14`: "Deny rules block `pnpm db:seed`"
- `current-focus.md` (Outstanding item 2): "The command stays denied to agents"

The commit calls the rules "redundant". Before I say whether I agree, here's your watch-point topic in a new form:

---

### You

**Your answer:** Your local learner data is wiped

---

### Claude

✓ **Correct: your local learner data is wiped.** That's the key to whether the rule was "redundant". There are two guarantees here, and they protect **different things**:

| Guarantee | Code that enforces it | Protects |
|---|---|---|
| Guard inside `seed.ts` | The script checks `VERCEL` / `APP_ENV` | **Production and preview** databases |
| `db:seed` deny rule (now removed) | Claude Code checks the tool call | **Your local dev database**: learner progress, submissions, demo accounts |

On your laptop the guard *allows* the run, because that's exactly what it's for. So nothing stops it now except the line in AGENTS.md, which is advice. Ask your test question: "if the model slips, does any code stop it?" For production, yes. For local data, no longer.

There's also a second problem, separate from the first: the docs now **describe a lock that doesn't exist**. A model that reads "deny rules block db:seed" may assume it's safe to try. Either way, the rule and the docs need to agree. Two options:

- **Put it back as `ask` (my recommendation).** Claude can run it, but only after you approve each time. That fits the real workflow better than deny. Current-focus.md says to rerun the seed by hand "whenever the showcase roster or the seed changes", and with `ask` Claude can propose it and you click yes.
- **Leave it unlocked and fix the three docs** to say "destructive; ask the user before running". It stays advice, but at least it's honest advice.

Two housekeeping notes:
- The Stage 4 roadmap draft is **uncommitted on `main`**. Your Stop hook will nudge for it, which is correct. Commit it on a branch rather than on main.
- `chore/agent-context-restructure` is now a leftover branch at the old commit; `git branch -d` removes it safely.

Tell me which option you want for `db:seed`. I won't touch anything in this repo until you say so. Then send the path to the next project, and we'll start with the same inventory step.

---

### You

I moved the stage 4 planning to another branch, continue with the changes and put db:seed as your recommendation, with ask

---

### Claude

`pnpm db:seed` now needs your approval each time Claude runs it. The change is committed on a new branch, `chore/db-seed-ask` (commit `e817477`), but not pushed and no PR yet.

- **`.claude/settings.json`**: a new `ask` list covering `pnpm db:seed`, `pnpm run db:seed` and `pnpm exec tsx prisma/seed.ts`, in both Bash and PowerShell. `ask` beats `allow`, so your personal `Bash(pnpm exec *)` allow in `settings.local.json` doesn't skip the prompt.
- **`AGENTS.md`, `CLAUDE.md`, `current-focus.md`**: the three places that still said "denied" now say "asks for approval". The rules and the docs agree again.
- I also deleted the leftover `chore/agent-context-restructure` branch.

The settings file is valid JSON, but I haven't watched the prompt fire. It takes effect in your next Claude Code session in that project. The match is by command pattern, so a different spelling (say, running `tsx prisma/seed.ts` directly) wouldn't trigger it.

Push it and open the PR when you're ready. Then send the path to the next project and we'll start with the inventory, same as this one.

---

### You

PR was created and merged. Now let's talk about the next project, which is located at D:\Dev Stuff\Unity\Projects\ExtractionShooter and is a different type of project, a game made in unity. How can we apply what I've learned to that we optimize the token usage and workflows of this project?

---

### Claude

> [!question] Other tools
> Do you use any other agent (Codex, Cursor…) on this Unity project, or only Claude Code? This decides whether per-module notes must be AGENTS.md files.
>
> 1. Claude Code only — Claude-only mechanisms (.claude/rules, hooks) are fine everywhere.
> 2. Codex/others too — Shared files must stay readable by both, like the QA app.
> 3. Maybe later — Prefer shared files where it costs little.

> [!question] Quiz 1/3
> CLAUDE.md's "Current State" (170 lines: what M1.1 through M4.8 each built). Where does it belong?
>
> 1. Keep it always-on in CLAUDE.md
> 2. A skill for milestone work
> 3. The progress log, read on request
> 4. I don't know

> [!question] Quiz 2/3
> "Horde (M1.4)" conventions: zero per-tick allocation, committed lunges, rate-limited facing, separation bounds (~30 lines). Where do they belong?
>
> 1. Always-on CLAUDE.md
> 2. A skill for enemy design
> 3. Scoped to Code/Enemies/
> 4. I don't know

> [!question] Quiz 3/3
> "Rebalance by editing the CSV, never a generated asset (Assets/_Project/Generated/)." Where does it belong?
>
> 1. Deny rule on Generated/**
> 2. Always-on CLAUDE.md
> 3. Path rule on Data/*.csv
> 4. I don't know

## Step 1: Inventory of ExtractionShooter

This project has the same shape as the QA app, but each part is roughly **3–10× bigger**, and Unity adds a few traps of its own.

| What | How it gets into context | When | ~Tokens |
|---|---|---|---|
| `CLAUDE.md` (596 lines) | Loaded by the harness | **Every session** | **~30k** (the Read tool's own count) |
| `.claude/process/project_progress.md` (2,761 lines) | Model reads it, because CLAUDE.md says *"Read it at the start of a session"* | **Every session, in practice** | **64k+** |
| 29 design docs in `.claude/docs/` | Model reads them ("read the relevant doc before implementing") | Per task | 89k+ total, 1–9k each |
| M3 plan + audit (milestone finished) | Model reads them | Rarely | 17k |
| `m4-plan.md` (active) | Model reads it | M4 work | 10k |
| `unity-cli` project skill | Description only; body on use | Every session | ~100 (body 8k) |
| `unity-editor-mcp` server | Defined at **user** scope in `~/.claude.json` | **Every session in every project**, including the QA app and this Learning folder | ~150 tool names |
| The `unity` plugin (~35 `unity:*` skills) | Skill descriptions | **Every session in every project** | several k |
| `.claude/settings.json` | **Doesn't exist** | — | No permissions, no hooks |

One caveat on the numbers: for this repo my "bytes ÷ 4" estimate gave 19k for CLAUDE.md, but the Read tool counted 30.6k. C# identifiers and numbers tokenize worse than prose. So treat the other figures as **lower bounds**.

**What this shows:**

1. **A session can spend ~95k tokens before touching code.** That's ~30k always-on, plus ~64k if the model obeys "read the progress log at session start". Nearly half a 200k window. In the QA app the comparable start was 3k.
2. **CLAUDE.md is mostly not "always-needed" content.** It has three big blocks:
   - "Current State" (170 lines): a PR-by-PR history from M1.1 to M4.8.
   - "Technical Conventions" (310 lines): written per module — Horde, Loot, XP, Techniques, Hideout…
   - The rest: pillars, numbers, assembly rules, testing, tooling.

   The per-module block maps neatly onto your 9 assemblies in `Assets/_Project/Code/`.
3. **There are no guarantees at all.** Every "never" is advice:
   - "never hand-edit a generated asset"
   - "never hand-edit `.unity`/`.prefab` YAML"
   - "save scenes before running tests" (this one caused two long stalls)
   - "Play mode writes the real save, so back it up first"

   Your C# tests are real code guarantees (`GeneratedDataDriftTests`, `HordeTests` zero-alloc). But they only catch a slip **after the fact**, and only when the tests run.
4. **Unity has its own token traps.** Scenes reach 900 KB and prefabs 400 KB of YAML; one accidental Read of a scene could fill most of the window. There are 556 prefabs and 405 `.asset` files for Grep to hit, plus `Library/` and nine ~90 KB `.csproj` files.
5. **Costs leak across projects.** The Unity MCP server and plugin are installed for *you*, not for this project, so every non-Unity session pays for them too. You saw it here: earlier in this Learning session I had ~180 Unity tool names loaded. The `unity-cli` skill also exists **twice**: the project copy and the plugin's `unity:unity-cli`.

## Step 2: Classify

The same sorting rule applies: **the trigger decides the mechanism.** Start with the three biggest pieces, plus one setup question:

---

### You

**Your answer:** Claude Code only
**Your answer:** The progress log, read on request
**Your answer:** Scoped to Code/Enemies/
**Your answer:** Deny rule on Generated/**

---

### Claude

> [!question] Quiz 1/4
> Unity creates a .meta file for every file it finds under Assets/ (a CLAUDE.md there gets one too, and shows up in the Project window). Claude-only project. Where should the Enemies module's notes live?
>
> 1. Assets/_Project/Code/Enemies/CLAUDE.md
> 2. .claude/rules/enemies.md with paths:
> 3. A skill for enemy work
> 4. I don't know

> [!question] Quiz 2/4
> "Playing the raid scene in the editor writes the real save, so back it up first." Claude starts Play mode through the MCP's editor_play tool. Where does this rule belong?
>
> 1. A line in CLAUDE.md
> 2. Deny the editor_play tool
> 3. PreToolUse hook on editor_play
> 4. I don't know

> [!question] Quiz 3/4
> The unity-editor-mcp server is defined at user scope, so it connects in every project you open. Where should it be defined?
>
> 1. Project scope, in this repo's .mcp.json
> 2. Keep it at user scope
> 3. Inside the unity-cli skill
> 4. I don't know

> [!question] Quiz 4/4
> Scenes are up to 900 KB of YAML; CLAUDE.md says to change them through the MCP, never by hand. Where does "don't read or edit .unity/.prefab files directly" belong?
>
> 1. A path rule on Scenes/ and Prefabs/
> 2. Deny Read/Edit on *.unity and *.prefab
> 3. Always-on CLAUDE.md line
> 4. I don't know

---

### You

**Your answer:** .claude/rules/enemies.md with paths:
**Your answer:** I don't know
**Your answer:** I don't know
**Your answer:** Deny Read/Edit on *.unity and *.prefab

---

### Claude

> [!question] Quiz 1/2
> "Save your scene edits before running tests" (a dirty scene makes run_tests hang on a modal). The unity CLI can call save_all from a shell. Where does this rule belong?
>
> 1. Deny run_tests until scenes are saved
> 2. A line in the Tooling section
> 3. PreToolUse hook on run_tests
> 4. I don't know

> [!question] Quiz 2/2
> A GitHub MCP server you use for PRs in all your repos (QA app, Unity, others). Which scope?
>
> 1. Project .mcp.json in each repo
> 2. User scope
> 3. Local scope in one repo
> 4. I don't know

✓ **Quiz 1, correct: `.claude/rules/enemies.md` with `paths: ["Assets/_Project/Code/Enemies/**"]`.** It loads at the same moment a folder CLAUDE.md would, when Claude reads or edits a file there. But it lives outside `Assets/`, so Unity never sees it, and you get no `.meta` files and no Markdown in your Project window. In the QA app we picked folder AGENTS.md files only because Codex can't read `.claude/rules`. Without Codex, rules fit better here.

**Quiz 2, I don't know: the answer is a PreToolUse hook on `editor_play`.** Use the two questions from the sorting table:
- *Must it hold even if the model slips?* Yes. A slip loses your real save, which is the progress you've played. So it can't stay a CLAUDE.md line.
- *Is it a "never" or an "always"?* It isn't "never play". Claude needs Play mode to verify its work, so a deny rule would block a legitimate workflow. It's "**always back up before playing**", and "always do X before Y" is a hook on Y. A `PreToolUse` hook matching `mcp__unity-editor-mcp__editor_play` runs your copy command first, then exits 0, and the Play call goes ahead. The model doesn't have to remember anything.

**Quiz 3, I don't know: the answer is project scope (this repo's `.mcp.json`).** This is the settings-layer table from the lesson, applied to MCP:

| Scope | Meaning | Right for |
|---|---|---|
| User (`~/.claude.json`) | You, **in every project** | Tools you use everywhere (`gh`, a docs search) |
| Project (`.mcp.json`, committed) | **This repo**, anyone who clones it | Tools tied to this codebase |
| Local | You, in this repo only, not committed | Private or experimental servers |

Editor tools are useless outside a Unity project, yet at user scope their names and server instructions load in the QA app and in this Learning folder too (Truth 2). The same reasoning applies to the `unity` plugin. Enable it in this project's `.claude/settings.json` (`enabledPlugins`) and turn it off at user level, and its ~35 skill descriptions stop loading everywhere else.

✓ **Quiz 4, correct: deny Read/Edit on `*.unity` and `*.prefab`.** One accidental Read of a 900 KB scene can wreck a session, and Claude is supposed to use the MCP for scenes anyway. Two notes:
- `git diff` through Bash still works for reviewing scene changes.
- A `Read` deny also keeps those files out of Grep and Glob results, on a best-effort basis.

Two quick checks on the nodes you missed, before we build the plan on them:

---

### You

**Your answer:** PreToolUse hook on run_tests
**Your answer:** User scope

---

### Claude

> [!question] Hooks
> Which hooks do you want? *(pick all that apply)*
>
> 1. Back up profile.sav before Play — PreToolUse on editor_play; keeps timestamped copies next to the save.
> 2. save_all before run_tests — Prevents the modal stall; also saves your own unsaved scene edits.
> 3. Stop nudge for the PR wrap-up — Same baseline-aware hook as the QA app, pointing at the pr-wrapup skill.

> [!question] MCP scope
> Move the Unity MCP server out of user scope to where?
>
> 1. Project .mcp.json (Recommended) — Committed with the repo; approve it once on first use.
> 2. Local scope — Private to you in this repo, not committed.
> 3. Leave it at user scope — Keep paying for it in every project.

> [!question] Apply
> You're on m4/narrative-quests with two modified .mat files. Where should the restructure branch start?
>
> 1. Go, branch from main — New branch chore/agent-context; your .mat changes stay in the working tree untouched and uncommitted.
> 2. Go, branch from m4/narrative-quests — Builds on the current branch.
> 3. Not yet — Change something in the plan first.

✓ **Both correct.** "Always save before testing" is an always-before rule, so it's a `PreToolUse` hook that runs `unity command save_all`. A GitHub server is useful in every repo, so it goes at **user** scope. The test for each one is the same question: "where is it useful?"

## Classification, complete

| Piece of CLAUDE.md / .claude | Goes to |
|---|---|
| Game summary, Non-Negotiables (pillars), Cross-Cutting Numbers, assembly dependency rules | **Always-on CLAUDE.md**: no narrower trigger, and they're constraints you can't break anywhere |
| "Current State": the M1.1–M4.8 history | **Progress log.** CLAUDE.md keeps ~5 lines: the current phase plus a pointer to `m4-plan.md` |
| "Read the progress log at session start" | **Delete.** Replaced by a `history` subagent (the same one the QA app has) |
| Technical Conventions, per module | **9 path-scoped rules** in `.claude/rules/`, one per assembly (Core, Combat, Enemies, Progression, Raid, UI+Input, Tests), plus `data-pipeline` (`Data/**`, `Code/Editor/Data/**`) and `maps` (`Data/Maps/**`, `Settings/MapThemes/**`) |
| Design-doc table + conflict rules | Stays in CLAUDE.md as a short pointer table (the docs already load on demand) |
| "Update the progress log in every PR" + its template | **Skill `pr-wrapup`**, plus the **Stop-hook nudge** with the session baseline from the QA app |
| m0 findings, M3 plan + audit (finished work) | **`.claude/process/archive/`** |
| Never edit `Generated/**`; never Read/Edit `*.unity` / `*.prefab` | **Deny rules** |
| Back up the save before Play; save scenes before tests | **PreToolUse hooks** on `editor_play` / `run_tests` |
| Unity MCP server (user scope) | **This repo's `.mcp.json`** |
| Tooling notes (MCP shows 0 tools → use the CLI; bash, not PowerShell) | Stays in CLAUDE.md, ~5 lines: needed whenever the MCP misbehaves, which can happen in any task |

**Expected effect:**
- **Every session:** ~30k → ~6k always-on. Removing the read-at-start habit saves another 64k+.
- **A typical Raid task:** about 6k + the Raid rule (~7k) ≈ 13k, instead of ~95k.
- **Every non-Unity project** (QA app, this folder) stops paying for ~150 Unity tool names.

**One thing I can't promise yet:** the `unity` plugin with its ~35 skills isn't in any of your settings files. It looks synced from your claude.ai account (`~/.claude/plugins/synced`), so it may only be switchable in the app, not per project. I'll check that during the apply step and tell you what I find. The project's own `unity-cli` skill also duplicates the plugin's. I'd keep the project copy, since it's version-pinned with the repo.

**The hooks in concrete terms:**
- **`editor_play` →** copy `%USERPROFILE%\AppData\LocalLow\DefaultCompany\ExtractionShooter\profile.sav` to a timestamped backup, then continue.
- **`run_tests` →** `unity command save_all`, then continue. Note: this also saves *your* unsaved scene edits.
- **Stop →** the progress-log nudge, only if the session changed something.

---

### You

**Your answer:** Back up profile.sav before Play, save_all before run_tests, Stop nudge for the PR wrap-up
**Your answer:** Project .mcp.json (Recommended)
**Your answer:** branch from main and also you can drop those uncommitted files

---

### Claude

> [!question] Base
> How should the restructure handle the open M4.8 PR?
>
> 1. Merge PR #56 first, then branch from main (Recommended) — You merge M4.8; I fetch and branch from the updated main. No conflict, nothing missing.
> 2. Branch from m4/narrative-quests — Includes M4.8 now; the restructure PR then depends on #56 being merged first.
> 3. Branch from main anyway — Restructure without M4.8; resolve the CLAUDE.md conflict later by hand.

---

### You

**Your answer:** I merged M4.8 to main

---

### Claude

Main now includes M4.8, and its `CLAUDE.md` matches what I read. To group the convention blocks into rules, I need each block's line range and which assemblies its classes live in:

Every line of the old `CLAUDE.md` is accounted for: 16 rules, the archive, or kept. Now I'll assemble the new `CLAUDE.md` from the kept ranges plus three short new sections:

The new `CLAUDE.md` reads cleanly. Next come the skill, the agent, the hook scripts, the settings and `.mcp.json`:

All the files are written. Now I'll test the hooks with simulated inputs:

The backup works. It created two copies of your real `profile.sav`, which I'll remove since they were only test runs. One more Stop-hook case: a baseline on a clean tree, then a change, should block.

The Stop hook blocks once, then stays silent. Last step: move the MCP server out of user scope, as you chose.

The ExtractionShooter restructure is staged (not committed) on a new branch `chore/agent-context`, created from the updated `main`. Your two `.mat` changes are discarded, as you asked.

## Before → after

| | Before | After |
|---|---|---|
| `CLAUDE.md`, loaded every session | 596 lines, ~30k tokens | 155 lines, about **6k** (estimated: 3.8k by my count, scaled by the same 1.6× gap I saw on the old file) |
| "Read the progress log at session start" | 64k+ tokens per session, on advice | Removed. The `history` subagent searches the log instead |
| Module conventions | All in `CLAUDE.md`, always loaded | **16 path-scoped rules**, 300–2,700 tokens each, loaded only when Claude touches their files |
| Unity MCP server | User scope: in every project | **This repo's `.mcp.json`** only |
| Guarantees | None | 5 deny rules + 4 hooks |

A typical task now starts at about **7–9k tokens**, against ~95k before.

## What changed

- **`.claude/rules/`**: 16 feature rules. Their `paths` follow the code across assemblies; `loot.md`, for example, covers `Raid/Loot/**`, `RaidSimulation.Bag.cs`, `RaidHud.Bag.cs` and `Progression/Gear/**`. Every line of the old `CLAUDE.md` is either kept, moved verbatim into a rule, or archived; a script checked that none was skipped.
- **Archived** to `.claude/process/archive/`: the old "Current State" history, plus the M3 plan and audit.
- **Skill `pr-wrapup`**: progress-log entry, rules, design docs and plan, in one checklist.
- **Subagent `history`**: answers questions from the progress log and git without loading the log.
- **Deny rules**: editing `Generated/**`; reading or editing `*.unity` and `*.prefab`.
- **Hooks**:
  - back up `profile.sav` before `editor_play`;
  - `save_all` before `run_tests`;
  - the session-baseline Stop nudge, carried over from the QA app.

  The first two also catch the same commands run through `unity command` in Bash, so the CLI isn't a way around them.
- **MCP**: I ran `claude mcp remove unity-editor-mcp --scope user`. The QA app and this folder no longer load the Unity tools. The first Unity session will ask you to approve the project server once.

## Tested, and not

- **Tested with simulated inputs:**
  - The backup really copies your save. It made two test copies, which I deleted.
  - Unrelated Bash commands pass straight through.
  - The Stop hook blocks once after a change, then stays silent.
  - Both JSON files are valid.
- **Not tested: `save_all` against a live Editor.** The Editor was closed. With no Editor the hook steps aside; with an Editor it blocks the test run if saving fails. Worth watching on your first test run.
- **Everything takes effect in your next session** in the project.

## Things to know

1. **I didn't change the `unity` plugin** (~35 skill descriptions in every project). It's synced from your claude.ai account, not a settings file, so per-project scoping didn't apply cleanly. If you want it off in non-Unity work, toggle it in the app. The repo's own `unity-cli` skill duplicates one of its skills; I kept the repo copy because it's pinned with the project.
2. **The scene deny only partly holds.** It covers Claude's file tools, but a Bash `cat` of a scene still works. That's enough to stop slips, not every route.
3. **The two PreToolUse hooks match every Bash call**, so each Bash command starts a quick `node` check that usually exits immediately. Small, but not zero.

To commit after reviewing:

```bash
git -C "D:/Dev Stuff/Unity/Projects/ExtractionShooter" commit -m "Move module conventions to path-scoped rules; add hooks, deny rules, pr-wrapup skill and project MCP"
```

**What this project added to your map:** *scope follows usefulness*. The same reasoning that places a rule (always-on, folder, task) also places MCP servers and plugins (user, project, local). The choice between folder files and `.claude/rules` depended on two facts about the project: which agent tools you use (no Codex here) and how the engine treats files (Unity makes a `.meta` for everything under `Assets/`).
