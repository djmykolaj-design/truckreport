import { useState } from "react";
import DocumentCard from "../components/business/DocumentCard";
import Card from "../components/ui/Card/Card";
import Input from "../components/ui/Input/Input";
import Select from "../components/ui/Select/Select";
import PrimaryButton from "../components/ui/Button/PrimaryButton";
import UploadButton from "../components/ui/Button/UploadButton";
import DocumentViewer from "../components/business/DocumentViewer";
import { useParams, useNavigate } from "react-router-dom";
import { saveTripToCloud } from "../services/cloudTrips";

function compressImage(file, maxWidth = 1600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("compress failed"));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };

    img.src = url;
  });
}

export default function TripDocuments() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const trips = JSON.parse(
    localStorage.getItem("cabina_trips_v4") || "[]"
  );

  const trip = trips.find((t) => t.id === Number(tripId));

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
  const [documents, setDocuments] = useState(trip?.documents || []);
  const [saving, setSaving] = useState(false);

  if (!trip) {
    return <h2 style={{ color: "white" }}>Рейс не знайдено</h2>;
  }

  const isCompleted = trip.status === "completed";

  const previewDoc =
    previewIndex !== null ? documents[previewIndex] : null;

  const persist = (updatedDocuments) => {
    const currentTrips = JSON.parse(
      localStorage.getItem("cabina_trips_v4") || "[]"
    );

    const updatedTrip = {
      ...trip,
      documents: updatedDocuments,
    };

    const updatedTrips = currentTrips.map((t) =>
      t.id === Number(tripId) ? updatedTrip : t
    );

    localStorage.setItem(
      "cabina_trips_v4",
      JSON.stringify(updatedTrips)
    );

    saveTripToCloud(updatedTrip);
  };

  const addDocument = async () => {
    if (!file) {
      alert("Оберіть файл");
      return;
    }

    setSaving(true);

    try {
      const readyFile = await compressImage(file);

      if (readyFile.size > 2.5 * 1024 * 1024) {
        alert("Файл все ще завеликий. Спробуй інше фото.");
        setSaving(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const newDocument = {
          id: Date.now(),
          type: documentType,
          comment,
          fileName: readyFile.name,
          fileData: reader.result,
          createdAt: new Date().toLocaleString("uk-UA"),
        };

        const updatedDocuments = [...documents, newDocument];

        try {
          persist(updatedDocuments);
          setDocuments(updatedDocuments);
          setComment("");
          setFile(null);
        } catch (err) {
          console.error(err);
          alert(
            "Не вистачає місця в пам'яті.\nВидали старі документи або додай менший файл."
          );
        } finally {
          setSaving(false);
        }
      };

      reader.onerror = () => {
        alert("Помилка читання файлу");
        setSaving(false);
      };

      reader.readAsDataURL(readyFile);
    } catch (e) {
      console.error(e);
      alert("Не вдалося обробити фото");
      setSaving(false);
    }
  };

  const deleteDocument = (docId) => {
    if (!window.confirm("Видалити цей документ?")) return;

    const updatedDocuments = documents.filter((doc) => doc.id !== docId);
    setDocuments(updatedDocuments);
    persist(updatedDocuments);
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
          <p>
            📅 {trip.startDate}
            {trip.endDate ? ` — ${trip.endDate}` : ""}
          </p>
        </Card>

        <Card
          title="Додати документ"
          subtitle="Фото з камери стискається автоматично"
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
            disabled={isCompleted || saving}
            onChange={(e) => setFile(e.target.files[0])}
          />

          <PrimaryButton
            onClick={addDocument}
            disabled={isCompleted || saving}
          >
            {saving ? "Обробка..." : "💾 Додати документ"}
          </PrimaryButton>
        </Card>

        <Card
          title="Документи рейсу"
          subtitle={`${documents.length} документів`}
        >
          {documents.length === 0 ? (
            <p style={{ color: "#9CA3AF" }}>Документів ще немає</p>
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