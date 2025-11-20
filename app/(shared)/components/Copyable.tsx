import React, { useState } from 'react';

interface CopyableProps {
  text: string;
  replaceText?: boolean;
  children?: React.ReactNode;
}

export function Copyable({ text, replaceText = false, children }: CopyableProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <span
      onClick={handleCopy}
      style={{ cursor: 'pointer', position: 'relative' }}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {children || text}
    </span>
  );
}
