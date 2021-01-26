import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import axios from 'axios';

interface convertVideoToAudioStateInterface {
  videoFile: File | null;
  emailAddress: string;
  buttonText: string;
  buttonDisabled: boolean;
}

function assertIsSingle(files: FileList | null): asserts files is NonNullable<FileList> {
  if (files === undefined || files === null) {
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
    this.state = { videoFile: null, emailAddress: '', buttonText: '送信', buttonDisabled: false };
  }
  private async convertVideoToAudio(videoFile: File): Promise<Blob> {
    const ffmpeg = createFFmpeg({
      log: true
    });
    ffmpeg.setProgress(({ ratio }) => {
      if (ratio < 1) {
        this.setState({
          buttonText: Math.round(100 * ratio) + '%',
          buttonDisabled: true
        });
      } else {
        this.setState({
          buttonText: '送信',
          buttonDisabled: false
        })
      }
    })
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
    const address = this.state.emailAddress;
    if (address == null || address === "") {
      window.alert("メールアドレスを入力してください");
      return;
    }
    if (this.state.videoFile == null) {
      window.alert("ファイルを選択してください");
      return;
    }
    const audioFile = await this.convertVideoToAudio(this.state.videoFile);
    const formData = new FormData();
    formData.append('text', address);
    formData.append('file', audioFile);

    await axios.post("http://localhost/api/", formData, {
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
      })

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
          <input type="submit" value={this.state.buttonText} disabled={this.state.buttonDisabled} />
        </form>
      </div>
    );
  }
}

export default MovieForm;

