(function() {
    const BASE_URL = "https://api.iseekprice.com/";
    const IMG_BASE_URL = "https://ae-pic-a1.aliexpress-media.com/kf/";
    const country = (localStorage.getItem("Cntry") || "SA").toUpperCase();
    
    let initialFullData = null;
    let fileMap = null;

    window.currentFileInfo = { size: 0, records: 0 };

    const cleanProps = (str) => {
        if (!str) return "_";
        return str.replace(/\|/g, " - ").trim();
    };

    async function loadMap() {
        try {
            const res = await fetch(`${BASE_URL}General/map.json?v=${Date.now()}`);
            fileMap = await res.json();
            return true;
        } catch (e) { return false; }
    }

    function getCloudName(type) {
        if (!fileMap) return null;
        if (type === "core" || type === "meta") return `General/${type}_${fileMap[type]}.json`;
        const hash = fileMap.regions[country]?.[type];
        if (!hash) return null;
        return `${country}/${type}_${hash}.bin`;
    }

    async function startEngine() {
        try {
            if (!await loadMap()) return;
            const domUIDStr = document.querySelector(".UID")?.textContent.trim();
            if (!domUIDStr) return;
            const targetUID = BigInt(domUIDStr);
            const feedFileName = getCloudName("feed");
            if (!feedFileName) return;

            const res = await fetch(`${BASE_URL}${feedFileName}`);
            if (!res.ok) return;
            const buffer = await res.arrayBuffer();
            const view = new DataView(buffer);
            const stride = 32;

            for (let i = 0; i < buffer.byteLength; i += stride) {
                if (view.getBigUint64(i, true) === targetUID) {
                    const recordIndex = i / stride;
                    window.currentRecordIndex = recordIndex;
                    const flags = view.getUint8(i + 31);

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
                        sudStatus: flags & 0x1F,
                        isGlobal: (flags & 0x20) !== 0,
                        hasSKU: (flags & 0x40) !== 0,
                        hasPromo: (flags & 0x80) !== 0,
                        productAffCode: "",
                        storeAffCode: "",
                        storeName: ""
                    };

                    if (typeof window.injectData === "function") window.injectData(initialFullData);

                    fetchRange(getCloudName("links"), recordIndex * 100, 100, "LINKS");
                    if (initialFullData.hasSKU) fetchRange(getCloudName("sku"), recordIndex * 4508, 4508, "SKU");
                    if (initialFullData.hasPromo) fetchRange(getCloudName("promo"), recordIndex * 32, 32, "PROMO");
                    fetchRange(getCloudName("fluctuation"), recordIndex * 2932, 2932, "CHART");
                    break;
                }
            }
        } catch (e) { console.error(e); }
    }

    async function fetchRange(fileName, start, length, type) {
        if (!fileName) return;
        try {
            const res = await fetch(`${BASE_URL}${fileName}`, { 
                headers: { 'Range': `bytes=${start}-${start + length - 1}` } 
            });
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
                    if (typeof window.injectData === "function") window.injectData(initialFullData);
                }
            } else if (type === "SKU") {
                const skuList = [];
                for (let s = 0; s < 30; s++) {
                    const offset = 8 + (s * 182);
                    if (offset + 182 > buffer.byteLength) break;
                    const pDisc = view.getUint32(offset + 4, true) / 100;
                    if (pDisc === 0) continue;

                    const imgSlug = decoder.decode(new Uint8Array(buffer, offset + 14, 40)).replace(/\0/g, '').trim();
                    const rawProps = decoder.decode(new Uint8Array(buffer, offset + 54, 128)).replace(/\0/g, '').trim();

                    skuList.push({
                        skuIdx: s,
                        priceOriginal: view.getUint32(offset, true) / 100,
                        priceDiscounted: pDisc,
                        shippingFee: view.getUint32(offset + 8, true) / 100,
                        minDelivery: view.getUint8(offset + 12),
                        maxDelivery: view.getUint8(offset + 13),
                        image: IMG_BASE_URL + imgSlug + (imgSlug.includes('.') ? "" : ".jpg"),
                        props: cleanProps(rawProps)
                    });
                }
                if (typeof window.renderSKUs === "function") window.renderSKUs(skuList);
            } else if (type === "PROMO") {
                if (typeof window.injectPromo === "function") {
                    window.injectPromo({
                        expiry: view.getUint32(8, true),
                        quantity: view.getUint16(12, true),
                        code: decoder.decode(new Uint8Array(buffer, 14, 18)).replace(/\0/g, '').trim()
                    });
                }
            } else if (type === "CHART") {
                if (typeof window.renderBinaryChart === "function") window.renderBinaryChart(buffer);
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
