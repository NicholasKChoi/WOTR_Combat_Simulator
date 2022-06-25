package simulation

import (
	"github.com/NicholasKChoi/WOTR_Combat_Simulator/simulation/combat"
	"github.com/pkg/errors"
)

func SimpleRun() (r Result, e error) {
	fa := &combat.Army{1, 0, 0}
	sa := &combat.Army{1, 0, 0}
	s := &Simulation{}
	var err error
	if err = s.Init(sa, fa, combat.Field, FreeType); err != nil {
		e = errors.Wrap(err, "failed to create simulation")
	} else if r, err = s.Run(); err != nil {
		e = errors.Wrap(err, "failed to run simulation")
	}
	return
}
