export interface FilterOption {
  id: string;
  label: string;
}

export const PRICE_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under100', label: '< $100' },
  { id: '100-200', label: '$100 - $200' },
  { id: 'above200', label: '> $200' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { id: 'recommended', label: 'Popular' },
  { id: 'price_asc', label: 'Price: Low-High' },
  { id: 'price_desc', label: 'Price: High-Low' },
];
