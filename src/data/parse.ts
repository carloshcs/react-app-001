import { NotionNode } from '../types';

/**
 * Builds lookup structures for a flat list of Notion nodes. Given an array
 * of nodes, this helper returns three structures:
 *  - a `byId` map for random access
 *  - a `children` multimap where each key is a parent id and the value is
 *    the array of its direct children
 *  - a `roots` array containing all top–level nodes (parent_id === null)
 *
 * These structures make it easy to traverse the hierarchy for rendering.
 */
export function parse(nodes: NotionNode[]): {
  byId: Map<string, NotionNode>;
  children: Map<string, NotionNode[]>;
  roots: NotionNode[];
} {
  const byId = new Map<string, NotionNode>();
  const children = new Map<string, NotionNode[]>();
  const roots: NotionNode[] = [];
  for (const node of nodes) {
    byId.set(node.id, node);
    if (node.parent_id) {
      const list = children.get(node.parent_id) ?? [];
      list.push(node);
      children.set(node.parent_id, list);
    } else {
      roots.push(node);
    }
  }
  return { byId, children, roots };
}