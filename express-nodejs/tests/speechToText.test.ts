import { speechToText } from '../src/speechToText'
import { v1p1beta1 } from '@google-cloud/speech'

const mockLongRunningRecognize = jest.fn();
const mockPromise = jest.fn();

const mockSpeechClient = {
    longRunningRecognize: mockLongRunningRecognize
}

const mockLROperation = {
    promise: mockPromise
}

mockLongRunningRecognize.mockResolvedValue([mockLROperation]);

describe('speechToText', () => {
    it('文字起こしに成功', async () => {
        const mockILongRunningRecognizeResponse = {
            results: [
                {
                    alternatives: [
                        {
                            transcript: "hogehoge"
                        }
                    ]
                }
            ]
        };
        mockPromise.mockResolvedValue([mockILongRunningRecognizeResponse]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBe("hogehoge");
    });

    it('複数行の文字起こしに成功', async () => {
        const mockILongRunningRecognizeResponse = {
            results: [
                {
                    alternatives: [
                        {
                            transcript: "いい天気ですね。"
                        }
                    ]
                },
                {
                    alternatives: [
                        {
                            transcript: "そうですね。"
                        }
                    ]
                }
            ]
        };
        mockPromise.mockResolvedValue([mockILongRunningRecognizeResponse]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBe("いい天気ですね。\nそうですね。");
    });

    it('文字を検出できない', async () => {
        const mockILongRunningRecognizeResponse = {
            results: [
                {
                    alternatives: [
                        {
                            transcript: ""
                        }
                    ]
                }
            ]
        };
        mockPromise.mockResolvedValue([mockILongRunningRecognizeResponse]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBeNull;
    });

    it('文字起こしに失敗', async () => {
        const mockILongRunningRecognizeResponse = {};
        mockPromise.mockResolvedValue([mockILongRunningRecognizeResponse]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBeNull;
    });
})