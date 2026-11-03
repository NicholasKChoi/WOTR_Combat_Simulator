# SGS-072 implementer 2 (rework 1)
Branch sgs-072-aoe4-pin-persistence-label, tip 63d1f7ce4dab4301d1a56a54f97c3fe4ebed204d (on 9e4c4e0). Status: needs_review.
Changed: acceptance/aoe4-build-order-pin-compare.spec.ts (holdFirstSimulate helper shared by the restore-race tests; new Unpin-before-restore test; Pin test retitled; label-stable-after-Run step; Build tab selected after restore; last pin-disabled step now Pin (disabled) then Unpin (enabled)); docs/aoe4-build-order.md (Pin sentence). No production change; post helper skipped (optional).
Mutations (each failed, reverted): drop both `|| pinTouched.current` guards -> Unpin test fails; pinnedName={pin ? (run?.name ?? pin.name) : null} -> label test fails; restore calls setTab('results') -> reload test fails (aria-selected).
Checks: tsc clean; lint:dup 0 clones; vitest 1307 passed/10 skipped; full acceptance 679 passed. Persistence block --repeat-each=10 with a second spec (aoe4-build-order.spec.ts x2) in parallel on one shared server: 160 passed + 106 passed. (An earlier attempt had no parallel file because the server failed to start; redone correctly.)
Port 4121 free, throwaway config deleted.
