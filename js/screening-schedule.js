/* The demo schedule repeats daily. Add a row to schedule a movie at another cinema. */

var screeningSchedule = [
    { movie: "1", cinema: "citystars", times: ["3:00 PM", "6:00 PM", "9:00 PM"] },
    { movie: "2", cinema: "mallofegypt", times: ["2:00 PM", "5:00 PM", "10:00 PM"] },
    { movie: "3", cinema: "cfc", times: ["4:00 PM", "7:00 PM", "11:00 PM"] },
    { movie: "4", cinema: "citystars", times: ["12:00 PM", "3:30 PM", "6:30 PM"] }
];

function getMovieScreenings(movieId) {
    var movie = findMovie(movieId);
    if (!movie || movie.status !== "Now Showing") return [];

    var screenings = screeningSchedule.filter(function(screening) {
        return screening.movie === movie.id;
    });

    // Give movies added by the admin a demo schedule as soon as they are showing.
    if (screenings.length === 0) {
        screenings.push({ cinema: "citystars", times: ["3:00 PM", "6:00 PM", "9:00 PM"] });
    }
    return screenings;
}

function getScreeningTimes(movieId, cinema) {
    var screenings = getMovieScreenings(movieId);
    for (var i = 0; i < screenings.length; i++) {
        if (screenings[i].cinema === cinema) return screenings[i].times;
    }
    return [];
}

function screeningBookingLink(movieId, cinema, date, time) {
    return "booking.html?id=" + encodeURIComponent(movieId) +
        "&cinema=" + encodeURIComponent(cinema) +
        "&date=" + encodeURIComponent(date) +
        "&time=" + encodeURIComponent(time);
}
