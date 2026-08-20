import "./Input.css";

export default function Input({
    label,
    icon,
    error,
    fullWidth = true,
    ...props
}) {
    return (
        <div className={`tr-input-group ${fullWidth ? "tr-input-full" : ""}`}>

            {label && (
                <label className="tr-input-label">
                    {label}
                </label>
            )}

            <div className="tr-input-wrapper">

                {icon && (
                    <span className="tr-input-icon">
                        {icon}
                    </span>
                )}

                <input
                    className="tr-input"
                    {...props}
                />

            </div>

            {error && (
                <span className="tr-input-error">
                    {error}
                </span>
            )}

        </div>
    );
}