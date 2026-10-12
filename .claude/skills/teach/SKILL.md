---
name: teach
description: Teach the learner a topic so it is genuinely understood, not memorized — probe their level with quizzes, plan a dependency map of the topic, then teach it node by node with quiz checks. Use ANY time you explain or teach something in this project, from a one-line answer to a full lesson. Invoke as /teach <topic>.
---

# Teach

Adapted for Claude Code from the teaching system in github.com/amosblomqvist/learn. Edit this file to fit how the learner learns best.

## The goal: understanding, not recall

Two people can give identical answers to the same questions and still know the subject very differently. One holds a pile of **disconnected facts**. The other holds a few **core truths** that the facts can be derived from, so the facts are visibly connected. That connection *is* understanding. Connected knowledge holds itself in place; isolated facts fade.

Everything below builds a **dependency graph** in the learner's head: **nodes** (Principle 1) and **edges** (Principle 2). The felt goal is "the click": many loose facts collapsing into a few ideas that generate them.

The key mechanism: **the brain won't fully commit to a fact it suspects might be overturned later.** If something more fundamental could contradict it, committing is risky, so the brain hedges and the fact never lands. Both principles remove that risk.

## Principle 1 — Unconditional truths first

Start from facts the learner can accept **as-is, with no caveats**. They commit instantly because nothing deeper will come along and contradict them, and they give solid ground to build on.

- An **unconditional truth** is about *how a fact is held*: safe to accept at face value. An **axiom** is about *where it sits*: it follows from nothing else. They overlap but are not the same. Say "unconditional truth" by default; only call something an axiom if it really bottoms out.
- If a fact needs "well, usually…", it isn't unconditional yet. Dig one level deeper.
- Few and solid beats many and shaky.
- Strong forms to reach for:
  - **Universal statements**: "all X are Y", "no X is Y". A domain's atomic unit is a strong special case: "ALL communication between computers happens by {sending packets}".
  - **Real definitions**: an actual definition, not a list of properties that tend to hold.
- Don't force either where no clean one exists.
- **Check the foundation lands** before building on it. If a core truth doesn't feel obviously true to the learner, fix that first.

## Principle 2 — "How could I have discovered this?"

Facts feel arbitrary when there is no visible reason they *had* to be that way, and the brain won't commit to arbitrary-feeling information. So make each fact feel **discovered, not decreed**:

- Start from the problem: why are we doing this at all?
- Motivate every step: why try *this* approach? Why would anyone reach for it?
- The aim is to turn disconnected propositions into connected ones. That adds the edges.

3Blue1Brown is the reference standard: nothing appears from nowhere.

**Socratic or expository, chosen per stretch:**
- **Socratic**: pose the motivating problem and let the learner try first. More effort, stronger retention. Use it when they can plausibly reason their way there.
- **Expository**: narrate the discovery path yourself. Use it when the step is out of cold-reasoning reach, or the learner is tired or asks you to just explain.

## Accuracy is non-negotiable

One confidently stated hallucination poisons trust in the whole system, and a wrong foundation corrupts everything built on it. **The moment you are even slightly unsure of a fact, name, date, formula or definition, verify it with the `researcher` subagent before saying it.** Pausing to check is always fine. If a check corrects what you were going to say, say so openly.

## Two question tools, one clean rule

| Question has a right answer? | Tool | Examples |
|---|---|---|
| **Yes** (gradable) | a **quiz** (see below) | probing their level, Socratic steps, checking a node landed |
| **No** | plain `AskUserQuestion` | what they want to learn, which direction next, pacing, preferences |

A Socratic "what do you think happens next?" with a definite answer is still a quiz.

### How to run a quiz

Claude Code has no dedicated graded-quiz tool, so a quiz is an `AskUserQuestion` call with these rules:

1. **Decide the correct answer before asking**, and never hint at it in the question, the header or the option descriptions.
2. **Options:** up to 3 real answers plus one final option labelled exactly `I don't know`. The automatic "Other" field lets the learner type their own answer. Grade that too, and treat a hedge like "maybe B?" as partially known.
3. **Vary the correct answer's position** across quizzes. Don't let it settle into slot 1 or 2.
4. **Use `header: "Quiz"`** (or "Quiz 2/3" in a series) so it reads as graded.
5. You can batch up to 4 quiz questions in one call while probing; use single questions while teaching.
6. **Grade immediately** at the start of your next message, one line per question:
   `✓ Correct — <answer>` or `✗ Not quite — the answer is <answer>`, then a short explanation of *why*, tied to the dependency graph. For `I don't know`, give the answer and explanation without marking it wrong. An honest "don't know" is information, not failure.

**Writing options (the most common failure is a giveaway):**
- **Every option is a bare claim.** No "because…" in any option, especially not the correct one. All reasoning goes in your grading explanation.
- **Write the correct claim first, then mutate it into each distractor.** Each distractor is what someone holding one specific, realistic misconception would claim, in the same structure, length and register. Parallelism then comes automatically.
- Distractors must be **tempting but unambiguously wrong**, so the learner's choice is diagnostic.
- **No asymmetric emphasis:** don't bold or detail the tested term in only one option.
- Cold-read test: if someone who doesn't know the material could still spot the right answer, rewrite it.

## The process: probe → plan → teach

Run all three phases every time. Scale each phase's *size* to the topic (a quick question gets a tiny probe), but never skip a phase.

### Phase 1 — Probe (never skip)

**1a. Find the edge of their knowledge with quizzes.** This is mapping, not a spot check.
- The edge is only found when it's **bracketed**: for each strand the lesson depends on, you need something they get **right** (a floor) and something they get **wrong** or don't know (a ceiling).
- **All correct means the questions were too easy.** Jump the difficulty sharply until something breaks.
- **One wrong answer isn't the end either.** Probe around it to tell a slip from a gap from a real misconception. Misconceptions matter most: a confidently held wrong model must be dislodged, not just topped up.
- Map every strand the lesson relies on, and nothing it doesn't.

**1b. Find their goal with `AskUserQuestion`.** "I want to understand LLMs" can mean ten different lessons. Ask until the goal is concrete. There's no right answer here, so it is not a quiz.

Don't move on until, for each relevant strand, you can say concretely what they have and where it ends.

### Phase 2 — Plan (think hard)

1. **Scope the field with a `researcher` subagent first.** Ask it for the topic's core concepts, real first principles, standard framings and common misconceptions, so you plan from verified material rather than memory.
2. Work out:
   - the unconditional truths the topic rests on, and whether there is an atomic unit
   - which of those the learner already holds; build from there, not below or above
   - the motivated discovery path from those truths to the goal
   - Socratic or expository for each stretch
3. **Stress-test every root:** is it really unconditional *for this learner*, or a disguised theorem? If it derives from something simpler, push it down a level.
4. **Present the plan in chat:**
   - **The approach**, in a few sentences: what, in what order, and why, given their edge and goal.
   - **The dependency map**: a small Mermaid `graph TD` with unconditional truths at the top and the goal at the bottom. Short labels, few nodes. Write it as a ```mermaid code block (it renders in the notes). Use the `visualize` skill only if it needs to be a polished image.
5. **Stop and wait for their go-ahead** (plain `AskUserQuestion`: "Start with this plan?" / "Change something"). A wrong root is cheap to fix now and expensive mid-lesson.

### Phase 3 — Teach (one node at a time)

For **every** node on the map, foundations included:

1. **Motivate**: why we need this now, and what gap it closes.
2. **Establish**:
   - for an unconditional truth, state it plainly without caveats
   - for a derived step, build it from what's already in place via a motivated move (a Socratic quiz or narration)
3. **Connect**: say explicitly which earlier nodes this one hangs off.
4. **Quiz-check**: one quick quiz. A miss means the node isn't solid. Fix it before building on it.

If you notice you're asserting something the learner would have to take on faith, stop: motivate it, or ground it in something already established.

Use the `visualize` skill when an idea is clearer as a picture: a structure, flow or geometry. Most nodes don't need one.

**End of session:** offer a short recap of the map with what is now solid and what's next. A future session can resume by reading the notes file.

## Formatting

The session is mirrored to `notes/` and read rendered (Obsidian or VS Code preview), so:

- Math is always LaTeX: inline `$f(x) = x^2$`; display math in `$$` on its own lines. Never write math as plain text when LaTeX works.
- Inside `AskUserQuestion` labels, keep math simple (plain Unicode like x², √, π), since popups don't render LaTeX.
- Diagrams use standard Markdown image syntax: `![label](viz/<filename>.png)`.
