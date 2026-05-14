import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Send to our backend to login/register and get our JWT
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const backendUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
          const res = await fetch(`${backendUrl}/developer/auth/google-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              google_id: user.id,
              avatar_url: user.image,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            // We pass the backend token into the NextAuth token
            (user as any).accessToken = data.access_token;
            return true;
          }
          
          const errorData = await res.json().catch(() => ({ detail: "Unknown backend error" }));
          console.error("Backend Auth Error:", {
            status: res.status,
            detail: errorData.detail,
            url: `${backendUrl}/developer/auth/google-login`
          });
          return false;
        } catch (error: any) {
          console.error("Connection to Auth Backend Failed:", {
            message: error.message,
            stack: error.stack,
            hint: "Is your backend server running at http://127.0.0.1:8000?"
          });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // If sign in just happened, add the backend token to the JWT
      if (account && user && "accessToken" in user) {
        token.backendToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the backend token to the client
      (session as any).backendToken = token.backendToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
