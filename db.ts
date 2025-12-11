
import { Vehicle } from './types';

const API_URL = 'http://localhost:3001/api/vehicles';

class DatabaseService {
  async init() {
    console.log('Connecting to API Server at ' + API_URL);
  }

  public async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  }

  public async addVehicle(vehicle: Vehicle) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicle),
      });
      
      if (!response.ok) {
        throw new Error('Error adding vehicle');
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  }

  public async updateVehicle(vehicle: Vehicle) {
    try {
      const response = await fetch(`${API_URL}/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicle),
      });

      if (!response.ok) {
        throw new Error('Error updating vehicle');
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
    }
  }

  public async deleteVehicle(id: string) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting vehicle');
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  }
}

export const dbService = new DatabaseService();
