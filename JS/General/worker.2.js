const workerCode = `
class BinaryParser {
    static murmur(str, seed) {
        let h = seed ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
            h = h ^ (h >>> 13);
        }
        return h >>> 0;
    }

    static parseMap(buffer) {
        const decoder = new TextDecoder();
        const uint8 = new Uint8Array(buffer);
        const hashes = [];
        for (let i = 0; i < uint8.byteLength; i += 33) {
            hashes.push(decoder.decode(uint8.subarray(i, i + 32)));
        }
        return hashes;
    }

    static parseCore(buffer, allowedIds = null) {
        const decoder = new TextDecoder();
        const records = [];
        const uint8 = new Uint8Array(buffer);
        const view = new DataView(buffer);
        for (let i = 0; i < uint8.byteLength; i += 442) {
            const id = view.getBigUint64(i, true);
            if (allowedIds && !allowedIds.has(id)) continue;
            records.push({
                id: id,
                date: view.getUint32(i + 8, true),
                path: decoder.decode(uint8.subarray(i + 12, i + 92)).replace(/\0/g, '').trim(),
                title: decoder.decode(uint8.subarray(i + 92, i + 292)).replace(/\0/g, '').trim(),
                imgSlug: uint8.slice(i + 292, i + 442)
            });
        }
        return records;
    }

    static parseFeed(buffer, targetStoreId = null) {
        const map = new Map();
        const storeMatchedIds = new Set();
        const view = new DataView(buffer);
        for (let i = 0; i < buffer.byteLength; i += 32) {
            const id = view.getBigUint64(i, true);
            const storeId = view.getUint32(i + 8, true);
            const status = view.getUint8(i + 31);
            if (targetStoreId !== null && storeId !== targetStoreId) continue;
            if (targetStoreId !== null) storeMatchedIds.add(id);
            map.set(id, {
                index: i / 32,
                original: view.getUint32(i + 12, true) / 100,
                price: view.getUint32(i + 16, true) / 100,
                orders: view.getUint16(i + 24, true),
                score: view.getUint8(i + 28) / 10,
                delivery: { min: view.getUint8(i + 29), max: view.getUint8(i + 30) },
                status: {
                    promo: (status >> 7) & 1,
                    sku: (status >> 6) & 1,
                    inStock: (status >> 5) & 1
                }
            });
        }
        return { feedMap: map, matchedIds: storeMatchedIds };
    }
}

const REGION_IDX = { "SA": 0, "AE": 1, "OM": 2, "MA": 3, "DZ": 4, "TN": 5 };

self.onmessage = async (e) => {
    const { type, baseUrl, country, query, storeId, targetId } = e.data;
    const CACHE_NAME = 'souq-v1';

    async function fetchSmart(url, isBin = true) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) return cached.arrayBuffer();
        const res = await fetch(url);
        if (res.ok) {
            cache.put(url, res.clone());
            return res.arrayBuffer();
        }
        return null;
    }

    try {
        const mapBuf = await fetchSmart(baseUrl + 'map.bin?t=' + Date.now());
        const hashes = BinaryParser.parseMap(mapBuf);
        
        const coreHash = hashes[0];
        const metaHash = hashes[1];
        const regBase = 2 + (REGION_IDX[country] * 5);
        
        const fileNames = {
            core: "core_" + coreHash + ".bin",
            meta: "meta_" + metaHash + ".bin",
            feed: country + "_feed_" + hashes[regBase] + ".bin",
            promo: country + "_promo_" + hashes[regBase + 1] + ".bin",
            sku: country + "_sku_" + hashes[regBase + 2] + ".bin",
            chart: country + "_fluctuation_" + hashes[regBase + 3] + ".bin",
            links: country + "_links_" + hashes[regBase + 4] + ".bin"
        };

        if (type === 'GET_PRODUCT_DETAIL') {
            const feedBuf = await fetchSmart(baseUrl + fileNames.feed);
            const { feedMap } = BinaryParser.parseFeed(feedBuf);
            const product = feedMap.get(BigInt(targetId));
            
            if (!product) throw new Error("Not Found");

            const rangeFetch = async (file, start, len) => {
                const res = await fetch(baseUrl + file, { headers: { 'Range': 'bytes=' + start + '-' + (start + len - 1) } });
                return res.arrayBuffer();
            };

            const [linkBuf, skuBuf] = await Promise.all([
                rangeFetch(fileNames.links, product.index * 100, 100),
                product.status.sku ? rangeFetch(fileNames.sku, product.index * 2888, 2888) : Promise.resolve(null)
            ]);

            self.postMessage({ type: 'PRODUCT_RESULT', product, linkBuf, skuBuf }, [linkBuf, skuBuf].filter(Boolean));
            return;
        }

        const [coreBuf, feedBuf, metaBuf] = await Promise.all([
            fetchSmart(baseUrl + fileNames.core),
            fetchSmart(baseUrl + fileNames.feed),
            fetchSmart(baseUrl + fileNames.meta)
        ]);

        let allowedIds = null;
        const feedResult = BinaryParser.parseFeed(feedBuf, storeId ? parseInt(storeId) : null);
        
        if (storeId) {
            allowedIds = feedResult.matchedIds;
        } else if (query && metaBuf) {
            allowedIds = new Set();
            const metaData = new Uint8Array(metaBuf);
            const metaView = new DataView(metaBuf);
            let hA = BinaryParser.murmur(query.toLowerCase(), 42);
            let hB = BinaryParser.murmur(query.toLowerCase(), 99);
            let bits = [];
            for (let i = 0; i < 7; i++) bits.push((hA + i * hB) % 2048);
            for (let i = 0; i < metaData.length; i += 264) {
                let match = true;
                for (let b of bits) {
                    if (!(metaData[i + 8 + Math.floor(b / 8)] & (1 << (b % 8)))) { match = false; break; }
                }
                if (match) allowedIds.add(metaView.getBigUint64(i, true));
            }
        }

        self.postMessage({
            type: 'DONE',
            core: BinaryParser.parseCore(coreBuf, allowedIds),
            feed: feedResult.feedMap
        });

    } catch (err) {
        self.postMessage({ type: 'ERROR', error: err.message });
    }
};
\`;
