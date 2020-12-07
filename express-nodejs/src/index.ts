import express from 'express'
import { Storage } from '@google-cloud/storage'
import multer from 'multer'
import { Stream } from 'stream';

const app: express.Express = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "origin, X-Requested-With, Content-Type, Accept");
    next();
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = new Storage({
    projectId: "node-js-test-292505",
    keyFilename: "./src/node-js-test-292505-c768dadc8230.json"
});

async function uploadFile(upFile: Express.Multer.File) {
    /*await storage.bucket('example_backet').upload('./audioFile/testAudio.wav', {
        gzip: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });

    console.log('uplaoded file');
    uploadFile().catch(console.error);*/

    const stream = await storage.bucket('example_backet').file("audio2.wav").createWriteStream({
        metadata: {
            contentType: 'audio/wav'
        }
    });
    stream.on('error', (err) => {
        console.log(err);
    });
    stream.on('finish', () => {
        console.log('upload file');
    })
    stream.end(upFile.buffer);


}

const router: express.Router = express.Router();
router.get('/api/getTest', (req: express.Request, res: express.Response) => {
    res.send(req.query);
    console.log(req.query);
    //uploadFile();
});

const upload = multer();
const cpupload = upload.fields([{ name: 'upfile', maxCount: 1 }, { name: 'name', maxCount: 1 }]);
app.post('/api/postTest', cpupload, (req: express.Request, res: express.Response) => {
    res.send(req.body);
    //console.log(req.body.mail);
    //@ts-ignore
    uploadFile(req.files['upfile'][0]);
});
app.use(router);

app.listen(3000, () => { console.log('example app listening on port 3000!') });