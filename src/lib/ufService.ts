/**
 * Servicio para obtener el valor de la UF desde mindicador.cl
 */

export interface UFValue {
  valor: number;
  fecha: string;
}

export interface UFResponse {
  version: string;
  autor: string;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  serie: Array<{
    fecha: string;
    valor: number;
  }>;
}

/**
 * Obtiene el valor actual de la UF desde mindicador.cl
 */
export async function getUFValue(): Promise<UFValue | null> {
  try {
    const response = await fetch('https://mindicador.cl/api/uf', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UFResponse = await response.json();
    
    if (data.serie && data.serie.length > 0) {
      // Obtener el último valor disponible
      const latestValue = data.serie[data.serie.length - 1];
      return {
        valor: latestValue.valor,
        fecha: latestValue.fecha,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching UF value:', error);
    return null;
  }
}

/**
 * Obtiene el valor de la UF para una fecha específica
 */
export async function getUFValueByDate(date: string): Promise<UFValue | null> {
  try {
    const response = await fetch(`https://mindicador.cl/api/uf/${date}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UFResponse = await response.json();
    
    if (data.serie && data.serie.length > 0) {
      const value = data.serie[0];
      return {
        valor: value.valor,
        fecha: value.fecha,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching UF value for date:', error);
    return null;
  }
}
