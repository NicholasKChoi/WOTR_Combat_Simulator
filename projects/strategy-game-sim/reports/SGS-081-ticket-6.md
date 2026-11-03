# SGS-081 ticket author report 6 (re-spec 6)
Owner answers folded in; Open questions deleted. Floors 70%, cap 2000, extra production buildings allowed, 1TC guide steps 0-23 frozen plus post-guide steps.
| Build | villager | military | foodPerMinute |
|---|---|---|---|
| Spear/Longbow | 61 | spear 8, longbow 8, MAA 21, xbow 13 | 780 |
| Knight/Longbow | 61 | longbow 36, knight 23 | 1180 |
| 1TC | 50 | spear 39, longbow 39 | 490 |
MAX_FLOATING_AT_1200 = 2000. At 2fc9593: spear/longbow fails (spear 3, xbow 9, food 354), 1TC fails (spear 36, food 283), knight/longbow passes.
Method: ticket-5 maxima (80% figures / 0.8) x 0.7 rounded down; food = full-rate demand x 0.875 rounded up to 10.
