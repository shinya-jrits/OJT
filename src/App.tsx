import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';
import axios from 'axios';
import { Buffer } from 'buffer';

interface convertVideoToAudioStateInterface {
  videoFile: File;
  emailAddress: string;
}

class MovieForm extends React.Component<{}, convertVideoToAudioStateInterface> {
  constructor(props: {}) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

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
  private handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files != null) {
      Array.from(event.target.files).forEach(file => {
        this.setState({
          videoFile: file,
        });
      })
    }
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
      const audioFile = await this.convertVideoToAudio(this.state.videoFile);
      const encodedFile = Buffer.from(audioFile).toString('base64');
      const address = this.state.emailAddress;
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
          <label>
            <p>メールアドレス:<input type="email" name="mail" onChange={this.handleChange} /></p>
            <p>ファイル:<input type="file" accept="video/mp4" onChange={this.handleChange} /></p>
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

export default MovieForm;

