import "./PrimaryButton.css";

export default function PrimaryButton({
    children,
    icon,
    onClick,
    disabled = false,
    loading = false,
    fullWidth = false,
    size = "md",
    variant = "primary",
    type = "button",
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                tr-btn
                tr-btn-${variant}
                tr-btn-${size}
                ${fullWidth ? "tr-btn-full" : ""}
            `}
        >
            {loading ? (
                <span className="tr-loader"></span>
            ) : (
                <>
                    {icon && (
                        <span className="tr-btn-icon">
                            {icon}
                        </span>
                    )}

                    <span>{children}</span>
                </>
            )}
        </button>
    );
}