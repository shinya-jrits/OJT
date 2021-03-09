import sendgrid from '@sendgrid/mail';

export class SendMail {
    /**
     * 
     * @param sendGrid_ApiKey SendGridのAPIキー
     * @param fromAddress 送信元のアドレス
     */
    constructor(
        private readonly sendGrid_ApiKey: string,
        private readonly fromAddress: string
    ) {
        //SendGridAPIの設定
        sendgrid.setApiKey(sendGrid_ApiKey);
    }

    /**
     * メールを送信する
     * @param toAddress 送信先アドレス
     * @param mailText メール本文
     * @param attachment テキストファイルで添付する文字列
     */
    async sendMail(toAddress: string, mailText: string, attachment?: string):Promise<void> {
        const msg = {
            to: toAddress,
            from: this.fromAddress,
            subject: '文字起こし結果',
            text: mailText,
            attachments:
                (attachment == null)
                    ? []
                    : [
                        {
                            content: Buffer.from(attachment).toString('base64'),
                            filename: 'result.txt',
                            type: 'text/plain',
                            disposition: 'attachment',
                            contentId: 'mytext',
                        }
                    ]
        };
        try {
            await sendgrid.send(msg);
            console.log("send mail success");
        } catch (err) {
            console.error(err);
        }
    }
}


