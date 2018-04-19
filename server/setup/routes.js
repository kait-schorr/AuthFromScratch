const User = require("../users/User");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const { ExtractJwt } = require("passport-jwt");
const JwtStrategy = require("passport-jwt").Strategy;
const secret = "unicorns are great";

function makeToken(user) {
  //return token
  const timestamp = new Date().getTime();

  const payload = {
    sub: user._id,
    iat: timestamp,
    username: user.username,
    race: user.race
  };
  const options = {
    expiresIn: "4h"
  };

  return jwt.sign(payload, secret, options);
}

const localStrategy = new LocalStrategy(function(username, password, done) {
  User.findOne({ username }, function(err, user) {
    if (err) {
      done(err);
    }
    if (!user) {
      done(null, false);
    }

    user.verifyPassword(password, function(err, isValid) {
      if (err) {
        return done(err);
      }
      if (isValid) {
        const { _id, username, race } = user;
        return done(null, { _id, username, race });
      }

      return done(null, false);
    });
  });
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
};

const jwtStrategy = new JwtStrategy(jwtOptions, function(payload, done) {
  User.findById(payload.sub)
    .then(user => {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch(err => {
      return done(err, false);
    });
});

passport.use(localStrategy);
passport.use(jwtStrategy);

const authenticate = passport.authenticate("local", { session: false });
const protected = passport.authenticate("jwt", { session: false });

module.exports = function(server) {
  server.get("/api/hobbits", protected, (req, res) => {
    User.find({ race: "hobbit" })
      .select("-password")
      .then(hobbits => {
        res.json(hobbits);
      })
      .catch(err => {
        res.status(500).json(err);
      });
  });

  server.get("/", function(req, res) {
    res.send({ api: "Up and Running" });
  });

  server.post("/api/register", function(req, res) {
    const credentials = req.body;

    const user = new User(credentials);

    user
      .save()
      .then(insertedUser => {
        const token = makeToken(insertedUser);
        res.json({ token });
      })
      .catch(err => {
        res.status(500).json(err);
      });
  });

  server.post("/api/login", authenticate, (req, res) => {
    res.status(200).json({ token: makeToken(req.user), user: req.user });
  });
};
