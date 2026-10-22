# CB-SONAR-WAVE4-GOLDEN-CSS-20261022

Base `7d9027b8fe905c87dbfee477aab7fcf4d054c925`. Golden Home CSS cascade-only correction, screenshot-grounded. Reapplied byte-identical CSS from original PR #203 HEAD `e7c51a4dad87de5b745f9a8f9572949e060c0832` (historical base `3fbdfa967e5046f6bdbb4432a7d633fedbb65200`) on current main without force push; original PR remains intact.

- Replace the `!important` override on primary-action links by increasing selector specificity from `.cb-home .primary-action` to `.cb-home a.primary-action`; preserve declared color, fill and glow.
- Consolidate duplicate responsive `.cb-home .brand` within the same max-width 1050px media block; final effective min-width remains 125px and flex remains 1.
- Consolidate duplicate `.cb-home .news-panel` property into its original base rule, preserving `scroll-margin-top:16px`.
- **Accessibility exception to investigate separately:** preserve three `!important` declarations under `prefers-reduced-motion: reduce` until an equivalent cascade strategy is validated in real reduced-motion Chromium. Removing those solely for a scanner score would risk forcing unwanted motion for visitors.
- No changes to rendering assets, class names, responsive breakpoints, HTML, JS, permissions or publishing; behavior to be checked through Golden Home visuals/accessibility and M01–M05 regressions.

Required: exact HEAD Build, SonarCloud zero new issues, Socket, browser and visual regression. Not a claim that all 226 existing issues are closed. No squash merge without separate exact Owner authorization; no deploy, expenses, config, scanner rules or checkpoint changes.
