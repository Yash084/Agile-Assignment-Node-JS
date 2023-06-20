const { MongoClient } = require("mongodb");


// Create a new MongoClient
const client = new MongoClient(process.env.MONGODB_URL);


module.exports = {
  client ,
  mongoDatabase : client.db(process.env.MONGODB_DATABASE) ,
}