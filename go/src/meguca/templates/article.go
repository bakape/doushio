package templates

import (
	"html"
	"meguca/common"
	"meguca/lang"
	"strconv"
	"time"
)

// Extra data passed, when rendering an article
type articleContext struct {
	index, sticky, locked bool
	omit, imageOmit       int
	op                    uint64
	board, subject, root  string
	backlinks             backlinks
}

// Map of all backlinks on a page
type backlinks map[uint64]map[uint64]uint64

// Returns image name with proper extension
func imageName(fileType uint8, name string) string {
	ext := common.Extensions[fileType]
	l := len(name)
	buf := make([]byte, l, l+1+len(ext))
	copy(buf, name)
	buf = append(buf, '.')
	return html.EscapeString(string(append(buf, ext...)))
}

// Renders the post creation time field
func formatTime(sec int64) string {
	ln := lang.Get().Common.Time

	t := time.Unix(sec, 0)
	year, m, day := t.Date()
	weekday := ln["week"][int(t.Weekday())]
	// Months are 1-indexed for some fucking reason
	month := ln["calendar"][int(m)-1]

	// Premature optimization
	buf := make([]byte, 0, 17+len(weekday)+len(month))
	buf = pad(buf, day)
	buf = append(buf, ' ')
	buf = append(buf, month...)
	buf = append(buf, ' ')
	buf = append(buf, strconv.Itoa(year)...)
	buf = append(buf, " ("...)
	buf = append(buf, weekday...)
	buf = append(buf, ") "...)
	buf = pad(buf, t.Hour())
	buf = append(buf, ':')
	buf = pad(buf, t.Minute())

	return string(buf)
}

// Stringify an int and left-pad to at least double digits
func pad(buf []byte, i int) []byte {
	if i < 10 {
		buf = append(buf, '0')
	}
	return append(buf, strconv.Itoa(i)...)
}

// Formats a human-readable representation of file size
func readableFileSize(s int) string {
	format := func(n, end string) string {
		l := len(n)
		buf := make([]byte, l, l+len(end))
		copy(buf, n)
		return string(append(buf, end...))
	}

	switch {
	case s < (1 << 10):
		return format(strconv.Itoa(s), " B")
	case s < (1 << 20):
		return format(strconv.Itoa(s/(1<<10)), " KB")
	default:
		n := strconv.FormatFloat(float64(s)/(1<<20), 'f', 1, 32)
		return format(n, " MB")
	}
}

// Extract reverse links to linked posts on a page
func extractBacklinks(cap int, threads ...common.Thread) backlinks {
	bls := make(backlinks, cap)
	register := func(p common.Post, op uint64) {
		for _, l := range p.Links {
			m, ok := bls[l[0]]
			if !ok {
				m = make(map[uint64]uint64, 4)
				bls[l[0]] = m
			}
			m[p.ID] = op
		}
	}

	for _, t := range threads {
		register(t.Post, t.ID)
		for _, p := range t.Posts {
			register(p, t.ID)
		}
	}

	return bls
}
