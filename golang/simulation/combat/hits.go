package combat

func GetHits(roll []int) (hits, misses []int) {
	hits, misses = make([]int, 0, 5), make([]int, 0, 5)
	for _, value := range roll {
		if value > 5 {
			hits = append(hits, value)
		} else {
			misses = append(misses, value)
		}
	}
	return
}
