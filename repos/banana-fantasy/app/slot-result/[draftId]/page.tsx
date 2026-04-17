import Link from 'next/link';
import Image from 'next/image';

type SlotType = 'jackpot' | 'hof';

function normalizeType(raw: string | string[] | undefined): SlotType {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'hof' ? 'hof' : 'jackpot';
}

interface Display {
  headline: string;
  subheadline: string;
  imageSrc: string;
  imageAlt: string;
  accentColor: string;
  glowClass: string;
  goldFilter: boolean;
}

function displayFor(type: SlotType): Display {
  if (type === 'hof') {
    return {
      headline: 'HALL OF FAME',
      subheadline: 'Competing for bonus prizes on top of regular weekly and season rewards',
      imageSrc: '/hof-logo.jpg',
      imageAlt: 'Hall of Fame',
      accentColor: '#D4AF37',
      glowClass: 'glow-hof',
      goldFilter: true,
    };
  }
  return {
    headline: 'JACKPOT',
    subheadline: 'Win the league → skip straight to the finals',
    imageSrc: '/jackpot-logo.png',
    imageAlt: 'Jackpot',
    accentColor: '#ef4444',
    glowClass: 'glow-jackpot',
    goldFilter: false,
  };
}

export default function SlotResultPage({
  searchParams,
}: { params: { draftId: string }; searchParams: { type?: string } }) {
  const type = normalizeType(searchParams?.type);
  const display = displayFor(type);

  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      <div
        className={`glass-card ${display.glowClass} max-w-md w-full p-8 text-center space-y-6`}
        style={{ borderColor: `${display.accentColor}40` }}
      >
        <div className="flex justify-center">
          <Image
            src={display.imageSrc}
            alt={display.imageAlt}
            width={160}
            height={160}
            className={display.goldFilter ? 'hof-gold-filter' : ''}
          />
        </div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: display.accentColor }}
        >
          {display.headline}
        </h1>
        <p className="text-sm text-text-secondary">{display.subheadline}</p>
        <div className="pt-4 border-t border-bg-tertiary">
          <p className="text-xs text-text-muted mb-3">
            Want your shot at a JP or HOF draft?
          </p>
          <Link
            href="/banana-wheel"
            className="inline-block px-6 py-2.5 rounded-xl bg-banana text-black font-semibold hover:bg-banana/90 transition-colors"
          >
            Spin the Banana Wheel
          </Link>
        </div>
      </div>
    </main>
  );
}
