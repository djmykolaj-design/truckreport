import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  uploadCompanyFile,
  removeCompanyFile,
  useCompanyFileUrl,
} from "../../services/companyFiles";

const smallBtn = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "6px 10px",
  background: "transparent",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

export default function VehiclePhoto({ vehicle, canManage, onChanged }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const url = useCompanyFileUrl(vehicle.photo_path);

  if (!vehicle.photo_path && !canManage) return null;

  const savePath = async (path) => {
    const { data, error } = await supabase
      .from("fleet_vehicles")
      .update({ photo_path: path })
      .eq("id", vehicle.id)
      .select("id");

    return !error && Boolean(data?.length);
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);

    try {
      const path = await uploadCompanyFile(vehicle.company_id, "vehicles", file);
      const saved = await savePath(path);

      if (!saved) {
        await removeCompanyFile(path);
        alert("Не вдалося зберегти фото. Спробуйте ще раз.");
      } else {
        await removeCompanyFile(vehicle.photo_path);
        if (onChanged) await onChanged();
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Не вдалося завантажити фото");
    }

    setBusy(false);
  };

  const onRemove = async () => {
    if (!window.confirm("Прибрати фото машини?")) return;

    setBusy(true);

    if (await savePath(null)) {
      await removeCompanyFile(vehicle.photo_path);
      if (onChanged) await onChanged();
    } else {
      alert("Не вдалося прибрати фото");
    }

    setBusy(false);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {vehicle.photo_path && (
        <a href={url || undefined} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={vehicle.name}
            style={{
              display: "block",
              width: "100%",
              maxWidth: 300,
              height: 170,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-light)",
            }}
          />
        </a>
      )}

      {canManage && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            style={smallBtn}
          >
            {busy
              ? "Завантаження…"
              : vehicle.photo_path
                ? "Замінити фото"
                : "Додати фото"}
          </button>

          {vehicle.photo_path && !busy && (
            <button type="button" onClick={onRemove} style={smallBtn}>
              Прибрати
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            style={{ display: "none" }}
          />
        </div>
      )}
    </div>
  );
}