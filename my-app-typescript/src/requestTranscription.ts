import axios from 'axios';

/**
 * バックエンドサーバに文字起こしをリクエストする
 * @param emailAddress 文字起こし結果を送信するアドレス
 * @param audioFile 文字起こしするオーディオファイル
 * @param requestUrl 送信先のURL
 */
export function requestTranscription(emailAddress: string, audioFile: Blob, requestUrl: string) {
    const formData = new FormData;
    formData.append("text", emailAddress);
    formData.append("file", audioFile);

    axios.post(requestUrl, formData, {
        headers: {
            'content-type': 'multipart/form-data'
        }
    })
        .then(() => {
            console.log("post request success");
            window.alert("送信に成功しました");
        })
        .catch((error) => {
            console.log(error);
            window.alert("送信に失敗しました");
        });

}