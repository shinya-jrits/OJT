import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import axios from 'axios';
import { Buffer } from 'buffer';

interface convertVideoToAudioStateInterface {
  videoFile: File;
  emailAddress: string;
}

function assertCheckFileListSingle(files: FileList | null): asserts files is NonNullable<FileList> {
  if (files === undefined || files === null) {
    throw new Error(
      `filesが不正な値です,${files}でした`
    );
  } else if (files.length !== 1) {
    throw new Error(
      `files.lengthが不正な値です,${files.length}でした`
    );
  }
}

class MovieForm extends React.Component<{}, convertVideoToAudioStateInterface> {
  private async convertVideoToAudio(videoFile: File): Promise<File> {
    const ffmpeg = createFFmpeg({
      log: true,
    });
    await ffmpeg.load();
    const fetchedFile = await fetchFile(videoFile);
    ffmpeg.FS('writeFile', videoFile.name, fetchedFile);
    await ffmpeg.run('-i', videoFile.name, 'audio.wav');
    return ffmpeg.FS('readFile', 'audio.wav');
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    assertCheckFileListSingle(event.target.files);
    this.setState({
      videoFile: event.target.files[0],
    });


    if (event.target.type === 'email') {
      console.log(event.target.value);
      this.setState({
        emailAddress: event.target.value,
      });
    }
  }

  handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    try {
      event.preventDefault();//ページ遷移を防ぐため
      const address = this.state.emailAddress;
      if (address == null || address === "") {
        window.alert("メールアドレスを入力してください")
        return;
      }
      const audioFile = await this.convertVideoToAudio(this.state.videoFile);
      const encodedFile = Buffer.from(audioFile).toString('base64');
      await axios.post("http://localhost:4000/api/", {
        mail: address,
        file: encodedFile
      });
      console.log("post request success");
      window.alert("送信に成功しました");
    } catch (error) {
      console.log(console.error);
      window.alert("送信に失敗しました");
    }
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
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

export default MovieForm;

