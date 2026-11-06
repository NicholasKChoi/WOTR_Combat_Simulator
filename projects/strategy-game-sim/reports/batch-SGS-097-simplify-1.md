# SGS-097 simplify pass 1

Result: unchanged (tip 4458555c7e0b12069b11e4fd3e32212380012736).

Reviewed the diff against origin/main (6 files). The production change is two `shortText` call sites that reuse the existing helper, so there was no new helper or duplicated logic. The only comment in the diff (the next dev warm-up note in the acceptance spec) records a real constraint and meets the comment bar. The unit and acceptance label tests overlap in cases, but they check different layers (schema versus route), so I kept both. I made no edits and did not run tsc or npm test, because nothing changed.
