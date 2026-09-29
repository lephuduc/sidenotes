/**
 * Shortcode sidenotes: `{{< note >}}text{{< /note >}}` and
 * `{{< side >}}text{{< /side >}}`.
 *
 * Both modes turn a shortcode into the same `span.sidenote` markup the HTML
 * format uses, so numbering, layout, collisions and margin editing are
 * shared with it.
 */

import { editorLivePreviewField } from "obsidian";
import { syntaxTree } from "@codemirror/language";
import type { EditorState, Range } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	type EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { SHORTCODE_LINE_BODY, SHORTCODE_REGEX } from "./patterns";
import type { SidenoteWidgetHost } from "./widget-host";

const SKIP_SELECTOR =
	"code, pre, .sidenote-number, .sidenote-margin, span.sidenote";

interface TextSlice {
	node: Text;
	from: number;
	to: number;
}

function sidenoteClass(isMargin: boolean): string {
	return isMargin ? "sidenote margin-note" : "sidenote";
}

function isMarginShortcode(name: string | undefined): boolean {
	return (name ?? "").toLowerCase() === "side";
}

/** Split a slice out of its text node and return the new node. */
function isolateText(slice: TextSlice): Text {
	const isolated = slice.node.splitText(slice.from);
	isolated.splitText(slice.to - slice.from);
	return isolated;
}

/**
 * Reading mode: wrap each shortcode's rendered content in a
 * `span.sidenote` and remove the shortcode tags.
 */
export function convertShortcodeSidenotes(root: HTMLElement) {
	if (!root.textContent?.includes("{{<")) return;

	const nodes: Text[] = [];
	const starts: number[] = [];
	let text = "";
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		if (node.parentElement?.closest(SKIP_SELECTOR)) continue;
		const textNode = node as Text;
		nodes.push(textNode);
		starts.push(text.length);
		text += textNode.data;
	}

	// A tag must sit inside one text node to be split out cleanly.
	const locate = (from: number, to: number): TextSlice | null => {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const start = starts[i];
			if (!node || start === undefined) break;
			const end = start + node.data.length;
			if (from >= start && from < end) {
				return to <= end
					? { node, from: from - start, to: to - start }
					: null;
			}
		}
		return null;
	};

	const found: { open: TextSlice; close: TextSlice; isMargin: boolean }[] =
		[];
	const regex = SHORTCODE_REGEX();
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		const start = match.index;
		const open = locate(start, start + match[0].indexOf("}}") + 2);
		const close = locate(
			start + match[0].lastIndexOf("{{"),
			start + match[0].length,
		);
		if (open && close && open.node.parentNode === close.node.parentNode) {
			found.push({ open, close, isMargin: isMarginShortcode(match[1]) });
		}
	}

	// Last match first, so earlier offsets stay valid while nodes are split.
	for (const { open, close, isMargin } of found.reverse()) {
		const closeTag = isolateText(close);
		const openTag = isolateText(open);
		const span = createSpan({ cls: sidenoteClass(isMargin) });
		while (openTag.nextSibling && openTag.nextSibling !== closeTag) {
			span.appendChild(openTag.nextSibling);
		}
		closeTag.replaceWith(span);
		openTag.remove();
	}
}

/**
 * Live Preview stand-in for a shortcode. Holds the raw text, the same way
 * Obsidian renders an inline HTML span, for the editing-mode pass to wrap.
 */
class ShortcodeSidenoteWidget extends WidgetType {
	constructor(
		readonly text: string,
		readonly isMargin: boolean,
	) {
		super();
	}

	eq(other: ShortcodeSidenoteWidget): boolean {
		return other.text === this.text && other.isMargin === this.isMargin;
	}

	toDOM(): HTMLElement {
		const host = createSpan({ cls: "sidenote-shortcode" });
		host.createSpan({
			cls: sidenoteClass(this.isMargin),
			text: this.text,
		});
		return host;
	}
}

type ShortcodeHost = Pick<SidenoteWidgetHost, "settings" | "settingsVersion">;

function isLivePreview(state: EditorState): boolean {
	return state.field(editorLivePreviewField, false) !== false;
}

function buildShortcodeDecorations(
	host: ShortcodeHost,
	state: EditorState,
): DecorationSet {
	if (host.settings.sidenoteFormat !== "html" || !isLivePreview(state)) {
		return Decoration.none;
	}

	const text = state.doc.toString();
	const ranges = state.selection.ranges;
	const tree = syntaxTree(state);
	const decorations: Range<Decoration>[] = [];
	// Single-line only: a plugin decoration may not replace a line break.
	const regex = SHORTCODE_REGEX(SHORTCODE_LINE_BODY);
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		const from = match.index;
		const to = from + match[0].length;
		// Show the raw shortcode while the cursor is on it.
		if (ranges.some((r) => r.from <= to && r.to >= from)) continue;
		if (/code|math/i.test(tree.resolveInner(from, 1).name)) continue;

		decorations.push(
			Decoration.replace({
				widget: new ShortcodeSidenoteWidget(
					match[2] ?? "",
					isMarginShortcode(match[1]),
				),
			}).range(from, to),
		);
	}

	return Decoration.set(decorations);
}

export function createShortcodeSidenotePlugin(host: ShortcodeHost) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			settingsVersion = host.settingsVersion;

			constructor(view: EditorView) {
				this.decorations = buildShortcodeDecorations(host, view.state);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.selectionSet ||
					update.viewportChanged ||
					this.settingsVersion !== host.settingsVersion ||
					isLivePreview(update.startState) !==
						isLivePreview(update.state)
				) {
					this.settingsVersion = host.settingsVersion;
					this.decorations = buildShortcodeDecorations(
						host,
						update.state,
					);
				}
			}
		},
		{ decorations: (v) => v.decorations },
	);
}
