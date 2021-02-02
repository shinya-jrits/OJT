import React from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import ProgressBar from '@ramonak/react-progress-bar';
import { convertVideoToAudio } from './convertVideoToAudio'
import { requestTranscription } from './requestTranscription'

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

class App extends React.Component<{}, convertVideoToAudioStateInterface> {
  constructor() {
    super({});
    this.state = { progress: 0, isProcessing: false };
  }

  componentDidMount() {
    document.title = 'Teams会議の文字起こしツール';
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
    const ffmpeg = createFFmpeg({
      log: true
    });
    this.setState({
      progress: 0,
      isProcessing: true
    });
    ffmpeg.setProgress(({ ratio }) => {
      this.setState({
        progress: Math.round(100 * ratio)
      });
    });
    try {
      const audioFile = await convertVideoToAudio(this.state.videoFile, ffmpeg);
      requestTranscription(this.state.emailAddress, this.state.videoFile);
    } catch (error) {
      window.alert('ファイルの変換に失敗しました');
      console.error(error);
      return;
    } finally {
      this.setState({
        isProcessing: false
      });
    }
  }

  render() {
    return (
      <div>
        <h1>OJTテーマ：Teams会議の文字起こしツール</h1>
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

export default App;
