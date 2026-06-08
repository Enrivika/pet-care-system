import React from 'react';

interface ScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

const Scrollbar: React.FC<ScrollbarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        overflow-auto
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-[#1F2421]/10
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-[#1F2421]
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-[#1F2421]/80
        [scrollbar-width:thin]
        [scrollbar-color:#1F2421_#1F24211a]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Scrollbar;
