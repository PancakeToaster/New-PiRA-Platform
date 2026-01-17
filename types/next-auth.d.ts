import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    roles: string[];
    permissions: { resource: string; action: string }[];
    profiles: {
      parent?: string;
      student?: string;
      teacher?: string;
    };
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      roles: string[];
      permissions: { resource: string; action: string }[];
      profiles: {
        parent?: string;
        student?: string;
        teacher?: string;
      };
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: string[];
    permissions: { resource: string; action: string }[];
    profiles: {
      parent?: string;
      student?: string;
      teacher?: string;
    };
  }
}
