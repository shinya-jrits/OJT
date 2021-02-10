import express from 'express'
import multer from 'multer'
import { SendMail } from '#/sendMail'
import { speechToText } from '#/speechToText'
import Speech from '@google-cloud/speech'
import { Storage } from '#/Storage'

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
            res.header('Access-Control-Allow-Origin', '*');
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
    }

    /**
     * リクエストを受け取り文字起こしするメソッド
     */
    start(): void {
        const upload = multer({ storage: multer.memoryStorage() });
        this.app.post('/api/', upload.single('file'), (req: express.Request, res: express.Response) => {
            const onFinish = ((fileName: string) => {
                speechToText(fileName, this.storage.getBucketName(), new Speech.v1p1beta1.SpeechClient())
                    .then((result) => {
                        if (result === null) {
                            this.sendMail.sendMail(req.body.text, "文字を検出できませんでした");
                        } else {
                            this.sendMail.sendMail(req.body.text, "文字起こしが完了しました。添付ファイルをご確認ください。", result);
                        }
                    })
                    .finally(() => {
                        this.storage.delete(fileName);
                    })
            });
            const onError = ((err: Error) => {
                console.error(err);
                this.sendMail.sendMail(req.body.text, "文字起こしに失敗しました。");
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