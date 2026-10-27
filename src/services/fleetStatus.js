import { supabase } from "../lib/supabase";

const LOCKED_STATUSES = ["maintenance", "repair", "blocked"];

/**
 * Номерний знак без пробілів і в верхньому регістрі.
 */
function normalizePlate(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Знаходить транспортний засіб в автопарку за номерним знаком.
 */
async function findFleetVehicle(plateNumber) {
  const plate = normalizePlate(plateNumber);

  if (!plate) return null;

  const { data, error } = await supabase
    .from("fleet_vehicles")
    .select("id, plate_number, status, vehicle_type, odometer")
    .limit(500);

  if (error) {
    console.error("[fleet] помилка пошуку автомобіля:", error);
    return null;
  }

  return (
    (data || []).find(
      (vehicle) => normalizePlate(vehicle.plate_number) === plate
    ) || null
  );
}

/**
 * Оновлює машину і перевіряє, що рядок справді змінився
 * (якщо правила доступу забороняють зміну, база не видає помилку,
 * а просто повертає 0 рядків).
 */
async function updateVehicle(vehicle, patch) {
  const { data, error } = await supabase
    .from("fleet_vehicles")
    .update(patch)
    .eq("id", vehicle.id)
    .select("id");

  if (error) {
    console.error("[fleet] помилка оновлення автопарку:", error);
    return false;
  }

  if (!data || data.length === 0) {
    console.warn(
      "[fleet] оновлено 0 рядків для",
      vehicle.plate_number,
      "— можливо, немає прав на зміну."
    );
    return false;
  }

  console.info("[fleet] оновлено", vehicle.plate_number, patch);
  return true;
}

/**
 * Позначає транспортний засіб як такий, що перебуває в рейсі.
 * Не змінює статуси ремонту, техобслуговування або блокування.
 */
export async function markVehicleInTrip(plateNumber) {
  const vehicle = await findFleetVehicle(plateNumber);

  if (!vehicle) {
    console.warn("[fleet] автомобіль не знайдено в автопарку:", plateNumber);
    return false;
  }

  if (LOCKED_STATUSES.includes(vehicle.status)) {
    console.warn(
      "[fleet] статус не змінено:",
      vehicle.plate_number,
      vehicle.status
    );
    return false;
  }

  return updateVehicle(vehicle, {
    status: "in_trip",
    updated_at: new Date().toISOString(),
  });
}

/**
 * Повертає транспортний засіб у вільний статус.
 */
export async function markVehicleAvailable(plateNumber) {
  const vehicle = await findFleetVehicle(plateNumber);

  if (!vehicle) {
    console.warn("[fleet] автомобіль не знайдено в автопарку:", plateNumber);
    return false;
  }

  if (LOCKED_STATUSES.includes(vehicle.status)) {
    return false;
  }

  return updateVehicle(vehicle, {
    status: "available",
    updated_at: new Date().toISOString(),
  });
}

/**
 * Після завершення рейсу для однієї машини (тягача або причепа):
 *  - статус «У рейсі» змінюється на «Вільний»
 *    (статуси «На ТО», «На ремонті», «Не використовувати» не чіпаємо);
 *  - тягач/авто: кінцевий пробіг рейсу записується в автопарк.
 *    Якщо він менший за пробіг в автопарку, питаємо підтвердження;
 *  - причіп: до його пробігу додається пройдений за рейс шлях (addKm).
 */
async function releaseOneVehicle(
  plateNumber,
  { endMileage = null, addKm = 0, isTrailer = false } = {}
) {
  const vehicle = await findFleetVehicle(plateNumber);

  if (!vehicle) {
    console.warn("[fleet] автомобіль не знайдено в автопарку:", plateNumber);
    return false;
  }

  const patch = { updated_at: new Date().toISOString() };
  const currentOdo = Number(vehicle.odometer || 0);

  if (vehicle.status === "in_trip") {
    patch.status = "available";
  }

  if (isTrailer) {
    if (Number.isFinite(addKm) && addKm !== 0) {
      patch.odometer = Math.max(0, currentOdo + addKm);
    }
  } else {
    const hasMileage =
      endMileage !== null && endMileage !== undefined && endMileage !== "";

    if (hasMileage) {
      const newOdo = Number(endMileage);

      if (Number.isFinite(newOdo) && newOdo >= 0 && newOdo !== currentOdo) {
        if (newOdo > currentOdo) {
          patch.odometer = newOdo;
        } else if (
          window.confirm(
            `Пробіг у автопарку (${currentOdo.toLocaleString("uk-UA")} км) ` +
              `більший за кінцевий пробіг рейсу (${newOdo.toLocaleString("uk-UA")} км).\n\n` +
              `Оновити пробіг машини ${vehicle.plate_number} в автопарку до ` +
              `${newOdo.toLocaleString("uk-UA")} км?`
          )
        ) {
          patch.odometer = newOdo;
        }
      }
    }
  }

  return updateVehicle(vehicle, patch);
}

/**
 * Викликається після завершення рейсу: звільняє тягач і причіп,
 * записує кінцевий пробіг тягача і додає пройдений за рейс шлях
 * (кінцевий мінус початковий пробіг) до пробігу причепа.
 *
 * Повертає { truck, trailer, trailerKm }.
 * trailerKm — скільки км уже враховано для причепа (зберігається в рейсі,
 * щоб повторне збереження завершення не додало шлях вдруге).
 */
export async function releaseVehiclesAfterTrip(trip, endMileage) {
  const result = { truck: false, trailer: false, trailerKm: null };

  const startKm = Number(trip?.startMileage);
  const endKm = Number(endMileage);

  const distance =
    Number.isFinite(startKm) &&
    startKm > 0 &&
    Number.isFinite(endKm) &&
    endKm >= startKm
      ? endKm - startKm
      : null;

  if (trip?.truck) {
    result.truck = await releaseOneVehicle(trip.truck, { endMileage });
  }

  if (trip?.trailer) {
    if (distance === null) {
      console.warn(
        "[fleet] не вдалося порахувати пройдений шлях для причепа " +
          "(перевір початковий і кінцевий пробіг рейсу)."
      );
    }

    const alreadyApplied = Number(trip?.trailerKmApplied || 0);
    const addKm = distance === null ? 0 : distance - alreadyApplied;

    result.trailer = await releaseOneVehicle(trip.trailer, {
      isTrailer: true,
      addKm,
    });

    if (result.trailer && distance !== null) {
      result.trailerKm = distance;
    }
  }

  return result;
}