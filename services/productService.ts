import { GoogleGenAI, Type } from "@google/genai";
import { ProductData, DealType } from "../types";

// In a real production environment with a Python backend, 
// this function would Fetch() to your FastAPI endpoint.
// Here, we use Gemini 2.5 Flash to simulate the scraping intelligence 
// so the user can test the dashboard immediately.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a sophisticated Amazon Product Data Extractor simulation engine. 
The user will provide an ASIN. 
You must generate REALISTIC product details for that ASIN as if you just scraped the Amazon page.
If the ASIN looks like a valid alphanumeric string (e.g. B08...), generate plausible data (Title, Price, Discounts).
Randomly assign active discounts, coupons (clipped or checkbox), and deal badges (Lightning Deal, etc.) to about 40% of the products to demonstrate the tool's capabilities.
If the ASIN is obviously invalid (e.g., "TEST", "123"), return an error status.

Currency should be INR (₹).
Values should be numbers.
Final Price = Current Price - Coupon Value (if absolute) or % calculation.
`;

export const analyzeAsin = async (asin: string): Promise<ProductData> => {
  // Simulate network latency like a real scraper
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze ASIN: ${asin}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            currentPrice: { type: Type.NUMBER },
            mrp: { type: Type.NUMBER },
            hasCoupon: { type: Type.BOOLEAN },
            couponValue: { type: Type.STRING, description: "e.g. '500' or '10%'" },
            dealType: { type: Type.STRING, enum: Object.values(DealType) },
            promoText: { type: Type.STRING },
            isValid: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    const data = JSON.parse(text);

    if (!data.isValid) {
        throw new Error("Invalid ASIN or Product Not Found");
    }

    // Logic to calculate final price based on AI return
    let finalPrice = data.currentPrice;
    let couponValRaw = 0;

    if (data.hasCoupon && data.couponValue) {
        if (data.couponValue.includes('%')) {
            const percent = parseFloat(data.couponValue.replace('%', ''));
            finalPrice = finalPrice - (finalPrice * (percent / 100));
        } else {
            couponValRaw = parseFloat(data.couponValue.replace(/[^\d.]/g, ''));
            if (!isNaN(couponValRaw)) {
                finalPrice = Math.max(0, finalPrice - couponValRaw);
            }
        }
    }

    // Determine status
    const isDiscounted = data.hasCoupon || data.dealType !== DealType.NONE || data.currentPrice < data.mrp;

    return {
      id: crypto.randomUUID(),
      asin: asin.toUpperCase(),
      title: data.title,
      currentPrice: data.currentPrice,
      mrp: data.mrp,
      currency: '₹',
      hasCoupon: data.hasCoupon,
      couponValue: data.couponValue,
      dealType: data.dealType as DealType,
      promoText: data.promoText,
      finalPrice: Math.floor(finalPrice),
      status: isDiscounted ? 'active_discount' : 'no_discount',
      lastChecked: new Date().toLocaleTimeString(),
      imageUrl: `https://picsum.photos/seed/${asin}/100/100` // Placeholder image
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      id: crypto.randomUUID(),
      asin: asin,
      title: "Failed to load product",
      currentPrice: 0,
      mrp: 0,
      currency: '₹',
      hasCoupon: false,
      dealType: DealType.NONE,
      finalPrice: 0,
      status: 'error',
      lastChecked: new Date().toLocaleTimeString()
    };
  }
};
