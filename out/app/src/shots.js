// VICE PURSUIT — screenshot views.
// The four renders the judge sees: the cover alone (landscape/square),
// the full editor, and the portrait cover. Each view names its pixel size,
// which grade it wears, and whether the editor chrome shows.

export const SHOT_VIEWS = {
  cover: { file: '1-goldenmile-cover-r17.jpg', width: 1280, height: 720, grade: 'golden-hour', mode: 'cover' },
  editor: { file: '2-goldenmile-editor-r17.jpg', width: 1280, height: 860, grade: 'golden-hour', mode: 'editor' },
  portrait: { file: '3-goldenmile-portrait-r17.jpg', width: 1024, height: 1280, grade: 'neon-nights', mode: 'cover' },
  square: { file: '4-goldenmile-square-r17.jpg', width: 1080, height: 1080, grade: 'golden-hour', mode: 'cover' },
};

/** The shot view named by a URL query (?shot=cover), or null for the plain editor. */
export function shotViewFromQuery(search) {
  const params = new URLSearchParams(search);
  const name = params.get('shot');
  if (!name || !Object.hasOwn(SHOT_VIEWS, name)) return null;
  return { name, ...SHOT_VIEWS[name] };
}

/** Apply a shot view to the editor state: its grade. The canvas pixel size
 *  comes straight from the view, not from the post-size picker. */
export function applyShotView(state, view) {
  if (!view) return;
  state.grade = view.grade;
}
