import "./UploadButton.css";

export default function UploadButton({
    onChange,
    fileName,
    disabled,
}) {
    return (
        <label className="upload-button">
            <input
                type="file"
                onChange={onChange}
                disabled={disabled}
                hidden
            />

            <div className="upload-content">
                <div className="upload-icon">
                    📎
                </div>

                <div className="upload-title">
                    Натисніть або перетягніть файл
                </div>

                <div className="upload-subtitle">
                    JPG • PNG • PDF
                </div>

                {fileName && (
                    <div className="upload-file">
                        {fileName}
                    </div>
                )}
            </div>
        </label>
    );
}