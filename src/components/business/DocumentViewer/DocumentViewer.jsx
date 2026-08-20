import "./DocumentViewer.css";
import {
    TransformWrapper,
    TransformComponent,
} from "react-zoom-pan-pinch";

export default function DocumentViewer({
    previewDoc,
    documents,
    previewIndex,
    setPreviewIndex,
}) {
    if (!previewDoc) return null;

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
                wheel={{
                    step: 0.15,
                }}
                doubleClick={{
                    disabled: false,
                }}
                pinch={{
                    step: 5,
                }}
            >
                {({
                    zoomIn,
                    zoomOut,
                    resetTransform,
                    state,
                }) => (
                    <>
                        <div
                            className="viewer-toolbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="viewer-left">

                                <button
                                    className="viewer-btn"
                                    onClick={() =>
                                        setPreviewIndex(
                                            previewIndex === 0
                                                ? documents.length - 1
                                                : previewIndex - 1
                                        )
                                    }
                                >
                                    ◀
                                </button>

                                <button
                                    className="viewer-btn"
                                    onClick={() =>
                                        setPreviewIndex(
                                            previewIndex === documents.length - 1
                                                ? 0
                                                : previewIndex + 1
                                        )
                                    }
                                >
                                    ▶
                                </button>

                                <div className="viewer-title">
                                    {previewDoc.fileName}
                                </div>

                            </div>

                            <div className="viewer-right">

                                <button
                                    className="viewer-btn"
                                    onClick={() => zoomOut()}
                                    title="Зменшити"
                                >
                                    ➖
                                </button>

                                <div className="viewer-zoom">
                                    {Math.round((state?.scale || 1) * 100)}%
                                </div>

                                <button
                                    className="viewer-btn"
                                    onClick={() => zoomIn()}
                                    title="Збільшити"
                                >
                                    ➕
                                </button>

                                <button
                                    className="viewer-btn"
                                    onClick={() => resetTransform()}
                                    title="Вписати у вікно"
                                >
                                    ⛶
                                </button>

                                <a
                                    href={previewDoc.fileData}
                                    download={previewDoc.fileName}
                                    className="viewer-download"
                                >
                                    ⬇
                                </a>

                                <button
                                    className="viewer-close"
                                    onClick={() => setPreviewIndex(null)}
                                    title="Закрити"
                                >
                                    ✕
                                </button>

                            </div>
                        </div>

                        <div
                            className="viewer-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="viewer-center">

                                <TransformComponent
                                    wrapperStyle={{
                                        width: "100%",
                                        height: "100%",
                                    }}
                                    contentStyle={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {previewDoc.fileData.startsWith("data:image") ? (

                                        <img
                                            src={previewDoc.fileData}
                                            alt={previewDoc.fileName}
                                            className="viewer-image"
                                            draggable={false}
                                        />

                                    ) : previewDoc.fileData.startsWith("data:application/pdf") ? (

                                        <iframe
                                            src={previewDoc.fileData}
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