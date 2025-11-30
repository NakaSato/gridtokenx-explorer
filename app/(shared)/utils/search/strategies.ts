import { Cluster } from '../cluster';
import { FeatureInfoType } from '../feature-gate/types';
import FEATURES from '../feature-gate/featureGates.json';
import { LOADER_IDS, LoaderName, PROGRAM_INFO_BY_ID, SPECIAL_IDS, SYSVAR_IDS } from '../programs';
import { SearchElement, SearchOptions } from './types';
import { searchTokens } from '../token-search';
import bs58 from 'bs58';
import { decodeTransactionFromBase64, isValidBase64 } from '../tx-decoding';
import { FetchedDomainInfo } from '@/app/api/domain-info/[domain]/route';

export function buildProgramOptions(search: string, cluster: Cluster): SearchOptions | undefined {
  const matchedPrograms = Object.entries(PROGRAM_INFO_BY_ID).filter(([address, { name, deployments }]) => {
    if (!deployments.includes(cluster)) return false;
    return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
  });

  if (matchedPrograms.length > 0) {
    return {
      label: 'Programs',
      options: matchedPrograms.map(([address, { name }]) => ({
        label: name,
        pathname: '/address/' + address,
        value: [name, address],
      })),
    };
  }
}

const SEARCHABLE_LOADERS: LoaderName[] = ['BPF Loader', 'BPF Loader 2', 'BPF Upgradeable Loader'];

export function buildLoaderOptions(search: string): SearchOptions | undefined {
  const matchedLoaders = Object.entries(LOADER_IDS).filter(([address, name]) => {
    return (
      SEARCHABLE_LOADERS.includes(name) &&
      (name.toLowerCase().includes(search.toLowerCase()) || address.includes(search))
    );
  });

  if (matchedLoaders.length > 0) {
    return {
      label: 'Program Loaders',
      options: matchedLoaders.map(([id, name]) => ({
        label: name,
        pathname: '/address/' + id,
        value: [name, id],
      })),
    };
  }
}

export function buildSysvarOptions(search: string): SearchOptions | undefined {
  const matchedSysvars = Object.entries(SYSVAR_IDS).filter(([address, name]) => {
    return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
  });

  if (matchedSysvars.length > 0) {
    return {
      label: 'Sysvars',
      options: matchedSysvars.map(([id, name]) => ({
        label: name,
        pathname: '/address/' + id,
        value: [name, id],
      })),
    };
  }
}

export function buildSpecialOptions(search: string): SearchOptions | undefined {
  const matchedSpecialIds = Object.entries(SPECIAL_IDS).filter(([address, name]) => {
    return name.toLowerCase().includes(search.toLowerCase()) || address.includes(search);
  });

  if (matchedSpecialIds.length > 0) {
    return {
      label: 'Accounts',
      options: matchedSpecialIds.map(([id, name]) => ({
        label: name,
        pathname: '/address/' + id,
        value: [name, id],
      })),
    };
  }
}

export async function buildTokenOptions(search: string, cluster: Cluster): Promise<SearchOptions | undefined> {
  const matchedTokens = await searchTokens(search, cluster);

  if (matchedTokens.length > 0) {
    return {
      label: 'Tokens',
      options: matchedTokens,
    };
  }
}

export async function buildDomainOptions(search: string): Promise<SearchOptions[] | undefined> {
  const domainInfoResponse = await fetch(`/api/domain-info/${search}`);
  const domainInfo = (await domainInfoResponse.json()) as FetchedDomainInfo;

  if (domainInfo && domainInfo.owner && domainInfo.address) {
    return [
      {
        label: 'Domain Owner',
        options: [
          {
            label: domainInfo.owner,
            pathname: '/address/' + domainInfo.owner,
            value: [search],
          },
        ],
      },
      {
        label: 'Name Service Account',
        options: [
          {
            label: search,
            pathname: '/address/' + domainInfo.address,
            value: [search],
          },
        ],
      },
    ];
  }
}

export function buildFeatureGateOptions(search: string): SearchOptions | undefined {
  let features: FeatureInfoType[] = [];
  if (search) {
    features = (FEATURES as FeatureInfoType[]).filter(feature =>
      feature.title.toUpperCase().includes(search.toUpperCase()),
    );
  }

  if (features.length > 0) {
    return {
      label: 'Feature Gates',
      options: features.map(feature => ({
        label: feature.title,
        pathname: '/address/' + feature.key,
        value: [feature.key || ''],
      })),
    };
  }
}

export function buildLocalOptions(rawSearch: string, cluster: Cluster, currentEpoch?: bigint): SearchOptions[] {
  const search = rawSearch.trim();
  if (search.length === 0) return [];

  const options: SearchOptions[] = [];

  const programOptions = buildProgramOptions(search, cluster);
  if (programOptions) {
    options.push(programOptions);
  }

  const loaderOptions = buildLoaderOptions(search);
  if (loaderOptions) {
    options.push(loaderOptions);
  }

  const sysvarOptions = buildSysvarOptions(search);
  if (sysvarOptions) {
    options.push(sysvarOptions);
  }

  const specialOptions = buildSpecialOptions(search);
  if (specialOptions) {
    options.push(specialOptions);
  }

  const featureOptions = buildFeatureGateOptions(search);
  if (featureOptions) {
    options.push(featureOptions);
  }

  if (!isNaN(Number(search))) {
    options.push({
      label: 'Block',
      options: [
        {
          label: `Slot #${search}`,
          pathname: `/block/${search}`,
          value: [search],
        },
      ],
    });

    // Parse as BigInt but not if it starts eg 0x or 0b
    if (currentEpoch !== undefined && !/^0\w/.test(search) && BigInt(search) <= currentEpoch + 1n) {
      options.push({
        label: 'Epoch',
        options: [
          {
            label: `Epoch #${search}`,
            pathname: `/epoch/${search}`,
            value: [search],
          },
        ],
      });
    }
  }

  // Prefer nice suggestions over raw suggestions
  if (options.length > 0) return options;

  try {
    const decoded = bs58.decode(search);
    if (decoded.length === 32) {
      options.push({
        label: 'Account',
        options: [
          {
            label: search,
            pathname: '/address/' + search,
            value: [search],
          },
        ],
      });
    } else if (decoded.length === 64) {
      options.push({
        label: 'Transaction',
        options: [
          {
            label: search,
            pathname: '/tx/' + search,
            value: [search],
          },
        ],
      });
    }
  } catch (err) {
    // If bs58 decoding fails, check if it's a valid base64 string
    if (isValidBase64(search)) {
      const decodedTx = decodeTransactionFromBase64(search);
      if (decodedTx) {
        const pathname = '/tx/inspector';
        const searchParams = new URLSearchParams();

        searchParams.set('message', encodeURIComponent(decodedTx.message));

        if (decodedTx.signatures) {
          searchParams.set('signatures', encodeURIComponent(JSON.stringify(decodedTx.signatures)));
        }

        options.push({
          label: 'Transaction Inspector',
          options: [
            {
              label: 'Inspect Decoded Transaction',
              pathname: `${pathname}?${searchParams.toString()}`,
              value: [search],
            },
          ],
        });
      }
    }
  }

  return options;
}

export function buildAppendableSearchOptions(
  searchOptions: PromiseSettledResult<SearchOptions | SearchOptions[] | undefined> | undefined,
  name: string,
): SearchOptions[] {
  if (!searchOptions) return [];
  if (searchOptions.status === 'rejected') {
    console.error(`Failed to build ${name} options for search: ${searchOptions.reason}`);
    return [];
  }
  return searchOptions.value ? (Array.isArray(searchOptions.value) ? searchOptions.value : [searchOptions.value]) : [];
}
