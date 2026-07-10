import React from 'react';

export function CompressedNftCard() {
  return <div>CompressedNftCard - To be implemented</div>;
}

// Last-resort account header used by AccountHeader when no more specific type
// (token mint, program, Metaplex/NFToken NFT) matched. Compressed-NFT detection
// needs a DAS/read API that isn't wired up here yet, so for now this renders the
// generic Account header. Typed loosely (`account` unused) until that lands.
export function CompressedNftAccountHeader(_props: { account: unknown }) {
  return (
    <div className="flex flex-col">
      <h6 className="header-pretitle">Details</h6>
      <h2 className="header-title">Account</h2>
    </div>
  );
}
