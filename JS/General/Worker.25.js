const workerCode = `
/* --- CLASS DEFINITION --- */
class BinaryParser {
    /* --- HASHING UTILITY --- */
    static murmur(str, seed) {
        let h = seed ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
            h = h ^ (h >>> 13);
        }
        return h >>> 0;
    }

    /* --- FEED PARSING LOGIC --- */
    static parseFeed(buffer, targetStoreId = null) {
        const map = new Map();
        const matchedIds = new Set();
        const view = new DataView(buffer);
        for (let i = 0; i < buffer.byteLength; i += 32) {
            const id = view.getBigUint64(i, true);
            if (id === 0n) continue;
            const status = view.getUint8(i + 31);
            if (!((status & 0x20) !== 0)) continue;
            const storeId = view.getUint32(i + 8, true);
            if (targetStoreId !== null && storeId !== targetStoreId) continue;
            if (targetStoreId !== null) matchedIds.add(id);
            map.set(id, {
                original: view.getUint32(i + 12, true) / 100,
                price: view.getUint32(i + 16, true) / 100,
                orders: view.getUint16(i + 24, true),
                score: view.getUint8(i + 28) / 10,
                delivery: { min: view.getUint8(i + 29), max: view.getUint8(i + 30) },
                status: { 
                    promo: (status >> 7) & 1, 
                    multiSku: (status >> 6) & 1,
                    inStock: (status >> 5) & 1,
                    sud: status & 0x1F 
                }
            });
        }
        return { map, matchedIds };
    }

    /* --- CORE RECORD PARSING --- */
    static parseCoreRecord(uint8, offset, decoder) {
        const view = new DataView(uint8.buffer, uint8.byteOffset + offset, 442);
        return {
            id: view.getBigUint64(0, true),
            date: view.getUint32(8, true),
            path: decoder.decode(uint8.subarray(offset + 12, offset + 92)).replace(/\\0/g, '').trim(),
            title: decoder.decode(uint8.subarray(offset + 92, offset + 292)).replace(/\\0/g, '').trim(),
            imgSlug: uint8.slice(offset + 292, offset + 442)
        };
    }
}

/* --- WORKER EVENT LISTENER --- */
self.onmessage = async (e) => {
    const { baseUrl, coreFile, metaFile, feedFile, query, storeId } = e.data;
    const CACHE_NAME = 'ISeek-Cache-v1';
    const decoder = new TextDecoder();

    /* --- NETWORK & CACHE HELPER --- */
   
    async function getFile(fileName) {
    const url = baseUrl + fileName;
    const res = await fetch(url);
    return res.ok ? res : null;
}

    /* --- MAIN EXECUTION BLOCK --- */
    try {
        /* --- FEED PROCESSING --- */
        const feedRes = await getFile(feedFile, 1);
        if (!feedRes) throw new Error("Feed not found");
        const feedBuf = await feedRes.arrayBuffer();
        const { map: feedMap, matchedIds: storeMatchedIds } = BinaryParser.parseFeed(feedBuf, storeId ? parseInt(storeId) : null);

        let allowedIds = storeId ? storeMatchedIds : null;

        /* --- SEARCH & META FILTERING --- */
        if (query && metaFile) {
            const metaRes = await getFile(metaFile, 24);
            if (metaRes) {
                const metaBuf = await metaRes.arrayBuffer();
                const metaData = new Uint8Array(metaBuf);
                const metaView = new DataView(metaBuf);
                const searchMatchedIds = new Set();
                let qL = query.toLowerCase();
                let hA = BinaryParser.murmur(qL, 42);
                let hB = BinaryParser.murmur(qL, 99);
                let bits = [];
                for (let i = 0; i < 8; i++) {
                    bits.push(Math.abs(hA + i * hB) % 2048);
                }
                for (let i = 0; i < metaData.length; i += 264) {
                    let match = true;
                    for (let b of bits) { 
                        if (!(metaData[i + 8 + Math.floor(b / 8)] & (1 << (b % 8)))) { 
                            match = false; 
                            break; 
                        } 
                    }
                    if (match) searchMatchedIds.add(metaView.getBigUint64(i, true));
                }
                allowedIds = storeId ? new Set([...searchMatchedIds].filter(id => storeMatchedIds.has(id))) : searchMatchedIds;
            }
        }

        /* --- CORE DATA STREAMING --- */
        const coreRes = await getFile(coreFile, 24);
        if (!coreRes) throw new Error("Core not found");
        const reader = coreRes.body.getReader();
        let leftover = new Uint8Array(0);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            let combined = new Uint8Array(leftover.length + value.length);
            combined.set(leftover); combined.set(value, leftover.length);
            let records = [];
            let offset = 0;
            while (offset + 442 <= combined.length) {
                const id = new DataView(combined.buffer, combined.byteOffset + offset, 8).getBigUint64(0, true);
                if (feedMap.has(id) && (!allowedIds || allowedIds.has(id))) {
                    records.push(BinaryParser.parseCoreRecord(combined, offset, decoder));
                }
                offset += 442;
            }
            leftover = combined.slice(offset);
            if (records.length > 0) self.postMessage({ type: 'BATCH', batch: records, feed: feedMap });
        }
        
        /* --- FINAL TERMINATION --- */
        self.postMessage({ type: 'DONE' });
    } catch (err) {
        self.postMessage({ type: 'ERROR', error: err.message });
    }
};
`;
