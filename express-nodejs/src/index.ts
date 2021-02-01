import express from 'express'
import { getSecretManagerValue } from '../src/SecretManager'
import multer from 'multer'
import { uploadFileToGCS } from '../src/uploadFileToGCS'
import { SendMail } from '../src/sendMail'
import { speechToText } from '../src/speechToText'

class EnvironmentVariable {
    fromAddress?: string;
    bucketName?: string;
    constructor() {
        getSecretManagerValue('send_email_address').then((result) => {
            if (result != null) {
                this.fromAddress = result;
            } else {
                console.error("emailアドレスの取得に失敗しました");
            }
        }).catch((error) => {
            console.error(error);
        });
        getSecretManagerValue('meeting_voice_file_dir').then((result) => {
            if (result != null) {
                this.bucketName = result;
            } else {
                console.error("バケット名の取得に失敗しました");
            }
        }).catch((error) => {
            console.error(error);
        });
    }
}

const environmentVariable = new EnvironmentVariable();
const sendMail = new SendMail();

const app: express.Express = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/', upload.single('file'), (req: express.Request, res: express.Response) => {
    uploadFileToGCS(req.file.buffer, (fileName) => {
        speechToText(fileName, environmentVariable.bucketName).then((result) => {
            if (result === null) {
                sendMail.sendMail(null, req.body.text, "文字を検出できませんでした", environmentVariable.fromAddress);
            } else {
                sendMail.sendMail(result, req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", environmentVariable.fromAddress);
            }
        })
    }, (err) => {
        console.error(err);
        sendMail.sendMail(null, req.body.text, "文字起こしに失敗しました。", environmentVariable.fromAddress);
    });
    res.send("success");
});

app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });