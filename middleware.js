module.exports.isLoggedIn=(req, res, next)=>{
if(!req.isAuthenticated()){   //passport function. Checks if user is logged in or not
   req.session.returnTo=req.originalUrl;  //include the original intended url into session object you created. After logging in, it should redirect to this path.
    req.flash('error', 'you must be signed in');
    return res.redirect('/login');
}
next();
}