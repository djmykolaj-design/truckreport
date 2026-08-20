import "./Section.css";

export default function Section({
    title,
    subtitle,
    icon,
    actions,
    children,
    className = "",
}) {
    return (
        <section className={`tr-section ${className}`}>

            <div className="tr-section-header">

                <div className="tr-section-title">

                    {icon && (
                        <span className="tr-section-icon">
                            {icon}
                        </span>
                    )}

                    <div>

                        <h2>{title}</h2>

                        {subtitle && (
                            <p>{subtitle}</p>
                        )}

                    </div>

                </div>

                {actions && (
                    <div className="tr-section-actions">
                        {actions}
                    </div>
                )}

            </div>

            <div className="tr-section-body">
                {children}
            </div>

        </section>
    );
}