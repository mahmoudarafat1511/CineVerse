/* Display Movies Using the Shared Catalog */

var featured = document.querySelector("[data-featured-movie]");
var featuredMovie = featured ? findMovie(featured.dataset.featuredMovie) : null;
if (featuredMovie && featuredMovie.status !== "Coming Soon") featuredMovie = null;

document.querySelectorAll("[data-movie-list]").forEach(function(list) {
    var movies = getMovies().filter(function(movie) {
        return movie.status === list.dataset.movieList &&
            (!featuredMovie || movie.id !== featuredMovie.id);
    });

    if (movies.length === 0) {
        list.textContent = "No movies in this section yet.";
    }

    movies.forEach(function(movie) {
        var card = document.createElement("div");
        card.className = "movie-card";

        var poster = document.createElement("img");
        poster.src = getMoviePoster(movie);
        poster.alt = movie.title;
        poster.loading = "lazy";

        var info = document.createElement("div");
        info.className = "movie-info";

        var title = document.createElement("h3");
        title.textContent = movie.title;
        var genre = document.createElement("p");
        genre.textContent = movie.genre;
        var duration = document.createElement("p");
        duration.textContent = movie.status === "Now Showing" ?
            movie.duration + " min" : "Showtimes to be announced";

        var actions = document.createElement("div");
        actions.className = "movie-card-actions";
        var link = document.createElement("a");
        link.className = "movie-details-link";
        link.href = "movie-details.html?id=" + encodeURIComponent(movie.id);
        link.textContent = "View Details";
        if (movie.status === "Now Showing") {
            var book = document.createElement("a");
            book.className = "movie-button";
            book.href = "booking.html?id=" + encodeURIComponent(movie.id);
            book.textContent = "Book Now";
            actions.append(book);
        }
        actions.append(link);

        info.append(title, genre, duration, actions);
        card.append(poster, info);
        list.append(card);
    });
});


/* Update the Featured Movie and Next Showtimes on Home */

if (featured) {
    if (featuredMovie) {
        var featuredPoster = featured.querySelector("img");
        featuredPoster.src = getMoviePoster(featuredMovie);
        featuredPoster.alt = featuredMovie.title;
        featured.querySelector(".featured-info h2").textContent = featuredMovie.title;
        featured.querySelector(".featured-info h2 + p").textContent = featuredMovie.genre;
        featured.querySelector(".featured-info h2 + p + p").textContent = featuredMovie.description;
    } else {
        featured.remove();
    }
}

var homeShowtimes = document.getElementById("homeShowtimes");
if (homeShowtimes) {
    var nextScreenings = [];
    var dates = [getTodayDate(), getTodayDate(1)];
    var now = Date.now();

    getMovies().forEach(function(movie) {
        getMovieScreenings(movie.id).forEach(function(screening) {
            dates.forEach(function(date, dayIndex) {
                screening.times.forEach(function(time) {
                    var startsAt = getScreeningDate(date, time).getTime();
                    if (startsAt > now) {
                        nextScreenings.push({
                            movie: movie,
                            cinema: screening.cinema,
                            date: date,
                            day: dayIndex === 0 ? "Today" : "Tomorrow",
                            time: time,
                            startsAt: startsAt
                        });
                    }
                });
            });
        });
    });

    nextScreenings.sort(function(first, second) { return first.startsAt - second.startsAt; });
    var template = document.getElementById("homeShowtimeCard");
    nextScreenings.slice(0, 3).forEach(function(screening) {
        var card = template.content.cloneNode(true);
        card.querySelector("h3").textContent = screening.movie.title;
        card.querySelector(".home-screening-time").textContent = screening.day + " · " + screening.time;
        card.querySelector(".home-screening-cinema").textContent = cinemaNames[screening.cinema];
        card.querySelector("a").href = screeningBookingLink(
            screening.movie.id, screening.cinema, screening.date, screening.time
        );
        homeShowtimes.append(card);
    });

    if (!nextScreenings.length) homeShowtimes.textContent = "No upcoming screenings.";
}

window.addEventListener("pageshow", function(event) {
    if (event.persisted) window.location.reload();
});

window.addEventListener("storage", function(event) {
    if (!event.key || event.key.startsWith(movieStoragePrefix)) window.location.reload();
});
