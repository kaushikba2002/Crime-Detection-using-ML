const express =require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const methodOverride=require('method-override');
const ejsMate=require('ejs-mate');
const session=require('express-session');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user.js')
const {isLoggedIn}=require('./middleware')
const fileUpload = require('express-fileupload');
const axios=require('axios')
var bodyParser = require('body-parser')
const fs=require('fs')




mongoose.connect('mongodb://127.0.0.1:27017/criminal-detection', {
    // useNewUrlParser:true,
    // useCreateIndex:true,
    // useUnifiedTopology:true
    // useFindAndModify:false
})
.then(()=>{
    console.log("Database connected")
})
.catch((err)=>{
    console.log("Connection unable to open")
})

mongoose.set('strictQuery', true);
// const db=mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", ()=>{
//     console.log("Database connected");
// });

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended:true})); //add this command to let express know to parse the req.body in a POST request
app.use(methodOverride('_method')); //used to override the default GET/POST request sent by a form to a PATCH/PUT/DELETE/ any other type of request
app.use(express.static(path.join(__dirname, 'public')))//static assets, stylesheets etc

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())



const sessionConfig={
    secret:'thisshouldbeabettersecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true, //Default is also true. An HttpOnly Cookie is a tag added to a browser cookie that prevents client-side scripts from accessing data. It provides a gate that prevents the specialized cookie from being accessed by anything other than the server.  Using the HttpOnly tag when generating a cookie helps mitigate the risk of client-side scripts accessing the protected cookie, thus making these cookies more secure.
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7
    }
}
app.use(session(sessionConfig))
app.use(flash());
app.use(fileUpload());
app.use(express.json())

app.use(passport.initialize()) //middle-ware that initialises Passport
app.use(passport.session()); //call this only after calling session middleware sessionConfig. acts as a middleware to alter the req object and change the 'user' value that is currently the session id (from the client cookie) into the true deserialized user object
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());//This has to be called for passport.session() to work
passport.deserializeUser(User.deserializeUser()); //This has to be called for passport.session() to work

app.use((req, res, next)=>{
    res.locals.result=null; // passport user object
    res.locals.success=req.flash('success') //In every request, the 'success' key under flash is checked and if it contains anything, is assigned to the locals.success variable in response res so that it can be used in the response template.
    res.locals.error=req.flash('error')
    next();
})

app.get('/home', isLoggedIn, (req, res)=>{
    res.render('home.ejs')
})

app.get('/login', (req, res)=>{
    res.render('login.ejs')
})

app.get('/videostream1', isLoggedIn, (req, res)=>{
    res.writeHead(200, {'Content-Type':'video/mp4'})
    console.log(req.headers)
    var rs=fs.createReadStream('sam1.mp4')
    rs.pipe(res)
})

app.get('/videostream2', isLoggedIn, (req, res)=>{
    res.render('videostream.ejs')
})

app.get('/video', (req, res)=>{
    const range=req.headers.range
    if(!range)
    res.status(400).send('error')

    const videoPath='sam1.mp4'
    const videoSize=fs.statSync(videoPath).size

    const chunkSize=10**6

    const start=Number(range.replace(/\D/g, ''))
    const end=Math.min(start+chunkSize, videoSize-1)
    const contentLength=end-start+1
    const headers={
        "Content-Range":`bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges":'bytes',
        "Content-Length":contentLength,
        "Content-Type":"video/mp4"
    }
    res.writeHead(206, headers)
    const videoStream=fs.createReadStream(videoPath, {start, end})

    videoStream.pipe(res)
})
app.get('/imgupload', isLoggedIn, (req, res)=>{
    res.render('imgupload.ejs')
})
app.get('/logout', isLoggedIn, (req, res)=>{
    req.logout(function(err)
    {
        if(err) {return next(err);}
        req.flash('success', 'Goodbye!');
        res.redirect('/login');

    }); 
})



app.post('/login', passport.authenticate('local', {failureFlash:true, failureRedirect:'/login'}), (req, res, next)=>{
    req.flash('success', 'welcome back!');
    // const redirectUrl=req.session.returnTo || '/campgrounds';
    // delete req.session.returnTo;
    res.redirect('/home');

}) 


const f1=async function(image){
    try{
        console.log(image)
   const res= await axios.post('http://172.16.18.57:5000/custom_predict', image);
   console.log(res)
    }
    catch(e)
    {
        console.log(e)
    }
    //   console.log(res.data)
    //   return res.data
    return {name:"Kaushik", success:true}
}

app.post('/route1', (req, res)=>{
    console.log(req.body)
    console.log('haavi')
    res.send({name:"Kaushik", success:true})
})


app.post('/upload', async (req, res) => {
const { image } = req.files;


if (!image) return console.log('No image sent')

// axios.get('https://swapi.dev/api/people/1/')
//   .then((response) => {
//     ;
//   }, (error) => {
//     console.log(error);
//   });
const result=await f1(image);
console.log(result)
// axios.post('https://127.0.0.1:3000/route1', {
//     firstName: 'Finn',
//     lastName: 'Williams'
//   })
//   .then((response) => {
//     // console.log(response);
//   }, (error) => {
//     console.log(error);
//   });

image.mv(__dirname + '/uploads/' + image.name);

res.render('result.ejs', {result});
});

app.listen(3000, ()=>{
    console.log('Serving on port 3000')
})