var optSpecs = [];
var nashi = {opts: []}, inputMinSize = 300, fullWidthExpansion = false;
var shortcutKeys = {};

function extract_num(q) {
	return parseInt(q.attr('id'), 10);
}

function parent_post($el) {
	return $el.closest('article, section');
}

function parent_model($el) {
	var $a = parent_post($el);
	var op = extract_num($a);
	if (!op)
		return null;
	if ($a.is('section'))
		return Threads.get(op);
	var $s = $a.parent('section');
	if (!$s.length) {
		// when we have better hover/inline expansion we will have to
		// deal with this, probably by setting data-op on the post
		console.warn($a, "'s parent is not thread?!");
		return null;
	}
	var num = op;
	op = extract_num($s);
	return Threads.lookup(num, op);
}

(function () {

/* OPTIONS LIST */
optSpecs.push(option_inline_expansion);
if (window.devicePixelRatio > 1)
	optSpecs.push(option_high_res);
optSpecs.push(option_thumbs);
optSpecs.push(option_image_hover);
optSpecs.push(option_webm_hover);
optSpecs.push(option_autogif);
optSpecs.push(option_spoiler);
optSpecs.push(option_backlinks);
optSpecs.push(option_relative_time);
if (radioBanner)
	optSpecs.push(option_now_playing);
if (illyaDance){
	optSpecs.push(option_illya_dance);
	optSpecs.push(option_illya_mute);
}
optSpecs.push(option_horizontal);
optSpecs.push(option_reply_at_right);
optSpecs.push(option_notification);
optSpecs.push(option_theme);
optSpecs.push(option_user_bg);
optSpecs.push(option_user_bg_image);
optSpecs.push(option_last_n);


_.defaults(options, {
	lastn: config.THREAD_LAST_N,
	inlinefit: 'width',
});
options = new Backbone.Model(options);


nashi.upload = !!$('<input type="file"/>').prop('disabled');

if (window.screen && screen.width <= 320) {
	inputMinSize = 50;
	fullWidthExpansion = true;
}

function load_ident() {
	try {
		var id = JSON.parse(localStorage.ident);
		if (id.name)
			$name.val(id.name);
		if (id.email)
			$email.val(id.email);
	}
	catch (e) {}
}

function save_ident() {
	try {
		var name = $name.val(), email = $email.val();
		if (email == 'misaki') {
			$email.val('');
			yepnope(mediaURL + 'js/login-v2.js');
			email = false;
		}
		else if (is_sage(email) && !is_noko(email))
			email = false;
		var id = {};
		if (name || email) {
			if (name)
				id.name = name;
			if (email)
				id.email = email;
			localStorage.setItem('ident', JSON.stringify(id));
		}
		else
			localStorage.removeItem('ident');
	}
	catch (e) {}
}

options.on('change', function () {
	try {
		localStorage.options = JSON.stringify(options);
	}
	catch (e) {}
});

/* LAST N CONFIG */

function option_last_n(n) {
	if (!reasonable_last_n(n))
		return;
	$.cookie('lastn', n);
	// should really load/hide posts as appropriate
}
option_last_n.id = 'lastn';
option_last_n.label = '[Last #]';
option_last_n.type = 'positive';
option_last_n.tooltip = 'Number of posts to display with the "Last n" thread expansion link';

oneeSama.lastN = options.get('lastn');
options.on('change:lastn', function (model, lastN) {
	oneeSama.lastN = lastN;
});

/* THEMES */

function option_theme(theme) {
	if (theme) {
		var css = theme + '-v' + globalVersion + '.css';
		$('#theme').attr('href', mediaURL + 'css/' + css);
	}
	append_glass();
}

option_theme.id = 'board.$BOARD.theme';
option_theme.label = 'Theme';
option_theme.type = themes;
option_theme.tooltip = 'Select CSS theme';

/* THUMBNAIL OPTIONS */

var revealSetup = false;

function option_thumbs(type) {
	$.cookie('thumb', type);
	// really ought to apply the style immediately
	// need pinky/mid distinction in the model to do properly
	oneeSama.thumbStyle = type;
	var hide = type == 'hide';
	if (hide)
		$('img').hide();
	else
		$('img').show();

	if (hide && !revealSetup)
		$DOC.on('click', 'article', reveal_thumbnail);
	else if (!hide && revealSetup)
		$DOC.off('click', 'article', reveal_thumbnail);
	revealSetup = hide;
}
option_thumbs.id = 'board.$BOARD.thumbs';
option_thumbs.label = 'Thumbnails';
option_thumbs.type = thumbStyles;
option_thumbs.tooltip = 'Set thumbnail type: ' +
	'Small: 125x125, small file size; ' +
	'Sharp: 125x125, more detailed; ' +
	'Large: 250x250; ' +
	'Hide: hide all images; ' +
	'Requires page refresh';

/* Alt-click a post to reveal its thumbnail if hidden */
function reveal_thumbnail(event) {
	if (!event.altKey)
		return;
	var $article = $(event.target);
	var $img = $article.find('img');
	if ($img.length) {
		with_dom(function () { $img.show(); });
		return false;
	}

	/* look up the image info and make the thumbnail */
	var thread = Threads.get(extract_num($article.closest('section')));
	if (!thread)
		return;
	var post = thread.get('replies').get(extract_num($article));
	if (!post)
		return;
	var info = post.get('image');
	if (!info)
		return;

	with_dom(function () {
		var img = oneeSama.gazou_img(info, false);
		var $img = $.parseHTML(flatten(img.html).join(''));
		$article.find('figcaption').after($img);
	});
	return false;
}

/* REPLY AT RIGHT */

function option_reply_at_right(r) {
	if (r)
		$('<style/>', {
			id: 'reply-at-right',
			text: 'aside { margin: -26px 0 2px auto; }',
		}).appendTo('head');
	else
		$('#reply-at-right').remove();
}
option_reply_at_right.id = 'replyright';
option_reply_at_right.label = '[Reply] at right';
option_reply_at_right.type = 'checkbox';
option_reply_at_right.tooltip = 'Move Reply button to the right side of the page';

/* BACKLINKS */

function option_backlinks(b) {
	if (b)
		$('small').remove();
	else
		show_backlinks();
}
option_backlinks.id = 'nobacklinks';
option_backlinks.label = 'Backlinks';
option_backlinks.type = 'revcheckbox';
option_backlinks.tooltip = 'Links to replies of current post';

function show_backlinks() {
	if (load_thread_backlinks) {
		with_dom(function () {
			$('section').each(function () {
				load_thread_backlinks($(this));
			});
		});
		load_thread_backlinks = null;
		return;
	}

	Threads.each(function (thread) {
		thread.get('replies').each(function (reply) {
			if (reply.has('backlinks'))
				reply.trigger('change:backlinks');
		});
	});
}

var load_thread_backlinks = function ($section) {
	var op = extract_num($section);
	var replies = Threads.get(op).get('replies');
	$section.find('blockquote a').each(function () {
		var $a = $(this);
		var m = $a.attr('href').match(/^\d*#(\d+)$/);
		if (!m)
			return;
		var destId = parseInt(m[1], 10);
		if (!replies.get(destId)) // local backlinks only for now
			return;
		var src = replies.get(extract_num(parent_post($a)));
		if (!src)
			return;
		var update = {};
		update[destId] = op;
		add_post_links(src, update, op);
	});
};

/* RELATIVE POST TIMESTAMPS */

function option_relative_time(toggle){
	$.cookie('rTime', toggle);
}

option_relative_time.id = 'relativeTime';
option_relative_time.label = 'Relative Timestamps';
option_relative_time.type = 'checkbox';
option_relative_time.tooltip = 'Relative post timestamps. Ex.: "1 hour ago." Requires page refresh';

/* R/A/DIO NOW PLAYING BANNER */

var now_playing_timer;
function option_now_playing(toggle){
	if (!toggle){
		var info;
		(function write_banner(){
			// Disable on small screens, if no options are set
			if (!localStorage.getItem('options') && $(window).width() < 700)
				return;
			// Query the r/a/dio API
		    $.getJSON('https://r-a-d.io/api', function(data){
				if (!data || !data.main)
					return;
		        var main = data.main;
		        var new_info ='<a href="http://r-a-d.io/" target="_blank">' + '[' + main.listeners + '] ' +
					main.dj.djname + '</a>' + '&nbsp;&nbsp;<a href="https://google.com/search?q=' + encodeURIComponent(main.np) +
					'" target="_blank"><b>' + main.np + '</b></a>';
				if (new_info != info){
					info = new_info;
		        	$('#banner_center').html(info);
		       	}
		    })
				// Schedule a new requests, even if the fetch fails
				.always(function(){
					now_playing_timer = setTimeout(write_banner, 10000);
				});
		})();
	} else {
		// Stop updating the banner
		clearTimeout(now_playing_timer);
		$('#banner_center').html('');
	}
}

option_now_playing.id = 'nowPlaying';
option_now_playing.label = 'Now Playing Banner';
option_now_playing.type = 'revcheckbox';
option_now_playing.tooltip = 'Currently playing song on r/a/dio and other stream information in the top banner. '+
	'Hidden by default on mobile.';

/* SPOILER TOGGLE */


function option_spoiler(spoilertoggle) {
	$.cookie('spoil',spoilertoggle);
	oneeSama.spoilToggle = spoilertoggle;
}
option_spoiler.id = 'nospoilertoggle';
option_spoiler.label = 'Image Spoilers';
option_spoiler.type = 'revcheckbox';
option_spoiler.tooltip = "Don't spoiler images. Requires page refresh";

/* Autogif TOGGLE */


function option_autogif(autogif) {
	$.cookie('agif',autogif);
	oneeSama.autoGif = autogif;
}
option_autogif.id = 'autogiftoggle';
option_autogif.label = 'Animated GIF Thumbnails';
option_autogif.type = 'checkbox';
option_autogif.tooltip = 'Animate GIF thumbnails. Requires page refresh';

/* NOTIFICATIONS */


function option_notification(notifToggle) {
	if(notifToggle && (Notification.permission !== "granted"))
		Notification.requestPermission();
}
option_notification.id = 'notification';
option_notification.label = 'Desktop Notifications';
option_notification.type = 'checkbox';
option_notification.tooltip = 'Get desktop notifications when quoted or a syncwatch is about to start';

/* ILLYA DANCE */

function option_illya_dance(illyatoggle){
	var muted = ' ';
	if (options.get(option_illya_mute.id))
		muted = 'muted';
	var dancer = '<video autoplay ' + muted + ' loop id="bgvid" >' +
			'<source src="' + mediaURL + 'illya.webm" type="video/webm">' +
			'<source src="' + mediaURL + 'illya.mp4" type="video/mp4">' +
		'</video>';
	if (illyatoggle)
		$("body").append(dancer);
	else
		$("#bgvid").remove();
}

option_illya_dance.id = 'board.$BOARD.illyaBGToggle';
option_illya_dance.label = 'Illya Dance';
option_illya_dance.type = 'checkbox';
option_illya_dance.tooltip = 'Dancing loli in the background';

function option_illya_mute(toggle){
	if (options.get(option_illya_dance.id)){
		option_illya_dance(false);
		option_illya_dance(true);
	}	
}

option_illya_mute.id = 'illyaMuteToggle';
option_illya_mute.label = 'Mute Illya';
option_illya_mute.type = 'checkbox';
option_illya_mute.tooltip = 'Mute dancing loli';

/* HORIZONTAL POSTING */

function option_horizontal(toggle){
	var style = '<style id="horizontal">article,aside{display:inline-block;}</style>';
	if (toggle)
		$('head').append(style);
	else 
		$('#horizontal').remove();
}

option_horizontal.id = 'horizontalPosting';
option_horizontal.label = 'Horizontal Posting';
option_horizontal.type = 'checkbox';
option_horizontal.tooltip = '38chan nostalgia';

/* CUSTOM USER-SET BACKGROUND */

function option_user_bg(toggle){
	if (options.get(option_user_bg_image.id) != '' && toggle){
		var image = options.get(option_user_bg_image.id);		
		$('body').append($('<img />', {
			id: 'user_bg',
			src: image
		}));
		
		// Append transparent BG, if theme is glass
		append_glass();
	} else
		clear_bg();
}

function clear_bg(){
	$('#user_bg').remove();
	$('#blurred').remove();
}

option_user_bg.id = 'board.$BOARD.userBG';
option_user_bg.label = 'Custom Background';
option_user_bg.type = 'checkbox';
option_user_bg.tooltip = 'Toggle custom page background';

// Generate a new blurred BG on BG change
function option_user_bg_image(image){
	if (image == '')
		clear_bg();
	 else if (image != options.get(BOARD + '.BGCached')){
		var img = new Image();
		img.src = image;
		img.onload = function(){
			// Prevent memory leaks
			$(this).remove();
			// Blur with Pixastic and write to localstorage
			Pixastic.process(img, 'blurfast', {amount: 1.5}, function(blurred){
				localStorage.setItem(BOARD + '.BGBlurred', blurred.toDataURL('image/jpeg', 0.9));
				options.set(BOARD + '.BGCached', image);
				if (options.get(option_user_bg.id))
					option_user_bg(true);
				append_glass();
			});
		};
	} else
		append_glass();
}

function append_glass(){
	// Check if theme is glass, user-bg is set and blurred BG is generated
	if (options.get(option_theme.id) == 'glass' &&
		options.get(option_user_bg_image.id) != '' &&
		options.get(option_user_bg.id) &&
		localStorage.getItem(BOARD + '.BGBlurred')){
			// Apply blurred background
			var blurred = localStorage.getItem(BOARD + '.BGBlurred');
			var bg = 'url(' + blurred + ') center fixed no-repeat; background-size: cover;}' ;
			$('#blurred').remove();
			$('<style />', {id: 'blurred'})
				.appendTo('head')
				.html(
					'article, aside, .pagination, .popup-menu, .modal, .bmodal, .preview, #banner {\
						background:\
							linear-gradient(rgba(40, 42, 46, 0.5), rgba(40, 42, 46, 0.5)),' +
							bg +
					'article.editing{\
						background:\
							linear-gradient(rgba(145, 145, 145, 0.5), rgba(145, 145, 145, 0.5)),' +
							bg
				);
	} else
		$('#blurred').remove();
}

option_user_bg_image.id = 'board.$BOARD.userBGimage';
option_user_bg_image.label = ' ';
option_user_bg_image.type = 'image';
option_user_bg_image.tooltip = "Image URL to use as the board background. " + 
	"URL must be from this website's domain for glass theme blurring to work.";

/* IMAGE HOVER EXPANSION */

var allow_webm_hover = false;

function option_image_hover(toggle){
	function preview(){
		// Check if hovering over image or image is expanded by clicking
		if (!$(target).is('img') || $(target).closest('figure').hasClass('expanded'))
			return fadeout();
		var src = $(target).closest('a').attr('href');
		var oldSrc = $('#hover_overlay_image').attr('src');
		// Do nothing, if still hovering the same image
		if (src == oldSrc)
			return;
		var isWebm = /\.webm/i.test(src);
		// Check if WebM hover expansion is enabled
		if (isWebm && !allow_webm_hover)
			return fadeout();
		var tag =  isWebm ? '<video />' : '<img />';
		var html  = $(tag, {
			id: 'hover_overlay_image',
			'src': src,
			autoplay: '',
			loop: ''
		});
		// Gracefully fade out previous image
		if ($('#hover_overlay_image').length){
				$('#hover_overlay_image').fadeOut({duration: 200, complete: function(){
					fadein(html);
			}});
		} else
			fadein(html);
	}
	
	function fadein(html){
		$('#hover_overlay').html(html);
		$('#hover_overlay_image').fadeIn({duration: 200});
	}
	
	function fadeout(){
		// Do nothing, if image is already removed
		if ($('#hover_overlay_image').length){
			$('#hover_overlay_image').fadeOut({duration: 200, complete: function(){
				$('#hover_overlay_image').remove();
				// More responsive transition with fast pouinter movements
				preview();
			}});
		}
	}
	
	// Currently hovered over element
	var target;
	
	if (toggle){
		$DOC
			.on('mouseover', function(e){
				target = e.target;
			})
			.on('mousemove', preview)
			.on('click', 'img, video', fadeout);
	}
}

option_image_hover.id = 'imageHover';
option_image_hover.label = 'Image Hover Expansion';
option_image_hover.type = 'checkbox';
option_image_hover.tooltip = 'Display image previews on hover. Requires page refresh';

// Toogle hover expansion of WebM
function option_webm_hover(toggle){
	allow_webm_hover = toggle;
}

option_webm_hover.id = 'webmHover';
option_webm_hover.label = 'WebM Hover Expansion';
option_webm_hover.type = 'checkbox';
option_webm_hover.tooltip = 'Display WebM previews on hover. Requires Image Hover Expansion enabled.';

/* INLINE EXPANSION */

function option_inline_expansion() {
	/* TODO: do it live */
}
option_inline_expansion.id = 'inlinefit';
option_inline_expansion.label = 'Expansion';
option_inline_expansion.type = ['none', 'full', 'width', 'height', 'both'];
option_inline_expansion.labels = ['no', 'full-size', 'fit to width',
		'fit to height', 'fit to both'];
option_inline_expansion.tooltip = "Expand images inside the parent post and resize according to setting";

function option_high_res() {
}
option_high_res.id = 'nohighres';
option_high_res.label = 'High-res expansions';
option_high_res.type = 'revcheckbox';
option_high_res.tooltip = 'High resolution image expansion for high DPI screens';

$DOC.on('mouseup', 'img, video', function (event) {
	/* Bypass expansion for non-left mouse clicks */
	if (options.get('inlinefit') != 'none' && event.which > 1) {
		var img = $(this);
		img.data('skipExpand', true);
		setTimeout(function () {
			img.removeData('skipExpand');
		}, 100);
	}
});

$DOC.on('click', 'img, video', function (event) {
	if (options.get('inlinefit') != 'none') {
		var $target = $(this);
		if (!$target.data('skipExpand'))
			toggle_expansion($target, event);
	}
});

function toggle_expansion(img, event) {
	var href = img.parent().attr('href');
	if (/^\.\.\/outbound\//.test(href))
		return;
	if (event.metaKey)
		return;
	event.preventDefault();
	var expand = !img.data('thumbSrc');
	if (expand)
		img.closest('figure').addClass('expanded');
	else
		img.closest('figure').removeClass('expanded');
	var $imgs = img;
	if (THREAD && (event.altKey || event.shiftKey)) {
		var post = img.closest('article');
		if (post.length)
			$imgs = post.nextAll(':has(img):lt(4)').andSelf();
		else
			$imgs = img.closest('section').children(
					':has(img):lt(5)');
		$imgs = $imgs.find('img');
	}

	with_dom(function () {
		$imgs.each(function () {
			var $img = $(this);
			if (expand)
				expand_image($img);
			else {
				contract_image($img, event);
				event = null; // de-zoom to first image only
			}
		});
	});
}

function contract_image($img, event) {
	var thumb = $img.data('thumbSrc');
	if (!thumb)
		return;
	// try to keep the thumbnail in-window for large images
	var h = $img.height();
	var th = parseInt($img.data('thumbHeight'), 10);
	if (event) {
		var y = $img.offset().top, t = $(window).scrollTop();
		if (y < t && th < h)
			window.scrollBy(0, Math.max(th - h,
					y - t - event.clientY + th/2));
	}
	if (fullWidthExpansion)
		contract_full_width(parent_post($img));
	$img.replaceWith($('<img>')
			.width($img.data('thumbWidth')).height(th)
			.attr('src', thumb));
}

function expand_image($img) {
	if ($img.data('thumbSrc'))
		return;
	var a = $img.parent();
	var href = a.attr('href');
	if (!href)
		return;
	var video = /\.webm$/i.test(href);
	var dims = a.siblings('figcaption').text().match(/(\d+)x(\d+)/);
	if (!dims)
		return;
	var tw = $img.width(), th = $img.height();
	var w = parseInt(dims[1], 10), h = parseInt(dims[2], 10);
	// if this is a high-density screen, reduce image size appropriately
	var r = window.devicePixelRatio;
	if (!options.get('nohighres') && !video && r && r > 1) {
		if (w/r > tw && h/r > th) {
			w /= r;
			h /= r;
		}
	}

	$img.remove();
	$img = $(video ? '<video>' : '<img>', {
		src: href,
		width: w, height: h,
		data: {
			thumbWidth: tw, thumbHeight: th,
			thumbSrc: $img.attr('src'),
		},
		prop: video ? {autoplay: true, loop: true} : {},
	}).appendTo(a);

	var fit = options.get('inlinefit');
	if (fit != 'none') {
		var both = fit == 'both';
		fit_to_window($img, w, h, both || fit == 'width',
				both || fit == 'height');
	}
}

function fit_to_window($img, w, h, widthFlag, heightFlag) {
	var $post = parent_post($img);
	var overX = 0, overY = 0;
	if (widthFlag) {
		var innerWidth = $(window).innerWidth();
		var rect = $post.length && $post[0].getBoundingClientRect();
		if ($post.is('article')) {
			if (fullWidthExpansion && w > innerWidth) {
				overX = w - innerWidth;
				expand_full_width($img, $post, rect);
				heightFlag = false;
			}
			else
				overX = rect.right - innerWidth;
		}
		else if ($post.is('section'))
			overX = w - (innerWidth - rect.left*2);
	}
	if (heightFlag) {
		overY = h - ($(window).innerHeight() - 20);
	}

	var aspect = h / w;
	var newW, newH;
	if (overX > 0) {
		newW = w - overX;
		newH = aspect * newW;
	}
	if (overY > 0) {
		// might have to fit to both width and height
		var maybeH = h - overY;
		if (!newH || maybeH < newH) {
			newH = maybeH;
			newW = newH / aspect;
		}
	}

	if (newW > 50 && newH > 50)
		$img.width(newW).height(newH);
}

function expand_full_width($img, $post, rect) {
	var img = $img[0].getBoundingClientRect();
	$img.css('margin-left', -img.left + 'px');
	var over = rect.right - img.right;
	if (over > 0) {
		$post.css({
			'margin-right': -over+'px',
			'padding-right': 0,
			'border-right': 'none',
		});
	}
}

function contract_full_width($post) {
	if ($post.css('margin-right')[0] == '-') {
		$post.css({
			'margin-right': '',
			'padding-right': '',
			'border-right': '',
		});
	}
}

/* SHORTCUT KEYS */

var shortcuts = [
	{label: 'New post', name: 'new', which: 78},
	{label: 'Image spoiler', name: 'togglespoiler', which: 73},
	{label: 'Finish post', name: 'done', which: 83},
];

function toggle_shortcuts(event) {
	event.preventDefault();
	var $shortcuts = $('#shortcuts');
	if ($shortcuts.length)
		return $shortcuts.remove();
	$shortcuts = $('<div/>', {
		id: 'shortcuts',
		click: select_shortcut,
		keyup: change_shortcut,
	});
	shortcuts.forEach(function (s) {
		var value = String.fromCharCode(shortcutKeys[s.name]);
		var $label = $('<label>', {text: s.label});
		$('<input>', {
			id: s.name, maxlength: 1, val: value,
		}).prependTo($label);
		$label.prepend(document.createTextNode('Alt+'));
		$shortcuts.append($label, '<br>');
	});
	$shortcuts.appendTo('#options-panel');
}

function select_shortcut(event) {
	if ($(event.target).is('input'))
		$(event.target).val('');
}

function change_shortcut(event) {
	if (event.which == 13)
		return false;
	var $input = $(event.target);
	var letter = $input.val();
	if (!(/^[a-z]$/i.exec(letter)))
		return;
	var which = letter.toUpperCase().charCodeAt(0);
	var name = $input.attr('id');
	if (!(name in shortcutKeys))
		return;
	shortcutKeys[name] = which;

	var shorts = options.get('shortcuts')
	if (!_.isObject(shorts)) {
		shorts = {};
		shorts[name] = which;
		options.set('shortcuts', shorts);
	}
	else {
		shorts[name] = which;
		options.trigger('change'); // force save
	}

	$input.blur();
}

_.defer(function () {
	load_ident();
	var save = _.debounce(save_ident, 1000);
	function prop() {
		if (postForm)
			postForm.propagate_ident();
		save();
	}
	$name.input(prop);
	$email.input(prop);

	optSpecs.forEach(function (spec) {
		spec.id = spec.id.replace(/\$BOARD/g, BOARD);
	});

	$('#options').click(function () {
		var $opts = $('#options-panel');
		if (!$opts.length)
			$opts = make_options_panel().appendTo('body');
		if ($opts.is(':hidden'))
			oneeSama.trigger('renderOptions', $opts);
		position_bmodal('#options-panel');
	});

	optSpecs.forEach(function (spec) {
		spec(options.get(spec.id));
	});

	var prefs = options.get('shortcuts') || {};
	shortcuts.forEach(function (s) {
		shortcutKeys[s.name] = prefs[s.name] || s.which;
	});
});

/* TOGGLER FOR TOP BANNER BUTTONS */

function position_bmodal(target){
	if (!$(target).is(':visible')){
		$(target).css('top', $('#banner').outerHeight() + 5 + 'px');
		$('.bmodal:visible').toggle('fast');
	}
	$(target).toggle('fast');
}
$('#banner_FAQ').click(function(){
	position_bmodal('#FAQ');
});
$('#banner_schedule').click(function(){
	position_bmodal('#schedule');
});
$('#banner_identity').click(function(){
	position_bmodal('#identity');
});

// Highlight options button, if no options are set
if (!localStorage.getItem('options')){
	$('#options').addClass('noOptions');
	function fadeout(){
		$('.noOptions').fadeOut(fadein);
	}
	function fadein(){
		// Stop animation, if options pannel is opened
		if (!$('.noOptions').length)
			$('#options').fadeIn();
		$('.noOptions').fadeIn(fadeout);
	}
	fadeout();
	
	$('#options').click(function(){
		$('#options').removeClass('noOptions');
	});
}

function make_options_panel() {
	var $opts = $('<div/>', {"class": 'bmodal', id: 'options-panel'});
	$opts.change(function (event) {
		var $o = $(event.target), id = $o.attr('id'), val;
		var spec = _.find(optSpecs, function (s) {
			return s.id == id;
		});
		if (!spec)
			return;
		if (spec.type == 'checkbox')
			val = !!$o.prop('checked');
		else if (spec.type == 'revcheckbox')
			val = !$o.prop('checked');
		else if (spec.type == 'positive')
			val = Math.max(parseInt($o.val(), 10), 1);
		else if (spec.type == 'image'){
			var trimmed = $o.val().trim();
			if (/^$|\.(jpe?g|png|gif)$/i.test(trimmed))
				val = trimmed;
		}
		else
			val = $o.val();
		options.set(id, val);
		with_dom(function () {
			spec(val);
		});
	});
	optSpecs.forEach(function (spec) {
		var id = spec.id;
		if (nashi.opts.indexOf(id) >= 0)
			return;
		var val = options.get(id), $input, type = spec.type;
		if (type == 'checkbox' || type == 'revcheckbox') {
			var b = (type == 'revcheckbox') ? !val : val;
			$input = $('<input type="checkbox" />')
				.prop('checked', b ? 'checked' : null);
		}
		else if (type == 'positive') {
			$input = $('<input />', {
				width: '4em',
				maxlength: 4,
				val: val,
			});
		} else if (type == 'image'){
			$input = $('<input />', {
				placeholder: 'Image URL',
				val: val
			});
		}
		else if (type instanceof Array) {
			$input = $('<select/>');
			var labels = spec.labels || {};
			type.forEach(function (item, i) {
				var label = labels[i] || item;
				$('<option/>')
					.text(label).val(item)
					.appendTo($input);
			});
			if (type.indexOf(val) >= 0)
				$input.val(val);
		}
		var $label = $('<label/>').attr('for', id).attr('title', spec.tooltip).text(spec.label);
		$opts.append($input.attr('id', id).attr('title', spec.tooltip), ' ', $label, '<br>');
	});
	if (!nashi.shortcuts) {
		$opts.append($('<a/>', {
			href: '#', text: 'Keyboard Shortcuts',
			click: toggle_shortcuts,
		}));
	}
	oneeSama.trigger('initOptions', $opts);
	return $opts.hide();
}

})();
