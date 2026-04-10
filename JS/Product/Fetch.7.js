(function() {
    const BASE_URL = "https://api.iseekprice.com/";
    const IMG_BASE_URL = "https://ae-pic-a1.aliexpress-media.com/kf/";
    const country = (localStorage.getItem("Cntry") || "SA").toUpperCase();
    
    let initialOrders = 0, initialScore = 0, initialReviews = 0, initialStock = false;
    let initialFullData = null;

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
                    
                    window.currentRecordIndex = recordIndex;

                    const extractedStoreID = view.getUint32(i + 8, true);

                    initialOrders = view.getUint16(i + 24, true);
                    initialReviews = view.getUint16(i + 26, true);
                    initialScore = view.getUint8(i + 28) / 10;
                    initialStock = (flags & 0x20) !== 0;

                    initialFullData = {
                        storeId: extractedStoreID,
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
                        hasPromo: (flags & 0x80) !== 0,
                        productAffCode: "",
                        storeAffCode: "",
                        storeName: ""
                    };

                    if (typeof window.injectData === "function") {
                        window.injectData(initialFullData);
                    }
                    
                    fetchRange(`${BASE_URL}${country}_links.bin`, recordIndex * 100, 100, "LINKS");

                    if (initialFullData.hasSKU) fetchRange(`${BASE_URL}${country}_sku.bin`, recordIndex * 2888, 2888, "SKU");
                    if (initialFullData.hasPromo) fetchRange(`${BASE_URL}${country}_promo.bin`, recordIndex * 32, 32, "PROMO");
                    fetchRange(`${BASE_URL}${country}_fluctuation.bin`, recordIndex * 2932, 2932, "CHART");
                    
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
            const decoder = new TextDecoder("utf-8");

            if (type === "LINKS") {
                const pCode = decoder.decode(new Uint8Array(buffer, 12, 14)).replace(/\0/g, '').trim();
                const sCode = decoder.decode(new Uint8Array(buffer, 26, 14)).replace(/\0/g, '').trim();
                const sName = decoder.decode(new Uint8Array(buffer, 40, 60)).replace(/\0/g, '').trim();

                if (initialFullData) {
                    initialFullData.productAffCode = pCode;
                    initialFullData.storeAffCode = sCode;
                    initialFullData.storeName = sName;

                    localStorage.setItem(`store_${initialFullData.storeId}`, JSON.stringify({
                        name: sName,
                        aff: sCode
                    }));

                    if (typeof window.injectData === "function") {
                        window.injectData(initialFullData);
                    }
                }
            } else if (type === "SKU") {
                const skuList = [];
                for (let s = 0; s < 30; s++) {
                    const offset = 8 + (s * 96);
                    if (offset + 4 > buffer.byteLength) break;
                    const pDisc = view.getUint32(offset + 4, true) / 100;
                    if (pDisc === 0) continue;
                    const imgSlug = decoder.decode(new Uint8Array(buffer, offset + 14, 34)).replace(/\0/g, '').trim();
                    skuList.push({
                        skuIdx: s, 
                        priceOriginal: view.getUint32(offset, true) / 100,
                        priceDiscounted: pDisc,
                        shippingFee: view.getUint32(offset + 8, true) / 100,
                        minDelivery: view.getUint8(offset + 12),
                        maxDelivery: view.getUint8(offset + 13),
                        image: IMG_BASE_URL + imgSlug + (imgSlug.includes('.') ? "" : ".jpg"),
                        props: cleanProps(decoder.decode(new Uint8Array(buffer, offset + 48, 48)).replace(/\0/g, '').trim())
                    });
                }
                if (typeof window.renderSKUs === "function") window.renderSKUs(skuList);
            } else if (type === "PROMO" && window.injectPromo) {
                window.injectPromo({
                    expiry: view.getUint32(8, true),
                    quantity: view.getUint16(12, true),
                    code: decoder.decode(new Uint8Array(buffer, 14, 18)).replace(/\0/g, '').trim()
                });
            } else if (type === "CHART" && window.renderBinaryChart) {
                window.renderBinaryChart(buffer);
            }
        } catch (e) {}
    }

    window.updateSKUPrice = function(item) {
        window.selectedSkuIndex = item.skuIdx;
        if (initialFullData && typeof window.injectData === "function") {
            window.injectData({
                ...initialFullData,
                priceOriginal: item.priceOriginal,
                priceDiscounted: item.priceDiscounted,
                shippingFee: item.shippingFee,
                minDelivery: item.minDelivery,
                maxDelivery: item.maxDelivery
            });
        }
        const variantEl = document.querySelector(".variant-value");
        if (variantEl) variantEl.textContent = item.props;
    };

    window.resetToInitialData = function() {
        window.selectedSkuIndex = 255; 
        if (initialFullData && typeof window.injectData === "function") {
            window.injectData(initialFullData);
            const variantEl = document.querySelector(".variant-value");
            if (variantEl) variantEl.textContent = "_";
        }
    };

    startEngine();
})();
