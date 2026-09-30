const searchInput = document.getElementById("searchInput");
const products = document.querySelectorAll(".product");
const noResults = document.getElementById("noResults");

searchInput?.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  let visible = 0;

  products.forEach(product => {
    const text = product.dataset.search || "";
    const matches = !term || text.includes(term);
    product.style.display = matches ? "" : "none";
    if (matches) visible++;
  });

  if (noResults) noResults.hidden = visible !== 0;
});
