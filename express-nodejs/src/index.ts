import express from 'express'
import { Storage } from '@google-cloud/storage'
import Speech from '@google-cloud/speech'
import { stringify, v4 as uuidv4 } from 'uuid'
import sendgrid from '@sendgrid/mail'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import multer from 'multer'

namespace EnvironmentVariable {
    export let fromAddress: string = "";
    export const bucketName = 'meeting_voice_file_jrits';
}

//SendGridAPIの設定
getSecretManagerValue('sendgrid_api_key').then((result) => {
    if (result != null) {
        sendgrid.setApiKey(result);
    } else {
        console.error("SendGrid_API_keyの取得に失敗しました");
    }
});

//emailアドレスの設定
getSecretManagerValue('send_email_address').then((result) => {
    if (result != null) {
        EnvironmentVariable.fromAddress = result;
    } else {
        console.error("emailアドレスの取得に失敗しました");
    }
});


function uploadFileToGCS(upFile: Buffer, onFinish: (fileName: string) => void, onError: (err: Error) => void) {
    const fileName = uuidv4() + '.wav';
    const storage = new Storage();
    const stream = storage.bucket(EnvironmentVariable.bucketName).file(fileName).createWriteStream({
        metadata: {
            contentType: 'audio/wav',
        },
        resumable: false
    });
    stream.on('error', (err) => {
        onError(err);
    });
    stream.on('finish', () => {
        console.log('<GCS>upload file');
        onFinish(fileName);
    });
    stream.end(upFile);
}

async function sendMail(transcription: string, toAddress: string) {
    const bufferText = Buffer.from(transcription);
    if (EnvironmentVariable.fromAddress === "") {
        console.error("emailアドレスの取得に失敗しました");
        return;
    }
    const msg = {
        to: toAddress,
        from: EnvironmentVariable.fromAddress,
        subject: '文字起こし結果',
        text: (transcription.length > 0) ? '文字起こしが完了しました。' + transcription.length + '文字でした。'
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
    try {
        await sendgrid.send(msg);
        console.log("send mail success");
    } catch (err) {
        console.error(err.toString());
    }
}

async function getSecretManagerValue(secretId: string): Promise<string | null> {
    const client = new SecretManagerServiceClient();
    const [accessResponse] = await client.accessSecretVersion({
        name: 'projects/483600820879/secrets/' + secretId + '/versions/latest',
    })
    if (accessResponse.payload?.data == null) {
        return null;
    } else {
        const responsePayload = accessResponse.payload.data.toString();
        return responsePayload;
    }

}

async function speechToText(fileName: string, address: string) {
    const client = new Speech.SpeechClient();

    const config = {
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
    };
    const audio = {
        uri: 'gs://' + EnvironmentVariable.bucketName + '/' + fileName,
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
            console.error("文字を検出できませんでした。");
            sendMail("", address);
        }
    } else {
        console.error("[err]文字起こしに失敗しました");
        sendMail("", address);
    }

}

const app: express.Express = express();

//1時間あたり100mb程度なので2~3時間程度でbase64でファイルサイズが大きくなる(1.4倍)ことを予想する
app.use(express.json({ limit: '420mb' }));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

app.post('/api/', multer().fields([]), (req: express.Request, res: express.Response) => {
    const decodedFile = Buffer.from(req.body.file, "base64");
    uploadFileToGCS(decodedFile, (fileName) => {
        speechToText(fileName, req.body.mail)
    }, (err) => {
        console.error(err);
    });
    res.send("success");
});

app.listen(4000, () => {
    console.log('example app listening on port 4000!')
});
