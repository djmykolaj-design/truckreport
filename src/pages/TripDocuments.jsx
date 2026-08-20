import { useState } from "react";
import DocumentCard from "../components/business/DocumentCard";
import Card from "../components/ui/Card/Card";
import Input from "../components/ui/Input/Input";
import Select from "../components/ui/Select/Select";
import PrimaryButton from "../components/ui/Button/PrimaryButton";
import UploadButton from "../components/ui/Button/UploadButton";
import DocumentViewer from "../components/business/DocumentViewer";
import { useParams, useNavigate } from "react-router-dom";


export default function TripDocuments() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const trips = JSON.parse(
        localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const trip = trips.find(
        (t) => t.id === Number(tripId)
    );

    const documentTypes = [
        "CMR",
        "Invoice",
        "Packing List",
        "T1",
        "EX",
        "MRN",
        "POD",
        "Чек",
        "Фото",
        "Інше",
    ];

    const [documentType, setDocumentType] = useState("CMR");
    const [comment, setComment] = useState("");
    const [file, setFile] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(null);


    if (!trip) {
        return <h2 style={{ color: "white" }}>Рейс не знайдено</h2>;
    }

    const documents = trip.documents || [];
    const isCompleted =
        trip.status === "completed";

    const previewDoc =
        previewIndex !== null
            ? documents[previewIndex]
            : null;

    const addDocument = () => {
        if (!file) {
            alert("Оберіть файл");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const newDocument = {
                id: Date.now(),
                type: documentType,
                comment,
                fileName: file.name,
                fileData: reader.result, // Base64
                createdAt: new Date().toLocaleString("uk-UA"),
            };

            const updatedTrips = trips.map((t) =>
                t.id === trip.id
                    ? {
                        ...t,
                        documents: [
                            ...(t.documents || []),
                            newDocument,
                        ],
                    }
                    : t
            );

            localStorage.setItem(
                "cabina_trips_v4",
                JSON.stringify(updatedTrips)
            );

            setComment("");
            setFile(null);

            window.location.reload();
        };

        reader.readAsDataURL(file);
    };

    const deleteDocument = (docId) => {
        if (!window.confirm("Видалити цей документ?")) return;

        const updatedTrips = trips.map((t) => {
            if (t.id !== trip.id) return t;

            return {
                ...t,
                documents: (t.documents || []).filter(
                    (doc) => doc.id !== docId
                ),
            };
        });

        localStorage.setItem(
            "cabina_trips_v4",
            JSON.stringify(updatedTrips)
        );

        window.location.reload();
    };

    return (
        <>
            <div className="page-narrow">
                <button
                    onClick={() => navigate(`/trips?trip=${tripId}`)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "16px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#e2e8f0",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "15px",
                    }}
                >
                    ← До рейсу
                </button>
                <h1>📄 Документи</h1>

                <Card
                    title={`Рейс №${trip.tripNumber}`}
                    subtitle={`${trip.fromCity} → ${trip.toCity}`}
                >
                    <p>📅 {trip.startDate} — {trip.endDate}</p>
                </Card>

                <Card
                    title="Додати документ"
                    subtitle="Завантажте документ до рейсу"
                >
                    <Select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                    >
                        {documentTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </Select>

                    <Input
                        placeholder="Коментар (необов'язково)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <UploadButton
                        file={file}
                        disabled={isCompleted}
                        onChange={(e) =>
                            setFile(e.target.files[0])
                        }
                    />

                    <PrimaryButton
                        onClick={addDocument}
                        disabled={isCompleted}
                    >
                        💾 Додати документ
                    </PrimaryButton>
                </Card>

                <Card
                    title="Документи рейсу"
                    subtitle={`${documents.length} документів`}
                >
                    {documents.length === 0 ? (
                        <p style={{ color: "#9CA3AF" }}>
                            Документів ще немає
                        </p>
                    ) : (
                        documents.map((doc, index) => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                index={index}
                                isCompleted={isCompleted}
                                onPreview={setPreviewIndex}
                                onDelete={deleteDocument}
                            />
                        ))
                    )}
                </Card>

            </div>
            <DocumentViewer
                previewDoc={previewDoc}
                documents={documents}
                previewIndex={previewIndex}
                setPreviewIndex={setPreviewIndex}
            />
        </>
    );
}
