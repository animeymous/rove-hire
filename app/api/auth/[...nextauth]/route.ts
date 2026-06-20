import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';

// export const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error('Please enter email and password');
//         }

//         try {
//           console.log('🔐 Attempting to connect to database...');
//           await connectToDatabase();
//           console.log('✅ Database connected, finding user...');
          
//           const user = await User.findOne({ email: credentials.email }).select('+password');

//           if (!user) {
//             console.log('❌ User not found:', credentials.email);
//             throw new Error('No user found with this email');
//           }

//           console.log('✅ User found, checking password...');
          
//           if (!user.password) {
//             console.log('❌ User has no password set');
//             throw new Error('Invalid credentials');
//           }

//           const isPasswordMatch = await user.matchPassword(credentials.password);

//           if (!isPasswordMatch) {
//             console.log('❌ Password mismatch');
//             throw new Error('Invalid credentials');
//           }

//           console.log('✅ Authentication successful for:', user.email);

//           return {
//             id: user._id.toString(),
//             name: user.name,
//             email: user.email,
//             role: user.role || 'HR',
//           } as any;
//         } catch (error) {
//           console.error('❌ Auth error:', error);
//           throw error;
//         }
//       },
//     }),
//   ],
//   session: {
//     strategy: 'jwt' as const,
//   },
//   callbacks: {
//     async jwt({ token, user }: any) {
//       if (user) {
//         token.id = user.id;
//         token.role = user.role;
//       }
//       return token;
//     },
//     async session({ session, token }: any) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as string;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: '/login',
//     error: '/login',
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };