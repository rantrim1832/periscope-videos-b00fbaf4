import { RolePicker } from '@/components/landing/RolePicker';
import { Sparkles } from 'lucide-react';

/**
 * Netflix "Who's watching?" — full-bleed cinematic role picker.
 * Shown to new/returning visitors who need to pick their path.
 */
const Welcome = () => {
  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-black to-secondary/20" aria-hidden />
      <div className="container flex-1 flex flex-col justify-center py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Welcome to Periscope
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Who's watching?
          </h1>
          <p className="mt-3 text-white/70 md:text-lg">
            Pick your path — we'll take you straight to what you need. You can switch anytime.
          </p>
        </div>
        <div className="max-w-6xl mx-auto w-full">
          <RolePicker />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
