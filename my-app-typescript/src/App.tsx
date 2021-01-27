import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import axios from 'axios';

interface convertVideoToAudioStateInterface {
  videoFile: File | undefined;
  emailAddress: string | undefined;
  progress: number;
  isProcessing: boolean;
}

function assertIsSingle(files: FileList | null): asserts files is NonNullable<FileList> {
  if (files == null) {
    throw new Error(
      `filesが不正な値です,${files}でした`
    );
  } else if (files.length > 1) {
    throw new Error(
      `files.lengthが不正な値です,${files.length}でした`
    );
  }
}

class MovieForm extends React.Component<{}, convertVideoToAudioStateInterface> {
  constructor() {
    super({});
    this.state = { videoFile: undefined, emailAddress: undefined, progress: 0, isProcessing: false };
  }
  private async convertVideoToAudio(videoFile: File): Promise<Blob> {
    const ffmpeg = createFFmpeg({
      log: true
    });
    ffmpeg.setProgress(({ ratio }) => {
      if (ratio < 1) {
        this.setState({
          progress: Math.round(100 * ratio),
          isProcessing: true
        });
      } else {
        this.setState({
          progress: 0,
          isProcessing: false
        });
      }
    });
    await ffmpeg.load();
    const fetchedFile = await fetchFile(videoFile);
    ffmpeg.FS('writeFile', videoFile.name, fetchedFile);
    await ffmpeg.run('-i', videoFile.name, '-ac', '1', '-ab', '54k', 'audio.mp3');
    const resultFile = ffmpeg.FS('readFile', 'audio.mp3');
    const resultBlob = new Blob([resultFile.buffer], {
      type: 'audio/mp3'
    });
    return resultBlob;
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files != null) {
      assertIsSingle(event.target.files);
      this.setState({
        videoFile: event.target.files[0],
      });
    }


    if (event.target.type === 'email') {
      console.log(event.target.value);
      this.setState({
        emailAddress: event.target.value,
      });
    }
  }

  handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();//ページ遷移を防ぐため
    if (this.state.emailAddress == null || this.state.emailAddress === "") {
      window.alert("メールアドレスを入力してください");
      return;
    }
    if (this.state.videoFile == null) {
      window.alert("ファイルを選択してください");
      return;
    }
    const formData = new FormData();
    formData.append('text', this.state.emailAddress);
    try {
      const audioFile = await this.convertVideoToAudio(this.state.videoFile);
      formData.append('file', audioFile);
    } catch (error) {
      window.alert('ファイルの変換に失敗しました');
      console.error(error);
      return;
    }

    const postUrl = process.env.REACT_APP_POST_URL;
    if (postUrl == null) {
      console.error("POST先のURLが指定されていません");
      window.alert("送信に失敗しました");
      return;
    }

    axios.post(postUrl, formData, {
      headers: {
        'content-type': 'multipart/form-data'
      }
    })
      .then(() => {
        console.log("post request success");
        window.alert("送信に成功しました");
      })
      .catch((error) => {
        console.log(error);
        window.alert("送信に失敗しました");
      });

  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <p>
            <label>メールアドレス:<input type="email" minLength={1} name="mail" onChange={this.handleChange} /></label>
          </p>
          <p>
            <label>ファイル:<input type="file" accept="video/mp4" onChange={this.handleChange} /></label>
          </p>
          <input type="submit" value={this.state.isProcessing ? this.state.progress + '%' : '送信'} disabled={this.state.isProcessing} />
        </form>
      </div>
    );
  }
}

export default MovieForm;
