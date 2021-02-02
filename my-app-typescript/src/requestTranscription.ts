import axios from 'axios';

export function requestTranscription(emailAddress: string, audioFile: File) {
    const formData = new FormData;
    formData.append("text", emailAddress);
    formData.append("file", audioFile);
    const postUrl = process.env.REACT_APP_POST_URL;
    if (postUrl == null) {
        console.error("POST先のURLが指定されていません");
        window.alert("送信に失敗しました");
        return;
    }

    axios.post(postUrl, formData, {
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
        });

}