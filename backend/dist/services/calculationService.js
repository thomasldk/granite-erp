"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationService = void 0;
const pricingRules_1 = require("../config/pricingRules");
class CalculationService {
    /**
     * Calculates details for a single quote item based on its dimensions and the material.
     */
    calculateItemDetails(item, material) {
        // Defaults
        const length = item.length || 0; // inches
        const width = item.width || 0; // inches
        const thickness = item.thickness || 0; // inches
        const qty = item.quantity || 1;
        // 1. Geometry Calculations
        // Area in Square Feet (sqft)
        // Standard formula: (L * W) / 144
        const grossAreaSqFt = (length * width) / 144;
        // Net Area (For pricing, usually same as gross for simple slabs, but maybe minus cutouts? 
        // For now, we assume Eq Gross)
        const netAreaSqFt = grossAreaSqFt;
        // Volume in Cubic Feet (ft3)
        // (L * W * T) / 1728
        const netVolumeFt3 = (length * width * thickness) / 1728;
        // Linear Length (ft) - e.g. for profiling perimeter
        // (L + L + W + W) / 12 ? Or just L? 
        // Usually perimeter for simple rectangle: 2 * (L + W) / 12
        const netLengthFt = (2 * (length + width)) / 12;
        // Weight
        // Density is usually in lb/ft3. Default ~165 for granite.
        const density = (material === null || material === void 0 ? void 0 : material.density) || 165;
        const unitWeight = netVolumeFt3 * density;
        const totalLineWeight = unitWeight * qty;
        // ... (inside class)
        // 2. Pricing Calculations
        // Base Material Cost (Stone Value)
        const basePricePerSqFt = (material === null || material === void 0 ? void 0 : material.sellingPrice) || (((material === null || material === void 0 ? void 0 : material.purchasePrice) || 0) * pricingRules_1.PricingRules.defaultMargin);
        const stoneValue = netAreaSqFt * basePricePerSqFt;
        // Processing Costs
        const primarySawingCost = (netAreaSqFt * pricingRules_1.PricingRules.primarySawing.costPerSqFt) + pricingRules_1.PricingRules.primarySawing.baseCost;
        const secondarySawingCost = netAreaSqFt * pricingRules_1.PricingRules.secondarySawing.costPerSqFt;
        const profilingCost = netLengthFt * pricingRules_1.PricingRules.profiling.costPerLinFt;
        const finishingCost = netAreaSqFt * pricingRules_1.PricingRules.finishing.costPerSqFt;
        const anchoringCost = qty * pricingRules_1.PricingRules.anchoring.costPerUnit; // Assuming per piece? Or implies input? For now simple logic.
        // Unit Price (CAD)
        // Sum of all values / Quantity? 
        // Actually stoneValue is total for the dimensions ? Usually dimension = 1 piece.
        // So unitPrice is cost of THIS piece.
        const unitPriceCad = stoneValue + primarySawingCost + secondarySawingCost + profilingCost + finishingCost + anchoringCost;
        // Total Price
        const totalPriceCad = unitPriceCad * qty;
        // External/USD conversion (Simplified: 1:1 if not provided)
        const exchangeRate = 1.0;
        const unitPriceUsd = unitPriceCad * exchangeRate;
        const totalPriceUsd = totalPriceCad * exchangeRate;
        return Object.assign(Object.assign({}, item), { netLength: parseFloat(netLengthFt.toFixed(2)), netArea: parseFloat(netAreaSqFt.toFixed(2)), netVolume: parseFloat(netVolumeFt3.toFixed(3)), totalWeight: parseFloat(totalLineWeight.toFixed(2)), stoneValue: parseFloat(stoneValue.toFixed(2)), unitPrice: parseFloat(unitPriceCad.toFixed(2)), totalPrice: parseFloat(totalPriceCad.toFixed(2)), unitPriceCad: parseFloat(unitPriceCad.toFixed(2)), totalPriceCad: parseFloat(totalPriceCad.toFixed(2)), unitPriceUsd: parseFloat(unitPriceUsd.toFixed(2)), totalPriceUsd: parseFloat(totalPriceUsd.toFixed(2)), primarySawingCost,
            secondarySawingCost,
            profilingCost,
            finishingCost,
            anchoringCost });
    }
    /**
     * Recalculates totals for the entire quote.
     */
    calculateQuoteTotals(items) {
        const totalAmount = items.reduce((sum, item) => sum + (item.totalPriceCad || 0), 0);
        // sum up line weights
        const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
        return {
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            totalWeight: parseFloat(totalWeight.toFixed(2))
        };
    }
}
exports.CalculationService = CalculationService;
