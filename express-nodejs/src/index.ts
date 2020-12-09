import express from 'express'
import { Storage } from '@google-cloud/storage'
import Speech from '@google-cloud/speech'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'

const app: express.Express = express();

function uploadFileToGCS(upFile: Express.Multer.File): string {
    const fileName = uuidv4() + '.wav';

    const storage = new Storage({
        projectId: "node-js-test-292505",
        keyFilename: "./src/node-js-test-292505-c768dadc8230.json"
    });

    const stream = storage.bucket('example_backet').file(fileName).createWriteStream({
        metadata: {
            contentType: 'audio/wav'
        },
        resumable: false
    });
    stream.on('error', (err) => {
        console.log(err);
    });
    stream.on('finish', () => {
        console.log('<GCS>upload file');
    });
    stream.end(upFile.buffer);
    return fileName;
}

//GSTT
async function asyncRecognizeGCS(gcsURI: string) {
    const client = new Speech.SpeechClient();
    const config = {
        encoding: 'AudioEncoding',
        languageCode: 'ja-JP',
    };
    const audio = {
        uri: gcsURI,
    };
    const request = {
        config: config,
        audio: audio,
    };

    const [operation] = await client.longRunningRecognize(request);

}

app.post('/api/', multer().single('upfile'), (req: express.Request, res: express.Response) => {
    console.log(req.body.mail);
    console.log(uploadFileToGCS(req.file));
    res.send('Upload success!');
});

app.listen(3000, () => { console.log('example app listening on port 3000!') });