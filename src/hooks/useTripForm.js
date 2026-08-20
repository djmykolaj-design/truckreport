import { useState } from "react";

export default function useTripForm() {
    const [tripNumber, setTripNumber] = useState("");
    const [driver, setDriver] = useState("");
    const [codriver, setCodriver] = useState("");
    const [truck, setTruck] = useState("");
    const [trailer, setTrailer] = useState("");
    const [fromCity, setFromCity] = useState("");
    const [toCity, setToCity] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [startFuel, setStartFuel] = useState("");
    const [startMileage, setStartMileage] = useState("");

    const [startEuro, setStartEuro] = useState("");
    const [startUsd, setStartUsd] = useState("");
    const [startPln, setStartPln] = useState("");
    const [startUah, setStartUah] = useState("");

    return {
        tripNumber,
        setTripNumber,

        driver,
        setDriver,

        codriver,
        setCodriver,

        truck,
        setTruck,

        trailer,
        setTrailer,

        fromCity,
        setFromCity,

        toCity,
        setToCity,

        startDate,
        setStartDate,

        endDate,
        setEndDate,

        startFuel,
        setStartFuel,

        startMileage,
        setStartMileage,

        startEuro,
        setStartEuro,

        startUsd,
        setStartUsd,

        startPln,
        setStartPln,

        startUah,
        setStartUah,
    };
}