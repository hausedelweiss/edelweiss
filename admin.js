const MAX_FOTOS = 5;
const DRAFT_KEY = "anticuario_piezas_draft";

let piezas = [];
let fotosActuales = [];   // fotos (paths o dataURL) de la pieza que se está armando
let editandoIndex = null; // null = alta nueva, número = editando piezas[i]

const form          = document.getElementById("piezaForm");
const fLote         = document.getElementById("fLote");
const fCategoria    = document.getElementById("fCategoria");
const fTitulo       = document.getElementById("fTitulo");
const fPrecio       = document.getElementById("fPrecio");
const fDescripcion  = document.getElementById("fDescripcion");
const fFotos        = document.getElementById("fFotos");
const previewsEl    = document.getElementById("previews");
const listEl        = document.getElementById("piezasList");
const totalCountEl  = document.getElementById("totalCount");
const formTitleEl   = document.getElementById("formTitle");
const submitBtn     = document.getElementById("submitBtn");
const cancelBtn     = document.getElementById("cancelBtn");

init();

function init() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
        piezas = JSON.parse(draft);
        renderTodo();
    } else {
        cargarDesdeArchivo(false);
    }

    fFotos.addEventListener("change", onFotosSeleccionadas);
    form.addEventListener("submit", onSubmit);
    cancelBtn.addEventListener("click", cancelarEdicion);
    document.getElementById("reloadBtn").addEventListener("click", () => cargarDesdeArchivo(true));
    document.getElementById("downloadBtn").addEventListener("click", descargarJSON);
}

function cargarDesdeArchivo(confirmar) {
    const seguir = () => {
        fetch("piezas.json")
            .then((res) => res.ok ? res.json() : [])
            .then((data) => {
                piezas = data;
                guardarDraft();
                renderTodo();
            })
            .catch(() => {
                piezas = [];
                renderTodo();
            });
    };

    if (confirmar) {
        if (confirm("Esto descarta los cambios sin descargar y vuelve a leer piezas.json. ¿Continuar?")) seguir();
    } else {
        seguir();
    }
}

/* ---------- FOTOS ---------- */

function onFotosSeleccionadas(e) {
    const files = Array.from(e.target.files).slice(0, MAX_FOTOS - fotosActuales.length);
    files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
            fotosActuales.push(reader.result);
            renderPreviews();
        };
        reader.readAsDataURL(file);
    });
    fFotos.value = "";
}

function renderPreviews() {
    previewsEl.innerHTML = "";
    fotosActuales.forEach((src, i) => {
        const box = document.createElement("div");
        box.className = "admin__preview";
        box.innerHTML = `
            <img src="${src}" alt="Foto ${i + 1}">
            <button type="button" aria-label="Quitar foto">✕</button>
        `;
        box.querySelector("button").addEventListener("click", () => {
            fotosActuales.splice(i, 1);
            renderPreviews();
        });
        previewsEl.appendChild(box);
    });

    if (fotosActuales.length < MAX_FOTOS) {
        fFotos.disabled = false;
    } else {
        fFotos.disabled = true;
    }
}

/* ---------- ALTA / EDICIÓN ---------- */

function siguienteNumero() {
    const max = piezas.reduce((m, p) => Math.max(m, parseInt(p.lote, 10) || 0), 0);
    return max + 1;
}

function resetForm() {
    form.reset();
    fotosActuales = [];
    editandoIndex = null;
    fFotos.disabled = false;
    renderPreviews();
    fLote.value = siguienteNumero();
    formTitleEl.textContent = "Nueva pieza";
    submitBtn.textContent = "Agregar pieza";
    cancelBtn.hidden = true;
}

function onSubmit(e) {
    e.preventDefault();

    if (fotosActuales.length === 0) {
        alert("Agregá al menos una foto.");
        return;
    }

    const pieza = {
        lote: String(parseInt(fLote.value, 10) || siguienteNumero()),
        imagenes: [...fotosActuales],
        titulo: fTitulo.value.trim(),
        categoria: fCategoria.value.trim(),
        precio: fPrecio.value.trim(),
        descripcion: fDescripcion.value.trim()
    };

    if (editandoIndex !== null) {
        piezas[editandoIndex] = pieza;
    } else {
        piezas.push(pieza);
    }

    guardarDraft();
    renderTodo();
    resetForm();
}

function editarPieza(i) {
    const p = piezas[i];
    editandoIndex = i;
    fLote.value = p.lote;
    fCategoria.value = p.categoria;
    fTitulo.value = p.titulo;
    fPrecio.value = p.precio;
    fDescripcion.value = p.descripcion;
    fotosActuales = [...p.imagenes];
    renderPreviews();

    formTitleEl.textContent = `Editando Art. ${p.lote}`;
    submitBtn.textContent = "Guardar cambios";
    cancelBtn.hidden = false;

    document.querySelector(".admin__panel").scrollIntoView({ behavior: "smooth" });
}

function cancelarEdicion() {
    resetForm();
}

function eliminarPieza(i) {
    if (!confirm(`¿Eliminar "${piezas[i].titulo}"?`)) return;
    piezas.splice(i, 1);
    guardarDraft();
    renderTodo();
    if (editandoIndex === i) resetForm();
}

/* ---------- LISTADO ---------- */

function renderTodo() {
    totalCountEl.textContent = piezas.length;
    listEl.innerHTML = "";

    if (!piezas.length) {
        listEl.innerHTML = `<p class="admin__hint">Todavía no hay piezas cargadas.</p>`;
    } else {
        piezas
            .slice()
            .sort((a, b) => parseInt(a.lote, 10) - parseInt(b.lote, 10))
            .forEach((p) => {
                const i = piezas.indexOf(p);
                const row = document.createElement("div");
                row.className = "admin__item";
                row.innerHTML = `
                    <img class="admin__itemThumb" src="${p.imagenes[0] || ""}" alt="${p.titulo}">
                    <div class="admin__itemInfo">
                        <span class="admin__itemLot">Art. ${p.lote}</span>
                        <strong>${p.titulo}</strong>
                        <span class="admin__itemMeta">${p.categoria} · ${p.precio} · ${p.imagenes.length} foto${p.imagenes.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div class="admin__itemActions">
                        <button type="button" data-action="editar">Editar</button>
                        <button type="button" data-action="eliminar">Eliminar</button>
                    </div>
                `;
                row.querySelector('[data-action="editar"]').addEventListener("click", () => editarPieza(i));
                row.querySelector('[data-action="eliminar"]').addEventListener("click", () => eliminarPieza(i));
                listEl.appendChild(row);
            });
    }

    if (editandoIndex === null) fLote.value = siguienteNumero();
}

/* ---------- PERSISTENCIA ---------- */

function guardarDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(piezas));
}

function descargarJSON() {
    const blob = new Blob([JSON.stringify(piezas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "piezas.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
