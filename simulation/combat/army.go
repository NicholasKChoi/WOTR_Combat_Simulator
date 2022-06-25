package combat

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

func (a *Army) Copy() *Army {
	return &Army{
		Regulars: a.Regulars,
		Elites:   a.Elites,
		Leaders:  a.Leaders,
	}
}

func (a *Army) GetUnits() int {
	return a.Regulars + a.Elites
}

func (a *Army) TakeHit(beseiging bool) {
	units := a.GetUnits()
	if units == 0 {
		return
	} else if units > MAX_STRENGTH {
		a.Regulars -= 1
	} else if beseiging {
		if units > SEIGE_STRENGTH {
			a.Regulars -= 1
		} else {
			a.downgradeOrHit()
		}
	} else {
		a.downgradeOrHit()
	}
}

func (a *Army) TakeHits(hits int, beseiging bool) {
	for i := 0; i < hits; i++ {
		a.TakeHit(beseiging)
	}
}

func (a *Army) CombatRoll() (combatResult []int) {
	combatResult = make([]int, 0, 5)
	for i := 0; i < a.GetStrength(); i++ {
		res := rand.Intn(6) + 1
		combatResult = append(combatResult, res)
	}
	return
}

func (a *Army) LeaderRoll(missedCombat []int, effect CombatCard) (finalResult []int) {
	finalResult = make([]int, len(missedCombat))
	for i := 0; i < len(missedCombat); i++ {
		res := rand.Intn(6) + 1
		finalResult[i] = res
	}
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
