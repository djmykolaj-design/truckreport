import Card from "../../ui/Card/Card";
import Input from "../../ui/Input/Input";
import PrimaryButton from "../../ui/Button/PrimaryButton";

export default function SchengenForm({
    start,
    end,
    setStart,
    setEnd,
    onAdd,
}) {
    return (
        <Card
            title="➕ Додати перебування"
            subtitle="Вкажіть дату в'їзду та дату виїзду із Шенгенської зони"
        >
            <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
            />

            <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
            />

            <PrimaryButton
                fullWidth
                onClick={onAdd}
            >
                ➕ Додати перебування
            </PrimaryButton>
        </Card>
    );
}