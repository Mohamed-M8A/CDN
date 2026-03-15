// =================== Product UI Layout & Data Injection ===================

(function() {
    const UILayout = {
        injectEmptyShelf() {
            const root = document.getElementById('dynamic-shelf');
            if (!root || root.innerHTML.trim() !== "") return;
            root.innerHTML = `
                <div class="rating-strip">
                    <div class="stars-group" id="stars"></div>
                    <span class="rating-value" id="ratingValue"></span>
                    <span class="divider">|</span>
                    <a class="rating-count" href="#tab5" onclick="showTab('tab5', document.querySelector('[onclick*=\\\'tab5\\\']'))" id="goToReviews"></a>
                </div>
                <hr class="clean-divider">
                <div class="price-box">
                    <div class="top-row">
                        <div class="price-info">
                            <span class="price-discounted"></span>
                            <span class="discount-percentage"></span>
                        </div>
                        <span class="price-saving"></span>
                    </div>
                    <span class="price-original"></span>
                </div>
                <div class="info-boxes-wrapper">
                    <div class="info-box product-variant"><span class="label">الموديل</span><span class="value variant-value">_</span></div>
                    <div class="info-box orders-count-box"><span class="label">الطلبات آخر 6 شهور</span><span class="value orders-count">_</span></div>
                    <div class="info-box product-availability"><span class="label">حالة المنتج</span><span class="value avail-value">_</span></div>
                    <div class="info-box country-shipping"><span class="label" id="shipLabel">الشحن</span><span class="value ship-to-value">_</span></div>
                    <div class="info-box shipping-time"><span class="label">مدة التوصيل</span><span class="value time-value">_</span></div>
                    <div class="info-box shipping-fee"><span class="label">رسوم التوصيل</span><span class="value fee-value">_</span></div>
                </div>
                <hr class="clean-divider">
            `;
        },

        drawStars(container, rating) {
            if (!container) return;
            const fullStars = Math.floor(rating);
            const hasHalf = rating % 1 >= 0.5 ? 1 : 0;
            let starsHTML = "";
            for (let i = 0; i < fullStars; i++) starsHTML += `<span class="star">★</span>`;
            if (hasHalf) starsHTML += `<span class="star half">★</span>`;
            for (let i = 0; i < (5 - fullStars - hasHalf); i++) starsHTML += `<span class="star empty">★</span>`;
            container.innerHTML = starsHTML;
        },

        renderReviewSection() {
            const reviewGroups = document.querySelectorAll('.Customer-Reviews .stars-group');
            reviewGroups.forEach(group => {
                const rating = parseFloat(group.getAttribute('data-rating')) || 5;
                this.drawStars(group, rating);
            });
        }
    };

    const init = () => {
        UILayout.injectEmptyShelf();
        UILayout.renderReviewSection();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    const countryInfo = {
        "SA": { name: "السعودية", symbol: "ر.س", rate: 1 },
        "AE": { name: "الإمارات", symbol: "د.إ", rate: 0.98 },
        "OM": { name: "عُمان", symbol: "ر.ع", rate: 0.10 },
        "MA": { name: "المغرب", symbol: "د.م", rate: 2.70 },
        "DZ": { name: "الجزائر", symbol: "د.ج", rate: 36.00 },
        "TN": { name: "تونس", symbol: "د.ت", rate: 0.83 },
    };

    const activeCountry = localStorage.getItem("Cntry") || "SA";
    const formatPrice = num => parseFloat(num).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});

    window.injectData = function(data) {
        UILayout.injectEmptyShelf();
        const config = countryInfo[activeCountry] || countryInfo["SA"];
        const weight = config.rate || 1; 
        const symbol = config.symbol;
        const countryName = config.name;
        const pOriginal = data.priceOriginal;
        const pDiscounted = data.priceDiscounted;
        const diff = pOriginal - pDiscounted;

        document.querySelectorAll(".price-original").forEach(el => el.textContent = `${formatPrice(pOriginal)} ${symbol}`);
        document.querySelectorAll(".price-discounted").forEach(el => el.textContent = `${formatPrice(pDiscounted)} ${symbol}`);

        const savingEl = document.querySelector(".price-saving");
        const discountEl = document.querySelector(".discount-percentage");

        if (diff > 0 && savingEl) {
            savingEl.innerHTML = `<span class="save-label">وفر:</span> <span class="save-amount">${formatPrice(diff)} ${symbol}</span>`;
            const weightedDiff = diff / weight; 
            let color = "#7f8c8d";
            if (weightedDiff < 100) color = "#16a085";
            else if (weightedDiff < 400) color = "#1abc9c";
            else if (weightedDiff < 600) color = "#3498db";
            else if (weightedDiff < 900) color = "#2ecc71";
            else if (weightedDiff < 1200) color = "#e67e22";
            else if (weightedDiff < 1600) color = "#c0392b";
            else if (weightedDiff < 2000) color = "#f5008b";
            else if (weightedDiff < 3000) color = "#8e44ad";
            else color = "#FFD700";
            
            savingEl.style.color = color;
            savingEl.style.fontWeight = "bold";

            if (weightedDiff >= 500) {
                const saveAmount = savingEl.querySelector(".save-amount");
                if (saveAmount && !saveAmount.querySelector(".fire-gif")) {
                    const fireGif = document.createElement("img");
                    fireGif.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj5J9EL4a9cV3VWmcK1ZYD6OYEB-1APv9gggocpaa7jAJXdgvX8Q7QiaAZC9NxcN25f8MTRSYD6SKwT1LSjL0SB1ovJH1SSkRmqH2y3f1NzWGkC0BE-gpj5bTc1OKi3Rfzh44sAAJSvOS5uq7Ut9ETN-V9LgKim0dkmEVmqUWa-2ZGA7FvMAYrVaJgn/w199-h200/fire%20(1).gif";
                    fireGif.style.cssText = "width:20px; vertical-align:middle; margin-left:5px;";
                    fireGif.classList.add("fire-gif");
                    saveAmount.appendChild(fireGif);
                }
            }
            if (discountEl) discountEl.textContent = `-${Math.round((diff / pOriginal) * 100)}%`;
        }

        const shipLabel = document.getElementById("shipLabel");
        if (shipLabel) shipLabel.textContent = `الشحن إلى ${countryName}`;
        
        const shipToValue = document.querySelector(".ship-to-value");
        if (shipToValue) {
            const canShip = data.minDelivery > 0;
            shipToValue.textContent = canShip ? "متوفر" : "غير متوفر";
            shipToValue.style.color = canShip ? "#2e7d32" : "#c62828";
        }
        
        document.querySelectorAll(".fee-value").forEach(el => {
            el.textContent = data.shippingFee <= 0 ? "مجاني" : `${formatPrice(data.shippingFee)} ${symbol}`;
        });
        
        document.querySelectorAll(".time-value").forEach(el => {
            el.textContent = `${data.maxDelivery}-${data.minDelivery} أيام`;
        });

        const availValue = document.querySelector(".avail-value");
        if (availValue) {
            availValue.textContent = data.inStock ? "متوفر" : "نفذت الكمية";
            availValue.style.color = data.inStock ? "#2e7d32" : "#c62828";
        }

        const ordersEl = document.querySelector(".orders-count");
        if (ordersEl) ordersEl.textContent = data.orders.toLocaleString();

        const ratingValueEl = document.getElementById("ratingValue");
        if (ratingValueEl) ratingValueEl.textContent = data.score.toFixed(1);

        const ratingCountEl = document.getElementById("goToReviews");
        if (ratingCountEl) ratingCountEl.textContent = `${(data.reviews || 0).toLocaleString()} تقييمات`;

        UILayout.drawStars(document.getElementById("stars"), parseFloat(data.score) || 0);
    };
})();

// =================== Promo ===================

window.injectPromo = function(promoData) {
    let container = document.querySelector('.coupon-container');
    const shelf = document.getElementById('dynamic-shelf');

    if (!promoData || !promoData.code || !promoData.code.trim()) {
        if (container) container.style.display = 'none';
        return;
    }

    if (!container && shelf) {
        container = document.createElement('div');
        container.className = 'coupon-container';
        shelf.parentNode.insertBefore(container, shelf.nextSibling);
    }

    if (!container) return;

    const colors = ['#ff4757', '#e91e63', '#ff6b81', '#ff5722'];
    const theme = colors[Math.floor(Math.random() * colors.length)];
    container.style.setProperty('--theme-color', theme);

    const expiryTimestamp = Date.UTC(2025, 0, 1) + (promoData.expiry * 60 * 1000);

    const updateTimer = () => {
        const diffMs = expiryTimestamp - Date.now();
        if (diffMs <= 0) {
            container.style.display = 'none';
            clearInterval(window.promoTimer);
            return;
        }

        const d = Math.floor(diffMs / 86400000);
        const h = Math.floor((diffMs % 86400000) / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        const s = Math.floor((diffMs % 60000) / 1000);

        const timerEl = document.getElementById('promo-timer-text');
        if (timerEl) {
            timerEl.textContent = d > 0 ? `⏳ ينتهي خلال ${d} يوم` : `⏳ ينتهي خلال ${h}:${m}:${s}`;
        }
    };

    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px;">
            <div class="coupon-code" id="couponCode">${promoData.code}</div>
            <button class="copy-button" onclick="copyCoupon('${promoData.code}')">نسخ الكوبون</button>
        </div>
        <div class="promo-meta">
            <span class="qty-badge">🔥 متبقي: ${promoData.quantity} قطعة</span>
            <span id="promo-timer-text" class="timer-nari" style="color: #0048ff; font-weight: 800; font-size: 14px;">⏳ جاري الحساب...</span>
        </div>
    `;

    if (window.promoTimer) clearInterval(window.promoTimer);
    window.promoTimer = setInterval(updateTimer, 1000);
    updateTimer();
};

window.copyCoupon = function(code) {
    const target = code || document.getElementById('couponCode').textContent;
    const btn = document.querySelector('.copy-button');
    const done = () => {
        if (btn) {
            const old = btn.textContent;
            btn.textContent = "تم! ✅";
            setTimeout(() => btn.textContent = old, 2000);
        }
    };
    if (navigator.clipboard) {
        navigator.clipboard.writeText(target).then(done);
    } else {
        const el = document.createElement("textarea");
        el.value = target; document.body.appendChild(el);
        el.select(); document.execCommand('copy');
        document.body.removeChild(el); done();
    }
};

// =================== Chart ===================

window.renderBinaryChart = function(buffer) {
    try {
        const view = new DataView(buffer);
        const startMin = view.getUint32(8, true);
        const baseDate = new Date(Date.UTC(2025, 0, 1) + (startMin * 60 * 1000));
        const finalData = [];
        const currency = (typeof getCurrencySymbol === "function") ? getCurrencySymbol() : "";

        for (let i = 0; i < 365; i++) {
            const priceRaw = view.getUint32(16 + (i * 4), true);
            if (priceRaw > 0) {
                const pDate = new Date(baseDate.getTime());
                pDate.setUTCDate(baseDate.getUTCDate() + i);
                finalData.push({
                    date: pDate.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', year: '2-digit' }),
                    price: +(priceRaw / 100).toFixed(2)
                });
            }
        }

        const tab4 = document.getElementById("tab4");
        const chartCanvas = document.getElementById("priceChart");
        if (!finalData.length || !chartCanvas || !tab4) return;

        const prices = finalData.map(x => x.price);
        const dates = finalData.map(x => x.date);
        const min = Math.min(...prices), max = Math.max(...prices);
        const avg = +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const current = prices[prices.length - 1], prev = prices[prices.length - 2] || current;

        const getArrow = (v, c) => v > c ? `<span class="stat-arrow arrow-up">▲</span>` : v < c ? `<span class="stat-arrow arrow-down">▼</span>` : "";

        const statsHtml = `
            <div class="price-stats">
                <div class="stat-item current">
                    <strong>السعر الحالي</strong>
                    <span>${current} ${currency} ${getArrow(current, prev)}</span>
                    <small style="font-size:11px;color:#666;margin-top:2px;">(${(current - prev).toFixed(2)} ${currency})</small>
                </div>
                <div class="stat-item"><strong>المتوسط</strong><span>${avg} ${currency}</span></div>
                <div class="stat-item"><strong>أقل سعر</strong><span>${min} ${currency}</span></div>
                <div class="stat-item"><strong>أعلى سعر</strong><span>${max} ${currency}</span></div>
            </div>`;

        const oldStats = tab4.querySelector(".price-stats");
        if (oldStats) oldStats.remove();
        chartCanvas.insertAdjacentHTML("afterend", statsHtml);

        let tooltipEl = document.getElementById("chart-tooltip") || Object.assign(document.createElement("div"), {id: "chart-tooltip"});
        if (!tooltipEl.parentElement) document.body.appendChild(tooltipEl);

        const externalTooltipHandler = (context) => {
            const { chart, tooltip } = context;
            if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; tooltipEl.style.display = "none"; return; }
            tooltipEl.style.display = "block";
            tooltipEl.style.opacity = 1;
            const idx = tooltip.dataPoints[0].dataIndex;
            const val = tooltip.dataPoints[0].raw;
            const pVal = idx > 0 ? prices[idx - 1] : val;
            const diff = +(val - pVal).toFixed(2);
            const perc = pVal !== 0 ? ((diff / pVal) * 100).toFixed(1) : 0;
            const arr = diff > 0 ? `<span class="stat-arrow arrow-up">▲</span>` : diff < 0 ? `<span class="stat-arrow arrow-down">▼</span>` : `<span class="stat-arrow">-</span>`;
            tooltipEl.innerHTML = `<div class="tooltip-line" style="font-weight:bold;">${dates[idx]}</div><div class="tooltip-line">السعر: ${val} ${currency}</div><div class="tooltip-line">التغير: ${arr} ${diff} ${currency}</div><div class="tooltip-line">النسبة: ${perc}%</div>`;
            const pos = chart.canvas.getBoundingClientRect();
            const pX = pos.left + window.pageXOffset + tooltip.caretX;
            tooltipEl.style.left = (pX > window.innerWidth * 0.7) ? (pX - 180) + 'px' : (pX + 10) + 'px';
            tooltipEl.style.top = pos.top + window.pageYOffset + tooltip.caretY - 40 + 'px';
        };

        const ctx = chartCanvas.getContext("2d");
        if (window.myPriceChart) window.myPriceChart.destroy();

        chartCanvas.parentElement.style.height = "300px"; 

        window.myPriceChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    data: prices,
                    borderColor: "#e74c3c",
                    backgroundColor: "rgba(231,76,60,0.1)",
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: true,
                    tension: 0 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                elements: { line: { stepped: false } },
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false }, tooltip: { enabled: false, external: externalTooltipHandler } },
                scales: {
                    x: { ticks: { maxTicksLimit: 7 }, grid: { display: false } },
                    y: { position: 'right', grid: { color: '#f0f0f0' }, beginAtZero: false }
                }
            }
        });
    } catch (e) {}
};
