export interface LookupTableEntry {
  address: string;
  index: number;
}

export interface LookupTableData {
  entries: LookupTableEntry[];
  authority?: string;
  deactivationSlot?: number;
  lastExtendedSlot?: number;
}
