const COUNTRY_MAP = {
    "SA": { symbol: "ر.س" },
    "AE": { symbol: "د.إ" },
    "OM": { symbol: "ر.ع" },
    "MA": { symbol: "د.م" },
    "DZ": { symbol: "د.ج" },
    "TN": { symbol: "د.ت" }
};

class Renderer {
    constructor(containerId, placeholder) {
        this.container = document.getElementById(containerId);
        this.placeholder = placeholder;
        const activeCntry = localStorage.getItem("Cntry") || "SA";
        this.currencyConfig = COUNTRY_MAP[activeCntry] || COUNTRY_MAP["SA"];
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

    showSkeletons(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-img"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width:60%"></div>
                    <div class="skeleton skeleton-price"></div>
                </div>`;
        }
        this.container.innerHTML = html;
    }

    formatPriceDisplay(val) {
        return parseFloat(val).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
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
        const symbol = this.currencyConfig.symbol;
        const slug = Renderer.toBase64URL(product.imgSlug);
        const imageUrl = `https://blogger.googleusercontent.com/img/b/R29vZ2xl/${slug}/w220-h220/p.webp`;
        
        let badgeHTML = '', metaHTML = '';
        if (feed) {
            const price = this.formatPriceDisplay(feed.price);
            const original = this.formatPriceDisplay(feed.original);
            const deliveryTime = (feed.delivery.min === feed.delivery.max || !feed.delivery.max) 
                ? `${feed.delivery.min} يوم` : `${feed.delivery.max}-${feed.delivery.min} يوم`;

            if (feed.status.inStock === 0) {
                badgeHTML = '<div class="discount-badge out-of-stock">نفذت</div>';
            } else if (feed.status.promo === 1) {
                badgeHTML = '<div class="discount-badge promo">عرض خاص</div>';
            } else if (feed.original > feed.price) {
                const discount = Math.round(((feed.original - feed.price) / feed.original) * 100);
                badgeHTML = `<div class="discount-badge">-${discount}%</div>`;
            }
            
            metaHTML = `
                <div class="price-display">
                    <span class="discounted-price">${price} ${symbol}</span>
                    ${feed.original > feed.price ? `<span class="original-price">${original} ${symbol}</span>` : ''}
                </div>
                <div class="product-meta-details">
                    <div class="meta-item"><span>⭐</span> ${feed.score}</div>
                    <div class="meta-item">${feed.orders.toLocaleString()} مبيعات</div>
                    <div class="meta-item">🚚 ${deliveryTime}</div>
                </div>`;
        }
        
        card.innerHTML = `
            <div class="image-container">
                ${badgeHTML}
                <img class="post-image" alt="${product.title}" src="${this.placeholder}" data-src="${imageUrl}">
            </div>
            <div class="post-content">
                <h3 class="post-title">${product.title}</h3>
                ${metaHTML}
            </div>`;
        
        const img = card.querySelector('.post-image');
        if (img) this.observer.observe(img);
        return card;
    }

    renderBatch(products, domain, feedMap, clear) {
        if (clear) this.container.innerHTML = '';
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
    DOMAIN: "https://www.iseekprice.com/",
    BASE_URL: "https://api.iseekprice.com/",
    PLACEHOLDER: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    INITIAL_SIZE: 12,
    BATCH_SIZE: 50
};

async function startWidget() {
    const root = document.getElementById(WIDGET_CONFIG.ROOT_ID);
    if (!root) return;

    root.innerHTML = `
        <div id="product-posts" class="product-grid"></div>
        <button id="load-more" class="load-more-btn" style="display:none;">عرض المزيد</button>`;
    
    const grid = document.getElementById('product-posts');
    const loadMoreBtn = document.getElementById('load-more');
    const renderer = new Renderer('product-posts', WIDGET_CONFIG.PLACEHOLDER);
    
    renderer.showSkeletons(WIDGET_CONFIG.INITIAL_SIZE);

    try {
        const mapRes = await fetch(`${WIDGET_CONFIG.BASE_URL}General/map.json?v=${Date.now()}`);
        const fileMap = await mapRes.json();
        const country = localStorage.getItem("Cntry") || "SA";

        let storeData = { core: [], feed: new Map() };
        let currentIndex = 0;
        let isFullyLoaded = false;
        let firstBatchDone = false;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        const renderNextBatch = () => {
            const limit = Math.min(currentIndex + WIDGET_CONFIG.BATCH_SIZE, storeData.core.length);
            const batch = storeData.core.slice(currentIndex, limit);
            if (batch.length > 0) {
                renderer.renderBatch(batch, WIDGET_CONFIG.DOMAIN, storeData.feed, false);
                currentIndex = limit;
            }
            loadMoreBtn.style.display = (isFullyLoaded && currentIndex >= storeData.core.length) ? 'none' : 'block';
        };

        worker.onmessage = (e) => {
            if (e.data.type === 'BATCH') {
                storeData.feed = e.data.feed;
                storeData.core.push(...e.data.batch);

                if (!firstBatchDone && storeData.core.length >= WIDGET_CONFIG.INITIAL_SIZE) {
                    renderer.renderBatch(storeData.core.slice(0, WIDGET_CONFIG.INITIAL_SIZE), WIDGET_CONFIG.DOMAIN, e.data.feed, true);
                    currentIndex = WIDGET_CONFIG.INITIAL_SIZE;
                    firstBatchDone = true;
                    loadMoreBtn.style.display = 'block';
                }
            } else if (e.data.type === 'DONE') {
                isFullyLoaded = true;
                if (storeData.core.length === 0) grid.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
            } else if (e.data.type === 'ERROR') {
                grid.innerHTML = '<div class="error-msg">فشل تحميل البيانات</div>';
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        worker.postMessage({
            baseUrl: WIDGET_CONFIG.BASE_URL,
            coreFile: `General/core_${fileMap.core}.bin`,
            metaFile: `General/meta_${fileMap.meta}.bin`,
            feedFile: `${country}/feed_${fileMap.regions[country].feed}.bin`,
            query: urlParams.get('query'),
            storeId: urlParams.get('store')
        });

        loadMoreBtn.onclick = renderNextBatch;
    } catch (err) {
        console.error(err);
    }
}
document.addEventListener("DOMContentLoaded", startWidget);
