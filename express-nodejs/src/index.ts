import express, { Send } from 'express'
import multer from 'multer'
import { uploadFileToGCS } from '#/uploadFileToGCS'
import { SendMail } from '#/sendMail'
import { speechToText } from '#/speechToText'
import { EnvironmentVariable } from '#/EnvironmentVariable'
import { getSecretValue } from '#/SecretManager'
import Speech from '@google-cloud/speech'
import { Storage } from '@google-cloud/storage'

const environmentVariable = new EnvironmentVariable();
let sendMail: SendMail;
getSecretValue('sendgrid_api_key').then(result => {
    if (result == null) {
        console.error("SendGridのAPI取得に失敗しました")
    } else {
        sendMail = new SendMail(result);
    }
}).catch((error) => {
    console.error(error);
});

const app: express.Express = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

const upload = multer({ storage: multer.memoryStorage() });

/**
 * postリクエストを受け取って実行する
 */
app.post('/api/', upload.single('file'), (req: express.Request, res: express.Response) => {
    if (environmentVariable.fromAddress == null) {
        console.error("送信元のemailが取得できませんでした");
        return;
    }
    if (environmentVariable.bucketName == null) {
        sendMail.sendMail(req.body.text, "文字起こしに失敗しました。", environmentVariable.fromAddress);
        console.error("バケット名の取得に失敗しました");
        return;
    }
    uploadFileToGCS(req.file.buffer, (fileName) => {
        speechToText(fileName, environmentVariable.bucketName!, new Speech.v1p1beta1.SpeechClient()).then((result) => {
            if (result === null) {
                sendMail.sendMail(req.body.text, "文字を検出できませんでした", environmentVariable.fromAddress!);
            } else {
                sendMail.sendMail(req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", environmentVariable.fromAddress!, result);
            }
        })
    }, (err) => {
        console.error(err);
        sendMail.sendMail(req.body.text, "文字起こしに失敗しました。", environmentVariable.fromAddress!);
    }, environmentVariable.bucketName, new Storage());
    res.send("success");
});

app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });