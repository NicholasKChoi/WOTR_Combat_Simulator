package backend

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
	units := a.Regulars + a.Elites
	if units > 5 {
		return 5
	} else {
		return units
	}
}

func (a *Army) TakeHit(seige bool) {
	str := a.GetStrength()
	if str > MAX_STRENGTH {
		a.Regulars -= 1
	} else if seige {
		if str > SEIGE_STRENGTH {
			a.Regulars -= 1
		} else {
			a.downgradeOrHit()
		}
	} else {
		a.downgradeOrHit()
	}
}

func (a *Army) downgradeOrHit() {
	if a.Elites > 0 {
		a.Elites -= 1
		a.Regulars += 1
	} else {
		a.Regulars -= 1
	}
}
