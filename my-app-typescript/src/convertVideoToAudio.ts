import { FFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

/**
 * 動画ファイルを音声ファイルに変換する
 * @param videoFile 変換元ファイル 
 * @param ffmpeg 変換を実行するメソッド
 */
export async function convertVideoToAudio(videoFile: File, ffmpeg: FFmpeg): Promise<Blob> {
    await ffmpeg.load();
    const fetchedFile = await fetchFile(videoFile);
    ffmpeg.FS('writeFile', 'video', fetchedFile);
    await ffmpeg.run('-i', 'video', '-ac', '1', '-ab', '54k', 'audio.mp3');
    const resultFile = ffmpeg.FS('readFile', 'audio.mp3');
    const resultBlob = new Blob([resultFile.buffer], {
        type: 'audio/mp3'
    });
    return resultBlob;
}