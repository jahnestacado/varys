package utils

import "strconv"

func CreateSQLSetPlaceholders(num int, startFrom int) string {
	placeholders := "("
	num += startFrom
	for i := startFrom; i < num; i++ {
		placeholders += "$" + strconv.Itoa(i+1)
		if i < num-1 {
			placeholders += ","
		}
	}
	placeholders += ")"

	return placeholders
}

func CreateSQLValuesPlaceholders(numOfArgs int, valueTupleLength int, startFrom int) string {
	placeholders := ""
	numOfArgs += startFrom
	for i := startFrom; i < numOfArgs; i += valueTupleLength {
		placeholders += "("
		for n := 0; n < valueTupleLength; n++ {
			placeholders += "$" + strconv.Itoa(i+n+1)
			if n < valueTupleLength-1 {
				placeholders += ", "
			}
		}
		placeholders += ")"

		if i < numOfArgs-valueTupleLength {
			placeholders += ", "
		}
	}

	return placeholders
}
