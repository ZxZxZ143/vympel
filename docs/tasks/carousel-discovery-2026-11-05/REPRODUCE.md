# Local evidence reproduction

Run from `E:/vympel_full`. Runtime inputs and large raw browser evidence are retained locally, not bundled into the focused source commit. `EVIDENCE_SHA256SUMS.json` seals the task evidence. `frozen-inputs.json` identifies the identical read-only fixture inputs; the original image bodies are referenced through its media/static indices. No live credentials or private TLS key belong in the evidence archive or commit.

The final application image and its eight changed-source hashes are bound by `build-124958.json`. The exact published baseline, local production build inputs, controlled browsers, transport/cache protocol and limitations are documented in `PROTOCOL.md`. Do not mistake the fixture's retained accepted-release label for a newly published release.

The existing task workspace is `.cache/carousel-discovery-20261105`. `repro/` contains an evidence snapshot of the final harness sources, not a second executable installation. Imports expect the original workspace depth and the installed frontend/browser dependencies. Do not regenerate or alter the frozen data when validating existing observations.

Validate the retained matrix without launching a browser:

```powershell
node vympel_front/scripts/check-carousel-discovery-evidence.mjs docs/tasks/carousel-discovery-2026-11-05/baseline-matrix-admitted docs/tasks/carousel-discovery-2026-11-05/candidate-matrix-admitted
python -X utf8 .cache/carousel-discovery-20261105/analyze.py
```

The first command requires all 48 matched tuples and tests injected network/geometry regressions. The analysis separately reports requests, complete and partial bytes, direct hits, wire 304s, pending resources, visibility attribution, actual LCP elements and next-navigation timings. Keep raw observations immutable; derived outputs can be regenerated and compared against their checksums.

For a new local browser experiment, use new output stage names, keep both sides sequential and retain the same fixture hashes. `run.py` accepts a side and a new stage, starts only a task-labelled network-isolated container, waits for the accepted references in local SSR and tears down that exact container. Matrix stages begin with `matrix`; regression stages begin with `regression`; contracts begin with `contracts`. Never reuse or delete existing evidence directories. The Edge browser uses process-scoped DNS/SPKI settings; no global DNS, certificate trust or staging change is needed. A new run is additional evidence and must not overwrite this admission.

Normal project commands remain in `vympel_front/package.json`: unit tests, lint, typecheck, image integrity, security and budgets. `gate-logs/` retains relevant successful output. The final production build uses the existing Dockerfile and lockfile. No new dependencies, budget increases or infrastructure adjustments are required.

`LOCAL-COMMIT.json` is written after the focused local commit and excluded from the evidence seal to avoid a recursive commit reference. The original unrelated edits and prior evidence are independently verified by `preservation.json`. Publication, deployment and live media backfill remain separate approval boundaries.
