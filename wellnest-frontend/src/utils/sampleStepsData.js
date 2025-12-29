// Utility to add sample steps data for testing analytics
import { createSteps } from "../api/trackerApi";

export const addSampleStepsData = async () => {
  const sampleData = [
    { count: 8500, distance: 6.5, caloriesBurned: 340, notes: "Morning walk + evening jog" },
    { count: 12000, distance: 9.1, caloriesBurned: 480, notes: "Active day with hiking" },
    { count: 6200, distance: 4.7, caloriesBurned: 250, notes: "Mostly indoor activities" },
    { count: 10500, distance: 8.0, caloriesBurned: 420, notes: "Regular daily activities" },
    { count: 15000, distance: 11.4, caloriesBurned: 600, notes: "Long walk in the park" },
    { count: 7800, distance: 5.9, caloriesBurned: 310, notes: "Moderate activity day" },
    { count: 9200, distance: 7.0, caloriesBurned: 370, notes: "Shopping and errands" }
  ];

  try {
    for (const data of sampleData) {
      await createSteps(data);
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return true;
  } catch (error) {
    console.error("Error adding sample steps data:", error);
    return false;
  }
};

export const calculateStepsData = (stepCount, weightKg = 70) => {
  // Average step length for adults: 0.762 meters (2.5 feet)
  const averageStepLength = 0.762; // meters
  
  // Calculate distance in kilometers
  const distanceKm = (stepCount * averageStepLength) / 1000;
  
  // Calculate calories burned from walking
  // Formula: Calories = MET × weight (kg) × time (hours)
  // For walking: MET = 3.5 (moderate pace)
  // Average walking speed: 5 km/h
  const walkingMET = 3.5;
  const averageWalkingSpeed = 5; // km/h
  const timeHours = distanceKm / averageWalkingSpeed;
  const caloriesBurned = Math.round(walkingMET * weightKg * timeHours);
  
  return {
    distance: distanceKm.toFixed(2),
    calories: caloriesBurned
  };
};