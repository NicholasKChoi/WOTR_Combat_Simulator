package backend

import "math/rand"

const (
	MAX_STRENGTH   = 5
	SEIGE_STRENGTH = 3
)

type Army struct {
	Regulars int
	Elites   int
	Leaders  int
}

func (a *Army) Init(r, e, l int) {
	a.Regulars = r
	a.Elites = e
	a.Leaders = l
}

func (a *Army) GetStrength() int {
	units := a.GetUnits()
	if units > 5 {
		return 5
	} else {
		return units
	}
}

func (a *Army) GetUnits() int {
	return a.Regulars + a.Elites
}

func (a *Army) TakeHit(seige bool) {
	units := a.GetUnits()
	if units > MAX_STRENGTH {
		a.Regulars -= 1
	} else if seige {
		if units > SEIGE_STRENGTH {
			a.Regulars -= 1
		} else {
			a.downgradeOrHit()
		}
	} else {
		a.downgradeOrHit()
	}
}

func (a *Army) CombatRoll(effect CombatEffect) (combatResult []int, err error) {
	combatResult = make([]int, 0, 5)
	for i := 0; i < a.GetStrength(); i++ {
		res := rand.Intn(6) + 1
		combatResult = append(combatResult, res)
	}
	combatResult, err = effect.HandleCombatEffect(a, combatResult)
	return
}

func (a *Army) LeaderRoll(missedCombat []int, effect CombatEffect) (finalResult []int, err error) {
	finalResult = make([]int, len(missedCombat))
	for i := 0; i < len(missedCombat); i++ {
		res := rand.Intn(6) + 1
		finalResult[i] = res
	}
	finalResult, err = effect.HandleLeaderEffect(a, finalResult)
	return
}

func (a *Army) downgradeOrHit() {
	if a.Elites > 0 {
		a.Elites -= 1
		a.Regulars += 1
	} else {
		a.Regulars -= 1
	}
}
