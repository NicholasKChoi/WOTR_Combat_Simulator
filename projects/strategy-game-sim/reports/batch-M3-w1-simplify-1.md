# batch-M3-w1 simplify 1

- sgs-035-aoe4-engine-common-dup-check: new tip b52e9f5 (was 3d12658). One trim: `Resources` type is now exported from engine-common.ts and imported by simulate.ts, removing the duplicate declaration. tsc clean, 704 tests pass, lint:dup 0 clones. The rest of the diff already followed the comment bar and had no further reuse or dead code.
- sgs-036-aoe4-request-hardening: unchanged (b83701a). Diff is small and tight with no duplication or narration comments. tsc clean, 700 tests pass.
