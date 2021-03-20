//helper functions:

//function takes in user id and url database,
//and returns an object containing just the url objects 
//that belong to specific user
const urlsForUser = function (id, database) {
  const urls = {};
  for (let shortURL in database) {
    if (database[shortURL].userId === id) {
      urls[shortURL] = database[shortURL];
    }
  }
  return urls;
}

//function generates random 6-character string, 
//to be used for short url or user id
const generateRandomString = function () {
  let string = Math.random().toString(36).slice(2, 8);
  return string;
};

//function takes in an email, loops through user database, 
//and returns user object that matches email
//if no match, returns undefined
const getUserByEmail = function (email, database) {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return undefined;
}

module.exports = {
  urlsForUser,
  generateRandomString,
  getUserByEmail
}