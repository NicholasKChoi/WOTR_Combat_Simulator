package simulation

import (
	"github.com/NicholasKChoi/WOTR_Combat_Simulator/simulation/combat"
)

type ArmyType int

const (
	FreeType ArmyType = iota
	ShadowType
)

type Result struct {
	FreeArmy   *combat.Army
	ShadowArmy *combat.Army
	Winners    ArmyType
}

type Simulation struct {
	FreeArmy     *combat.Army
	ShadowArmy   *combat.Army
	Rounds       int
	Battleground combat.Battleground
	Defenders    ArmyType
}

func (s *Simulation) Init(sa, fa *combat.Army, g combat.Battleground, d ArmyType) error {
	s.ShadowArmy = sa
	s.FreeArmy = fa
	s.Battleground = g
	s.Defenders = d
	return nil
}

func (s *Simulation) Run() (Result, error) {
	result := Result{}
	return result, nil
}
