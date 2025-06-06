import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Demo users for testing
        const demoUsers = [
          { 
            id: '1', 
            email: 'admin@oiltrading.com', 
            password: 'admin123', 
            name: 'Admin User',
            role: 'admin' 
          },
          { 
            id: '2', 
            email: 'operator@oiltrading.com', 
            password: 'operator123', 
            name: 'Operator User',
            role: 'operator' 
          }
        ]

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = demoUsers.find(
          user => user.email === credentials.email && user.password === credentials.password
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }