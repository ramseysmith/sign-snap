# SignSnap project charter

Expo managed React Native app in the Graysmith Labs portfolio. Commits are authored
as Ramsey Graysmith <smith.s.ramsey@gmail.com>. No hyphens, en dashes or em dashes
in user facing prose, store copy, release notes or commit messages.

## Graysmith Labs HQ

Portfolio rules, the living plan and the nightly numbers live in
ramseysmith/graysmith_labs_agent (PLAN.md, CLAUDE.md, data/latest.json).
* The guard hook in .claude/hooks blocks commits not authored as Ramsey Graysmith,
  attribution trailers, claude/ branches and Google test ad IDs outside __DEV__,
  and checks store.config.json limits and dashes on every edit.
* Listing copy lives in store.config.json. If it is missing, run the Store listing
  pull workflow once. Merging a listing change to the default branch publishes it
  through store-push.yml.
* Subagents in .claude/agents: aso-copywriter, release-auditor, ux-reviewer,
  screenshot-producer, monetization-engineer, growth-analyst. Run release-auditor
  before any build meant for review.
* Agents merge their own reviewed work. Prices, trials, products, spend and
  account settings are Ramsey's; write him exact steps instead.
