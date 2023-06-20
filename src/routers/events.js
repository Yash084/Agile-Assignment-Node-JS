const express = require('express');
const multer = require('multer');
const ObjectId = require('mongodb').ObjectID;


const {client,mongoDatabase} = require('../mongodb/mongodb');




// connecting to a collection of the database, if not there then this creates and connects.
const eventsCollection = mongoDatabase.collection("events");

const router = new express.Router();


// for file handling 
const multiplartForm = multer({
   fileFilter(request, file, callback) {
      // validating file type as only image
      if (!file.originalname.match(/\.(jpg|jpeg|png|jfif|webp|svg|gif|avif)$/))
         return callback(new Error("Wrong File Format"));

      callback(undefined, true)
   },
})


const requiredCreatePayload = ["name","tagline","schedule","description","moderator","category","sub_category","rigor_rank"]
const allowedPutPayload = [...requiredCreatePayload,"attendees"]


// end points


// creates and event
router.post('/', multiplartForm.single('file'), async (request, response) => {
   try{
      // validating payload
      const payload = Object.keys(request.body) ;
      const isValid = requiredCreatePayload.every((key)=>payload.includes(key))
      if(!isValid){
         return response.status(400).send("invalid payload");
      }

      // date string to date object :: will be better for sorting later
      request.body.schedule = new Date(request.body.schedule)

      const document = {
         ...request.body,
         file:request.file.buffer,
         attendees:[],
      }
      const dbresponse = await eventsCollection.insertOne(document)
      return response.status(201).send(dbresponse.insertedId);
   }catch(error){
      console.log(error)
      return response.status(400).send();
   }
},
(error,request,response,next)=>{
   response.status(400).send()
});



// get event by id and pagination
router.get('/', async (request, response) => {
   try{
      // get event by id
      if(request.query.id){
         const query = {_id:ObjectId(request.query.id)}
         const event = await eventsCollection.findOne(query)
         return response.status(200).send(event);
      }else if(request.query.type && request.query.limit && request.query.page){
         // pagination
         const options = {
            sort:{
               'schedule':1,
            },
            limit:parseInt(request.query.limit),
            skip: request.query.page > 0 ? ( ( request.query.page - 1 ) * request.query.limit ) : 0 ,
         }
         const cursor = eventsCollection.find({},options)
         const result = []
         await cursor.forEach((event)=>result.push(event));
         await cursor.close()
         return response.status(200).send(result);
      }
   }catch(error){
      console.log(error);
      return response.status(400).send(error);
   }
});



// delete by event
router.delete('/:id',async (request,response)=>{
   const query = {_id:ObjectId(request.params.id)}
   const event = await eventsCollection.deleteOne(query);
   return response.status(200).send(event);
})


// update an event
router.put('/:id', multiplartForm.single('file'), async (request,response)=>{
   const query = {_id:ObjectId(request.params.id)}
   const payload = Object.keys(request.body);
   const isValid = payload.every((params)=>allowedPutPayload.includes(params));
   if(!isValid){
      return response.status(405).send();
   }
   try{
      // date string to date object :: will be better for sorting later
      if(request.body.schedule != undefined ) request.body.schedule = new Date(request.body.schedule)
      const update = request.body ;
      if(request.file) update.file = request.file.buffer;
      const event = eventsCollection.updateOne(
         query,
         { $set: {...update} },
      )
      return response.status(204).send(event)
   }catch(error){
      console.log("Put error :",error)
      return response.status(400).send();
   }
})



module.exports = router