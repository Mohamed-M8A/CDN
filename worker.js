class BinaryParser {
    static parseCore(buffer) {
        const decoder = new TextDecoder();
        const records = [];
        const uint8 = new Uint8Array(buffer);
        for (let i = 0; i < uint8.byteLength; i += 442) {
            const view = new DataView(uint8.buffer, uint8.byteOffset + i, 442);
            records.push({
                id: view.getBigUint64(0, true),
                date: view.getUint32(8, true),
                path: decoder.decode(uint8.subarray(i + 12, i + 92)).replace(/\0/g, '').trim(),
                title: decoder.decode(uint8.subarray(i + 92, i + 292)).replace(/\0/g, '').trim(),
                imgSlug: uint8.slice(i + 292, i + 442)
            });
        }
        return records;
    }

    static parseFeed(buffer) {
        const map = new Map();
        const view = new DataView(buffer);
        for (let i = 0; i < buffer.byteLength; i += 32) {
            const id = view.getBigUint64(i, true);
            const status = view.getUint8(i + 31);
            map.set(id, {
                storeId: view.getUint32(i + 8, true),
                original: view.getUint32(i + 12, true) / 100,
                price: view.getUint32(i + 16, true) / 100,
                shipping: view.getUint32(i + 20, true) / 100,
                orders: view.getUint16(i + 24, true),
                reviews: view.getUint16(i + 26, true),
                score: view.getUint8(i + 28) / 10,
                delivery: { min: view.getUint8(i + 29), max: view.getUint8(i + 30) },
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
        const uint8 = new Uint8Array(buffer);
        for (let i = 0; i < uint8.byteLength; i += 264) {
            const view = new DataView(uint8.buffer, uint8.byteOffset + i, 264);
            map.set(view.getBigUint64(0, true), uint8.slice(i + 8, i + 264));
        }
        return map;
    }
}

self.onmessage = async (e) => {
    const { baseUrl, country } = e.data;
    const v = Date.now();
    try {
        const [coreRes, feedRes, metaRes] = await Promise.all([
            fetch(`${baseUrl}core.bin?v=${v}`),
            fetch(`${baseUrl}${country.toUpperCase()}_feed.bin?v=${v}`),
            fetch(`${baseUrl}meta.bin?v=${v}`)
        ]);

        if (!coreRes.ok || !feedRes.ok || !metaRes.ok) throw new Error("Fetch Failed");

        const coreBuf = await coreRes.arrayBuffer();
        const feedBuf = await feedRes.arrayBuffer();
        const metaBuf = await metaRes.arrayBuffer();

        const core = BinaryParser.parseCore(coreBuf);
        const feed = BinaryParser.parseFeed(feedBuf);
        const meta = BinaryParser.parseMeta(metaBuf);

        self.postMessage({ type: 'DONE', core, feed, meta });
    } catch (err) {
        self.postMessage({ type: 'ERROR', error: err.message });
    }
};
