var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/register');

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, users){
   	if(err) throw err;
   	if(!users){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, users.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, users);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
}));

passport.serializeUser(function(users, done) {
  done(null, users.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, users) {
    done(err, users);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'/administrator', failureRedirect:'/user/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/administrator');
});
router.post('/login', function(req, res, next) {
	console.log(req.body);
	User.getUserByUsername(req.body.username, function(err, users) {
		if(users){
			passport.authenticate('local', function(err, user, info) {
				if (err) { return next(err); }
				if (!user) { return res.redirect('/'); }
				req.logIn(user, function(err) {
					if(err){
						res.status(404).json({
							"code": 404,
							"massage":"User not found"
						})
					}
					else{
						var tokenss = jwt.sign({id:user._id,username:req.body.username,status:user.status,type:user.type},accesskey,{
							algorithm: 'HS256',
							expiresIn: 7760000
						});
						user.password = '';
						res.status(200).json({
							"token":tokenss,userinfo:user
						})
					}
				});
					
			})(req, res, next);
				
		}
		else{
			res.status(404).json({
				"code": 404,
				"massage":"User not found"
			})
		}
	});
});
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out');
	res.redirect('/user/login');
});

module.exports = router;
