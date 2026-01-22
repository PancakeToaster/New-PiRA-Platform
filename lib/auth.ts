import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { TEST_ROLE_CONFIGS } from './permissions';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            parentProfile: true,
            studentProfile: true,
            teacherProfile: true,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isApproved) {
          throw new Error('Account pending approval');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Flatten permissions
        const permissions = user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
          }))
        );

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatar || undefined,
          roles: user.roles.map((ur) => ur.role.name),
          permissions,
          profiles: {
            parent: user.parentProfile?.id,
            student: user.studentProfile?.id,
            teacher: user.teacherProfile?.id,
          },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.profiles = user.profiles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.permissions = token.permissions as any;
        session.user.profiles = token.profiles as any;

        try {
          const cookieStore = cookies();
          const testModeRole = cookieStore.get('test-mode-role')?.value;

          if (testModeRole && (token.roles as string[]).includes('Admin')) {
            if (TEST_ROLE_CONFIGS[testModeRole]) {
              const testConfig = TEST_ROLE_CONFIGS[testModeRole];
              session.user.roles = testConfig.roles;
              session.user.permissions = testConfig.permissions.map(p => ({
                resource: p.resource,
                action: p.action
              }));
            } else {
              // Fallback if config not found but role exists (e.g. simple UI switch)
              session.user.roles = [testModeRole];
            }
            // @ts-ignore
            session.user.isTestMode = true;
            // @ts-ignore
            session.user.testRole = testModeRole;
          }
        } catch (e) {
          // Ignore cookie errors
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
