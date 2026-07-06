import Link from "next/link";
import {
  ARCHITECT_RUNNER_VERSION,
  MACHINE_STATUSES
} from "@architect-runner/shared";
import { getAppConfig } from "../lib/env";

export default function HomePage() {
  const config = getAppConfig();

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Phase 0</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              {config.appName}
            </h1>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            href="/dashboard"
          >
            Open dashboard
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-base font-semibold text-white">Web app</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Next.js App Router, TypeScript, and Tailwind CSS are installed.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-base font-semibold text-white">Runner</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              CLI placeholder version {ARCHITECT_RUNNER_VERSION} is available.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-base font-semibold text-white">Shared package</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Machine statuses: {MACHINE_STATUSES.join(", ")}.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950 p-5">
          <h2 className="text-base font-semibold text-white">Environment</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">App URL</dt>
              <dd className="mt-1 font-mono text-slate-200">{config.appUrl}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Environment</dt>
              <dd className="mt-1 font-mono text-slate-200">
                {config.architectEnv}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Supabase</dt>
              <dd className="mt-1 font-mono text-slate-200">
                {config.supabaseConfigured ? "configured" : "not configured"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
