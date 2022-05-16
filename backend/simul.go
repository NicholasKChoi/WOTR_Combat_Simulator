package backend

const (
	FreeType ArmyType = iota
	ShadowType

	Stronghold Battleground = iota
	City
)

type ArmyType int
type Battleground int

type Result struct {
	FreeArmy   *Army
	ShadowArmy *Army
	Winners    ArmyType
}

type Simulation struct {
	FreeArmy     *Army
	ShadowArmy   *Army
	Rounds       int
	Battleground Battleground
	Defenders    ArmyType
}

func (s *Simulation) Init(sa, fa *Army, g Battleground, d ArmyType) {
	s.ShadowArmy = sa
	s.FreeArmy = fa
	s.Battleground = g
	s.Defenders = d
}

func (s *Simulation) Run() Result {
	return Result{}
}
