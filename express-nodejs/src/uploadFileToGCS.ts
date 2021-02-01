import { stringify, v4 as uuidv4 } from 'uuid'
import { Storage } from '@google-cloud/storage'

export function uploadFileToGCS(upFile: Buffer, onFinish: (fileName: string) => void, onError: (err: Error) => void) {
    const fileName = uuidv4() + '.mp3';
    const storage = new Storage();
    const stream = storage.bucket(EnvironmentVariable.bucketName).file(fileName).createWriteStream({
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