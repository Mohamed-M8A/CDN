(function() {
    const BASE_URL = "https://api.iseekprice.com/";
    const IMG_BASE_URL = "https://ae-pic-a1.aliexpress-media.com/kf/";
    const country = (localStorage.getItem("Cntry") || "SA").toUpperCase();
    
    let initialFullData = null;
    let fileMap = {};

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
            const mapRes = await fetch(`${BASE_URL}map.bin?v=${Date.now()}`);
            if (!mapRes.ok) return;
            const mapText = await mapRes.text();
            const hashes = mapText.trim().split('\n').map(h => h.trim());

            const regions = ["SA", "AE", "OM", "MA", "DZ", "TN"];
            const currentRegionIndex = regions.indexOf(country);

            if (currentRegionIndex !== -1) {
                const startIdx = 2 + (currentRegionIndex * 5);
                fileMap = {
                    feed: `${country}_feed_${hashes[startIdx]}.bin`,
                    promo: `${country}_promo_${hashes[startIdx + 1]}.bin`,
                    sku: `${country}_sku_${hashes[startIdx + 2]}.bin`,
                    chart: `${country}_fluctuation_${hashes[startIdx + 3]}.bin`,
                    links: `${country}_links_${hashes[startIdx + 4]}.bin`
                };
            } else {
                return;
            }

            const domUIDStr = document.querySelector(".UID")?.textContent.trim();
            if (!domUIDStr) return;
            const targetUID = BigInt(domUIDStr);

            const res = await fetch(`${BASE_URL}${fileMap.feed}`);
            if (!res.ok) return;

            const buffer = await res.arrayBuffer();
            const view = new DataView(buffer);
            const stride = 32;

            for (let i = 0; i < buffer.byteLength; i += stride) {
                if (view.getBigUint64(i, true) === targetUID) {
                    const flags = view.getUint8(i + 31);
                    const recordIndex = i / stride;
                    window.currentRecordIndex = recordIndex;

                    initialFullData = {
                        storeId: view.getUint32(i + 8, true),
                        priceOriginal: view.getUint32(i + 12, true) / 100,
                        priceDiscounted: view.getUint32(i + 16, true) / 100,
                        shippingFee: view.getUint32(i + 20, true) / 100,
                        orders: view.getUint16(i + 24, true),
                        reviews: view.getUint16(i + 26, true),
                        score: view.getUint8(i + 28) / 10,
                        minDelivery: view.getUint8(i + 29),
                        maxDelivery: view.getUint8(i + 30),
                        inStock: (flags & 0x20) !== 0,
                        hasSKU: (flags & 0x40) !== 0,
                        hasPromo: (flags & 0x80) !== 0,
                        productAffCode: "",
                        storeAffCode: "",
                        storeName: ""
                    };

                    if (typeof window.injectData === "function") window.injectData(initialFullData);
                    
                    fetchRange(`${BASE_URL}${fileMap.links}`, recordIndex * 100, 100, "LINKS");
                    if (initialFullData.hasSKU) fetchRange(`${BASE_URL}${fileMap.sku}`, recordIndex * 2888, 2888, "SKU");
                    if (initialFullData.hasPromo) fetchRange(`${BASE_URL}${fileMap.promo}`, recordIndex * 32, 32, "PROMO");
                    fetchRange(`${BASE_URL}${fileMap.chart}`, recordIndex * 2932, 2932, "CHART");
                    
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
                const pCode = decoder.decode(new Uint8Array(buffer, 16, 14)).replace(/\0/g, '').trim();
                const sCode = decoder.decode(new Uint8Array(buffer, 30, 14)).replace(/\0/g, '').trim();
                const sName = decoder.decode(new Uint8Array(buffer, 44, 56)).replace(/\0/g, '').trim();

                if (initialFullData) {
                    initialFullData.productAffCode = pCode;
                    initialFullData.storeAffCode = sCode;
                    initialFullData.storeName = sName;
                    localStorage.setItem(`store_${initialFullData.storeId}`, JSON.stringify({name: sName, aff: sCode}));
                    if (typeof window.injectData === "function") window.injectData(initialFullData);
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
