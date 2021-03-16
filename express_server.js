const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
//set the view engine to ejs
app.set('view engine', 'ejs');
const PORT = 8080;


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
//
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//for urls ending in a /shortURL, render short and long urls
//as key-value pairs inside template variables object
//and send to be used in urls_show document
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL };
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

//tied to delete button in urls_index
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
