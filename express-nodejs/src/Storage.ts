import { Storage as googleStorage } from '@google-cloud/storage'
import { stringify, v4 as uuidv4 } from 'uuid'

export class Storage {
    /**
     * GCSへの追加、削除を行うクラス
     * @param storage GCSクライアントライブラリ
     * @param bucketName GCSバケット名
     */
    constructor(
        private readonly storage: googleStorage,
        private readonly bucketName: string
    ) { }

    /**
     * GCSにファイルをアップロードする
     * @param upFile 保存するファイル
     * @param onFinish ファイル保存成功時の処理
     * @param onError ファイル保存失敗時の処理
     */
    upload(
        upFile: Buffer,
        onFinish: (fileName: string) => void,
        onError: (err: Error) => void,): void {
        const fileName = uuidv4() + '.mp3';
        const stream = this.storage.bucket(this.bucketName).file(fileName).createWriteStream({
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

    /**
     * GCSのファイルを削除する
     * @param fileName ファイル名
     */
    delete(fileName: string): void {
        this.storage.bucket(this.bucketName).file(fileName).delete()
            .then(() => {
                console.log("ファイルを削除しました");
            }).catch((err) => {
                console.error(err);
            })
    }

    /**
     * バケット名を取得する
     */
    getBucketName(): string {
        return this.bucketName;
    }
}