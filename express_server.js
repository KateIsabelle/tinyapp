const express = require("express");
const app = express();
//set the view engine to ejs
app.set('view engine', 'ejs');
const PORT = 8080; 


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  console.log("/urls");
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log("/urls/:shortURL");
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  console.log("shortURL = ", shortURL);
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});