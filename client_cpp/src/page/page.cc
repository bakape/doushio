#include "../../brunhild/mutations.hh"
#include "../../brunhild/util.hh"
#include "../lang.hh"
#include "../state.hh"
#include "../util.hh"
#include "board.hh"
#include "thread.hh"
#include <emscripten.h>
#include <emscripten/bind.h>
#include <optional>
#include <sstream>

using brunhild::Node;
using std::string;

void render_page()
{
    try {
        if (page->thread) {
            render_thread();
        } else {
            render_board();
        }
    } catch (const std::exception& ex) {
        console::error(ex.what());
    }
}

EMSCRIPTEN_BINDINGS(module_page)
{
    emscripten::function("render_page", &render_page);
}

string format_title(const string& board, const string& text)
{
    std::ostringstream s;
    s << '/' << board << "/ - " << brunhild::escape(text);
    return s.str();
}

void set_title(string t) { brunhild::set_inner_html("page-title", t); }

// Render notice widget, that reveals text on hover
static Node render_hover_reveal(string tag, string label, string text)
{
    Node n{
        tag,
        { { "class", "hover-reveal" } },
        {
            { "span", { { "class", "act" } }, label },
            { "span", { { "class", "popup-menu glass" } }, text, true },
        },
    };
    if (tag == "aside") {
        n.attrs["class"] += " glass";
    }
    return n;
}

void push_board_hover_info(brunhild::Children& ch)
{
    const char* tag = page->thread ? "span" : "aside";
    if (board_config->notice != "") {
        ch.push_back(render_hover_reveal(
            tag, board_config->notice, lang->ui.at("showNotice")));
    }
    if (board_config->rules != "") {
        ch.push_back(render_hover_reveal(
            tag, board_config->rules, lang->ui.at("rules")));
    }
}

Node render_button(std::optional<string> href, string text, bool aside)
{
    Node a("a", text);
    if (href) {
        a.attrs["href"] = *href;
    }
    string cls = "act";
    if (aside) {
        cls += " glass";
    }
    return { aside ? "aside" : "span", { { "class", cls } }, { a } };
}
