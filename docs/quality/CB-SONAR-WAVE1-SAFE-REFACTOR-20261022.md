# CB-SONAR-WAVE1-SAFE-REFACTOR-20261022

Base: `3fbdfa967e5046f6bdbb4432a7d633fedbb65200`. Candidate corrective PR, **not merged**. Work exclusively on screenshot-grounded existing issues.

This wave corrects the M05 filename regexp with separate anchored trims (linear); String.replaceAll for literal entity escaping; M01 same-origin relative import and data-locale property; repetitive DOM dataset access in Home and explorer forms; removes nested explorer validation and Home filter summary ternaries without changing effective values; uses String.codePointAt for ASCII control detection; moves synthetic D1 fixture assertions inside a Node test; uses top-level await in local-only Studio CLI; updates one visual test to dataset.

Behavioral constraints: preserve strict M05 v2 and legacy draft serialization roundtrips, no network/data upload, wallet lookup format validation and URL destinations, locale/filters, D1 synthetic isolation, Golden Home snapshots and existing accessibility. No production credentials or providers.

Evidence required: exact HEAD Build, lint/typecheck, Node, Chromium responsive M01–M05, M07 tests, SonarCloud zero new PR issues, Socket and Gitleaks. Legacy main backlog remains separate and not declared cleared until measured post-merge.

**STOP:** no merge without exact Owner approval; no deploy, spending, code-quality configuration, ruleset, checkpoint or other unrelated changes. CSS cascade, Python Blender and M05 canonical editorial complexity refactors are reserved for focused later waves.
