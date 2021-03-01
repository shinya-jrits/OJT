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
  drawForm?: boolean;
  message?: string
  videoFile?: File;
  emailAddress?: string;
}

class App extends React.Component<{}, convertVideoToAudioStateInterface> {
  requestUrl: string;
  constructor() {
    super({});
    this.uploadForm = this.uploadForm.bind(this);
    this.state = { progress: 0, isProcessing: false };
    if (process.env.REACT_APP_POST_URL == null) {
      throw new Error('リクエスト先URLの取得に失敗しました');
    }
    this.requestUrl = process.env.REACT_APP_POST_URL;
  }

  async componentDidMount() {
    document.title = 'Teams会議の文字起こしツール';

    this.setState({
      drawForm: process.env.NODE_ENV === "development"
        ? true
        : await isRWAN()
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
      this.setState({
        message: "メールアドレスを入力してください"
      });
      return;
    }
    if (this.state.videoFile == null) {
      this.setState({
        message: "ファイルを選択してください"
      });
      return;
    }
    const ffmpeg = createFFmpeg({
      log: true
    });
    this.setState({
      progress: 0,
      isProcessing: true,
      message: ""
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
      this.setState({
        isProcessing: false,
        message: "ファイルの変換に失敗しました"
      });
      console.error(error);
      return;
    }
    if (audioBlob.size > 30 * 1024 * 1024) {
      this.setState({
        isProcessing: false,
        message: "容量が大きすぎます。もっと短い動画ファイルを変換してください"
      })
      return;
    }
    try {
      this.setState({
        message: "~送信中~"
      })
      await requestTranscription(this.state.emailAddress, audioBlob, this.requestUrl);
      console.log("送信に成功しました");
      this.setState({
        message: "送信に成功しました。文字起こし結果は " + this.state.emailAddress
          + " に送られます。\n" + "結果の返信には動画時間の半分程度かかりますが、ブラウザは閉じて構いません。"
      });
    }
    catch (error) {
      console.error(error);
      this.setState({
        message: "送信に失敗しました。"
      });
    } finally {
      this.setState({
        isProcessing: false,
      });
    }
  }

  uploadForm() {
    return (
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
        <div className="message">{
          this.state.message?.split('\n').map((str, index) => (
            <React.Fragment key={index}>{str}<br /></React.Fragment>
          ))
        }</div>
      </form>
    )
  }

  render() {
    if (this.state.drawForm == null) return <p>Loading page...</p>;
    return (
      <div>
        <h1>OJTテーマ：Teams会議の文字起こしツール</h1>
        {this.state.drawForm
          ? <this.uploadForm />
          : <h3 className="R-WAN">※R-WANで接続してください</h3>
        }
      </div>
    );
  }
}

export default App;
