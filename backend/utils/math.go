package utils

type math struct{}

var m = math{}

func Math() math {
	return m
}

func (m math) Min(a, b int) int {
	minValue := b
	if a < b {
		minValue = a
	}
	return minValue
}
