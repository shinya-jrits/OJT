import React from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import ProgressBar from '@ramonak/react-progress-bar';
import { convertVideoToAudio } from './convertVideoToAudio'
import { requestTranscription } from './requestTranscription'
import { assertIsSingle } from './assertIsSingle'
import './App.css'
import { isRWAN } from './isRWAN'

interface convertVideoToAudioStateInterface {
  progress: number;
  isProcessing: boolean;
  isRWAN?: boolean;
  message?: string
  videoFile?: File;
  emailAddress?: string;
}

class App extends React.Component<{}, convertVideoToAudioStateInterface> {
  requestUrl: string;
  constructor() {
    super({});
    this.state = { progress: 0, isProcessing: false };
    if (process.env.REACT_APP_POST_URL == null) {
      throw new Error('リクエスト先URLの取得に失敗しました');
    }
    this.requestUrl = process.env.REACT_APP_POST_URL;
  }

  async componentDidMount() {
    document.title = 'Teams会議の文字起こしツール';
    this.setState({
      isRWAN: await isRWAN()
    });
  }

  /**
   * 入力フォームの変更をstateに保存する
   * @param event 変更された部分
   */
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

  /**
   * 動画ファイルを変換して、メールアドレスと一緒に文字起こしリクエストをバックエンドに送信する
   * @param event フォームインベント
   */
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
    let audioBlob: Blob;
    try {
      audioBlob = await convertVideoToAudio(this.state.videoFile, ffmpeg);
    } catch (error) {
      window.alert('ファイルの変換に失敗しました');
      this.setState({
        isProcessing: false
      });
      console.error(error);
      return;
    }
    try {
      this.setState({
        message: "~送信中~"
      })
      await requestTranscription(this.state.emailAddress, audioBlob, this.requestUrl);
      console.log("送信に成功しました");
      window.alert("送信に成功しました");
    }
    catch (error) {
      console.error(error);
      window.alert("送信に失敗しました");
    } finally {
      this.setState({
        isProcessing: false,
        message: ""
      });
    }
  }

  render() {
    if (this.state.isRWAN == null) return <p>Loading page...</p>;
    return (
      <div>
        <h1>OJTテーマ：Teams会議の文字起こしツール</h1>
        {!this.state.isRWAN
          ? <h3 className="R-WAN">※R-WANで接続してください</h3>
          :

          <form onSubmit={this.handleSubmit}>
            <p>
              <label>結果を受け取るメールアドレス : <input type="email" minLength={1} name="mail"
                placeholder="info@example.com" onChange={this.handleChange} /></label>
            </p>
            <p>
              <label>文字起こしを行う動画ファイル : <input type="file" accept="video/mp4"
                onChange={this.handleChange} /></label>
            </p>
            <p className="howToMessage">※1時間までのMP4ファイルを選択してください</p>
            <input type="submit" value="送信" disabled={this.state.isProcessing} />
            {this.state.isProcessing
              ? <p><ProgressBar completed={this.state.progress} /></p>
              : ''
            }
            <p className="message">{this.state.message}</p>
          </form>
        }
      </div>
    );
  }
}

export default App;
