const MAP_CONFIG = {
    BASE_URL: "https://api.iseekprice.com/",
    DOMAIN: "https://www.iseekprice.com/",
    IMG_BASE_URL: "https://ae-pic-a1.aliexpress-media.com/kf/",
    PLACEHOLDER: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_6M_oCTDClXnX0p4KvvHzgjw7X2tBBFzkDp6b057jVwL4KPDL3tscGqe6dKNbLJVbmRDQXlnB3Wbcezf54eTD09j6vLsA7LBsXIEaFX6_Ztqx6e41nWilu1WV4rJjC5AThnbe_vOC-PYH1AMWv0WYgR-QxGp4njSptfwlmmTPBqLMRGzMt0dSElde/s600/%D8%AA%D9%88%D9%81%D9%8A%D8%B1.jpg",
    EPOCH_START: "2025-01-01T00:00:00Z",
    REGIONS: {
        "SA": { name: "السعودية", symbol: "ر.س", rate: 1, flag: "🇸🇦" },
        "AE": { name: "الإمارات", symbol: "د.إ", rate: 0.98, flag: "🇦🇪" },
        "OM": { name: "عُمان", symbol: "ر.ع", rate: 0.10, flag: "🇴🇲" },
        "MA": { name: "المغرب", symbol: "د.م", rate: 2.70, flag: "🇲🇦" },
        "DZ": { name: "الجزائر", symbol: "د.ج", rate: 36.00, flag: "🇩🇿" },
        "TN": { name: "تونس", symbol: "د.ت", rate: 0.83, flag: "🇹🇳" }
    },
    STRIDES: {
        CORE: 442,
        META: 264,
        FEED: 32,
        PROMO: 32,
        SKU: 2888,
        CHART: 2932,
        LINKS: 100
    },
    OFFSETS: {
        CORE: { ID: 0, DATE: 8, URL: 12, TITLE: 92, IMG: 292 },
        META: { ID: 0, CONCLUSION: 8 },
        FEED: { 
            ID: 0, STORE_ID: 8, PRICE_ORIG: 12, PRICE_DISC: 16, 
            SHIP_FEE: 20, ORDERS: 24, REVIEWS: 26, SCORE: 28, 
            DELIVERY_MIN: 29, DELIVERY_MAX: 30, STATUS: 31 
        },
        PROMO: { ID: 0, EXPIRY: 8, QTY: 12, COUPON: 14 },
        SKU: { 
            ID: 0, 
            BLOCK: 8,
            SLOT_SIZE: 96,
            PRICE_ORIG: 0, PRICE_DISC: 4, SHIP_FEE: 8, 
            DEL_MIN: 12, DEL_MAX: 13, IMG: 14, PROPS: 48 
        },
        CHART: { ID: 0, COUNT: 8, DATA: 12, POINT_SIZE: 8 },
        LINKS: { 
            ID: 0, STORE_ID: 8, UPDATE: 12, 
            P_AFF: 16, S_AFF: 30, S_NAME: 44 
        }
    },
    STATUS_BITS: { PROMO: 7, SKU: 6, STOCK: 5, TREND_MASK: 0x1F }
};

window.MAP_ENGINE = {
    getRegion() {
        const code = (localStorage.getItem("Cntry") || "SA").toUpperCase();
        return MAP_CONFIG.REGIONS[code] || MAP_CONFIG.REGIONS["SA"];
    },

    getStride(type) {
        return MAP_CONFIG.STRIDES[type.toUpperCase()];
    },

    formatPrice(val) {
        return (val / 100).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    parseStatus(byte) {
        return {
            hasPromo: !!(byte & (1 << MAP_CONFIG.STATUS_BITS.PROMO)),
            isMultiSKU: !!(byte & (1 << MAP_CONFIG.STATUS_BITS.SKU)),
            inStock: !!(byte & (1 << MAP_CONFIG.STATUS_BITS.STOCK)),
            trend: byte & MAP_CONFIG.STATUS_BITS.TREND_MASK
        };
    },

    minutesToDate(minutes) {
        const start = new Date(MAP_CONFIG.EPOCH_START);
        return new Date(start.getTime() + minutes * 60000);
    },

    toBase64URL(bytes) {
        let lastIndex = bytes.length - 1;
        while (lastIndex >= 0 && bytes[lastIndex] === 0) lastIndex--;
        const cleanBytes = bytes.slice(0, lastIndex + 1);
        return btoa(String.fromCharCode(...cleanBytes))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    getOffset(file, field) {
        return MAP_CONFIG.OFFSETS[file.toUpperCase()][field.toUpperCase()];
    }
};
