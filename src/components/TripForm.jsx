import "./TripForm.css";

import Card from "./ui/Card/Card";
import Input from "./ui/Input/Input";
import PrimaryButton from "./ui/Button/PrimaryButton";

export default function TripForm(props) {
    const { form, saveTrip } = props;

    const {
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
    } = form;

    return (
        <Card
            title="➕ Новий рейс"
            subtitle="Заповніть основні дані нового рейсу"
        >

            {/* =========================
                Основна інформація
            ========================= */}

            <div className="trip-form-section">

                <div className="trip-form-section-title">
                    📋 Основна інформація
                </div>

                <div className="trip-form-grid">

                    <Input
                        label="Номер рейсу"
                        icon="🚛"
                        placeholder="Введіть номер рейсу"
                        value={tripNumber}
                        onChange={(e) =>
                            setTripNumber(e.target.value)
                        }
                    />

                    <Input
                        label="Водій"
                        icon="👤"
                        placeholder="Введіть ім'я водія"
                        value={driver}
                        onChange={(e) =>
                            setDriver(e.target.value)
                        }
                    />

                    <Input
                        label="Напарник"
                        icon="👥"
                        placeholder="Введіть ім'я напарника"
                        value={codriver}
                        onChange={(e) =>
                            setCodriver(e.target.value)
                        }
                    />

                    <Input
                        label="Дата початку"
                        icon="📅"
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                            setStartDate(e.target.value)
                        }
                    />

                </div>

            </div>


            {/* =========================
                Транспорт
            ========================= */}

            <div className="trip-form-section">

                <div className="trip-form-section-title">
                    🚚 Транспорт
                </div>

                <div className="trip-form-grid">

                    <Input
                        label="Тягач"
                        icon="🚛"
                        placeholder="Номер тягача"
                        value={truck}
                        onChange={(e) =>
                            setTruck(e.target.value)
                        }
                    />

                    <Input
                        label="Причіп"
                        icon="🚚"
                        placeholder="Номер причепа"
                        value={trailer}
                        onChange={(e) =>
                            setTrailer(e.target.value)
                        }
                    />

                </div>

            </div>


            {/* =========================
                Маршрут
            ========================= */}

            <div className="trip-form-section">

                <div className="trip-form-section-title">
                    📍 Маршрут
                </div>

                <div className="trip-form-grid">

                    <Input
                        label="Звідки"
                        icon="📍"
                        placeholder="Місто відправлення"
                        value={fromCity}
                        onChange={(e) =>
                            setFromCity(e.target.value)
                        }
                    />

                    <Input
                        label="Куди"
                        icon="📍"
                        placeholder="Місто призначення"
                        value={toCity}
                        onChange={(e) =>
                            setToCity(e.target.value)
                        }
                    />

                </div>

            </div>


            {/* =========================
                Стартові показники
            ========================= */}

            <div className="trip-form-section">

                <div className="trip-form-section-title">
                    ⛽ Стартові показники
                </div>

                <div className="trip-form-grid">

                    <Input
                        label="Стартове пальне"
                        icon="⛽"
                        type="number"
                        placeholder="Літри"
                        value={startFuel}
                        onChange={(e) =>
                            setStartFuel(e.target.value)
                        }
                    />

                    <Input
                        label="Стартовий пробіг"
                        icon="📏"
                        type="number"
                        placeholder="Кілометри"
                        value={startMileage}
                        onChange={(e) =>
                            setStartMileage(e.target.value)
                        }
                    />

                </div>

            </div>


            {/* =========================
                Видана валюта
            ========================= */}

            <div className="trip-form-section">

                <div className="trip-form-section-title">
                    💰 Видана валюта
                </div>

                <div className="trip-form-grid trip-form-grid-money">

                    <Input
                        label="EUR"
                        icon="💶"
                        type="number"
                        placeholder="0.00"
                        value={startEuro}
                        onChange={(e) =>
                            setStartEuro(e.target.value)
                        }
                    />

                    <Input
                        label="USD"
                        icon="💵"
                        type="number"
                        placeholder="0.00"
                        value={startUsd}
                        onChange={(e) =>
                            setStartUsd(e.target.value)
                        }
                    />

                    <Input
                        label="PLN"
                        icon="🇵🇱"
                        type="number"
                        placeholder="0.00"
                        value={startPln}
                        onChange={(e) =>
                            setStartPln(e.target.value)
                        }
                    />

                    <Input
                        label="UAH"
                        icon="₴"
                        type="number"
                        placeholder="0.00"
                        value={startUah}
                        onChange={(e) =>
                            setStartUah(e.target.value)
                        }
                    />

                </div>

            </div>


            {/* =========================
                Зберегти
            ========================= */}

            <div className="trip-form-submit">

                <PrimaryButton
                    type="button"
                    fullWidth
                    onClick={saveTrip}
                    icon="💾"
                    size="lg"
                >
                    Зберегти рейс
                </PrimaryButton>

            </div>

        </Card>
    );
}