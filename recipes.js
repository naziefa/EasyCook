
let currentMeals = [];
let currentMeal = null;

// ===================================
// LOAD RECIPES FROM API
// ===================================

async function loadRecipes(endpoint = "search.php?f=a") {
  $("recipeDetails").classList.add("hidden");
  $("recipeResults").classList.remove("hidden");

  $("recipeResults").innerHTML =
    '<p class="loading">Loading recipes...</p>';

  setMessage("recipeMessage", "");

  try {
    const data = await api(endpoint);

    currentMeals = data.meals || [];

    renderRecipes();

  } catch (error) {
    $("recipeResults").innerHTML = "";

    setMessage(
      "recipeMessage",
      "Could not load recipes. Check your internet connection.",
      true
    );
  }
}

// ===================================
// DISPLAY RECIPE CARDS
// ===================================

function renderRecipes() {
  if (currentMeals.length === 0) {
    $("recipeResults").innerHTML =
      "<p>No matching recipes found. Try another search.</p>";
    return;
  }

  $("recipeResults").innerHTML =
    currentMeals.map(meal => mealCard(meal)).join("");
}

// ===================================
// DISPLAY RECIPE DETAILS
// ===================================

async function showDetails(id) {
  $("recipeResults").classList.add("hidden");
  $("recipeDetails").classList.remove("hidden");

  $("recipeDetails").innerHTML =
    '<p class="loading">Loading recipe details...</p>';

  try {
    const data = await api(
      "lookup.php?i=" + encodeURIComponent(id)
    );

    const meal = data.meals?.[0];

    if (!meal) {
      throw new Error("Recipe not found");
    }

    currentMeal = meal;

    // GET INGREDIENTS
    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient =
        meal["strIngredient" + i]?.trim();

      const measure =
        meal["strMeasure" + i]?.trim();

      if (ingredient) {
        ingredients.push(
          `<li>${escapeHTML(measure)} ${escapeHTML(ingredient)}</li>`
        );
      }
    }

    // GET SAVED RATING FOR CURRENT RECIPE
    const ratings = readStore(KEYS.ratings);
    const existing = ratings[String(meal.idMeal)] || "";

    // DISPLAY RECIPE DETAILS
    $("recipeDetails").innerHTML = `
      <button class="btn btn-light" id="backToRecipes">
        ← Back to Recipes
      </button>

      <div class="panel" style="margin-top:16px">

        <div class="detail-top">

          <img
            src="${escapeHTML(meal.strMealThumb)}"
            alt="${escapeHTML(meal.strMeal)}"
          >

          <div>
            <h1>${escapeHTML(meal.strMeal)}</h1>

            <p class="muted">
              ${escapeHTML(meal.strCategory)}
              · ${escapeHTML(meal.strArea)}
            </p>

            <div class="detail-actions">

              <button
                class="btn btn-primary"
                id="saveFavourite">
                ♡ Save to Collection
              </button>

              <button
                class="btn btn-green"
                id="openAddPlan">
                📅 Add to Meal Plan
              </button>

            </div>

            <p id="detailMessage" class="message"></p>

            <!-- RECIPE RATING -->

            <div class="rating-section">

              <h2>⭐ Recipe Rating</h2>

              <div class="rating-row">

                <label for="ratingSelect">
                  <b>Rate this recipe:</b>
                </label>

                <select id="ratingSelect">
                  <option value="">Choose 1–5</option>

                  ${[1, 2, 3, 4, 5].map(n => `
                    <option value="${n}"
                      ${String(existing) === String(n)
                        ? "selected"
                        : ""}>
                      ${n} ★
                    </option>
                  `).join("")}

                </select>

                <button
                  class="btn btn-light"
                  id="saveRating">
                  Save / Update Rating
                </button>

              </div>

              <!-- RATING SUMMARY CARDS -->

              <div class="rating-cards">

                <div class="rating-box">

                  <p>Your Rating</p>

                  <h2 id="currentRecipeRating">
                    Not Rated
                  </h2>

                  <small>This recipe only</small>

                </div>

                <div class="rating-box">

                  <p>Overall Average</p>

                  <h2 id="overallAverageRating">
                    N/A
                  </h2>

                  <small id="ratedRecipeCount">
                    0 rated recipes
                  </small>

                </div>

              </div>

            </div>

          </div>
        </div>

        <!-- ADD TO MEAL PLAN FORM -->

        <div
          id="addPlanPanel"
          class="panel hidden"
          style="margin-top:20px">

          <h3>Add this recipe to your week</h3>

          <div class="form-grid">

            <div class="form-field">

              <label for="detailDay">Day</label>

              <select id="detailDay">
                ${DAYS.map(day => `
                  <option value="${day}">
                    ${day}
                  </option>
                `).join("")}
              </select>

            </div>

            <div class="form-field">

              <label for="detailTime">
                Meal Time
              </label>

              <select id="detailTime">
                ${TIMES.map(time => `
                  <option value="${time}">
                    ${time}
                  </option>
                `).join("")}
              </select>

            </div>

          </div>

          <div class="detail-actions">

            <button
              class="btn btn-green"
              id="confirmAddPlan">
              Save Meal Plan
            </button>

            <button
              class="btn btn-light"
              id="closeAddPlan">
              Cancel
            </button>

          </div>

        </div>

        <!-- INGREDIENTS -->

        <h2 class="section-title">
          Ingredients
        </h2>

        <ul class="ingredients">
          ${ingredients.join("")}
        </ul>

        <!-- INSTRUCTIONS -->

        <h2 class="section-title">
          Cooking Instructions
        </h2>

        <p style="white-space:pre-line">
          ${escapeHTML(
            meal.strInstructions ||
            "No instructions available."
          )}
        </p>

        ${meal.strYoutube ? `
          <a
            href="${escapeHTML(meal.strYoutube)}"
            target="_blank"
            rel="noopener noreferrer">
            Watch Cooking Video ↗
          </a>
        ` : ""}

      </div>
    `;

    // ===================================
    // BACK TO RECIPES
    // ===================================

    $("backToRecipes").addEventListener("click", () => {
      $("recipeDetails").classList.add("hidden");
      $("recipeResults").classList.remove("hidden");

      window.history.replaceState(
        {},
        "",
        "recipes.html"
      );
    });

    // ===================================
    // SAVE TO COLLECTION
    // ===================================

    $("saveFavourite").addEventListener("click", () => {
      const saved = addToCollection(meal);

      if (saved) {
        setMessage(
          "detailMessage",
          "Recipe saved to My Recipe Collection!"
        );
      } else {
        setMessage(
          "detailMessage",
          "This recipe is already in your collection."
        );
      }
    });

    // ===================================
    // OPEN MEAL PLAN FORM
    // ===================================

    $("openAddPlan").addEventListener("click", () => {
      $("addPlanPanel").classList.remove("hidden");
    });

    $("closeAddPlan").addEventListener("click", () => {
      $("addPlanPanel").classList.add("hidden");
    });

    // ===================================
    // SAVE MEAL PLAN
    // ===================================

    $("confirmAddPlan").addEventListener("click", () => {
      const day = $("detailDay").value;
      const time = $("detailTime").value;

      addToPlan(meal, day, time);

      setMessage(
        "detailMessage",
        "Added to your Weekly Meal Planner!"
      );

      $("addPlanPanel").classList.add("hidden");
    });

    // ===================================
    // SAVE OR UPDATE RATING
    // ===================================

    $("saveRating").addEventListener("click", () => {
      const rating = Number(
        $("ratingSelect").value
      );

      // INPUT VALIDATION
      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        setMessage(
          "detailMessage",
          "Please choose a rating from 1 to 5.",
          true
        );

        return;
      }

      // SAVE RATING TO LOCAL STORAGE
      const allRatings = readStore(KEYS.ratings);

      allRatings[String(meal.idMeal)] = rating;

      writeStore(KEYS.ratings, allRatings);

      setMessage(
        "detailMessage",
        "Your rating has been saved!"
      );

      // UPDATE BOTH RATING CARDS
      updateRatingSummary();
    });

    // DISPLAY SAVED RATING ON PAGE LOAD
    updateRatingSummary();

    window.scrollTo(0, 0);

  } catch (error) {
    $("recipeDetails").innerHTML = `
      <p class="message error">
        Could not load recipe details.
        Please try again.
      </p>

      <button
        class="btn btn-light"
        id="backToRecipes">
        Back
      </button>
    `;

    $("backToRecipes").addEventListener("click", () => {
      window.location.href = "recipes.html";
    });
  }
}

// ===================================
// RATING CALCULATOR
// ===================================

function updateRatingSummary() {
  if (!currentMeal) return;

  const ratings = readStore(KEYS.ratings);

  // GET RATING FOR CURRENT RECIPE
  const recipeId = String(currentMeal.idMeal);

  const myRating = Number(
    ratings[recipeId]
  );

  // GET ALL VALID SAVED RATINGS
  const validRatings = Object.values(ratings)
    .map(Number)
    .filter(rating =>
      Number.isInteger(rating) &&
      rating >= 1 &&
      rating <= 5
    );

  // CALCULATE OVERALL AVERAGE
  let average = 0;

  if (validRatings.length > 0) {
    const total = validRatings.reduce(
      (sum, rating) => sum + rating,
      0
    );

    average = total / validRatings.length;
  }

  // DISPLAY CURRENT RECIPE RATING
  $("currentRecipeRating").textContent =
    myRating >= 1 && myRating <= 5
      ? myRating.toFixed(1) + " ★"
      : "Not Rated";

  // DISPLAY OVERALL AVERAGE
  $("overallAverageRating").textContent =
    validRatings.length > 0
      ? average.toFixed(2) + " ★"
      : "N/A";

  // DISPLAY NUMBER OF RATED RECIPES
  $("ratedRecipeCount").textContent =
    validRatings.length + " rated recipes";
}

// ===================================
// SEARCH RECIPES
// ===================================

async function searchRecipes() {
  const query = $("searchInput").value.trim();

  if (!query) {
    setMessage(
      "recipeMessage",
      "Please type a recipe name to search.",
      true
    );

    return;
  }

  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.remove("active");
  });

  await loadRecipes(
    "search.php?s=" + encodeURIComponent(query)
  );
}

async function loadAllRecipes() {
  $("recipeDetails").classList.add("hidden");
  $("recipeResults").classList.remove("hidden");

  $("recipeResults").innerHTML =
    '<p class="loading">Loading all recipes...</p>';

  setMessage("recipeMessage", "");

  try {
    const letters = "abcdefghijklmnopqrstuvwxyz";

    const results = await Promise.allSettled(
      [...letters].map(letter =>
        api("search.php?f=" + letter)
      )
    );

    const recipeMap = new Map();
    let successfulRequests = 0;

    results.forEach(result => {
      if (result.status === "fulfilled") {
        successfulRequests++;

        const meals = result.value.meals || [];

        meals.forEach(meal => {
          recipeMap.set(meal.idMeal, meal);
        });
      }
    });

    if (successfulRequests === 0) {
      throw new Error("Unable to load recipes");
    }

    currentMeals = [...recipeMap.values()];

    renderRecipes();

    if (successfulRequests < letters.length) {
      setMessage(
        "recipeMessage",
        "Some recipes could not be loaded. Try again later.",
        true
      );
    }

  } catch (error) {
    $("recipeResults").innerHTML = "";

    setMessage(
      "recipeMessage",
      "Failed to load recipes. Check your internet connection.",
      true
    );
  }
}


// ===================================
// EVENT LISTENERS
// ===================================

document.addEventListener("DOMContentLoaded", () => {

  // SEARCH BUTTON
  $("searchBtn").addEventListener(
    "click",
    searchRecipes
  );

  // PRESS ENTER TO SEARCH
  $("searchInput").addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        searchRecipes();
      }
    }
  );

  // CATEGORY FILTERS
  $("categoryFilters").addEventListener(
    "click",
    async event => {
      const chip = event.target.closest(
        "[data-category]"
      );

      if (!chip) return;

      const category = chip.dataset.category;

      document.querySelectorAll(".chip").forEach(c => {
        c.classList.toggle(
          "active",
          c === chip
        );
      });

      $("searchInput").value = "";

      if (category === "All") {
        await loadAllRecipes("search.php?f=a");
      } else {
        await loadRecipes(
          "filter.php?c=" +
          encodeURIComponent(category)
        );
      }
    }
  );

  // VIEW RECIPE DETAILS
  $("recipeResults").addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-detail]"
      );

      if (button) {
        showDetails(button.dataset.detail);
      }
    }
  );

  // OPEN SPECIFIC RECIPE FROM OTHER PAGE
  const id = new URLSearchParams(
    window.location.search
  ).get("id");

  if (id) {
    showDetails(id);
  } else {
    loadAllRecipes();
  }

});
