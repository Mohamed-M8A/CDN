(function() {
  const _0x4a21 = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J5OHhPVTRFeXJzUElsLWhGMC1QeVVFMmdEQnFLRC1kc05JVGROYTNkY0dnOVVUOVVqMEJmU01rZ1Y0dDNfa0ZVTUU2dy9leGVj";
  const webAppUrl = atob(_0x4a21);
  let actionsList = ["Entry"]; 
  let exitUrl = "Closed Tab/Direct";
  let isSent = false;

  setTimeout(() => {
    const visitorId = (typeof UIDManager !== 'undefined') ? UIDManager.getPersistentId() : "Unknown";

    const getCleanUrl = (url) => {
      if (!url) return "";
      return url.replace("https://souq-alkul.blogspot.com", "") || "/";
    };

    const detectOS = () => {
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) return "Android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
      if (/Win/i.test(ua)) return "Windows";
      if (/Mac/i.test(ua)) return "MacOS";
      return "Linux/Other";
    };

    const prepareData = () => {
      const ua = navigator.userAgent.toLowerCase();
      const { width, height } = window.screen;
      let browser = ua.includes("edg") ? "Edge" : ua.includes("opr") ? "Opera" : ua.includes("chrome") ? "Chrome" : ua.includes("firefox") ? "Firefox" : "Safari";

      return JSON.stringify({
        entryTime: new Date().toLocaleString('sv-SE'),
        visitorId: visitorId,
        action: actionsList.join(" -> "),
        pageUrl: getCleanUrl(window.location.href),
        referrer: document.referrer || "Direct Search",
        exitDestination: exitUrl,
        os: detectOS(),
        browser: browser,
        screenRes: `${width}x${height}`,
        token: "SECURE_BY_DOMAIN"
      });
    };

    const sendFinalData = () => {
      if (isSent || actionsList.length === 0) return;
      const data = prepareData();
      if (navigator.sendBeacon) {
        navigator.sendBeacon(webAppUrl, data);
      } else {
        fetch(webAppUrl, { method: 'POST', body: data, keepalive: true });
      }
      isSent = true;
    };

    document.addEventListener("mousedown", (e) => {
      const target = e.target.closest("a, .buy-button, .add-to-cart, .copy-button, .tab-buttons button");
      if (!target) return;

      if (target.tagName === "A") {
        if (target.href && !target.href.includes("souq-alkul.blogspot.com") && !target.href.startsWith("javascript")) {
          exitUrl = target.href;
          if (!actionsList.includes("Exit Click")) actionsList.push("Exit Click");
        }
      } else {
        let label = "";
        if (target.classList.contains("buy-button")) label = "Buy";
        else if (target.classList.contains("add-to-cart")) label = "Cart";
        else if (target.classList.contains("copy-button")) label = "Coupon";
        else label = "T:" + target.innerText.trim().substring(0, 10);

        if (label && !actionsList.includes(label)) actionsList.push(label);
      }
    });

    window.addEventListener("pagehide", sendFinalData);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendFinalData();
    });

  }, 3500);
})();
