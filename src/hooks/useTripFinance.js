import { calculateFinance } from "../utils/financeCalculator";

export default function useTripFinance(trip) {
    return calculateFinance(trip);
}