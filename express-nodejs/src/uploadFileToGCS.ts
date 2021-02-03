import { stringify, v4 as uuidv4 } from 'uuid'
import { Storage } from '@google-cloud/storage'

/**
 * GoogleCloudStorageにファイルを保存する
 * @param upFile 保存するファイル
 * @param onFinish ファイル送信完了後に実行する関数
 * @param onError エラー時に実行する関数
 * @param bucketName GoogleCloudStorageのバケット名
 * @param storage GoogleCloudStrageのモジュール
 */
export function uploadFileToGCS(upFile: Buffer,
    onFinish: (fileName: string) => void,
    onError: (err: Error) => void,
    bucketName: string,
    storage: Storage): void {
    const fileName = uuidv4() + '.mp3';
    const stream = storage.bucket(bucketName).file(fileName).createWriteStream({
        metadata: {
            contentType: 'audio/mp3',
        },
        resumable: false
    });
    stream.on('error', (err) => {
        onError(err);
    });
    stream.on('finish', () => {
        console.log('<GCS>upload file');
        onFinish(fileName);
    });
    stream.end(upFile);
}