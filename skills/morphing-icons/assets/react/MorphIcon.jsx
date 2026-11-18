// React wrapper for the three-line morph engine. Copy it next to ../js/icons.js and ../js/morph-icon.js
// and fix the import path. The engine animates by writing SVG attributes, so the component renders once.
import { useEffect, useRef } from "react";
import { mountMorphIcon } from "../js/morph-icon.js";

/**
 * <MorphIcon icon="menu" label="Open menu" size={20} />
 * Change `icon` to morph. Pass `label` only when the icon stands alone; inside a labelled button,
 * leave it out so the SVG is hidden from assistive technology.
 * `icons` and `groups` are read on mount; keep them stable (module scope or useMemo).
 */
export function MorphIcon({ icon, label, size = 20, strokeWidth = 1.5, icons, groups, spring, className }) {
  const host = useRef(null);
  const api = useRef(null);

  useEffect(() => {
    api.current = mountMorphIcon(host.current, { icon, label, size, strokeWidth, icons, groups, spring });
    return () => {
      api.current.destroy();
      api.current = null;
    };
    // Remount only when the drawing setup changes; icon and label changes animate below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, strokeWidth, icons, groups, spring]);

  useEffect(() => {
    api.current?.set(icon);
  }, [icon]);

  useEffect(() => {
    api.current?.setLabel(label);
  }, [label]);

  return <span ref={host} className={className} style={{ display: "inline-flex", lineHeight: 0 }} />;
}
