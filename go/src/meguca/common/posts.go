//go:generate easyjson --all --no_std_marshalers $GOFILE

// Package common contains common shared types, variables and constants used
// throughout the project
package common

// ParseBody forwards parser.ParseBody to avoid cyclic imports in db/upkeep
var ParseBody func([]byte, string) ([][2]uint64, []Command, error)

//easyjson:json
// Board is defined to enable marshalling optimizations and sorting by sticky
// threads
type Board struct {
	Pages   int      `json:"pages"`
	Threads []Thread `json:"threads"`
}

func (b Board) Len() int {
	return len(b.Threads)
}

func (b Board) Swap(i, j int) {
	b.Threads[i], b.Threads[j] = b.Threads[j], b.Threads[i]
}

func (b Board) Less(i, j int) bool {
	// So it gets sorted with sticky threads first
	return b.Threads[i].Sticky
}

// Thread is a transport/export wrapper that stores both the thread metadata,
// its opening post data and its contained posts. The composite type itself is
// not stored in the database.
type Thread struct {
	Abbrev    bool   `json:"abbrev,omitempty"`
	Sticky    bool   `json:"sticky,omitempty"`
	NonLive   bool   `json:"nonLive,omitempty"`
	Locked    bool   `json:"locked,omitempty"`
	PostCtr   uint32 `json:"postCtr"`
	ImageCtr  uint32 `json:"imageCtr"`
	ReplyTime int64  `json:"replyTime"`
	BumpTime  int64  `json:"bumpTime"`
	Subject   string `json:"subject"`
	Board     string `json:"board"`
	Post
	Posts []Post `json:"posts"`
}

// Post is a generic post exposed publically through the JSON API. Either OP or
// reply.
type Post struct {
	Editing  bool        `json:"editing,omitempty"`
	Banned   bool        `json:"banned,omitempty"`
	Deleted  bool        `json:"deleted,omitempty"`
	Sage     bool        `json:"sage,omitempty"`
	ID       uint64      `json:"id"`
	Time     int64       `json:"time"`
	Body     string      `json:"body"`
	Flag     string      `json:"flag,omitempty"`
	PosterID string      `json:"posterID,omitempty"`
	Name     string      `json:"name,omitempty"`
	Trip     string      `json:"trip,omitempty"`
	Auth     string      `json:"auth,omitempty"`
	Links    [][2]uint64 `json:"links,omitempty"`
	Commands []Command   `json:"commands,omitempty"`
	Image    *Image      `json:"image,omitempty"`
}

// StandalonePost is a post view that includes the "op" and "board" fields,
// which are not exposed though Post, but are required for retrieving a post
// with unknown parenthood.
type StandalonePost struct {
	Post
	OP    uint64 `json:"op"`
	Board string `json:"board"`
}
