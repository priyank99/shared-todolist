const express    = require("express"),
      router     = express.Router(),
      passport   = require("passport"),
      middleware = require("../middleware"),
      User       = require("../models/user");


router.get("/register", (req, res) => res.render("register"));
// handle sign up logic
router.post("/register", (req, res) => {
  let newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,

  });

  if (req.body.adminCode === process.env.ADMINCODE) {
    newUser.isAdmin = true;
  }
  console.log(newUser);
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/user/register");
      }
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/user/register");
    }

    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to ToDo, " + user.username);
      res.redirect("/user/dashboard");
    });
  });
});

// show login form
router.get('/login', function(req, res) {
  res.render('login');
});
// login logic: app.post("/login", middleware, callback)
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error", "Invalid username or password");
      return res.redirect('/user/login');
    }
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/list/all';
      delete req.session.redirectTo;
      req.flash("success", "Good to see you again, " + user.username);
      res.redirect(redirectTo);
    });
  })(req, res, next);
});
// logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged out seccessfully. Look forward to seeing you again!");
  res.redirect("/");
});
router.get('/dashboard', middleware.isLoggedIn, function(req, res) {
  console.log(req.user);
  res.render('dashboard', {user: req.user});
});

router.get('/:id', middleware.isLoggedIn, function(req, res) {
  res.redirect('/user/dashboard');
});

module.exports = router;
