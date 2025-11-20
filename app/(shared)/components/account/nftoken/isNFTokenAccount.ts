export function isNFTokenAccount(data: any): boolean {
  // Placeholder implementation
  return data && typeof data === 'object';
}

export function parseNFTokenCollectionAccount(data: any): any {
  // Placeholder implementation - would need actual NFToken collection parsing logic
  return {
    isCollection: true,
    name: data?.name || 'Unknown Collection',
    uri: data?.uri || '',
    data: data,
  };
}
