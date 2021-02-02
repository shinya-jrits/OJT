import Speech from '@google-cloud/speech'

/**
 * GoogleSpeechToTextで文字起こしを行う
 * @param fileName 文字起こしを行うファイルの名前
 * @param bucketName ファイルが保存されているGoogleCloudStorageのバケット名
 */
export async function speechToText(fileName: string, bucketName: string): Promise<string | null> {
    const client = new Speech.v1p1beta1.SpeechClient();
    const config = {
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
    };
    const audio = {
        uri: 'gs://' + bucketName + '/' + fileName,
    };
    const request = {
        config: config,
        audio: audio,
    };

    const [operation] = await client.longRunningRecognize(request);

    const [responese] = await operation.promise();
    if (responese.results == null) {
        console.error("文字起こしに失敗しました");
        return null;
    } else if (responese.results.length === 0) {
        console.log("文字を検出できませんでした。");
        return null;
    } else {
        console.log("文字起こしが完了しました");
        return responese.results
            .filter(resutlt => resutlt.alternatives != null)
            .map(result => result.alternatives![0].transcript).join('\n');
    }
}