import 'dotenv/config';
import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import User from '../src/models/user.js';

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.PASSPORT_SECRET;

passport.use(
  new JwtStrategy(opts, (async (jwt_payload, done) => {
    try {
      const foundUser = await User.findUserById(jwt_payload.user_id);
      if (foundUser) {
        return done(null, foundUser); // req.user <= foundUser
      }
      return done(null, false);
    } catch (e) {
      return done(e, false);
    }
  })),
);

export default passport;
