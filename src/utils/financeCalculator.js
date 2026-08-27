export function calculateFinance(trip) {
  const expenses = trip?.expenses || [];
  const exchanges = trip?.exchanges || [];
  const fundsReceived = trip?.fundsReceived || [];

  const currencies = ["EUR", "USD", "PLN", "UAH"];

  const result = {};

  currencies.forEach((currency) => {
    result[currency] = {
      issued: 0,
      received: 0,
      exchangedIn: 0,
      exchangedOut: 0,
      spent: 0,
      balance: 0,
      total: 0,
    };
  });

  result.EUR.issued = Number(trip.startEuro || 0);
  result.USD.issued = Number(trip.startUsd || 0);
  result.PLN.issued = Number(trip.startPln || 0);
  result.UAH.issued = Number(trip.startUah || 0);

  fundsReceived.forEach((item) => {
    const currency = item.currency;
    const amount = Number(item.amount || 0);
    if (!result[currency]) return;
    result[currency].received += amount;
    result[currency].issued += amount;
  });

  expenses.forEach((expense) => {
    const currency = expense.currency;
    const amount = Number(expense.amount || 0);
    if (!result[currency]) return;
    result[currency].spent += amount;
    result[currency].total += amount;
  });

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

  currencies.forEach((currency) => {
    result[currency].balance =
      result[currency].issued -
      result[currency].exchangedOut +
      result[currency].exchangedIn -
      result[currency].spent;
  });

  return result;
}