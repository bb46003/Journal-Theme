export function modifyMark(markType, state, dispatch, attrs = null, options = {}) {
  const dropSpace = !options.includeWhitespace;
  const { ranges } = state.selection;

  if (!dispatch) return true;


  let tr = state.tr;

  for (const { $from, $to } of ranges) {
    let from = $from.pos, to = $to.pos;
    const start = $from.nodeAfter, end = $to.nodeBefore;
    const spaceStart = dropSpace && start?.isText ? /^\s*/.exec(start.text)[0].length : 0;
    const spaceEnd = dropSpace && end?.isText ? /\s*$/.exec(end.text)[0].length : 0;

    if (from + spaceStart < to) {
      from += spaceStart;
      to -= spaceEnd;
    }
    tr = tr.removeMark(from, to, markType);
    if (options.modify) {
      tr = tr.addMark(from, to, markType.create(attrs));
    }
  }
  dispatch(tr.scrollIntoView());
  return true;
}
