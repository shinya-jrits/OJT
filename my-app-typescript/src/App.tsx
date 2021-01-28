import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import axios from 'axios';
import ProgressBar from '@ramonak/react-progress-bar';

interface convertVideoToAudioStateInterface {
  progress: number;
  isProcessing: boolean;
  videoFile?: File;
  emailAddress?: string;
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
    this.state = { progress: 0, isProcessing: false };
  }

  componentDidMount() {
    document.title = 'Teams会議の文字起こしツール';
  }

  private async convertVideoToAudio(videoFile: File): Promise<Blob> {
    const ffmpeg = createFFmpeg({
      log: true
    });
    this.setState({
      progress: 0,
      isProcessing: true
    });
    await ffmpeg.load();
    const fetchedFile = await fetchFile(videoFile);
    ffmpeg.FS('writeFile', 'video', fetchedFile);
    ffmpeg.setProgress(({ ratio }) => {
      this.setState({
        progress: Math.round(100 * ratio)
      });
    });
    await ffmpeg.run('-i', 'video', '-ac', '1', '-ab', '54k', 'audio.mp3');
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
    } finally {
      this.setState({
        isProcessing: false
      });
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
          <input type="submit" value="送信" disabled={this.state.isProcessing} />
          {this.state.isProcessing
            ? <p><ProgressBar completed={this.state.progress} /></p>
            : ''
          }
        </form>
      </div>
    );
  }
}

export default MovieForm;
