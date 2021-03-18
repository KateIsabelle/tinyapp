const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.set('view engine', 'ejs');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = 8080;

//middlewears:

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1']
  })
  );

//database objects:

const urlDatabase = {
  //b6UTxQ: { longURL: "https://www.tsn.ca", userId: "aJ48lW" },
  //i3BoGr: { longURL: "https://www.google.ca", userId: "aJ48lW" }
};

const users = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
  // },
  // "user2RandomID": {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk"
  // }
}

//helper functions:

const urlsForUser = function (id) {
  const urls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}


const generateRandomString = function () {
  let string = Math.random().toString(36).slice(2, 8);
  return string;
};

const emailLookup = function (email) {
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
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
    urls: urlsForUser(userId)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login")
  }
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_register", templateVars);
})

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId]
  };
  res.render("login", templateVars);
})

//for urls ending in a /shortURL, render short and long urls
//as key-value pairs inside template variables object
//and send to be used in urls_show document
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  const thisAccountURLs = urlsForUser(userId);
  //if :shortURL doesn't match anything in the account URLs
  //return an error
  if(!thisAccountURLs[shortURL]) {
    res.status(400).send("URL not found");
  }
  let longURL;
  if (thisAccountURLs[shortURL]) {
    longURL = thisAccountURLs[shortURL].longURL;
  }
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
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//post handler from urls_new form
//creates a new short url with random string function
//updates database object, includes userId from user_id cookie
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let userId = req.session.user_id;
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userId: userId
  }
  res.redirect(`/urls/${shortURL}`);
});

//endpoint for register form data from urls_register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //use bcrypt to hash password
  const hashPass = bcrypt.hashSync(password, 10);
  //if email already exists in our database, return 400
  if (emailLookup(email)) {
    res.status(400).send("Account already exists");
    return;
  }
  if (!email || !password) {
    res.status(400).send("Enter email and password");
    return;
  }
  //if all is well, create new user id + user object, add to users database
  const userId = generateRandomString();
  const userObject = {
    id: userId,
    email,
    password: hashPass
  }
  users[userId] = userObject;
  //set user_id cookie containing id
  req.session.user_id = userId;

  //redirect user to /urls page
  res.redirect("/urls");
});

//login post handler from login.ejs form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //hash password
  const hashPass = bcrypt.hashSync(password, 10);
  const userObj = emailLookup(email);
  //if email does not exist in database, return 403
  if (!userObj) {
    res.status(403).send("Email not found");
    return;
  }
  //if hashed password entered doesn't match hashed pass on file
  if (bcrypt.compareSync(hashPass, userObj.password)) {
    res.status(403).send("Wrong password");
    return;
  }
  //if all is well, set cookie and redirect user to /urls
  req.session.user_id = userObj.id;
  res.redirect("/urls")
});

//handles logout form in _header
//clears user_id cookie, & redirects to '/urls'
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

//handles delete button form in urls_index
//deletes key-value pair from database and redirects to /urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  //add login check for delete 
  if (req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls")
});

//update operation for editing existing shortened URLs
//handles edit button form in urls_show 
app.post("/urls/:id", (req, res) => {
  //add conditional login check for edit
  if (req.session.user_id) {
    const URLid = req.params.id;
    const longURL = req.body.newLongURL;
    urlDatabase[URLid].longURL = longURL;
  }
  res.redirect('/urls')
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
