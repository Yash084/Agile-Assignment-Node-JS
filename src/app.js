const express = require('express');

// importing routers
const EventRouter = require("./routers/events")



// initializing express
const app = express();

// all incomming request to json 
app.use(express.json());




const BASE_URL = "/api/v3/app"

// using routers
app.use(`${BASE_URL}/events`,EventRouter)



module.exports=app;