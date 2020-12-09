import express from 'express'
import { Storage } from '@google-cloud/storage'
import Speech from '@google-cloud/speech'
import multer from 'multer'
import { stringify, v4 as uuidv4 } from 'uuid'
import sendgrid from '@sendgrid/mail'
import { transform } from 'typescript'

const app: express.Express = express();

const gcpOptions = {
    projectId: "node-js-test-292505",
    keyFilename: "node_modules/api_key/node-js-test-292505-6e66a2144113.json"
};

function uploadFileToGCS(upFile: Express.Multer.File, address: string) {
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
        asyncRecognizeGCS("gs://example_backet/" + fileName, address);
    });
    stream.end(upFile.buffer);
}

function sendMail(trancription: string, address: string) {
    const api_key = require('../node_modules/api_key/config')
    sendgrid.setApiKey(api_key.sendgridAPI);
    const bufferText = Buffer.from(trancription);
    const msg = {
        to: address,
        from: 'shinya091118@gmail.com',
        subject: '文字起こし結果',
        //text: '文字起こしが完了しました。' + trancription.length + '文字でした。',
        text: (trancription.length > 0) ? '文字起こしが完了しました。' + trancription.length + '文字でした。'
            : '文字起こしに失敗しました',
        attachments: [
            {
                content: bufferText.toString('base64'),
                filename: 'result.txt',
                type: 'text/plain',
                disposition: 'attachment',
                contentId: 'mytext',
            }
        ]
    }
    sendgrid.send(msg)
        .then(() => { console.log("send mail success"); }, error => {
            console.log(error);
        })
}


async function asyncRecognizeGCS(gcsURI: string, address: string) {
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
            sendMail(trancription, address);
        } else {
            console.log("文字を検出できませんでした。");
            sendMail("", address);
        }
    } else {
        console.log("[err]文字起こしに失敗しました");
        sendMail("", address);
    }

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
    uploadFileToGCS(req.file, req.body.mail);
    res.send('Upload success!');
});

app.listen(3000, () => { console.log('example app listening on port 3000!') });