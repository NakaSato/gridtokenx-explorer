import { AccountHeader } from '@components/account/AccountHeader';
import { TokenMarketData } from '@components/common/TokenMarketData';
import { ComponentProps } from 'react';

import { useCoinGecko } from '@/app/utils/coingecko';

type HeaderProps = ComponentProps<typeof AccountHeader>;

export function Header({ address, account, tokenInfo, isTokenInfoLoading }: HeaderProps) {
    const coinInfo = useCoinGecko(tokenInfo?.extensions?.coingeckoId);

    return (
        <div className="header">
            <div className="header-body flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-1">
                <AccountHeader
                    address={address}
                    account={account}
                    tokenInfo={tokenInfo}
                    isTokenInfoLoading={isTokenInfoLoading}
                />
                <TokenMarketData tokenInfo={tokenInfo} coinInfo={coinInfo} />
            </div>
        </div>
    );
}
