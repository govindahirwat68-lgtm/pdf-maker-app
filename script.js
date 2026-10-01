const {PDFDocument, rgb, degrees} = PDFLib;
let pages=[], design={}, history=JSON.parse(localStorage.getItem("pdfStudioHistory")||"[]");

const $=s=>document.querySelector(s);
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function showTab(id){document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));$("#pageTitle").textContent=document.querySelector(`[data-tab="${id}"]`).textContent.replace(/^[^ ]+ /,"");if(id==="files")renderHistory()}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$("#themeBtn").onclick=()=>document.body.classList.toggle("dark");

function renderThumbs(){
  const box=$("#thumbs");box.innerHTML="";
  pages.forEach((p,i)=>{
    const d=document.createElement("div");d.className="thumb";d.draggable=true;d.dataset.i=i;
    d.innerHTML=p.type==="image"?`<img src="${p.src}"><button class="x" title="Delete">×</button><span>Page ${i+1}</span>`:`<div class="blank-thumb">Blank Page</div><button class="x">×</button><span>Page ${i+1}</span>`;
    d.querySelector(".x").onclick=e=>{e.stopPropagation();pages.splice(i,1);renderThumbs()};
    d.ondragstart=()=>d.classList.add("dragging");d.ondragend=()=>d.classList.remove("dragging");
    d.ondragover=e=>e.preventDefault();
    d.ondrop=e=>{e.preventDefault();const from=+e.dataTransfer.getData("text/plain");if(Number.isInteger(from)&&from!==i){const x=pages.splice(from,1)[0];pages.splice(i,0,x);renderThumbs()}};
    d.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",i));
    box.appendChild(d);
  });
  $("#pageCount").textContent=`${pages.length} page${pages.length!==1?"s":""}`;$("#statPages").textContent=pages.length;
}
$("#imageInput").onchange=async e=>{for(const f of e.target.files){pages.push({type:"image",src:URL.createObjectURL(f),file:f})}renderThumbs();e.target.value=""};
$("#blankBtn").onclick=()=>{pages.push({type:"blank"});renderThumbs()};
$("#clearBtn").onclick=()=>{pages=[];renderThumbs();toast("Builder cleared")};
$("#margin").oninput=e=>$("#marginVal").textContent=e.target.value+" mm";
$("#quality").oninput=e=>$("#qualityVal").textContent=Math.round(e.target.value*100)+"%";
$("#dropZone").ondragover=e=>{e.preventDefault();$("#dropZone").style.background="#ede9fe"};
$("#dropZone").ondragleave=()=>$("#dropZone").style.background="";
$("#dropZone").ondrop=async e=>{e.preventDefault();$("#dropZone").style.background="";const fs=[...e.dataTransfer.files].filter(f=>f.type.startsWith("image/"));for(const f of fs)pages.push({type:"image",src:URL.createObjectURL(f),file:f});renderThumbs()};

function rgbHex(hex){const n=parseInt(hex.slice(1),16);return rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)}
function pageDims(){let s=$("#pageSize").value, o=$("#orientation").value;let dims=s==="a5"?[419.53,595.28]:s==="letter"?[612,792]:[595.28,841.89];return o==="landscape"?dims.reverse():dims}
async function addImageToPDF(doc,p,margin,q){
 if(p.type==="blank"){doc.addPage(pageDims());return}
 const imgBytes=await fetch(p.src).then(r=>r.arrayBuffer());
 const type=p.file.type==="image/png"?"png":"jpg";const img=type==="png"?await doc.embedPng(imgBytes):await doc.embedJpg(imgBytes);
 const [pw,ph]=pageDims(), page=doc.addPage([pw,ph]);const m=margin*2.83465;const maxW=pw-m*2,maxH=ph-m*2;const scale=Math.min(maxW/img.width,maxH/img.height);const w=img.width*scale,h=img.height*scale;
 page.drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});
}
async function downloadBytes(bytes,name,type="application/pdf"){const blob=new Blob([bytes],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);addHistory(name)}
function addHistory(name){history.unshift({name,time:new Date().toLocaleString()});history=history.slice(0,20);localStorage.setItem("pdfStudioHistory",JSON.stringify(history))}
$("#exportBtn").onclick=async()=>{if(!pages.length)return toast("Add at least one page");const doc=await PDFDocument.create();const m=+$("#margin").value,q=+$("#quality").value;for(const p of pages)await addImageToPDF(doc,p,m,q);const bytes=await doc.save({useObjectStreams:true});await downloadBytes(bytes,"pdf-maker-v4.pdf");toast("PDF exported successfully")};

function updatePreview(){const p=$("#preview");p.style.background=$("#bg").value;p.style.color=$("#textColor").value;p.style.borderTop="6px solid "+$("#accent").value;p.querySelector(".paper-header").textContent=$("#header").value;p.querySelector("h1").textContent=$("#designTitle").value;p.querySelector("p").textContent=$("#designBody").value;p.querySelector(".paper-footer").textContent=$("#footer").value}
["accent","bg","textColor","header","designTitle","designBody","footer"].forEach(id=>$("#"+id).oninput=updatePreview);
document.querySelectorAll("[data-template]").forEach(b=>b.onclick=()=>{const t=b.dataset.template;const data={report:["Technical Report","Project Report","This report presents objectives, methodology, results and conclusions.","Page 1"],invoice:["Invoice","Invoice #2026-001","Description, quantity, rate and total amount.","Thank you"],resume:["Professional Resume","Govind Ahirwar","Engineering Student | Aspiring Software Developer","Contact • Portfolio • GitHub"],notes:["Study Notes","Important Notes","Write concepts, formulas, examples and revision points here.","Keep learning"]}[t];$("#header").value=data[0];$("#designTitle").value=data[1];$("#designBody").value=data[2];$("#footer").value=data[3];updatePreview();toast(t+" template applied")});
$("#applyDesign").onclick=()=>{design={accent:$("#accent").value,bg:$("#bg").value,text:$("#textColor").value,header:$("#header").value,title:$("#designTitle").value,body:$("#designBody").value,footer:$("#footer").value};toast("Design saved for this session")};updatePreview();

document.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>document.execCommand(b.dataset.cmd,false,null));
$("#mark").onclick=()=>document.execCommand("hiliteColor",false,"#fde68a");
$("#note").onclick=()=>document.execCommand("insertHTML",false,'<div style="padding:12px;background:#ecfeff;border-left:4px solid #06b6d4;margin:10px 0">🗒 Note: Add your note here.</div>');
$("#divider").onclick=()=>document.execCommand("insertHorizontalRule");
$("#editorExport").onclick=async()=>{const {jsPDF}=window.jspdf;const doc=new jsPDF({format:"a4"});const text=$("#editorPage").innerText;const lines=doc.splitTextToSize(text,170);doc.text(lines,20,25);await downloadBytes(doc.output("arraybuffer"),"edited-document-v4.pdf");toast("Edited PDF exported")};

function toolInput(label,accept,multiple=false){return `<label>${label}<input id="toolFiles" type="file" accept="${accept}" ${multiple?"multiple":""}></label>`}
function openTool(type){
 const w=$("#toolWorkspace");w.classList.remove("hidden");
 const cfg={
 merge:["🔗 Merge PDFs","Select 2 or more PDF files in the order you want them merged.",toolInput("PDF files","application/pdf",true), "Merge & Download"],
 split:["✂️ Split PDF","Enter a page range such as 1-3 or 2,4,7.",toolInput("PDF file","application/pdf"),'<label>Pages<input id="range" type="text" placeholder="1-3"></label>',"Split & Download"],
 rotate:["🔄 Rotate Pages","Rotate selected pages by 90°, 180° or 270°.",toolInput("PDF file","application/pdf"),'<label>Pages (blank = all)<input id="range" type="text" placeholder="1-3"></label><label>Degrees<select id="deg"><option>90</option><option>180</option><option>270</option></select></label>',"Rotate & Download"],
 delete:["🗑 Delete Pages","Enter pages to remove, e.g. 2,4,5.",toolInput("PDF file","application/pdf"),'<label>Delete pages<input id="range" type="text" placeholder="2,4,5"></label>',"Delete & Download"],
 reorder:["↕️ Reorder Pages","Enter the complete order, e.g. 3,1,2,4.",toolInput("PDF file","application/pdf"),'<label>Order<input id="range" type="text" placeholder="3,1,2,4"></label>',"Reorder & Download"],
 watermark:["💧 Watermark","Add a text watermark to every page.",toolInput("PDF file","application/pdf"),'<label>Watermark text<input id="wm" type="text" value="CONFIDENTIAL"></label>',"Add Watermark"],
 numbers:["🔢 Page Numbers","Add page numbers to every page.",toolInput("PDF file","application/pdf"),"", "Add Page Numbers"],
 optimize:["⚡ Optimize PDF","Re-save the PDF using object streams. This may reduce structural overhead; image-heavy PDFs may not shrink much.",toolInput("PDF file","application/pdf"),"", "Optimize & Download"],
 images:["🖼 PDF → Images","The browser PDF engine does not rasterize PDF pages directly. Open the PDF in a new browser tab for printing/saving pages as images.",toolInput("PDF file","application/pdf"),"", "Open PDF"]
 }[type];
 w.innerHTML=`<h3>${cfg[0]}</h3><p>${cfg[1]}</p>${cfg[2]}${cfg[3]||""}<div class="tool-row"><button class="primary" id="runTool">${cfg[4]}</button><button class="secondary" id="closeTool">Close</button></div>`;
 $("#closeTool").onclick=()=>w.classList.add("hidden");$("#runTool").onclick=()=>runTool(type);
}
function parsePages(s,max){if(!s||!s.trim())return Array.from({length:max},(_,i)=>i+1);let set=new Set();s.split(",").map(x=>x.trim()).forEach(part=>{if(part.includes("-")){let[a,b]=part.split("-").map(Number);for(let i=Math.min(a,b);i<=Math.max(a,b);i++)if(i>=1&&i<=max)set.add(i)}else{let n=Number(part);if(n>=1&&n<=max)set.add(n)}});return [...set]}
async function loadPDF(file){return PDFDocument.load(await file.arrayBuffer())}
async function saveSelected(src,indices,name,modify){
 const out=await PDFDocument.create();const copied=await out.copyPages(src,indices);copied.forEach((p,i)=>{out.addPage(p);if(modify)modify(p,i,indices.length)});const bytes=await out.save({useObjectStreams:true});await downloadBytes(bytes,name);toast("Tool completed")}
async function runTool(type){
 const fs=$("#toolFiles")?.files;if(!fs?.length)return toast("Choose a PDF file");
 try{
  if(type==="merge"){if(fs.length<2)return toast("Select at least 2 PDFs");const out=await PDFDocument.create();for(const f of fs){const src=await loadPDF(f);(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p))}await downloadBytes(await out.save({useObjectStreams:true}),"merged-v4.pdf");toast("PDFs merged");return}
  const src=await loadPDF(fs[0]), n=src.getPageCount();
  if(type==="split"){const ids=parsePages($("#range").value,n).map(x=>x-1);return saveSelected(src,ids,"split-v4.pdf")}
  if(type==="delete"){const del=new Set(parsePages($("#range").value,n));const ids=Array.from({length:n},(_,i)=>i+1).filter(x=>!del.has(x)).map(x=>x-1);return saveSelected(src,ids,"deleted-pages-v4.pdf")}
  if(type==="reorder"){const ids=$("#range").value.split(",").map(Number).filter(x=>x>=1&&x<=n).map(x=>x-1);if(ids.length!==n)return toast("Enter every page exactly once");return saveSelected(src,ids,"reordered-v4.pdf")}
  if(type==="rotate"){const ids=parsePages($("#range").value,n).map(x=>x-1);const out=await PDFDocument.create();const cp=await out.copyPages(src,src.getPageIndices());cp.forEach((p,i)=>{if(ids.includes(i))p.setRotation(degrees(+$("#deg").value));out.addPage(p)});return downloadBytes(await out.save({useObjectStreams:true}),"rotated-v4.pdf").then(()=>toast("Pages rotated"))}
  if(type==="watermark"){const out=await PDFDocument.create();const cp=await out.copyPages(src,src.getPageIndices());cp.forEach(p=>{const {width,height}=p.getSize();p.drawText($("#wm").value,{x:width/2-80,y:height/2,size:28,color:rgb(.55,.55,.55),opacity:.35,rotate:degrees(35)});out.addPage(p)});return downloadBytes(await out.save({useObjectStreams:true}),"watermarked-v4.pdf").then(()=>toast("Watermark added"))}
  if(type==="numbers"){const out=await PDFDocument.create();const cp=await out.copyPages(src,src.getPageIndices());cp.forEach((p,i)=>{const {width}=p.getSize();p.drawText(`${i+1}`,{x:width/2-5,y:18,size:10,color:rgb(.35,.35,.4)});out.addPage(p)});return downloadBytes(await out.save({useObjectStreams:true}),"numbered-v4.pdf").then(()=>toast("Page numbers added"))}
  if(type==="optimize"){return downloadBytes(await src.save({useObjectStreams:true,addDefaultPage:false}),"optimized-v4.pdf").then(()=>toast("PDF optimized"))}
  if(type==="images"){const url=URL.createObjectURL(fs[0]);window.open(url,"_blank");setTimeout(()=>URL.revokeObjectURL(url),60000);toast("PDF opened in a new tab")}
 }catch(e){console.error(e);toast("Could not process this PDF")}
}
function renderHistory(){const box=$("#history");box.innerHTML=history.length?history.map(x=>`<div class="history-item"><b>📄 ${x.name}</b><small>${x.time}</small></div>`).join(""):"<p>No exported files yet.</p>"}
function clearHistory(){history=[];localStorage.removeItem("pdfStudioHistory");renderHistory();toast("History cleared")}
renderThumbs();
