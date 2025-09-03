import { useState } from 'react';

/**
 * Manages a set of expanded node identifiers. When the user clicks on a node,
 * its id toggles in or out of the set. This hook returns both the set and
 * a toggle function. Consumers should not mutate the set directly.
 */
export function useToggleSet(initial: string[] = []) {
  const [set, setSet] = useState<Set<string>>(() => new Set(initial));
  const toggle = (id: string) => {
    setSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  return { expanded: set, toggle };
}