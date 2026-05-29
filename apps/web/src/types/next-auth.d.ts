import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** GitHub username (login). Captured from the OAuth profile so the UI
       *  can display the @handle distinctly from the full display name. */
      login?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    login?: string;
  }
}
