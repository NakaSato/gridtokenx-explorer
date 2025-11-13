'use client';

import { LoadingCard } from '@components/common/LoadingCard';
import { ComponentProps, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { IdlCard } from '@/app/components/account/idl/IdlCard';
import { ErrorCard } from '@/app/components/common/ErrorCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function PageRenderer({
    address,
    renderComponent: RenderComponent,
}: {
    address: string;
    renderComponent: React.ComponentType<ComponentProps<typeof IdlRenderComponent>>;
}) {
    return (
        <ErrorBoundary
            fallbackRender={({ error }) => <ErrorCard text={`Failed to load: ${error.message}`} />}
        >
            <RenderComponent address={address} />
        </ErrorBoundary>
    );
}

export default function IdlPageClient({ params: { address } }: Props) {
    return <PageRenderer address={address} renderComponent={IdlRenderComponent} />;
}

function IdlRenderComponent({ address }: { address: string }) {
    return (
        <Suspense fallback={<LoadingCard message="Loading program IDL" />}>
            <IdlCard programId={address} />
        </Suspense>
    );
}
