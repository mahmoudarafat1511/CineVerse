/* Confirmed Booking Storage */

var bookingStoragePrefix = "cineverseBooking:";
var ticketPrice = 150;
var demoOccupiedPositions = [2, 10, 13, 21];

var cinemaNames = {
    citystars: "City Stars",
    mallofegypt: "Mall of Egypt",
    cfc: "Cairo Festival City"
};

function newBookingReference() {
    var reference;
    do {
        reference = "CV-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    } while (findBooking(reference));
    return reference;
}

function saveBooking(booking) {
    localStorage.setItem(bookingStoragePrefix + booking.reference, JSON.stringify(booking));
}

function findBooking(reference) {
    return JSON.parse(localStorage.getItem(bookingStoragePrefix + reference));
}

function getBookings() {
    var bookings = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(bookingStoragePrefix)) {
            var booking = findBooking(key.slice(bookingStoragePrefix.length));
            if (booking) bookings.push(booking);
        }
    }

    return bookings.sort(function(first, second) {
        return second.createdAt - first.createdAt;
    });
}

function getCustomerBookings(email) {
    if (!email) return [];
    return getBookings().filter(function(booking) { return booking.customerEmail === email; });
}

function isBookingCancelled(booking) {
    return booking.status === "cancelled";
}

function bookingMatchesMovie(booking, movie) {
    return booking.movieId ? booking.movieId === movie.id :
        booking.movie === movie.title || (movie.previousTitles || []).includes(booking.movie);
}

function updateBookingStorage(action) {
    return navigator.locks ? navigator.locks.request("cineverse-bookings", action) : action();
}

function getTodayDate(daysAhead) {
    var today = new Date();
    if (daysAhead) today.setDate(today.getDate() + daysAhead);
    var month = String(today.getMonth() + 1).padStart(2, "0");
    var day = String(today.getDate()).padStart(2, "0");
    return today.getFullYear() + "-" + month + "-" + day;
}

function getScreeningDate(date, time) {
    var clock = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time);
    if (!clock) return new Date(NaN);

    var hour = Number(clock[1]) % 12 + (clock[3] === "PM" ? 12 : 0);
    return new Date(date + "T" + String(hour).padStart(2, "0") + ":" + clock[2]);
}

function formatBookingDate(booking) {
    var screening = getScreeningDate(booking.date, booking.time);
    if (Number.isNaN(screening.getTime())) return booking.date;
    return screening.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getBookingPoster(booking) {
    var movie = getMovieCatalog().find(function(item) { return item.id === booking.movieId; });
    return getMoviePoster(booking.poster ? booking : movie);
}


/* Find Occupied Seats for a Screening */

function getDemoOccupiedSeats(movie, cinema, date, time) {
    var screeningTime = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time);
    if (!screeningTime) return [];

    var hour = Number(screeningTime[1]) % 12 + (screeningTime[3] === "PM" ? 12 : 0);
    var timeSlot = hour * 2 + Math.floor(Number(screeningTime[2]) / 30);
    var day = Date.parse(date) / 86400000;
    var cinemaIndex = Object.keys(cinemaNames).indexOf(cinema);
    var movieNumber = Array.from(movie.id).reduce(function(total, character) {
        return total + character.charCodeAt(0);
    }, 0);
    var offset = movieNumber + cinemaIndex * 5 + day + timeSlot;

    return demoOccupiedPositions.map(function(position) {
        var seat = (position + offset) % 24;
        return "ABCD"[Math.floor(seat / 6)] + (seat % 6 + 1);
    });
}

function getOccupiedSeats(movie, cinema, date, time) {
    if (!cinema || !date || !time) return new Set();

    var occupied = new Set(getDemoOccupiedSeats(movie, cinema, date, time));
    getBookings().forEach(function(booking) {
        var sameCinema = booking.cinemaId ? booking.cinemaId === cinema : booking.cinema === cinemaNames[cinema];
        if (!isBookingCancelled(booking) && bookingMatchesMovie(booking, movie) &&
            sameCinema && booking.date === date && booking.time === time) {
            booking.seats.split(",").forEach(function(seat) {
                occupied.add(seat.trim());
            });
        }
    });

    return occupied;
}
