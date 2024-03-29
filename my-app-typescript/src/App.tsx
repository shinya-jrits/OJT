import React, { ReactElement } from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import ProgressBar from '@ramonak/react-progress-bar';
import { FFmpegWrapper } from './FFmpegWrapper';
import { requestTranscription } from './requestTranscription';
import { assertIsSingle } from './assertIsSingle';
import './App.css';
import { isRWAN } from './isRWAN';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline, GoogleLogout } from 'react-google-login';
import { loginFailureMessage } from './loginFailureMessage';

interface convertVideoToAudioStateInterface {
  progress: number;
  isProcessing: boolean;
  isLoggedIn: boolean;
  drawForm?: boolean;
  message?: string
  videoFile?: File;
  emailAddress?: string;
}

interface googleLoginError {
  error: string;
}

type EmptyProps = Record<string, never>;

class App extends React.Component<EmptyProps, convertVideoToAudioStateInterface> {
  private readonly requestUrl: string;
  private readonly clientId: string;
  constructor() {
    super({});
    this.state = { progress: 0, isProcessing: false, isLoggedIn: false };
    if (process.env.REACT_APP_POST_URL == null) {
      throw new Error('リクエスト先URLの取得に失敗しました');
    }
    this.requestUrl = process.env.REACT_APP_POST_URL;
    if (process.env.REACT_APP_CLIENT_ID == null) {
      throw new Error('Oauth認証のクライアントID取得に失敗しました');
    }
    this.clientId = process.env.REACT_APP_CLIENT_ID;
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
  private readonly handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
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
   * progressbarやメッセージ領域を初期化する、プロセッシングを開始する
   */
  private readonly showProgressBar = (): void => {
    this.setState({
      progress: 0,
      isProcessing: true,
    });
  }

  /**
   * メッセージエリアにメッセージを入力する
   * @param message 表示するメッセージ
   */
  private readonly setMessage = (message: string): void => {
    this.setState({
      message: message
    });
  }

  private readonly isLoggedIn = (val: boolean): void => {
    this.setState({
      isLoggedIn: val
    });
  }

  /**
   * progressbarを表示しなくする
   */
  private readonly hideProgressBar = (): void => {
    this.setState({
      isProcessing: false,
    });
  }

  //Assertion Functionsは通常のアロー関数では動かない為
  /**
   * メールアドレスのnullチェック、文字列があるかを確認する
   * Googleアカウントでログインしないとフォームが出ないので本来ならばnullにはならないはずである
   * @param address 送信先のメールアドレス
   */
  private emailAddressIsDefine(address?: string): asserts address is string {
    if (!address) {
      this.setMessage("Googleアカウントでログインしてください");
      throw new Error('emailAddressが不正な値です');
    }
  }

  //Assertion Functionsは通常のアロー関数では動かない為
  /**
   * 入力された動画ファイルのnullチェック
   * @param videoFile 変換対象の動画ファイル
   */
  private videoFileIsDefine(videoFile?: File): asserts videoFile is File {
    if (!videoFile) {
      if (this.state.videoFile == null) {
        this.setMessage("ファイルを選択してください");
      }
      throw new Error("videoFileが不正な値です");
    }
  }

  /**
   * 動画を音声に変換する
   * @param videoFile 変換する動画ファイル
   * @returns 変換した音声ファイルを返す、変換に失敗したらnullを返す
   */
  private readonly convertVideoToAudio = async (videoFile: File): Promise<Blob | null> => {
    const setStateProgress = (ratio: number) => {
      this.setState({
        progress: Math.round(ratio * 100)
      });
    };
    const ffmpeg = new FFmpegWrapper(createFFmpeg({ log: true }), setStateProgress);

    let audioBlob: Blob;
    try {
      audioBlob = await ffmpeg.convertVideoToAudio(videoFile);
    } catch (error) {
      this.hideProgressBar();
      this.setMessage("ファイルの変換に失敗しました");
      console.error(error);
      return null;
    }
    if (audioBlob.size > 30 * 1024 * 1024) {
      this.hideProgressBar();
      this.setMessage("容量が大きすぎます。もっと短い動画ファイルを変換してください");
      return null;
    }
    return audioBlob;
  }

  /**
   * バックエンドに文字起こしをリクエストする
   * @param audioBlob 文字起こしする音声ファイル
   * @param emailAddress 結果を返すメールアドレス
   */
  private readonly requestTranscription = async (audioBlob: Blob, emailAddress: string): Promise<void> => {
    try {
      this.setMessage("~送信中~");
      await requestTranscription(emailAddress, audioBlob, this.requestUrl);
      console.log("送信に成功しました");
      this.setMessage(`送信に成功しました。文字起こし結果は ${emailAddress} に送られます。
      結果の返信には動画時間の半分程度かかりますが、ブラウザは閉じて構いません。`);
    } catch (error) {
      if (error instanceof Error) {
        if (process.env.NODE_ENV === "development") {
          this.setMessage(`${error.message} 送信に失敗しました。
          開発者に問い合わせてください。`);
        }
        if (process.env.NODE_ENV === "production") {
          this.setMessage(`${error.message} 送信に失敗しました。R-WANの接続を確認してください。
          開発者に問い合わせてください。`);
        }
      } else {
        this.setMessage(`送信に失敗しました。`);
      }
    }
  }


  /**
   * フォームの送信ボタンを押されたら呼ばれるメソッド
   * @param event フォームイベント
   */
  private readonly handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();//ページ遷移を防ぐため
    try {
      this.emailAddressIsDefine(this.state.emailAddress);
      this.videoFileIsDefine(this.state.videoFile);
    } catch {
      return;
    }
    this.showProgressBar();
    this.setMessage("");

    const audioBlob = await this.convertVideoToAudio(this.state.videoFile);
    if (audioBlob == null) {
      return;
    }

    await this.requestTranscription(audioBlob, this.state.emailAddress);

    this.hideProgressBar();
  }

  private readonly uploadForm = (): React.ReactElement => {
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

  private readonly form = (): React.ReactElement => {
    return (
      <div>
        {this.state.isLoggedIn
          ? <this.uploadForm />
          : <div>Googleアカウントでログインしてください</div>
        }
        <this.googleButton />
        <div className="message">{
          this.state.message?.split('\n').map((str, index) => (
            <React.Fragment key={index}>{str}<br /></React.Fragment>
          ))
        }</div>
      </div>
    );
  }

  /**
   * GoolgeLogin成功時のコールバック関数
   * @param response Login成功時に返されるパラメータ
   */
  private readonly onLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline): void => {
    const isGoogleLoginResponse = (val: GoogleLoginResponse | GoogleLoginResponseOffline): val is GoogleLoginResponse => {
      return 'profileObj' in val;
    };
    if (isGoogleLoginResponse(response)) {
      console.log(response.profileObj.email);
      this.isLoggedIn(true);
      this.setState({
        emailAddress: response.profileObj.email
      });
      this.setMessage("ログインしました");
    } else { //GoogleLoginResponseOfflineはOffline accessの方法でrefresh tokenを取る時のみ返す
      //基本的にはoffline accessをしないのでこちらの条件にはならない
      this.setMessage("ログインできませんでした");
    }
  }

  /**
   * GoogleLogin失敗時のコールバック関数
   * @param error エラーメッセージ
   */
  private readonly onLoginFailure = (error: googleLoginError): void => {
    this.isLoggedIn(false);
    this.setMessage(`ログインできませんでした
    ${loginFailureMessage(error.error)}`);
  }

  /**
   * GoogleLoout成功時のコールバック関数
   */
  private readonly onLogoutSuccess = (): void => {
    this.isLoggedIn(false);
    this.setMessage("ログアウトしました");
  }

  private readonly googleButton = (): ReactElement => {
    if (!this.state.isLoggedIn) {
      console.log("true");
      return (
        <GoogleLogin
          clientId={this.clientId}
          buttonText="Login"
          onSuccess={this.onLoginSuccess}
          onFailure={this.onLoginFailure}
          isSignedIn={true}
          cookiePolicy={'single_host_origin'}
        />
      );
    } else {
      return (
        <GoogleLogout
          clientId={this.clientId}
          buttonText="Logout"
          onLogoutSuccess={this.onLogoutSuccess}
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
