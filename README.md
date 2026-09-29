# Side-Notes Shortcodes

Sidenotes and margin notes for Obsidian, written as Hugo-style shortcodes,this plugin is supporting me writing things in Obsidian and published article on my personal site: https://lephuduc.github.io :

```markdown
RSA-PSS signatures are randomized.{{< note >}}RSA-PSS mixes the message hash with a random salt before signing, so the same file signed twice gives two different signatures. When we verify, we get the salt back.{{< /note >}}
{{< side >}}Reference: [Probabilistic signature scheme on Wikipedia](https://en.wikipedia.org/wiki/Probabilistic_signature_scheme){{< /side >}}
```

`{{< note >}}` becomes a numbered sidenote in the margin, and `{{< side >}}` becomes a margin note without a number. Because the syntax is the same one a Hugo site uses, notes written in Obsidian can be published without rewriting them.

This plugin is a fork of [Side-Notes](https://github.com/cparsell/sidenotes) by [cparsell](https://github.com/cparsell). See [Credits](#credits).


## Credits

All of the sidenote machinery comes from [Side-Notes](https://github.com/cparsell/sidenotes) by cparsell: the margin layout, numbering, collision avoidance, editing in the margin, margin notes, footnote support and PDF export. This fork adds the shortcode syntax on top of that work.

A big thank you to cparsell for building Side-Notes and sharing it under the MIT license.

## Shortcodes

| Shortcode | Renders as |
| --- | --- |
| `{{< note >}}text{{< /note >}}` | Numbered sidenote |
| `{{< side >}}text{{< /side >}}` | Margin note without a number |

- Works in Reading view and Live Preview. Source mode shows the plain Markdown.
- Only `note` shortcodes are numbered, in document order. Existing `<span class="sidenote">` notes keep working and share the same numbering.
- Links, internal links, **bold**, _italic_ and `inline code` inside a note are rendered in the margin.
- In Live Preview, the raw shortcode shows while the cursor is on it. Click a sidenote's number to select its text, or click the note in the margin to edit it there. Edits are saved back into the shortcode.
- The `Insert sidenote` and `Insert margin note` commands insert `{{< note >}}{{< /note >}}` and `{{< side >}}{{< /side >}}`.
- Shortcodes are part of the **HTML** sidenote format, which is the default.

Limitations:

- A shortcode has to open and close inside one paragraph. In Live Preview it also has to stay on one line, otherwise it is shown as plain text there.
- Shortcodes have no margin override. To place a note in the opposite margin, use the `Insert sidenote (opposite margin)` command, which inserts a `<span class="sidenote right">` span instead.
- Shortcodes inside code blocks and inline code are left alone.
- The plugin renders shortcodes inside Obsidian only. Your Hugo site needs its own `note` and `side` shortcode templates.

## Installation

1. Download `main.js`, `manifest.json` and `styles.css` from the [Releases page](../../releases).
2. Copy them into `YOUR-VAULT/.obsidian/plugins/side-notes-shortcodes/`.
3. Restart Obsidian, then enable **Side-Notes Shortcodes** under **Settings → Community plugins**.

If the original Side-Notes plugin is installed, disable it first, since both plugins style the same elements. To keep your settings, copy `data.json` from `.obsidian/plugins/side-notes/` into the new plugin folder.

### Building from source

```bash
npm install
npm run build
```

The build writes `main.js` to the project root. Pushing a version tag runs `.github/workflows/release.yml`, which builds the plugin and creates a draft release with `main.js`, `manifest.json` and `styles.css`.

## Features

### Sidenotes

Numbered notes shown in the margin instead of at the bottom of the note. Run the `Insert sidenote` command to start one.

- **Three ways to write them**:
  - **Shortcodes**: `{{< note >}}text{{< /note >}}`, in the HTML format
  - **HTML spans**: `<span class="sidenote">text</span>`, in the HTML format
  - **Markdown footnotes**: `This is a sentence[^1].`, in the footnote format
- **Visible in Editing and Reading modes.** Source mode is left alone and shows the bare Markdown.
- **Editable in the margin.** In Editing mode, click a sidenote, edit it, and press `ENTER` to save. `SHIFT+ENTER` adds a new line in the HTML format. Markdown footnote definitions are single-line. Reading mode is read-only.
- **Supports internal and external links**, plus basic Markdown formatting: **bold**, _italic_, and `inline code`.
- **Per-note margin override.** Pin an individual sidenote to the margin opposite the global "Sidenote position" setting with the `Insert sidenote (opposite margin)` command, or by hand:
  - **HTML**: add a `right` or `left` class, e.g. `<span class="sidenote right">text</span>`
  - **Footnotes**: append `-r` or `-l` to the footnote ID, e.g. `[^3-r]`

### Margin notes

Notes in the margin without a number, for asides that don't need a reference. In Editing mode a small marker shows where the note is anchored, and it can be set to open as a popup instead. Click to edit.

- **Shortcodes**: `{{< side >}}text{{< /side >}}`
- **HTML**: `<span class="sidenote margin-note">text</span>`
- **Markdown footnotes**: `[^mn-1]` or `[^mn-kitchen]`
- **Per-note margin override**, same as sidenotes: use the `Insert margin note (opposite margin)` command, add a `right` or `left` class to the span, or add a `-r` or `-l` suffix to the footnote ID. The suffix composes with the `mn-` prefix, e.g. `[^mn-2-l]`.

### Numbering

- Superscript reference numbers are added to the text and increment automatically.
- Displayed as Arabic numerals, Roman numerals, letters, or hidden entirely.
- Styled plain or as badges, including a neumorphic style, to make references easier to spot.
- Optionally restart numbering at each heading.

### Responsive layout

- Sidenotes sit in the left or right margin, anchored to the referencing line.
- Font size shrinks as horizontal space gets tighter. Below configurable breakpoints the margin switches to a compact layout and then hides entirely.
- Collision avoidance keeps notes from overlapping when several land close together.
- Width, gaps, page offset, font size, line height, text alignment and colors are all adjustable.

### PDF export

Works with shortcodes, HTML sidenotes and footnotes, with footnotes still experimental. Notes are laid out in the margin rather than inline, and margin notes are dropped from the endnote list at the end of the document.

## Settings

- **Sidenote format**:
  - **HTML spans or shortcodes**: `{{< note >}}`, `{{< side >}}` and `<span class="sidenote">` all work.
  - **Footnotes**: traditional Markdown footnotes become sidenotes.
    - **Hide footnotes**: hide the original footnotes at the bottom of the note.
    - **Hide footnote numbers**: hide the original Markdown reference numbers in the note text, like `[1]`.
- **Number style**: try "neumorphic badge" for numbers that are easier to spot.
- **Width & spacing**:
  - **Minimum sidenote width** and **Maximum sidenote width**
  - **Sidenote anchor**: decides which of the two gaps below is a fixed position, and which is only a minimum that the sidenote's width gives way to protect.
    - **Anchor to text**: the sidenote stays a fixed distance from the text, set by **Minimum gap between sidenote and text**. It moves whenever the text does, including with **Page offset factor**.
    - **Anchor to editor edge**: the sidenote stays a fixed distance from the pane's edge, set by **Minimum gap between sidenote and editor edge**. If that and the minimum text gap can't both fit, the sidenote's width shrinks instead of its position moving, down to the minimum width, below which it hides.
  - **Gap drift factor**: how much the text gap grows as the pane gets wider. Anchored to text, this moves the sidenote further out. Anchored to the edge, the position never moves and only the usable width tightens.
- **Page offset factor**: how much the note text shifts over to make room for sidenotes, for notes that have them. It only moves the text, never the sidenotes.

## Known issues

- [ ] "Restart numbering after each heading" does not work currently.
- [ ] Changing style settings makes Editing mode sidenotes disappear until Obsidian restarts.

## License

Released under the [MIT License](LICENSE), the same license as the original Side-Notes plugin. The original code is copyright cparsell, and the shortcode additions are copyright lephuduc.
