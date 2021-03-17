const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//helper functions
const generateRandomString = function () {
  let string = Math.random().toString(36).slice(7);
  return string;
};

const emailLookup = function(email) {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
}

//end points/routes:

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    //username: req.cookies["username"],
    user: users[userId],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_register", templateVars);
})

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId]
  };
  res.render("login", templateVars);
})

//for urls ending in a /shortURL, render short and long urls
//as key-value pairs inside template variables object
//and send to be used in urls_show document
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies["user_id"];
  const templateVars = {
    user: users[userId],
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

//login post handler from login.ejs form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userObj = emailLookup(email);
  //check if email exists in user database
  if (!userObj) {
    console.log("EMAIL NOT FOUND");
    res.sendStatus(403);
    return;
  }
  //check if password entered matched password on file
  if (userObj.password !== password) {
    console.log("WRONG PASSWORD");
    res.sendStatus(403);
    return;
  }
  //if all is well, set cookie and redirect to /urls
  console.log("SUCCESS");
  res.cookie("user_id", userObj.id);
  res.redirect("/urls")
});

//tied to logout button in _header 
//clears username cookie
//redirects to '/urls'
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
});

//endpoint that handles the registration form data
//from urls_register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (emailLookup(email)) {
    //console.log("EMAIL EXISTS");
    res.sendStatus(400);
    return;
  }
  if (!email || !password) {
    //console.log("Empty email or password")
    res.sendStatus(400);
    return;
  }
  //create new user id + object and add to users database
  const userId = generateRandomString();
  const userObject = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  }
  users[userId] = userObject;
  //set user_id cookie containing id
  res.cookie("user_id", userId);

  //redirect user to /urls page
  res.redirect("/urls");
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
