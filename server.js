import express from 'express';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';

const app = express();
const port = 3000;
const options={
    key:fs.readFileSync(path.join('./cert/key.pem')),
    cert:fs.readFileSync(path.join('./cert/cert.pem'))
    }

app.use(express.static('public'));

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.listen(5000,() => {
    console.log(`http://localhost:${5000}`);
})

const sslServer = https.createServer(options,app);
sslServer.listen(port,()=>{
console.log('https://localhost:3000')
})

