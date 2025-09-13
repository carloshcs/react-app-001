export function parseNotion(data: any) {
  const nodes = data.nodes.map((n: any) => ({
    id: n.id,
    title: n.title,
    parent: n.parent_id,
    kind: n.kind,
  }));

  const links = data.nodes
    .filter((n: any) => n.parent_id)
    .map((n: any) => ({
      source: n.parent_id,
      target: n.id,
      distance: 120,
    }));

  return { nodes, links };
}

export function parseDrive(data: any) {
  const nodes = data.nodes.map((n: any) => ({
    id: n.id,
    title: n.title,
    parent: n.parent_id,
    type: n.type,
    link: n.link,
  }));

  const links = data.nodes
    .filter((n: any) => n.parent_id)
    .map((n: any) => ({
      source: n.parent_id,
      target: n.id,
      distance: 120,
    }));

  return { nodes, links };
}
