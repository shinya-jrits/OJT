import express from 'express'
import { Storage } from '@google-cloud/storage'

const multer = require('multer');

const google_auth_info = require('./node-js-test-292505-c768dadc8230.json');


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
    keyFilename: "./node-js-test-292505-c768dadc8230.json"
});

async function uploadFile() {
    await storage.bucket('example_backet').upload('./audioFile/testAudio.wav', {
        gzip: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });

    console.log('uplaoded file');

    uploadFile().catch(console.error);
}

const router: express.Router = express.Router();
router.get('/api/getTest', (req: express.Request, res: express.Response) => {
    res.send(req.query);
    console.log(req.query);
    uploadFile();
});

const upload = multer({ inMemory: true });
const cpupload = upload.fields([{ name: 'upfile', maxCount: 1 }, { name: 'name', maxCount: 1 }]);
router.post('/api/postTest', cpupload, (req: express.Request, res: express.Response) => {
    res.send(req.body);
    //console.log(req.body.mail);
    //@ts-ignore
    console.log(req.files['upfile'][0].buffer);
});
app.use(router);

app.listen(3000, () => { console.log('example app listening on port 3000!') });