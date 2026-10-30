import "./DocumentViewer.css";
import {
    TransformWrapper,
    TransformComponent,
} from "react-zoom-pan-pinch";
import {
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Maximize2,
    Download,
    X,
} from "lucide-react";

const ICON = 18;

export default function DocumentViewer({
    previewDoc,
    documents,
    previewIndex,
    setPreviewIndex,
}) {
    if (!previewDoc) return null;

    const fileData = previewDoc.fileData || "";
    const hasFile = Boolean(fileData);

    const isImage =
        fileData.startsWith("data:image") ||
        /\.(png|jpe?g|webp|gif)$/i.test(previewDoc.fileName || "");

    const isPdf =
        fileData.startsWith("data:application/pdf") ||
        /\.pdf$/i.test(previewDoc.fileName || "");

    return (
        <div
            className="viewer-overlay"
            onClick={() => setPreviewIndex(null)}
        >
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={8}
                centerOnInit
                centerZoomedOut
                limitToBounds={true}
                wheel={{ step: 0.15 }}
                doubleClick={{ disabled: false }}
                pinch={{ step: 5 }}
            >
                {({ zoomIn, zoomOut, resetTransform, state }) => (
                    <>
                        <div
                            className="viewer-toolbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="viewer-left">
                                <button
                                    className="viewer-btn"
                                    aria-label="Попередній документ"
                                    onClick={() =>
                                        setPreviewIndex(
                                            previewIndex === 0
                                                ? documents.length - 1
                                                : previewIndex - 1
                                        )
                                    }
                                >
                                    <ChevronLeft size={ICON} />
                                </button>

                                <button
                                    className="viewer-btn"
                                    aria-label="Наступний документ"
                                    onClick={() =>
                                        setPreviewIndex(
                                            previewIndex === documents.length - 1
                                                ? 0
                                                : previewIndex + 1
                                        )
                                    }
                                >
                                    <ChevronRight size={ICON} />
                                </button>

                                <div className="viewer-title">
                                    {previewDoc.fileName}
                                </div>
                            </div>

                            <div className="viewer-right">
                                <button
                                    className="viewer-btn"
                                    aria-label="Зменшити"
                                    onClick={() => zoomOut()}
                                >
                                    <Minus size={ICON} />
                                </button>

                                <div className="viewer-zoom">
                                    {Math.round((state?.scale || 1) * 100)}%
                                </div>

                                <button
                                    className="viewer-btn"
                                    aria-label="Збільшити"
                                    onClick={() => zoomIn()}
                                >
                                    <Plus size={ICON} />
                                </button>

                                <button
                                    className="viewer-btn"
                                    aria-label="Скинути масштаб"
                                    onClick={() => resetTransform()}
                                >
                                    <Maximize2 size={ICON} />
                                </button>

                                {hasFile && (
                                    <a
                                        href={fileData}
                                        download={previewDoc.fileName}
                                        className="viewer-download"
                                        aria-label="Завантажити"
                                    >
                                        <Download size={ICON} />
                                    </a>
                                )}

                                <button
                                    className="viewer-close"
                                    aria-label="Закрити"
                                    onClick={() => setPreviewIndex(null)}
                                >
                                    <X size={ICON} />
                                </button>
                            </div>
                        </div>

                        <div
                            className="viewer-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="viewer-center">
                                <TransformComponent
                                    wrapperStyle={{ width: "100%", height: "100%" }}
                                    contentStyle={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {!hasFile ? (
                                        <div className="viewer-error">
                                            Файл не збережено. Завантаж документ ще раз.
                                        </div>
                                    ) : isImage ? (
                                        <img
                                            src={fileData}
                                            alt={previewDoc.fileName}
                                            className="viewer-image"
                                            draggable={false}
                                        />
                                    ) : isPdf ? (
                                        <iframe
                                            src={fileData}
                                            title={previewDoc.fileName}
                                            className="viewer-pdf"
                                        />
                                    ) : (
                                        <div className="viewer-error">
                                            Неможливо переглянути цей тип файлу.
                                        </div>
                                    )}
                                </TransformComponent>
                            </div>
                        </div>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}