import { getSecretValue } from '#/SecretManager'
import { Express } from '#/Express';

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
    const express = new Express(fromAddress, bucketName, sendGridApiKey);
    express.Start();
})();

