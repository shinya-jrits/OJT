import express from 'express'
import { Storage } from '@google-cloud/storage'
import Speech from '@google-cloud/speech'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const app: express.Express = express();

const gcpOptions = {
    projectId: "node-js-test-292505",
    keyFilename: "node-js-test-292505-6e66a2144113.json"
};

function uploadFileToGCS(upFile: Express.Multer.File): string {
    const fileName = uuidv4() + '.wav';

    const storage = new Storage(gcpOptions);

    const stream = storage.bucket('meeting_voice_jrits').file(fileName).createWriteStream({
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
        asyncRecognizeGCS("gs://example_backet/" + fileName);
    });
    stream.end(upFile.buffer);
    return fileName;
}

function outputTextFile(text: string) {
    fs.writeFileSync('test.txt', text);
}


async function asyncRecognizeGCS(gcsURI: string) {
    const client = new Speech.SpeechClient(gcpOptions);
    const config = {
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
    };
    const audio = {
        uri: gcsURI,
    };
    const request = {
        config: config,
        audio: audio,
    };

    const [operation] = await client.longRunningRecognize(request);

    const [responese] = await operation.promise();

    if (responese.results != null) {
        if (responese.results[0].alternatives != null) {
            const trancription = responese.results.map((result) => result.alternatives![0].transcript).join('\n');
            outputTextFile(trancription);
        } else {
            console.log("文字を検出できませんでした。");
            outputTextFile("文字を検出できませんでした。");
        }
    } else {
        console.log("[err]文字起こしに失敗しました");
    }

}

app.post('/api/', multer().single('upfile'), (req: express.Request, res: express.Response) => {
    uploadFileToGCS(req.file);
    res.send('Upload success!');
});

app.listen(3000, () => { console.log('example app listening on port 3000!') });