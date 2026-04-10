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
                date: view.getUint32(8, true),
                path: decoder.decode(uint8.subarray(i + 12, i + 92)).replace(/\\0/g, '').trim(),
                title: decoder.decode(uint8.subarray(i + 92, i + 292)).replace(/\\0/g, '').trim(),
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
                original: view.getUint32(i + 12, true) / 100,
                price: view.getUint32(i + 16, true) / 100,
                orders: view.getUint16(i + 24, true),
                score: view.getUint8(i + 28) / 10,
                delivery: { min: view.getUint8(i + 29), max: view.getUint8(i + 30) },
                status: {
                    promo: (status >> 7) & 1,
                    inStock: (status >> 5) & 1
                }
            });
        }
        return { feedMap: map, matchedIds: storeMatchedIds };
    }

    static parseMeta(buffer) {
        const map = new Map();
        const uint8 = new Uint8Array(buffer);
        const view = new DataView(buffer);
        for (let i = 0; i < uint8.byteLength; i += 264) {
            const id = view.getBigUint64(i, true);
            map.set(id, uint8.slice(i + 8, i + 264));
        }
        return map;
    }
}

self.onmessage = async (e) => {
    const { baseUrl, country, query, storeId } = e.data;
    const CACHE_NAME = 'souq-cache-v1';

    async function getFile(url, hours) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) {
            const date = cached.headers.get('date');
            if (date && (Date.now() - new Date(date).getTime()) < hours * 3600000) return cached.arrayBuffer();
        }
        const res = await fetch(url + '?v=' + new Date().getHours());
        if (res.ok) { cache.put(url, res.clone()); return res.arrayBuffer(); }
        return null;
    }

    try {
        const [coreBuf, feedBuf, metaBuf] = await Promise.all([
            getFile(baseUrl + 'core.bin', 24),
            getFile(baseUrl + country.toUpperCase() + '_feed.bin', 1),
            getFile(baseUrl + 'meta.bin', 24)
        ]);

        let allowedIds = null;
        const targetStore = storeId ? parseInt(storeId) : null;
        const feedResult = BinaryParser.parseFeed(feedBuf, targetStore);
        
        if (targetStore !== null) {
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
`;
