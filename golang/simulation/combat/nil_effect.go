package combat

type NilPreEffect struct{}

func (e *NilPreEffect) HandlePreEffect(atk, def *Army) (err error) {
	return
}

type NilCombatRollEffect struct{}

func (e *NilCombatRollEffect) HandleCombatEffect(atk, def *Army, combat_roll []int) (err error) {
	return
}

// type NilBetweenRollsEffect struct{}

// func (e *NilBetweenRollsEffect) HandleMidEffect(atk, def *Army, start []int) (err error) {
// 	return
// }

type NilLeaderRollEffect struct{}

func (e *NilLeaderRollEffect) HandleLeaderEffect(atk, def *Army, leader_roll []int) (err error) {
	return
}

type NilPostRollEffect struct{}

func (e *NilPostRollEffect) HandlePostEffect(atk, def *Army) (err error) {
	return
}
