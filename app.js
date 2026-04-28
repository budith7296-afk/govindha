const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: "Hyderabadi Chicken Biryani",
    price: 349,
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600",
    description: "Classic dum biryani with aromatic basmati and spicy chicken pieces.",
  },
  {
    id: crypto.randomUUID(),
    name: "Mutton Special Biryani",
    price: 429,
    image: "https://images.unsplash.com/photo-1701579231340-3ecf843f38c7?w=600",
    description: "Slow-cooked mutton layered with saffron rice and house masala.",
  },
  {
    id: crypto.randomUUID(),
    name: "Family Combo",
    price: 699,
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600",
    description: "2 biryanis, kebabs, raita, and double ka meetha for 4 people.",
  },
];

const state = {
  products: JSON.parse(localStorage.getItem("bf_products")) || defaultProducts,
  cart: [],
  trackingTimer: null,
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
const riderDot = document.getElementById("riderDot");
const trackingStatus = document.getElementById("trackingStatus");
const statusSteps = Array.from(document.querySelectorAll("#statusSteps span"));

function saveProducts() {
  localStorage.setItem("bf_products", JSON.stringify(state.products));
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

function startTracking(orderId) {
  const steps = [
    "Confirmed",
    "Cooking",
    "Picked Up",
    "On the Way",
    "Delivered",
  ];

  if (state.trackingTimer) {
    clearInterval(state.trackingTimer);
  }

  let stepIndex = 0;
  trackingStatus.textContent = `Order ${orderId}: ${steps[stepIndex]}`;
  statusSteps.forEach((step, index) => {
    step.classList.toggle("active", index === stepIndex);
  });
  riderDot.style.left = "0%";

  state.trackingTimer = setInterval(() => {
    stepIndex += 1;
    if (stepIndex >= steps.length) {
      clearInterval(state.trackingTimer);
      return;
    }

    const progress = (stepIndex / (steps.length - 1)) * 100;
    riderDot.style.left = `${progress}%`;
    trackingStatus.textContent = `Order ${orderId}: ${steps[stepIndex]}`;
    statusSteps.forEach((step, index) => {
      step.classList.toggle("active", index <= stepIndex);
    });
  }, 2500);
}

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.cart.length === 0) {
    checkoutMessage.textContent = "Your cart is empty.";
    return;
  }

  const formData = new FormData(checkoutForm);
  const order = {
    id: `BF-${Date.now()}`,
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    paymentMethod: formData.get("paymentMethod"),
    items: state.cart,
    total: state.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    createdAt: new Date().toISOString(),
  };

  const orders = JSON.parse(localStorage.getItem("bf_orders")) || [];
  orders.push(order);
  localStorage.setItem("bf_orders", JSON.stringify(orders));

  checkoutMessage.textContent = `Order placed! Track ID: ${order.id}`;
  checkoutForm.reset();
  state.cart = [];
  renderCart();
  startTracking(order.id);
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
