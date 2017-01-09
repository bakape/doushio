import { Model } from '../base'
import { extend, write } from '../util'
import Collection from './collection'
import PostView from './view'
import { SpliceResponse } from '../client'
import { mine, seenReplies } from "../state"
import { notifyAboutReply } from "../ui"
import { PostData, TextState, PostLinks, Command, ImageData } from "../common"

// Generic post model
export class Post extends Model implements PostData {
	collection: Collection
	view: PostView

	// PostData properties
	public editing: boolean
	public deleted: boolean
	public banned: boolean
	public image: ImageData
	public time: number
	public body: string
	public name: string
	public trip: string
	public auth: string
	public state: TextState
	public backlinks: PostLinks
	public commands: Command[]
	public links: PostLinks

	constructor(attrs: PostData) {
		super()
		extend(this, attrs)

		// All kinds of race conditions can happen, so best always define the
		// struct
		this.state = {
			spoiler: false,
			quote: false,
			iDice: 0,
		}
	}

	// Remove the model from its collection, detach all references and allow to
	// be garbage collected.
	public remove() {
		if (this.collection) {
			this.collection.remove(this)
		}
		if (this.view) {
			this.view.remove()
		}
	}

	// Append a character to the text body
	public append(code: number) {
		const char = String.fromCodePoint(code),
			{state, view} = this
		this.body += char
		state.line += char

		if (char === "\n") {                    // Start new line
			view.startNewLine()
			this.resetState()
			this.state.line = ""
		} else if (state.line === ">") {        // Start quote
			view.reparseLine()
		} else if (state.line.endsWith("**")) { // Start or close spoiler
			this.resetState()
			view.reparseLine()
		} else {
			view.appendString(char)
		}
	}

	// Reset spoiler and quote state of the line
	protected resetState() {
		this.state.spoiler = this.state.quote = false
	}

	// Backspace one character in the current line
	public backspace() {
		const {state, view} = this,
			needReparse = state.line === ">" || state.line.endsWith("**")
		state.line = state.line.slice(0, -1)
		this.body = this.body.slice(0, -1)
		if (needReparse) {
			this.resetState()
			view.reparseLine()
		} else {
			view.backspace()
		}
	}

	// Splice the current open line of text
	public splice(msg: SpliceResponse) {
		const {state} = this
		state.line = this.spliceLine(state.line, msg)
		this.resetState()
		this.view.reparseLine()
	}

	// Extra method for code reuse in post forms
	protected spliceLine(
		line: string,
		{start, len, text}: SpliceResponse,
	): string {
		// Must use arrays of chars to properly splice multibyte unicode
		const keep = Array.from(line).slice(0, start),
			t = Array.from(text)
		let end: string[]
		if (len === -1) { // Special meaning - replace till line end
			end = t
		} else {
			end = t.concat(Array.from(line).slice(start + 1 + len))
		}
		line = keep.concat(end).join("")

		// Replace last line in text body
		const iLast = this.body.lastIndexOf("\n")
		this.body = this.body.substring(0, iLast + 1) + line

		return line
	}

	// Extend a field on the model, if it exists. Assign if it doesn't
	public extendField(key: string, obj: {}) {
		if (this[key]) {
			extend(this[key], obj)
		} else {
			this[key] = obj
		}
	}

	// Extend all fields in the model and rerender
	public extend(data: PostData) {
		extend(this, data)
		// "editing":false is omitted to reduce payload. Override explicitly.
		if (!data.editing) {
			this.editing = false
		}
		write(() =>
			this.view.renderContents())
	}

	// Insert data about a link to another post into the model
	public insertLink(links: PostLinks) {
		this.checkRepliedToMe(links)
		this.extendField("links", links)
	}

	// Check if this post replied to one of the user's posts and trigger
	// handlers
	public checkRepliedToMe(links: PostLinks) {
		for (let key in links) {
			if (!mine.has(parseInt(key))) {
				continue
			}
			// In case there are multiple links to the same post
			if (!seenReplies.has(this.id)) {
				notifyAboutReply(this)
			}
		}
	}

	// Insert data about another post linking this post into the model
	public insertBacklink(links: PostLinks) {
		this.extendField("backlinks", links)
		this.view.renderBacklinks()
	}

	// Insert a new command result into the model
	public insertCommand(comm: Command) {
		if (!this.commands) {
			this.commands = [comm]
		} else {
			this.commands.push(comm)
		}
	}

	// Insert an image into an existing post
	public insertImage(img: ImageData) {
		this.image = img
		this.view.renderImage(false, true)
		this.view.autoExpandImage()
	}

	// Spoiler an already allocated imageThreadData
	public spoilerImage() {
		this.image.spoiler = true
		this.view.renderImage(false, true)
	}

	// Close an open post and reparse its last line
	public closePost() {
		// Posts may be closed from multiple sources. It may be the user
		// closing the post manually, the scheduled cleanup task closing or
		// the check done when writing to open posts. Therefore some
		// duplication is possible. Ignore closing of already closed posts.
		if (!this.editing) {
			return
		}
		this.editing = false
		this.resetState()
		this.view.closePost()
	}

	// Set post as banned
	public setBanned() {
		if (this.banned) {
			return
		}
		this.banned = true
		this.view.renderBanned()
	}
}