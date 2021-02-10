import { Storage } from '@google-cloud/storage'

/**
 * GoogleCloudStorageのファイルを削除する
 * @param bucketName GoogleCloudStorageのバケット名
 * @param fileName GoogleCloudStorageでのファイル名
 * @param storage GoogleCloudStrageのモジュール
 */
export function deleteFileToGCS(bucketName: string, fileName: string, storage: Storage): void {
    storage.bucket(bucketName).file(fileName).delete()
        .then(() => {
            console.log("ファイルを削除しました");
        }).catch((err) => {
            console.error(err);
        })
}