/**
 * Core data structure representing a node in your Notion hierarchy. Each
 * node corresponds to a page, database, or row in the user's Notion space.
 */
export interface NotionNode {
  /**
   * Unique identifier for the node. IDs coming from Notion may include a
   * `db::` prefix or hyphens which should be stripped when building URLs.
   */
  id: string;
  /**
   * Human‑readable title of the node. This is displayed inside the circle.
   */
  title: string;
  /**
   * ID of the parent node. The root of the hierarchy has `null` as parent.
   */
  parent_id: string | null;
  /**
   * Optional kind of node (page, db, db_row, …). We leave this unused for
   * visualization purposes, but it can inform styling if needed later on.
   */
  kind?: string;
}