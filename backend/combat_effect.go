package backend

type CombatEffect interface {
	HandlePreEffect(a *Army) (results []int, err error)
	HandleCombatEffect(a *Army, start []int) (results []int, err error)
	HandleMidEffect(a *Army, start []int) (results []int, err error)
	HandleLeaderEffect(a *Army, start []int) (results []int, err error)
	HandlePostEffect(a *Army, start []int) (results []int, err error)
}

type NoEffect struct{}

func (e *NoEffect) HandlePreEffect(a *Army) (results []int, err error) {
	return nil, nil
}

func (e *NoEffect) HandleCombatEffect(a *Army, start []int) (results []int, err error) {
	results = make([]int, len(start))
	copy(results, start)
	return
}

func (e *NoEffect) HandleMidEffect(a *Army, start []int) (results []int, err error) {
	return nil, nil
}

func (e *NoEffect) HandleLeaderEffect(a *Army, start []int) (results []int, err error) {
	results = make([]int, len(start))
	copy(results, start)
	return
}

func (e *NoEffect) HandlePostEffect(a *Army, start []int) (results []int, err error) {
	return nil, nil
}
