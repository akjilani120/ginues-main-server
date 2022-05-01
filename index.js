const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app =express()
const port = process.env.PORT || 5000;

// middleware
 app.use(cors())
 app.use(express.json());
  
 function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: "unauthorized access"})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
            return res.status(403).send({message: "Forbidden access"})
        }
        console.log("decoded", decoded)
        req.decoded = decoded;
        next()

    })
    // console.log("insideVarifyJWT",authHeader)
   
 }
  
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6kmbx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
 try{
    await client.connect();
    const userCollection = client.db("GeniesCar").collection("service");
    const orderCOllection = client.db("GeniesCart").collection("order");
    // AUth
    app.post("/login", async(req , res) =>{
        const user = req.body;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn:'1d'
        })
        res.send({accessToken})
    })
    // Service page
    app.get("/service", async(req, res) =>{
        const query ={}
        const cursor = userCollection.find(query)
        const services =await cursor.toArray()
        res.send(services)
    })
    app.get('/service/:id', async(req, res) =>{
        const id=req.params.id
        const query={_id: ObjectId(id)}
        const service=await userCollection.findOne(query)
        res.send(service)
    })
    app.post('/order', async(req, res) =>{
        const order= req.body
        const result = await orderCOllection.insertOne(order)
        res.send(result)
    })
    app.get("/order", verifyToken, async(req, res) =>{
        const decodedEmail =req.decoded.email
        const email = req.query.email;
        if(email === decodedEmail){
            const query ={email:email}
            const cursor = orderCOllection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        }else{
            return res.status(403).send({message: "Forbidden access"})
        }
      
    })
 }finally{
    // await client.close();
 }
}
run().catch(console.dir);
//  middleware
app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
res.send("It is ok")
})
app.listen(port, () =>{
    console.log("Listening port", port)
})