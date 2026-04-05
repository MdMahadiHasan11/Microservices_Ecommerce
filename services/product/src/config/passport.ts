/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import config from ".";
import prisma from "../shared/prisma";
import { Provider, UserRole, UserStatus } from "@prisma/client";

//-------------------------------------------google auth start --------------

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.GOOGLE_CLINT_ID!,     // ← fixed typo (CLINT → CLIENT)
      clientSecret: config.google.GOOGLE_CLINT_SECRET!,
      callbackURL: config.google.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "No email provided by Google" });
        }

        // Try to find existing user (patient only)
        let user = await prisma.user.findUnique({
          where: { email },
          include: {
            patient: true,
            authProviders: true,
          },
        });

        // ──────────────────────────────────────────────
        // CASE 1: User exists
        // ──────────────────────────────────────────────
        if (user) {
          // Only allow PATIENT role
          if (user.role !== UserRole.PATIENT) {
            return done(null, false, {
              message: "Only patients can sign in with Google",
            });
          }

          // Soft-deleted patient?
          if (user.patient?.isDeleted) {
            return done(null, false, { message: "Account is deleted" });
          }

          // Already linked Google? → just log in
          const hasGoogle = user.authProviders.some(
            (auth) => auth.provider === Provider.google,
          );

          if (!hasGoogle) {
            // Link Google provider to existing account
            await prisma.authProvider.create({
              data: {
                email: user.email,
                provider: Provider.google,
                providerId: profile.id,
              },
            });
          }

          return done(null, user);
        }

        // ──────────────────────────────────────────────
        // CASE 2: New user → create User + Patient + AuthProvider
        // ──────────────────────────────────────────────
        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              role: UserRole.PATIENT,
              needPasswordChange: false, // no password → no need to change
              status: UserStatus.ACTIVE,
            },
          });

           await tx.patient.create({
            data: {
              email,
              name: profile.displayName || "Unknown Patient",
              profilePhoto: profile.photos?.[0]?.value || null,
            },
          });

          // Link Google identity
          await tx.authProvider.create({
            data: {
              email: newUser.email,
              provider: "google",
              providerId: profile.id,
            },
          });

          return newUser; // we return user, not patient
        });

        return done(null, result);
      } catch (err) {
        console.error("Google Passport error:", err);
        return done(err);
      }
    },
  ),
);

