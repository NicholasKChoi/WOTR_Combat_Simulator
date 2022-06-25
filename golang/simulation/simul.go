package simulation

import (
	"fmt"

	"github.com/NicholasKChoi/WOTR_Combat_Simulator/simulation/combat"
)

type ArmyType int

const (
	FreeType ArmyType = iota
	ShadowType
)

type Result struct {
	AttackingArmy *combat.Army
	DefendingArmy *combat.Army
	Rounds        int
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

func (s *Simulation) Battle(attack, defend *combat.Army) Result {
	var (
		rounds = 0
	)
	fmt.Printf("Attacking %+v vs Defending %+v\n", attack, defend)
	for attack.GetUnits() > 0 && defend.GetUnits() > 0 {
		rounds++

		// attack side
		atkCombatRoll := attack.CombatRoll()
		atkCombatHits, atkCombatMisses := combat.GetHits(atkCombatRoll)
		atkLeaderRoll := attack.LeaderRoll(atkCombatMisses, &combat.NoCard{})
		atkLeaderHits, atkFinalMisses := combat.GetHits(atkLeaderRoll)
		fmt.Printf("Round %d: Attack %d combat hits, %d leader hits, and %d misses\n",
			rounds,
			len(atkCombatHits),
			len(atkLeaderHits),
			len(atkFinalMisses))

		// defending side
		defCombatRoll := attack.CombatRoll()
		defCombatHits, defCombatMisses := combat.GetHits(defCombatRoll)
		defLeaderRoll := attack.LeaderRoll(defCombatMisses, &combat.NoCard{})
		defLeaderHits, defFinalMisses := combat.GetHits(defLeaderRoll)
		fmt.Printf("Round %d: Attack %d combat hits, %d leader hits, and %d misses\n",
			rounds,
			len(defCombatHits),
			len(defLeaderHits),
			len(defFinalMisses))

		// take hits
		attack.TakeHits(len(defCombatHits)+len(defLeaderHits), false)
		defend.TakeHits(len(atkCombatHits)+len(atkLeaderHits), false)
	}
	return Result{
		attack.Copy(),
		defend.Copy(),
		rounds,
	}
}

func (s *Simulation) Run() (Result, error) {
	var (
		attackers *combat.Army
		defenders *combat.Army
	)
	if s.Defenders == FreeType {
		attackers = s.ShadowArmy.Copy()
		defenders = s.FreeArmy.Copy()
	} else {
		attackers = s.FreeArmy.Copy()
		defenders = s.ShadowArmy.Copy()
	}
	result := s.Battle(attackers, defenders)
	return result, nil
}
