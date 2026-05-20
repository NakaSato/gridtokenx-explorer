import classNames from 'classnames';
import { ExternalLink } from 'react-feather';

import type { SecurityTxtVersion } from './types';
import { isValidLink, parseCodeValue } from './utils';

export function CodeCell({ value, alignRight = true }: { value: string; alignRight: boolean }) {
  return (
    <td className={classNames({ 'lg:text-right': alignRight })}>
      <RenderCode value={value} />
    </td>
  );
}

export function SecurityTxtVersionBadge({
  version,
  className,
}: React.HTMLAttributes<unknown> & { version: SecurityTxtVersion }) {
  return (
    <span
      className={classNames([
        'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800',
        className,
      ])}
      data-testid="security-txt-version-badge"
    >
      <SecurityTxtVersionBadgeTitle version={version} />
    </span>
  );
}

export function SecurityTxtVersionBadgeTitle({ version }: { version: SecurityTxtVersion }) {
  if (version === 'neodyme') {
    return <>Neodyme</>;
  }
  if (version === 'pmp') {
    return <>Program Metadata</>;
  }

  return null;
}

export function ContactInfo({ type, information }: { type: string; information: string }) {
  switch (type.toLowerCase()) {
    case 'discord':
      return <>Discord: {information}</>;
    case 'email':
      return (
        <a rel="noopener noreferrer" target="_blank" href={`mailto:${information}`}>
          {information}
          <ExternalLink className="ms-2 align-text-top" size={13} />
        </a>
      );
    case 'telegram':
      return (
        <a rel="noopener noreferrer" target="_blank" href={`https://t.me/${information}`}>
          Telegram: {information}
          <ExternalLink className="ms-2 align-text-top" size={13} />
        </a>
      );
    case 'twitter':
      return (
        <a rel="noopener noreferrer" target="_blank" href={`https://twitter.com/${information}`}>
          Twitter {information}
          <ExternalLink className="ms-2 align-text-top" size={13} />
        </a>
      );
    case 'link':
      if (isValidLink(information)) {
        return (
          <a rel="noopener noreferrer" target="_blank" href={`${information}`}>
            {information}
            <ExternalLink className="ms-2 align-text-top" size={13} />
          </a>
        );
      }
      return <>{information}</>;
    case 'other':
    default:
      return (
        <>
          {type}: {information}
        </>
      );
  }
}

export function RenderExternalLink({ url }: { url: string }) {
  return (
    <span className="font-mono">
      <a rel="noopener noreferrer" target="_blank" href={url}>
        {url}
        <ExternalLink className="ms-2 align-text-top" size={13} />
      </a>
    </span>
  );
}

export function ExternalLinkCell({ url }: { url: string }) {
  return (
    <td className="lg:text-right">
      <RenderExternalLink url={url} />
    </td>
  );
}

export function StringCell({ value }: { value: string }) {
  return <td className="font-mono lg:text-right">{value}</td>;
}

export function RenderCode({ value }: { value: any }) {
  return (
    <div className="d-flex items-end">
      <pre className="max-w-[500px] overflow-x-auto lg:ml-auto">{parseCodeValue(value)}</pre>
    </div>
  );
}
