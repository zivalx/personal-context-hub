import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Configure Passport with Google OAuth strategy
 */
export const configurePassport = () => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          profilePicture: true,
          authProvider: true,
          createdAt: true,
        },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            logger.info(`Google OAuth callback for: ${profile.emails[0].value}`);

            const email = profile.emails[0].value;
            const googleId = profile.id;
            const name = profile.displayName;
            const profilePicture = profile.photos?.[0]?.value;

            // Check if user exists with this Google ID
            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            if (user) {
              // User exists with Google ID, update profile picture if changed
              if (user.profilePicture !== profilePicture) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { profilePicture },
                });
              }
              logger.info(`Existing user logged in via Google: ${email}`);
              return done(null, user);
            }

            // Check if user exists with this email (from email/password registration)
            user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) {
              // Link Google account to existing email/password account
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId,
                  profilePicture,
                  emailVerified: true, // Google emails are verified
                  authProvider: 'google', // Update primary auth method
                  name: name || user.name,
                },
              });
              logger.info(`Linked Google account to existing user: ${email}`);
              return done(null, user);
            }

            // Create new user with Google account
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                name,
                profilePicture,
                emailVerified: true, // Google emails are verified
                authProvider: 'google',
              },
            });

            logger.info(`New user registered via Google: ${email}`);
            return done(null, user);
          } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error, null);
          }
        }
      )
    );

    logger.info('✅ Google OAuth configured');
  } else {
    logger.warn('⚠️ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }
};

export default passport;
