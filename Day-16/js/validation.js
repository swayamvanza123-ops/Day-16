
export function validateProduct(product) {
    const errors = {};

    if (!product.name || product.name.trim().length < 3) {
        errors.name = "Enter at least 3 characters.";
    }

    if (!product.category) {
        errors.category = "Select a category.";
    }

    if (
        product.price === "" ||
        !Number.isFinite(Number(product.price)) ||
        Number(product.price) <= 0
    ) {
        errors.price = "Price must be greater than zero.";
    }

    if (
        product.stock === "" ||
        !Number.isInteger(Number(product.stock)) ||
        Number(product.stock) < 0
    ) {
        errors.stock = "Enter a whole number of 0 or more.";
    }

    return errors;
}
