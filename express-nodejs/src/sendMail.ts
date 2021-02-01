import sendgrid from '@sendgrid/mail'
import { getSecretManagerValue } from '../src/SecretManager'
export class SendMail {
    constructor() {
        //SendGridAPIの設定
        getSecretManagerValue('sendgrid_api_key').then((result) => {
            if (result != null) {
                sendgrid.setApiKey(result);
            } else {
                console.error("SendGrid_API_keyの取得に失敗しました");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    async sendMail(transcript: string | null, toAddress: string, mailText: string, fromAddress: string | null) {
        if (fromAddress == null) {
            console.error("emailアドレスの取得に失敗しました");
            return;
        }
        const msg = {
            to: toAddress,
            from: fromAddress,
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
}


