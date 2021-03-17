const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080;

//app.get('/', (req,res) => {
//console.log('Cookies: ' req.cookies)
//console.log('Signed Cookies: ', req.signedCookies)
//skip signed cookies
//})


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//helper function
const generateRandomString = function() {
  let string = Math.random().toString(36).slice(7);
  return string;
};

//end points or routes:

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_register", templateVars);
})

//for urls ending in a /shortURL, render short and long urls
//as key-value pairs inside template variables object
//and send to be used in urls_show document
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  const longURL = urlDatabase[shortURL];
  const templateVars = { 
    username: req.cookies["username"],
    shortURL, 
    longURL 
  };
  res.render("urls_show", templateVars);
});

//tied to href anchor in urls_show url short url link
//upon click, redirects to matching long url
app.get("/u/:shortURL", (req, res) => {
  const shorty = req.params.shortURL;
  const longURL = urlDatabase[shorty];
  res.redirect(longURL);
});

//redirects up to app.get("urls/:shortURL")
app.post("/urls", (req, res) => {
  let shorty = generateRandomString();
  urlDatabase[shorty] = req.body.longURL;
  res.redirect(`/urls/${shorty}`);    
});

//post request from _header.ejs partial
//sets a cookie with 'username' key and input value as value
//then redirects to '/urls'
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls")
});

//tied to logout button in _header 
//clears username cookie
//redirects to '/urls'
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

//tied to delete button in urls_index
//deletes key-value pair from database and redirects to /urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

//update operation for editing existing shortened URLs
//post tied to urls_show Edit form 
app.post("/urls/:id", (req, res) => {
  const URLid = req.params.id;
  const longURL = req.body.newLongURL;
  urlDatabase[URLid] = longURL;
  res.redirect('/urls')
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
