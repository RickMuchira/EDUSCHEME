import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow verified Google accounts
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }
      return false
    },
    async session({ session, token }) {
      // Add user ID to session for easy access
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, account, profile }) {
      // Store Google account info in JWT token
      if (account && profile) {
        token.accessToken = account.access_token
        token.sub = profile.sub
      }
      return token
    }
  },
  pages: {
    signIn: '/login',  // Custom login page
    error: '/login',   // Redirect errors to login
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}