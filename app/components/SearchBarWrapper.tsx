'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const SearchBar = dynamic(() => import('./SearchBar'));

export default function SearchBarWrapper() {
    return <SearchBar />;
}
