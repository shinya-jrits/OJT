import express from 'express'
import multer from 'multer'
import { SendMail } from '#/sendMail'
import { speechToText } from '#/speechToText'
import Speech from '@google-cloud/speech'
import { Storage } from '#/Storage'
import dotenv from 'dotenv'

dotenv.config();

export class Express {
    /**
     * Expressでリクエストを受け取る
     * @param app Expressモジュール
     * @param storage Bucketクラス
     * @param sendMail SendMailクラス
     */
    constructor(
        private readonly app: express.Express,
        private readonly storage: Storage,
        private readonly sendMail: SendMail
    ) {
        this.app.use(function (req, res, next) {

            //バックエンドへのアクセス自体にはGAEでファイアウォールを設定している
            res.header('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN);
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
    }

    /**
     * リクエストを受け取り文字起こしするメソッド
     */
    start(): void {
        type ReqBody = {
            text:string
        }
        const upload = multer({ storage: multer.memoryStorage() });
        this.app.post('/api/', upload.single('file'), (req: express.Request<Record<string, never>,
            Record<string, never>,ReqBody>, res: express.Response) => {
            const onFinish = ((fileName: string) => {
                speechToText(fileName, this.storage.getBucketName(), new Speech.v1p1beta1.SpeechClient())
                    .then((result) => {
                        if (result === null) {
                            void this.sendMail.sendMail(req.body.text, "文字を検出できませんでした");
                        } else {
                            void this.sendMail.sendMail(req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", result);
                        }
                    })
                    .finally(() => {
                        this.storage.delete(fileName);
                    })
            });
            const onError = ((err: Error) => {
                console.error(err);
                void this.sendMail.sendMail(req.body.text, "文字起こしに失敗しました。");
            });

            this.storage.upload(
                req.file.buffer,
                onFinish,
                onError,
            );
            res.send("success");
        });
        this.app.listen(process.env.PORT || 8080, () => { console.log('app listening on port 8080!') });
    }
}