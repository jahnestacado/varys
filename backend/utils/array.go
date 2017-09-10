package utils

import (
	"errors"
	"reflect"
)

func Contains(slice interface{}, element interface{}) (bool, error) {
	sliceReflection := reflect.ValueOf(slice)
	if sliceReflection.Kind() != reflect.Slice {
		return false, errors.New("Invalid 'slice' argument. Non-slice type given.")
	}

	numOfElement := sliceReflection.Len()
	castedSlice := make([]interface{}, numOfElement)
	for i := 0; i < numOfElement; i++ {
		castedSlice[i] = sliceReflection.Index(i).Interface()
	}

	for _, s := range castedSlice {
		if s == element {
			return true, nil
		}
	}

	return false, nil
}
