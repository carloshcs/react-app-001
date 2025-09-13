import notionData from "./notion_data.json";
import driveData from "./drive_nodes.json";
import { parseNotion, parseDrive } from "./parse";

export function loadData() {
  const results: { nodes: any[]; links: any[] }[] = [];

  if (notionData && notionData.nodes) {
    results.push(parseNotion(notionData));
  }

  if (driveData && driveData.nodes) {
    results.push(parseDrive(driveData));
  }

  // merge both datasets if both exist
  const merged = {
    nodes: results.flatMap(r => r.nodes),
    links: results.flatMap(r => r.links),
  };

  return merged;
}
