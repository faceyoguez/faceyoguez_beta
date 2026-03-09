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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {title}{' '}
          {highlight && (
            <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm font-medium text-gray-500">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-gray-500 shadow-sm ring-1 ring-pink-100/50 transition-all hover:bg-white hover:text-pink-500">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500" />
        </button>
      </div>
    </header>
  );
}
