import 'server-only';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/server/db';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  //   plugins: [passkey()],
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
});
