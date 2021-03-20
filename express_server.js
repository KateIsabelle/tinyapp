const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.set('view engine', 'ejs');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = 8080;
//helper functions:
const { urlsForUser, generateRandomString, getUserByEmail } = require('./helpers')

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

//end points/routes:


app.get("/", (req, res) => {
  const userId = req.session.user_id;
  //if user is logged in, redirect to /urls
  if (userId) {
    return res.redirect("/urls")
  }
  //if not logged in, redirect to login
  res.redirect('/login')
});

// app.get("/error", (req, res) => {
//   const userId = req.session.user_id;
//   const templateVars = {
//     user: users[userId],
//     urls: urlsForUser(userId, urlDatabase),
//   };
//   res.render("error", templateVars);

// })

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    errorMsg: null,
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase)
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
  if (users[userId]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    errorMsg: null,
    user: null
  };
  res.render("urls_register", templateVars);
})

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (users[userId]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    errorMsg: null,
    user: null
  };
  res.render("login", templateVars);
})

//for urls ending in a /shortURL, render short and long urls
//as key-value pairs inside template variables object
//and send to be used in urls_show document
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL; // grab the thing after the colon above
  const thisAccountURLs = urlsForUser(userId, urlDatabase);
  //if user is not logged in, redirect to /urls 
  if (!users[userId]) {
    return res.redirect("/urls")
  }
  //if :shortURL doesn't match anything in url database 
  if (!urlDatabase[shortURL]) {
    const errorMsg = "Oops! Short URL does not exist";
    const templateVars = {
      errorMsg,
      user: users[userId],
      urls: urlsForUser(userId, urlDatabase)
    };
    res.render("urls_index", templateVars);
  }
  //if :shortURL doesn't match anything in user's account
  if (!thisAccountURLs[shortURL]) {
    const errorMsg = "You can only access short URLs registered to your account";
    const templateVars = {
      errorMsg,
      user: users[userId],
      urls: urlsForUser(userId, urlDatabase)
    };
    res.render("urls_index", templateVars);
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
  const userId = req.session.user_id;
  //if shortURL doesn't exist, redirect to /urls
  if (!urlDatabase[shortURL]) {
    const errorMsg = "Oops! Short URL does not exist.";
    const templateVars = {
      errorMsg,
      user: users[userId],
      urls: urlsForUser(userId, urlDatabase)
    };
    res.render("urls_index", templateVars);
    //return res.redirect("/urls")
  }
  const longURL = urlDatabase[shortURL].longURL;
  //otherwise, redirect to longURL
  res.redirect(longURL);
});

//post handler from urls_new form
//creates a new short url with random string function
//updates database object, includes userId from user_id cookie
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let userId = req.session.user_id;
  let longURL = req.body.longURL;
  //if long URL does not use http://, add it 
  if (!longURL.includes("http://" || "https://") ) {
    longURL = "http://" + longURL
  } 
  urlDatabase[shortURL] = {
    longURL,
    userId
  }
  res.redirect(`/urls/${shortURL}`);
});

//endpoint for register form data from urls_register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //use bcrypt to hash password
  const hashPass = bcrypt.hashSync(password, 10);
  //if email already exists in our database, embed error message
  if (getUserByEmail(email, users)) {
    const errorMsg = "You already have an account with this Email."
    const templateVars = {
      errorMsg,
      user: null
    };
    res.render("urls_register", templateVars);
    return;
  }
  if (!email || !password) {
    const errorMsg = "Please fill out both Email and Password fields."
    const templateVars = {
      errorMsg,
      user: null
    };
    res.render("urls_register", templateVars);
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
  const userObj = getUserByEmail(email, users);
  //if email does not exist in users database, embed error message
  if (!userObj) {
    const errorMsg = "Email not found."
    const templateVars = {
      errorMsg,
      user: null
    };
    res.render("login", templateVars);
    return;
  }
  //if hashed password entered doesn't match hashed pass on file
  if (!bcrypt.compareSync(password, userObj.password)) {
    const errorMsg = "Wrong Password."
    const templateVars = {
      errorMsg,
      user: null
    };
    res.render("login", templateVars);
    return;
  }
  //if all is well, set cookie and redirect user to /urls
  req.session.user_id = userObj.id;
  res.redirect("/urls")
});

//handles logout form in _header
//clears user_id cookie, & redirects to '/urls'
app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect('/urls');
});

//handles delete button form in urls_index
//deletes key-value pair from database and redirects to /urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  //add login check for delete 
  if (users[req.session.user_id]) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls")
});

//update operation for editing existing shortened URLs
//handles edit button form in urls_show 
app.post("/urls/:id", (req, res) => {
  //check if user is logged in before allowing an edit
  //if not, redirect to /urls
  if (!users[req.session.user_id]) {
    return res.redirect('/urls')
  }
  //if user is logged in:
  const URLid = req.params.id;
  let longURL = req.body.newLongURL;
  //if long url does not start with http://, add it
  if (!longURL.includes("http://" || "https://") ) {
    longURL = "http://" + longURL
  } 
  urlDatabase[URLid].longURL = longURL;
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




