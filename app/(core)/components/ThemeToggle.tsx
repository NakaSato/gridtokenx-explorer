'use client';

import { Button } from '@/app/(shared)/components/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/shared/ui/dropdown-menu';
import { useTheme } from '@providers/theme';
import React, { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: SunIcon,
      description: 'Always use light theme',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Always use dark theme',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: ComputerIcon,
      description: `Follow system preference (${resolvedTheme})`,
    },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];
  const Icon = currentTheme.icon;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="group relative transition-all duration-200 hover:scale-110"
        >
          <div className="relative">
            <Icon />
            <div className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">Theme</div>
        <DropdownMenuSeparator />
        {themes.map(t => {
          const ThemeIcon = t.icon;
          const isActive = theme === t.value;

          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => handleThemeChange(t.value)}
              className={`cursor-pointer transition-colors duration-200 ${
                isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
              }`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className={`rounded-md p-1 ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                  <ThemeIcon />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{t.label}</div>
                  <div className="text-muted-foreground text-xs">{t.description}</div>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="bg-primary h-2 w-2 rounded-full"></div>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function ComputerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
