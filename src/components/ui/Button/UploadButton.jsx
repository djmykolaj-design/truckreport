import "./UploadButton.css";

export default function UploadButton({
    file,
    onChange,
    disabled,
}) {
    return (
        <label className="upload-button">
            📎 {file ? file.name : "Обрати документ"}

            <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={onChange}
                disabled={disabled}
                hidden
            />
        </label>
    );
}