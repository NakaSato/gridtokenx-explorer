import { FeatureGateCard } from '@components/account/FeatureGateCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';

import { fetchFeatureGateInformation } from '@/app/features/feature-gate';
import { getFeatureInfo } from '@/app/utils/feature-gate/utils';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    cluster: string;
    customUrl?: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `Feature information for address ${address} on Solana`,
    title: `Feature Gate | ${address} | Solana`,
  };
}

export default async function FeatureGatePage(props: Props) {
  const { address } = await props.params;
  const feature = getFeatureInfo(address);
  const data = await fetchFeatureGateInformation(feature);

  return (
    <FeatureGateCard>
      <ReactMarkdown
        remarkPlugins={[remarkGFM, remarkFrontmatter]}
        components={{
          h2: ({ children }) => <h2 className="mt-5 mb-2 text-gray-300">{children}</h2>,
          li: ({ children }) => <li className="mb-1 text-gray-400">{children}</li>,
          p: ({ children }) => <p className="mt-0 mb-4 text-gray-400">{children}</p>,
          table: ({ children }) => <table className="tablsm table">{children}</table>,
        }}
      >
        {data[0]}
      </ReactMarkdown>
    </FeatureGateCard>
  );
}
