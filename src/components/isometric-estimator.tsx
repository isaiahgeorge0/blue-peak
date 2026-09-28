"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  defaultEstimatorConfig,
  type EstimatorConfig,
} from "@/lib/isometric-estimator-config";
import { mountIsometricEstimator } from "@/lib/isometric-estimator-scene";
import "./isometric-estimator.css";

type IsometricEstimatorProps = {
  config?: EstimatorConfig;
  /** When true, hide the page-level intro (useful if the parent already provides one). */
  hideIntro?: boolean;
};

/**
 * Interactive 3D quote calculator. Client-only: mounts a three.js scene against
 * the canvas and control markup (adapted from isometric-estimator.html).
 */
export function IsometricEstimator({
  config = defaultEstimatorConfig,
  hideIntro = false,
}: IsometricEstimatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    // Mount returns a full teardown so React Strict Mode remounts (and route
    // navigations) cannot leave a second chip set or WebGL context alive.
    return mountIsometricEstimator(root, config);
  }, [config]);

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
              <div className="ie-cta">
                <span className="ie-confirm" id="ctaConfirm">
                  Noted - we&apos;ll follow up to arrange a visit.
                </span>
                <button id="ctaBtn" type="button">
                  Choose a visit
                </button>
              </div>
              <p className="ie-note" style={{ marginTop: 16 }}>
                Prefer to talk it through?{" "}
                <Link
                  href="/contact"
                  className="text-baby-blue underline-offset-2 hover:underline"
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
              <div className="ie-chip-grid" id="addonChips" />
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
