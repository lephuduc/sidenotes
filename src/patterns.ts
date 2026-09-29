/**
 * Source-text patterns for HTML sidenote spans and shortcode sidenotes.
 *
 * Factories rather than constants: these carry the `g` flag, so a shared
 * instance would leak `lastIndex` between callers.
 */

// Class-attribute fragment matching any span whose class list contains
// "sidenote" as a whole token — so it also covers the extra classes the
// per-note margin override adds (`sidenote right`, `sidenote margin-note
// left`). Requiring a full token keeps it from matching our own generated
// `sidenote-number` wrappers.
export const SIDENOTE_CLASS_ATTR = `class\\s*=\\s*["'](?:[^"']*\\s)?sidenote(?:\\s[^"']*)?["']`;

// Shortcodes: `{{< note >}}text{{< /note >}}` is a numbered sidenote,
// `{{< side >}}text{{< /side >}}` an unnumbered margin note.
const SHORTCODE_OPEN = `\\{\\{<\\s*(?:note|side)\\s*>\\}\\}`;
const SHORTCODE_TAG = `\\{\\{<\\s*\\/?(?:note|side)\\s*>\\}\\}`;

// A body may not contain another shortcode tag, so an unclosed opener
// can't swallow the note after it.
export const SHORTCODE_BODY = `((?:(?!${SHORTCODE_TAG})[\\s\\S])*?)`;
export const SHORTCODE_LINE_BODY = `((?:(?!${SHORTCODE_TAG})[^\\n])*?)`;

// Groups: 1 = shortcode name, 2 = text.
export const SHORTCODE_REGEX = (body: string = SHORTCODE_BODY) =>
	new RegExp(
		`\\{\\{<\\s*(note|side)\\s*>\\}\\}${body}\\{\\{<\\s*\\/\\1\\s*>\\}\\}`,
		"gi",
	);

// Regex to detect sidenote spans in source text (includes margin-note variant)
export const SIDENOTE_PATTERN = () =>
	new RegExp(
		`<span\\s+${SIDENOTE_CLASS_ATTR}[^>]*>|${SHORTCODE_OPEN}`,
		"gi",
	);

// Groups differ between spans and shortcodes; read matches through
// parseSidenoteMatch.
export const SIDENOTE_SPAN_REGEX = () =>
	new RegExp(
		`<span\\s+${SIDENOTE_CLASS_ATTR}[^>]*>([\\s\\S]*?)<\\/span>` +
			`|\\{\\{<\\s*(note|side)\\s*>\\}\\}${SHORTCODE_BODY}\\{\\{<\\s*\\/\\2\\s*>\\}\\}`,
		"gi",
	);

// Same as SIDENOTE_PATTERN but captures the class list, so callers can read
// the per-note side override (`right` / `left`) out of the source text.
// Shortcodes leave the group empty and use the default side.
export const SIDENOTE_CLASS_CAPTURE_REGEX = () =>
	/<span\s+class\s*=\s*["']((?:[^"']*\s)?sidenote(?:\s[^"']*)?)["'][^>]*>|\{\{<\s*(?:note|side)\s*>\}\}/gi;

export interface SidenoteSourceMatch {
	text: string;
	openingTag: string;
	closingTag: string;
	isMargin: boolean;
}

/** Normalize a SIDENOTE_SPAN_REGEX match, span or shortcode. */
export function parseSidenoteMatch(
	match: RegExpExecArray,
): SidenoteSourceMatch {
	const shortcodeName = match[2];
	if (shortcodeName === undefined) {
		return {
			text: match[1] ?? "",
			openingTag: match[0].substring(0, match[0].indexOf(">") + 1),
			closingTag: "</span>",
			isMargin: /margin-note/.test(match[0]),
		};
	}

	const text = match[3] ?? "";
	const openingTag = match[0].substring(0, match[0].indexOf("}}") + 2);
	return {
		text,
		openingTag,
		closingTag: match[0].substring(openingTag.length + text.length),
		isMargin: shortcodeName.toLowerCase() === "side",
	};
}
