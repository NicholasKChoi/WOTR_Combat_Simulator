package combat

/**
 * Combat Card functions are expected to alter the inputted values in place
 */
type CombatCard interface {
	HandlePreEffect(atk, def *Army) (err error)
	HandleCombatEffect(atk, def *Army, combat_roll []int) (err error)
	HandleLeaderEffect(atk, def *Army, leader_roll []int) (err error)
	HandlePostEffect(atk, def *Army) (err error)
	GetCardResult() (results CardResult)
}

type CardResult struct{}

type NoCard struct {
	NilPreEffect
	NilCombatRollEffect
	NilLeaderRollEffect
	NilPostRollEffect
}

func (c *NoCard) GetCardResult() CardResult {
	return CardResult{}
}
