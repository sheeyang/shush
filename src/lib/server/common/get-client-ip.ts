import 'server-only';

import { headers } from 'next/headers';

export const getClientIp = async () => {
  const headersStore = await headers();
  return headersStore.get('x-forwarded-for');
};
