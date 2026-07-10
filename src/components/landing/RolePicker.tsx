import { Link } from 'react-router-dom';
import { Search, PenLine, Building2, Video, ArrowRight } from 'lucide-react';

import imgRenter from '@/assets/landing/apt-tour-woman.jpg';
import imgResident from '@/assets/landing/apt-bath-leak.jpg';
import imgManager from '@/assets/landing/apt-exterior-highrise.jpg';
import imgCreator from '@/assets/landing/apt-lobby.jpg';

/**
 * Netflix "Who's watching?" style role picker. Four large cinematic tiles,
 * each routing to the matching signup / onboarding path. Cover photos
 * ken-burns subtly so tiles feel like short trailers instead of stills.
 */
type Role = {
  key: 'renter' | 'resident' | 'manager' | 'creator';
  title: string;
  tagline: string;
  bullets: string[];
  cta: string;
  href: string;
  cover: string;
  Icon: typeof Search;
  accent: string; // ring / glow color class
};

const ROLES: Role[] = [
  {
    key: 'renter',
    title: 'I\u2019m apartment hunting',
    tagline: 'See it before you sign.',
    bullets: ['Unfiltered resident videos', 'Truth Score on 11 categories', 'Compare buildings side by side'],
    cta: 'Start watching',
    href: '/auth?returnTo=%2Ffeed&role=renter',
    cover: imgRenter,
    Icon: Search,
    accent: 'from-primary/60 to-primary/0',
  },
  {
    key: 'resident',
    title: 'I live here (or did)',
    tagline: 'Blow the whistle. Warn the next tenant.',
    bullets: ['Post a 60-sec video review', 'Anonymous or verified', 'Managers can respond \u2014 never delete'],
    cta: 'Add my review',
    href: '/auth?returnTo=%2Fcontribute&role=resident',
    cover: imgResident,
    Icon: PenLine,
    accent: 'from-destructive/60 to-destructive/0',
  },
  {
    key: 'manager',
    title: 'I manage a property',
    tagline: 'Claim your building. Own the narrative.',
    bullets: ['Free verified badge', 'Reply to every review', 'Real-time review alerts'],
    cta: 'Claim my property',
    href: '/auth?returnTo=%2Fmanager&role=manager',
    cover: imgManager,
    Icon: Building2,
    accent: 'from-secondary/60 to-secondary/0',
  },
  {
    key: 'creator',
    title: 'I\u2019m a creator / influencer',
    tagline: 'Get your handle. Go viral.',
    bullets: ['Custom @handle + channel page', 'Claim videos we\u2019ve embedded', 'Shareable everywhere'],
    cta: 'Create my channel',
    href: '/auth?returnTo=%2Fcreator%2Fapply&role=creator',
    cover: imgCreator,
    Icon: Video,
    accent: 'from-primary/70 via-secondary/40 to-transparent',
  },
];

export const RolePicker = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-3 md:gap-4' : 'grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5'}>
      {ROLES.map((r) => (
        <RoleTile key={r.key} role={r} />
      ))}
    </div>
  );
};

const RoleTile = ({ role }: { role: Role }) => {
  const { Icon } = role;
  return (
    <Link
      to={role.href}
      className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-elevated transition-all duration-300 hover:-translate-y-1 hover:border-white/40"
    >
      <img
        src={role.cover}
        alt=""
        loading="lazy"
        className="ken-burns absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* cinematic wash */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
      <div className={`absolute inset-0 bg-gradient-to-tr ${role.accent} mix-blend-screen opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />

      {/* corner icon chip */}
      <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur ring-1 ring-white/20">
        <Icon className="h-4 w-4" />
      </div>

      {/* text */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {role.tagline}
        </p>
        <h3 className="mt-1 text-lg md:text-2xl font-bold leading-tight text-balance">
          {role.title}
        </h3>
        <ul className="mt-2 hidden md:block space-y-0.5 text-xs text-white/80">
          {role.bullets.map((b) => (
            <li key={b} className="flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/70" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white">
          {role.cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};