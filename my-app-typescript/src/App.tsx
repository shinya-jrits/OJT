import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';

interface SquareStateInterface {
  videoFile: File;
}

class MovieForm extends React.Component<{}, SquareStateInterface> {
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
  }
  handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {

    const result = this.convertVideoToAudio(this.state.videoFile);
    result.then((result) => {
      const url = window.URL.createObjectURL(new Blob([result]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('download', 'audio.wav');
      anchor.click();

    })
    event.preventDefault();//ページ遷移を防ぐため
  }
  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>
            Name:
          <input type="file" accept="video/mp4" onChange={this.handleChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

export default MovieForm;

