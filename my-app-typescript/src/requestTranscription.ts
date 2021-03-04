import axios from 'axios';

/**
 * バックエンドサーバに文字起こしをリクエストする
 * @param emailAddress 文字起こし結果を送信するアドレス
 * @param audioFile 文字起こしするオーディオファイル
 * @param requestUrl 送信先のURL
 */
export async function requestTranscription(emailAddress: string, audioFile: Blob, requestUrl: string):Promise<void> {
    const formData = new FormData;
    formData.append("text", emailAddress);
    formData.append("file", audioFile);

    await axios.post(requestUrl, formData, {
        headers: {
            'content-type': 'multipart/form-data'
        }
    });
}