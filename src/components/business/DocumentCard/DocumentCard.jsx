import "./DocumentCard.css";

export default function DocumentCard({
    document,
    index,
    isCompleted,
    onPreview,
    onDelete,
}) {
    return (
        <div className="document-card">

            <div className="document-card__header">

                <div className="document-card__info">

                    <div className="document-card__type">
                        📄 {document.type}
                    </div>

                    <div className="document-card__name">
                        {document.fileName}
                    </div>

                </div>

                <div className="document-card__date">
                    🕒 {document.createdAt}
                </div>

            </div>

            {document.comment && (
                <div className="document-card__comment">
                    {document.comment}
                </div>
            )}

            <div className="document-card__actions">

                <button
                    type="button"
                    className="document-btn document-btn--blue"
                    onClick={() => onPreview(index)}
                >
                    👁 Переглянути
                </button>

                <a
                    className="document-btn document-btn--green"
                    href={document.fileData}
                    download={document.fileName}
                >
                    ⬇ Завантажити
                </a>

                <button
                    type="button"
                    className="document-btn document-btn--red"
                    disabled={isCompleted}
                    onClick={() => onDelete(document.id)}
                >
                    🗑 Видалити
                </button>

            </div>

        </div>
    );
}