---
name: grill-me
description: Interview the user relentlessly about a plan, design, or decision — one question at a time, resolving dependencies between decisions and recommending an answer for each — until a shared understanding is reached. Use when the user wants their thinking challenged, a plan pressure-tested, or design decisions worked through before implementation.
---

# Grill Me

Interview the user relentlessly about every aspect of this plan until we reach a
shared understanding. Walk down each branch of the design tree, resolving
dependencies between decisions one-by-one. For each question, provide your
recommended answer.

Ask the questions one at a time, waiting for feedback on each question before
continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase
instead.

## How to run this

1. **Map the design tree first.** Silently identify the major decision points in
   the plan and how they depend on one another. Start at the root — decisions
   that constrain everything downstream — and work toward the leaves.

2. **Resolve dependencies in order.** Do not ask about a leaf decision before the
   decision it depends on is settled. Each answer may prune or reshape the
   branches below it, so re-evaluate what to ask next after every response.

3. **One question at a time.** Ask a single, specific question. Wait for the
   answer before asking the next. Never batch questions.

4. **Always recommend an answer.** For every question, state your recommended
   answer and a one-line reason before handing it back. The user should be able
   to reply "yes" and move on, or push back with specifics.

5. **Explore before asking.** If the answer is discoverable in the codebase
   (an existing convention, a config value, how a similar feature is built),
   go read it instead of asking. Only ask when the answer genuinely requires
   the user's judgment, preference, or knowledge you cannot derive.

6. **Stop when understanding is shared.** When the remaining questions no longer
   change the plan, summarize the resolved decisions and confirm the plan is
   ready.
