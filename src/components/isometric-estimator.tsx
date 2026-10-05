"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EstimatorBooking } from "@/components/estimator-booking";
import {
  defaultEstimatorConfig,
  type EstimateSummary,
  type EstimatorConfig,
} from "@/lib/isometric-estimator-config";
import "./isometric-estimator.css";

type IsometricEstimatorProps = {
  config?: EstimatorConfig;
  /** When true, hide the page-level intro (useful if the parent already provides one). */
  hideIntro?: boolean;
};

/**
 * Interactive 3D quote calculator. The markup is server-rendered so the page
 * doesn't shift; three.js is loaded after hydration and mounted into it
 * (adapted from isometric-estimator.html).
 */
export function IsometricEstimator({
  config = defaultEstimatorConfig,
  hideIntro = false,
}: IsometricEstimatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const estimateRef = useRef<EstimateSummary | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [mountError, setMountError] = useState<unknown>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("@/lib/isometric-estimator-scene")
      .then(({ mountIsometricEstimator }) => {
        if (cancelled) return;
        // Mount returns a full teardown so React Strict Mode remounts (and
        // route navigations) cannot leave a second WebGL context alive.
        dispose = mountIsometricEstimator(root, config, (estimate) => {
          estimateRef.current = estimate;
        });
        setSceneReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMountError(error ?? new Error("Estimator failed"));
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [config]);

  // Rethrow during render so the surrounding error boundary shows the fallback.
  if (mountError) throw mountError;

  return (
    <div ref={rootRef} className="ie-root">
      <div className="ie-wrap">
        {hideIntro ? null : (
          <>
            <p className="ie-eyebrow">
              Blue Peak - quote calculator, real-time 3D
            </p>
            <h1 className="ie-title">What are we building?</h1>
            <p className="ie-lede">
              Pick the work. Watch the house change and the price move. Then
              book a free site visit for the exact number.{" "}
              <strong>Drag to orbit, scroll to zoom.</strong>
            </p>
          </>
        )}

        <div className="ie-layout">
          <div className="ie-stage-col">
            <div className="ie-stage-panel">
              <span className="ie-stage-hint">
                Drag to orbit · scroll to zoom
              </span>
              <div className="ie-daynight" id="daynightToggle">
                <button type="button" data-mode="day" aria-pressed="true">
                  Day
                </button>
                <button type="button" data-mode="night" aria-pressed="false">
                  Night
                </button>
              </div>
              <div id="stageHost" className="ie-stage-host" />
              {sceneReady ? null : (
                <p className="ie-stage-loading" role="status">
                  Loading the 3D preview...
                </p>
              )}
              <div className="ie-stage-foot">
                <span>Dashed wireframe - not selected</span>
                <span>Solid &amp; lit - included</span>
              </div>
            </div>

            <div className="ie-price-panel">
              <div className="ie-summary">
                <div>
                  <p className="ie-fig-label">Estimated from</p>
                  <p className="ie-fig-value" id="priceOut">
                    Select what you&apos;re building
                  </p>
                </div>
                <div>
                  <p className="ie-fig-label">Time on site</p>
                  <p className="ie-fig-value ie-muted" id="weeksOut">
                    -
                  </p>
                </div>
              </div>
              <div className="ie-cost-bar" id="costBar" />
              <div className="ie-cost-legend" id="costLegend" />
              <EstimatorBooking getEstimate={() => estimateRef.current} />
              <p className="ie-note" style={{ marginTop: 16 }}>
                Prefer to talk it through?{" "}
                <Link
                  href="/contact"
                  className="text-accent underline underline-offset-2 hover:text-ink"
                >
                  Send an enquiry
                </Link>
                .
              </p>
            </div>

            <p className="ie-note">
              Figures are interactive estimates for scoping a conversation, not
              a fixed quote. Add-ons scale in as solid geometry when selected;
              dashed outlines show options that are still off.
            </p>
          </div>

          <div className="ie-controls">
            <div className="ie-panel">
              <h2>What are we building?</h2>
              <p className="ie-hint">Pick as many as you like.</p>
              <div className="ie-chip-grid" id="addonChips">
                {config.addons.map((addon) => (
                  <button
                    key={addon.key}
                    type="button"
                    className="ie-chip"
                    data-key={addon.key}
                    aria-pressed="false"
                  >
                    <span className="ie-dot" />
                    <span>{addon.label}</span>
                    <span className="ie-price-tag">
                      +£{addon.price.toLocaleString("en-GB")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ie-panel">
              <h2>Size of the job</h2>
              <p className="ie-hint">Rough scale of the works.</p>
              <div className="ie-seg" id="sizeSeg">
                <button type="button" data-size="compact">
                  Compact
                </button>
                <button type="button" data-size="standard" aria-pressed="true">
                  Standard
                </button>
                <button type="button" data-size="large">
                  Large
                </button>
              </div>
            </div>
            <div className="ie-panel">
              <h2>Finish</h2>
              <p className="ie-hint">Spec level for materials and fit-out.</p>
              <div className="ie-seg" id="finishSeg">
                <button type="button" data-finish="simple">
                  Simple
                </button>
                <button type="button" data-finish="quality" aria-pressed="true">
                  Quality
                </button>
                <button type="button" data-finish="highend">
                  High-end
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
