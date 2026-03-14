class BinaryParser {
    static parseCore(buffer) {
        const decoder = new TextDecoder();
        const records = [];
        for (let i = 0; i < buffer.byteLength; i += 442) {
            const view = new DataView(buffer.buffer, i, 442);
            records.push({
                id: view.getBigUint64(0, true),
                date: view.getUint32(8, true),
                path: decoder.decode(buffer.subarray(i + 12, i + 92)).replace(/\0/g, '').trim(),
                title: decoder.decode(buffer.subarray(i + 92, i + 292)).replace(/\0/g, '').trim(),
                imgSlug: buffer.subarray(i + 292, i + 442)
            });
        }
        return records;
    }

    static parseFeed(buffer) {
        const map = new Map();
        for (let i = 0; i < buffer.byteLength; i += 32) {
            const view = new DataView(buffer, i, 32);
            const status = view.getUint8(31);
            map.set(view.getBigUint64(0, true), {
                storeId: view.getUint32(8, true),
                original: view.getUint32(12, true) / 100,
                price: view.getUint32(16, true) / 100,
                shipping: view.getUint32(20, true) / 100,
                orders: view.getUint16(24, true),
                reviews: view.getUint16(26, true),
                score: view.getUint8(28) / 10,
                delivery: { min: view.getUint8(29), max: view.getUint8(30) },
                status: {
                    promo: (status >> 7) & 1,
                    sku: (status >> 6) & 1,
                    inStock: (status >> 5) & 1,
                    sud: status & 0x1F
                }
            });
        }
        return map;
    }

    static parseMeta(buffer) {
        const map = new Map();
        for (let i = 0; i < buffer.byteLength; i += 264) {
            const view = new DataView(buffer.buffer, i, 264);
            map.set(view.getBigUint64(0, true), buffer.subarray(i + 8, i + 264));
        }
        return map;
    }
}

class Store {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.core = [];
        this.feed = new Map();
        this.meta = new Map();
    }

    async init(country) {
        const v = Date.now();
        const [coreRes, feedRes, metaRes] = await Promise.all([
            fetch(`${this.baseUrl}core.bin?v=${v}`),
            fetch(`${this.baseUrl}${country.toUpperCase()}_feed.bin?v=${v}`),
            fetch(`${this.baseUrl}meta.bin?v=${v}`)
        ]);
        if (!coreRes.ok || !feedRes.ok || !metaRes.ok) throw new Error("Fetch Failed");
        this.core = BinaryParser.parseCore(new Uint8Array(await coreRes.arrayBuffer()));
        this.feed = BinaryParser.parseFeed(await feedRes.arrayBuffer());
        this.meta = BinaryParser.parseMeta(new Uint8Array(await metaRes.arrayBuffer()));
    }

    getProduct(index) {
        const base = this.core[index];
        if (!base) return null;
        return { ...base, feed: this.feed.get(base.id), bloom: this.meta.get(base.id) };
    }
}

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

    createCard(product, domain) {
        if (!product) return null;
        const card = document.createElement("a");
        card.href = domain + product.path;
        card.className = "post-card title-link";
        const symbol = localStorage.getItem("CurrencySymbol") || "ر.س";
        const data = product.feed;
        
        const slug = Renderer.toBase64URL(product.imgSlug);
        const imageUrl = `https://blogger.googleusercontent.com/img/b/R29vZ2xl/${slug}/w320-h320/p.webp`;
        
        let badgeHTML = '', metaHTML = '';
        if (data) {
            const status = data.status;
            if (status.inStock === 0) badgeHTML = '<div class="discount-badge" style="background:#888">نفذت</div>';
            else if (status.promo === 1) badgeHTML = '<div class="discount-badge" style="background:#ff3b30">عرض خاص</div>';
            else if (data.original > data.price) {
                const discount = Math.round(((data.original - data.price) / data.original) * 100);
                badgeHTML = `<div class="discount-badge">-${discount}%-</div>`;
            }
            metaHTML = `<div class="price-display"><span class="discounted-price">${data.price} ${symbol}</span>${data.original > data.price ? `<span class="original-price">${data.original} ${symbol}</span>` : ''}</div>
                <div class="product-meta-details"><div class="meta-item">★ ${data.score}</div><div class="meta-item">${data.orders}+ طلب</div><div class="meta-item">${data.shipping === 0 ? 'مجاني' : data.shipping}</div></div>`;
        }
        
        card.innerHTML = `<div class="image-container">${badgeHTML}<img class="post-image" alt="${product.title}" src="${this.placeholder}" data-src="${imageUrl}"><div class="external-cart-button"><svg style="width:20px;height:20px;"><use xlink:href="#i-cart"></use></svg></div></div><div class="post-content"><h3 class="post-title">${product.title}</h3>${metaHTML}</div>`;
        const img = card.querySelector('.post-image');
        if (img) this.observer.observe(img);
        return card;
    }

    renderBatch(products, domain) {
        const fragment = document.createDocumentFragment();
        products.forEach(p => { const card = this.createCard(p, domain); if (card) fragment.appendChild(card); });
        this.container.appendChild(fragment);
    }
}

const WIDGET_CONFIG = {
    ROOT_ID: 'souq-widget-root',
    DOMAIN: "https://souq-alkul.blogspot.com/",
    BASE_URL: "https://pub-13fdf8672306452ea378b09a024d0072.r2.dev/",
    PLACEHOLDER: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_6M_oCTDClXnX0p4KvvHzgjw7X2tBBFzkDp6b057jVwL4KPDL3tscGqe6dKNbLJVbmRDQXlnB3Wbcezf54eTD09j6vLsA7LBsXIEaFX6_Ztqx6e41nWilu1WV4rJjC5AThnbe_vOC-PYH1AMWv0WYgR-QxGp4njSptfwlmmTPBqLMRGzMt0dSElde/s600/%D8%AA%D9%88%D9%81%D9%8A%D8%B1.jpg",
    BATCH_SIZE: 50
};

async function startWidget() {
    const root = document.getElementById(WIDGET_CONFIG.ROOT_ID);
    if (!root) return;
    root.innerHTML = `<div id="product-posts" class="product-grid"></div><div id="loader" class="loader-container" style="display:none;"><div class="spinner"></div></div><button id="load-more" style="display:none;">عرض المزيد</button>`;
    const grid = document.getElementById('product-posts'), loadMoreBtn = document.getElementById('load-more'), loader = document.getElementById('loader');
    const store = new Store(WIDGET_CONFIG.BASE_URL), renderer = new Renderer('product-posts', WIDGET_CONFIG.PLACEHOLDER);
    let currentIndex = 0;
    try {
        loader.style.display = 'block';
        await store.init(localStorage.getItem("Cntry") || "SA");
        const renderNextBatch = () => {
            const batch = [];
            const limit = Math.min(currentIndex + WIDGET_CONFIG.BATCH_SIZE, store.core.length);
            for (let i = currentIndex; i < limit; i++) batch.push(store.getProduct(i));
            renderer.renderBatch(batch, WIDGET_CONFIG.DOMAIN);
            currentIndex = limit;
            loadMoreBtn.style.display = currentIndex >= store.core.length ? 'none' : 'block';
        };
        renderNextBatch();
        loadMoreBtn.onclick = renderNextBatch;
    } catch (err) { console.error("Widget Error:", err); } finally { loader.style.display = 'none'; }
}

document.addEventListener("DOMContentLoaded", startWidget);
