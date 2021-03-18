//helper functions:

const urlsForUser = function (id, database) {
  const urls = {};
  for (let shortURL in database) {
    if (database[shortURL].userId === id) {
      urls[shortURL] = database[shortURL];
    }
  }
  return urls;
}

const generateRandomString = function () {
  let string = Math.random().toString(36).slice(2, 8);
  return string;
};

const getUserByEmail = function (email, database) {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return false;
}

module.exports = {
  urlsForUser,
  generateRandomString,
  getUserByEmail
}