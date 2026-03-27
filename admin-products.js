const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "admin-login.html";
}

async function loadAdminProducts() {
  const list = document.getElementById("productAdminList");

  const res = await fetch("/api/products");
  const products = await res.json();

  list.innerHTML = "";

  if (products.length === 0) {
    list.innerHTML = `<div class="product">Одоогоор бараа алга</div>`;
    return;
  }

  products.forEach((product) => {
    list.innerHTML += `
      <div class="product admin-card">
        <img src="${product.image}" alt="${product.name}" class="product-image" />
        <h2>${product.name}</h2>
        <p><strong>Үнэ:</strong> ${Number(product.price).toLocaleString()}₮</p>
        <p><strong>Ангилал:</strong> ${product.category || "-"}</p>
        <p><strong>Тайлбар:</strong> ${product.description || "-"}</p>
        <div class="actions">
          <button onclick="editProduct('${product._id}', '${product.name}', '${product.price}', '${product.image}', '${product.category || ""}', '${product.description || ""}')">Засах</button>
          <button onclick="deleteProduct('${product._id}')" class="secondary">Устгах</button>
        </div>
      </div>
    `;
  });
}

async function saveProduct(event) {
  event.preventDefault();

  const productId = document.getElementById("productId").value;
  const payload = {
    name: document.getElementById("name").value,
    price: Number(document.getElementById("price").value),
    image: document.getElementById("image").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value
  };

  const url = productId ? `/api/products/${productId}` : "/api/products";
  const method = productId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Хадгалахад алдаа гарлаа");
    return;
  }

  document.getElementById("productId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("image").value = "";
  document.getElementById("category").value = "";
  document.getElementById("description").value = "";

  loadAdminProducts();
}

function editProduct(id, name, price, image, category, description) {
  document.getElementById("productId").value = id;
  document.getElementById("name").value = name;
  document.getElementById("price").value = price;
  document.getElementById("image").value = image;
  document.getElementById("category").value = category;
  document.getElementById("description").value = description;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
  const ok = confirm("Энэ барааг устгах уу?");
  if (!ok) return;

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token
    }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Устгахад алдаа гарлаа");
    return;
  }

  loadAdminProducts();
}

loadAdminProducts();