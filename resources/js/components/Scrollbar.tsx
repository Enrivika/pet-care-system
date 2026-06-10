import React, { useRef, useState, useEffect } from 'react';

interface ScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

const Scrollbar: React.FC<ScrollbarProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScrollable = () => {
    const el = containerRef.current;
    if (!el) return;
    const verticallyScrollable = el.scrollHeight > el.clientHeight + 1;
    const horizontallyScrollable = el.scrollWidth > el.clientWidth + 1;
    setIsScrollable(verticallyScrollable || horizontallyScrollable);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollable();

    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
    });
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      checkScrollable();
    });
    mutationObserver.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });

    window.addEventListener('resize', checkScrollable);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  const scrollbarStyles = isScrollable
    ? `
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-[#1F2421]/10
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-[#1F2421]
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:hover:bg-[#1F2421]/80
      [scrollbar-width:thin]
      [scrollbar-color:#1F2421_#1F24211a]
    `
    : '';

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${scrollbarStyles} ${className}`}
    >
      {children}
    </div>
  );
};

export default Scrollbar;
