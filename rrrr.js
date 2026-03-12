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
                    <a class="rating-count" href="#tab5" onclick="showTab('tab5', document.querySelector('[onclick*=\'tab5\']'))" id="goToReviews"></a>
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
            if (weightedDiff >= 100) color = "#16a085";
            else if (weightedDiff < 400) color = "#1abc9c";
            else if (weightedDiff < 600) color = "#2ecc71";
            else if (weightedDiff < 900) color = "#f1c40f";
            else if (weightedDiff < 1200) color = "#e67e22";
            else if (weightedDiff < 1600) color = "#c0392b";
            else if (weightedDiff < 2000) color = "#f5008b";
            else if (weightedDiff < 3000) color = "#8e44ad";
            else color = "#f39c12";
            
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

// =================== Binary Price History Chart ===================

window.renderBinaryChart = function(buffer) {
    try {
        const view = new DataView(buffer);
        const startMin = view.getUint32(8, true);
        const epoch2025 = Date.UTC(2025, 0, 1);
        const baseDate = new Date(epoch2025 + (startMin * 60 * 1000));
        
        const finalData = [];
        const currency = (typeof getCurrencySymbol === "function") ? getCurrencySymbol() : "";

        for (let i = 0; i < 365; i++) {
            const priceRaw = view.getUint32(16 + (i * 4), true);
            if (priceRaw > 0) {
                const pointDate = new Date(baseDate.getTime());
                pointDate.setUTCDate(baseDate.getUTCDate() + i);
                finalData.push({
                    date: pointDate.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', year: 'numeric' }),
                    price: +(priceRaw / 100).toFixed(2)
                });
            }
        }

        const chartCanvas = document.getElementById("priceChart");
        if (!finalData.length || !chartCanvas) return;

        // --- القضاء على التوسع اللانهائي ---
        const parent = chartCanvas.parentElement;
        // نثبت الارتفاع هنا لضمان عدم تمدد الحاوية للأبد
        parent.style.position = "relative";
        parent.style.height = "320px"; 
        parent.style.width = "100%";
        parent.style.overflow = "hidden"; // منع أي تسرب بصري

        const prices = finalData.map(x => x.price);
        const dates = finalData.map(x => x.date);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        const endPrice = prices[prices.length - 1];
        const prevPrice = prices[prices.length - 2] || endPrice;

        const getArrow = (v, c) => v > c ? `<span class="stat-arrow arrow-up">▲</span>` : v < c ? `<span class="stat-arrow arrow-down">▼</span>` : "";

        const statsHtml = `
            <div class="price-stats" style="margin-top: 10px;">
                <div class="stat-item current">
                    <strong>السعر الحالي</strong>
                    <span>${endPrice} ${currency} ${getArrow(endPrice, prevPrice)}</span>
                </div>
                <div class="stat-item"><strong>المتوسط</strong> <span>${avg}</span></div>
                <div class="stat-item"><strong>الأقل</strong> <span class="arrow-down">${min}</span></div>
                <div class="stat-item"><strong>الأعلى</strong> <span class="arrow-up">${max}</span></div>
            </div>
        `;

        const oldStats = parent.querySelector(".price-stats");
        if (oldStats) oldStats.remove();
        chartCanvas.insertAdjacentHTML("afterend", statsHtml);

        const ctx = chartCanvas.getContext("2d");
        if (window.myPriceChart) window.myPriceChart.destroy();

        window.myPriceChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    data: prices,
                    borderColor: "#e74c3c",
                    backgroundColor: "rgba(231,76,60,0.1)",
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // هذا ضروري جداً مع تحديد ارتفاع الأب
                animation: false, // تعطيل الأنميشن يمنع أحياناً مشاكل إعادة الرسم المتكرر
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true } // تفعيل التول تيب الافتراضي مؤقتاً للتأكد من الثبات
                },
                scales: {
                    x: { ticks: { maxTicksLimit: 5 }, grid: { display: false } },
                    y: { position: 'right' }
                }
            }
        });
    } catch (err) {}
};
