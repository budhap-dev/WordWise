/**
 * Browse keeps its query and filters in the URL (?q=…&cat=…), so Back from a word returns to
 * the same search, and a search can be shared or bookmarked.
 */
import { CATEGORIES, LEVELS, REGISTERS } from '../../data';
import { NO_FILTERS, type SearchFilters, type StatusFilter } from '../../lib/search';
import type { Category, Level, Register } from '../../types/content';

const STATUSES: readonly StatusFilter[] = ['all', 'new', 'learnt', 'due'];

function list<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));
}

export function readBrowseParams(params: URLSearchParams): {
  query: string;
  filters: SearchFilters;
} {
  const cat = params.get('cat');
  const status = params.get('status');
  return {
    query: params.get('q') ?? '',
    filters: {
      category: CATEGORIES.includes(cat as Category) ? (cat as Category) : 'all',
      status: STATUSES.includes(status as StatusFilter) ? (status as StatusFilter) : 'all',
      levels: list<Level>(params.get('level'), LEVELS),
      registers: list<Register>(params.get('register'), REGISTERS),
    },
  };
}

export function writeBrowseParams(query: string, filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (filters.category !== NO_FILTERS.category) params.set('cat', filters.category);
  if (filters.status !== NO_FILTERS.status) params.set('status', filters.status);
  if (filters.levels.length > 0) params.set('level', filters.levels.join(','));
  if (filters.registers.length > 0) params.set('register', filters.registers.join(','));
  return params;
}
