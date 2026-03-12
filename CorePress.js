// ===================  Country + User ID + Cart ===================

const dropdown=document.getElementById("countryDropdown");const selected=dropdown?dropdown.querySelector(".selected"):null;const options=dropdown?dropdown.querySelector(".options"):null;let toast=document.getElementById("country-toast");if(!toast){toast=document.createElement("div");toast.id="country-toast";document.body.appendChild(toast)}
const url=new URL(window.location.href);const paramCountry=url.searchParams.get("country");const savedCountry=localStorage.getItem("Cntry");let activeCountry=null;function setActiveCountry(code,updateUrl=!0){if(!options)return;const li=options.querySelector(`li[data-value="${code}"]`);if(!li)return;activeCountry=code;localStorage.setItem("Cntry",code);if(selected)selected.innerHTML=li.innerHTML;if(updateUrl){url.searchParams.set("country",code);window.history.replaceState({},"",url)}}
if(paramCountry){setActiveCountry(paramCountry)}else if(savedCountry){setActiveCountry(savedCountry)}else{setActiveCountry("SA")}
if(selected&&dropdown&&options){selected.addEventListener("click",()=>{dropdown.classList.toggle("open");options.style.display=dropdown.classList.contains("open")?"block":"none"});options.addEventListener("click",(e)=>{const li=e.target.closest("li");if(!li)return;const countryCode=li.getAttribute("data-value");setActiveCountry(countryCode);showToast("تم اختيار: "+li.textContent.trim());setTimeout(()=>{window.location.reload()},500)});document.addEventListener("click",(e)=>{if(!dropdown.contains(e.target)){dropdown.classList.remove("open");options.style.display="none"}})}
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add("show");setTimeout(()=>{toast.classList.remove("show")},1000)}
const canonical=document.createElement("link");canonical.rel="canonical";canonical.href=window.location.origin+window.location.pathname;document.head.appendChild(canonical);if(paramCountry){const robots=document.createElement("meta");robots.name="robots";robots.content="noindex";document.head.appendChild(robots)}


const UIDManager={generate(){const now=new Date();const datePart=now.getFullYear().toString()+(now.getMonth()+1).toString().padStart(2,'0')+now.getDate().toString().padStart(2,'0')+now.getHours().toString().padStart(2,'0')+now.getMinutes().toString().padStart(2,'0')+now.getSeconds().toString().padStart(2,'0');const randomPart=Math.random().toString(36).substring(2,10).toUpperCase();return `ID-${datePart}-${randomPart}`},getPersistentId(){let id=localStorage.getItem("user_fingerprint");if(!id){id=this.generate();localStorage.setItem("user_fingerprint",id)}
return id}}


function updateCartWidget(){const cart=JSON.parse(localStorage.getItem("cart"))||[];const cartCountElement=document.getElementById("cart-count");if(!cartCountElement)return;cartCountElement.textContent=cart.length;if(cart.length>0){cartCountElement.classList.add("active")}else{cartCountElement.classList.remove("active")}}
updateCartWidget();window.addEventListener("storage",function(event){if(event.key==="cart"){updateCartWidget()}});window.addEventListener("cartUpdated",updateCartWidget);const cartWidget=document.getElementById("cart-widget-header");if(cartWidget){cartWidget.addEventListener("click",function(){window.location.href="/p/cart.html"})}



// =================== Share + SEO  ===================

document.addEventListener('DOMContentLoaded',function(){var modal=document.querySelector('.share-modal');var openBtn=document.querySelector('.share-open-btn');var closeBtn=document.querySelector('.modal-close-btn');if(modal&&openBtn&&closeBtn){openBtn.onclick=function(){modal.style.display='block';document.body.style.overflow='hidden'}
closeBtn.onclick=function(){modal.style.display='none';document.body.style.overflow='auto'}
window.onclick=function(event){if(event.target==modal){modal.style.display='none';document.body.style.overflow='auto'}}}})


function rmurl(e,t){var r=new RegExp(/\?m=0|&m=0|\?m=1|&m=1/g);if(r.test(e)){e=e.replace(r,"");if(t)window.history.replaceState({},document.title,e)}
return e}
const currentUrl=rmurl(location.toString(),!0)



// =================== DM + Back To Top  ===================

var htmlEl=document.documentElement,darkBtn=document.getElementById("dark-toggler"),iconUse=darkBtn ? darkBtn.querySelector("use") :null;function switchIcon(theme){if(!iconUse) return;if(theme==="dark"){iconUse.setAttribute("xlink:href","#i-sun");iconUse.setAttribute("href","#i-sun")}else{iconUse.setAttribute("xlink:href","#i-moon");iconUse.setAttribute("href","#i-moon")}}function applyTheme(theme,persist){if(theme==="dark"){htmlEl.classList.add("dark-mode");htmlEl.setAttribute("data-theme","dark")}else{htmlEl.classList.remove("dark-mode");htmlEl.setAttribute("data-theme","light")}switchIcon(theme);if(persist){try{localStorage.setItem("theme",theme)}}}var savedTheme;try{savedTheme=localStorage.getItem("theme")}catch(e){savedTheme=null}if(!savedTheme){savedTheme=window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark":"light"}applyTheme(savedTheme,false);if(darkBtn){darkBtn.addEventListener("click",function(e){e.preventDefault();var isDark=htmlEl.classList.contains("dark-mode");applyTheme(isDark ? "light":"dark",true)})}


var backTop = document.getElementById("back-to-top");
window.addEventListener("scroll",function(){
  if(!backTop) return;
  if(this.pageYOffset >= 1000){
    backTop.classList.remove("d-none");
  } else {
    backTop.classList.add("d-none");
  }
},false);


