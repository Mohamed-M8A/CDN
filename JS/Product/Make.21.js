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

                <div class="button-container">
                    <a href="#" class="buy-button" target="_blank" rel="nofollow">-</a>
                    <button class="add-to-cart">-</button>
                    <div id="telegram-alert-wrapper"></div>
                </div>
                <div id="store-bar-wrapper"></div>
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

    window.renderSKUs = function(skuList) {
        const skuWrapper = document.getElementById('sku-images-wrapper') || Object.assign(document.createElement('div'), {id: 'sku-images-wrapper'});
        skuWrapper.style.display = 'contents';
        skuWrapper.innerHTML = "";
        
        const thumbSlider = document.querySelector('.thumbnails-slider');
        if (thumbSlider) thumbSlider.appendChild(skuWrapper);

        skuList.forEach(item => {
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.props;
            img.title = item.props;
            img.loading = "lazy";
            img._skuData = item; 
            
            img.addEventListener('click', () => {
                if (typeof window.updateSKUPrice === "function") window.updateSKUPrice(item);
            });
            
            skuWrapper.appendChild(img);
        });
    };

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
            shipToValue.style.color = canShip ? "#00b894" : "#ff7675";
        }

        document.querySelectorAll(".fee-value").forEach(el => {
            const isFree = data.shippingFee <= 0;
            el.textContent = isFree ? "شحن مجاني" : `${formatPrice(data.shippingFee)} ${symbol}`;
            if (isFree) {
                el.style.color = "#00b894";
                el.style.fontWeight = "bold";
            }
        });

        document.querySelectorAll(".time-value").forEach(el => {
            const min = data.minDelivery;
            const max = data.maxDelivery;
            el.textContent = (min === max || !max) ? `${min} أيام` : `${max}-${min} أيام`;
        });

        const availValue = document.querySelector(".avail-value");
        if (availValue) {
            availValue.textContent = data.inStock ? "متوفر الآن" : "نفذت الكمية";
            availValue.style.color = data.inStock ? "#0984e3" : "#636e72";
        }

        const ordersEl = document.querySelector(".orders-count");
        if (ordersEl) ordersEl.textContent = data.orders.toLocaleString();

        const ratingValueEl = document.getElementById("ratingValue");
        if (ratingValueEl) ratingValueEl.textContent = data.score.toFixed(1);

        const ratingCountEl = document.getElementById("goToReviews");
        if (ratingCountEl) ratingCountEl.textContent = `${(data.reviews || 0).toLocaleString()} تقييمات`;

        UILayout.drawStars(document.getElementById("stars"), parseFloat(data.score) || 0);

        const buyBtn = document.querySelector(".buy-button");
        if (buyBtn && data.productAffCode) {
            buyBtn.href = `https://s.click.aliexpress.com/${data.productAffCode}`;
        }

        const storeWrapper = document.getElementById('store-bar-wrapper');
        if (storeWrapper && data.storeName) {
            const storeLink = `/p/store.html?store=${data.storeId}`;
            const defaultImg = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiwyg94bd89-ILQ8wlX5_Zvu31hLoGcooTyvF5kr88-uCv9QCZOEBDBVycAMDaerf2nnW9TB1EZdoJcmDS641L5ZsDMPFC8p3csM2jTsm8mP_ue_G1A6W5Cn-bohNUkDTU60v-AA5EAFaXceHJF99RzCNWAfvtzui1nitecMqZa2DA/s1600/17d3d08b-825f-43c8-814f-72b91d3a8c8c.png";
            
            storeWrapper.innerHTML = `
                <div class="bar">
                    <img src="${defaultImg}" class="profile-image" alt="Store">
                    <div class="text">${data.storeName}</div>
                    <div class="buttons">
                        <a href="${storeLink}" class="button">زيارة المتجر</a>
                        <a href="https://s.click.aliexpress.com/${data.storeAffCode}" target="_blank" rel="nofollow" class="button">متابعة</a>
                    </div>
                </div>
            `;
        }
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
        const priceCount = view.getUint32(8, true);
        const finalData = [];
        const currency = (typeof getCurrencySymbol === "function") ? getCurrencySymbol() : "";

        for (let i = 0; i < priceCount; i++) {
            const offset = 12 + (i * 8);
            if (offset + 8 > buffer.byteLength) break;
            const timeInMinutes = view.getUint32(offset, true);
            const priceRaw = view.getInt32(offset + 4, true);
            if (timeInMinutes > 0 && priceRaw > 0) {
                const pDate = new Date(Date.UTC(2025, 0, 1) + (timeInMinutes * 60 * 1000));
                finalData.push({
                    date: pDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
                    price: +(priceRaw / 100).toFixed(2),
                    rawTime: timeInMinutes
                });
            }
        }

        finalData.sort((a, b) => a.rawTime - b.rawTime);

        const tab4 = document.getElementById("tab4");
        const chartCanvas = document.getElementById("priceChart");
        if (!finalData.length || !chartCanvas || !tab4) return;

        if (!chartCanvas.parentNode.id.includes("scroll-wrapper")) {
            const scrollContainer = document.createElement("div");
            scrollContainer.id = "chart-scroll-wrapper";
            scrollContainer.style.cssText = "width:100%; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; padding: 20px 0; box-sizing: border-box;";
            
            const innerWrapper = document.createElement("div");
            innerWrapper.id = "chart-inner-resizer";
            innerWrapper.style.height = "320px";
            innerWrapper.style.position = "relative";
            
            chartCanvas.parentNode.insertBefore(scrollContainer, chartCanvas);
            innerWrapper.appendChild(chartCanvas);
            scrollContainer.appendChild(innerWrapper);
            
            const style = document.createElement('style');
            style.innerHTML = `
                #chart-scroll-wrapper::-webkit-scrollbar {height: 4px;}
                #chart-scroll-wrapper::-webkit-scrollbar-thumb {background: #ccc; border-radius: 10px;}
                @media (min-width: 992px) { #chart-inner-resizer { width: 100% !important; } }
                #chart-tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.85);
                    color: #fff;
                    padding: 10px;
                    border-radius: 6px;
                    pointer-events: none;
                    z-index: 9999;
                    font-size: 13px;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                    display: none;
                }
            `;
            document.head.appendChild(style);
        }

        const resizer = document.getElementById("chart-inner-resizer");
        const scrollContainer = document.getElementById("chart-scroll-wrapper");
        
        const isMobile = window.innerWidth < 768;
        resizer.style.width = "100%";

        const prices = finalData.map(x => x.price);
        const dates = finalData.map(x => x.date);
        const min = Math.min(...prices), max = Math.max(...prices);
        const avg = +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const current = prices[prices.length - 1], prev = prices[prices.length - 2] || current;

        const getArrow = (v, c) => v > c ? `<span style="color:#ef4444;">▲</span>` : v < c ? `<span style="color:#10b981;">▼</span>` : "";

        const diffTotal = (current - prev).toFixed(2);
        const statsHtml = `
            <div class="price-stats">
                <div class="stat-item current">
                    <strong>السعر الحالي</strong>
                    <span style="display:flex; align-items:center; gap:5px;">${current} ${currency} ${getArrow(current, prev)}</span>
                    <small style="font-size:11px;color:#666;">(${diffTotal} ${currency})</small>
                </div>
                <div class="stat-item"><strong>المتوسط</strong><span>${avg} ${currency}</span></div>
                <div class="stat-item"><strong>أقل سعر</strong><span>${min} ${currency}</span></div>
                <div class="stat-item"><strong>أعلى سعر</strong><span>${max} ${currency}</span></div>
            </div>`;

        const oldStats = tab4.querySelector(".price-stats");
        if (oldStats) oldStats.remove();
        scrollContainer.insertAdjacentHTML("afterend", statsHtml);

        let tooltipEl = document.getElementById("chart-tooltip") || Object.assign(document.createElement("div"), {id: "chart-tooltip"});
        if (!tooltipEl.parentElement) document.body.appendChild(tooltipEl);

        const externalTooltipHandler = (context) => {
            const { chart, tooltip } = context;
            if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; setTimeout(() => { if(tooltipEl.style.opacity == 0) tooltipEl.style.display = "none"; }, 200); return; }
            
            tooltipEl.style.display = "block"; 
            setTimeout(() => { tooltipEl.style.opacity = 1; }, 10);
            
            const idx = tooltip.dataPoints[0].dataIndex;
            const val = tooltip.dataPoints[0].raw;
            const pVal = idx > 0 ? prices[idx - 1] : val;
            const diff = +(val - pVal).toFixed(2);
            const perc = pVal !== 0 ? ((diff / pVal) * 100).toFixed(1) : 0;
            const arr = diff > 0 ? `<span style="color:#ef4444;">▲</span>` : diff < 0 ? `<span style="color:#10b981;">▼</span>` : "-";
            
            tooltipEl.innerHTML = `
                <div style="font-weight:bold;margin-bottom:4px;border-bottom:1px solid #555;padding-bottom:4px;">${dates[idx]}</div>
                <div>السعر: ${val} ${currency}</div>
                <div style="font-size:12px;">التغير: ${arr} ${diff} (${perc}%)</div>
            `;

            const pos = chart.canvas.getBoundingClientRect();
            const tooltipWidth = tooltipEl.offsetWidth;
            const screenWidth = window.innerWidth;
            
            let leftPos = pos.left + window.pageXOffset + tooltip.caretX + 10;
            if (leftPos + tooltipWidth > screenWidth) {
                leftPos = pos.left + window.pageXOffset + tooltip.caretX - tooltipWidth - 10;
            }
            if (leftPos < 0) leftPos = 10;

            tooltipEl.style.left = leftPos + 'px';
            tooltipEl.style.top = (pos.top + window.pageYOffset + tooltip.caretY - 60) + 'px';
        };

        const ctx = chartCanvas.getContext("2d");
        if (window.myPriceChart) window.myPriceChart.destroy();

        window.myPriceChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    data: prices,
                    borderColor: "#ff6000",
                    backgroundColor: (c) => {
                        const a = c.chart.chartArea; if (!a) return null;
                        const g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
                        g.addColorStop(0, 'rgba(255, 96, 0, 0.15)'); g.addColorStop(1, 'rgba(255, 96, 0, 0)');
                        return g;
                    },
                    borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHitRadius: 20, fill: true, stepped: 'before'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, 
                layout: { padding: { top: 10, bottom: 10 } },
                animation: { duration: 400, easing: 'easeOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false }, tooltip: { enabled: false, external: externalTooltipHandler } },
                scales: {
                    x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: isMobile ? 5 : 10 }, grid: { display: false } },
                    y: { position: 'right', grace: '15%', ticks: { precision: 2 }, grid: { color: '#f0f0f0', drawBorder: false } }
                }
            }
        });

        if (isMobile) scrollContainer.scrollLeft = scrollContainer.scrollWidth;

    } catch (e) { console.error(e); }
};

// =================== Download Chart ===================

(function() {
    window.downloadChartAsImage = function() {
        const chartInstance = window.myPriceChart;
        if (!chartInstance) return;

        const canvas = document.getElementById("priceChart");
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        
        const padding = 40;
        const headerHeight = 140; 
        tempCanvas.width = canvas.width + (padding * 2);
        tempCanvas.height = canvas.height + headerHeight + padding;

        const isDarkMode = document.body.classList.contains('dark-mode');
        ctx.fillStyle = isDarkMode ? "#121212" : "#ffffff";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        const productName = document.querySelector("h1")?.innerText || "تقرير الأسعار";
        
        const countryCode = localStorage.getItem("Cntry") || "SA";
        const countryData = {
               "SA": "السعودية 🇸🇦",
               "AE": "الإمارات 🇦🇪",
               "OM": "عُمان 🇴🇲",
               "MA": "المغرب 🇲🇦",
               "DZ": "الجزائر 🇩🇿",
               "TN": "تونس 🇹🇳"
               };
        const countryName = countryData[countryCode] || "السعودية";

        ctx.direction = "rtl";
        ctx.textAlign = "right";
        
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 26px Arial";
        ctx.fillText("بـورصـة الأسـعـار", tempCanvas.width - padding, 45);

        ctx.fillStyle = isDarkMode ? "#eeeeee" : "#2c3e50";
        ctx.font = "bold 19px Arial";
        const cleanName = productName.length > 55 ? productName.substring(0, 55) + "..." : productName;
        ctx.fillText(cleanName, tempCanvas.width - padding, 80);

        ctx.fillStyle = "#3498db";
        ctx.font = "bold 16px Arial";
        ctx.fillText("الدولة: " + countryName, tempCanvas.width - padding, 105);

        ctx.fillStyle = "#7f8c8d";
        ctx.font = "12px Arial";
        const dateStr = new Date().toLocaleDateString('ar-EG', {year:'numeric', month:'long', day:'numeric'});
        ctx.fillText(window.location.hostname + " | تحديث " + dateStr, tempCanvas.width - padding, 128);

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 12;
        ctx.drawImage(canvas, padding, headerHeight);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDarkMode ? "#333" : "#f0f0f0";
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, tempCanvas.width - 10, tempCanvas.height - 10);

        const imageBase64 = tempCanvas.toDataURL("image/png", 1.0);
        const downloadLink = document.createElement("a");
        downloadLink.href = imageBase64;
        downloadLink.download = `Price-Report-${countryCode}-${new Date().getTime()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const observer = new MutationObserver(() => {
        const stats = document.querySelector(".price-stats");
        if (stats && !document.getElementById("btn-download-chart")) {
            const btnHtml = `
                <div style="text-align: center; margin: 25px 0;">
                    <button id="btn-download-chart" onclick="downloadChartAsImage()" 
                        style="padding: 12px 26px; background: #ff6000; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        حفظ الرسم البياني 
                    </button>
                </div>`;
            stats.insertAdjacentHTML("afterend", btnHtml);
            const btn = document.getElementById("btn-download-chart");
            btn.onmouseover = () => { btn.style.background = "#ff1e00"; };
            btn.onmouseout = () => { btn.style.background = "#ff6e17"; };
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
