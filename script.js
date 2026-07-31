// AUMENTADO DE 5 A 12 PARA PERMITIR VER TODAS LAS FOTOS DE LOTES COMO EL DE TAXIDERMI
const MAX_FOTOS = 12; 

let piezas = [];
let piezaActual = null;
let fotoActualIdx = 0;

const catalogEl   = document.getElementById("catalog");
const navCountEl  = document.getElementById("navCount");
const overlayEl   = document.getElementById("modalOverlay");

init();

function init() {
    catalogEl.innerHTML = `<p class="catalog__msg">Abriendo el depósito…</p>`;
    
    fetch("piezas.json")
         .then((res) => {
             if (!res.ok) throw new Error("No se pudo leer el catálogo");
             return res.json();
         })
         .then((data) => {
             piezas = data;
             renderCatalogo();
         })
         .catch(() => {
             catalogEl.innerHTML = `<p class="catalog__msg">No se pudo abrir el catálogo. Revisá piezas.json y volvé a intentar.</p>`;
         });

     document.getElementById("modalClose").onclick = cerrarModal;
     document.getElementById("galNext").onclick = () => moverFoto(1);
     document.getElementById("galPrev").onclick = () => moverFoto(-1);
     
     overlayEl.addEventListener("click", (e) => {
         if (e.target === overlayEl) cerrarModal();
     });

     document.addEventListener("keydown", (e) => {
         if (!overlayEl.classList.contains("is-open")) return;
         if (e.key === "Escape") cerrarModal();
         if (e.key === "ArrowRight") moverFoto(1);
         if (e.key === "ArrowLeft") moverFoto(-1);
     });
}

function renderCatalogo() {
    if (!piezas.length) {
        catalogEl.innerHTML = `<p class="catalog__msg">Todavía no hay piezas cargadas.</p>`;
        navCountEl.textContent = "0 piezas";
        return;
    }

    navCountEl.textContent = `${piezas.length} piezas`;
    catalogEl.innerHTML = "";

    piezas.forEach((p) => {
        const fotos = fotosValidas(p);
        const card = document.createElement("article");
        card.className = "card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Ver ficha de ${p.titulo}, artículo ${p.lote}`);
        
        card.innerHTML = `
            <div class="card__photo">
                <img src="${fotos[0]}" alt="${p.titulo}" loading="lazy">
                ${fotos.length > 1 ? `<span class="card__count">1/${fotos.length}</span>` : ""}
            </div>
            <div class="card__body">
                <span class="card__cat">${p.categoria}</span>
                <h3 class="card__title">${p.titulo}</h3>
                <p class="card__price">${p.precio}</p>
            </div>
        `;

        const abrir = () => abrirModal(p);
        card.addEventListener("click", abrir);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrir();
            }
        });
        catalogEl.appendChild(card);
    });
}

function fotosValidas(p) {
    const fotos = Array.isArray(p.imagenes) ? p.imagenes.filter(Boolean) : [];
    return fotos.slice(0, MAX_FOTOS);
}

function abrirModal(p) {
    piezaActual = p;
    piezaActual._fotos = fotosValidas(p);
    fotoActualIdx = 0;

    document.getElementById("modalTitle").textContent = p.titulo;
    document.getElementById("modalCategoria").textContent = p.categoria;
    document.getElementById("modalPrice").textContent = p.precio;
    document.getElementById("modalLot").textContent = `Art. ${p.lote}`;
    document.getElementById("modalDesc").textContent = p.descripcion;
    
    // Opcional: Mostrar precio USD en el modal si existe
    const priceEl = document.getElementById("modalPrice");
    if (p.precio_usd) {
        priceEl.innerHTML = `${p.precio} <span style="font-size:0.8em; color:var(--ink-soft); display:block; margin-top:4px;">${p.precio_usd}</span>`;
    } else {
        priceEl.textContent = p.precio;
    }

    renderDetails(p);
    renderThumbs();
    renderFoto();
    
    overlayEl.classList.add("is-open");
    document.getElementById("modalClose").focus();
}

function renderDetails(p) {
    const container = document.getElementById("modalDetails");
    container.innerHTML = "";
    
    const fields = [
        { key: "cantidad", label: "Cantidad" },
        { key: "marca", label: "Marca" },
        { key: "dimensiones_aprox", label: "Dimensiones" },
        { key: "estilo", label: "Estilo" },
        { key: "epoca", label: "Época" },
        { key: "materiales", label: "Materiales" },
        { key: "caracteristicas_especiales", label: "Características especiales" }
    ];

    let hasDetails = false;
    const fragment = document.createDocumentFragment();

    fields.forEach(({ key, label }) => {
        const value = p[key];
        if (!value) return;
        
        hasDetails = true;
        const div = document.createElement("div");
        div.className = "modal__detail";
        
        const labelEl = document.createElement("span");
        labelEl.className = "modal__detailLabel";
        labelEl.textContent = label;
        
        const valueEl = document.createElement("span");
        valueEl.className = "modal__detailValue";
        
        if (Array.isArray(value)) {
            const list = document.createElement("ul");
            list.className = "modal__detailList";
            value.forEach(item => {
                const li = document.createElement("li");
                li.textContent = item;
                list.appendChild(li);
            });
            valueEl.appendChild(list);
        } else {
            valueEl.textContent = value;
        }
        
        div.appendChild(labelEl);
        div.appendChild(valueEl);
        fragment.appendChild(div);
    });

    if (hasDetails) {
        container.appendChild(fragment);
        container.style.display = "block";
    } else {
        container.style.display = "none";
    }
}

function cerrarModal() {
    overlayEl.classList.remove("is-open");
}

function renderThumbs() {
    const thumbs = document.getElementById("modalThumbs");
    thumbs.innerHTML = "";
    
    if (piezaActual._fotos.length <= 1) {
        thumbs.style.display = "none";
        return;
    }
    
    thumbs.style.display = "flex";
    piezaActual._fotos.forEach((img, i) => {
        const btn = document.createElement("img");
        btn.src = img;
        btn.alt = `Foto ${i + 1} de ${piezaActual.titulo}`;
        btn.className = "modal__thumb";
        btn.onclick = () => {
            fotoActualIdx = i;
            renderFoto();
        };
        thumbs.appendChild(btn);
    });
}

function renderFoto() {
    const fotos = piezaActual._fotos;
    document.getElementById("modalImg").src = fotos[fotoActualIdx];
    document.getElementById("modalImg").alt = `${piezaActual.titulo} — foto ${fotoActualIdx + 1} de ${fotos.length}`;
    
    const mostrarNav = fotos.length > 1;
    document.getElementById("galPrev").style.display = mostrarNav ? "flex" : "none";
    document.getElementById("galNext").style.display = mostrarNav ? "flex" : "none";
    
    const dotsEl = document.getElementById("galDots");
    dotsEl.innerHTML = "";
    
    if (mostrarNav) {
        fotos.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = "modal__dot" + (i === fotoActualIdx ? " is-active" : "");
            dotsEl.appendChild(dot);
        });
    }
    
    document.querySelectorAll(".modal__thumb").forEach((el, i) => {
        el.classList.toggle("is-active", i === fotoActualIdx);
    });
}

function moverFoto(delta) {
    if (!piezaActual) return;
    const total = piezaActual._fotos.length;
    if (total <= 1) return;
    
    fotoActualIdx = (fotoActualIdx + delta + total) % total;
    renderFoto();
}