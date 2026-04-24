import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("---- AUTHORIZING USER:", credentials?.username);
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });
          
          console.log("---- FOUND USER?", !!user);

          const isValid = user ? await bcrypt.compare(credentials.password, user.password) : await bcrypt.compare(credentials.password, "$2b$10$abcdefghijklmnopqrstuv");

          if (!user || !isValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.username,
            role: user.role,
            juizId: user.juizId
          };
        } catch (error) {
          console.error("---- AUTH ERROR:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.juizId = (user as any).juizId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).juizId = token.juizId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
