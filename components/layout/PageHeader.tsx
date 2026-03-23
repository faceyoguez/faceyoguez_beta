'use client';

import { Bell } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  highlight?: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, highlight, description, children }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}{' '}
          {highlight && (
            <span className="text-primary italic font-serif">
              {highlight}
            </span>
          )}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm font-medium text-foreground/40 italic">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-foreground/40 shadow-sm border border-primary/5 transition-all hover:bg-white hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
        </button>
      </div>
    </header>
  );
}
