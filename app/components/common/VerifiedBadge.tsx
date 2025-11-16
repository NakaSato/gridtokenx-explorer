import { VerifiableBuild } from '@utils/program-verification';

export function VerifiedBadge({
  verifiableBuild,
  deploySlot,
}: {
  verifiableBuild: VerifiableBuild;
  deploySlot: number;
}) {
  if (verifiableBuild && verifiableBuild.verified_slot === deploySlot) {
    return (
      <h3 className="mb-0">
        <a
          className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
          href={verifiableBuild.url}
          target="_blank"
          rel="noreferrer"
        >
          {verifiableBuild.label}: Verified
        </a>
      </h3>
    );
  } else {
    return (
      <h3 className="mb-0">
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
          {verifiableBuild.label}: Unverified
        </span>
      </h3>
    );
  }
}

export function CheckingBadge() {
  return (
    <h3 className="mb-0">
      <span className="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-white">
        Checking
      </span>
    </h3>
  );
}
