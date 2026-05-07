import { Compass, Sparkles } from 'lucide-react'

const quickRules = ['Upload files or paste text on the right.', 'Ask naturally. Add context only when needed.', 'Press Enter to send. Shift+Enter for a new line.']

export function InstructionRail() {
  return (
    <aside className="hidden min-h-screen border-r border-white/10 bg-[#0f1115] lg:flex lg:w-[250px] lg:flex-col">
      <div className="flex-1 px-6 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          <Sparkles className="h-3.5 w-3.5" />
          Notes
        </div>

        <h1 className="mt-5 font-['Manrope',_ui-sans-serif,_system-ui] text-2xl font-semibold tracking-tight text-white">
          Sasta NotebookLm
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Simple notebook chat with optional context grounding.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#161a20] p-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Compass className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">How To Use</p>
          </div>
          <div className="mt-3 space-y-2">
            {quickRules.map((rule) => (
              <p key={rule} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm leading-6 text-slate-300">
                {rule}
              </p>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}
