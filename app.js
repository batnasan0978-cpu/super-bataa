function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find((item) => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }

  saveCart(cart);
  alert("Сагсанд нэмэгдлээ");
}

function displayCart() {
  const cart = getCart();
  const cartDiv = document.getElementById("cart");
  const totalDiv = document.getElementById("total");

  if (!cartDiv || !totalDiv) return;

  cartDiv.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartDiv.innerHTML = `<div class="item-row">Сагс хоосон байна</div>`;
    totalDiv.textContent = "Нийт дүн: 0₮";
    return;
  }

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    cartDiv.innerHTML += `
      <div class="item-row">
        <span>${index + 1}. ${item.name} x ${item.qty}</span>
        <strong>${itemTotal.toLocaleString()}₮</strong>
      </div>
    `;
  });

  totalDiv.textContent = `Нийт дүн: ${total.toLocaleString()}₮`;
}

function clearCart() {
  localStorage.removeItem("cart");
  displayCart();
}

function displayOrder() {
  const cart = getCart();
  const orderItems = document.getElementById("orderItems");
  const orderTotal = document.getElementById("orderTotal");

  if (!orderItems || !orderTotal) return;

  orderItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    orderItems.innerHTML = `<div class="item-row">Сагс хоосон байна</div>`;
    orderTotal.textContent = "Нийт дүн: 0₮";
    return;
  }

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    orderItems.innerHTML += `
      <div class="item-row">
        <span>${index + 1}. ${item.name} x ${item.qty}</span>
        <strong>${itemTotal.toLocaleString()}₮</strong>
      </div>
    `;
  });

  orderTotal.textContent = `Нийт дүн: ${total.toLocaleString()}₮`;
}

async function submitOrder(event) {
  event.preventDefault();

  const cart = getCart();
  if (cart.length === 0) {
    alert("Сагс хоосон байна");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

 const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

const order = {
  name: document.getElementById("name").value,
  phone: document.getElementById("phone").value,
  address: document.getElementById("address").value,
  cart,
  total,
  status: "Pending",
  date: new Date().toLocaleString(),
  userId: userInfo ? userInfo.email : "",
  userEmail: userInfo ? userInfo.email : "",
  userName: userInfo ? userInfo.name : ""
};

  const res = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });

  const data = await res.json();

  if (res.ok) {
    alert("Захиалга амжилттай илгээгдлээ");
    localStorage.removeItem("cart");
    window.location.href = "index.html";
  } else {
    alert(data.error || "Алдаа гарлаа");
  }
}

function filterProducts() {
  const value = document.getElementById("searchInput").value.toLowerCase();
  const products = document.querySelectorAll(".product-card");

  products.forEach((product) => {
    const name = product.dataset.name.toLowerCase();
    product.style.display = name.includes(value) ? "block" : "none";
  });
}
async function loadProducts() {
  const productList = document.getElementById("productList");
  if (!productList) return;

  const res = await fetch("/api/products");
  const products = await res.json();

  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = `<div class="product">Одоогоор бараа алга</div>`;
    return;
  }

  products.forEach((product) => {
    productList.innerHTML += `
      <div class="product product-card" data-name="${product.name}">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${product.name}" class="product-image" />
          <span class="product-category">${product.category || "Бараа"}</span>
        </div>

        <div class="product-info">
          <h2>${product.name}</h2>
          <p class="product-desc">${product.description || "Тайлбар байхгүй"}</p>

          <div class="product-bottom">
            <p class="price">${Number(product.price).toLocaleString()}₮</p>
            <button onclick="addToCart('${product.name}', ${product.price})">
              Сагсанд нэмэх
            </button>
          </div>
        </div>
      </div>
    `;
  });
}


loadProducts();
function showLoggedInUser() {
  const welcomeUser = document.getElementById("welcomeUser");
  if (!welcomeUser) return;

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  if (userInfo) {
    welcomeUser.textContent = `Сайн байна уу, ${userInfo.name}`;
  } else {
    welcomeUser.textContent = "";
  }
}

showLoggedInUser();
function logoutUser() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userInfo");
  location.reload();
}

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === "A") {
    window.location.href = "admin-login.html";
  }
});