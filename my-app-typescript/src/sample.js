import * as React from 'react';
import { useFileUpload } from "use-file-upload";

const Sample = () => {
    const defaultSrc =
        "https://www.pngkit.com/png/full/301-3012694_account-user-profile-avatar-comments-fa-user-circle.png";

    const [files, selectFiles] = useFileUpload();
    return (
        <div>
            <img src={files?.source || defaultSrc} alt="preview" />
            <div>
                <button
                    onClick={() =>
                        selectFiles({ accept: "video/*" }, ({ name, size, source, file }) => {
                            console.log("Files Selected", { name, size, source, file });
                        })
                    }
                >
                    ‰æ‘œ‚ðƒAƒbƒv
      </button>
            </div>
        </div>
    );
}

export default Sample;