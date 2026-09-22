import Link from "next/link";

const SCHEMA = [
  { k: "t_out", d: "outdoor temperature", lo: "-8", hi: "38 °C" },
  { k: "GHI", d: "solar irradiance", lo: "0", hi: "1000 W/m²" },
  { k: "α_sun", d: "solar elevation", lo: "0", hi: "80°" },
  { k: "n_occ", d: "occupancy", lo: "0", hi: "1" },
  { k: "T_set", d: "thermal setpoint", lo: "18", hi: "26 °C" },
  { k: "d", d: "blind deployment", lo: "0", hi: "1" },
  { k: "φ", d: "slat angle", lo: "0", hi: "90°" },
  { k: "v", d: "vent opening", lo: "0", hi: "1" },
];

const OUTPUTS = [
  { k: "E", d: "work-plane illuminance", unit: "lux" },
  { k: "DGP", d: "daylight glare probability", unit: "0–1" },
  { k: "PMV", d: "predicted mean vote", unit: "-3–+3" },
  { k: "E_hvac", d: "HVAC energy demand", unit: "W" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            ◫ ClimaFaçade
          </Link>
          <Link
            href="/"
            className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-900/80"
          >
            ← Back to demo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-10">
        <section>
          <h1 className="text-4xl font-semibold tracking-tight">
            How it works — machine learning for adaptive building façades
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Dynamic shading façades must reconcile competing objectives — daylight, glare,
            thermal comfort and energy — while responding to what the occupant actually wants.
            Full building-performance simulation (BPS) is far too slow for real-time control.
            This demonstrator implements the complete pipeline proposed in the research: generate
            labelled data from a physics-based simulator, train a deep-learning surrogate on that
            data, deploy the surrogate inside a model-predictive controller (MPC), and let live
            sensor feedback close the loop — including when the occupant overrides the baseline.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">1 · The problem and the physics</h2>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            The test case is a single east-facing office module in Wellington, NZ (41.3° S),
            simulated for a summer midday: an 8 m² glazed façade facing a 40 m² floor plate,
            natural cross-ventilation driven by stack effect, and a capacity-limited HVAC plant
            (4.5 kW) with separate heating and cooling coils. The shading configuration has three
            actuators — blind deployment, slat angle, and vent opening — whose non-linear combined
            effects on daylight, glare, comfort and energy cannot be captured by simple rules.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">2 · Generate simulation data</h2>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            A fast reference simulator encodes the governing physics: solar position and
            irradiance from Wellington&apos;s latitude and the time of day, glass and blind
            transmittance, solar gain, stack-effect ventilation, and the HVAC plant. Random
            sampling across the full operating envelope — environmental conditions and façade
            configurations alike — produces thousands of labelled scenarios, the stand-in for the
            building-performance simulation and multi-objective optimisation studies described in
            the research programme.
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 font-medium">input</th>
                  <th className="px-4 py-2 font-medium">meaning</th>
                  <th className="px-4 py-2 font-medium">range</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {SCHEMA.map((r) => (
                  <tr key={r.k} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-1.5 font-semibold text-sky-600 dark:text-sky-400">
                      {r.k}
                    </td>
                    <td className="px-4 py-1.5 text-zinc-600">{r.d}</td>
                    <td className="px-4 py-1.5 text-zinc-500">
                      {r.lo} … {r.hi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-500">
            Eight inputs — five that describe the operating state, three that describe the façade
            configuration — map to four performance targets: illuminance, daylight-glare
            probability, thermal comfort (PMV), and HVAC energy demand.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">3 · Train a surrogate</h2>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            A two-hidden-layer feedforward network (48 + 48 units, ReLU) learns the simulation
            mapping end-to-end. Inputs are standardised before training; the network is fitted
            with Adam on 80% of the scenarios and evaluated on the held-out 20%. The loss curves
            and parity plot on the dashboard are computed against that held-out set, so the
            reported performance measures generalisation to unseen operating conditions rather
            than memorisation of the training data.
          </p>
          <div className="flex flex-wrap gap-2">
            {OUTPUTS.map((o) => (
              <div
                key={o.k}
                className="rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {o.k}
                </span>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {o.d} · {o.unit}
                </div>
              </div>
            ))}
          </div>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Once fitted, the weights are serialised to a portable JSON format and executed by a
            small hand-rolled inference routine — no deep-learning runtime required at deployment
            time. A single façade evaluation costs on the order of microseconds, which is what
            makes real-time re-optimisation feasible.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">4 · Closed-loop MPC</h2>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            The surrogate makes online optimisation tractable. Every control step, the controller
            scores the feasible grid of configurations — 5 blind settings × 4 slat angles × 3 vent
            openings = 60 candidates — and selects the one minimising a weighted multi-objective
            cost:
          </p>
          <div className="rounded-xl border border-zinc-200 p-4 font-mono text-[13px] dark:border-zinc-800">
            <p className="text-zinc-500">cost(x) =</p>
            <p className="mt-1">
              <span className="text-sky-600 dark:text-sky-400">1.0</span> · daylight deficit +{" "}
              <span className="text-sky-600 dark:text-sky-400">1.4</span> · glare exceedance +{" "}
              <span className="text-sky-600 dark:text-sky-400">1.2</span> · thermal violation
            </p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
              + <span className="text-sky-600 dark:text-sky-400">w_e</span> · energy +{" "}
              <span className="text-sky-600 dark:text-sky-400">0.14</span> · switching penalty
            </p>
            <p className="mt-1 text-zinc-500">w_e scales with the occupant&apos;s energy priority (0.7–2.3)</p>
          </div>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            The switching penalty rejects chattering between configurations and promotes robust,
            reachable actuation. Simulated sensor readings close the loop: each decision is taken
            against fresh observations of the operating state, the chosen configuration is applied,
            and the realised response is recorded as telemetry. Because each surrogate call is
            sub-millisecond, the full re-optimisation — the same principle behind a receding-horizon
            controller at scale — happens in real time, without a complete online simulation or
            optimisation run at every step.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">5 · Occupant agency and recovery</h2>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            This is the part that most directly mirrors the research focus on responsive control.
            When the occupant expresses a desire for a different environmental state — more light,
            less glare, warmer or cooler conditions, or a stronger energy-efficiency priority — the
            request reshapes the objective function for the next-best action. The controller then
            picks the feasible configuration that best honours the expressed preference.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 py-2 text-[13px]">
            <span className="rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900">occupant asks &ldquo;brighter&rdquo;</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              controller opens shades, slats tilt
            </span>
            <span className="text-zinc-500">→</span>
            <span className="rounded-lg bg-emerald-100 px-3 py-2 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
              daylight target met → returns to baseline
            </span>
          </div>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Once the preference is satisfied, its weight decays and the controller guides the
            façade back toward the energy-efficient operating baseline — the &ldquo;override and
            recover&rdquo; behaviour targeted in the research, achieved without requiring a
            complete online optimisation process at every step.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">6 · Evaluation and robustness</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>
              The surrogate is judged on held-out data via R² and mean absolute error — the
              metrics shown on the dashboard — which quantify generalisation to previously unseen
              operating conditions.
            </li>
            <li>
              The parity plot visually checks spread vs bias across the prediction range; the loss
              curves expose overfitting if training and validation curves diverge.
            </li>
            <li>
              Computational efficiency is measured directly: the model&apos;s evaluation time (µs)
              is reported on the dashboard as the binding constraint for real-time suitability.
            </li>
            <li>
              Independence from a heavyweight ML runtime (portable JSON weights + hand-rolled
              inference) supports deployment onto the lightweight edge hardware a physical façade
              system would use.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Limitations and next steps</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>
              The reference simulator is deliberately lightweight; production work would validate
              against high-fidelity BPS tools (thermal, daylight, CFD airflow) and multi-objective
              optimisation results from the research programme.
            </li>
            <li>
              MPC currently uses a static surrogate; online adaptation and Bayesian calibration to
              live sensor streams is a natural extension.
            </li>
            <li>
              The closed-loop search is a grid over feasible configurations; reinforcement-learning
              policies or mixed-integer optimisation could replace it as the action space grows.
            </li>
            <li>
              Uncertainty quantification (ensembles or MC-dropout) is an explicit next step, to make
              the control policy robust to surrogate error on low-data regions of the operating
              envelope.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}