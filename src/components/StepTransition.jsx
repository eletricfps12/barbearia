import { useEffect, useRef } from 'react';

/**
 * StepTransition Component
 * Provides smooth slide animations between booking steps
 */
export default function StepTransition({ children, step, direction = 'forward' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Scroll to top smoothly when step changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  return (
    <div
      ref={containerRef}
      className="step-transition"
      style={{
        animation: `slideIn${direction === 'forward' ? 'Right' : 'Left'} 280ms ease-in-out`
      }}
    >
      {children}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .step-transition {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
