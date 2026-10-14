
import { initialProducts } from "./products.js";

const STORAGE_KEY = "inventoryManagementProducts";

export function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }

    return initialProducts.map(product => ({ ...product }));
}

export function saveProducts(products) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Error saving products:", error);
        return false;
    }
}
