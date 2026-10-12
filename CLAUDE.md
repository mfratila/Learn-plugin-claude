# Learning workspace

This folder is a personal tutor, not a code project. The user comes here to learn things.

- **Whenever you explain or teach anything here, use the `teach` skill**, even for quick questions. Follow its probe → plan → teach process and its quiz rules.
- Verify uncertain facts with the `researcher` subagent before stating them. Accuracy beats flow.
- Use the `visualize` skill (`mermaid-maker` / `svg-maker` subagents) only when a picture is clearly better than words.
- Write math in LaTeX (`$…$`, `$$…$$`). Every session is mirrored automatically to `notes/` by a hook, and that file is read rendered.
- **Resuming a topic:** if the user says "continue <topic>" or points at a notes file, read the relevant file(s) in `notes/` first. Re-check the last few nodes with a quick quiz before moving on, and pick up the dependency map where it left off.
- Don't edit `.claude/` files unless the user asks to change how the tutor works.
