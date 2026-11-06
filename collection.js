
let editingId = null;

function renderCollection() {
  const search = $("collectionSearch").value.trim().toLowerCase();

  const list = readStore(KEYS.collection).filter(meal =>
    String(meal.strMeal).toLowerCase().includes(search)
  );

  $("collectionList").innerHTML = list.length
    ? list.map(meal => `
      <article class="collection-item">
        <img src="${escapeHTML(meal.strMealThumb)}"
             alt="${escapeHTML(meal.strMeal)}">

        <div class="item-info">
          <h3>${escapeHTML(meal.strMeal)}</h3>
          <p>${escapeHTML(meal.strCategory || "Recipe")}</p>
          <p><b>Notes:</b> ${escapeHTML(meal.note || "No notes yet")}</p>
        </div>

        <div class="item-actions">
          <button class="btn btn-light btn-small"
                  data-view="${escapeHTML(meal.idMeal)}">View</button>

          <button class="btn btn-green btn-small"
                  data-edit="${escapeHTML(meal.idMeal)}">Edit Notes</button>

          <button class="btn btn-danger btn-small"
                  data-delete="${escapeHTML(meal.idMeal)}">Remove</button>
        </div>
      </article>
    `).join("")
    : `
      <div class="panel">
        <p>No saved recipes found. Open Recipe Explorer and save a recipe.</p>
        <a href="recipes.html" class="btn btn-primary"
           style="display:inline-block;text-decoration:none">
          Explore Recipes →
        </a>
      </div>
    `;
}

function closeEditor() {
  editingId = null;
  $("noteEditor").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  $("collectionSearch").addEventListener("input", renderCollection);

  $("collectionList").addEventListener("click", e => {
    const view = e.target.closest("[data-view]");

    if (view) {
      goToRecipe(view.dataset.view);
      return;
    }

    const edit = e.target.closest("[data-edit]");

    if (edit) {
      const meal = readStore(KEYS.collection).find(
        m => String(m.idMeal) === edit.dataset.edit
      );

      if (!meal) return;

      editingId = String(meal.idMeal);
      $("editingRecipeName").textContent = meal.strMeal;
      $("noteInput").value = meal.note || "";
      $("noteEditor").classList.remove("hidden");
      $("noteEditor").scrollIntoView({ behavior: "smooth" });
      return;
    }

    const del = e.target.closest("[data-delete]");

    if (del) {
      if (!confirm("Remove this recipe from your collection?")) {
        return;
      }

      const updated = readStore(KEYS.collection).filter(
        m => String(m.idMeal) !== del.dataset.delete
      );

      writeStore(KEYS.collection, updated);

      if (editingId === del.dataset.delete) closeEditor();

      renderCollection();
      setMessage("collectionMessage", "Recipe removed.");
    }
  });

  $("saveNoteBtn").addEventListener("click", () => {
    if (!editingId) return;

    const list = readStore(KEYS.collection);
    const meal = list.find(
      m => String(m.idMeal) === editingId
    );

    if (!meal) return;

    meal.note = $("noteInput").value.trim();
    writeStore(KEYS.collection, list);

    closeEditor();
    renderCollection();
    setMessage("collectionMessage", "Cooking notes updated!");
  });

  $("cancelNoteBtn").addEventListener("click", closeEditor);

  renderCollection();
});
