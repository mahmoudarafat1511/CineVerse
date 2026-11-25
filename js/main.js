/* Get Movie ID from URL */
var params = new URLSearchParams(window.location.search);

var movieId = params.get("id");


/* Display Selected Movie */
if (document.getElementById("detailsTitle")) {

    var movie = findMovie(movieId);

    if (movie) {


        document.getElementById("detailsPoster").src = getMoviePoster(movie);

        document.getElementById("detailsPoster").alt = movie.title;

        document.getElementById("detailsTitle").innerText = movie.title;

        document.getElementById("detailsGenre").innerText = movie.genre;

        document.getElementById("detailsStatus").innerText = movie.status;

        document.getElementById("detailsDescription").innerText = movie.description || "No description available.";
        document.getElementById("detailsRating").innerText = movie.rating || "Not rated";
        document.getElementById("detailsDuration").innerText = movie.duration ? movie.duration + " min" : "To be announced";

        document.getElementById("detailsLabel").innerText = movie.status.toUpperCase();


        /* Booking Button */
        if (movie.status == "Coming Soon") {

            document.getElementById("detailsBook").style.display = "none";
            document.getElementById("detailsAvailability").hidden = false;

        } else {

            document.getElementById("detailsBook").href = "booking.html?id=" + encodeURIComponent(movieId);

        }

    } else {

        document.getElementById("detailsTitle").innerText = "Movie Not Found";

        document.getElementById("detailsPoster").style.display = "none";
        document.getElementById("detailsMetadata").hidden = true;

        document.getElementById("detailsBook").style.display = "none";
        document.getElementById("detailsAvailability").textContent = "This movie is no longer in the public catalog.";
        document.getElementById("detailsAvailability").hidden = false;

    }

}
