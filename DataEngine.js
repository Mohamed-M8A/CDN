class BinaryParser {
    static parseCore(buffer) {
        const decoder = new TextDecoder();
        const records = [];
        for (let i = 0; i < buffer.byteLength; i += 442) {
            const view = new DataView(buffer.buffer, i, 442);
            records.push({
                id: view.getBigUint64(0, true),
                date: view.getUint32(8, true),
                path: decoder.decode(buffer.subarray(i + 12, i + 92)).replace(/\0/g, '').trim(),
                title: decoder.decode(buffer.subarray(i + 92, i + 292)).replace(/\0/g, '').trim(),
                imgSlug: buffer.subarray(i + 292, i + 442)
            });
        }
        return records;
    }

    static parseFeed(buffer) {
        const map = new Map();
        for (let i = 0; i < buffer.byteLength; i += 32) {
            const view = new DataView(buffer, i, 32);
            const status = view.getUint8(31);
            map.set(view.getBigUint64(0, true), {
                storeId: view.getUint32(8, true),
                original: view.getUint32(12, true) / 100,
                price: view.getUint32(16, true) / 100,
                shipping: view.getUint32(20, true) / 100,
                orders: view.getUint16(24, true),
                reviews: view.getUint16(26, true),
                score: view.getUint8(28) / 10,
                delivery: { min: view.getUint8(29), max: view.getUint8(30) },
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
        for (let i = 0; i < buffer.byteLength; i += 264) {
            const view = new DataView(buffer.buffer, i, 264);
            map.set(view.getBigUint64(0, true), buffer.subarray(i + 8, i + 264));
        }
        return map;
    }
}

export class Store {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.core = [];
        this.feed = new Map();
        this.meta = new Map();
    }

    async init(country) {
        const v = Date.now();
        const [coreRes, feedRes, metaRes] = await Promise.all([
            fetch(`${this.baseUrl}core.bin?v=${v}`),
            fetch(`${this.baseUrl}${country.toUpperCase()}_feed.bin?v=${v}`),
            fetch(`${this.baseUrl}meta.bin?v=${v}`)
        ]);

        if (!coreRes.ok || !feedRes.ok || !metaRes.ok) throw new Error("Fetch Failed");

        this.core = BinaryParser.parseCore(new Uint8Array(await coreRes.arrayBuffer()));
        this.feed = BinaryParser.parseFeed(await feedRes.arrayBuffer());
        this.meta = BinaryParser.parseMeta(new Uint8Array(await metaRes.arrayBuffer()));
    }

    getProduct(index) {
        const base = this.core[index];
        if (!base) return null;
        return {
            ...base,
            feed: this.feed.get(base.id),
            bloom: this.meta.get(base.id)
        };
    }
}
