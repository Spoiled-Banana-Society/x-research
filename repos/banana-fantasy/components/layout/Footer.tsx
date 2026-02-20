import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-bg-tertiary py-4 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-8 lg:px-12">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} Spoiled Banana Society. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            Terms
          </Link>
          <Link href="/faq" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            FAQ
          </Link>
          <a
            href="https://discord.gg/spoiledbanana"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
