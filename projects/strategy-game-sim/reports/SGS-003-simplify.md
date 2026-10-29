# SGS-003 simplify
Reviewed diff vs origin/main. Source diff is already tight; comment bar met (no narrating comments).
Change: acceptance/helpers.ts:3 export FIELDS directly; removed FIELD_KEYS alias; fight-api-validation.spec.ts:2,120 use FIELDS.
Left alone (scope): duplicated caps in army.js/fight.ts, validator location, docs/.
Results: tsc clean, npm test 4/4, acceptance 91/91.
