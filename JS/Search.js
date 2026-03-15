// =================== ✅ Search ===================
const searchPageURL = "https://souq-alkul.blogspot.com/p/search.html";
const input = document.getElementById("searchInput");
const form = document.querySelector(".search-box-form");
const historyDropdown = document.getElementById("searchHistoryDropdown");

let searches = JSON.parse(localStorage.getItem('searches')) || [];

function updateDropdown() {
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
    text.addEventListener('click', () => {
      input.value = term;
      historyDropdown.style.display = 'none';
    });

    let del = document.createElement('span');
    del.textContent = '×';
    del.classList.add('delete-btn');
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      searches = searches.filter(t => t !== term);
      localStorage.setItem('searches', JSON.stringify(searches));
      updateDropdown();
    });

    item.appendChild(text);
    item.appendChild(del);
    historyDropdown.appendChild(item);
  });

  historyDropdown.style.display = 'block';
}

function startSearch() {
  if (!input) return;
  const query = input.value.trim();
  if (query) {
    searches = searches.filter(t => t !== query);
    searches.unshift(query);
    if (searches.length > 10) searches = searches.slice(0, 10);
    localStorage.setItem('searches', JSON.stringify(searches));

    window.location.href = `${searchPageURL}?q=${encodeURIComponent(query)}`;
  }
}

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    startSearch();
  });
}

if (input) {
  input.addEventListener('focus', updateDropdown);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    historyDropdown.style.display = 'none';
  }
});

// =================== ✅ placeholders ===================
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
    "ابحث في سوق الكل"
  ];

  function getRandomPlaceholder() {
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    return placeholders[randomIndex];
  }

  function rotatePlaceholder() {
    if (placeholders.length > 0) {
      input.setAttribute("placeholder", getRandomPlaceholder());
    }
  }

  rotatePlaceholder();
  setInterval(rotatePlaceholder, 25000); 
}

// =================== ✅ Nav Bar ===================

        const categories = [
            {
                name: 'إلكترونيات',
                children: [
                    {
                        name: 'جوالات',
                        children: [
                            { name: 'شاومي' },
                            { name: 'سامسونج' },
                            { name: 'آيفون' },
                            { name: 'أوبو' },
                            { name: 'هواوي' }
                        ]
                    },
                    { name: 'لابتوبات', children: [{ name: 'جيمينج' }, { name: 'ماك بوك' }, { name: 'لابتوبات أعمال' }] },
                    { name: 'شاشات', children: [{ name: 'شاشات ذكية' }, { name: 'شاشات كمبيوتر' }] }
                ]
            },
            {
                name: 'أدوات منزلية',
                children: [
                    { name: 'المطبخ', children: [{ name: 'خلاطات' }, { name: 'مكاوي' }, { name: 'ماكينات قهوة' }, { name: 'أفران كهربائية' }] },
                    { name: 'التنظيف', children: [{ name: 'مكانس كهربائية' }, { name: 'غسالات' }] }
                ]
            },
            { name: 'ملحقات', children: [{ name: 'سماعات' }, { name: 'كيبورد وماوس' }, { name: 'باور بانك' }] },
            { name: 'ألعاب', children: [{ name: 'بلاي ستيشن' }, { name: 'إكس بوكس' }, { name: 'نينتندو سويتش' }] },
            { name: 'عروض خاصة' },
            { name: 'الموضة' },
            { name: 'المنزل والمطبخ' },
            { name: 'أجهزة صغيرة' },
            { name: 'الصحة والجمال' }
        ];

        function generateLink(cat) {
            const base = "https://souq-alkul.blogspot.com/p/search.html";
            return `${base}?label=${encodeURIComponent(cat.name)}`;
        }

        const toggleBtn = document.getElementById('widget-toggle-btn');
        const closeBtn = document.getElementById('widget-close-btn');
        const sidebar = document.getElementById('widget-sidebar');
        const overlay = document.getElementById('widget-overlay');
        const sideList = document.getElementById('widget-side-list');
        const desktopCats = document.getElementById('widget-desktop-cats');
        const sidebarTitle = document.getElementById('widget-sidebar-title');

        categories.slice(0, 5).forEach(cat => {
            const wrapper = document.createElement('div');
            wrapper.className = 'widget-cat-wrapper';
            
            const link = document.createElement('a');
            link.textContent = cat.name;
            link.href = generateLink(cat);
            link.className = 'widget-cat-link';

            link.addEventListener('mouseover', () => link.style.setProperty("--underline-scale", "1"));
            link.addEventListener('mouseout', () => link.style.setProperty("--underline-scale", "0"));

            wrapper.appendChild(link);

            if (cat.children) {
                const expandBtn = document.createElement('span');
                expandBtn.textContent = '❯';
                expandBtn.className = 'widget-expand-btn';
                expandBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openSidebar(false);
                    renderSubCategories(cat.name, cat.children || []);
                });
                wrapper.appendChild(expandBtn);
            }
            desktopCats.appendChild(wrapper);
        });

        function createCategoryRow(cat) {
            const row = document.createElement('div');
            row.className = 'widget-category-row';
            
            const link = document.createElement('a');
            link.textContent = cat.name;
            link.href = generateLink(cat);
            row.appendChild(link);

            if (cat.children) {
                const expandBtn = document.createElement('span');
                expandBtn.textContent = '❯';
                expandBtn.className = 'widget-expand-btn-sidebar';
                expandBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    renderSubCategories(cat.name, cat.children);
                });
                row.appendChild(expandBtn);
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

            const backRow = document.createElement('div');
            backRow.textContent = '← رجوع';
            backRow.className = 'widget-back-row';
            backRow.addEventListener('click', () => renderMainCategories());
            sideList.appendChild(backRow);

            children.forEach(sub => sideList.appendChild(createCategoryRow(sub)));
        }

        function openSidebar(showMain = true) {
            sidebar.style.right = '0';
            overlay.style.display = 'block';
            if (showMain) renderMainCategories();
        }

        function closeSidebar() {
            sidebar.style.right = '-300px';
            overlay.style.display = 'none';
        }

        toggleBtn.addEventListener('click', () => openSidebar(true));
        closeBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);

        function applyResponsive() {
            if (window.innerWidth > 768) {
                desktopCats.style.display = 'flex';
            }
        }
        applyResponsive();
        window.addEventListener('resize', applyResponsive);
