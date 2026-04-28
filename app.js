const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: "iPhone 15",
    price: 73999,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
    description: "Apple flagship with A16 chip and dynamic camera features.",
  },
  {
    id: crypto.randomUUID(),
    name: "Samsung Galaxy S24",
    price: 68999,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600",
    description: "Premium Android phone with bright display and AI tools.",
  },
  {
    id: crypto.randomUUID(),
    name: "OnePlus 12R",
    price: 41999,
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600",
    description: "Fast performance and clean software experience.",
  },
];

const state = {
  products: JSON.parse(localStorage.getItem("gm_products")) || defaultProducts,
  cart: [],
};

const productGrid = document.getElementById("productGrid");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutMessage = document.getElementById("checkoutMessage");
const productForm = document.getElementById("productForm");
const adminProductList = document.getElementById("adminProductList");
const adminPanel = document.getElementById("adminPanel");
const adminToggle = document.getElementById("adminToggle");
const searchInput = document.getElementById("searchInput");

function saveProducts() {
  localStorage.setItem("gm_products", JSON.stringify(state.products));
}

function renderProducts(filter = "") {
  const query = filter.trim().toLowerCase();
  const filtered = state.products.filter((product) =>
    [product.name, product.description].some((value) =>
      value.toLowerCase().includes(query)
    )
  );

  productGrid.innerHTML = filtered
    .map(
      (product) => `
      <article class="product-card">
        <img src="${product.image}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <strong>₹${product.price.toLocaleString("en-IN")}</strong>
        <button class="primary-btn" data-id="${product.id}">Add to Cart</button>
      </article>
    `
    )
    .join("");

  productGrid.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.id));
  });
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...product, qty: 1 });
  }

  renderCart();
}

function renderCart() {
  cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <li class="cart-item">
          <div>
            <div>${item.name}</div>
            <small>₹${item.price.toLocaleString("en-IN")} x ${item.qty}</small>
          </div>
          <button class="delete-btn" data-remove-id="${item.id}">Remove</button>
        </li>
      `
    )
    .join("");

  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = total.toLocaleString("en-IN");

  cartItems.querySelectorAll("button[data-remove-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cart = state.cart.filter((item) => item.id !== button.dataset.removeId);
      renderCart();
    });
  });
}

function renderAdminProducts() {
  adminProductList.innerHTML = state.products
    .map(
      (product) => `
      <li class="admin-product-item">
        <span>${product.name} - ₹${product.price.toLocaleString("en-IN")}</span>
        <button class="delete-btn" data-delete-id="${product.id}">Delete</button>
      </li>
    `
    )
    .join("");

  adminProductList.querySelectorAll("button[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.products = state.products.filter(
        (product) => product.id !== button.dataset.deleteId
      );
      saveProducts();
      renderProducts(searchInput.value);
      renderAdminProducts();
      state.cart = state.cart.filter((item) =>
        state.products.some((product) => product.id === item.id)
      );
      renderCart();
    });
  });
}

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.cart.length === 0) {
    checkoutMessage.textContent = "Your cart is empty.";
    return;
  }

  const formData = new FormData(checkoutForm);
  const order = {
    id: `ORD-${Date.now()}`,
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    paymentMethod: formData.get("paymentMethod"),
    items: state.cart,
    total: state.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    createdAt: new Date().toISOString(),
  };

  const orders = JSON.parse(localStorage.getItem("gm_orders")) || [];
  orders.push(order);
  localStorage.setItem("gm_orders", JSON.stringify(orders));

  checkoutMessage.textContent = `Order placed! ID: ${order.id}`;
  checkoutForm.reset();
  state.cart = [];
  renderCart();
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const product = {
    id: crypto.randomUUID(),
    name: formData.get("name")?.toString().trim(),
    price: Number(formData.get("price")),
    image: formData.get("image")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
  };

  if (!product.name || !product.price || !product.image || !product.description) {
    return;
  }

  state.products.unshift(product);
  saveProducts();
  renderProducts(searchInput.value);
  renderAdminProducts();
  productForm.reset();
});

adminToggle.addEventListener("click", () => {
  adminPanel.classList.toggle("hidden");
});

searchInput.addEventListener("input", () => {
  renderProducts(searchInput.value);
});

renderProducts();
renderCart();
renderAdminProducts();
saveProducts();
