import express from 'express'
import multer from 'multer'
import { uploadFileToGCS } from '#/uploadFileToGCS'
import { SendMail } from '#/sendMail'
import { speechToText } from '#/speechToText'
import Speech from '@google-cloud/speech'
import { Storage } from '@google-cloud/storage'

export class Express {
    app: express.Express;
    fromAddress: string;
    bucketName: string;
    sendMail: SendMail;
    /**
     * Expressでリクエストを受け取る
     * @param fromAddress 返信元のメールアドレス
     * @param bucketName 保存先のバケット名
     * @param sendGridApiKey SendGridのAPIキー
     */
    constructor(fromAddress: string, bucketName: string, sendGridApiKey: string) {
        this.app = express();
        this.fromAddress = fromAddress;
        this.bucketName = bucketName;
        this.sendMail = new SendMail(sendGridApiKey);
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
    }

    /**
     * リクエストを受け取り文字起こしするメソッド
     */
    Start(): void {
        const upload = multer({ storage: multer.memoryStorage() });
        this.app.post('/api/', upload.single('file'), (req: express.Request, res: express.Response) => {
            if (this.fromAddress == null) {
                console.error("送信元のemailが取得できませんでした");
                return;
            }
            if (this.bucketName == null) {
                this.sendMail.sendMail(req.body.text, "文字起こしに失敗しました。", this.fromAddress);
                console.error("バケット名の取得に失敗しました");
                return;
            }
            uploadFileToGCS(req.file.buffer, (fileName) => {
                speechToText(fileName, this.bucketName!, new Speech.v1p1beta1.SpeechClient()).then((result) => {
                    if (result === null) {
                        this.sendMail.sendMail(req.body.text, "文字を検出できませんでした", this.fromAddress!);
                    } else {
                        this.sendMail.sendMail(req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", this.fromAddress!, result);
                    }
                })
            }, (err) => {
                console.error(err);
                this.sendMail.sendMail(req.body.text, "文字起こしに失敗しました。", this.fromAddress!);
            }, this.bucketName, new Storage());
            res.send("success");
        });
        this.app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });
    }
}