const { jsPDF } = window.jspdf;
const imageInput=document.getElementById("imageInput"), chooseBtn=document.getElementById("chooseBtn");
const preview=document.getElementById("preview"), dropZone=document.getElementById("dropZone");
let images=[];

chooseBtn.onclick=()=>imageInput.click();
imageInput.onchange=e=>addImages([...e.target.files]);
["dragenter","dragover"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove("drag")}));
dropZone.addEventListener("drop",e=>addImages([...e.dataTransfer.files].filter(f=>f.type.startsWith("image/"))));

function addImages(files){ images.push(...files); render(); }
function render(){
 preview.innerHTML="";
 images.forEach((file,i)=>{
   const url=URL.createObjectURL(file);
   const card=document.createElement("div"); card.className="card";
   card.innerHTML=`<img src="${url}"><button class="remove" title="Remove">×</button><div class="name">${escapeHtml(file.name)}</div>`;
   card.querySelector(".remove").onclick=()=>{images.splice(i,1);render()};
   preview.appendChild(card);
 });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.getElementById("clearBtn").onclick=()=>{images=[];preview.innerHTML="";imageInput.value=""};

document.getElementById("makePdf").onclick=async()=>{
 if(!images.length){alert("Please choose at least one image.");return}
 const size=document.getElementById("pageSize").value;
 const orient=document.getElementById("orientation").value;
 const quality=parseFloat(document.getElementById("quality").value);
 const doc=new jsPDF({orientation:orient,unit:"mm",format:size,compress:true});
 for(let i=0;i<images.length;i++){
   const img=await loadImage(images[i]);
   if(i)doc.addPage(size,orient);
   const pw=doc.internal.pageSize.getWidth(), ph=doc.internal.pageSize.getHeight(), margin=10;
   const maxW=pw-margin*2,maxH=ph-margin*2;
   const scale=Math.min(maxW/img.width,maxH/img.height);
   const w=img.width*scale,h=img.height*scale;
   doc.addImage(img,"JPEG",(pw-w)/2,(ph-h)/2,w,h,undefined,"FAST",quality);
 }
 const name="images-"+dateStamp()+".pdf";doc.save(name);addRecent(name);
};

document.getElementById("textPdf").onclick=()=>{
 const text=document.getElementById("textInput").value.trim();
 if(!text){alert("Please enter some text.");return}
 const title=document.getElementById("pdfTitle").value.trim()||"Document";
 const doc=new jsPDF({unit:"mm",format:"a4"});
 let y=22; doc.setFontSize(18);doc.text(title,15,y);y+=12;doc.setFontSize(11);
 const lines=doc.splitTextToSize(text,180);
 for(const line of lines){if(y>282){doc.addPage();y=18}doc.text(line,15,y);y+=6}
 const name=title.replace(/[^a-z0-9-_]/gi,"_")+"-"+dateStamp()+".pdf";doc.save(name);addRecent(name);
};
function loadImage(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=URL.createObjectURL(file)})}
function dateStamp(){return new Date().toISOString().slice(0,16).replace(/[:T]/g,"-")}
function addRecent(name){const arr=JSON.parse(localStorage.getItem("pdfRecent")||"[]");arr.unshift({name,time:new Date().toLocaleString()});localStorage.setItem("pdfRecent",JSON.stringify(arr.slice(0,8)));renderRecent()}
function renderRecent(){const box=document.getElementById("recent"),arr=JSON.parse(localStorage.getItem("pdfRecent")||"[]");box.innerHTML=arr.length?arr.map(x=>`<div class="recent-item"><b>📄 ${escapeHtml(x.name)}</b><small>${escapeHtml(x.time)}</small></div>`).join(""):"<div class='recent-item'><span>No PDFs created yet.</span></div>"}
renderRecent();

document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("dark",document.body.classList.contains("dark"))};
if(localStorage.getItem("dark")==="true")document.body.classList.add("dark");
document.getElementById("imageBtn").onclick=()=>document.querySelector(".panel").scrollIntoView({behavior:"smooth"});
document.getElementById("textBtn").onclick=()=>document.querySelector(".text-panel").scrollIntoView({behavior:"smooth"});
document.getElementById("mergeBtn").onclick=()=>alert("Merge PDF will be added in the next version.");
document.getElementById("compressBtn").onclick=()=>alert("PDF compression will be added in the next version.");
