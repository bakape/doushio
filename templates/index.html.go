// This file is automatically generated by qtc from "index.html".
// See https://github.com/valyala/quicktemplate for details.

//line index.html:1
package templates

//line index.html:1
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line index.html:1
import "encoding/json"

//line index.html:2
import "strings"

//line index.html:3
import "github.com/bakape/meguca/config"

//line index.html:4
import "github.com/bakape/meguca/lang"

//line index.html:6
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line index.html:6
func streamrenderIndex(qw422016 *qt422016.Writer, ln lang.Pack) {
	//line index.html:7
	conf := config.Get()

	//line index.html:8
	confJSON, confHash := config.GetClient()

	//line index.html:9
	boards := config.GetBoards()

	//line index.html:9
	qw422016.N().S(`<!doctype html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0"><meta name="application-name" content="meguca"><meta name="description" content="Realtime imageboard"><link type="image/x-icon" rel="shortcut icon" id="favicon" href="/assets/favicons/default.ico"><title>`)
	//line index.html:20
	qw422016.N().S(`{{.Title}}</title><link rel="manifest" href="/assets/mobile/manifest.json">`)
	//line index.html:26
	qw422016.N().S(`<link rel="stylesheet" href="/assets/css/base.css"><link rel="stylesheet" id="theme-css" href="/assets/css/`)
	//line index.html:28
	qw422016.N().S(conf.DefaultCSS)
	//line index.html:28
	qw422016.N().S(`.css">`)
	//line index.html:31
	qw422016.N().S(`<noscript><link rel="stylesheet" href="/assets/css/noscript.css"></noscript>`)
	//line index.html:37
	qw422016.N().S(`<script>var config =`)
	//line index.html:39
	qw422016.N().Z(confJSON)
	//line index.html:39
	qw422016.N().S(`,configHash = '`)
	//line index.html:40
	qw422016.N().S(confHash)
	//line index.html:40
	qw422016.N().S(`',`)
	//line index.html:41
	boardJSON, _ := json.Marshal(boards)

	//line index.html:41
	qw422016.N().S(`boards =`)
	//line index.html:42
	qw422016.N().Z(boardJSON)
	//line index.html:42
	qw422016.N().S(`;if (localStorage.theme !== config.DefaultCSS) {document.getElementById('theme-css').href = '/assets/css/' + localStorage.theme + '.css'}</script>`)
	//line index.html:49
	qw422016.N().S(`<template name="article"><header class="spaced"><h3 hidden></h3><b class="name"></b><time></time><nav><a>No.</a><a class="quote"></a></nav><a class="control"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 0l-1.5 1.5 4 4 4-4-1.5-1.5-2.5 2.5-2.5-2.5z" transform="translate(0 1)" /></svg></a></header><div class="post-container"><blockquote></blockquote></div></template><template name="keyValue">`)
	//line index.html:72
	streamkeyValueForm(qw422016, "", "")
	//line index.html:72
	qw422016.N().S(`</template><template name="figcaption"><figcaption class="spaced"><a class="image-toggle act" hidden></a><span class="spaced image-search-container">`)
	//line index.html:78
	engines := [...][2]string{
		{"google", "G"},
		{"iqdb", "Iq"},
		{"saucenao", "Sn"},
		{"desustorage", "Ds"},
		{"exhentai", "Ex"},
	}

	//line index.html:85
	for _, e := range engines {
		//line index.html:85
		qw422016.N().S(`<a class="image-search`)
		//line index.html:86
		qw422016.N().S(` `)
		//line index.html:86
		qw422016.N().S(e[0])
		//line index.html:86
		qw422016.N().S(`" target="_blank" rel="nofollow">`)
		//line index.html:87
		qw422016.N().S(e[1])
		//line index.html:87
		qw422016.N().S(`</a>`)
		//line index.html:89
	}
	//line index.html:89
	qw422016.N().S(`</span><span></span><a></a></figcaption></template><template name="figure"><figure><a target="_blank"><img></a></figure></template><template name="post-controls"><div id="post-controls"><input name="cancel" type="button" value="`)
	//line index.html:104
	qw422016.N().S(ln.UI["cancel"])
	//line index.html:104
	qw422016.N().S(`"><input name="done" type="button" value="`)
	//line index.html:105
	qw422016.N().S(ln.UI["done"])
	//line index.html:105
	qw422016.N().S(`" hidden><span class="upload-container" hidden><input type="file" name="image" accept="image/png, image/gif, image/jpeg, video/webm, video/ogg, audio/ogg, application/ogg, video/mp4, audio/mp4, audio/mp3, application/zip, application/x-7z-compressed, application/x-xz, application/x-gzip"><span data-id="spoiler"><label><input type="checkbox" name="spoiler">`)
	//line index.html:111
	qw422016.N().S(ln.Common.Posts["spoiler"])
	//line index.html:111
	qw422016.N().S(`</label></span><strong class="upload-status"></strong></span></div></template></head><body>`)
	//line index.html:122
	qw422016.N().S(`<image src="/assets/loading.gif" id="loading-image"><div id="overlay-container">`)
	//line index.html:127
	qw422016.N().S(`<span id="banner" class="glass"><nav id="board-navigation"><noscript>[<a href="/all/" class="history reload">all</a>`)
	//line index.html:135
	for _, b := range boards {
		//line index.html:136
		qw422016.N().S(` `)
		//line index.html:136
		qw422016.N().S(`/`)
		//line index.html:136
		qw422016.N().S(` `)
		//line index.html:136
		qw422016.N().S(`<a href="/`)
		//line index.html:137
		qw422016.N().S(b)
		//line index.html:137
		qw422016.N().S(`/" class="history reload">`)
		//line index.html:138
		qw422016.N().S(b)
		//line index.html:138
		qw422016.N().S(`</a>`)
		//line index.html:140
	}
	//line index.html:140
	qw422016.N().S(`]</noscript></nav>`)
	//line index.html:146
	qw422016.N().S(`<b id="banner-center"><noscript><b>`)
	//line index.html:150
	qw422016.N().S(ln.UI["enableJS"])
	//line index.html:150
	qw422016.N().S(`</b></noscript></b>`)
	//line index.html:156
	qw422016.N().S(`<a id="banner-options" class="banner-float" title="`)
	//line index.html:157
	qw422016.N().S(ln.UI["options"])
	//line index.html:157
	qw422016.N().S(`"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M3.5 0l-.5 1.19c-.1.03-.19.08-.28.13l-1.19-.5-.72.72.5 1.19c-.05.1-.09.18-.13.28l-1.19.5v1l1.19.5c.04.1.08.18.13.28l-.5 1.19.72.72 1.19-.5c.09.04.18.09.28.13l.5 1.19h1l.5-1.19c.09-.04.19-.08.28-.13l1.19.5.72-.72-.5-1.19c.04-.09.09-.19.13-.28l1.19-.5v-1l-1.19-.5c-.03-.09-.08-.19-.13-.28l.5-1.19-.72-.72-1.19.5c-.09-.04-.19-.09-.28-.13l-.5-1.19h-1zm.5 2.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/></svg></a><a id="banner-identity" class="banner-float" title="`)
	//line index.html:162
	qw422016.N().S(ln.UI["identity"])
	//line index.html:162
	qw422016.N().S(`"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4 0c-1.1 0-2 1.12-2 2.5s.9 2.5 2 2.5 2-1.12 2-2.5-.9-2.5-2-2.5zm-2.09 5c-1.06.05-1.91.92-1.91 2v1h8v-1c0-1.08-.84-1.95-1.91-2-.54.61-1.28 1-2.09 1-.81 0-1.55-.39-2.09-1z" /></svg></a><a id="banner-account" class="banner-float" title="`)
	//line index.html:167
	qw422016.N().S(ln.UI["account"])
	//line index.html:167
	qw422016.N().S(`"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="m 2,2.681 c -1.31,0 -2,1.01 -2,2 0,0.99 0.69,2 2,2 0.79,0 1.42,-0.56 2,-1.22 0.58,0.66 1.19,1.22 2,1.22 1.31,0 2,-1.01 2,-2 0,-0.99 -0.69,-2 -2,-2 -0.81,0 -1.42,0.56 -2,1.22 C 3.42,3.241 2.79,2.681 2,2.681 Z m 0,1 c 0.42,0 0.88,0.47 1.34,1 -0.46,0.53 -0.92,1 -1.34,1 -0.74,0 -1,-0.54 -1,-1 0,-0.46 0.26,-1 1,-1 z m 4,0 c 0.74,0 1,0.54 1,1 0,0.46 -0.26,1 -1,1 -0.43,0 -0.89,-0.47 -1.34,-1 0.46,-0.53 0.91,-1 1.34,-1 z" id="path4" /></svg></a><a id="banner-FAQ" class="banner-float" title="`)
	//line index.html:172
	qw422016.N().S(ln.UI["FAQ"])
	//line index.html:172
	qw422016.N().S(`"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M3 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-1.5 2.5c-.83 0-1.5.67-1.5 1.5h1c0-.28.22-.5.5-.5s.5.22.5.5-1 1.64-1 2.5c0 .86.67 1.5 1.5 1.5s1.5-.67 1.5-1.5h-1c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-.36 1-1.84 1-2.5 0-.81-.67-1.5-1.5-1.5z" transform="translate(2)"/></svg></a><a id="banner-feedback" href="mailto:`)
	//line index.html:177
	qw422016.N().U(conf.FeedbackEmail)
	//line index.html:177
	qw422016.N().S(`" target="_blank" class="banner-float" title="`)
	//line index.html:177
	qw422016.N().S(ln.UI["feedback"])
	//line index.html:177
	qw422016.N().S(`"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M0 0v1l4 2 4-2v-1h-8zm0 2v4h8v-4l-4 2-4-2z" transform="translate(0 1)" /></svg></a>`)
	//line index.html:184
	qw422016.N().S(`<b id="sync" class="banner-float" title="`)
	//line index.html:185
	qw422016.N().S(ln.UI["sync"])
	//line index.html:185
	qw422016.N().S(`"></b></span>`)
	//line index.html:189
	qw422016.N().S(`<div id="modal-overlay" class="overlay">`)
	//line index.html:193
	qw422016.N().S(`<div id="FAQ" class="modal glass">meguca is licensed under the`)
	//line index.html:195
	qw422016.N().S(` `)
	//line index.html:195
	qw422016.N().S(`<a href="https://www.gnu.org/licenses/agpl.html" target="_blank">GNU Affero General Public License</a><br>Source code repository:`)
	//line index.html:200
	qw422016.N().S(` `)
	//line index.html:200
	qw422016.N().S(`<a href="https://github.com/bakape/meguca" target="_blank">github.com/bakape/meguca</a><hr>`)
	//line index.html:205
	qw422016.N().S(strings.Replace(conf.FAQ, "\n", "<br>", -1))
	//line index.html:205
	qw422016.N().S(`</div>`)
	//line index.html:209
	qw422016.N().S(`<div id="identity" class="modal glass">`)
	//line index.html:211
	streamtable(qw422016, specs["identity"], ln)
	//line index.html:211
	qw422016.N().S(`</div>`)
	//line index.html:215
	qw422016.N().S(`<div id="account-panel" class="modal glass"><div id="login-forms">`)
	//line index.html:218
	f := ln.Forms

	//line index.html:219
	streamtabButts(qw422016, []string{f["id"][0], f["register"][0]})
	//line index.html:219
	qw422016.N().S(`<div class="tab-cont"><div class="tab-sel" data-id="0"><form id="login-form">`)
	//line index.html:223
	streamtable(qw422016, specs["login"], ln)
	//line index.html:224
	streamcaptcha(qw422016, "login", ln.UI)
	//line index.html:224
	qw422016.N().S(`<input type="submit" value="`)
	//line index.html:225
	qw422016.N().S(ln.UI["submit"])
	//line index.html:225
	qw422016.N().S(`"><div class="form-response admin"></div></form></div><div data-id="1"><form id="registration-form">`)
	//line index.html:231
	streamtable(qw422016, specs["register"], ln)
	//line index.html:232
	streamcaptcha(qw422016, "register", ln.UI)
	//line index.html:232
	qw422016.N().S(`<input type="submit" value="`)
	//line index.html:233
	qw422016.N().S(ln.UI["submit"])
	//line index.html:233
	qw422016.N().S(`"><div class="form-response admin"></div></form></div></div></div><div id="form-selection" class="hidden">`)
	//line index.html:240
	for _, l := range [...]string{"logout", "logoutAll", "changePassword", "createBoard", "configureBoard"} {
		//line index.html:240
		qw422016.N().S(`<a id="`)
		//line index.html:241
		qw422016.N().S(l)
		//line index.html:241
		qw422016.N().S(`">`)
		//line index.html:242
		qw422016.N().S(ln.UI[l])
		//line index.html:242
		qw422016.N().S(`</a><br>`)
		//line index.html:245
	}
	//line index.html:245
	qw422016.N().S(`<span><a id="configureServer">`)
	//line index.html:248
	qw422016.N().S(ln.UI["configureServer"])
	//line index.html:248
	qw422016.N().S(`</a><br></span></div></div>`)
	//line index.html:256
	qw422016.N().S(`<div id="options" class="modal glass">`)
	//line index.html:258
	streamtabButts(qw422016, ln.Tabs)
	//line index.html:258
	qw422016.N().S(`<div class="tab-cont">`)
	//line index.html:260
	for i, sp := range optionSpecs {
		//line index.html:260
		qw422016.N().S(`<div data-id="`)
		//line index.html:261
		qw422016.N().D(i)
		//line index.html:261
		qw422016.N().S(`"`)
		//line index.html:261
		if i == 0 {
			//line index.html:261
			qw422016.N().S(` `)
			//line index.html:261
			qw422016.N().S(`class="tab-sel"`)
			//line index.html:261
		}
		//line index.html:261
		qw422016.N().S(`>`)
		//line index.html:262
		streamoptions(qw422016, sp, ln)
		//line index.html:266
		if i == 0 {
			//line index.html:266
			qw422016.N().S(`<br><span class="spaced">`)
			//line index.html:269
			for _, id := range [...]string{"export", "import", "hidden"} {
				//line index.html:269
				qw422016.N().S(`<a id="`)
				//line index.html:270
				qw422016.N().S(id)
				//line index.html:270
				qw422016.N().S(`" title="`)
				//line index.html:270
				qw422016.N().S(ln.Forms[id][1])
				//line index.html:270
				qw422016.N().S(`">`)
				//line index.html:271
				qw422016.N().S(ln.Forms[id][0])
				//line index.html:271
				qw422016.N().S(`</a>`)
				//line index.html:273
			}
			//line index.html:273
			qw422016.N().S(`</span>`)
			//line index.html:277
			qw422016.N().S(`<input type="file" id="importSettings" hidden>`)
			//line index.html:279
		}
		//line index.html:279
		qw422016.N().S(`</div>`)
		//line index.html:281
	}
	//line index.html:281
	qw422016.N().S(`</div></div></div></div>`)
	//line index.html:288
	qw422016.N().S(`<div class="overlay" id="hover-overlay"></div><div id="page-container"><section id="left-panel" class="side-panel glass"></section>`)
	//line index.html:294
	qw422016.N().S(`<div id="left-spacer" class="side-spacer"></div>`)
	//line index.html:301
	qw422016.N().S(`<section id="threads">{{.Threads}}</section><section id="right-panel" class="side-panel glass"></section><div id="right-spacer" class="side-spacer"></div></div><script src="/assets/js/vendor/system.js"></script>`)
	//line index.html:312
	if conf.Captcha {
		//line index.html:312
		qw422016.N().S(`<script type="text/javascript" src="https://api-secure.solvemedia.com/papi/challenge.ajax"></script>`)
		//line index.html:314
	}
	//line index.html:317
	qw422016.N().S(`<script src="/assets/js/scripts/loader.js"></script></body>`)
//line index.html:320
}

//line index.html:320
func writerenderIndex(qq422016 qtio422016.Writer, ln lang.Pack) {
	//line index.html:320
	qw422016 := qt422016.AcquireWriter(qq422016)
	//line index.html:320
	streamrenderIndex(qw422016, ln)
	//line index.html:320
	qt422016.ReleaseWriter(qw422016)
//line index.html:320
}

//line index.html:320
func renderIndex(ln lang.Pack) string {
	//line index.html:320
	qb422016 := qt422016.AcquireByteBuffer()
	//line index.html:320
	writerenderIndex(qb422016, ln)
	//line index.html:320
	qs422016 := string(qb422016.B)
	//line index.html:320
	qt422016.ReleaseByteBuffer(qb422016)
	//line index.html:320
	return qs422016
//line index.html:320
}
