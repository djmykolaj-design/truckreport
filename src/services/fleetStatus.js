
import { supabase } from "../lib/supabase";

/**
 * Знаходить автомобіль в автопарку за номерним знаком.
 * Регістр літер і зайві пробіли не мають значення.
 */
function normalizePlate(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Знаходить транспортний засіб за номером.
 */
async function findFleetVehicle(plateNumber) {
  const plate = normalizePlate(plateNumber);

  if (!plate) return null;

  const { data, error } = await supabase
    .from("fleet_vehicles")
    .select("id, plate_number, status")
    .limit(500);

  if (error) {
    console.error("Помилка пошуку автомобіля в автопарку:", error);
    return null;
  }

  return (
    (data || []).find(
      (vehicle) => normalizePlate(vehicle.plate_number) === plate
    ) || null
  );
}

/**
 * Позначає транспортний засіб як такий, що перебуває в рейсі.
 * Не змінює статуси ремонту, техобслуговування або блокування.
 */
export async function markVehicleInTrip(plateNumber) {
  const vehicle = await findFleetVehicle(plateNumber);

  if (!vehicle) {
    console.warn(
      "Автомобіль не знайдено в автопарку:",
      plateNumber
    );
    return false;
  }

  if (
    ["maintenance", "repair", "blocked"].includes(vehicle.status)
  ) {
    console.warn(
      "Статус автомобіля не змінено:",
      vehicle.plate_number,
      vehicle.status
    );
    return false;
  }

  const { error } = await supabase
    .from("fleet_vehicles")
    .update({
      status: "in_trip",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicle.id);

  if (error) {
    console.error("Помилка оновлення статусу автопарку:", error);
    return false;
  }

  return true;
}

/**
 * Повертає транспортний засіб у вільний статус.
 * Перед використанням потрібно переконатися, що інших активних
 * рейсів для цього номера немає.
 */
export async function markVehicleAvailable(plateNumber) {
  const vehicle = await findFleetVehicle(plateNumber);

  if (!vehicle) {
    console.warn(
      "Автомобіль не знайдено в автопарку:",
      plateNumber
    );
    return false;
  }

  if (
    ["maintenance", "repair", "blocked"].includes(vehicle.status)
  ) {
    return false;
  }

  const { error } = await supabase
    .from("fleet_vehicles")
    .update({
      status: "available",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicle.id);

  if (error) {
    console.error("Помилка оновлення статусу автопарку:", error);
    return false;
  }

  return true;
}
