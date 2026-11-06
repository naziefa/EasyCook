let selectedCategory = "Chicken";
let previousSuggestions = [];

function getSuggestedCategory(choice) {
  if (choice === "Chicken") {
    return "Chicken";
  }
  else if (choice === "Beef") {
    return "Beef";
  }
  else if (choice === "Seafood") {
    return "Seafood";
  }
  else if (choice === "Vegetarian") {
    return "Vegetarian";
  }
  else {
    return null;
  }
}

// Randomize recipes
function shuffleRecipes(recipes) {
  const shuffled = [...recipes];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Suggest recipes
async function suggestRecipes() {
  const category = getSuggestedCategory(selectedCategory);

  if (!category) {
    setMessage(
      "suggestionMessage",
      "No suggestion available for this category.",
      true
    );
    return;
  }

  $("suggestionResults").innerHTML =
    '<p class="loading">Finding recipes for you...</p>';

  setMessage("suggestionMessage", "");

  try {
    const data = await api(
      "filter.php?c=" + encodeURIComponent(category)
    );

    const allMeals = data.meals || [];

    // Shuffle and choose 9 random recipes
    let meals = shuffleRecipes(allMeals).slice(0, 9);

    // Avoid repeating exactly the same suggestions
    if (allMeals.length > 9) {
      let attempts = 0;

      while (
        attempts < 5 &&
        meals.map(m => m.idMeal).join(",") ===
        previousSuggestions.join(",")
      ) {
        meals = shuffleRecipes(allMeals).slice(0, 9);
        attempts++;
      }
    }

    previousSuggestions = meals.map(m => m.idMeal);
    localStorage.setItem(
      "easycookSuggestions",
      JSON.stringify({
        category: category,
        recipes: meals,
       savedAt: new Date().toISOString()
      })
    );

    $("suggestionResults").innerHTML = meals.length
      ? meals.map(m => mealCard(m, "View Recipe")).join("")
      : "<p>No matching recipes found. Choose another category.</p>";

    if (meals.length) {
      setMessage(
        "suggestionMessage",
        `Found ${meals.length} random suggestions for ${category}.`
      );
    }

    // Change button text
    $("suggestBtn").innerHTML = "✨ Suggest Again!";

  } 
  catch {
    $("suggestionResults").innerHTML = "";

    setMessage(
      "suggestionMessage",
      "Could not load suggestions. Check your internet connection.",
      true
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {

  $("suggestionCategories").addEventListener("click", e => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;

    selectedCategory = btn.dataset.category;

    document.querySelectorAll(".category-btn").forEach(b => {
      b.classList.toggle("selected", b === btn);
    });

    previousSuggestions = [];

    $("suggestBtn").innerHTML = "✨ Suggest Recipes";
  });

  $("suggestBtn").addEventListener("click", suggestRecipes);

  $("suggestionResults").addEventListener("click", e => {
    const btn = e.target.closest("[data-detail]");

    if (btn) {
      goToRecipe(btn.dataset.detail);
    }
  });

});