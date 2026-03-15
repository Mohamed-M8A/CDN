// ==============================
//  ✅ IMGs
// ==============================
  const thumbContainer = document.querySelector('.thumbnail-container');
  const thumbSlider = document.querySelector('.thumbnails-slider');
  const mainImg = document.getElementById('mainImage');
  let currentIndex = 0;
  const scrollAmount = 240;

  function getThumbnails() {
    return [...document.querySelectorAll('.thumbnail-container img')];
  }

  function applyImageStyle(img) {
    if (!img) return;
    Object.assign(img.style, {
      objectFit: 'contain',
      backgroundColor: 'black',
      width: '100%',
      height: '100%'
    });
  }

  function changeImage(index) {
    const thumbnails = getThumbnails();
    if (!thumbnails[index]) return;
    
    currentIndex = index;
    mainImg.src = thumbnails[index].src;
    applyImageStyle(mainImg);
    
    thumbnails.forEach((img, i) =>
      img.classList.toggle('active-thumb', i === index)
    );
    scrollThumbnailIntoView(index);
  }

  function scrollThumbnailIntoView(index) {
    const thumbnails = getThumbnails();
    const thumb = thumbnails[index];
    if (!thumb || !thumbContainer) return;

    const cRect = thumbContainer.getBoundingClientRect();
    const tRect = thumb.getBoundingClientRect();
    const isRTL = getComputedStyle(thumbContainer).direction === 'rtl';

    const offset = tRect.left < cRect.left
      ? tRect.left - cRect.left - 10
      : tRect.right > cRect.right
        ? tRect.right - cRect.right + 10
        : 0;

    thumbContainer.scrollLeft += isRTL ? offset : -offset;
  }

  document.getElementById('thumbsRight')?.addEventListener('click', () => thumbContainer.scrollLeft += scrollAmount);
  document.getElementById('thumbsLeft')?.addEventListener('click', () => thumbContainer.scrollLeft -= scrollAmount);

  document.getElementById('mainImageRightArrow')?.addEventListener('click', () => {
    const thumbnails = getThumbnails();
    changeImage((currentIndex - 1 + thumbnails.length) % thumbnails.length);
  });

  document.getElementById('mainImageLeftArrow')?.addEventListener('click', () => {
    const thumbnails = getThumbnails();
    changeImage((currentIndex + 1) % thumbnails.length);
  });

  thumbSlider?.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      const thumbnails = getThumbnails();
      const index = thumbnails.indexOf(e.target);
      if (index !== -1) changeImage(index);
    }
  });

  if (getThumbnails().length > 0) changeImage(0);

// ==============================
//  ✅ Modal
// ==============================
  function createModal() {
    if (document.getElementById("imageModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div id="imageModal" class="modal">
        <span class="close" onclick="closeModal()">&times;</span>
        <img class="modal-content" id="modalImage" />
        <span class="arrow left" onclick="navigateModal('prev')"></span>
        <span class="arrow right" onclick="navigateModal('next')"></span>
      </div>
    `);
  }
  createModal();

  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");

  window.openModal = function (index) {
    const thumbnails = getThumbnails();
    const targetIndex = (typeof index === 'number') ? index : currentIndex;
    if (!thumbnails[targetIndex]) return;

    modal.style.display = "flex";
    modalImage.src = thumbnails[targetIndex].src;
    applyImageStyle(modalImage);
    currentIndex = targetIndex;
  };

  window.closeModal = function () { modal.style.display = "none"; };

  window.navigateModal = function (direction) {
    const thumbnails = getThumbnails();
    if (thumbnails.length === 0) return;
    currentIndex = direction === "next"
      ? (currentIndex + 1) % thumbnails.length
      : (currentIndex - 1 + thumbnails.length) % thumbnails.length;
    modalImage.src = thumbnails[currentIndex].src;
    applyImageStyle(modalImage);
  };


// ===================================================
// ✅ Buttons Text
// ===================================================
const buyBtn = document.querySelector(".buy-button");
if (buyBtn) buyBtn.textContent = "اطلب الآن";

const cartBtn = document.querySelector(".add-to-cart");
if (cartBtn) cartBtn.textContent = "أضف للسلة";

// ✅ تغيير نصوص التابات
const textMap = {
  "الوصف": "التفاصيل",
  "المميزات": "المزايا",
  "المواصفات": "الخصائص الفنية",
  "الرسم البياني للسعر": "تحليل الأسعار",
  "تقييم العملاء": "آراء المستخدمين",
  "فيديو": "مشاهدة الفيديو"
};

document.querySelectorAll(".tab-buttons button").forEach(btn => {
  const oldText = btn.textContent.trim();
  if (textMap[oldText]) {
    btn.textContent = textMap[oldText];
  }
});

// ==============================
// ✅ Tabs
// ==============================

let enableInitialScroll = false; 

function showTab(id, btn, forceScroll = false) {
  document.querySelectorAll('[id^="tab"]').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.tab-buttons button').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';

    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const stickyHeight = document.querySelector('.tab-buttons')?.offsetHeight || 0;

    setTimeout(() => {
      if (enableInitialScroll || forceScroll) {
        window.scrollTo({
          top: targetTop - stickyHeight - 10,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  if (btn) btn.classList.add('active');
}

let tabCheck = setInterval(() => {
  const firstBtn = document.querySelector('.tab-buttons button');
  const firstTab = document.getElementById('tab1');

  if (firstBtn && firstTab) {
    showTab('tab1', firstBtn);

    document.querySelectorAll('.tab-buttons button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('onclick')?.match(/'(.*?)'/)?.[1];
        if (id) showTab(id, btn, true);
      });
    });

    clearInterval(tabCheck);
  }
}, 100);

setTimeout(() => clearInterval(tabCheck), 5000);

// ==================================
// ✅ Tab (5)
// ==================================

const goToReviewsBtn = document.getElementById("goToReviews");
if (goToReviewsBtn) {
  goToReviewsBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const tabButtons = document.querySelectorAll('.tab-buttons button');
    const targetButton = Array.from(tabButtons).find(btn =>
      btn.getAttribute('onclick')?.includes("'tab5'")
    );

    if (targetButton) {
      showTab('tab5', targetButton, true);

      setTimeout(() => {
        const reviewsSection = document.getElementById('tab5');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  });
}

// ==============================
// ✅ Customer IMG 
// ==============================
const avatarURL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgwYjQ3P3sS7yC15Dqs4gAPU3sEGpftVMbqMLwaUbIk5lgxsDIxG5LseYewSYgx9ugKh5wI8ZvMZL_Oh2qZd6FD6lvHbSenXP148Iy3AHvflDx8cO6ysEGc3_nOjv4wbs9USnFA2qdgIvy-WX_ybSngrHNRqpuMSACdhRX19hoQztPYC70WNNpU8zEd/w200-h200/6VBx3io.png";
document.querySelectorAll(".avatar-placeholder").forEach(placeholder => {
  const img = document.createElement("img");
  img.src = avatarURL;
  img.alt = "أفاتار";
  img.className = "reviewer-img";
  placeholder.appendChild(img);
});
