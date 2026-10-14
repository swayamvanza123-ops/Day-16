
import { loadProducts, saveProducts } from "./storage.js";
import { validateProduct } from "./validation.js";

let products = loadProducts();
let stockChart = null;

const LOW_STOCK_LIMIT = 10;

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

const number = new Intl.NumberFormat("en-IN");

const $ = id => document.getElementById(id);

const form = $("productForm");
const productGrid = $("productGrid");
const searchInput = $("searchInput");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/* DASHBOARD STATISTICS */

function renderDashboard() {
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + Number(product.stock || 0),
        0
    );

    const inventoryValue = products.reduce(
        (sum, product) =>
            sum + Number(product.price || 0) * Number(product.stock || 0),
        0
    );

    const lowStockProducts = products.filter(
        product => Number(product.stock) < LOW_STOCK_LIMIT
    );

    $("totalProducts").textContent = number.format(totalProducts);
    $("totalStock").textContent = number.format(totalStock);
    $("inventoryValue").textContent = currency.format(inventoryValue);
    $("lowStock").textContent = number.format(lowStockProducts.length);

    renderLowStock(lowStockProducts);
    renderChart();
}

/* LOW-STOCK ALERTS */

function renderLowStock(items) {
    $("lowStockTable").innerHTML = items.map(product => `
        <tr>
            <td>${escapeHTML(product.name)}</td>
            <td><strong>${number.format(Number(product.stock))}</strong></td>
            <td><span class="status-low">Low Stock</span></td>
        </tr>
    `).join("");

    $("alertCount").textContent =
        `${items.length} ${items.length === 1 ? "alert" : "alerts"}`;

    $("noLowStock").hidden = items.length > 0;
}

/* CHART.JS BAR CHART */

function renderChart() {
    const canvas = $("stockChart");

    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load. Check your internet connection.");
        return;
    }

    const labels = products.map(product => product.name);
    const values = products.map(product => Number(product.stock) || 0);

    if (stockChart) {
        stockChart.data.labels = labels;
        stockChart.data.datasets[0].data = values;
        stockChart.update();
        return;
    }

    stockChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Stock Quantity",
                data: values,
                backgroundColor: [
                    "#7567ee", "#53a5f5", "#37c99a",
                    "#ffb45f", "#ed82b3", "#6cc7d9"
                ],
                borderRadius: 7,
                borderSkipped: false,
                maxBarThickness: 48
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#777d91" }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: "#777d91"
                    },
                    grid: { color: "#eff0f6" }
                }
            }
        }
    });
}

/* PRODUCT CARDS WITH EQUAL-SIZED IMAGES */

function renderProducts() {
    const search = searchInput.value.trim().toLowerCase();

    const filtered = products.filter(product =>
        String(product.name).toLowerCase().includes(search) ||
        String(product.category).toLowerCase().includes(search)
    );

    $("emptyProducts").hidden = filtered.length > 0;

    productGrid.innerHTML = filtered.map(product => {
        const image = String(product.image || "").trim();

        return `
            <article class="product-card">
                <div class="product-image">
                    ${
                        image
                            ? `<img src="${escapeHTML(image)}"
                                    alt="${escapeHTML(product.name)}"
                                    loading="lazy"
                                    onerror="this.hidden=true;this.nextElementSibling.hidden=false;">`
                            : ""
                    }
                    <span class="image-placeholder"
                          ${image ? "hidden" : ""}>📦</span>
                </div>

                <div class="product-info">
                    <span class="product-category">
                        ${escapeHTML(product.category)}
                    </span>

                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="product-price">
                        ${currency.format(Number(product.price))}
                    </p>

                    <p class="product-stock">
                        Stock: <strong>${number.format(Number(product.stock))}</strong> units
                        ${
                            Number(product.stock) < LOW_STOCK_LIMIT
                                ? '<span style="color:#d94e45"> · Low Stock</span>'
                                : ""
                        }
                    </p>

                    <div class="product-actions">
                        <button type="button" class="edit-button"
                                data-action="edit"
                                data-id="${escapeHTML(product.id)}">
                            ✎ Edit
                        </button>

                        <button type="button" class="delete-button"
                                data-action="delete"
                                data-id="${escapeHTML(product.id)}">
                            ✕ Delete
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

/* REFRESH ALL SECTIONS */

function refreshApp() {
    saveProducts(products);
    renderDashboard();
    renderProducts();
}

/* FORM VALIDATION */

function clearErrors() {
    ["name", "category", "price", "stock"].forEach(field => {
        $(`${field}Error`).textContent = "";
    });
}

function showErrors(errors) {
    clearErrors();

    Object.entries(errors).forEach(([field, message]) => {
        $(`${field}Error`).textContent = message;
    });
}

/* IMAGE PREVIEW */

function updateImagePreview() {
    const path = $("productImage").value.trim();
    const preview = $("imagePreview");
    const image = $("previewImage");

    if (!path) {
        preview.hidden = true;
        image.removeAttribute("src");
        return;
    }

    image.onload = () => {
        preview.hidden = false;
    };

    image.onerror = () => {
        preview.hidden = true;
    };

    image.src = path;
}

$("productImage").addEventListener("input", updateImagePreview);

/* RESET FORM */

function resetForm() {
    form.reset();
    $("productId").value = "";

    clearErrors();

    $("formTitle").textContent = "＋ Add New Product";
    $("submitButton").textContent = "Add Product";
    $("cancelEdit").hidden = true;
    $("formMessage").textContent = "";
    $("imagePreview").hidden = true;
    $("previewImage").removeAttribute("src");
}

/* ADD AND UPDATE */

form.addEventListener("submit", event => {
    event.preventDefault();

    const id = $("productId").value;

    const product = {
        id: id ? Number(id) : Date.now(),
        name: $("productName").value.trim(),
        category: $("productCategory").value,
        price: $("productPrice").value,
        stock: $("productStock").value,
        image: $("productImage").value.trim()
    };

    const errors = validateProduct(product);

    if (Object.keys(errors).length) {
        showErrors(errors);
        $("formMessage").textContent = "";
        return;
    }

    clearErrors();

    product.price = Number(product.price);
    product.stock = Number(product.stock);

    if (id) {
        const index = products.findIndex(
            item => String(item.id) === id
        );

        if (index === -1) {
            $("formMessage").textContent = "Product not found.";
            return;
        }

        products[index] = product;
    } else {
        products.unshift(product);
    }

    refreshApp();
    resetForm();

    $("formMessage").textContent = id
        ? "Product updated successfully!"
        : "Product added successfully!";
});

/* EDIT AND DELETE */

productGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const product = products.find(
        item => String(item.id) === button.dataset.id
    );

    if (!product) return;

    if (button.dataset.action === "edit") {
        $("productId").value = product.id;
        $("productName").value = product.name;
        $("productCategory").value = product.category;
        $("productPrice").value = product.price;
        $("productStock").value = product.stock;
        $("productImage").value = product.image || "";

        $("formTitle").textContent = "✎ Edit Product";
        $("submitButton").textContent = "Update Product";
        $("cancelEdit").hidden = false;
        $("formMessage").textContent = "";

        clearErrors();
        updateImagePreview();

        $("form-section").scrollIntoView({ behavior: "smooth" });
        return;
    }

    if (button.dataset.action === "delete") {
        if (!confirm(`Delete "${product.name}"?`)) return;

        products = products.filter(
            item => String(item.id) !== String(product.id)
        );

        if (String($("productId").value) === String(product.id)) {
            resetForm();
        }

        refreshApp();
    }
});

/* SEARCH AND CANCEL EDIT */

searchInput.addEventListener("input", renderProducts);
$("cancelEdit").addEventListener("click", resetForm);

/* START */

refreshApp();
