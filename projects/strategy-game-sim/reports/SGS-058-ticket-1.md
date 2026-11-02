# SGS-058 ticket author report

File: tickets/SGS-058-aoe4-data-schema.md
Title: Check the shipped rules and snapshot data files with zod schemas in data.test.ts. Component aoe4-build-order, M4 / M4.1, risk low, depends on SGS-057, about 90 business-logic lines.
Scope: new data-schema.ts (snapshotFileSchema, baseRulesFileSchema, civRulesFileSchema, z.ZodType-annotated against data.ts types, test-time only); data.test.ts gains a schema describe with 8 defect cases and drops the per-field source/hex/http/hand-value-label assertions they replace.
Diagrams: none required.
Open questions: none.
Criteria checks run on origin/main d5c2549: the replaced-assertion grep finds 4 lines today; the no-runtime-importer grep finds nothing today. Not run: end-state checks (no data-schema.ts yet).
Overlap: none with open tickets. SGS-057 names used: zod ^4.6.7 and the z.ZodType<T> annotation convention only; it does not define data-schema names.
Note: SGS-057's Out of scope names data-schema.ts and the data.test.ts rewrite, consistent.
