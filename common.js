
const API = "https://www.themealdb.com/api/json/v1/1/";

const KEYS = {
  collection: "easycookCollection",
  plans: "easycookMealPlans",
  ratings: "easycookRatings"
};

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
];

const TIMES = ["Breakfast", "Lunch", "Dinner"];

const $ = id => document.getElementById(id);

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ||
      (key === KEYS.ratings ? {} : []);
  } catch {
    return key === KEYS.ratings ? {} : [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

async function api(endpoint) {
  const response = await fetch(API + endpoint);

  if (!response.ok) {
    throw new Error("API request failed: " + response.status);
  }

  return response.json();
}

function setMessage(id, message, isError = false) {
  const node = $(id);
  if (!node) return;

  node.textContent = message;
  node.className = "message " + (isError ? "error" : "");
}

function mealCard(meal, actionLabel = "View Details") {
  const id = escapeHTML(meal.idMeal);
  const title = escapeHTML(meal.strMeal);

  return `
    <article class="recipe-card">
      <img src="${escapeHTML(meal.strMealThumb)}"
           alt="${title}" loading="lazy">

      <div class="recipe-card-body">
        <h3>${title}</h3>
        <p>
          ${escapeHTML(meal.strCategory || "Recipe")}
          · ${escapeHTML(meal.strArea || "World cuisine")}
        </p>

        <button class="btn btn-primary" data-detail="${id}">
          ${actionLabel} →
        </button>
      </div>
    </article>
  `;
}

function goToRecipe(id) {
  window.location.href =
    "recipes.html?id=" + encodeURIComponent(id);
}

function addToCollection(meal) {
  const list = readStore(KEYS.collection);

  if (list.some(item =>
    String(item.idMeal) === String(meal.idMeal))) {
    return false;
  }

  list.push({
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strCategory: meal.strCategory,
    note: ""
  });

  writeStore(KEYS.collection, list);
  return true;
}

function addToPlan(meal, day, time) {
  const list = readStore(KEYS.plans);

  list.push({
    id: Date.now().toString() +
      Math.random().toString(36).slice(2, 6),
    mealId: String(meal.idMeal),
    recipe: meal.strMeal,
    image: meal.strMealThumb,
    day: day,
    time: time
  });

  writeStore(KEYS.plans, list);
}

function initNav() {
  const page = document.body.dataset.page;

  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", initNav);
