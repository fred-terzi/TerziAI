/**
 * Page types and navigation utilities
 */

export type PageType = 'home' | 'chat' | 'dashboard';

export interface NavigationState {
  currentPage: PageType;
}

/**
 * Navigate to a specific page
 */
export function navigateTo(page: PageType, setState: (state: NavigationState) => void): void {
  setState({ currentPage: page });
}
