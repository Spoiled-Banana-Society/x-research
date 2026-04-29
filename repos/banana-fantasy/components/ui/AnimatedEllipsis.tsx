'use client';

/**
 * Three bouncing/fading dots used as a "loading" indicator wherever the
 * UI is showing an in-flight Chainlink VRF state. Keep visually
 * consistent across BatchProofBanner, BatchRandomnessLoading, and the
 * proof page status row so users learn the pattern: "dots = working".
 */
export function AnimatedEllipsis({ className = '' }: { className?: string }) {
  return (
    <>
      <style jsx>{`
        @keyframes vrfDot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        .vrf-dot {
          display: inline-block;
          animation: vrfDot 1.2s ease-in-out infinite both;
        }
      `}</style>
      <span aria-hidden className={`inline-flex ml-1 gap-[1px] ${className}`}>
        <span className="vrf-dot" style={{ animationDelay: '0ms' }}>.</span>
        <span className="vrf-dot" style={{ animationDelay: '160ms' }}>.</span>
        <span className="vrf-dot" style={{ animationDelay: '320ms' }}>.</span>
      </span>
    </>
  );
}
