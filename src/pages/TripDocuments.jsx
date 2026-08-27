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
import { supabase } from "../lib/supabase";

function compressImage(file, maxWidth = 1400, quality = 0.65) {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Спочатку увійди в акаунт");
        setSaving(false);
        return;
      }

      const readyFile = await compressImage(file);

      const ext = readyFile.type === "application/pdf" ? "pdf" : "jpg";
      const path = `${user.id}/${tripId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, readyFile, {
          contentType: readyFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert("Не вдалося завантажити файл: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("documents")
        .getPublicUrl(path);

      const newDocument = {
        id: Date.now(),
        type: documentType,
        comment,
        fileName: readyFile.name,
        url: publicData.publicUrl,
        storagePath: path,
        createdAt: new Date().toLocaleString("uk-UA"),
      };

      const updatedDocuments = [...documents, newDocument];
      setDocuments(updatedDocuments);
      persist(updatedDocuments);

      setComment("");
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("Помилка при додаванні документа");
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm("Видалити цей документ?")) return;

    const doc = documents.find((d) => d.id === docId);

    if (doc?.storagePath) {
      await supabase.storage.from("documents").remove([doc.storagePath]);
    }

    const updatedDocuments = documents.filter((d) => d.id !== docId);
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
          subtitle="Фото стискається і зберігається в хмарі"
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <PrimaryButton
            onClick={addDocument}
            disabled={isCompleted || saving}
          >
            {saving ? "Завантаження..." : "💾 Додати документ"}
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