import express from 'express';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from "cors";
import multer from 'multer';
import 'dotenv/config'



const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    cert: fs.readFileSync(path.join('./cert/cert.pem')),
});
const url = "http://ekyc.honorsupplying.com:7500";
const liveness_path = "/api/v1/anti_spoofing/spoofingcheck_two_stage";
const matching_path = "/api/v1/face/compare/image";
const app = express();
const port = process.env.PORT;
const HTTPSport = process.env.HTTPSPORT;
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const options = {
    key: fs.readFileSync(path.join('./cert/key.pem')),
    cert: fs.readFileSync(path.join('./cert/cert.pem'))
}
let imgCapture;
let imgLiveness

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());



app.get("/", (req, res) => {
    const server = `https://localhost:${HTTPSport}`
    res.render("index.ejs",{server});
    //res.json({a:1})
})


app.post("/capture", upload.any(), (req, res) => {
    imgCapture = req.files[0].buffer;
})

app.post("/liveness", upload.any(), async (req, res) => {
    imgLiveness = "";
    let form = new FormData();
    form.append("detail", req.body.detail);
    req.files.forEach(element => {
        if (element.fieldname == "clearImage") {
            imgLiveness = element.buffer;
        } else {
            let blob = new Blob([element.buffer]);
            form.append(`${element.fieldname}`, blob);
        }
    });
    try {
        const response = await axios.post(url + liveness_path, form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: process.env.TOKEN
            }
        })
        console.log(response.data);
        if (response.data.livenessScore >= 0.4) {
            //res.redirect("/matching");
            try {
                axios.get(`https://localhost:${HTTPSport}/matching`, {
                    httpsAgent
                }).then((r) => {
                    res.json(r.data);
                }).catch((err) => { res.json(err) });
            } catch (err) {
                console.log(err.response.data);
                res.json(err.response.data);
            }

        } else {
            res.send(`Your Liveness score is ${response.data.livenessScore} : You're not real person.`);
            res.json(response.data);
        }

    } catch (err) {
        console.log(err.response.data);
        res.json(err.response.data);

    }
})

app.get("/matching", async (req, res) => {
    let blobLiveness = new Blob([imgLiveness]);
    let blobCapture = new Blob([imgCapture]);
    let form = new FormData();
    form.append("image1", blobLiveness);
    form.append("image2", blobCapture);
    try {
        const response = await axios.post(url + matching_path, form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: process.env.TOKEN
            }
        })
        //console.log(response.data);
        res.json(response.data);
    } catch (err) {
        console.log(err.response.data);
        res.json(err.response.data);
    }
})

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
})

const sslServer = https.createServer(options, app);
sslServer.listen(HTTPSport, () => {
    console.log(`https://localhost:${HTTPSport}`)
})

