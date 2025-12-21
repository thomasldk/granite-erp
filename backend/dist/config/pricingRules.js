"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingRules = void 0;
/**
 * Pricing Configuration
 * Define the cost factors for the calculation engine here.
 */
exports.PricingRules = {
    // Standard Margins
    defaultMargin: 3.0, // Used if material has no selling price
    // Processing Costs (Placeholder values - Update these headers!)
    primarySawing: {
        costPerSqFt: 0,
        baseCost: 0
    },
    secondarySawing: {
        costPerSqFt: 0
    },
    profiling: {
        costPerLinFt: 0
    },
    finishing: {
        costPerSqFt: 0
    },
    anchoring: {
        costPerUnit: 0
    }
};
