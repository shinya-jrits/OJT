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

interface LongRunningRecognizeResponse {
    results: { alternatives: { transcript: string }[] }[];
}

function generateILongRunningRecognizeResponse(transcripts: string[])
    : LongRunningRecognizeResponse {
    return {
        results: transcripts.map(t => {
            return {
                alternatives: [
                    {
                        transcript: t
                    }
                ]
            }
        })
    }
}

describe('speechToText', () => {
    it('文字起こしに成功', async () => {
        mockPromise.mockResolvedValue([generateILongRunningRecognizeResponse(["hogehoge"])]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBe("hogehoge");
    });

    it('複数行の文字起こしに成功', async () => {
        mockPromise.mockResolvedValue(
            [generateILongRunningRecognizeResponse(["いい天気ですね。", "そうですね。"])]
        );
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBe("いい天気ですね。\nそうですね。");
    });

    it('文字を検出できない', async () => {
        mockPromise.mockResolvedValue([generateILongRunningRecognizeResponse([""])]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBeNull;
    });

    it('文字起こしに失敗', async () => {
        mockPromise.mockResolvedValue([{}]);
        const resultSpeechToText = await speechToText('fileName', 'bucketName',
            mockSpeechClient as unknown as v1p1beta1.SpeechClient);
        expect(resultSpeechToText).toBeNull;
    });
})