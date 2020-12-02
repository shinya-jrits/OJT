import React from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';


interface SquarePropsInterface {
}

interface SquareStateInterface {
  file: File;
}

class MovieForm extends React.Component<SquarePropsInterface, SquareStateInterface> {
  constructor(props: SquarePropsInterface) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  private async convertVideoToAudio(file: File): Promise<File> {
    const ffmpeg = createFFmpeg({
      log: true,
    });
    await ffmpeg.load();
    const fetchedFile = await fetchFile(file);
    ffmpeg.FS('stream', file.name, fetchedFile);
    await ffmpeg.run('-i', file.name, 'audio.wav');
    return ffmpeg.FS('readFile', 'audio.wav');

  }
  private handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files != null) {
      Array.from(event.target.files).forEach(file => {
        this.setState({
          file: file,
        });
      })
    }
  }
  handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {

    const result = this.convertVideoToAudio(this.state.file);
    result.then((result) => {
      const data = window.URL.createObjectURL(new Blob([result]));
      const url = document.createElement('a');
      url.href = data;
      url.setAttribute('download', 'audio.wav');
      url.click();
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

