import express from 'express'
import Speech from '@google-cloud/speech'
import sendgrid from '@sendgrid/mail'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import multer from 'multer'
import { uploadFileToGCS } from '../src/GCS'

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

async function sendMail(transcript: string | null, toAddress: string, mailText: string) {
    if (EnvironmentVariable.fromAddress === "") {
        console.error("emailアドレスの取得に失敗しました");
        return;
    }
    const msg = {
        to: toAddress,
        from: EnvironmentVariable.fromAddress,
        subject: '文字起こし結果',
        text: mailText,
        attachments:
            (transcript == null)
                ? []
                : [
                    {
                        content: Buffer.from(transcript).toString('base64'),
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

async function speechToText(fileName: string): Promise<string | null> {
    const client = new Speech.v1p1beta1.SpeechClient();
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
    if (responese.results == null) {
        console.error("文字起こしに失敗しました");
        return null;
    } else if (responese.results.length === 0) {
        console.log("文字を検出できませんでした。");
        return null;
    } else {
        console.log("文字起こしが完了しました");
        return responese.results
            .filter(resutlt => resutlt.alternatives != null)
            .map(result => result.alternatives![0].transcript).join('\n');
    }
}

const app: express.Express = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/', upload.single('file'), (req: express.Request, res: express.Response) => {
    uploadFileToGCS(req.file.buffer, (fileName) => {
        speechToText(fileName).then((result) => {
            if (result === null) {
                sendMail(null, req.body.text, "文字を検出できませんでした");
            } else {
                sendMail(result, req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。");
            }
        })
    }, (err) => {
        console.error(err);
        sendMail(null, req.body.text, "文字起こしに失敗しました。");
    });
    res.send("success");
});

app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });