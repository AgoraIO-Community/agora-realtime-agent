import { registryCatalog } from '../registry-data';

export const runtime = 'nodejs';

export function GET() {
  return Response.json(registryCatalog);
}
