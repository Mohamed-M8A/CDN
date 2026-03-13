/***********************
 * ✅ Toast
 ***********************/
function showCartToast(message, type = "success") {
  const host = document.createElement("div");
  document.body.prepend(host);
  const shadow = host.attachShadow({ mode: "open" });
  const toast = document.createElement("div");
  toast.textContent = message;
  shadow.appendChild(toast);

  const style = document.createElement("style");
  style.textContent = `
    div {
      position: fixed; top: 20px; right: 20px;
      min-width: 220px; max-width: 320px;
      background: ${type === "error" ? "#e74c3c" : "#2ecc71"};
      color: white; font-family: sans-serif; font-size: 14px;
      padding: 12px 18px; border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0; transform: translateX(120%);
      transition: all 0.4s ease; z-index: 1000000;
    }
    div.show { opacity: 1; transform: translateX(0); }
  `;
  shadow.appendChild(style);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => host.remove(), 400);
  }, 3000);
}

/***********************
 * ✅ UID Restore
 ***********************/
function addToCart(productId) {
  if (!productId) {
    showCartToast("عذراً، لم يتم العثور على معرف المنتج!", "error");
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const exists = cart.some(item => item.id === productId);

  if (exists) {
    showCartToast("المنتج موجود بالفعل في العربة!", "error");
    return;
  }

  cart.push({ id: productId, timestamp: new Date().getTime() });
  localStorage.setItem("cart", JSON.stringify(cart));
  
  window.dispatchEvent(new Event("cartUpdated"));
  showCartToast("تمت إضافة المنتج بنجاح!", "success");
}

/***********************
 * ✅ جلب المعرف من صفحة المنتج
 ***********************/
function handleAddToCart(event) {
  event.preventDefault();
  event.stopPropagation();

  const uidElement = document.querySelector(".UID");
  const productId = uidElement ? uidElement.textContent.trim() : null;
  
  addToCart(productId);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
    newBtn.addEventListener("click", handleAddToCart);
  });
});

/***********************
 * ✅ UID Core
 ***********************/
document.addEventListener("click", function (e) {
  const cartButton = e.target.closest(".external-cart-button");
  if (cartButton) {
    e.preventDefault();
    e.stopPropagation();

    const postCard = e.target.closest(".post-card");
    const productId = postCard ? postCard.querySelector(".UID")?.textContent.trim() : null;
    
    addToCart(productId);
  }
});
