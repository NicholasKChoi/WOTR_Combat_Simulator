package combat

import (
	"fmt"
	"testing"
)

func armyEquals(a, b *Army) bool {
	return a.Regulars == b.Regulars && a.Elites == b.Elites && a.Leaders == b.Leaders
}

func TestArmyTakeHitNoSeige(t *testing.T) {
	var tests = []struct {
		tag   string
		start *Army
		want  *Army
	}{
		{"Normal Hit", &Army{5, 0, 0}, &Army{4, 0, 0}},
		{"Downgrade6", &Army{5, 1, 0}, &Army{4, 1, 0}},
		{"Downgrade5", &Army{4, 1, 0}, &Army{5, 0, 0}},
		{"Downgrade4", &Army{3, 1, 0}, &Army{4, 0, 0}},
	}

	for _, test := range tests {
		testname := fmt.Sprintf("%+v:%s", test.start, test.tag)
		t.Run(testname, func(t *testing.T) {
			test.start.TakeHit(false)
			if !armyEquals(test.start, test.want) {
				t.Errorf("got %+v, want %+v", test.start, test.want)
			}
		})
	}
}

func TestArmyTakeHitSeige(t *testing.T) {
	var tests = []struct {
		tag   string
		start *Army
		want  *Army
	}{
		{"Regular 5r", &Army{5, 0, 0}, &Army{4, 0, 0}},
		{"Regular 5r 1e", &Army{5, 1, 0}, &Army{4, 1, 0}},
		{"Regular 4r 1e", &Army{4, 1, 0}, &Army{3, 1, 0}},
		{"Regular 3r 1e", &Army{3, 1, 0}, &Army{2, 1, 0}},
		{"Downgrade 2r 1e", &Army{2, 1, 0}, &Army{3, 0, 0}},
	}

	for _, test := range tests {
		testname := fmt.Sprintf("%+v:%s", test.start, test.tag)
		t.Run(testname, func(t *testing.T) {
			test.start.TakeHit(true)
			if !armyEquals(test.start, test.want) {
				t.Errorf("got %+v, want %+v", test.start, test.want)
			}
		})
	}
}
