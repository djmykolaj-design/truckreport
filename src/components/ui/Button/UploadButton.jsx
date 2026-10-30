import { Paperclip } from "lucide-react";
import "./UploadButton.css";

export default function UploadButton({
    file,
    onChange,
    disabled,
}) {
    return (
        <label
            className="upload-button"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
            }}
        >
            <Paperclip size={16} />
            {file ? file.name : "Обрати документ"}

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