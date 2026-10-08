"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EstimatorBooking } from "@/components/estimator-booking";
import {
  defaultEstimatorConfig,
  ESTIMATOR_FINISH_LABELS,
  ESTIMATOR_SIZE_LABELS,
  ESTIMATOR_START_OPTIONS,
  type EstimateSummary,
  type EstimatorConfig,
  type EstimatorFinish,
  type EstimatorSelection,
  type EstimatorSize,
} from "@/lib/isometric-estimator-config";
import type { IsometricEstimatorHandle } from "@/lib/isometric-estimator-scene";
import "./isometric-estimator.css";

type IsometricEstimatorProps = {
  config?: EstimatorConfig;
  /** When true, hide the page-level intro (useful if the parent already provides one). */
  hideIntro?: boolean;
};

const STEP_TITLES = [
  "What are we building?",
  "How big is the job?",
  "What level of finish?",
  "How can we reach you?",
] as const;

const LAST_STEP = STEP_TITLES.length - 1;
/** The stacked layout with the model pinned on top; matches isometric-estimator.css. */
const STACKED_QUERY =
  "(max-width: 959px) and (min-height: 500px), (max-width: 959px) and (orientation: portrait)";

const SIZES = Object.keys(ESTIMATOR_SIZE_LABELS) as EstimatorSize[];
const FINISHES = Object.keys(ESTIMATOR_FINISH_LABELS) as EstimatorFinish[];

/** History entries pushed for steps 2 to 4 carry this key. */
type StepHistoryState = { ieStep?: number } | null;

function formatPounds(value: number) {
  return `£${value.toLocaleString("en-GB")}`;
}

/**
 * Interactive 3D quote calculator as a four-step funnel. React owns the
 * selection and pushes it into the three.js scene, which draws the model and
 * writes the running figure and cost bar into the ids it is given.
 */
export function IsometricEstimator({
  config = defaultEstimatorConfig,
  hideIntro = false,
}: IsometricEstimatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<IsometricEstimatorHandle | null>(null);
  const estimateRef = useRef<EstimateSummary | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const startWhenRef = useRef("");
  const headingFocusPending = useRef(false);

  const [selection, setSelection] = useState<EstimatorSelection>({
    addons: [],
    size: "standard",
    finish: "quality",
  });
  const selectionRef = useRef(selection);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back" | null>(null);
  const [startWhen, setStartWhen] = useState("");
  const [estimate, setEstimate] = useState<EstimateSummary | null>(null);
  const [sent, setSent] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [mountError, setMountError] = useState<unknown>(null);

  const uid = useId();
  const headingId = `${uid}-heading`;
  const helperId = `${uid}-helper`;
  const nextHelperId = `${uid}-next-helper`;
  const startLabelId = `${uid}-start`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let cancelled = false;
    let handle: IsometricEstimatorHandle | undefined;
    import("@/lib/isometric-estimator-scene")
      .then(({ mountIsometricEstimator }) => {
        if (cancelled) return;
        // Mount returns a full teardown so React Strict Mode remounts (and
        // route navigations) cannot leave a second WebGL context alive.
        handle = mountIsometricEstimator(
          root,
          config,
          selectionRef.current,
          (next) => {
            estimateRef.current = next;
            setEstimate(next);
          },
        );
        sceneRef.current = handle;
        setSceneReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMountError(error ?? new Error("Estimator failed"));
      });
    return () => {
      cancelled = true;
      sceneRef.current = null;
      handle?.dispose();
    };
  }, [config]);

  useEffect(() => {
    selectionRef.current = selection;
    sceneRef.current?.update(selection);
  }, [selection]);

  const goToStep = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(LAST_STEP, next));
    if (clamped === stepRef.current) return;
    setDirection(clamped > stepRef.current ? "forward" : "back");
    stepRef.current = clamped;
    headingFocusPending.current = true;
    setStep(clamped);
  }, []);

  // The browser back button walks back through the steps, not off the page.
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const state = event.state as StepHistoryState;
      let target = typeof state?.ieStep === "number" ? state.ieStep : 0;
      if (target > 0 && selectionRef.current.addons.length === 0) target = 0;
      goToStep(target);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [goToStep]);

  // On phones the pinned model block slides up under the floating header as
  // the estimator ends; the header steps aside while the two overlap.
  useEffect(() => {
    const sticky = visualRef.current?.querySelector<HTMLElement>(".ie-sticky");
    if (!sticky) return;
    const root = document.documentElement;
    const stacked = window.matchMedia(STACKED_QUERY);
    let frame = 0;
    const update = () => {
      frame = 0;
      const rem = parseFloat(getComputedStyle(root).fontSize);
      // The pills end 4rem down (1.25rem offset plus a 2.75rem pill).
      const pillsBottom = rem * 4;
      const rect = sticky.getBoundingClientRect();
      if (stacked.matches && rect.top < pillsBottom + 4 && rect.bottom > 0) {
        root.dataset.headerYield = "true";
      } else {
        delete root.dataset.headerYield;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.headerYield;
    };
  }, []);

  // Move focus to the step heading and bring the card into view, on each step
  // change and once the enquiry is sent.
  useEffect(() => {
    if (!headingFocusPending.current) return;
    headingFocusPending.current = false;
    const heading = headingRef.current;
    const card = cardRef.current;
    if (!heading || !card) return;
    heading.focus({ preventScroll: true });

    const stacked = window.matchMedia(STACKED_QUERY).matches;
    const headerHeight =
      parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.75;
    const sticky = stacked
      ? visualRef.current?.querySelector(".ie-sticky")
      : null;
    const boundary = sticky
      ? sticky.getBoundingClientRect().bottom
      : headerHeight;
    const cardTop = card.getBoundingClientRect().top;
    let delta = cardTop < boundary ? cardTop - boundary - 12 : 0;
    // After sending, the confirmation itself must end up on screen.
    const status = sent ? card.querySelector('[role="status"]') : null;
    if (status) {
      const below =
        status.getBoundingClientRect().bottom - delta - (window.innerHeight - 16);
      if (below > 0) delta += below;
    }
    if (delta !== 0) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollBy({
        top: delta,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  }, [step, sent]);

  // Rethrow during render so the surrounding error boundary shows the fallback.
  if (mountError) throw mountError;

  const canContinue = selection.addons.length > 0;

  function handleNext() {
    if (step >= LAST_STEP) return;
    if (step === 0 && !canContinue) return;
    const next = step + 1;
    window.history.pushState({ ieStep: next }, "");
    goToStep(next);
  }

  function handleBack() {
    const state = window.history.state as StepHistoryState;
    if (state?.ieStep === step) {
      window.history.back();
    } else {
      goToStep(step - 1);
    }
  }

  function toggleAddon(key: string) {
    setSelection((current) => ({
      ...current,
      addons: current.addons.includes(key)
        ? current.addons.filter((k) => k !== key)
        : [...current.addons, key],
    }));
  }

  function chooseStart(value: string) {
    startWhenRef.current = value;
    setStartWhen(value);
  }

  const stepClassName = direction
    ? `ie-step ie-step--${direction}`
    : "ie-step";

  const selectedLabels = config.addons
    .filter((addon) => selection.addons.includes(addon.key))
    .map((addon) => addon.label);

  // Rendered twice; CSS shows the pinned copy below 960px and the card copy above.
  function renderProgress(placement: "pinned" | "card") {
    return (
      <div className={`ie-progress ie-progress--${placement}`}>
        <p className="ie-progress-label">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <div className="ie-progress-track" aria-hidden="true">
          <span
            className="ie-progress-fill"
            style={{
              width: `${((step + 1) / STEP_TITLES.length) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={
        step === LAST_STEP && !sent ? "ie-root ie-root--form" : "ie-root"
      }
    >
      <div className="ie-wrap">
        {hideIntro ? null : (
          <>
            <h1 className="ie-title">Build your estimate</h1>
            <p className="ie-lede">
              Pick the work. Watch the house change and the price move. Then
              book a free site visit for the exact number.
            </p>
          </>
        )}

        <div className="ie-layout">
          <div ref={visualRef} className="ie-visual">
            <div className="ie-sticky">
              <div className="ie-stage-panel">
                <span className="ie-stage-hint">Drag to rotate</span>
                <div id="stageHost" className="ie-stage-host" />
                {sceneReady ? null : (
                  <p className="ie-stage-loading" role="status">
                    Loading the 3D preview...
                  </p>
                )}
              </div>

              <div className="ie-summary">
                <div>
                  <p className="ie-fig-label">Estimated from</p>
                  <p className="ie-fig-value ie-muted" id="priceOut">
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

              {renderProgress("pinned")}
            </div>

            <div className="ie-breakdown">
              <div className="ie-cost-bar" id="costBar" />
              <div className="ie-cost-legend" id="costLegend" />
            </div>
          </div>

          <div ref={cardRef} className="ie-card">
            {renderProgress("card")}

            <div key={step} className={stepClassName}>
              <h2
                ref={headingRef}
                id={headingId}
                tabIndex={-1}
                className="ie-step-title"
              >
                {STEP_TITLES[step]}
              </h2>

              {step === 0 ? (
                <fieldset
                  className="ie-options ie-options--grid"
                  aria-labelledby={headingId}
                  aria-describedby={helperId}
                >
                  <p id={helperId} className="ie-hint">
                    Pick as many as you like.
                  </p>
                  <div className="ie-option-grid">
                    {config.addons.map((addon) => (
                      <label key={addon.key} className="ie-option">
                        <input
                          type="checkbox"
                          className="ie-option-input"
                          checked={selection.addons.includes(addon.key)}
                          onChange={() => toggleAddon(addon.key)}
                        />
                        <span className="ie-option-body">
                          <span className="ie-option-mark ie-option-mark--check" />
                          <span className="ie-option-label">{addon.label}</span>
                          <span className="ie-option-meta">
                            from {formatPounds(addon.price)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {step === 1 ? (
                <fieldset
                  className="ie-options"
                  aria-labelledby={headingId}
                  aria-describedby={helperId}
                >
                  <p id={helperId} className="ie-hint">
                    Rough scale of the works.
                  </p>
                  <div className="ie-option-list">
                    {SIZES.map((size) => (
                      <label key={size} className="ie-option">
                        <input
                          type="radio"
                          name={`${uid}-size`}
                          value={size}
                          className="ie-option-input"
                          checked={selection.size === size}
                          onChange={() =>
                            setSelection((current) => ({ ...current, size }))
                          }
                        />
                        <span className="ie-option-body ie-option-body--row">
                          <span className="ie-option-mark ie-option-mark--radio" />
                          <span className="ie-option-label">
                            {ESTIMATOR_SIZE_LABELS[size]}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {step === 2 ? (
                <fieldset
                  className="ie-options"
                  aria-labelledby={headingId}
                  aria-describedby={helperId}
                >
                  <p id={helperId} className="ie-hint">
                    Spec level for materials and fit-out.
                  </p>
                  <div className="ie-option-list">
                    {FINISHES.map((finish) => (
                      <label key={finish} className="ie-option">
                        <input
                          type="radio"
                          name={`${uid}-finish`}
                          value={finish}
                          className="ie-option-input"
                          checked={selection.finish === finish}
                          onChange={() =>
                            setSelection((current) => ({ ...current, finish }))
                          }
                        />
                        <span className="ie-option-body ie-option-body--row">
                          <span className="ie-option-mark ie-option-mark--radio" />
                          <span className="ie-option-label">
                            {ESTIMATOR_FINISH_LABELS[finish]}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {step === LAST_STEP ? (
                <>
                  <dl className="ie-recap">
                    <div>
                      <dt>Work</dt>
                      <dd>
                        {selectedLabels.length
                          ? selectedLabels.join(", ")
                          : "Not selected"}
                      </dd>
                    </div>
                    <div>
                      <dt>Size</dt>
                      <dd>{ESTIMATOR_SIZE_LABELS[selection.size]}</dd>
                    </div>
                    <div>
                      <dt>Finish</dt>
                      <dd>{ESTIMATOR_FINISH_LABELS[selection.finish]}</dd>
                    </div>
                    {estimate?.total != null ? (
                      <div>
                        <dt>Estimated from</dt>
                        <dd>{formatPounds(estimate.total)}</dd>
                      </div>
                    ) : null}
                    {estimate?.weeks ? (
                      <div>
                        <dt>Time on site</dt>
                        <dd>{estimate.weeks}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {sent ? null : (
                    <fieldset
                      className="ie-options"
                      aria-labelledby={startLabelId}
                    >
                      <p id={startLabelId} className="ie-question">
                        When would you like to start?{" "}
                        <span className="ie-optional">(optional)</span>
                      </p>
                      <div className="ie-option-grid">
                        {ESTIMATOR_START_OPTIONS.map((option) => (
                          <label key={option} className="ie-option">
                            <input
                              type="radio"
                              name={`${uid}-start`}
                              value={option}
                              className="ie-option-input"
                              checked={startWhen === option}
                              onChange={() => chooseStart(option)}
                            />
                            <span className="ie-option-body ie-option-body--row ie-option-body--compact">
                              <span className="ie-option-mark ie-option-mark--radio" />
                              <span className="ie-option-label">{option}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </>
              ) : null}
            </div>

            {/* Kept mounted so typed details and the human check survive Back and Next. */}
            <div
              hidden={step !== LAST_STEP}
              className={
                step === LAST_STEP && direction ? stepClassName : undefined
              }
            >
              <div className="ie-booking">
                <EstimatorBooking
                  embedded
                  getEstimate={() => estimateRef.current}
                  getExtraLines={() =>
                    startWhenRef.current
                      ? [`When would you like to start: ${startWhenRef.current}`]
                      : []
                  }
                  onSent={() => {
                    headingFocusPending.current = true;
                    setSent(true);
                  }}
                />
              </div>
              {sent ? null : (
                <p className="ie-note">
                  Prefer to talk it through?{" "}
                  <Link
                    href="/contact"
                    className="text-accent underline underline-offset-2 hover:text-ink"
                  >
                    Send an enquiry
                  </Link>
                  .
                </p>
              )}
            </div>

            {sent && step === LAST_STEP ? null : (
              <div className="ie-nav">
                {step > 0 ? (
                  <button
                    type="button"
                    className="ie-btn-back"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {step < LAST_STEP ? (
                  <div className="ie-next-wrap">
                    {step === 0 && !canContinue ? (
                      <p id={nextHelperId} className="ie-next-helper">
                        Pick at least one to continue.
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="ie-btn-next"
                      onClick={handleNext}
                      aria-disabled={step === 0 && !canContinue}
                      aria-describedby={
                        step === 0 && !canContinue ? nextHelperId : undefined
                      }
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <p className="ie-guide">
              Figures are interactive estimates for scoping a conversation, not
              a fixed quote.
            </p>

            <p className="ie-sr-only" aria-live="polite">
              {estimate?.total != null
                ? `Estimated from ${formatPounds(estimate.total)}. Time on site ${estimate.weeks}.`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
