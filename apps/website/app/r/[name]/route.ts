import { registryCatalog } from '../registry-data';
import { registryItemPayload } from '../registry-payload';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  if (!name.endsWith('.json')) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const itemName = name.slice(0, -'.json'.length);
  const item = registryCatalog.items.find((candidate) => candidate.name === itemName);

  if (!item) {
    return Response.json({ error: `Registry item "${itemName}" was not found.` }, { status: 404 });
  }

  return Response.json(await registryItemPayload(item));
}
