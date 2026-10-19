import { useEffect } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";

const REFIT_DELAY_MS = 150;

/** Re-fits the viewport once the canvas has its final size (first show, tab switch, window resize). */
export default function FitOnResize() {
  const { fitView } = useReactFlow();
  const store = useStoreApi();

  useEffect(() => {
    const el = store.getState().domNode;
    if (!el) return;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void fitView({ padding: 0.15, minZoom: 0.01, duration: 0 }), REFIT_DELAY_MS);
    });
    observer.observe(el);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [fitView, store]);

  return null;
}
