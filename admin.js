const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "admin-login.html";
}

async function loadOrders() {
  const ordersDiv = document.getElementById("orders");

  const res = await fetch("/api/orders", {
    headers: {
      Authorization: token
    }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Захиалга уншихад алдаа гарлаа");
    localStorage.removeItem("token");
    window.location.href = "admin-login.html";
    return;
  }

  document.getElementById("totalOrders").textContent = data.length;
  ordersDiv.innerHTML = "";

  if (data.length === 0) {
    ordersDiv.innerHTML = `<div class="product">Одоогоор захиалга алга</div>`;
    return;
  }

  data.forEach((order) => {
    const items = order.cart
      .map((item) => `<li>${item.name} x ${item.qty} - ${(item.price * item.qty).toLocaleString()}₮</li>`)
      .join("");

    ordersDiv.innerHTML += `
      <div class="product admin-card">
        <h2>${order.name}</h2>
        <p><strong>Утас:</strong> ${order.phone}</p>
        <p><strong>Хаяг:</strong> ${order.address}</p>
        <p><strong>Огноо:</strong> ${order.date}</p>
        <p><strong>Нийт:</strong> ${order.total.toLocaleString()}₮</p>
        <p><strong>Статус:</strong> <span class="badge ${order.status.toLowerCase()}">${order.status}</span></p>
        <select onchange="updateStatus('${order._id}', this.value)">
          <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
          <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
        </select>

        <ul class="order-list">${items}</ul>
        <button onclick="deleteOrder('${order._id}')">Устгах</button>
      </div>
    `;
  });
}

async function updateStatus(id, status) {
  const res = await fetch(`/api/order/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ status })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Статус солиход алдаа гарлаа");
    return;
  }

  loadOrders();
}

async function deleteOrder(id) {
  const ok = confirm("Энэ захиалгыг устгах уу?");
  if (!ok) return;

  const res = await fetch(`/api/order/${id}`, {
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

  loadOrders();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "admin-login.html";
}

loadOrders();
