package db

import (
	"database/sql"
	"meguca/auth"
	"meguca/common"
	"sync"
	"time"

	"github.com/Masterminds/squirrel"
	"github.com/go-playground/log"
)

var (
	// board: IP: IsBanned
	banCache = map[string]map[string]bool{}
	bansMu   sync.RWMutex
)

func writeBan(
	tx *sql.Tx,
	ip, board, reason, by string,
	postID uint64,
	expires time.Time,
	log bool,
) (
	err error,
) {
	err = withTransaction(tx,
		sq.Insert("bans").
			Columns("ip", "board", "forPost", "reason", "by", "expires").
			Values(ip, board, postID, reason, by, expires.UTC()).
			Suffix("on conflict do nothing"),
	).
		Exec()
	if err != nil || !log {
		return
	}
	return logModeration(tx, common.ModLogEntry{
		Type:   common.BanPost,
		Board:  board,
		ID:     postID,
		By:     by,
		Length: uint64(expires.Sub(time.Now()).Seconds()),
		Reason: reason,
	})
}

// Propagate ban updates through DB and disconnect all banned IPs
func propagateBans(board string, ips ...string) error {
	if len(ips) != 0 {
		if _, err := db.Exec(`notify bans_updated`); err != nil {
			return err
		}
	}
	if !IsTest {
		for _, ip := range ips {
			auth.DisconnectByBoardAndIP(ip, board)
		}
	}
	return nil
}

// SystemBan automatically bans an IP
func SystemBan(ip, reason string, expires time.Time) (err error) {
	err = InTransaction(false, func(tx *sql.Tx) error {
		return writeBan(tx, ip, "all", reason, "system", 0, expires, true)
	})
	if err != nil {
		return
	}
	err = propagateBans("all", ip)
	return
}

// Ban IPs from accessing a specific board. Need to target posts. Returns all
// banned IPs.
func Ban(board, reason, by string, expires time.Time, log bool, ids ...uint64) (
	err error,
) {
	type post struct {
		id, op uint64
		ip     string
	}

	// Retrieve matching posts
	var (
		ips   = make(map[string]bool, len(ids))
		posts = make([]post, 0, len(ids))
		ip    string
	)
	for _, id := range ids {
		ip, err = GetIP(id)
		switch err {
		case nil:
		case sql.ErrNoRows:
			err = nil
			continue
		default:
			return
		}
		ips[ip] = true
		posts = append(posts, post{
			id: id,
			ip: ip,
		})
	}

	// Retrieve their OPs
	for i := range posts {
		posts[i].op, err = GetPostOP(posts[i].id)
		if err != nil {
			return
		}
	}

	// Write ban messages to posts and ban table
	err = InTransaction(false, func(tx *sql.Tx) (err error) {
		for _, post := range posts {
			err = withTransaction(tx,
				sq.Update("posts").
					Set("banned", true).
					Where("id = ?", post.id),
			).
				Exec()
			if err != nil {
				return
			}
			err = bumpThread(tx, post.op, false)
			if err != nil {
				return
			}
			err = writeBan(tx, post.ip, board, reason, by, post.id, expires,
				log)
			if err != nil {
				return
			}
		}
		return
	})
	if err != nil {
		return
	}

	if !IsTest {
		for _, post := range posts {
			err = common.BanPostP(post.id, post.op)
			if err != nil {
				return
			}
		}
	}

	ipArr := make([]string, 0, len(ips))
	for ip := range ips {
		ipArr = append(ipArr, ip)
	}
	return propagateBans(board, ipArr...)
}

// Unban lifts a ban from a specific post on a specific board
func Unban(board string, id uint64, by string) error {
	return InTransaction(false, func(tx *sql.Tx) (err error) {
		err = withTransaction(tx,
			sq.Delete("bans").
				Where("board = ? and forPost = ?", board, id),
		).
			Exec()
		if err != nil {
			return
		}
		err = logModeration(tx, common.ModLogEntry{
			Type:  common.UnbanPost,
			Board: board,
			ID:    id,
			By:    by,
		})
		if err != nil {
			return
		}
		_, err = tx.Exec("notify bans_updated")
		return
	})
}

func loadBans() error {
	if err := RefreshBanCache(); err != nil {
		return err
	}
	return Listen("bans_updated", func(_ string) error {
		return RefreshBanCache()
	})
}

func selectBans(colums ...string) squirrel.SelectBuilder {
	return sq.Select(colums...).
		From("bans").
		Where("expires > now() at time zone 'utc'")
}

// RefreshBanCache loads up to date bans from the database and caches them in
// memory
func RefreshBanCache() (err error) {
	bans := make([]auth.Ban, 0, 16)
	err = queryAll(selectBans("ip", "board"), func(r *sql.Rows) error {
		var b auth.Ban
		err := r.Scan(&b.IP, &b.Board)
		if err != nil {
			return err
		}
		bans = append(bans, b)
		return nil
	})
	if err != nil {
		return
	}

	new := map[string]map[string]bool{}
	for _, b := range bans {
		board, ok := new[b.Board]
		if !ok {
			board = map[string]bool{}
			new[b.Board] = board
		}
		board[b.IP] = true
	}

	bansMu.Lock()
	banCache = new
	bansMu.Unlock()

	return
}

// IsBanned checks,  if the IP is banned on the target board or globally
func IsBanned(board, ip string) error {
	bansMu.RLock()
	defer bansMu.RUnlock()
	global := banCache["all"]
	ips := banCache[board]

	if (global != nil && global[ip]) || (ips != nil && ips[ip]) {
		// Need to assert ban has not expired and cache is invalid

		r, err := selectBans("board").Where("ip = ?", ip).Query()
		if err != nil {
			return err
		}
		defer r.Close()

		var (
			resBoard string
			matched  = false
		)
		for r.Next() {
			err = r.Scan(&resBoard)
			if err != nil {
				return err
			}
			if resBoard == "all" || resBoard == board {
				matched = true
				break
			}
		}
		err = r.Err()
		if err != nil {
			return err
		}

		if matched {
			// Also refresh the cache to keep stale positives from
			// triggering a check again
			if !IsTest {
				go func() {
					err := RefreshBanCache()
					if err != nil {
						log.Error(err)
					}
				}()
			}

			return common.ErrBanned
		}
		return nil
	}

	return nil
}

// GetBannedLevels is like IsBanned, but returns, if the IP is banned globally
// or only from the specific board.
func GetBannedLevels(board, ip string) (globally, locally bool) {
	bansMu.RLock()
	defer bansMu.RUnlock()
	global := banCache["all"]
	ips := banCache[board]
	return global != nil && global[ip], ips != nil && ips[ip]
}
