import passport from "passport";
import { Profile, VerifyCallback } from "passport-google-oauth20";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Collections } from "../models";
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${process.env.BASE_URI}/api/v1/auth/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        let user = await Collections.UserModel.findOne({ GoogleId: profile.id });

        if (!user) {
          const email = profile.emails?.[0].value;
          const fullName = profile.displayName || "";
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const username = email ? email.split("@")[0] : profile.id;

          user = await Collections.UserModel.create({
            GoogleId: profile.id,
            email,
            fullName,
            firstName,
            lastName,
            username,
            profilePic: profile.photos?.[0].value,
          });
        }

        return done(null, user);

      } catch (err) {
        return done(err as Error, undefined);
      }

    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await Collections.UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


export default passport;
