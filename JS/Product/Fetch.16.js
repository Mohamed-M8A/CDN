(function() {
    const worker = new Worker(URL.createObjectURL(new Blob([window.workerCode], { type: 'application/javascript' })));

    async function getProductData() {
        const domUIDStr = document.querySelector(".UID")?.textContent.trim();
        if (!domUIDStr) return;

        worker.postMessage({
            type: 'GET_PRODUCT_DETAIL',
            baseUrl: "https://api.iseekprice.com/",
            country: localStorage.getItem("Cntry") || "SA",
            targetId: domUIDStr
        });
    }

    worker.onmessage = (e) => {
        const { type, product, linkBuf, skuBuf, error } = e.data;

        if (type === 'PRODUCT_RESULT') {
            if (typeof window.injectData === "function") {
                window.injectData(product);
            }

            if (linkBuf) {
                const decoder = new TextDecoder();
                const pCode = decoder.decode(new Uint8Array(linkBuf, 16, 14)).replace(/\0/g, '').trim();
                const sCode = decoder.decode(new Uint8Array(linkBuf, 30, 14)).replace(/\0/g, '').trim();
                const sName = decoder.decode(new Uint8Array(linkBuf, 44, 56)).replace(/\0/g, '').trim();

                window.injectData({
                    ...product,
                    productAffCode: pCode,
                    storeAffCode: sCode,
                    storeName: sName
                });
            }

            if (skuBuf && typeof window.renderSKUs === "function") {
                const skuList = [];
                const view = new DataView(skuBuf);
                const decoder = new TextDecoder();
                const IMG_BASE_URL = "https://ae-pic-a1.aliexpress-media.com/kf/";

                for (let s = 0; s < 30; s++) {
                    const offset = 8 + (s * 96);
                    if (offset + 4 > skuBuf.byteLength) break;
                    
                    const pDisc = view.getUint32(offset + 4, true) / 100;
                    if (pDisc === 0) continue;

                    const imgSlug = decoder.decode(new Uint8Array(skuBuf, offset + 14, 34)).replace(/\0/g, '').trim();
                    
                    skuList.push({
                        skuIdx: s,
                        priceOriginal: view.getUint32(offset, true) / 100,
                        priceDiscounted: pDisc,
                        shippingFee: view.getUint32(offset + 8, true) / 100,
                        minDelivery: view.getUint8(offset + 12),
                        maxDelivery: view.getUint8(offset + 13),
                        image: IMG_BASE_URL + imgSlug + (imgSlug.includes('.') ? "" : ".jpg"),
                        props: cleanProps(decoder.decode(new Uint8Array(skuBuf, offset + 48, 48)).replace(/\0/g, '').trim())
                    });
                }
                window.renderSKUs(skuList);
            }
        } else if (type === 'ERROR') {
            console.error("Worker Error:", error);
        }
    };

    const cleanProps = (str) => {
        try {
            const parsed = JSON.parse(str);
            return (Array.isArray(parsed) ? parsed[0] : parsed).join(" - ");
        } catch (e) {
            return str.replace(/[\[\]\{\}\"\']/g, "").replace(/:/g, ": ").replace(/,/g, " - ").trim();
        }
    };

    getProductData();
})();
