import { getSecretValue } from '#/SecretManager'
import { Express } from '#/Express';
import { Storage } from '@google-cloud/storage';
import { SendMail } from './sendMail';
import express from 'express'

(async () => {
    const fromAddress = await getSecretValue('send_email_address');
    const bucketName = await getSecretValue('meeting_voice_file_dir');
    const sendGridApiKey = await getSecretValue('sendgrid_api_key')
    if (fromAddress == null) {
        throw new Error("送信元アドレスの取得に失敗しました");
    }
    if (bucketName == null) {
        throw new Error('GCSのバケット名の取得に失敗しました');
    }
    if (sendGridApiKey == null) {
        throw new Error('sendGridのAPIキーの取得に失敗しました');
    }
    const expressClass = new Express(
        new Storage(),
        bucketName,
        new SendMail(sendGridApiKey),
        fromAddress,
        express());
    expressClass.start();
})();

