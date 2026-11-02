import Card from "../../ui/Card/Card";
import Input from "../../ui/Input/Input";
import PrimaryButton from "../../ui/Button/PrimaryButton";

const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    color: "var(--text-secondary, #94a3b8)",
};

export default function SchengenForm({
    start,
    end,
    setStart,
    setEnd,
    onAdd,
    error,
}) {
    return (
        <Card
            title="Додати перебування"
            subtitle="Вкажіть дату в'їзду в Шенгенську зону й дату виїзду"
        >
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Дата в'їзду</label>
                <Input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>
                    Дата виїзду (залиште порожньою, якщо ще в зоні)
                </label>
                <Input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                />
            </div>

            {error && (
                <p
                    role="alert"
                    style={{
                        margin: "0 0 12px",
                        fontSize: 14,
                        color: "var(--danger, #ef4444)",
                    }}
                >
                    {error}
                </p>
            )}

            <PrimaryButton fullWidth onClick={onAdd}>
                Додати перебування
            </PrimaryButton>
        </Card>
    );
}