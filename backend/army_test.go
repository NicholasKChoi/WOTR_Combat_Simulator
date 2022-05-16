package backend

import (
	"fmt"
	"testing"
)

func ArmyEquals(a, b *Army) bool {
	return a.Regulars == b.Regulars && a.Elites == b.Elites && a.Leaders == b.Leaders
}

func TestArmyTakeHitNoSeige(t *testing.T) {
	var tests = []struct {
		start *Army
		want  *Army
	}{
		{&Army{5, 0, 0}, &Army{4, 0, 0}},
		{&Army{5, 1, 0}, &Army{6, 0, 0}},
	}

	for _, test := range tests {
		testname := fmt.Sprintf("%+v.TakeHit():NoSeige", test.start)
		t.Run(testname, func(t *testing.T) {
			test.start.TakeHit(false)
			if !ArmyEquals(test.start, test.want) {
				t.Errorf("got %+v, want %+v", test.start, test.want)
			}
		})
	}
}
