import { v1p1beta1 } from '@google-cloud/speech';

/**
 * GoogleSpeechToTextで文字起こしを行う
 * @param fileName 文字起こしを行うファイルの名前
 * @param bucketName ファイルが保存されているGoogleCloudStorageのバケット名
 * @param client GoogleSpeechToTextのクライアントライブラリ
 */
export async function speechToText(
    fileName: string,
    bucketName: string,
    client: v1p1beta1.SpeechClient): Promise<string | null> {
    const request = {
        config: {
            languageCode: 'ja-JP',
            enableAutomaticPunctuation: true,
        },
        audio: {
            uri: 'gs://' + bucketName + '/' + fileName
        }
    };

    const [operation] = await client.longRunningRecognize(request);

    const [response] = await operation.promise();
    if (response.results == null) {
        console.error("文字起こしに失敗しました");
        return null;
    } else if (response.results.length === 0) {
        console.log("文字を検出できませんでした。");
        return null;
    } else {
        console.log("文字起こしが完了しました");
        return response.results
            .filter(result => result.alternatives != null)
            //fiterでnullチェックをしているのでeslintを無視する
            // eslint-disable-next-line 
            .map(result => result.alternatives![0].transcript).join('\n');
    }
}