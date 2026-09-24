import React from 'react';

interface MainContentProps {
  isSidebarCollapsed: boolean;
  children: React.ReactNode;
}

export function MainContent({ isSidebarCollapsed, children }: MainContentProps) {
  return (
    <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'} pt-16`}>
      <div className="ph-admin-body mx-auto w-full max-w-[1680px] px-3 sm:px-5 lg:px-8 py-5 sm:py-7">
        {children}
      </div>
    </main>
  );
}
