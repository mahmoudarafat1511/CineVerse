/* Filter movie cards already rendered by the catalog. */

var movieSearch = document.getElementById("movieSearch");
var genreFilter = document.getElementById("genreFilter");
var searchStatus = document.getElementById("movieSearchStatus");

function searchMovies() {
    var titleQuery = movieSearch.value.trim().toLowerCase();
    var genre = genreFilter.value;
    var matches = 0;

    document.querySelectorAll("[data-filter-results]").forEach(function(section) {
        var sectionMatches = 0;
        section.querySelectorAll(".movie-card").forEach(function(card) {
            var title = card.querySelector("h3").textContent.toLowerCase();
            var genres = card.querySelector(".movie-info p").textContent.toLowerCase().split(/[|,\/]/);
            var matchesGenre = genre === "all" || genres.find(function(value) {
                return value.trim() === genre;
            });
            var visible = title.indexOf(titleQuery) !== -1 && matchesGenre;
            card.style.display = visible ? "" : "none";
            if (visible) sectionMatches++;
        });
        section.hidden = sectionMatches === 0;
        matches += sectionMatches;
    });

    searchStatus.textContent = matches === 0 ?
        "No movies match your search. Try another title or clear the filters." :
        matches + (matches === 1 ? " movie found" : " movies found");
}

movieSearch.addEventListener("input", searchMovies);
genreFilter.addEventListener("change", searchMovies);
document.getElementById("clearMovieFilters").addEventListener("click", function() {
    movieSearch.value = "";
    genreFilter.value = "all";
    searchMovies();
    movieSearch.focus();
});
searchMovies();
