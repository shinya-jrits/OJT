import { FFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export class FFmpegWrapper {
    constructor(
        private readonly ffmpeg: FFmpeg
    ) { }
    setProgress(setProgress: (setRatio: number) => void): void {

        this.ffmpeg.setProgress(({ ratio }) => {//ffmpegの周辺
            setProgress(ratio);
        });
    }
    /**
     * 動画ファイルを音声ファイルに変換する
     * @param videoFile 変換元ファイル 
     * @param ffmpeg 変換を実行するメソッド
     */
    async convertVideoToAudio(videoFile: File): Promise<Blob> {
        await this.ffmpeg.load();
        const fetchedFile = await fetchFile(videoFile);
        this.ffmpeg.FS('writeFile', 'video', fetchedFile);
        await this.ffmpeg.run('-i', 'video', '-ac', '1', '-ab', '54k', 'audio.mp3');
        const resultFile = this.ffmpeg.FS('readFile', 'audio.mp3');
        const resultBlob = new Blob([resultFile.buffer], {
            type: 'audio/mp3'
        });
        return resultBlob;
    }
}