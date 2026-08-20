import "./Badge.css";

export default function Badge({
    children,
    color = "green",
    size = "md",
}) {
    return (
        <span
            className={`tr-badge tr-badge-${color} tr-badge-${size}`}
        >
            {children}
        </span>
    );
}