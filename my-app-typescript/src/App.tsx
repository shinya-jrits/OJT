import React, { ReactElement } from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import ProgressBar from '@ramonak/react-progress-bar';
import { convertVideoToAudio } from './convertVideoToAudio';
import { requestTranscription } from './requestTranscription';
import { assertIsSingle } from './assertIsSingle';
import './App.css';
import { isRWAN } from './isRWAN';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline, GoogleLogout } from 'react-google-login';

interface convertVideoToAudioStateInterface {
  progress: number;
  isProcessing: boolean;
  isGoogleLogin: boolean;
  drawForm?: boolean;
  message?: string
  videoFile?: File;
  emailAddress?: string;
}

type EmptyProps = Record<string, never>;

class App extends React.Component<EmptyProps, convertVideoToAudioStateInterface> {
  requestUrl: string;
  constructor() {
    super({});
    this.form = this.form.bind(this);
    this.uploadForm = this.uploadForm.bind(this);
    this.loginButton = this.loginButton.bind(this);
    this.state = { progress: 0, isProcessing: false, isGoogleLogin: false };
    if (process.env.REACT_APP_POST_URL == null) {
      throw new Error('リクエスト先URLの取得に失敗しました');
    }
    this.requestUrl = process.env.REACT_APP_POST_URL;
  }

  async componentDidMount(): Promise<void> {
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
        message: "Googleアカウントでログインしてください"
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
      });
      return;
    }
    try {
      this.setState({
        message: "~送信中~"
      });
      await requestTranscription(this.state.emailAddress, audioBlob, this.requestUrl);
      console.log("送信に成功しました");
      this.setState({
        message: `送信に成功しました。文字起こし結果は ${this.state.emailAddress} に送られます。
              結果の返信には動画時間の半分程度かかりますが、ブラウザは閉じて構いません。`
      });
    } catch (error) {
      if (error instanceof Error) {
        if (process.env.NODE_ENV === "development") {
          this.setState({
            message: `${error.message} 送信に失敗しました。
             開発者に問い合わせてください。`
          });
        }
        if (process.env.NODE_ENV === "production") {
          this.setState({
            message: `${error.message} 送信に失敗しました。R-WANの接続を確認してください。
           開発者に問い合わせてください。`
          });
        }
      } else {
        this.setState({
          message: `送信に失敗しました。`
        });
      }
    } finally {
      this.setState({
        isProcessing: false,
      });
    }
  }

  uploadForm(): React.ReactElement {
    return (
      <form onSubmit={this.handleSubmit}>
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
      </form>
    );
  }

  form(): React.ReactElement {
    return (
      <div>
        {this.state.isGoogleLogin
          ? <this.uploadForm />
          : ""
        }
        <this.loginButton />
        <div className="message">{
          this.state.message?.split('\n').map((str, index) => (
            <React.Fragment key={index}>{str}<br /></React.Fragment>
          ))
        }</div>
      </div>
    );
  }

  isGoogleLoginResponse = (arg: GoogleLoginResponse | GoogleLoginResponseOffline): arg is GoogleLoginResponse => {
    return true;
  }

  responseGoogle = (response: GoogleLoginResponse | GoogleLoginResponseOffline): void => {
    if (this.isGoogleLoginResponse(response)) {
      console.log(response.profileObj.email);
      this.setState({
        isGoogleLogin: true,
        emailAddress: response.profileObj.email,
        message: "ログインしました"
      });
    } else {
      this.setState({
        message: response.code
      });
    }
  }

  logOutSuccess = (): void => {
    this.setState({
      isGoogleLogin: false,
      message: "ログアウトしました"
    });
  }

  loginButton(): ReactElement {
    if (!this.state.isGoogleLogin) {
      console.log("true");
      return (
        <GoogleLogin
          clientId="483600820879-5pc4lb4p1ihhoj11otsn1g5rud7ra7gk.apps.googleusercontent.com"
          buttonText="Login"
          onSuccess={this.responseGoogle}
          isSignedIn={true}
          cookiePolicy={'single_host_origin'}
        />
      );
    } else {
      return (
        <GoogleLogout
          clientId="483600820879-5pc4lb4p1ihhoj11otsn1g5rud7ra7gk.apps.googleusercontent.com"
          buttonText="Logout"
          onLogoutSuccess={this.logOutSuccess}
        ></GoogleLogout>
      );
    }
  }

  render(): React.ReactElement {
    if (this.state.drawForm == null) return <p>Loading page...</p>;
    return (
      <div>
        <h1>OJTテーマ：Teams会議の文字起こしツール</h1>
        {this.state.drawForm
          ? <this.form />
          : <h3 className="R-WAN">※R-WANで接続してください</h3>
        }
      </div>
    );
  }
}

export default App;
