var showDate = document.getElementById("showDate");
var cinemaFilter = document.getElementById("cinemaFilter");
var showtimesList = document.getElementById("showtimesList");
var showtimeCard = document.getElementById("showtimeCard");

showDate.min = getTodayDate();
showDate.value = showDate.min;

function showScreenings() {
    showtimesList.textContent = "";
    if (!showDate.value || !showDate.validity.valid) {
        setFieldError(showDate, "Choose today or a future date to see showtimes.");
        return;
    }
    setFieldError(showDate, "");

    var now = Date.now();
    getMovies().forEach(function(movie) {
        getMovieScreenings(movie.id).forEach(function(screening) {
            if (cinemaFilter.value !== "all" && cinemaFilter.value !== screening.cinema) return;

            var card = showtimeCard.content.cloneNode(true);
            card.querySelector("img").src = getMoviePoster(movie);
            card.querySelector("h2").textContent = movie.title;
            card.querySelector(".schedule-genre").textContent = movie.genre;
            card.querySelector(".schedule-cinema").textContent = cinemaNames[screening.cinema];
            card.querySelector(".second-button").href = "booking.html?id=" + encodeURIComponent(movie.id);

            var times = card.querySelector(".schedule-times");
            screening.times.forEach(function(time) {
                var available = getScreeningDate(showDate.value, time).getTime() > now;
                var control = document.createElement(available ? "a" : "button");
                control.textContent = time;
                if (available) {
                    control.href = screeningBookingLink(movie.id, screening.cinema, showDate.value, time);
                    control.setAttribute("aria-label", movie.title + " at " + time);
                } else {
                    control.type = "button";
                    control.disabled = true;
                    control.setAttribute("aria-label", time + " (already started)");
                }
                times.append(control);
            });
            if (!times.querySelector("a")) times.textContent = "No more screenings on this date.";
            showtimesList.append(card);
        });
    });

    if (!showtimesList.children.length) showtimesList.textContent = "No screenings at this cinema.";
}

showDate.addEventListener("change", showScreenings);
cinemaFilter.addEventListener("change", showScreenings);
window.addEventListener("pageshow", function(event) {
    if (event.persisted) showScreenings();
});
window.addEventListener("storage", function(event) {
    if (!event.key || event.key.startsWith(movieStoragePrefix)) showScreenings();
});

showScreenings();
