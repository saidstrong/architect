import Link from "next/link";
import { ARCHITECT_RUNNER_VERSION } from "@architect-runner/shared";

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Phase 0 placeholder for the Architect Runner control center.
            </p>
          </div>
          <Link className="text-sm font-medium text-cyan-300" href="/">
            Home
          </Link>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-semibold text-white">Runner foundation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Shared package imports are working. Current runner version:{" "}
            <span className="font-mono text-cyan-200">
              {ARCHITECT_RUNNER_VERSION}
            </span>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
