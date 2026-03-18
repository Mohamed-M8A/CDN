class Renderer {
    constructor(containerId, placeholder) {
        this.container = document.getElementById(containerId);
        this.placeholder = placeholder;
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    this.observer.unobserve(img);
                }
            });
        }, { rootMargin: "150px" });
    }

    static toBase64URL(bytes) {
        let lastIndex = bytes.length - 1;
        while (lastIndex >= 0 && bytes[lastIndex] === 0) lastIndex--;
        const cleanBytes = bytes.slice(0, lastIndex + 1);
        return btoa(String.fromCharCode(...cleanBytes))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    createCard(product, domain, feed) {
        if (!product) return null;
        const card = document.createElement("a");
        card.href = domain + product.path;
        card.className = "post-card title-link";
        const symbol = localStorage.getItem("CurrencySymbol") || "ر.س";
        const slug = Renderer.toBase64URL(product.imgSlug);
        const imageUrl = `https://blogger.googleusercontent.com/img/b/R29vZ2xl/${slug}/w220-h220/p.webp`;
        
        let badgeHTML = '', metaHTML = '';
        if (feed) {
            if (feed.status.inStock === 0) {
                badgeHTML = '<div class="discount-badge" style="background:#888">نفذت</div>';
            } else if (feed.status.promo === 1) {
                badgeHTML = '<div class="discount-badge" style="background:#ff3b30">عرض خاص</div>';
            } else if (feed.original > feed.price) {
                const discount = Math.round(((feed.original - feed.price) / feed.original) * 100);
                badgeHTML = `<div class="discount-badge">-${discount}%</div>`;
            }
            
            metaHTML = `
                <div class="price-display">
                    <span class="discounted-price">${feed.price} ${symbol}</span>
                    ${feed.original > feed.price ? `<span class="original-price">${feed.original} ${symbol}</span>` : ''}
                </div>
                <div class="product-meta-details">
                    <div class="meta-item">★ ${feed.score}</div>
                    <div class="meta-item">${feed.orders} تم بيع</div>
                    <div class="meta-item">${feed.delivery.max}-${feed.delivery.min} يوم</div>
                </div>`;
        }
        
        card.innerHTML = `
            <span class="UID" style="display:none">${product.id}</span>
            <div class="image-container">
                ${badgeHTML}
                <img class="post-image" alt="${product.title}" src="${this.placeholder}" data-src="${imageUrl}">
                <div class="external-cart-button">
                    <svg style="width:20px;height:20px;"><use xlink:href="#i-cart"></use></svg>
                </div>
            </div>
            <div class="post-content">
                <h3 class="post-title">${product.title}</h3>
                ${metaHTML}
            </div>`;
        
        const img = card.querySelector('.post-image');
        if (img) this.observer.observe(img);
        return card;
    }

    renderBatch(products, domain, feedMap) {
        const fragment = document.createDocumentFragment();
        products.forEach(p => {
            const card = this.createCard(p, domain, feedMap.get(p.id));
            if (card) fragment.appendChild(card);
        });
        this.container.appendChild(fragment);
    }
}

const WIDGET_CONFIG = {
    ROOT_ID: 'souq-widget-root',
    DOMAIN: "https://iseekprice.blogspot.com/",
    BASE_URL: "https://pub-13fdf8672306452ea378b09a024d0072.r2.dev/",
    PLACEHOLDER: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_6M_oCTDClXnX0p4KvvHzgjw7X2tBBFzkDp6b057jVwL4KPDL3tscGqe6dKNbLJVbmRDQXlnB3Wbcezf54eTD09j6vLsA7LBsXIEaFX6_Ztqx6e41nWilu1WV4rJjC5AThnbe_vOC-PYH1AMWv0WYgR-QxGp4njSptfwlmmTPBqLMRGzMt0dSElde/s600/%D8%AA%D9%88%D9%81%D9%8A%D8%B1.jpg",
    INITIAL_SIZE: 12,
    BATCH_SIZE: 50
};

async function startWidget() {
    const root = document.getElementById(WIDGET_CONFIG.ROOT_ID);
    if (!root) return;
    
    root.innerHTML = `
        <div id="product-posts" class="product-grid"></div>
        <div id="loader" class="loader-container"><div class="spinner"></div></div>
        <button id="load-more" class="load-more-btn" style="display:none;">عرض المزيد</button>`;
    
    const grid = document.getElementById('product-posts');
    const loadMoreBtn = document.getElementById('load-more');
    const loader = document.getElementById('loader');
    const renderer = new Renderer('product-posts', WIDGET_CONFIG.PLACEHOLDER);
    
    let currentIndex = 0;
    let storeData = { core: [], feed: new Map() };

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    const renderNextBatch = () => {
        if (storeData.core.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;">لا توجد نتائج تطابق بحثك</div>';
            return;
        }
        const size = currentIndex === 0 ? WIDGET_CONFIG.INITIAL_SIZE : WIDGET_CONFIG.BATCH_SIZE;
        const limit = Math.min(currentIndex + size, storeData.core.length);
        const batch = storeData.core.slice(currentIndex, limit);
        renderer.renderBatch(batch, WIDGET_CONFIG.DOMAIN, storeData.feed);
        currentIndex = limit;
        loadMoreBtn.style.display = currentIndex >= storeData.core.length ? 'none' : 'block';
    };

    worker.onmessage = (e) => {
        if (e.data.type === 'DONE') {
            storeData = e.data;
            loader.style.display = 'none';
            renderNextBatch();
        } else if (e.data.type === 'ERROR') {
            console.error(e.data.error);
            loader.style.display = 'none';
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;">حدث خطأ أثناء تحميل البيانات</div>';
        }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    loadMoreBtn.onclick = renderNextBatch;
    worker.postMessage({
        baseUrl: WIDGET_CONFIG.BASE_URL,
        country: localStorage.getItem("Cntry") || "SA",
        query: query
    });
}

document.addEventListener("DOMContentLoaded", startWidget);
