import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'usd';
    const to = searchParams.get('to') || 'mxn';

    const apiKey = process.env.API_KEY_BRIDGE;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key not configured',
          disconnected: true
        }, 
        { status: 500 }
      );
    }

    const url = `https://api.bridge.xyz/v0/exchange_rates?from=${from}&to=${to}`;
    const options = {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Bridge API error: ${response.status} - ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Bridge API error: ${response.status}`,
          disconnected: true
        }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validar que la respuesta tenga la estructura esperada
    if (!data.midmarket_rate || !data.buy_rate || !data.sell_rate) {
      console.error('Invalid response structure from Bridge API:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from Bridge API',
          disconnected: true
        }, 
        { status: 500 }
      );
    }
    
    // Redondear a 2 decimales
    const formattedData = {
      midmarket_rate: parseFloat(data.midmarket_rate).toFixed(2),
      buy_rate: parseFloat(data.buy_rate).toFixed(2),
      sell_rate: parseFloat(data.sell_rate).toFixed(2)
    };

    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      disconnected: false
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates',
        disconnected: true,
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}