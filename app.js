require("dotenv").config();
//file has been excluded form gitignore
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose= require("passport-local-mongoose");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.use("/static/", express.static(__dirname + "/static"));

//database
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

//sessions & cookies
app.use(
  session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//end of sessions & cookies

mongoose.connect("mongodb://localhost:27017/symphonyDB", options, function (error) {
  if (error) {
    console.log(error);
  } else {
    console.log("no error");
  }
});


//user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//song schema
const songSchema = new mongoose.Schema ({
  name: String,
  artist: String,
  isLiked: 
  {type: Boolean,
  default: false}
});
const Song = mongoose.model("Song", songSchema);

//end of database

//register
app.get("/register", function(req,res){
  res.render("register");
});
app.post("/register", function(req,res){

  User.register({ username: req.body.username }, req.body.password, function (err,user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/allsongs");
      });
    }
  });
});


//login
app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", function(req, res){
const user= new User({
  username: req.body.username,
  password: req.body.password
});
req.login(user, function (err) {
  if (err) {
    console.log(err);
  }
  else
  {
    passport.authenticate("local")(req, res, function () {
        res.redirect("/allsongs");
      });
  }
});

});


//logout

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/login");
});


//enter a song into the database
app.get("/newsong",function(req,res){
  if (req.isAuthenticated()) {
    res.render("newsong");
  }
   else
    res.redirect("/login");

});

app.post("/newsong", function (req, res) {
  const song = new Song({
    name: req.body.songName,
    artist: req.body.songArtist
  });

  song.save(function(err){
    if(!err)
    res.redirect("/allsongs");
    else
    console.log(err);
  })
});



//look at all the songs present in database
app.get("/allsongs", function (req, res) {
  
  if(req.isAuthenticated()){
    Song.find({}, function (err, songs) {
    if (err) console.log(err);
    else res.render("allsongs", {songs:songs});
  });
  }

  else
  res.redirect("/login");


  
});

//get a specific song via the api
app.get("/songs/:songName",function(req,res){
  if(req.isAuthenticated()){
  Song.findOne({name:req.params.songName},
    function(err,song){
      if(err)
        res.send(err)
        else{
        if(song){
        res.render("song",{
          name: song.name,
          artist: song.artist
        });
      }
        else
        res.send("No songs matching the title were found");
        }
    });
  }
  else
  res.redirect("/login");
});


// Song.findOneAndUpdate(
//   {name: songName },
//   {$set: isLiked= true}
// )




app.listen(3000, function () {
  console.log("server started at port 3000");
});
