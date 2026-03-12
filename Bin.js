(function() {
    const BASE_URL = "https://pub-13fdf8672306452ea378b09a024d0072.r2.dev/";
    const IMG_BASE_URL = "https://ae-pic-a1.aliexpress-media.com/kf/";
    const country = (localStorage.getItem("Cntry") || "SA").toUpperCase();
    let globalSKUData = [];
    let initialOrders = 0, initialScore = 0, initialReviews = 0, initialStock = false;

    const cleanProps = (str) => {
        try {
            const parsed = JSON.parse(str);
            const items = Array.isArray(parsed) ? parsed[0] : parsed;
            return Object.values(items).join(" - ");
        } catch (e) {
            return str.replace(/[\[\]\{\}\"\']/g, "").replace(/:/g, ": ").replace(/,/g, " - ").trim();
        }
    };

    async function startEngine() {
        try {
            const domUIDStr = document.querySelector(".UID")?.textContent.trim();
            if (!domUIDStr) return;
            const targetUID = BigInt(domUIDStr);

            const res = await fetch(`${BASE_URL}${country}_feed.bin?v=${Date.now()}`);
            if (!res.ok) return;

            const buffer = await res.arrayBuffer();
            const view = new DataView(buffer);
            const stride = 32;

            for (let i = 0; i < buffer.byteLength; i += stride) {
                if (view.getBigUint64(i, true) === targetUID) {
                    const flags = view.getUint8(i + 31);
                    const recordIndex = i / stride;
                    initialOrders = view.getUint16(i + 24, true);
                    initialReviews = view.getUint16(i + 26, true);
                    initialScore = view.getUint8(i + 28) / 10;
                    initialStock = (flags & 0x20) !== 0;

                    const data = {
                        priceOriginal: view.getUint32(i + 12, true) / 100,
                        priceDiscounted: view.getUint32(i + 16, true) / 100,
                        shippingFee: view.getUint32(i + 20, true) / 100,
                        orders: initialOrders,
                        score: initialScore,
                        reviews: initialReviews,
                        minDelivery: view.getUint8(i + 29),
                        maxDelivery: view.getUint8(i + 30),
                        inStock: initialStock,
                        hasSKU: (flags & 0x40) !== 0,
                        hasPromo: (flags & 0x80) !== 0
                    };

                    if (typeof window.injectData === "function") window.injectData(data);
                    
                    if (data.hasSKU) fetchRange(`${BASE_URL}${country}_sku.bin`, recordIndex * 2888, 2888, "SKU");
                    if (data.hasPromo) fetchRange(`${BASE_URL}${country}_promo.bin`, recordIndex * 32, 32, "PROMO");
                    fetchRange(`${BASE_URL}${country}_fluctuation.bin`, recordIndex * 1480, 1480, "CHART");
                    
                    break;
                }
            }
        } catch (e) { console.error(e); }
    }

    async function fetchRange(url, start, length, type) {
        try {
            const res = await fetch(url, { headers: { 'Range': `bytes=${start}-${start + length - 1}` } });
            if (res.status !== 206) return;
            const buffer = await res.arrayBuffer();
            const view = new DataView(buffer);
            const decoder = new TextDecoder();

            if (type === "SKU") {
                globalSKUData = [];
                let skuWrapper = document.getElementById('sku-images-wrapper') || Object.assign(document.createElement('div'), {id: 'sku-images-wrapper'});
                skuWrapper.style.display = 'contents';
                skuWrapper.innerHTML = "";
                const thumbSlider = document.querySelector('.thumbnails-slider');
                if (thumbSlider) thumbSlider.appendChild(skuWrapper);

                for (let s = 0; s < 30; s++) {
                    const offset = 8 + (s * 96);
                    const pDisc = view.getUint32(offset + 4, true) / 100;
                    if (pDisc === 0) continue;

                    const imgSlug = decoder.decode(new Uint8Array(buffer, offset + 14, 34)).replace(/\0/g, '').trim();
                    const item = {
                        priceOriginal: view.getUint32(offset, true) / 100,
                        priceDiscounted: pDisc,
                        shippingFee: view.getUint32(offset + 8, true) / 100,
                        minDelivery: view.getUint8(offset + 12),
                        maxDelivery: view.getUint8(offset + 13),
                        image: IMG_BASE_URL + imgSlug + ".jpg",
                        props: cleanProps(decoder.decode(new Uint8Array(buffer, offset + 48, 48)).replace(/\0/g, '').trim())
                    };
                    globalSKUData.push(item);

                    const img = document.createElement("img");
                    img.src = item.image;
                    img.loading = "lazy";
                    img.addEventListener('click', () => updateSKUPrice(item));
                    skuWrapper.appendChild(img);
                }
            } else if (type === "PROMO" && window.injectPromo) {
                window.injectPromo({
                    expiry: view.getUint32(8, true),
                    quantity: view.getUint16(12, true),
                    code: decoder.decode(new Uint8Array(buffer, 14, 18)).replace(/\0/g, '').trim()
                });
            } else if (type === "CHART" && window.renderBinaryChart) {
                const startMin = view.getUint32(8, true);
                const lastMin = view.getUint32(12, true);
                const epoch2025 = 1735689600000; 
                const startDate = new Date(epoch2025 + (startMin * 60 * 1000));
                const lastDate = new Date(epoch2025 + (lastMin * 60 * 1000));
                let prices = [];
                for (let j = 0; j < 365; j++) {
                    const p = view.getUint32(16 + (j * 4), true) / 100;
                    if (p > 0) prices.push(p);
                }
                window.renderBinaryChart(buffer);
            }
        } catch (e) {}
    }

    function updateSKUPrice(item) {
        if (typeof window.injectData === "function") {
            window.injectData({
                priceOriginal: item.priceOriginal,
                priceDiscounted: item.priceDiscounted,
                shippingFee: item.shippingFee,
                minDelivery: item.minDelivery,
                maxDelivery: item.maxDelivery,
                inStock: initialStock,
                orders: initialOrders,
                score: initialScore,
                reviews: initialReviews
            });
        }
        const variantEl = document.querySelector(".variant-value");
        if (variantEl) variantEl.textContent = item.props;
    }

    startEngine();
})();
