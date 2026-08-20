import "./ExpenseCard.css";
import { Trash2 } from "lucide-react";

export default function ExpenseCard({
    expense,
    isCompleted,
    onDelete,
}) {
    return (
        <div className="tr-expense-card">

            <div className="tr-expense-header">

                <div className="tr-expense-category">
                    {expense.category}
                </div>

                <div className="tr-expense-actions">

                    <div className="tr-expense-amount">
                        {expense.amount}
                        {expense.currency &&
                            ` ${expense.currency}`}
                    </div>

                    {!isCompleted && (
                        <button
                            className="tr-delete-btn"
                            onClick={() =>
                                onDelete(expense.id)
                            }
                            title="Видалити"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                </div>

            </div>

            {expense.comment && (
                <div className="tr-expense-comment">
                    {expense.comment}
                </div>
            )}

            <div className="tr-expense-footer">

                <div className="tr-expense-date">
                    🕒 {expense.date}
                </div>

            </div>

        </div>
    );
}