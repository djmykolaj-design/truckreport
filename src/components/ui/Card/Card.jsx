import "./Card.css";

export default function Card({
    children,
    title,
    subtitle,
    icon,
    actions,
    footer,
    className = "",
}) {
    return (
        <div className={`tr-card ${className}`}>

            {(title || subtitle || icon || actions) && (

                <div className="tr-card-header">

                    <div className="tr-card-title">

                        {icon && (
                            <span className="tr-card-icon">
                                {icon}
                            </span>
                        )}

                        <div>

                            {title && (
                                <h3>{title}</h3>
                            )}

                            {subtitle && (
                                <p>{subtitle}</p>
                            )}

                        </div>

                    </div>

                    {actions}

                </div>

            )}

            <div className="tr-card-body">

                {children}

            </div>

            {footer && (

                <div className="tr-card-footer">

                    {footer}

                </div>

            )}

        </div>
    );
}