export type SearchElement = {
  label: string;
  value: string[];
  pathname: string;
};

export interface SearchOptions {
  label: string;
  options: SearchElement[];
}
