import { uploadFileToGCS } from '../src/index'

describe("GCSリクエストテスト", () => {
    test("uploadFileToGCSテスト", () => {
        const testFileBuffer = Buffer.from("test test test", "base64");
        uploadFileToGCS(testFileBuffer, "test");
    })
})

test("hi", () => {
    const test = "test";
    expect(test).toBe("test");
})