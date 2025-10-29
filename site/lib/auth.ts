import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "text" },
        username: { label: "Username", type: "text" },
        isSignUp: { label: "Is Sign Up", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const { email, password, phone, username, isSignUp } = credentials

        // Handle phone number authentication
        if (phone && !email && !password) {
          // For phone auth, we'll create a temporary user or find existing
          const user = await prisma.user.findFirst({
            where: { 
              OR: [
                { email: phone }, // Store phone as email temporarily
                { username: phone }
              ]
            }
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }

          // Create new user with phone
          const newUser = await prisma.user.create({
            data: {
              email: phone,
              username: username || phone.replace(/\D/g, ''), // Remove non-digits
              name: username || `User_${phone.slice(-4)}`,
              password: null, // No password for phone auth
            }
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          }
        }

        // Handle email/password authentication
        if (email && password) {
          if (isSignUp === "true") {
            // Sign up flow
            const existingUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { email },
                  { username: username || email.split('@')[0] }
                ]
              }
            })

            if (existingUser) {
              throw new Error("User already exists with this email or username")
            }

            const hashedPassword = await bcrypt.hash(password, 12)
            const newUser = await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                username: username || email.split('@')[0],
                name: username || email.split('@')[0],
              }
            })

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            }
          } else {
            // Sign in flow - support both email and username
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email },
                  { username: email } // Treat email field as username if it doesn't contain @
                ]
              }
            })

            if (!user || !user.password) {
              throw new Error("Invalid credentials")
            }

            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) {
              throw new Error("Invalid credentials")
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }
        }

        return null
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.name?.toLowerCase().replace(/\s+/g, '_') || 'user'
        
        // Check if user is admin from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { isAdmin: true }
        })
        token.isAdmin = dbUser?.isAdmin || false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.username = token.username as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
}
