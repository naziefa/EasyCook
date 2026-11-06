let editingPlanId = null;
let availableRecipes = [];

function renderSchedule() {
  const list = readStore(KEYS.plans);

  $("weeklySchedule").innerHTML = DAYS.map(day => {
    const meals = list
      .filter(m => m.day === day)
      .sort((a, b) =>
        TIMES.indexOf(a.time) - TIMES.indexOf(b.time)
      );

    const cards = meals.map(m => `
      <article class="plan-item">
        ${m.image ? `
          <img src="${escapeHTML(m.image)}"
               alt="${escapeHTML(m.recipe || "")}">
        ` : ""}

        <div class="item-info">
          <h3>${escapeHTML(m.recipe || "Untitled meal")}</h3>
          <p>${escapeHTML(m.time || "Meal")}</p>
        </div>

        <div class="item-actions">
          ${m.mealId ? `
            <button class="btn btn-light btn-small"
                    data-view="${escapeHTML(m.mealId)}">
              View
            </button>
          ` : ""}

          <button class="btn btn-green btn-small"
                  data-edit="${escapeHTML(m.id)}">
            Edit
          </button>

          <button class="btn btn-danger btn-small"
                  data-delete="${escapeHTML(m.id)}">
            Delete
          </button>
        </div>
      </article>
    `).join("");

    return `
      <section class="day-section">
        <div class="day-title">${day}</div>
        <div class="plan-list">
          ${cards || '<div class="empty-day">No meal planned yet</div>'}
        </div>
      </section>
    `;
  }).join("");
}

function openPlanForm(plan = null) {
  editingPlanId = plan?.id || null;

  $("planFormTitle").textContent = plan
    ? "Edit Meal Plan"
    : "Add Meal Plan";

  $("planForm").classList.remove("hidden");
  $("planDay").value = plan?.day || "Monday";
  $("planTime").value = plan?.time || "Lunch";

  if (plan && !availableRecipes.some(m =>
    String(m.idMeal) === String(plan.mealId))) {
    const option = document.createElement("option");
    option.value = String(plan.mealId || "");
    option.textContent = plan.recipe || "Saved recipe";
    $("planRecipe").append(option);
  }

  $("planRecipe").value = plan?.mealId || "";
  $("planRecipe").disabled = Boolean(plan);

  $("planForm").scrollIntoView({ behavior: "smooth" });
}

function closePlanForm() {
  editingPlanId = null;
  $("planForm").classList.add("hidden");
  $("planRecipe").disabled = false;
}

async function loadPlannerRecipeChoices() {
  try {
    const results = await Promise.all(
      ["a", "b", "c", "d", "e"].map(letter =>
        api("search.php?f=" + letter)
      )
    );

    const map = new Map();

    results.flatMap(r => r.meals || []).forEach(meal => {
      map.set(String(meal.idMeal), meal);
    });

    availableRecipes = [...map.values()];

    $("planRecipe").innerHTML =
      '<option value="">Choose a recipe...</option>' +
      availableRecipes.map(meal => `
        <option value="${escapeHTML(meal.idMeal)}">
          ${escapeHTML(meal.strMeal)}
        </option>
      `).join("");

  } catch {
    $("planRecipe").innerHTML =
      '<option value="">Could not load recipes</option>';

    setMessage(
      "plannerMessage",
      "Recipe list could not load. Try adding meals from Recipe Explorer.",
      true
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("planDay").innerHTML = DAYS.map(
    d => `<option>${d}</option>`
  ).join("");

  $("planTime").innerHTML = TIMES.map(
    t => `<option>${t}</option>`
  ).join("");

  $("togglePlanForm").addEventListener("click", () => {
    openPlanForm();
  });

  $("cancelPlanBtn").addEventListener("click", closePlanForm);

  $("savePlanBtn").addEventListener("click", () => {
    const day = $("planDay").value;
    const time = $("planTime").value;

    if (!DAYS.includes(day) || !TIMES.includes(time)) {
      setMessage(
        "plannerMessage",
        "Choose a valid day and meal time.",
        true
      );
      return;
    }

    if (editingPlanId) {
      const list = readStore(KEYS.plans);

      const item = list.find(
        m => String(m.id) === String(editingPlanId)
      );

      if (!item) return;

      item.day = day;
      item.time = time;

      writeStore(KEYS.plans, list);
      setMessage("plannerMessage", "Meal plan updated!");

    } else {
      const meal = availableRecipes.find(
        m => String(m.idMeal) === $("planRecipe").value
      );

      if (!meal) {
        setMessage(
          "plannerMessage",
          "Please choose a recipe first.",
          true
        );
        return;
      }

      addToPlan(meal, day, time);
      setMessage("plannerMessage", "Meal added to your weekly plan!");
    }

    closePlanForm();
    renderSchedule();
  });

  $("weeklySchedule").addEventListener("click", e => {
    const view = e.target.closest("[data-view]");

    if (view) {
      goToRecipe(view.dataset.view);
      return;
    }

    const edit = e.target.closest("[data-edit]");

    if (edit) {
      const meal = readStore(KEYS.plans).find(
        m => String(m.id) === edit.dataset.edit
      );

      if (meal) openPlanForm(meal);
      return;
    }

    const del = e.target.closest("[data-delete]");

    if (del) {
      if (!confirm("Delete this meal plan?")) return;

      const updated = readStore(KEYS.plans).filter(
        m => String(m.id) !== del.dataset.delete
      );

      writeStore(KEYS.plans, updated);
      renderSchedule();
      setMessage("plannerMessage", "Meal plan deleted.");
    }
  });

  renderSchedule();
  loadPlannerRecipeChoices();
});
