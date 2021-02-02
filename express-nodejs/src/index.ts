import express from 'express'
import multer from 'multer'
import { uploadFileToGCS } from '#/uploadFileToGCS'
import { SendMail } from '#/sendMail'
import { speechToText } from '#/speechToText'
import { EnvironmentVariable } from '#/EnvironmentVariable'

const environmentVariable = new EnvironmentVariable();
const sendMail = new SendMail();

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
        sendMail.sendMail(null, req.body.text, "文字起こしに失敗しました。", environmentVariable.fromAddress);
        console.error("バケット名の取得に失敗しました");
        return;
    }
    uploadFileToGCS(req.file.buffer, (fileName) => {
        speechToText(fileName, environmentVariable.bucketName!).then((result) => {
            if (result === null) {
                sendMail.sendMail(null, req.body.text, "文字を検出できませんでした", environmentVariable.fromAddress!);
            } else {
                sendMail.sendMail(result, req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", environmentVariable.fromAddress!);
            }
        })
    }, (err) => {
        console.error(err);
        sendMail.sendMail(null, req.body.text, "文字起こしに失敗しました。", environmentVariable.fromAddress!);
    }, environmentVariable.bucketName);
    res.send("success");
});

app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });