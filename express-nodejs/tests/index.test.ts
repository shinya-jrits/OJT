import { uploadFileToGCS } from '../src/index'

//const StorageMock: any = jest.mock('@google-cloud/storage');
describe("GCSリクエストテスト", () => {
    test("正常系", () => {
        const testFileBuffer = Buffer.from("test test test", "base64");
        const resBucket = jest.fn();
        const resFile = jest.fn();
        const resCreateWriteStream = jest.fn();
        const resOn = jest.fn();
        const resEnd = jest.fn();
        const listenerPool: { [event: string]: () => void } = {};


        const StorageMock: any = {
            bucket: resBucket,
            file: resFile,
            createWriteStream: resCreateWriteStream,
            on: resOn,
            end: resEnd,
        }


        resBucket.mockImplementation(() => StorageMock);
        resFile.mockImplementation(() => StorageMock);
        resCreateWriteStream.mockImplementation(() => StorageMock);
        const onListener = {}
        resOn.mockImplementation((event: string, listner: () => void) => { listenerPool[event] = listner });
        resEnd.mockImplementation(() => {
            if (!listenerPool.finish) {
                throw new Error('Failed: Finish listner is undefined.')
            }
            listenerPool.finish()
        });

        uploadFileToGCS(testFileBuffer, StorageMock, (fileName: string) => {
            expect(fileName).toMatch(/.*\.wav/);
        })
    });

});
