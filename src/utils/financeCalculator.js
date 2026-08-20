
export function calculateFinance(trip) {
    const expenses = trip?.expenses || [];
    const fuelEntries = trip?.fuelEntries || [];
    const exchanges = trip?.exchanges || [];

    console.log("EXCHANGES", exchanges);
    const currencies = ["EUR", "USD", "PLN", "UAH"];

    const categories = [
        "Дизель",
        "Реф",
        "Дороги",
        "Паркінг",
        "Харчування",
        "Душ",
        "Ремонт",
        "Штрафи",
        "Інше",
    ];

    const result = {};

    currencies.forEach((currency) => {
        result[currency] = {
            issued: 0,
            exchangedIn: 0,
            exchangedOut: 0,
            spent: 0,
            balance: 0,

            total: 0,
            categories: {},
        };

        categories.forEach((category) => {
            result[currency].categories[category] = 0;
        });
    });

    // Видані кошти
    result.EUR.issued = Number(trip.startEuro || 0);
    result.USD.issued = Number(trip.startUsd || 0);
    result.PLN.issued = Number(trip.startPln || 0);
    result.UAH.issued = Number(trip.startUah || 0);

    // Звичайні витрати
    expenses.forEach((expense) => {
        const currency = expense.currency;
        const category = expense.category;
        const amount = Number(expense.amount || 0);

        if (!result[currency]) return;

        result[currency].total += amount;
        result[currency].spent += amount;

        if (
            result[currency].categories[category] !== undefined
        ) {
            result[currency].categories[category] += amount;
        }
    });

  
    // Обмін валют
    exchanges.forEach((exchange) => {
        if (result[exchange.fromCurrency]) {
            result[exchange.fromCurrency].exchangedOut +=
                Number(exchange.fromAmount || 0);
        }

        if (result[exchange.toCurrency]) {
            result[exchange.toCurrency].exchangedIn +=
                Number(exchange.toAmount || 0);
        }
    });

    // Залишок
    currencies.forEach((currency) => {
        result[currency].balance =
            result[currency].issued -
            result[currency].exchangedOut +
            result[currency].exchangedIn -
            result[currency].spent;
    });

    return result;
}