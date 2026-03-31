// =================== ✅ Search ===================
const searchPageURL = "https://iseekprice.blogspot.com/p/search.html";
const input = document.getElementById("searchInput");
const form = document.querySelector(".search-box-form");
const historyDropdown = document.getElementById("searchHistoryDropdown");
let searches = JSON.parse(localStorage.getItem('searches')) || [];

function generateLink(queryTerm) {
    return `${searchPageURL}?query=${encodeURIComponent(queryTerm)}`;
}

function updateDropdown() {
    if (!historyDropdown) return;
    historyDropdown.innerHTML = '';
    let toShow = searches.slice(0, 5);
    if (toShow.length === 0) {
        historyDropdown.style.display = 'none';
        return;
    }
    toShow.forEach(term => {
        let item = document.createElement('div');
        let text = document.createElement('span');
        text.textContent = term;
        text.onclick = () => { input.value = term; startSearch(); };
        let del = document.createElement('span');
        del.textContent = '×';
        del.className = 'delete-btn';
        del.onclick = (e) => {
            e.stopPropagation();
            searches = searches.filter(t => t !== term);
            localStorage.setItem('searches', JSON.stringify(searches));
            updateDropdown();
        };
        item.append(text, del);
        historyDropdown.appendChild(item);
    });
    historyDropdown.style.display = 'block';
}

function startSearch() {
    if (!input) return;
    const query = input.value.trim();
    if (query) {
        searches = [query, ...searches.filter(t => t !== query)].slice(0, 10);
        localStorage.setItem('searches', JSON.stringify(searches));
        window.location.href = generateLink(query);
    }
}

if (form) form.onsubmit = (e) => { e.preventDefault(); startSearch(); };
if (input) input.onfocus = updateDropdown;
document.onclick = (e) => { if (historyDropdown && !e.target.closest('.search-container')) historyDropdown.style.display = 'none'; };

// =================== ✅ Search Placeholders ===================
if (input) {
    const placeholders = [
        "ماكينة قهوة ديلونجي","سماعات بلوتوث جالكسي بودز","مكنسة روبوت ذكية","شاحن مغناطيسي للآيفون","ستاند لابتوب قابل للطي",
        "مكواة بخار محمولة","عصارة فواكه كهربائية","كاميرا مراقبة واي فاي","ماوس لاسلكي لابتوب","منظف وجه كهربائي",
        "لوح مفاتيح ميكانيكي RGB","فرامة خضار يدوية","ميزان ذكي للحمية","سماعات رأس للألعاب","ساعة ذكية شاومي",
        "ترايبود كاميرا احترافي","كشاف LED قابل للشحن","دفاية كهربائية صغيرة","مروحة USB مكتبية","عطر عربي فاخر",
        "شاحن متنقل باور بانك","شنطة لابتوب ضد الماء","كرسي ألعاب مريح","سماعات نويس كانسل","خلاط يدوي متعدد الاستخدام",
        "مقص مطبخ ستانلس ستيل","مظلة أوتوماتيكية","فلاش ميموري سريع","مقلاة هوائية صحية","كاميرا فورية بولارويد",
        "ميزان مطبخ رقمي","مبخرة منزلية كهربائية","ترموس حافظ للحرارة","زجاجة ماء ذكية","مصباح مكتب LED",
        "مروحة محمولة باليد","شاحن جداري سريع","منظم أسلاك مكتب","صندوق تخزين بلاستيك","سماعة مكالمات بلوتوث",
        "منقي هواء صغير","سخان ماء كهربائي","دفتر ملاحظات ذكي","قفل بصمة ذكي","موزع صابون أوتوماتيكي",
        "منظم درج ملابس","مقعد أرضي مريح","كوب قهوة حراري","لوحة مفاتيح لاسلكية","مفرمة لحوم كهربائية",
        "أداة تقطيع بطاطس","صانعة فشار منزلية","طقم ملاعق قياس","جهاز قياس حرارة رقمي","منبه مكتبي كلاسيكي",
        "طابعة صور ملونة","لابتوب أسوس","جوال شاومي ريدمي","تابلت سامسونج جالكسي","حقيبة ظهر للطلاب",
        "قرص صلب خارجي","كابل شحن تايب سي","ماوس جيمينج","مكواة شعر سيراميك","عصا سيلفي بلوتوث",
        "آلة حاسبة علمية","سماعة رأس سلكية","دفاية زيت كهربائية","طقم مفكات متعدد","مقص أظافر ستانلس",
        "ابحث في ISeekPrice"
    ];
    function rotatePlaceholder() {
        input.setAttribute("placeholder", placeholders[Math.floor(Math.random() * placeholders.length)]);
    }
    rotatePlaceholder();
    setInterval(rotatePlaceholder, 25000);
}

// =================== ✅ Nav ===================
const rawData = [
    "إلكترونيات / جوالات * لابتوبات * شاشات",
    "جوالات / شاومي * سامسونج * آيفون * أوبو * هواوي",
    "لابتوبات / جيمينج * ماك بوك * لابتوبات أعمال",
    "شاشات / شاشات ذكية * شاشات كمبيوتر",
    "أدوات منزلية / المطبخ * التنظيف",
    "المطبخ / خلاطات * مكاوي * ماكينات قهوة * أفران كهربائية",
    "التنظيف / مكانس كهربائية * غسالات",
    "ملحقات / سماعات * كيبورد وماوس * باور بانك",
    "ألعاب / بلاي ستيشن * إكس بوكس * نينتندو سويتش",
    "عروض مميزة",
];

function buildSmartTree(data) {
    let nodes = {};
    data.forEach(line => {
        if (line.includes('/')) {
            const [parent, children] = line.split('/');
            const pName = parent.trim();
            if (!nodes[pName]) nodes[pName] = { name: pName, children: [] };
            children.split('*').forEach(c => {
                const cName = c.trim();
                if (!nodes[cName]) nodes[cName] = { name: cName, children: [] };
                nodes[pName].children.push(nodes[cName]);
            });
        } else {
            const name = line.trim();
            if (!nodes[name]) nodes[name] = { name: name, children: [] };
        }
    });
    let roots = Object.keys(nodes);
    data.forEach(line => {
        if (line.includes('/')) {
            line.split('/')[1].split('*').forEach(c => {
                roots = roots.filter(r => r !== c.trim());
            });
        }
    });
    return roots.map(name => nodes[name]);
}

const categories = buildSmartTree(rawData);

const toggleBtn = document.getElementById('widget-toggle-btn');
const closeBtn = document.getElementById('widget-close-btn');
const sidebar = document.getElementById('widget-sidebar');
const overlay = document.getElementById('widget-overlay');
const sideList = document.getElementById('widget-side-list');
const desktopCats = document.getElementById('widget-desktop-cats');
const sidebarTitle = document.getElementById('widget-sidebar-title');

function createCategoryRow(cat) {
    const row = document.createElement('div');
    row.className = 'widget-category-row';
    const link = document.createElement('a');
    link.textContent = cat.name;
    link.href = generateLink(cat.name);
    row.appendChild(link);
    if (cat.children && cat.children.length > 0) {
        const btn = document.createElement('span');
        btn.textContent = '❯';
        btn.className = 'widget-expand-btn-sidebar';
        btn.onclick = (e) => { e.preventDefault(); renderSubCategories(cat.name, cat.children); };
        row.appendChild(btn);
    }
    return row;
}

function renderMainCategories() {
    sideList.innerHTML = "";
    sidebarTitle.textContent = 'التصنيفات';
    categories.forEach(cat => sideList.appendChild(createCategoryRow(cat)));
}

function renderSubCategories(title, children) {
    sideList.innerHTML = "";
    sidebarTitle.textContent = title;
    const back = document.createElement('div');
    back.textContent = '← رجوع';
    back.className = 'widget-back-row';
    back.onclick = renderMainCategories;
    sideList.appendChild(back);
    children.forEach(sub => sideList.appendChild(createCategoryRow(sub)));
}

if (desktopCats) {
    categories.slice(0, 5).forEach(cat => {
        const wrap = document.createElement('div');
        wrap.className = 'widget-cat-wrapper';
        const link = document.createElement('a');
        link.textContent = cat.name;
        link.href = generateLink(cat.name);
        link.className = 'widget-cat-link';
        wrap.appendChild(link);
        if (cat.children && cat.children.length > 0) {
            const btn = document.createElement('span');
            btn.textContent = '❯';
            btn.className = 'widget-expand-btn';
            btn.onclick = (e) => { e.preventDefault(); openSidebar(false); renderSubCategories(cat.name, cat.children); };
            wrap.appendChild(btn);
        }
        desktopCats.appendChild(wrap);
    });
}

function openSidebar(main = true) {
    sidebar.style.right = '0';
    overlay.style.display = 'block';
    if (main) renderMainCategories();
}

function closeSidebar() {
    sidebar.style.right = '-300px';
    overlay.style.display = 'none';
}

if (toggleBtn) toggleBtn.onclick = () => openSidebar(true);
if (closeBtn) closeBtn.onclick = closeSidebar;
if (overlay) overlay.onclick = closeSidebar;

function applyResponsive() {
    if (window.innerWidth > 768 && desktopCats) desktopCats.style.display = 'flex';
}
applyResponsive();
window.addEventListener('resize', applyResponsive);
