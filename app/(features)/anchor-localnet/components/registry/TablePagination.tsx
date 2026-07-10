'use client';

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

interface TablePaginationProps {
  page: number; // zero-based
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

/**
 * Terminal-styled pager for the registry tables. Purely client-side: the parent
 * holds the full decoded list and slices `page * pageSize` — we only render the
 * current window so the DOM never holds tens of thousands of rows.
 */
export function TablePagination({ page, pageSize, totalItems, onPageChange }: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const clamped = Math.min(page, pageCount - 1);
  const from = totalItems === 0 ? 0 : clamped * pageSize + 1;
  const to = Math.min((clamped + 1) * pageSize, totalItems);

  const btn =
    'flex h-7 w-7 items-center justify-center border border-[#2a2a2a] bg-[#0a0a0a] text-[#9945FF] transition-colors hover:bg-[#9945FF]/10 disabled:cursor-not-allowed disabled:text-[#333] disabled:hover:bg-[#0a0a0a]';

  return (
    <div className="flex items-center justify-between border-t border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
      <span className="font-mono text-[9px] uppercase tracking-wider text-[#666]">
        {from}–{to} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button className={btn} onClick={() => onPageChange(0)} disabled={clamped === 0} aria-label="First page">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn}
          onClick={() => onPageChange(clamped - 1)}
          disabled={clamped === 0}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 font-mono text-[9px] uppercase tracking-wider text-[#888]">
          Page <span className={cn('font-bold text-[#9945FF]')}>{clamped + 1}</span> / {pageCount}
        </span>
        <button
          className={btn}
          onClick={() => onPageChange(clamped + 1)}
          disabled={clamped >= pageCount - 1}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          className={btn}
          onClick={() => onPageChange(pageCount - 1)}
          disabled={clamped >= pageCount - 1}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
