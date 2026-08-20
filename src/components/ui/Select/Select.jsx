import "./Select.css";

export default function Select({
    children,
    value,
    onChange,
    disabled = false,
    fullWidth = true,
}) {
    return (
        <select
            className={`tr-select ${
                fullWidth ? "tr-select-full" : ""
            }`}
            value={value}
            onChange={onChange}
            disabled={disabled}
        >
            {children}
        </select>
    );
}