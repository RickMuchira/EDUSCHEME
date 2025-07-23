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
      if (account?.provider === "google" && profile?.email_verified) {
        try {
          console.log('Attempting to create/update user with profile:', {
            sub: profile.sub,
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          });

          // Create or update user in database
          const userData = {
            google_id: profile.sub,
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          };

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          console.log('Making request to:', `${apiUrl}/api/users`);

          const response = await fetch(`${apiUrl}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          console.log('Response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create/update user in database. Status:', response.status, 'Error:', errorText);
            return false;
          }

          const responseData = await response.json();
          console.log('User creation/update response:', responseData);

          // Check if the response indicates success
          if (responseData.success === false) {
            console.error('Backend returned error:', responseData.message);
            return false;
          }

          console.log('User created/updated successfully in database');
          return true;
        } catch (error) {
          console.error('Error creating user in database:', error);
          return false;
        }
      }
      
      console.error('Invalid sign-in attempt:', {
        provider: account?.provider,
        email_verified: profile?.email_verified
      });
      return false;
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
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
}