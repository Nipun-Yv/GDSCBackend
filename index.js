import express from "express"
import cors from "cors"
import {auth} from "express-oauth2-jwt-bearer"
import axios from "axios"
import pg from "pg"
import {Server} from "socket.io"
import http1 from "http"
import dotenv from "dotenv"
dotenv.config()
const host = process.env.PGHOST;
const port1 = process.env.PGPORT;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const database = process.env.PGDATABASE;
const connectionString = `postgresql://${user}:${password}@${host}:${port1}/${database}`;
const db=new pg.Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})
const port=4000;
const app=express();
const app1=express();
const server=http1.createServer(app1);
const authenticationBaseURL=process.env.A0URL
const io=new Server(server,{
    cors:{
        origin:'http://localhost:3000',
        methods:["GET","POST"]
    }
})
try{
db.connect();}
catch(err){
    console.log(err.message)
}

app.use(cors())
app.use(express.json())

server.listen(3001,()=>{
    console.log("Receiving requests from another port");
})
app.listen(port,()=>{
    console.log(`Server running successfully and recieving requests from port: ${port}`)
})
let connectedUsers={}
io.on("connection",(socket)=>{
    console.log("Heyo")
    connectedUsers[socket.id]=0;
    socket.on("send_private_message",(data)=>{
        if(connectedUsers[socket.id]===0){
           for(let i=0;i<1000;i++){
               setTimeout(()=>{io.to(socket.id).emit("receive_message",{obj1:Math.floor(Math.random()*8000+1000),obj2:Math.floor(Math.random()*8000+1000),obj3:Math.floor(Math.random()*8000+1000)}
               )},1100*i);
               connectedUsers[socket.id]=1;
          }}
    })
})
app.get("/health",async (req,res)=>{
    res.status(200).send('OK');
})
app.get("/",async (req,res)=>{
    if(req.headers.authorization){
    const access_token=req.headers.authorization.split(' ')[1];
    const response=await axios.get(authenticationBaseURL,{headers:{
        authorization:`Bearer ${access_token}`
    }});
    const userinfo=response.data;
    console.log(userinfo.email)
    try{
        const response=await db.query("SELECT leetcode,codeforces,hackerearth,hackerrank,codechef FROM questions where username=$1",[userinfo.email]);
        console.log(response.rowCount)
        if(response.rowCount==0){
            const insert=await db.query("INSERT INTO Questions values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[userinfo.email,100,250,50,400,80,"Add","Add Description","select"]);
            res.send({"leetcode":100,"codeforces":250,"hackerearth":50,"hackerrank":400,"codechef":80});
        }
        else{
            res.send(response.rows[0]);
        }
    }
    catch(err){
        console.log(err.message);
        res.send({"leetcode":100,"codeforces":250,"hackerearth":50,"hackerrank":400,"codechef":80});
    }}
    else{
        res.send("Error,invalid access")
    }
})
app.post("/update",async (req,res)=>{
    if(req.headers.authorization){
    const access_token=req.headers.authorization.split(" ")[1];
    const response=await axios.get(authenticationBaseURL,{headers:{
        authorization:`Bearer ${access_token}`
    }})
    const userinfo=response.data;
    const uD=req.body
    try{
        await db.query("UPDATE Questions SET leetcode=$1,codeforces=$2,codechef=$3,hackerrank=$4,hackerearth=$5 where username=$6",[uD.leetcode,uD.codeforces,uD.codechef,uD.hackerrank,uD.hackerearth,userinfo.email])
        res.send("Ok")
    }
    catch(err){
        console.log(err.message)
        res.send("Not ok")
    }}
    else{
        res.send("Error,invalid access")
    }
})
app.get("/profile/:email",async (req,res)=>{
    const email=req.params.email;
        try{
            const response=await db.query("select organisation,description,org_role from questions where username=$1",[email]);
            if(response.rowCount==0){
                await db.query("INSERT INTO Questions values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[email,100,250,50,400,80,"Add","Add Description","select"]);
                res.send({organisation:"Add",description:"Add Description",org_role:"select"})
            }
            else{
                res.send(response.rows[0]);
            }
        }
        catch(err){
            console.log(err.message,"2");
            res.send({organisation:"Add",description:"Add Description",org_role:"select"})
        }
    }
)
app.post("/profile",async (req,res)=>{
    console.log("Hello")
    const data=req.body
    console.log(data)
    try{
        await db.query("update questions set organisation=$1,description=$2,org_role=$3 where username=$4",[data.value.organisation,data.value.description,data.value.org_role,data.username])
    }
    catch(err){

    }
})
