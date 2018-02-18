package cache

import (
	"time"
	"varys/backend/storage/rdbms"
)

type CachedSearchResult struct {
	Entries   []rdbms.Entry
	Timestamp time.Time
}

var cache = make(map[string]CachedSearchResult)

func GetCachedEntries(key string) (CachedSearchResult, bool) {
	res, exists := cache[key]
	return res, exists
}

func SetCachedEntries(key string, entries []rdbms.Entry) {
	// cachedResult := CachedSearchResult{entries, time.Now()}
	// cache[key] = cachedResult
}

func DeleteCachedEntries(shouldDelete func([]rdbms.Entry, string, int) bool) {
	for key, value := range cache {
		entries := value.Entries
		for i := 0; i < len(entries); i++ {
			if shouldDelete(entries, key, i) {
				delete(cache, key)
				break
			}
		}
	}
}
