---
name: visualize
description: Add one correct, minimal picture to a lesson — a dependency graph, flow, sequence, state machine, tree, or a spatial/geometric figure (number line, vectors, coordinate geometry, a plot). Delegates drawing to the mermaid-maker or svg-maker subagent, which renders the image and checks it visually before returning a filename to embed. Use only when the idea is genuinely clearer as a picture.
---

# Visualize

A picture earns its place only when it shows something words can't: shape, structure, direction, relationship, geometry. This skill produces **one** such picture, makes sure it's **correct** (the maker renders it and looks at it before returning), and embeds it so it renders in the session notes.

You are the **creative director**: you decide the exact idea and cut it down to its fewest essential elements. A **maker subagent** writes the source, renders it, inspects it, publishes it, and returns a filename.

## When to visualize (and when not to)

Reach for a picture when the idea is:
- **structural or relational**: dependencies, parts with arrows, a pipeline, a sequence of messages, states, a hierarchy, containment, a comparison
- **spatial or geometric**: coordinates, a number line, vectors, a function's shape, a physical layout

Don't, when a sentence or one equation already carries it. A decorative diagram adds noise and another chance to be wrong. When in doubt, skip it: a missing picture costs less than a false one.

## Choose the maker

- **`mermaid-maker`** (the default): nodes and edges, meaning dependency graphs, flowcharts, sequence, state, ER and class diagrams, trees, mindmaps, timelines.
- **`svg-maker`**: positions and shapes Mermaid can't lay out, meaning geometry, number lines, vectors, plots, exact coordinates.

## Brief the maker: one idea, fewest elements

The most common failure is **cramming**. For each element ask: "if I delete this, is the idea still clear?" If yes, delete it. Aim for 7 elements or fewer.

Give the concept *and* the concrete elements:
- BAD: "make a diagram about how TCP works"
- GOOD: "graph TD: 'packets' at the top, arrows down to 'ordering' and 'retransmit on loss', both arrows into 'reliable stream'. No title. Shows reliability is built FROM packets."

## Invoke

Use the Agent tool with `subagent_type: "mermaid-maker"` (or `"svg-maker"`) and the brief as the prompt. The subagent has no access to the conversation, so the brief must be self-contained.

It returns:

```
RESULT:
filename: viz-<slug>-<timestamp>.png
embed: ![<slug>](viz/viz-<slug>-<timestamp>.png)
```

If it returns `RESULT: NONE`, simplify the brief, switch makers, or drop the picture. **Never hand-draw or fake a diagram yourself.** Correctness depends on the maker's render-and-look loop.

## Embed it

Put the `embed` line from the result into your reply exactly as given. The notes file sits in `notes/` and the images in `notes/viz/`, so the relative path renders in both Obsidian and VS Code preview. Introduce the picture in one sentence, then let it do the work; don't narrate every element.
