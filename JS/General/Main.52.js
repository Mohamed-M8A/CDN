/* وضع كود MAP_CONFIG هنا في البداية لضمان توفر الإحداثيات */

const workerCode = `
self.onmessage = async (e) => {
    const { config, hashes, country, query, storeId, mainUID } = e.data;
    const decoder = new TextDecoder();

    async function fetchRange(url, start, length) {
        try {
            const res = await fetch(url, { headers: { 'Range': 'bytes=' + start + '-' + (start + length - 1) } });
            return res.status === 206 ? await res.arrayBuffer() : null;
        } catch (err) { return null; }
    }

    try {
        // 1. جلب ملف الـ Feed الأساسي
        const feedUrl = config.BASE_URL + country + '/feed_' + hashes.feed + '.bin';
        const feedRes = await fetch(feedUrl);
        const feedBuf = await feedRes.arrayBuffer();
        const feedView = new DataView(feedBuf);
        const feedMap = new Map();

        for (let i = 0; i < feedBuf.byteLength; i += 32) {
            const id = feedView.getBigUint64(i, true);
            const status = feedView.getUint8(i + 31);
            feedMap.set(id, {
                index: i / 32,
                original: feedView.getUint32(i + 12, true) / 100,
                price: feedView.getUint32(i + 16, true) / 100,
                shipping: feedView.getUint32(i + 20, true) / 100,
                orders: feedView.getUint16(i + 24, true),
                score: feedView.getUint8(i + 28) / 10,
                delivery: { min: feedView.getUint8(i + 29), max: feedView.getUint8(i + 30) },
                hasSKU: (status & 0x40) !== 0,
                hasPromo: (status & 0x80) !== 0,
                isGlobal: (status & 0x20) !== 0,
                inStock: (status >> 5) & 1
            });
        }

        // 2. إذا كنا في صفحة منتج، اجلب التفاصيل فوراً
        if (mainUID) {
            const id = BigInt(mainUID);
            const data = feedMap.get(id);
            if (data) {
                const idx = data.index;
                const [lBuf, sBuf, pBuf, cBuf] = await Promise.all([
                    fetchRange(config.BASE_URL + country + '/links_' + hashes.links + '.bin', idx * 100, 100),
                    data.hasSKU ? fetchRange(config.BASE_URL + country + '/sku_' + hashes.sku + '.bin', idx * 5468, 5468) : null,
                    data.hasPromo ? fetchRange(config.BASE_URL + country + '/promo_' + hashes.promo + '.bin', idx * 32, 32) : null,
                    fetchRange(config.BASE_URL + country + '/fluctuation_' + hashes.fluctuation + '.bin', idx * 2932, 2932)
                ]);

                const details = { initial: data };
                if (lBuf) {
                    details.initial.productAffCode = decoder.decode(new Uint8Array(lBuf, 16, 14)).replace(/\\0/g, '').trim();
                    details.initial.storeAffCode = decoder.decode(new Uint8Array(lBuf, 30, 14)).replace(/\\0/g, '').trim();
                    details.initial.storeName = decoder.decode(new Uint8Array(lBuf, 44, 56)).replace(/\\0/g, '').trim();
                }
                if (sBuf) {
                    const skus = [];
                    const sView = new DataView(sBuf);
                    for (let s = 0; s < 30; s++) {
                        const off = 8 + (s * 182);
                        const pD = sView.getUint32(off + 4, true) / 100;
                        if (pD <= 0) continue;
                        const img = decoder.decode(new Uint8Array(sBuf, off + 14, 40)).replace(/\\0/g, '').trim();
                        skus.push({
                            skuIdx: s,
                            priceOriginal: sView.getUint32(off, true) / 100,
                            priceDiscounted: pD,
                            shippingFee: sView.getUint32(off + 8, true) / 100,
                            minDelivery: sView.getUint8(off + 12),
                            maxDelivery: sView.getUint8(off + 13),
                            image: "https://ae-pic-a1.aliexpress-media.com/kf/" + img + (img.includes('.') ? "" : ".jpg"),
                            props: decoder.decode(new Uint8Array(sBuf, off + 54, 128)).replace(/\\0/g, '').trim().replace(/\\|/g, " - ")
                        });
                    }
                    details.skuList = skus;
                }
                self.postMessage({ type: 'PRODUCT_DETAILS', details });
            }
        }

        // 3. استريم ملف الـ Core للويدجت
        const coreRes = await fetch(config.BASE_URL + 'General/core_' + hashes.core + '.bin');
        const reader = coreRes.body.getReader();
        let leftover = new Uint8Array(0);
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            let combined = new Uint8Array(leftover.length + value.length);
            combined.set(leftover); combined.set(value, leftover.length);
            let records = [], offset = 0;
            while (offset + 442 <= combined.length) {
                const id = new DataView(combined.buffer, combined.byteOffset + offset, 8).getBigUint64(0, true);
                const coreView = new DataView(combined.buffer, combined.byteOffset + offset, 442);
                records.push({
                    id: id,
                    path: decoder.decode(combined.subarray(offset + 12, offset + 92)).replace(/\\0/g, '').trim(),
                    title: decoder.decode(combined.subarray(offset + 92, offset + 292)).replace(/\\0/g, '').trim(),
                    imgSlug: combined.slice(offset + 292, offset + 442)
                });
                offset += 442;
            }
            leftover = combined.slice(offset);
            if (records.length > 0) self.postMessage({ type: 'BATCH', batch: records, feed: feedMap });
        }
        self.postMessage({ type: 'DONE' });
    } catch (err) { self.postMessage({ type: 'ERROR', msg: err.message }); }
};
`;

async function startEngine() {
    const mainUIDEl = document.querySelector("#post-body .UID") || document.querySelector(".UID");
    const root = document.getElementById("souq-widget-root");

    try {
        const res = await fetch(MAP_CONFIG.BASE_URL + "General/map.json?v=" + Date.now());
        const fileMap = await res.json();
        const country = (localStorage.getItem("Cntry") || "SA").toUpperCase();
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
            if (e.data.type === 'PRODUCT_DETAILS') {
                const d = e.data.details;
                if (window.injectData) window.injectData(d.initial);
                if (d.skuList && window.renderSKUs) window.renderSKUs(d.skuList);
            }
            if (e.data.type === 'BATCH' && root) {
                // منطق الرندر للويدجت (نفس الرندر القديم)
            }
        };

        worker.postMessage({
            config: MAP_CONFIG,
            country: country,
            hashes: {
                core: fileMap.core,
                feed: fileMap.regions[country].feed,
                links: fileMap.regions[country].links,
                sku: fileMap.regions[country].sku,
                promo: fileMap.regions[country].promo,
                fluctuation: fileMap.regions[country].fluctuation
            },
            mainUID: mainUIDEl ? mainUIDEl.textContent.trim() : null
        });

    } catch (e) { console.error("Engine Start Failed", e); }
}

document.addEventListener("DOMContentLoaded", startEngine);
