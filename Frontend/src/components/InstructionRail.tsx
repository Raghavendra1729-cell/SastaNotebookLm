import { HelpCircle, Info, Layout } from 'lucide-react'
import { motion } from 'framer-motion'

const guidelines = [
  'Upload PDF or TXT files to provide context.',
  'Ask questions based on your specific documents.',
  'Use the clear interface to read long answers.'
]

export function InstructionRail() {
  return (
    <aside className="hidden h-full border-r border-white/5 bg-black/20 backdrop-blur-3xl lg:flex lg:w-[260px] lg:flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar relative">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-['Manrope'] text-lg font-black tracking-tighter text-white">
              Sasta <span className="text-blue-500">LLM</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Interface v2.1</p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-2 px-2 mb-4">
              <Info className="h-4 w-4 text-blue-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Purpose
              </h3>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
              <p className="text-[13px] leading-relaxed text-slate-400 font-medium">
                A focused research environment built for reading, understanding, and synthesizing complex information.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 px-2 mb-4">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Guidelines
              </h3>
            </div>
            <div className="space-y-4">
              {guidelines.map((rule, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:bg-white/[0.03]"
                >
                  <div className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400">
                      {index + 1}
                    </span>
                    <p className="text-[12px] leading-relaxed text-slate-300 font-medium">
                      {rule}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 p-6 border-t border-white/5">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">System Active</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
