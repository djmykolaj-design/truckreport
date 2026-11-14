import { useCallback, useEffect, useState } from "react";
import {
  loadJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  loadCompanyMembers,
  setMemberRole,
  removeMember,
} from "../../services/company";
import {
  loadCompanyDrivers,
  addCompanyDriver,
  updateCompanyDriver,
} from "../../services/office";
import { ROLE_LABELS, isBoss } from "../../services/profile";

const panel = {
  marginBottom: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
};

const smallBtn = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 12px",
  background: "transparent",
  color: "var(--text)",
  fontWeight: 600,
  cursor: "pointer",
};

const okBtn = {
  ...smallBtn,
  border: "none",
  background: "var(--primary)",
  color: "#06210f",
};

const rowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  padding: "10px 0",
  borderTop: "1px solid var(--border)",
};

function normName(value) {
  return String(value || "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

// Якщо замість імені в профілі лежить пошта, беремо частину до «@»
function displayName(value) {
  const text = String(value || "").trim();
  if (!text) return "Водій";
  return text.includes("@") ? text.split("@")[0] : text;
}

// Усі працівники з роллю «Водій» мають бути й у списку водіїв фірми
// (звідти беруться водії при створенні рейсу й Шенген).
// Блокування: якщо синхронізація вже йде, чекаємо її, а не запускаємо другу.
let syncing = null;

function syncDrivers(members) {
  if (syncing) return syncing;

  syncing = (async () => {
    const drivers = await loadCompanyDrivers();
    let changed = false;

    for (const member of members.filter((m) => m.role === "driver")) {
           const existing = drivers.find((d) => d.user_id === member.id);

      if (existing) {
        // Працівник вже в списку: якщо він вказав справжнє ім'я, оновлюємо запис
        const hasRealName = member.full_name && !String(member.full_name).includes("@");

        if (hasRealName && normName(existing.full_name) !== normName(member.full_name)) {
          if (await updateCompanyDriver(existing.id, { full_name: member.full_name })) {
            existing.full_name = member.full_name;
            changed = true;
          }
        }
        continue;
      }

      const key = normName(member.full_name);
      const sameName = key
        ? drivers.find((d) => !d.user_id && normName(d.full_name) === key)
        : null;

      if (sameName) {
        // Така людина вже є у списку без акаунта: прив'язуємо акаунт
        if (await updateCompanyDriver(sameName.id, { user_id: member.id })) {
          sameName.user_id = member.id;
          changed = true;
        }
      } else if (await addCompanyDriver(displayName(member.full_name), member.id)) {
        drivers.push({
          id: `new-${member.id}`,
          user_id: member.id,
          full_name: member.full_name,
        });
        changed = true;
      }
    }

    return changed;
  })().finally(() => {
    syncing = null;
  });

  return syncing;
}

export default function TeamPanel({ profile, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [picks, setPicks] = useState({});
  const [busy, setBusy] = useState(false);

  const viewerIsBoss = isBoss(profile);

  // Заступника призначає лише керівник
  const assignable = viewerIsBoss
    ? ["driver", "logist", "mechanic", "deputy"]
    : ["driver", "logist", "mechanic"];

  const reload = useCallback(async () => {
    const [reqs, mems] = await Promise.all([
      loadJoinRequests(),
      loadCompanyMembers(),
    ]);
    setRequests(reqs);
    setMembers(mems);

    // Водіїв без запису у списку водіїв додаємо автоматично
    const changed = await syncDrivers(mems);
    if (changed && onChanged) await onChanged();
  }, [onChanged]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterChange = async () => {
    await reload();
    if (onChanged) await onChanged();
  };

  const approve = async (request) => {
    if (busy) return;
    setBusy(true);
    const role = picks[request.id] || "driver";
    const ok = await approveJoinRequest(request.id, role);
    setBusy(false);
    if (ok) await afterChange();
  };

  const reject = async (request) => {
    if (busy) return;
    if (!window.confirm(`Відхилити заявку від «${request.requester_name || "користувача"}»?`)) {
      return;
    }
    setBusy(true);
    const ok = await rejectJoinRequest(request.id);
    setBusy(false);
    if (ok) await afterChange();
  };

  const changeRole = async (member, role) => {
    if (busy || role === member.role) return;
    setBusy(true);
    const ok = await setMemberRole(member.id, role);
    setBusy(false);
    if (ok) await afterChange();
  };

  const remove = async (member) => {
    if (busy) return;
    if (
      !window.confirm(
        `Вивести «${member.full_name || "працівника"}» з фірми? Його рейси перестануть бути видимі фірмі.`
      )
    ) {
      return;
    }
    setBusy(true);
    const ok = await removeMember(member.id);
    setBusy(false);
    if (ok) await afterChange();
  };

  const canEditMember = (member) => {
    if (member.role === "boss") return false;
    if (member.id === profile.id) return false;
    if (member.role === "deputy" && !viewerIsBoss) return false;
    return true;
  };

  return (
    <details open={requests.length > 0} style={panel}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Заявки й працівники
        {requests.length > 0 && (
          <span style={{ color: "var(--primary)", marginLeft: 8 }}>
            нових: {requests.length}
          </span>
        )}
      </summary>

      <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "10px 0" }}>
        Людина вводить код вашої фірми й потрапляє сюди. Доки ви не підтвердите
        заявку, вона нічого в фірмі не бачить. Працівники з роллю «Водій» самі
        додаються до списку водіїв.
      </p>

      {requests.length === 0 && (
        <div style={{ color: "var(--text-secondary)", fontSize: 14, padding: "6px 0" }}>
          Нових заявок немає.
        </div>
      )}

      {requests.map((request) => (
        <div key={request.id} style={rowStyle}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600 }}>
              {request.requester_name || "Без імені"}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              {new Date(request.created_at).toLocaleDateString("uk-UA")}
            </div>
          </div>

          <select
            value={picks[request.id] || "driver"}
            onChange={(e) =>
              setPicks((prev) => ({ ...prev, [request.id]: e.target.value }))
            }
            style={{ ...inputStyle, minWidth: 150 }}
          >
            {assignable.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => approve(request)} style={okBtn} disabled={busy}>
            Підтвердити
          </button>
          <button type="button" onClick={() => reject(request)} style={smallBtn} disabled={busy}>
            Відхилити
          </button>
        </div>
      ))}

      <div style={{ fontWeight: 600, margin: "16px 0 4px" }}>
        Працівники фірми ({members.length})
      </div>

      {members.map((member) => {
        const editable = canEditMember(member);
        const isMe = member.id === profile.id;

        return (
          <div key={member.id} style={rowStyle}>
            <div style={{ flex: 1, minWidth: 160, fontWeight: 500 }}>
              {member.full_name || "Без імені"}
              {isMe ? " (ви)" : ""}
            </div>

            {editable ? (
              <>
                <select
                  value={member.role}
                  onChange={(e) => changeRole(member, e.target.value)}
                  style={{ ...inputStyle, minWidth: 150 }}
                  disabled={busy}
                >
                  {assignable.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>

                <button type="button" onClick={() => remove(member)} style={smallBtn} disabled={busy}>
                  Вивести
                </button>
              </>
            ) : (
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {ROLE_LABELS[member.role] || member.role}
              </span>
            )}
          </div>
        );
      })}
    </details>
  );
}